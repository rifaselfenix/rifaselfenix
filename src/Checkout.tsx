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
    const [mode, setMode] = useState<'machine' | 'manual'>('machine');

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
    }, [id]);

    // Lógica Slot Machine (Picks ONE random number)
    const spinMachine = () => {
        if (spinning) return;
        setSpinning(true);
        setSelectedNumbers([]); // Reset previous

        const duration = 2500;
        const interval = setInterval(() => {
            setSlots([Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)]);
        }, 50);

        setTimeout(() => {
            clearInterval(interval);
            let luckyNumber;
            do { luckyNumber = Math.floor(Math.random() * 10000); } while (soldTickets.includes(luckyNumber));

            const digits = luckyNumber.toString().padStart(4, '0').split('').map(Number);
            setSlots(digits);
            setSelectedNumbers([luckyNumber]); // Select just one
            setSpinning(false);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#fda4af', '#fcd34d', '#67e8f9'] });
        }, duration);
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

    const handleSearch = (val: string) => {
        setSearchTerm(val);
        const num = parseInt(val);
        if (!isNaN(num) && num >= 0 && num < totalNumbers) {
            setCurrentPage(Math.floor(num / pageSize));
            // Only select if not sold logic? No, just nav.
        }
    };

    const handleBuyClick = () => {
        if (!raffle || selectedNumbers.length === 0) return;
        setShowUserForm(true);
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
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('receipts') // Assuming 'receipts' bucket exists.
                    .upload(fileName, receiptFile);

                if (uploadError) {
                    // Fallback: try 'images' bucket or just skip and warn
                    console.warn("Error uploading receipt to 'receipts', trying 'public'", uploadError);
                    const { data: uploadData2, error: uploadError2 } = await supabase.storage
                        .from('public')
                        .upload(`receipts/${fileName}`, receiptFile);

                    if (!uploadError2 && uploadData2) {
                        const { data: publicUrl } = supabase.storage.from('public').getPublicUrl(`receipts/${fileName}`);
                        receiptUrl = publicUrl.publicUrl;
                    }
                } else if (uploadData) {
                    const { data: publicUrl } = supabase.storage.from('receipts').getPublicUrl(fileName);
                    receiptUrl = publicUrl.publicUrl;
                }
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

        } catch (error: any) {
            console.error(error);
            if (error.code === '23505') {
                alert('¡Ups! Uno de los números seleccionados ya fue comprado. Por favor intentalo de nuevo.');
                // Refresh sold data?
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

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Volver</Link>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{raffle.title}</h1>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>{raffle.description}</p>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '2rem 0' }}>
                    <button onClick={() => { setMode('machine'); }} className="btn" style={getTabStyle(mode === 'machine')}>
                        🎰 Máquina
                    </button>
                    <button onClick={() => { setMode('manual'); }} className="btn" style={getTabStyle(mode === 'manual')}>
                        🔢 Elegir
                    </button>
                </div>

                <div className="card" style={{ padding: '2rem', minHeight: '300px' }}>

                    {/* VISTA MÁQUINA */}
                    {mode === 'machine' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                                display: 'flex', gap: '0.8rem',
                                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                                padding: '2rem', borderRadius: '1.5rem',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), inset 0 2px 2px rgba(255,255,255,0.1)',
                                border: '4px solid #334155',
                                marginBottom: '2rem'
                            }}>
                                {slots.map((num, i) => (
                                    <div key={i} style={{
                                        ...slotStyle,
                                        width: '70px',
                                        height: '100px',
                                        background: 'linear-gradient(to bottom, #d1d5db 0%, #ffffff 20%, #ffffff 80%, #d1d5db 100%)',
                                        border: '1px solid #94a3b8',
                                        fontSize: '4rem',
                                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1), 0 2px 5px rgba(0,0,0,0.2)',
                                        transform: spinning ? 'scale(0.95)' : 'scale(1)',
                                        filter: spinning ? 'blur(2px)' : 'none',
                                        transition: 'transform 0.1s'
                                    }}>
                                        <span style={{ transform: spinning ? 'translateY(5px)' : 'none', display: 'block' }}>
                                            {num}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {selectedNumbers.length === 0 || spinning ? (
                                <button onClick={spinMachine} disabled={spinning} className="btn" style={{ fontSize: '1.2rem', padding: '1rem 3rem', opacity: spinning ? 0.7 : 1 }}>
                                    {spinning ? 'Girando...' : '🎰 TIRAR PALANCA'}
                                </button>
                            ) : (
                                <div style={{ animation: 'fadeIn 0.3s' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#be123c', marginBottom: '1rem' }}>
                                        ¡Tu número: {selectedNumbers[0]}!
                                    </p>
                                    <button onClick={handleBuyClick} className="btn" style={{ background: '#10b981', ...buyBtnBase }}>
                                        <TicketIcon size={24} />
                                        Comprar Ahora
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA GRID */}
                    {mode === 'manual' && (
                        <div>
                            {/* Controls */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button className="btn" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} style={{ padding: '0.5rem', borderRadius: '0.5rem' }}><ChevronLeft /></button>
                                    <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'center' }}>
                                        {currentPage * pageSize} - {((currentPage + 1) * pageSize) - 1}
                                    </span>
                                    <button className="btn" onClick={() => setCurrentPage(p => Math.min(99, p + 1))} disabled={currentPage === 99} style={{ padding: '0.5rem', borderRadius: '0.5rem' }}><ChevronRight /></button>
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                                    <input
                                        type="text"
                                        placeholder="Buscar (0000-9999)"
                                        value={searchTerm}
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ padding: '0.5rem 0.5rem 0.5rem 2.2rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            </div>

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
                                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.2s', background: '#fff1f2', padding: '1rem', borderRadius: '1rem' }}>
                                    <p style={{ margin: '0 0 1rem 0', color: '#be123c' }}>
                                        Has seleccionado <strong>{selectedNumbers.length}</strong> ticket{selectedNumbers.length > 1 ? 's' : ''}.
                                        <br />
                                        Total: <strong style={{ fontSize: '1.2rem' }}>${(selectedNumbers.length * raffle.price).toLocaleString()}</strong>
                                    </p>
                                    <button onClick={handleBuyClick} className="btn" style={{ background: '#10b981', ...buyBtnBase }}>
                                        <TicketIcon size={24} />
                                        Confirmar Selección
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MODAL DE DATOS */}
                    {showUserForm && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                            backdropFilter: 'blur(5px)'
                        }}>
                            <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                                <h2 style={{ marginTop: 0, color: '#1e293b' }}>🚀 Finaliza tu compra</h2>
                                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Estás adquiriendo {selectedNumbers.length} boletos por <strong>${(selectedNumbers.length * raffle.price).toLocaleString()}</strong></p>

                                {/* Payment Methods Display */}
                                {paymentMethods.length > 0 && (
                                    <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>💸 Cuentas Disponibles:</h4>
                                        {paymentMethods.map(pm => (
                                            <div key={pm.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', padding: '0.5rem 0' }}>
                                                <span><strong>{pm.bank_name}</strong> {pm.account_type && `(${pm.account_type})`}</span>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{pm.account_number}</span>
                                            </div>
                                        ))}
                                        <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.5rem', marginBottom: 0 }}>
                                            * Realiza la transferencia y sube el comprobante abajo.
                                        </p>
                                    </div>
                                )}

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

// Subcomponents & Styles
const getTabStyle = (active: boolean) => ({
    background: active ? 'linear-gradient(135deg, #fbcfe8 0%, #fda4af 100%)' : '#e2e8f0',
    color: active ? '#881337' : '#64748b',
    boxShadow: 'none',
    transform: 'none'
});

const slotStyle = {
    width: '60px',
    height: '80px',
    background: '#fdfbf7',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    fontWeight: '800',
    color: '#be123c',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1), 0 0 5px rgba(0,0,0,0.2)'
};

const inputStyle = { padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' as const };
const btnStyle = { border: 'none', padding: '0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' };
const buyBtnBase = { fontSize: '1.2rem', padding: '1rem 3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' };
