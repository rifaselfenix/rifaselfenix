import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Phone, User, Calendar } from 'lucide-react';

export default function AdminRaffleDetails() {
    const { id } = useParams();
    const [raffle, setRaffle] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);

    // Config States
    const [config, setConfig] = useState({ allow_multi_ticket: false });
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Form States
    const [newMethod, setNewMethod] = useState({ bank_name: '', account_number: '', account_type: '', account_owner: '' });
    const [showMethodForm, setShowMethodForm] = useState(false);

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        // 1. Cargar Rifa
        const { data: raffleData } = await supabase.from('raffles').select('*').eq('id', id).single();
        setRaffle(raffleData);
        if (raffleData) {
            setConfig({ allow_multi_ticket: raffleData.allow_multi_ticket || false });
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

    const addPaymentMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data } = await supabase.from('payment_methods').insert([{
            raffle_id: id,
            ...newMethod
        }]).select();

        if (data) {
            setPaymentMethods([...paymentMethods, data[0]]);
            setShowMethodForm(false);
            setNewMethod({ bank_name: '', account_number: '', account_type: '', account_owner: '' });
        }
    };

    const deleteMethod = async (methodId: string) => {
        if (!confirm('¿Eliminar método?')) return;
        await supabase.from('payment_methods').delete().eq('id', methodId);
        setPaymentMethods(paymentMethods.filter(m => m.id !== methodId));
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ marginTop: 0, color: '#1e293b' }}>{raffle.title}</h1>
                            <p style={{ color: '#64748b', margin: 0 }}>{raffle.description}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
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
                                <button type="submit" className="btn" style={{ background: '#2563eb', color: 'white', padding: '0.5rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}>Guardar Método</button>
                            </form>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {paymentMethods.map(m => (
                                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#334155' }}>{m.bank_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.account_number} {m.account_owner ? `• ${m.account_owner}` : ''}</div>
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
            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
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
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                        Aún no hay ventas. ¡Comparte tu rifa!
                                    </td>
                                </tr>
                            ) : tickets.map((t) => (
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
        </div>
    );
}

const inputStyle = { padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' as const };
const thStyle = { padding: '1rem', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const tdStyle = { padding: '1rem', fontSize: '0.95rem' };
