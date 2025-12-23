import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Phone, Edit2, Save, X, Camera, CheckCircle, ExternalLink, Ticket } from 'lucide-react';

export default function AdminRaffleDetails() {
    const { id } = useParams();
    const [raffle, setRaffle] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [ticketTab, setTicketTab] = useState<'pending' | 'paid'>('pending');

    // Config States
    const [config, setConfig] = useState({ allow_multi_ticket: false });
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Form States
    const [newMethod, setNewMethod] = useState({ bank_name: '', account_number: '', account_type: '', account_owner: '', image_url: '' });
    const [showMethodForm, setShowMethodForm] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

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
    };

    const toggleMultiTicket = async () => {
        try {
            const newValue = !config.allow_multi_ticket;
            setConfig({ ...config, allow_multi_ticket: newValue });
            const { data, error } = await supabase.from('raffles').update({ allow_multi_ticket: newValue }).eq('id', id).select();
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
        const { error } = await supabase
            .from('tickets')
            .update({ status: 'paid' })
            .in('id', ticketIds);

        if (error) {
            alert('Error verificando: ' + error.message);
        } else {
            // Optimistic Update
            setTickets(tickets.map(t => ticketIds.includes(t.id) ? { ...t, status: 'paid' } : t));
            alert('✅ Orden aprobada exitosamente');

            if (group.client_phone) {
                const phone = group.client_phone.replace(/\D/g, '');
                const ticketNumbers = group.tickets.map((t: any) => t.ticket_number).join(', #');
                const message = `Hola ${group.client_name}, hemos verificado tu pago. Tus tickets *#${ticketNumbers}* para la rifa *${raffle.title}* ya están ACTIVOS. ¡Mucha suerte! 🍀`;
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
            }
        }
    };

    if (!raffle) return <div style={{ padding: '2rem' }}>Cargando...</div>;

    return (
        <div>
            {/* Header */}
            <Link to="/admin/raffles" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#64748b', marginBottom: '1rem' }}>
                <ArrowLeft size={18} /> Volver a Rifas
            </Link>

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
                                    <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Título" style={inputStyle} />
                                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Descripción" style={{ ...inputStyle, height: '80px' }} />
                                    <input value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} placeholder="Precio" type="number" style={inputStyle} />

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
                            <button type="submit" className="btn" style={{ background: '#2563eb', color: 'white', padding: '0.5rem' }}>Guardar</button>
                        </form>
                    )}
                </div>
            </div>

            {/* TABS DE GESTIÓN */}
            <h3 style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                📋 Gestión de Ventas
                <span style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '99px', color: '#64748b' }}>
                    Agrupado por Cliente
                </span>
            </h3>

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
            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
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
                                            <a
                                                href={`https://wa.me/${group.client_phone?.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <Phone size={16} /> Contactar
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

const inputStyle = { padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' as const };
