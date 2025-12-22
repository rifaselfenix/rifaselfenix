import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import confetti from 'canvas-confetti';
import { Ticket as TicketIcon, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function Checkout() {
    const { id } = useParams();
    const [raffle, setRaffle] = useState<any>(null);
    const [soldTickets, setSoldTickets] = useState<number[]>([]);

    // Multi-ticket State
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    const [buying, setBuying] = useState(false);
    const [previewNumber, setPreviewNumber] = useState<number | null>(null);
    const [conversionRate, setConversionRate] = useState<number>(0);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);

    // --- User Form States ---
    const [userDetails, setUserDetails] = useState({ name: '', phone: '', idNumber: '' });
    const [showUserForm, setShowUserForm] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    // --- Grid States ---
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 100;
    const totalNumbers = 10000;
    const [searchTerm, setSearchTerm] = useState('');

    // --- Machine States (Simplified for single pick for now) ---
    const [spinning, setSpinning] = useState(false);
    const [slots, setSlots] = useState([0, 0, 0, 0]);

    useEffect(() => {
        if (!id) return;

        // 1. Fetch Raffle & Global Settings
        supabase.from('raffles').select('*').eq('id', id).single()
            .then(({ data }) => setRaffle(data));

        supabase.from('tickets').select('ticket_number').eq('raffle_id', id)
            .then(({ data }) => {
                if (data) setSoldTickets(data.map(t => t.ticket_number));
            });

        // 2. Fetch Payment Methods
        supabase.from('payment_methods').select('*').eq('raffle_id', id)
            .then(({ data }) => setPaymentMethods(data || []));

        // 3. Fetch Conversion Rate
        supabase.from('app_settings').select('value').eq('key', 'conversion_rate_ves').single()
            .then(({ data }) => {
                if (data) setConversionRate(parseFloat(data.value) || 0);
            });
    }, [id]);

    const formatPrice = (usdAmount: number) => {
        const usd = usdAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        if (conversionRate > 0) {
            const ves = (usdAmount * conversionRate).toLocaleString('es-VE', { style: 'currency', currency: 'VES' });
            return `${usd} / ${ves}`;
        }
        return usd;
    };

    // Lógica Lucky Pick (Soporta Multi-ticket via Preview)
    const spinMachine = () => {
        if (spinning) return;
        setSpinning(true);
        setPreviewNumber(null); // Clear previous preview while spinning

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
            } while ((soldTickets.includes(luckyNumber) || selectedNumbers.includes(luckyNumber)) && attempts < 1000);

            if (attempts >= 1000) {
                alert('¡Quedan pocos números disponibles!');
                setSpinning(false);
                return;
            }

            const digits = luckyNumber.toString().padStart(4, '0').split('').map(Number);
            setSlots(digits);
            setPreviewNumber(luckyNumber);
            setSpinning(false);
            // Confetti for the Reveal
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

    const toggleNumber = (num: number) => {
        if (soldTickets.includes(num)) return;

        if (raffle?.allow_multi_ticket) {
            // Toggle
            if (selectedNumbers.includes(num)) {
                setSelectedNumbers(selectedNumbers.filter(n => n !== num));
            } else {
                setSelectedNumbers([...selectedNumbers, num]);
            }
        } else {
            // Single select behavior
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
        setSelectedPayment(null); // Reset payment selection
    };

    const confirmPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userDetails.name || !userDetails.phone) return alert('Por favor llena tus datos');

        setBuying(true);
        try {
            let receiptUrl = '';

            // 1. Upload Receipt if present
            if (receiptFile) {
                const fileExt = receiptFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                // Try 'images' bucket first (common across projects), then public
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

            // 2. Insert Tickets
            const ticketsToInsert = selectedNumbers.map(num => ({
                raffle_id: raffle.id,
                ticket_number: num,
                price_paid: raffle.price,
                client_name: userDetails.name,
                client_phone: userDetails.phone,
                client_id_number: userDetails.idNumber,
                payment_receipt_url: receiptUrl
            }));

            const { error } = await supabase.from('tickets').insert(ticketsToInsert);
            if (error) throw error;

            // 3. Generate PDFs
            const { generateTicketPDF, downloadPDF } = await import('./lib/pdfGenerator');

            // Download sequentially to avoid browser blocking
            for (const num of selectedNumbers) {
                const pdfBytes = await generateTicketPDF({
                    ticketNumber: num,
                    raffleTitle: raffle.title,
                    price: raffle.price,
                    date: new Date().toLocaleDateString()
                });
                downloadPDF(pdfBytes, `Ticket-${num}.pdf`);
            }

            alert(`¡Felicidades ${userDetails.name}! Has apartado ${selectedNumbers.length} ticket(s).`);

            // Reset
            setSoldTickets([...soldTickets, ...selectedNumbers]);
            setSelectedNumbers([]);
            setShowUserForm(false);
            setReceiptFile(null);
            setSlots([0, 0, 0, 0]);
            setUserDetails({ name: '', phone: '', idNumber: '' });
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

    // --- Grid Helpers ---
    const visibleNumbers = useMemo(() => {
        const start = currentPage * pageSize;
        return Array.from({ length: pageSize }, (_, i) => start + i);
    }, [currentPage]);


    if (!raffle) return <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>Cargando...</div>;

    // Helper to determine if media is video
    const isVideo = (url: string) => url?.match(/\.(mp4|webm|ogg)|video/i);

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Volver</Link>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>

                {/* Header with Media Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    {raffle.image_url && (
                        <div style={{ borderRadius: '1rem', overflow: 'hidden', maxWidth: '200px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            {isVideo(raffle.image_url) ? (
                                <video src={raffle.image_url} autoPlay muted loop playsInline style={{ width: '100%', display: 'block' }} />
                            ) : (
                                <img src={raffle.image_url} alt={raffle.title} style={{ width: '100%', display: 'block' }} />
                            )}
                        </div>
                    )}
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{raffle.title}</h1>
                        <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>{raffle.description}</p>
                    </div>
                </div>

                <div className="card" style={{ padding: '2rem', minHeight: '300px', marginTop: '2rem' }}>

                    {/* VISTA UNIFICADA */}
                    <div>
                        {/* Controls Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '1rem' }}>

                            {/* Pagination */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button className="btn" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} style={{ padding: '0.5rem', borderRadius: '0.5rem' }}><ChevronLeft /></button>
                                <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'center', color: '#64748b' }}>
                                    {currentPage * pageSize} - {((currentPage + 1) * pageSize) - 1}
                                </span>
                                <button className="btn" onClick={() => setCurrentPage(p => Math.min(99, p + 1))} disabled={currentPage === 99} style={{ padding: '0.5rem', borderRadius: '0.5rem' }}><ChevronRight /></button>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                {/* Random Button */}
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

                                {/* Search */}
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

                        {/* MACHINE PREVIEW AREA */}
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

                        {/* The Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '0.5rem' }}>
                            {visibleNumbers.map(num => {
                                const isSold = soldTickets.includes(num);
                                const isSelected = selectedNumbers.includes(num);
                                return (
                                    <button
                                        key={num}
                                        disabled={isSold}
                                        onClick={() => toggleNumber(num)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '0.5rem',
                                            border: isSelected ? '2px solid #fb7185' : '1px solid #e2e8f0',
                                            background: isSold ? '#cbd5e1' : isSelected ? '#fff1f2' : '#fff',
                                            color: isSold ? '#64748b' : isSelected ? '#be123c' : '#334155',
                                            cursor: isSold ? 'not-allowed' : 'pointer',
                                            fontWeight: isSelected ? 'bold' : 'normal',
                                            transition: 'all 0.1s',
                                            transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                        }}
                                    >
                                        {num.toString().padStart(4, '0')}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Bottom Action */}
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

                    {/* MODAL DE DATOS */}
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
                                                {/* Aquí se podría agregar la tasa de cambio específica si aplica */}
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

                                    {/* Receipt Upload */}
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
