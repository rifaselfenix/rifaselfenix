import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import confetti from 'canvas-confetti';
import { Ticket as TicketIcon, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function Checkout() {
    const { id } = useParams();
    const [raffle, setRaffle] = useState<any>(null);
    const [soldTickets, setSoldTickets] = useState<number[]>([]);
    const [ticketStatuses, setTicketStatuses] = useState<Record<number, 'reserved' | 'paid'>>({});

    // Multi-ticket State
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [rafflePrices, setRafflePrices] = useState<any[]>([]);

    const [buying, setBuying] = useState(false);
    const [previewNumber, setPreviewNumber] = useState<number | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [currencies, setCurrencies] = useState<any[]>([]);

    // --- User Form States ---
    const [userDetails, setUserDetails] = useState({ name: '', phone: '', email: '', idNumber: '' });
    const [showUserForm, setShowUserForm] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    // --- Grid States ---
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 100;
    const totalNumbers = 10000;
    const [searchTerm, setSearchTerm] = useState('');

    // --- Machine States (Single) ---
    const [spinning, setSpinning] = useState(false);
    const [slots, setSlots] = useState([0, 0, 0, 0]);

    // --- Advanced Roulette State ---
    const [showRouletteModal, setShowRouletteModal] = useState(false);
    const [rouletteCount, setRouletteCount] = useState(5);
    const [rouletteResults, setRouletteResults] = useState<number[]>([]);
    const [rouletteSpinning, setRouletteSpinning] = useState(false);

    useEffect(() => {
        if (!id) return;

        // 1. Fetch Raffle
        supabase.from('raffles').select('*').eq('id', id).single()
            .then(({ data }) => setRaffle(data));

        // 2. Fetch Initial Tickets
        const fetchTickets = () => {
            supabase.from('tickets').select('ticket_number, status').eq('raffle_id', id)
                .then(({ data }) => {
                    if (data) {
                        const statusMap: Record<number, 'reserved' | 'paid'> = {};
                        data.forEach((t: any) => {
                            statusMap[t.ticket_number] = t.status || 'paid';
                        });
                        setTicketStatuses(statusMap);
                        setSoldTickets(data.map(t => t.ticket_number));
                    }
                });
        };
        fetchTickets();

        // 3. Fetch Payment Methods
        supabase.from('payment_methods').select('*').eq('raffle_id', id)
            .then(({ data }) => setPaymentMethods(data || []));

        // 4. Fetch Currencies & Prices
        supabase.from('currencies').select('*').eq('is_active', true)
            .then(({ data }) => {
                if (data) setCurrencies(data);
            });

        supabase.from('raffle_prices').select('*').eq('raffle_id', id)
            .then(({ data }) => setRafflePrices(data || []));

        // 5. Setup Realtime Subscription
        const channel = supabase
            .channel(`tickets-raffle-${id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tickets', filter: `raffle_id=eq.${id}` },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newTicket = payload.new as any;
                        setTicketStatuses(prev => ({
                            ...prev,
                            [newTicket.ticket_number]: newTicket.status
                        }));
                        if (payload.eventType === 'INSERT') {
                            setSoldTickets(prev => [...prev, newTicket.ticket_number]);
                        }
                    } else if (payload.eventType === 'DELETE') {
                        // For safe deletion handling, we refetch as 'old' might not contain ticket_number
                        fetchTickets();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const formatPrice = (usdAmount: number) => {
        // If raffle is loaded, check for manual prices
        if (raffle && rafflePrices.length > 0) {
            const count = usdAmount / raffle.price; // Reverse engineer count from total usdAmount
            const primary = rafflePrices.find(p => p.is_primary);
            const others = rafflePrices.filter(p => !p.is_primary);

            const parts = [];
            if (primary) parts.push(`${primary.currency_code} ${(primary.price * count).toLocaleString()}`);
            others.forEach(p => parts.push(`${p.currency_code} ${(p.price * count).toLocaleString()}`));

            return parts.join(' / ');
        }

        if (!currencies.length) return usdAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

        return currencies.map(c => {
            const val = usdAmount * c.rate;
            return new Intl.NumberFormat('es-VE', { style: 'currency', currency: c.code, maximumFractionDigits: 2 }).format(val);
        }).join(' / ');
    };

    // --- Single Spin Logic ---
    const spinMachine = () => {
        if (spinning) return;
        setSpinning(true);
        setPreviewNumber(null);

        const duration = 1500;
        const interval = setInterval(() => {
            setSlots([
                Math.floor(Math.random() * 10),
                Math.floor(Math.random() * 10),
                Math.floor(Math.random() * 10),
                Math.floor(Math.random() * 10)
            ]);
        }, 50);

        setTimeout(() => {
            clearInterval(interval);
            let luckyNumber;
            let attempts = 0;
            do {
                luckyNumber = Math.floor(Math.random() * 10000);
                attempts++;
            } while ((ticketStatuses[luckyNumber] || selectedNumbers.includes(luckyNumber)) && attempts < 1000);

            if (attempts >= 1000) {
                alert('¡Quedan pocos números disponibles!');
                setSpinning(false);
                return;
            }

            const digits = luckyNumber.toString().padStart(4, '0').split('').map(Number);
            setSlots(digits);
            setPreviewNumber(luckyNumber);
            setSpinning(false);
            confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 }, colors: ['#fda4af', '#fcd34d', '#67e8f9'] });
        }, duration);
    };

    const addPreviewToCart = () => {
        if (previewNumber === null) return;
        if (raffle?.allow_multi_ticket) {
            setSelectedNumbers(prev => [...prev, previewNumber]);
        } else {
            setSelectedNumbers([previewNumber]);
        }
        setPreviewNumber(null);
        confetti({ particleCount: 50, spread: 40, origin: { y: 0.7 } });
    };

    // --- Advanced Roulette Logic ---
    const getUniqueRandomAvailable = (exclude: number[], count: number) => {
        const found: number[] = [];
        let attempts = 0;

        while (found.length < count && attempts < 5000) {
            const num = Math.floor(Math.random() * 10000);
            if (!ticketStatuses[num] && !selectedNumbers.includes(num) && !exclude.includes(num) && !found.includes(num)) {
                found.push(num);
            }
            attempts++;
        }
        return found;
    };

    const spinRoulette = async () => {
        if (rouletteSpinning) return;
        setRouletteSpinning(true);
        setRouletteResults([]); // Clear previous

        // Animation effect
        let iterations = 0;
        const interval = setInterval(() => {
            setRouletteResults(Array.from({ length: rouletteCount }, () => Math.floor(Math.random() * 10000)));
            iterations++;
            if (iterations > 12) clearInterval(interval);
        }, 80);

        setTimeout(() => {
            clearInterval(interval);
            const newNumbers = getUniqueRandomAvailable([], rouletteCount);
            setRouletteResults(newNumbers);
            setRouletteSpinning(false);
            if (newNumbers.length < rouletteCount) alert('No hay suficientes tickets disponibles.');
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        }, 1200);
    };

    const reSpinSingle = (index: number) => {
        const current = [...rouletteResults];
        const exclude = [...current]; // Exclude existing results to avoid dupes in this batch
        exclude.splice(index, 1); // Remove the one we are replacing from exclusions

        const [newNum] = getUniqueRandomAvailable(exclude, 1);
        if (newNum !== undefined) {
            current[index] = newNum;
            setRouletteResults(current);
        } else {
            alert('No hay más tickets disponibles');
        }
    };

    const confirmRouletteSelection = () => {
        if (raffle?.allow_multi_ticket) {
            setSelectedNumbers(prev => {
                const newSet = new Set([...prev, ...rouletteResults]);
                return Array.from(newSet);
            });
        } else {
            // Should not happen as button hidden if multi-ticket invalid, but safety:
            setSelectedNumbers([rouletteResults[0]]);
        }
        setShowRouletteModal(false);
        setRouletteResults([]);
    };

    // --- Grid Logic ---
    const toggleNumber = (num: number) => {
        if (ticketStatuses[num]) return; // Block valid tickets

        if (raffle?.allow_multi_ticket) {
            if (selectedNumbers.includes(num)) {
                setSelectedNumbers(selectedNumbers.filter(n => n !== num));
            } else {
                setSelectedNumbers([...selectedNumbers, num]);
            }
        } else {
            setSelectedNumbers([num]);
        }
    };

    const removeNumber = (numToRemove: number) => {
        setSelectedNumbers(selectedNumbers.filter(n => n !== numToRemove));
    };

    const handleSearch = (val: string) => {
        setSearchTerm(val);
        const num = parseInt(val);
        if (!isNaN(num) && num >= 0 && num < totalNumbers) {
            setCurrentPage(Math.floor(num / pageSize));
        }
    };

    const handleBuyClick = () => {
        if (!raffle || selectedNumbers.length === 0) return;
        setShowUserForm(true);
        setSelectedPayment(null);
    };

    const confirmPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userDetails.name || !userDetails.phone || !userDetails.email) return alert('Por favor llena tus datos');

        setBuying(true);
        try {
            let receiptUrl = '';

            if (receiptFile) {
                const fileExt = receiptFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                let bucketName = 'images';
                let { error: uploadError } = await supabase.storage.from(bucketName).upload(`receipts/${fileName}`, receiptFile);

                if (uploadError) {
                    bucketName = 'public';
                    const { error: publicError } = await supabase.storage.from(bucketName).upload(`receipts/${fileName}`, receiptFile);
                    if (publicError) throw publicError;
                }

                const { data } = supabase.storage.from(bucketName).getPublicUrl(`receipts/${fileName}`);
                receiptUrl = data.publicUrl;
            }

            // Insert Tickets with Email
            const ticketsToInsert = selectedNumbers.map(num => ({
                raffle_id: raffle.id,
                ticket_number: num,
                price_paid: raffle.price,
                client_id_number: userDetails.idNumber,
                client_email: userDetails.email,
                payment_method: selectedPayment?.bank_name || 'Manual',
                payment_receipt_url: receiptUrl,
                status: 'reserved'
            }));

            const { error } = await supabase.from('tickets').insert(ticketsToInsert);
            if (error) throw error;

            // Generate, Upload PDF and Notify
            const ticketLinks: string[] = [];
            const { generateTicketPDF, downloadPDF } = await import('./lib/pdfGenerator');
            const { sendTicketEmail } = await import('./lib/notifications');

            for (const num of selectedNumbers) {
                const pdfBytes = await generateTicketPDF({
                    ticketNumber: num,
                    raffleTitle: raffle.title,
                    price: raffle.price,
                    date: new Date().toLocaleDateString(),
                    status: 'reserved'
                });

                // Download locally
                downloadPDF(pdfBytes, `Ticket-${num}.pdf`);

                // Upload to Supabase Storage
                try {
                    const fileName = `Ticket-${num}-${Date.now()}.pdf`;
                    const { error: uploadErr } = await supabase.storage
                        .from('public')
                        .upload(`tickets_auto/${fileName}`, pdfBytes, { contentType: 'application/pdf', upsert: true });

                    if (!uploadErr) {
                        const { data: pubUrl } = supabase.storage.from('public').getPublicUrl(`tickets_auto/${fileName}`);
                        ticketLinks.push(pubUrl.publicUrl);
                    }
                } catch (err) {
                    console.error("Error uploading PDF", err);
                }
            }

            // Send Email NOTIFICATION
            if (ticketLinks.length > 0) {
                await sendTicketEmail(userDetails.email, userDetails.name, ticketLinks);
            }

            alert(`¡Solicitud enviada ${userDetails.name}! Tus tickets están en verificación. Se marcarán como VENDIDOS una vez confirmemos el pago.`);

            const newStatuses = { ...ticketStatuses };
            selectedNumbers.forEach(n => newStatuses[n] = 'reserved');
            setTicketStatuses(newStatuses);
            setSoldTickets([...soldTickets, ...selectedNumbers]);

            setSelectedNumbers([]);
            setShowUserForm(false);
            setReceiptFile(null);
            setSlots([0, 0, 0, 0]);
            setUserDetails({ name: '', phone: '', email: '', idNumber: '' });
            setSelectedPayment(null);

        } catch (error: any) {
            console.error(error);
            if (error.code === '23505') {
                alert('¡Ups! Uno de los números seleccionados ya fue comprado. Por favor intentalo de nuevo.');
            } else {
                alert('Error al reservar: ' + error.message);
            }
        } finally {
            setBuying(false);
        }
    };

    const visibleNumbers = useMemo(() => {
        const start = currentPage * pageSize;
        return Array.from({ length: pageSize }, (_, i) => start + i);
    }, [currentPage]);

    if (!raffle) return <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>Cargando...</div>;

    const isVideo = (url: string) => url?.match(/\.(mp4|webm|ogg)|video/i);

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Volver</Link>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem', width: '100%' }}>
                    {raffle.image_url && (
                        <div style={{ borderRadius: '1rem', overflow: 'hidden', maxWidth: '200px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            {isVideo(raffle.image_url) ? (
                                <video src={raffle.image_url} autoPlay muted loop playsInline style={{ width: '100%', display: 'block' }} />
                            ) : (
                                <img src={raffle.image_url} alt={raffle.title} style={{ width: '100%', display: 'block' }} />
                            )}
                        </div>
                    )}
                    <div style={{ width: '100%', textAlign: 'center' }}>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{raffle.title}</h1>
                        <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{raffle.description}</p>

                        {/* Progress Bar */}
                        <div style={{ maxWidth: '600px', margin: '0 auto', background: '#f1f5f9', borderRadius: '999px', height: '24px', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{
                                width: `${Math.min(100, (soldTickets.length / (raffle.total_tickets || 10000)) * 100)}%`,
                                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                height: '100%',
                                borderRadius: '999px',
                                transition: 'width 1s ease-out'
                            }}></div>
                            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', textShadow: '0 0 2px rgba(255,255,255,0.8)' }}>
                                {soldTickets.length} / {raffle.total_tickets || 10000} Tickets Vendidos
                            </span>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '2rem', minHeight: '300px', marginTop: '2rem' }}>
                    <div>
                        {/* Controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button className="btn" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} style={{ padding: '0.5rem', borderRadius: '0.5rem' }}><ChevronLeft /></button>
                                <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'center', color: '#64748b' }}>
                                    {currentPage * pageSize} - {((currentPage + 1) * pageSize) - 1}
                                </span>
                                <button className="btn" onClick={() => setCurrentPage(p => Math.min(99, p + 1))} disabled={currentPage === 99} style={{ padding: '0.5rem', borderRadius: '0.5rem' }}><ChevronRight /></button>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                    onClick={spinMachine}
                                    disabled={spinning}
                                    className="btn"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                        color: 'white',
                                        padding: '0.6rem 1.2rem',
                                        display: 'flex',
                                        gap: '0.5rem',
                                        alignItems: 'center',
                                        boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>{spinning ? '🎲' : '🎰'}</span>
                                    {spinning ? 'Girando...' : (previewNumber !== null ? 'Girar de Nuevo' : 'Azar')}
                                </button>

                                {raffle?.allow_multi_ticket && (
                                    <button
                                        onClick={() => setShowRouletteModal(true)}
                                        className="btn"
                                        style={{
                                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                            color: 'white',
                                            padding: '0.6rem 1.2rem',
                                            display: 'flex',
                                            gap: '0.5rem',
                                            alignItems: 'center',
                                            boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.4)'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.2rem' }}>⚡</span>
                                        Ráfaga
                                    </button>
                                )}

                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '120px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Machine Preview (Single) */}
                        {(spinning || previewNumber !== null) && (
                            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#eff6ff', borderRadius: '1rem', border: '2px dashed #93c5fd', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.3s' }}>
                                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                    {slots.map((num, i) => (
                                        <div key={i} style={{ width: '50px', height: '70px', background: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}>
                                            {num}
                                        </div>
                                    ))}
                                </div>

                                {!spinning && previewNumber !== null && (
                                    <div style={{ display: 'flex', gap: '1rem', animation: 'scaleIn 0.2s' }}>
                                        <button
                                            onClick={addPreviewToCart}
                                            className="btn"
                                            style={{ background: '#10b981', color: 'white', fontSize: '1.1rem', padding: '0.8rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                                        >
                                            <TicketIcon size={20} /> AGREGAR #{previewNumber.toString().padStart(4, '0')}
                                        </button>
                                        <button
                                            onClick={spinMachine}
                                            className="btn"
                                            style={{ background: '#fff', color: '#6366f1', border: '1px solid #6366f1', padding: '0.8rem 1.5rem' }}
                                        >
                                            Intentar otro
                                        </button>
                                    </div>
                                )}
                                {spinning && <p style={{ color: '#6366f1', fontWeight: 'bold' }}>Buscando tu número de la suerte...</p>}
                            </div>
                        )}

                        {/* Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '0.5rem' }}>
                            {visibleNumbers.map(num => {
                                const status = ticketStatuses[num];
                                const isSelected = selectedNumbers.includes(num);

                                let bg = '#fff';
                                let borderColor = '#e2e8f0';
                                let color = '#334155';
                                let cursor = 'pointer';

                                if (status === 'paid') {
                                    bg = '#10b981'; // Green
                                    color = 'white';
                                    borderColor = '#059669';
                                    cursor = 'not-allowed';
                                } else if (status === 'reserved') {
                                    bg = '#94a3b8'; // Gray
                                    color = 'white';
                                    borderColor = '#64748b';
                                    cursor = 'not-allowed';
                                } else if (isSelected) {
                                    bg = '#fff1f2';
                                    color = '#be123c';
                                    borderColor = '#fb7185';
                                }

                                return (
                                    <button
                                        key={num}
                                        disabled={!!status}
                                        onClick={() => toggleNumber(num)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '0.5rem',
                                            border: `1px solid ${borderColor}`,
                                            background: bg,
                                            color: color,
                                            cursor: cursor,
                                            fontWeight: isSelected || status ? 'bold' : 'normal',
                                            transition: 'all 0.1s',
                                            transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                        }}
                                    >
                                        {num.toString().padStart(4, '0')}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: 12, height: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '2px' }}></div> Disponible</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: 12, height: 12, background: '#94a3b8', borderRadius: '2px' }}></div> Apartado</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: 12, height: 12, background: '#10b981', borderRadius: '2px' }}></div> Vendido</div>
                        </div>

                        {/* Cart */}
                        {selectedNumbers.length > 0 && (
                            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.2s', background: '#fff1f2', padding: '1rem', borderRadius: '1rem', border: '1px solid #fecdd3' }}>
                                <p style={{ margin: '0 0 1rem 0', color: '#be123c', textAlign: 'center' }}>
                                    Has seleccionado <strong>{selectedNumbers.length}</strong> ticket{selectedNumbers.length > 1 ? 's' : ''}.
                                    <br />
                                    Total: <strong style={{ fontSize: '1.4rem' }}>{formatPrice(selectedNumbers.length * raffle.price)}</strong>
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
                                    {selectedNumbers.map(n => (
                                        <div key={n} style={{ background: 'white', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #fda4af', fontSize: '1rem', color: '#be123c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {n.toString().padStart(4, '0')}
                                            <button
                                                onClick={() => removeNumber(n)}
                                                style={{ border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                title="Eliminar ticket"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleBuyClick} className="btn" style={{ background: '#10b981', ...buyBtnBase, width: '100%', justifyContent: 'center' }}>
                                    <TicketIcon size={24} />
                                    Confirmar Compra
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Advanced Roulette Modal */}
                    {showRouletteModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110,
                            backdropFilter: 'blur(5px)'
                        }}>
                            <div style={{ background: '#1e293b', padding: '2rem 3rem', borderRadius: '1.5rem', width: '90%', maxWidth: '600px', boxShadow: '0 25px 30px -5px rgba(0, 0, 0, 0.3)', border: '1px solid #475569', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '95vh', overflowY: 'auto' }}>
                                <h2 style={{ fontSize: '2rem', margin: '0 0 1rem 0', background: '-webkit-linear-gradient(45deg, #f59e0b, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚡ Ráfaga de Suerte</h2>
                                <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>Selecciona cuántos tickets quieres y deja que el azar decida.</p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                    <button className="btn" onClick={() => setRouletteCount(Math.max(1, rouletteCount - 1))} style={{ background: '#334155', padding: '0.5rem 1rem' }}>-</button>
                                    <span style={{ fontSize: '2rem', fontWeight: 'bold', minWidth: '50px', textAlign: 'center' }}>{rouletteCount}</span>
                                    <button className="btn" onClick={() => setRouletteCount(Math.min(10, rouletteCount + 1))} style={{ background: '#334155', padding: '0.5rem 1rem' }}>+</button>
                                </div>

                                {rouletteResults.length === 0 ? (
                                    <button
                                        onClick={spinRoulette}
                                        disabled={rouletteSpinning}
                                        className="btn"
                                        style={{ fontSize: '1.5rem', padding: '1rem 3rem', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)' }}
                                    >
                                        {rouletteSpinning ? 'Girando...' : 'GIRAR AHORA'}
                                    </button>
                                ) : (
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                            {rouletteResults.map((num, i) => (
                                                <div key={i} style={{ background: '#334155', borderRadius: '0.8rem', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #475569' }}>
                                                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{num.toString().padStart(4, '0')}</span>
                                                    <button onClick={() => reSpinSingle(i)} style={{ background: 'transparent', border: '1px solid #94a3b8', color: '#94a3b8', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                                                        ↻ Cambio
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                            <button onClick={() => setRouletteResults([])} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.8rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                                            <button onClick={confirmRouletteSelection} style={{ background: '#10b981', color: 'white', padding: '0.8rem 2rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
                                                ✅ ¡Me los llevo!
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <button onClick={() => setShowRouletteModal(false)} style={{ marginTop: '2rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}>Cerrar</button>
                            </div>
                        </div>
                    )}

                    {/* Modal User Form */}
                    {showUserForm && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                            backdropFilter: 'blur(5px)'
                        }}>
                            <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                                <h2 style={{ marginTop: 0, color: '#1e293b' }}>🚀 Finaliza tu compra</h2>
                                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                                    Total a pagar: <strong>{formatPrice(selectedNumbers.length * raffle.price)}</strong>
                                </p>

                                {/* Step 1: Payment Method Selection */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: '#334155' }}>1. Selecciona Método de Pago:</h4>

                                    {!selectedPayment ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                                            {paymentMethods.map(pm => (
                                                <button
                                                    key={pm.id}
                                                    onClick={() => setSelectedPayment(pm)}
                                                    style={{
                                                        border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: 'white', padding: '1rem',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                                                        transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                    }}
                                                    className="payment-method-btn"
                                                >
                                                    {pm.image_url ? (
                                                        <img src={pm.image_url} alt={pm.bank_name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                                    ) : (
                                                        <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏦</div>
                                                    )}
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', textAlign: 'center' }}>{pm.bank_name}</span>
                                                </button>
                                            ))}
                                            {paymentMethods.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No hay métodos de pago configurados.</p>}
                                        </div>
                                    ) : (
                                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.8rem', border: '1px solid #e2e8f0', animation: 'fadeIn 0.3s' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    {selectedPayment.image_url && <img src={selectedPayment.image_url} alt={selectedPayment.bank_name} style={{ width: '50px', height: '50px', objectFit: 'contain', background: 'white', borderRadius: '0.4rem', border: '1px solid #e2e8f0' }} />}
                                                    <div>
                                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{selectedPayment.bank_name}</h3>
                                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{selectedPayment.account_type}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setSelectedPayment(null)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>Cambiar</button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '1rem', color: '#334155' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                                                    <span style={{ color: '#64748b' }}>Cuenta:</span>
                                                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedPayment.account_number}</span>
                                                </div>
                                                {selectedPayment.account_owner && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                                                        <span style={{ color: '#64748b' }}>Titular:</span>
                                                        <span style={{ fontWeight: '500' }}>{selectedPayment.account_owner}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <p style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '1rem', textAlign: 'center', background: '#fef2f2', padding: '0.5rem', borderRadius: '0.4rem' }}>
                                                ⚠️ Realiza el pago exacto y guarda la captura.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <h4 style={{ margin: '0 0 1rem 0', color: '#334155' }}>2. Ingresa tus Datos y Comprobante:</h4>
                                <form onSubmit={confirmPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <input
                                        required placeholder="Nombre Completo"
                                        value={userDetails.name}
                                        onChange={e => setUserDetails({ ...userDetails, name: e.target.value })}
                                        style={inputStyle}
                                    />
                                    <input
                                        required type="email" placeholder="Correo Electrónico (para recibir tus tickets)"
                                        value={userDetails.email}
                                        onChange={e => setUserDetails({ ...userDetails, email: e.target.value })}
                                        style={inputStyle}
                                    />
                                    <input
                                        required placeholder="WhatsApp / Teléfono"
                                        value={userDetails.phone}
                                        onChange={e => setUserDetails({ ...userDetails, phone: e.target.value })}
                                        style={inputStyle}
                                    />
                                    <input
                                        placeholder="Cédula / DNI (Opcional)"
                                        value={userDetails.idNumber}
                                        onChange={e => setUserDetails({ ...userDetails, idNumber: e.target.value })}
                                        style={inputStyle}
                                    />

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#334155', marginBottom: '0.3rem' }}>📸 Comprobante de Pago:</label>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={e => setReceiptFile(e.target.files ? e.target.files[0] : null)}
                                            style={{ ...inputStyle, padding: '0.4rem' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <button type="button" onClick={() => setShowUserForm(false)} style={{ ...btnStyle, background: '#e2e8f0', color: '#475569' }}>Cancelar</button>
                                        <button type="submit" disabled={buying} style={{ ...btnStyle, background: '#10b981', color: 'white', flex: 1 }}>
                                            {buying ? 'Procesando...' : 'ENVIAR COMPROBANTE'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const inputStyle = { padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' as const };
const btnStyle = { border: 'none', padding: '0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' };
const buyBtnBase = { fontSize: '1.2rem', padding: '1rem 3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' };
