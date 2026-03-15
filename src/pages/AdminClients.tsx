import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Phone, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminClients() {
    const [clients, setClients] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tickets')
            .select('client_name, client_phone, client_id_number, price_paid, status');

        if (error) {
            console.error('Error loading clients:', error);
        } else if (data) {
            // Group and aggregate
            const clientMap: Record<string, any> = {};
            data.forEach(t => {
                const key = `${t.client_phone}-${t.client_name}`;
                if (!clientMap[key]) {
                    clientMap[key] = {
                        name: t.client_name || 'Sin Nombre',
                        phone: t.client_phone || '-',
                        id_number: t.client_id_number || '-',
                        totalTickets: 0,
                        totalPaid: 0,
                        pendingTickets: 0
                    };
                }
                clientMap[key].totalTickets += 1;
                if (t.status === 'paid') {
                    clientMap[key].totalPaid += (t.price_paid || 0);
                } else if (t.status === 'reserved') {
                    clientMap[key].pendingTickets += 1;
                }
            });
            setClients(Object.values(clientMap).sort((a, b) => b.totalPaid - a.totalPaid));
        }
        setLoading(false);
    };

    const filteredClients = clients.filter(c => {
        const s = search.toLowerCase();
        return c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.id_number.includes(s);
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Users size={32} color="#2563eb" /> Clientes
                </h1>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Buscar cliente o teléfono..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={inputStyle}
                    />
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Cargando clientes...</div>
                ) : filteredClients.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                        <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>No se encontraron clientes.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Cliente</th>
                                <th style={{ padding: '1rem' }}>ID Documento</th>
                                <th style={{ padding: '1rem' }}>Tickets Totales</th>
                                <th style={{ padding: '1rem' }}>Inversión Total</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 'bold', color: '#334155' }}>{client.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Phone size={12} /> {client.phone}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#64748b' }}>
                                        {client.id_number}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{client.totalTickets}</span>
                                            {client.pendingTickets > 0 && (
                                                <span style={{ fontSize: '0.75rem', background: '#fffbeb', color: '#d97706', padding: '0.1rem 0.5rem', borderRadius: '99px', fontWeight: 'bold' }}>
                                                    {client.pendingTickets} pendientes
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#059669' }}>
                                        ${client.totalPaid.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <a
                                                href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ background: '#dcfce7', color: '#166534', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                            >
                                                <Phone size={14} /> WhatsApp
                                            </a>
                                            <Link
                                                to={`/mis-tickets?q=${encodeURIComponent(client.phone)}`}
                                                style={{ background: '#f1f5f9', color: '#475569', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                            >
                                                <Ticket size={14} /> Ver Tickets
                                            </Link>
                                        </div>
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

const inputStyle = {
    padding: '0.6rem 0.6rem 0.6rem 2.8rem',
    borderRadius: '99px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box' as const
};
