import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, DollarSign, Ticket } from 'lucide-react';

export default function AdminDashboard() {
    const [rate, setRate] = useState<string>('');
    const [stats, setStats] = useState({ totalSales: 0, totalTickets: 0, activeRaffles: 0 });
    const [loadingRate, setLoadingRate] = useState(false);

    useEffect(() => {
        loadStats();
        loadRate();
    }, []);

    const loadRate = async () => {
        const { data } = await supabase.from('app_settings').select('value').eq('key', 'conversion_rate_ves').single();
        if (data) setRate(data.value);
    };

    const updateRate = async () => {
        if (!rate) return;
        setLoadingRate(true);

        // Ensure we are sending a string value
        const { error } = await supabase.from('app_settings').upsert({
            key: 'conversion_rate_ves',
            value: String(rate)
        }, { onConflict: 'key' }); // Explicitly state conflict target

        setLoadingRate(false);
        if (error) {
            console.error('Error updating rate:', error);
            alert('Error al guardar la tasa: ' + error.message);
        } else {
            alert('Tasa actualizada correctamente');
        }
    };

    const loadStats = async () => {
        // 1. Contar Rifas
        const { count: rafflesCount } = await supabase.from('raffles').select('*', { count: 'exact', head: true });

        // 2. Contar Tickets Vendidos (Si la tabla existe)
        let ticketsCount = 0;
        let salesTotal = 0;

        // Intentamos leer tickets si existen
        const { data: tickets } = await supabase.from('tickets').select('price_paid');
        if (tickets) {
            ticketsCount = tickets.length;
            salesTotal = tickets.reduce((acc, t) => acc + (t.price_paid || 0), 0);
        }

        setStats({
            activeRaffles: rafflesCount || 0,
            totalTickets: ticketsCount,
            totalSales: salesTotal
        });
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: 0 }}>Dashboard</h1>

                {/* Configuración Rápida de Tasa */}
                <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Tasa USD/VES:</span>
                    <input
                        type="number"
                        value={rate}
                        onChange={e => setRate(e.target.value)}
                        style={{ width: '80px', padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '0.3rem' }}
                    />
                    <button
                        onClick={updateRate}
                        disabled={loadingRate}
                        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '0.3rem', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        {loadingRate ? '...' : 'Guardar'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <StatCard
                    title="Ventas Totales"
                    value={`$${stats.totalSales}`}
                    icon={<DollarSign size={24} color="#059669" />}
                    bg="#ecfdf5"
                />
                <StatCard
                    title="Tickets Vendidos"
                    value={stats.totalTickets}
                    icon={<Ticket size={24} color="#2563eb" />}
                    bg="#eff6ff"
                />
                <StatCard
                    title="Rifas Activas"
                    value={stats.activeRaffles}
                    icon={<TrendingUp size={24} color="#d946ef" />}
                    bg="#fdf4ff"
                />
            </div>

            <div style={{ marginTop: '3rem', background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <h3 style={{ color: '#64748b' }}>Gráfica de Ventas (Próximamente) 📈</h3>
                <p>Aquí verás cómo crecen tus ganancias día a día.</p>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, bg }: any) {
    return (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: bg, padding: '1rem', borderRadius: '0.75rem' }}>
                {icon}
            </div>
            <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{title}</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>{value}</h3>
            </div>
        </div>
    );
}
