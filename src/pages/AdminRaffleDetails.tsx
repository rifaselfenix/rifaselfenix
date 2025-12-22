import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Phone, User, Calendar, Ticket, Edit2, Save, X, Camera } from 'lucide-react';

export default function AdminRaffleDetails() {
    const { id } = useParams();
    const [raffle, setRaffle] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);

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
        const newValue = !config.allow_multi_ticket;
        setConfig({ ...config, allow_multi_ticket: newValue });
        await supabase.from('raffles').update({ allow_multi_ticket: newValue }).eq('id', id);
    };

    const handleMethodImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploadingImage(true);
        const file = e.target.files[0];
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `bank-${Date.now()}.${fileExt}`;
            const filePath = `payment-methods/${fileName}`;

            // Try 'images' bucket, fallback to 'public' if needed, but 'public' is usually safer for this app structure
            let bucketName = 'public';
            const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            setNewMethod(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error: any) {
            alert('Error subiendo logo: ' + error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const addPaymentMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data } = await supabase.from('payment_methods').insert([{
            raffle_id: id,
            ...newMethod
        }]).select();

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
            const { error: uploadError } = await supabase.storage.from('public').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('public').getPublicUrl(filePath);
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
        const { error } = await supabase.from('raffles').update({
            title: editForm.title,
            description: editForm.description,
            price: parseFloat(editForm.price as any),
            image_url: editForm.image_url
        }).eq('id', id);

        if (error) {
            alert('Error actualizando: ' + error.message);
        } else {
            setRaffle({ ...raffle, ...editForm });
            setIsEditing(false);
        }
        setUpdating(false);
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
                <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                        <div style={{ flex: 1 }}>
                            {!isEditing ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                        <h1 style={{ marginTop: 0, color: '#1e293b', marginBottom: 0 }}>{raffle.title}</h1>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            style={{
                                                background: '#eff6ff',
                                                border: '1px solid #bfdbfe',
                                                cursor: 'pointer',
                                                color: '#2563eb',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontWeight: '600',
                                                fontSize: '0.9rem'
                                            }}
                                            title="Editar Rifa"
                                        >
                                            <Edit2 size={16} /> Editar Rifa
                                        </button>
                                    </div>
                                    <p style={{ color: '#64748b', margin: '0 0 1rem 0' }}>{raffle.description}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>
                                            ${raffle.price} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#64748b' }}>/ ticket</span>
                                        </span>
                                    </div>
                                    {raffle.image_url && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <img src={raffle.image_url} alt="Premio" style={{ height: '80px', borderRadius: '0.5rem', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.2s' }}>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        placeholder="Título de la Rifa"
                                        style={{ ...inputStyle, fontSize: '1.2rem', fontWeight: 'bold' }}
                                    />
                                    <input
                                        type="text"
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        placeholder="Descripción Corta"
                                        style={inputStyle}
                                    />
                                    <input
                                        type="number"
                                        value={editForm.price}
                                        onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                        placeholder="Precio"
                                        style={inputStyle}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                            <button type="button" style={{ ...inputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9' }}>
                                                <Camera size={18} /> Cambiar Foto
                                            </button>
                                            <input type="file" accept="image/*" onChange={handleEditImageUpload} style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                        </div>
                                        {editForm.image_url && <img src={editForm.image_url} alt="Preview" style={{ height: '40px', borderRadius: '0.3rem' }} />}
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <button onClick={handleUpdateRaffle} disabled={updating} className="btn" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem' }}>
                                            <Save size={18} /> {updating ? 'Guardando...' : 'Guardar'}
                                        </button>
                                        <button onClick={() => setIsEditing(false)} style={{ ...blobButtonStyle, background: '#f1f5f9', color: '#64748b' }}>
                                            <X size={18} /> Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ textAlign: 'right', minWidth: '120px' }}>
                            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                                {tickets.length}
                            </span>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Tickets Vendidos</p>
                            <p style={{ margin: 0, color: '#059669', fontWeight: 600 }}>Total: ${tickets.reduce((acc, t) => acc + (t.price_paid || 0), 0)}</p>
                        </div>
                    </div>
                </div>

                {/* Configuration Card */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginTop: 0, color: '#334155' }}>⚙️ Configuración</h3>

                    {/* Multi Ticket Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                        <div>
                            <span style={{ display: 'block', fontWeight: '600', color: '#334155' }}>Venta Múltiple</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Permitir elegir varios números</span>
                        </div>
                        <button
                            onClick={toggleMultiTicket}
                            style={{
                                background: config.allow_multi_ticket ? '#10b981' : '#cbd5e1',
                                border: 'none', padding: '0.5rem 1rem', borderRadius: '1rem',
                                color: 'white', cursor: 'pointer', transition: 'background 0.2s', fontWeight: 'bold'
                            }}
                        >
                            {config.allow_multi_ticket ? 'ACTIVADO' : 'DESACTIVADO'}
                        </button>
                    </div>

                    {/* Payment Methods */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0, color: '#334155' }}>Métodos de Pago</h4>
                            <button onClick={() => setShowMethodForm(!showMethodForm)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {showMethodForm ? 'Cancelar' : '+ Agregar'}
                            </button>
                        </div>

                        {showMethodForm && (
                            <form onSubmit={addPaymentMethod} style={{ background: '#eff6ff', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <input placeholder="Banco (ej: Nequi)" value={newMethod.bank_name} onChange={e => setNewMethod({ ...newMethod, bank_name: e.target.value })} required style={inputStyle} />
                                <input placeholder="Número de Cuenta" value={newMethod.account_number} onChange={e => setNewMethod({ ...newMethod, account_number: e.target.value })} required style={inputStyle} />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input placeholder="Titular" value={newMethod.account_owner} onChange={e => setNewMethod({ ...newMethod, account_owner: e.target.value })} style={inputStyle} />
                                    <input placeholder="Tipo (Ahorros)" value={newMethod.account_type} onChange={e => setNewMethod({ ...newMethod, account_type: e.target.value })} style={inputStyle} />
                                </div>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Logo o QR (Opcional)</label>
                                    <input type="file" accept="image/*" onChange={handleMethodImageUpload} style={{ fontSize: '0.8rem' }} />
                                    {uploadingImage && <span style={{ fontSize: '0.8rem', color: '#0284c7' }}>Subiendo...</span>}
                                    {newMethod.image_url && <img src={newMethod.image_url} alt="Preview" style={{ height: '40px', marginTop: '0.5rem', borderRadius: '0.2rem', display: 'block' }} />}
                                </div>
                                <button type="submit" className="btn" style={{ background: '#2563eb', color: 'white', padding: '0.5rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}>Guardar Método</button>
                            </form>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {paymentMethods.map(m => (
                                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {m.image_url ? (
                                            <img src={m.image_url} alt={m.bank_name} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '0.2rem', background: 'white', padding: '2px', border: '1px solid #e2e8f0' }} />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏦</div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#334155' }}>{m.bank_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.account_number} {m.account_owner ? `• ${m.account_owner}` : ''}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteMethod(m.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                            ))}
                            {paymentMethods.length === 0 && !showMethodForm && <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>No has configurado cuentas bancarias.</p>}
                        </div>
                    </div>
                </div>
            </div>

            <h3 style={{ color: '#334155', marginBottom: '1rem' }}>📋 Lista de Compradores</h3>

            {/* Tickets Table */}
            {/* Tickets List - Responsive */}
            {tickets.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', color: '#64748b' }}>
                    <Ticket size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Aún no hay ventas. ¡Comparte tu rifa!</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hide-mobile" style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thStyle}># Ticket</th>
                                        <th style={thStyle}>Cliente</th>
                                        <th style={thStyle}>Contacto</th>
                                        <th style={thStyle}>Fecha</th>
                                        <th style={thStyle}>Precio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((t) => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdStyle}>
                                                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                    {t.ticket_number.toString().padStart(4, '0')}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <User size={16} color="#94a3b8" />
                                                    <span style={{ fontWeight: 500, color: '#334155' }}>{t.client_name || 'Anónimo'}</span>
                                                </div>
                                                {t.client_id_number && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '1.5rem' }}>ID: {t.client_id_number}</div>}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                                                    <Phone size={16} />
                                                    {t.client_phone || '-'}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                                                    <Calendar size={16} />
                                                    {new Date(t.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                ${t.price_paid}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {tickets.map((t) => (
                            <div key={t.id} style={{ background: 'white', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                            #{t.ticket_number.toString().padStart(4, '0')}
                                        </span>
                                        <span style={{ fontWeight: '600', color: '#334155' }}>{t.client_name || 'Anónimo'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={14} /> {t.client_phone || '-'}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} /> {new Date(t.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontWeight: 'bold', color: '#059669' }}>${t.price_paid}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

const inputStyle = { padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' as const };
const thStyle = { padding: '1rem', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const tdStyle = { padding: '1rem', fontSize: '0.95rem' };
