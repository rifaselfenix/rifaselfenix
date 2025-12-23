import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, DollarSign, Ticket, Globe, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ totalSales: 0, totalTickets: 0, activeRaffles: 0 });
    const [financials, setFinancials] = useState<{ raffles: any[], methods: any[] }>({ raffles: [], methods: [] });
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [loadingCurrencies, setLoadingCurrencies] = useState(false);

    useEffect(() => {
        loadStats();
        loadCurrencies();
    }, []);

    const loadCurrencies = async () => {
        setLoadingCurrencies(true);
        const { data } = await supabase.from('currencies').select('*').order('code');
        if (data) setCurrencies(data);
        setLoadingCurrencies(false);
    };

    const updateCurrency = async (id: string, field: string, value: any) => {
        const { error } = await supabase.from('currencies').update({ [field]: value }).eq('id', id);
        if (error) {
            alert('Error actualizando moneda: ' + error.message);
        } else {
            setCurrencies(currencies.map(c => c.id === id ? { ...c, [field]: value } : c));
        }
    };

    const loadStats = async () => {
        // 1. Contar Rifas Activas
        const { count: rafflesCount } = await supabase.from('raffles').select('*', { count: 'exact', head: true }).eq('status', 'on_sale');

        // 2. Fetch Tickets para Cálculos Financieros
        // Traemos tickets pagados con info de su rifa
        const { data: tickets } = await supabase
            .from('tickets')
            .select('price_paid, status, payment_method, raffle_id, raffles (id, title, total_tickets)');

        if (tickets) {
            const paidTickets = tickets.filter(t => t.status === 'paid');
            const reservedTickets = tickets.filter(t => t.status === 'reserved');
            const totalSales = paidTickets.reduce((acc, t) => acc + (t.price_paid || 0), 0);

            // Estadísticas Generales
            setStats({
                activeRaffles: rafflesCount || 0,
                totalTickets: paidTickets.length,
                totalSales: totalSales,
                reservedTickets: reservedTickets.length
            } as any);

            // --- CÁLCULO DE DESGLOSE FINANCIERO ---

            // A. Por Rifa
            const rafflesMap: Record<string, any> = {};
            tickets.forEach((t: any) => {
                // Solo consideramos pagados para "Recaudado", pero todos para "Vendidos" (ocupados) si se desea, 
                // pero lo estandar es contar "Pagados" como revenue real. 
                // Para barra de progreso, contaremos "ocupados" (paid + reserved) en el componente de barra, 
                // pero aquí en financiero nos enfocamos en el dinero ($).

                // Usaremos tickets 'paid' para revenue, y 'paid' + 'reserved' para conteo de ocupación si aplica.

                const rParams = t.raffles;
                if (!rParams) return;

                if (!rafflesMap[rParams.id]) {
                    rafflesMap[rParams.id] = {
                        id: rParams.id,
                        title: rParams.title,
                        total_tickets: rParams.total_tickets || 10000,
                        sold: 0, // Pagados + Reservados (Ocupados)
                        revenue: 0 // Solo Pagados
                    };
                }

                if (t.status === 'paid' || t.status === 'reserved') {
                    rafflesMap[rParams.id].sold += 1;
                }
                if (t.status === 'paid') {
                    rafflesMap[rParams.id].revenue += (t.price_paid || 0);
                }
            });

            // B. Por Método de Pago
            const methodsMap: Record<string, any> = {};
            paidTickets.forEach((t: any) => {
                const method = t.payment_method || 'Desconocido';
                if (!methodsMap[method]) {
                    methodsMap[method] = { name: method, count: 0, total: 0 };
                }
                methodsMap[method].count += 1;
                methodsMap[method].total += (t.price_paid || 0);
            });

            setFinancials({
                raffles: Object.values(rafflesMap),
                methods: Object.values(methodsMap).sort((a: any, b: any) => b.total - a.total)
            });
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: 0 }}>Dashboard</h1>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard
                    title="Ventas Confirmadas"
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
                    title="Tickets Por Verificar"
                    value={(stats as any).reservedTickets || 0}
                    icon={<Ticket size={24} color="#f59e0b" />}
                    bg="#fffbeb"
                />
                <StatCard
                    title="Rifas Activas"
                    value={stats.activeRaffles}
                    icon={<TrendingUp size={24} color="#d946ef" />}
                    bg="#fdf4ff"
                />
            </div>

            {/* Currency Management Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <Globe size={20} color="#334155" />
                    <h2 style={{ margin: 0, color: '#334155', fontSize: '1.5rem' }}>Monedas y Tasas</h2>
                    <button
                        onClick={loadCurrencies}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                        title="Recargar"
                    >
                        <RefreshCw size={18} className={loadingCurrencies ? 'spin' : ''} color="#64748b" />
                    </button>
                </div>

                <div style={{ padding: '2rem 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                        {/* Breakdown by Raffle */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ marginTop: 0, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                Rendimiento por Rifa
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: '#64748b' }}>
                                            <th style={{ padding: '0.5rem' }}>Rifa</th>
                                            <th style={{ padding: '0.5rem' }}>Vendidos</th>
                                            <th style={{ padding: '0.5rem' }}>Progreso</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Recaudado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {financials.raffles.map((r: any) => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                <td style={{ padding: '0.8rem 0.5rem', fontWeight: '500' }}>{r.title}</td>
                                                <td style={{ padding: '0.8rem 0.5rem' }}>{r.sold}</td>
                                                <td style={{ padding: '0.8rem 0.5rem' }}>
                                                    <div style={{ width: '100px', height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${Math.min(100, (r.sold / (r.total_tickets || 10000)) * 100)}%`, background: '#3b82f6', height: '100%' }}></div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                                                    ${r.revenue.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Breakdown by Payment Method */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ marginTop: 0, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                Métodos de Pago
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {financials.methods.map((m: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '0.8rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <div style={{ width: 40, height: 40, background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                                🏦
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontWeight: 'bold', color: '#334155' }}>{m.name}</span>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{m.count} transacciones</span>
                                            </div>
                                        </div>
                                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>
                                            ${m.total.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                                {financials.methods.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center' }}>No hay datos financieros aún.</p>}
                            </div>
                        </div>

                    </div>
                </div>

                {/* EXISTING CURRENCY TABLE BELOW */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', color: '#64748b' }}>Moneda</th>
                                <th style={{ padding: '1rem', color: '#64748b' }}>Símbolo</th>
                                <th style={{ padding: '1rem', color: '#64748b' }}>Tasa (vs USD)</th>
                                <th style={{ padding: '1rem', color: '#64748b' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currencies.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#334155' }}>
                                        {c.name} ({c.code})
                                    </td>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                                        {c.symbol}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: '#94a3b8' }}>1 USD = </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                defaultValue={c.rate}
                                                onBlur={(e) => updateCurrency(c.id, 'rate', e.target.value)}
                                                disabled={c.code === 'USD'}
                                                style={{
                                                    padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', width: '100px',
                                                    background: c.code === 'USD' ? '#f1f5f9' : 'white'
                                                }}
                                            />
                                            <span style={{ fontWeight: 'bold', color: '#334155' }}>{c.code}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={() => updateCurrency(c.id, 'is_active', !c.is_active)}
                                            style={{
                                                padding: '0.4rem 1rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: c.is_active ? '#ecfdf5' : '#f1f5f9',
                                                color: c.is_active ? '#059669' : '#94a3b8',
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {c.is_active ? 'Activa' : 'Inactiva'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {currencies.length === 0 && !loadingCurrencies && (
                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                            No hay monedas configuradas. Revisa la base de datos.
                        </p>
                    )}
                </div>
            </div>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
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
