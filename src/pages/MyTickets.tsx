import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, CheckCircle, Clock } from 'lucide-react';

export default function MyTickets() {
    const [searchTerm, setSearchTerm] = useState('');
    const [tickets, setTickets] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) return;
        setLoading(true);
        setTickets(null);

        // Search by phone OR email
        const { data, error } = await supabase
            .from('tickets')
            .select('*, raffles ( title, image_url )')
            .or(`client_phone.eq.${searchTerm},client_email.eq.${searchTerm.toLowerCase()}`)
            .order('created_at', { ascending: false });

        if (data) {
            setTickets(data);
        } else {
            console.error(error);
            // Fallback if join fails (e.g. FK not detected), try fetching simple
            if (error?.message?.includes('could not find')) {
                const { data: simpleData } = await supabase
                    .from('tickets')
                    .select('*')
                    .or(`client_phone.eq.${searchTerm},client_email.eq.${searchTerm.toLowerCase()}`)
                    .order('created_at', { ascending: false });
                setTickets(simpleData || []);
            }
        }
        setLoading(false);
    };

    return (
        <>
            <Navbar />
            <div className="container" style={{ minHeight: '80vh', padding: '4rem 1rem' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1rem', color: '#1e293b' }}>🎫 Mis Tickets</h1>
                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem' }}>
                    Consulta tus números ingresando tu teléfono o correo electrónico.
                </p>

                {/* Search Form */}
                <form onSubmit={handleSearch} style={{ maxWidth: '500px', margin: '0 auto 4rem auto', display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Correo o Celular..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ flex: 1, padding: '1rem', borderRadius: '0.8rem', border: '1px solid #cbd5e1', fontSize: '1.1rem' }}
                    />
                    <button type="submit" disabled={loading} className="btn" style={{ padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {loading ? '...' : <Search size={24} />}
                    </button>
                </form>

                {/* Results */}
                {tickets && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                        {tickets.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', fontSize: '1.2rem' }}>
                                No encontramos tickets con esa información.
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <div key={ticket.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {ticket.raffles?.image_url && (
                                            <img src={ticket.raffles.image_url} style={{ width: 50, height: 50, borderRadius: '0.5rem', objectFit: 'cover' }} />
                                        )}
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#334155' }}>{(ticket.raffles as any)?.title || 'Rifa #' + ticket.raffle_id}</h3>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ padding: '2rem', textAlign: 'center', background: 'white' }}>
                                        <div style={{ fontSize: '3rem', fontWeight: '800', color: '#334155', marginBottom: '1rem' }}>
                                            #{ticket.ticket_number.toString().padStart(4, '0')}
                                        </div>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 'bold',
                                            background: ticket.status === 'paid' ? '#dcfce7' : '#f1f5f9',
                                            color: ticket.status === 'paid' ? '#166534' : '#64748b'
                                        }}>
                                            {ticket.status === 'paid' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                            {ticket.status === 'paid' ? 'CONFIRMADO' : 'PENDIENTE'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}
