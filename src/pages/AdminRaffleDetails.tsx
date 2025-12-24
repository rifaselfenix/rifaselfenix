import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { ArrowLeft, Phone, Edit2, CheckCircle, ExternalLink, Ticket, Trophy, Play, Download, Copy } from 'lucide-react';

export default function AdminRaffleDetails() {
    const { id } = useParams();
    const [raffle, setRaffle] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [ticketTab, setTicketTab] = useState<'pending' | 'paid'>('pending');

    // Config States
    const [config, setConfig] = useState({ allow_multi_ticket: false });
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Manual Prices State
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [prices, setPrices] = useState<any[]>([]);
    const [newPrice, setNewPrice] = useState({ currency_code: 'USD', price: '' });

    // Form States
    const [newMethod, setNewMethod] = useState({ bank_name: '', account_number: '', account_type: '', account_owner: '', image_url: '' });
    const [showMethodForm, setShowMethodForm] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Winner Roulette States
    const [showWinnerModal, setShowWinnerModal] = useState(false);
    const [winner, setWinner] = useState<any>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [displayNumber, setDisplayNumber] = useState('----');

    // Edit Raffle States
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '', price: '', image_url: '' });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        // 1. Cargar Rifa
        const { data: raffleData } = await supabase.from('raffles').select('*').eq('id', id).single();
        setRaffle(raffleData);
        if (raffleData) {
            setConfig({ allow_multi_ticket: raffleData.allow_multi_ticket || false });
            setEditForm({
                title: raffleData.title,
                description: raffleData.description || '',
                price: raffleData.price,
                image_url: raffleData.image_url || ''
            });
        }

        // 2. Cargar Tickets Vendidos
        const { data: ticketsData } = await supabase
            .from('tickets')
            .select('*')
            .eq('raffle_id', id)
            .order('ticket_number', { ascending: true });
        setTickets(ticketsData || []);

        // 3. Cargar Métodos de Pago
        const { data: methods } = await supabase.from('payment_methods').select('*').eq('raffle_id', id);
        setPaymentMethods(methods || []);

        // 4. Cargar Monedas y Precios
        const { data: currData } = await supabase.from('currencies').select('*').eq('is_active', true);
        setCurrencies(currData || []);

        const { data: pricesData } = await supabase.from('raffle_prices').select('*').eq('raffle_id', id);
        setPrices(pricesData || []);
    };

    const addPrice = async () => {
        if (!newPrice.price) return;
        const { data, error } = await supabase.from('raffle_prices').insert([{
            raffle_id: id,
            currency_code: newPrice.currency_code,
            price: parseFloat(newPrice.price),
            is_primary: false
        }]).select();

        if (data) {
            setPrices([...prices, data[0]]);
            setNewPrice({ ...newPrice, price: '' });
        } else {
            alert('Error creating price: ' + error?.message);
        }
    };

    const deletePrice = async (priceId: string) => {
        if (!confirm('¿Eliminar precio?')) return;
        await supabase.from('raffle_prices').delete().eq('id', priceId);
        setPrices(prices.filter(p => p.id !== priceId));
    };

    const togglePrimaryPrice = async (priceId: string) => {
        // Set all local false, one true
        const newPrices = prices.map(p => ({ ...p, is_primary: p.id === priceId }));
        setPrices(newPrices);

        // Update DB
        // 1. Reset all
        await supabase.from('raffle_prices').update({ is_primary: false }).eq('raffle_id', id);
        // 2. Set new primary
        await supabase.from('raffle_prices').update({ is_primary: true }).eq('id', priceId);
    };

    const toggleMultiTicket = async () => {
        try {
            const newValue = !config.allow_multi_ticket;
            setConfig({ ...config, allow_multi_ticket: newValue });
            const { error } = await supabase.from('raffles').update({ allow_multi_ticket: newValue }).eq('id', id).select();
            if (error) throw error;
        } catch (error: any) {
            alert('Error: ' + error.message);
            setConfig({ ...config, allow_multi_ticket: !config.allow_multi_ticket });
        }
    };

    const handleMethodImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploadingImage(true);
        const file = e.target.files[0];
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `bank-${Date.now()}.${fileExt}`;
            const filePath = `payment-methods/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            setNewMethod(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error: any) {
            alert('Error subiendo logo: ' + error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const addPaymentMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data } = await supabase.from('payment_methods').insert([{ raffle_id: id, ...newMethod }]).select();
        if (data) {
            setPaymentMethods([...paymentMethods, data[0]]);
            setShowMethodForm(false);
            setNewMethod({ bank_name: '', account_number: '', account_type: '', account_owner: '', image_url: '' });
        }
    };

    const deleteMethod = async (methodId: string) => {
        if (!confirm('¿Eliminar método?')) return;
        await supabase.from('payment_methods').delete().eq('id', methodId);
        setPaymentMethods(paymentMethods.filter(m => m.id !== methodId));
    };

    const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUpdating(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `raffle-edit-${Date.now()}.${fileExt}`;
            const filePath = `raffle-images/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            setEditForm(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error: any) {
            alert('Error subiendo imagen: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    // Winner Logic
    const handleSpin = () => {
        const paidTickets = tickets.filter(t => t.status === 'paid');
        if (paidTickets.length === 0) return alert('No hay tickets pagados para sortear.');

        setIsSpinning(true);
        setWinner(null);

        // Animation loop
        const interval = setInterval(() => {
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            setDisplayNumber(random);
        }, 50);

        // Stop and pick winner
        setTimeout(() => {
            clearInterval(interval);
            const randomIndex = Math.floor(Math.random() * paidTickets.length);
            const luckyTicket = paidTickets[randomIndex];

            setDisplayNumber(luckyTicket.ticket_number.toString().padStart(4, '0'));
            setWinner(luckyTicket);
            setIsSpinning(false);

            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 }
            });

        }, 3000);
    };

    const handleUpdateRaffle = async () => {
        if (!editForm.title || !editForm.price) return alert('Título y Precio son obligatorios');
        setUpdating(true);
        try {
            const { error } = await supabase.from('raffles').update({
                title: editForm.title,
                description: editForm.description,
                price: parseFloat(editForm.price as any),
                image_url: editForm.image_url
            }).eq('id', id);
            if (error) throw error;
            setRaffle({ ...raffle, ...editForm });
            setIsEditing(false);
            alert("✅ Cambios guardados.");
        } catch (error: any) {
            alert('Error actualizando: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleExportCSV = () => {
        if (tickets.length === 0) return alert('No hay tickets para exportar.');

        // Define headers
        const headers = ['Ticket Number', 'Status', 'Client Name', 'Client Phone', 'Client ID', 'Client Email', 'Price Paid', 'Payment Method', 'Date'];

        // Map rows
        const rows = tickets.map(t => [
            t.ticket_number,
            t.status,
            `"${t.client_name || ''}"`,
            t.client_phone || '',
            t.client_id_number || '',
            t.client_email || '',
            t.price_paid || 0,
            t.payment_method || '',
            new Date(t.created_at).toLocaleString()
        ]);

        // Combine
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        // Create Blob and Link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_raffle_${id}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        document.body.removeChild(link);
    };

    const getMessage = (group: any) => {
        if (!raffle) return '';
        const ticketNumbers = group.tickets.map((t: any) => t.ticket_number).join(', #');
        const link = group.client_phone ? `${window.location.origin}/#/mis-tickets?q=${group.client_phone.replace('+', '%2B')}` : '';

        return `Hola ${group.client_name}, pago verificado ✅.
Tus tickets: *#${ticketNumbers}*
Para la rifa: *${raffle.title}*

Ver tickets aquí: ${link}

¡Mucha suerte! 🍀`;
    };

    const handleCopyMessage = (group: any) => {
        const msg = getMessage(group);
        navigator.clipboard.writeText(msg).then(() => {
            alert('¡Mensaje copiado al portapapeles!');
        });
    };

    // Group Tickets by Client (Name + Phone) to Handle Multi-Ticket Orders
    const groupedTickets = tickets.reduce((acc: any[], ticket) => {
        // Filter by current tab status
        if (ticketTab === 'pending' && ticket.status !== 'reserved') return acc;
        if (ticketTab === 'paid' && ticket.status !== 'paid') return acc;

        const key = `${ticket.client_phone}-${ticket.client_name}`;
        const existing = acc.find((g: any) => g.key === key);

        if (existing) {
            existing.tickets.push(ticket);
            existing.totalAmount += (ticket.price_paid || 0);
            if (!existing.payment_receipt_url && ticket.payment_receipt_url) existing.payment_receipt_url = ticket.payment_receipt_url; // Use last receipt found
        } else {
            acc.push({
                key,
                client_name: ticket.client_name,
                client_phone: ticket.client_phone,
                client_id_number: ticket.client_id_number,
                created_at: ticket.created_at,
                payment_receipt_url: ticket.payment_receipt_url,
                tickets: [ticket],
                totalAmount: ticket.price_paid || 0,
                status: ticket.status
            });
        }
        return acc;
    }, []);

    const verifyGroup = async (group: any) => {
        if (!confirm(`¿Verificar pago de ${group.client_name} por ${group.tickets.length} tickets?`)) return;

        const ticketIds = group.tickets.map((t: any) => t.id);
        const { data, error } = await supabase
            .from('tickets')
            .update({ status: 'paid' })
            .in('id', ticketIds)
            .select();

        if (error) {
            alert('Error verificando: ' + error.message);
        } else if (!data || data.length === 0) {
            alert('❌ ERROR CRÍTICO: No se guardaron los cambios. Es posible que falten permisos en la tabla "tickets". Ejecuta el script SQL "fix_tickets_permissions.sql".');
        } else {
            // Optimistic Update
            setTickets(tickets.map(t => ticketIds.includes(t.id) ? { ...t, status: 'paid' } : t));
            alert('✅ Orden aprobada exitosamente');

            if (group.client_phone) {
                const phone = group.client_phone.replace(/\D/g, '');
                const ticketNumbers = group.tickets.map((t: any) => t.ticket_number).join(', #');
                const link = `${window.location.origin}/#/mis-tickets?q=${group.client_phone.replace('+', '%2B')}`; // Encode +

                const message = `Hola ${group.client_name}, pago verificado ✅.
Tus tickets: *#${ticketNumbers}*
Para la rifa: *${raffle.title}*

Ver tickets aquí: ${link}

¡Mucha suerte! 🍀`;
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
            }
        }
    };

    if (!raffle) return <div style={{ padding: '2rem' }}>Cargando...</div>;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Link to="/admin/raffles" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#64748b' }}>
                    <ArrowLeft size={18} /> Volver a Rifas
                </Link>
                <button
                    onClick={() => setShowWinnerModal(true)}
                    style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.4)'
                    }}
                >
                    <Trophy size={18} /> Sortear Ganador
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* Main Info Card */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <div style={{ flex: 1 }}>
                            {!isEditing ? (
                                <>
                                    <h1 style={{ marginTop: 0, color: '#1e293b', marginBottom: '0.5rem' }}>{raffle.title}</h1>
                                    <p style={{ color: '#64748b', margin: '0 0 1rem 0' }}>{raffle.description}</p>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>${raffle.price} / ticket</span>
                                    {raffle.image_url && (
                                        <div style={{ marginTop: '1rem', height: '150px', borderRadius: '0.5rem', overflow: 'hidden', background: '#f8fafc' }}>
                                            {raffle.image_url.match(/\.(mp4|webm|ogg)|video/i) ? (
                                                <video src={raffle.image_url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <img src={raffle.image_url} alt="Premio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                        </div>
                                    )}
                                    <button onClick={() => setIsEditing(true)} style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                        <Edit2 size={16} /> Editar Rifa
                                    </button>
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 'bold' }}>Título de la Rifa</label>
                                        <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Ej: Gran Rifa 2024" style={inputStyle} />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 'bold' }}>Descripción</label>
                                        <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Detalles del premio..." style={{ ...inputStyle, height: '80px' }} />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 'bold' }}>Precio Base (USD)</label>
                                        <input value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} placeholder="0.00" type="number" style={inputStyle} />
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                                            <button type="button" style={{ ...inputStyle, cursor: 'pointer', background: '#f1f5f9' }}>📷 Cambiar Foto</button>
                                            <input type="file" onChange={handleEditImageUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                        </div>
                                        {editForm.image_url && <img src={editForm.image_url} style={{ width: 40, height: 40, borderRadius: '4px' }} />}
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button onClick={handleUpdateRaffle} disabled={updating} className="btn" style={{ background: '#2563eb', color: 'white' }}>{updating ? '...' : 'Guardar'}</button>
                                        <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Cancelar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '120px' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#10b981' }}>{tickets.length}</span>
                            <p style={{ margin: 0, color: '#64748b' }}>Vendidos</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold', color: '#059669' }}>Total: ${tickets.filter(t => t.status === 'paid').reduce((acc, t) => acc + (t.price_paid || 0), 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Config Card */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#334155' }}>⚙️ Config</h3>
                        <button onClick={toggleMultiTicket} style={{ background: config.allow_multi_ticket ? '#10b981' : '#cbd5e1', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '99px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {config.allow_multi_ticket ? 'Venta Múltiple ON' : 'Venta Múltiple OFF'}
                        </button>
                    </div>

                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.9rem' }}>Métodos de Pago</h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {paymentMethods.map(m => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{m.bank_name}</span>
                                <button onClick={() => deleteMethod(m.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))}
                        <button onClick={() => setShowMethodForm(!showMethodForm)} style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', border: '1px dashed #cbd5e1', borderRadius: '0.5rem', color: '#2563eb', background: 'none', cursor: 'pointer' }}>+ Nuevo Método</button>
                    </div>

                    {showMethodForm && (
                        <form onSubmit={addPaymentMethod} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input placeholder="Banco" value={newMethod.bank_name} onChange={e => setNewMethod({ ...newMethod, bank_name: e.target.value })} style={inputStyle} required />
                            <input placeholder="Nro Cuenta" value={newMethod.account_number} onChange={e => setNewMethod({ ...newMethod, account_number: e.target.value })} style={inputStyle} required />
                            <input placeholder="Titular" value={newMethod.account_owner} onChange={e => setNewMethod({ ...newMethod, account_owner: e.target.value })} style={inputStyle} />

                            <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.3rem' }}>Logo del Banco o QR</label>
                                <input type="file" accept="image/*" onChange={handleMethodImageUpload} style={{ fontSize: '0.8rem', width: '100%' }} />
                                {uploadingImage && <span style={{ fontSize: '0.8rem', color: '#2563eb' }}>Subiendo...</span>}
                                {newMethod.image_url && <img src={newMethod.image_url} alt="Vista previa" style={{ marginTop: '0.5rem', height: '40px', borderRadius: '4px' }} />}
                            </div>

                            <button type="submit" className="btn" style={{ background: '#2563eb', color: 'white', padding: '0.5rem' }}>Guardar</button>
                        </form>
                    )}

                    <hr style={{ margin: '2rem 0', border: 0, borderTop: '1px solid #e2e8f0' }} />

                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.9rem' }}>Precios por Moneda</h4>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>Define el precio exacto para cada moneda. Marca una como principal (⭐) para mostrarla grande.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {prices.map(p => {
                            const currency = currencies.find(c => c.code === p.currency_code);
                            return (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: p.is_primary ? '#f0fdf4' : '#f8fafc', borderRadius: '0.5rem', border: p.is_primary ? '1px solid #86efac' : '1px solid transparent' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button onClick={() => togglePrimaryPrice(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: p.is_primary ? 1 : 0.3, fontSize: '1.2rem' }} title="Marcar como principal">
                                            ⭐
                                        </button>
                                        <div>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block' }}>{currency?.symbol} {p.price.toLocaleString()} {p.currency_code}</span>
                                            {currency && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{currency.name}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => deletePrice(p.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                                </div>
                            );
                        })}

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <select
                                value={newPrice.currency_code}
                                onChange={e => setNewPrice({ ...newPrice, currency_code: e.target.value })}
                                style={{ ...inputStyle, padding: '0.4rem', fontSize: '0.85rem' }}
                            >
                                {currencies.map(c => <option key={c.id} value={c.code}>{c.code} - {c.name}</option>)}
                            </select>
                            <input
                                type="number"
                                placeholder="Precio"
                                value={newPrice.price}
                                onChange={e => setNewPrice({ ...newPrice, price: e.target.value })}
                                style={{ ...inputStyle, padding: '0.4rem', fontSize: '0.85rem' }}
                            />
                            <button onClick={addPrice} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0 0.8rem', cursor: 'pointer' }}>+</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS DE GESTIÓN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                <h3 style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    📋 Gestión de Ventas
                    <span style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '99px', color: '#64748b' }}>
                        Agrupado por Cliente
                    </span>
                </h3>
                <button
                    onClick={handleExportCSV}
                    style={{
                        background: 'white', border: '1px solid #cbd5e1', color: '#475569',
                        padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold'
                    }}
                >
                    <Download size={16} /> Exportar CSV
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: '0.8rem', width: 'fit-content' }}>
                <button
                    onClick={() => setTicketTab('pending')}
                    style={{
                        padding: '0.6rem 1.2rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                        background: ticketTab === 'pending' ? 'white' : 'transparent',
                        color: ticketTab === 'pending' ? '#d97706' : '#94a3b8',
                        boxShadow: ticketTab === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    🟡 Por Revisar ({tickets.filter(t => t.status === 'reserved').length})
                </button>
                <button
                    onClick={() => setTicketTab('paid')}
                    style={{
                        padding: '0.6rem 1.2rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                        background: ticketTab === 'paid' ? 'white' : 'transparent',
                        color: ticketTab === 'paid' ? '#059669' : '#94a3b8',
                        boxShadow: ticketTab === 'paid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    🟢 Aprobados / Pagados ({tickets.filter(t => t.status === 'paid').length})
                </button>
            </div>

            {/* GROUPED TABLE */}
            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', overflowX: 'auto' }}>
                {groupedTickets.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                        <Ticket size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>{ticketTab === 'pending' ? 'No hay pagos por revisar.' : 'No hay ventas confirmadas.'}</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Cliente</th>
                                <th style={{ padding: '1rem' }}>Tickets Seleccionados</th>
                                <th style={{ padding: '1rem' }}>Total a Pagar</th>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                <th style={{ padding: '1rem' }}>Comprobante</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedTickets.map((group: any) => (
                                <tr key={group.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 'bold', color: '#334155' }}>{group.client_name || 'Sin Nombre'}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Phone size={12} /> {group.client_phone || '-'}
                                        </div>
                                        {group.client_id_number && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {group.client_id_number}</div>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxWidth: '300px' }}>
                                            {group.tickets.map((t: any) => (
                                                <span key={t.id} style={{ background: '#eff6ff', color: '#2563eb', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                    #{t.ticket_number}
                                                </span>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                                            {group.tickets.length} tickets
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#059669' }}>
                                        ${group.totalAmount.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                                        {group.created_at ? new Date(group.created_at).toLocaleDateString() : '-'}
                                        <div style={{ fontSize: '0.75rem' }}>{group.created_at ? new Date(group.created_at).toLocaleTimeString() : ''}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {group.payment_receipt_url ? (
                                            <a href={group.payment_receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.9rem', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <ExternalLink size={14} /> Ver Recibo
                                            </a>
                                        ) : (
                                            <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontStyle: 'italic' }}>Pendiente</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {ticketTab === 'pending' ? (
                                            <button
                                                onClick={() => verifyGroup(group)}
                                                style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', float: 'right' }}
                                            >
                                                <CheckCircle size={16} /> Aprobar Todo
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleCopyMessage(group)}
                                                    title="Copiar Mensaje"
                                                    style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <a
                                                    href={`https://wa.me/${group.client_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(getMessage(group))}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                                >
                                                    <Phone size={16} /> Contactar
                                                </a>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {/* WINNER MODAL */}
            {
                showWinnerModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                        backdropFilter: 'blur(5px)'
                    }}>
                        <div style={{ background: '#1e293b', padding: '3rem', borderRadius: '2rem', width: '90%', maxWidth: '500px', textAlign: 'center', color: 'white', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                            <h2 style={{ fontSize: '2rem', marginBottom: '2rem', background: '-webkit-linear-gradient(45deg, #fbbf24, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                🎰 Gran Sorteo
                            </h2>

                            <div style={{
                                fontSize: '5rem', fontWeight: 'bold', fontFamily: 'monospace',
                                background: '#0f172a', padding: '1.5rem', borderRadius: '1rem',
                                marginBottom: '2rem', border: '2px solid #334155', letterSpacing: '8px',
                                color: isSpinning ? '#e2e8f0' : '#fbbf24',
                                textShadow: isSpinning ? 'none' : '0 0 20px rgba(251, 191, 36, 0.5)'
                            }}>
                                {displayNumber}
                            </div>

                            {winner && (
                                <div style={{ marginBottom: '2rem', animation: 'scaleIn 0.5s' }}>
                                    <p style={{ color: '#94a3b8', margin: 0 }}>¡Felicidades al Ticket Ganador!</p>
                                    <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: '#fff' }}>{winner.client_name}</h3>
                                    <p style={{ color: '#fbbf24' }}>{winner.client_phone}</p>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowWinnerModal(false)}
                                    style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '0.8rem 2rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                >
                                    Cerrar
                                </button>
                                {!winner && (
                                    <button
                                        onClick={handleSpin}
                                        disabled={isSpinning}
                                        style={{
                                            background: '#10b981', color: 'white', border: 'none',
                                            padding: '0.8rem 2rem', borderRadius: '0.5rem', cursor: 'pointer',
                                            fontWeight: 'bold', fontSize: '1.1rem',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            opacity: isSpinning ? 0.7 : 1
                                        }}
                                    >
                                        {isSpinning ? 'Girando...' : <><Play size={20} fill="white" /> Girar</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

const inputStyle = { padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' as const };
