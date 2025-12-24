import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HeroCarousel from './components/HeroCarousel';
import { Ticket, Zap, ShieldCheck, Trophy } from 'lucide-react';

export default function Home() {
    const [raffles, setRaffles] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRaffles();
    }, []);

    const fetchRaffles = async () => {
        setLoading(true);
        const { data: rafflesData } = await supabase.from('raffles').select('*, tickets(status)').eq('status', 'on_sale');
        const { data: currenciesData } = await supabase.from('currencies').select('*').eq('is_active', true);
        const { data: pricesData } = await supabase.from('raffle_prices').select('*');

        if (currenciesData) setCurrencies(currenciesData);

        if (rafflesData) {
            const rafflesWithCount = rafflesData.map((r: any) => {
                const soldCount = r.tickets ? r.tickets.filter((t: any) => t.status === 'paid' || t.status === 'reserved').length : 0;
                const manual_prices = pricesData ? pricesData.filter((p: any) => p.raffle_id === r.id) : [];
                return { ...r, soldCount, manual_prices };
            });
            setRaffles(rafflesWithCount);
        }
        setLoading(false);
    };

    const formatPrice = (raffle: any) => {
        // 1. Try Manual Prices
        if (raffle.manual_prices && raffle.manual_prices.length > 0) {
            const primary = raffle.manual_prices.find((p: any) => p.is_primary);
            const others = raffle.manual_prices.filter((p: any) => !p.is_primary);

            const getFormat = (p: any) => {
                const currency = currencies.find(c => c.code === p.currency_code);
                const symbol = currency ? currency.symbol : p.currency_code;
                return `${symbol} ${p.price.toLocaleString()}`;
            };

            const parts = [];
            if (primary) parts.push(getFormat(primary));
            others.forEach((p: any) => parts.push(getFormat(p)));

            if (parts.length > 0) return parts.join(' / ');
        }

        // 2. Fallback to Auto-Conversion (Legacy)
        if (!currencies.length) return `$${raffle.price} USD`;
        return currencies.map(c => {
            const val = raffle.price * c.rate;
            return new Intl.NumberFormat('es-VE', { style: 'currency', currency: c.code, maximumFractionDigits: 2 }).format(val);
        }).join(' / ');
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <HeroCarousel />

            {/* RAFFLES SECTION */}
            <div id="rifas" className="container" style={{ padding: '6rem 1rem 4rem 1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <span style={{ color: '#be123c', fontWeight: 'bold', letterSpacing: '2px', fontSize: '0.9rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Oportunidades Únicas</span>
                    <h2 style={{ fontSize: '3rem', margin: 0, color: '#1e293b', fontWeight: '800' }}>Rifas Activas 🔥</h2>
                    <div style={{ width: '80px', height: '6px', background: 'linear-gradient(90deg, #be123c, #fb7185)', margin: '1.5rem auto', borderRadius: '3px' }}></div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '4rem' }}>
                        <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #cbd5e1', borderTopColor: '#be123c', borderRadius: '50%', margin: '0 auto 1rem auto', animation: 'spin 1s linear infinite' }}></div>
                        Cargando oportunidades...
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {raffles.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <p style={{ fontSize: '1.2rem', color: '#64748b' }}>No hay rifas activas en este momento. ¡Vuelve pronto!</p>
                            </div>
                        ) : (
                            raffles.map((raffle: any) => (
                                <div key={raffle.id} className="raffle-card" style={{ background: 'white', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', transition: 'transform 0.3s ease', display: 'flex', flexDirection: 'column' }}>

                                    {/* Media Header */}
                                    <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                                        {raffle.image_url?.match(/\.(mp4|webm|ogg)|video/i) ? (
                                            <video src={raffle.image_url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <img src={raffle.image_url} alt={raffle.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} className="card-img" />
                                        )}
                                        <div style={{ position: 'absolute', top: 15, right: 15, background: 'rgba(255,255,255,0.95)', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '99px', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.4rem', backdropFilter: 'blur(4px)' }}>
                                            <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></span> En Venta
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <h3 style={{ fontSize: '1.6rem', marginBottom: '0.8rem', color: '#1e293b', fontWeight: '800', lineHeight: 1.2 }}>{raffle.title}</h3>
                                        <p style={{ color: '#64748b', marginBottom: '2rem', flex: 1, lineHeight: 1.6, fontSize: '1rem' }}>
                                            {raffle.description.length > 100 ? raffle.description.substring(0, 100) + '...' : raffle.description}
                                        </p>

                                        {/* Progress Bar */}
                                        <div style={{ marginBottom: '2rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.6rem', color: '#475569', fontWeight: '600' }}>
                                                <span>🔥 Progreso de venta</span>
                                                <span>{Math.round((raffle.soldCount / (raffle.total_tickets || 10000)) * 100)}%</span>
                                            </div>
                                            <div style={{ background: '#f1f5f9', borderRadius: '999px', height: '12px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                                                <div style={{
                                                    width: `${Math.min(100, (raffle.soldCount / (raffle.total_tickets || 10000)) * 100)}%`,
                                                    background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                                                    height: '100%',
                                                    borderRadius: '999px',
                                                    transition: 'width 1s ease-out'
                                                }}></div>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem', textAlign: 'right' }}>
                                                {raffle.soldCount} tickets vendidos
                                            </p>
                                        </div>

                                        <div style={{ marginTop: 'auto', background: '#f8fafc', margin: '0 -2rem -2rem -2rem', padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Valor Ticket</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#059669', letterSpacing: '-0.5px' }}>
                                                    {formatPrice(raffle)}
                                                </span>
                                            </div>
                                            <Link to={`/checkout/${raffle.id}`} className="btn" style={{
                                                background: '#1e293b', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '0.8rem',
                                                fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                boxShadow: '0 4px 6px -1px rgba(30, 41, 59, 0.4)'
                                            }}>
                                                Jugar <Ticket size={18} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* FEATURES SECTION */}
            <section style={{ padding: '6rem 1rem', background: 'white' }}>
                <div className="container" style={{ maxWidth: '1200px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem' }}>
                        <FeatureCard
                            icon={<Zap size={32} color="#f59e0b" />}
                            title="Sorteos Rápidos"
                            desc="Resultados transparentes y ganadores cada semana."
                        />
                        <FeatureCard
                            icon={<ShieldCheck size={32} color="#10b981" />}
                            title="100% Seguro"
                            desc="Plataforma verificada y pagos protegidos."
                        />
                        <FeatureCard
                            icon={<Trophy size={32} color="#6366f1" />}
                            title="Grandes Premios"
                            desc="Desde efectivo hasta vehículos y electrónica."
                        />
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

function FeatureCard({ icon, title, desc }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
            <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
        </div>
    );
}
