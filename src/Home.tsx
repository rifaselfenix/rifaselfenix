import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Link } from 'react-router-dom';
import { Ticket, Star, ShieldCheck, Trophy } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HeroCarousel from './components/HeroCarousel';
import WinnerStories from './components/WinnerStories';

export default function Home() {
    const [raffles, setRaffles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.from('raffles').select('*').eq('status', 'on_sale')
            .then(({ data }) => {
                setRaffles(data || []);
                setLoading(false);
            });
    }, []);

    return (
        <>
            <Navbar />

            {/* HERO SECTION */}
            <HeroCarousel />

            {/* FEATURES */}
            <section style={{ padding: '4rem 2rem', background: 'white' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                        <FeatureCard icon={<Trophy color="#eab308" />} title="Premios Reales" desc="Motos, tecnología y efectivo. Solo lo mejor para ti." />
                        <FeatureCard icon={<ShieldCheck color="#10b981" />} title="100% Seguro" desc="Cada ticket queda registrado inmutablemente en nuestra base de datos." />
                        <FeatureCard icon={<Star color="#f43f5e" />} title="Experiencia Premium" desc="Sin complicaciones. Compra en segundos y recibe tu ticket al instante." />
                    </div>
                </div>
            </section>

            {/* WINNERS */}
            <WinnerStories />

            {/* RAFFLES GRID */}
            <section id="rifas" style={{ padding: '6rem 2rem' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '1rem' }}>Sorteos Activos 🔥</h2>
                        <p style={{ color: '#64748b' }}>Elige tu favorito y prueba tu suerte hoy mismo.</p>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8' }}>Cargando oportunidades...</div>
                    ) : raffles.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                            <p>No hay sorteos activos por el momento. ¡Vuelve pronto!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                            {raffles.map(raffle => (
                                <div key={raffle.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    {/* Image */}
                                    <div style={{ height: '200px', background: 'linear-gradient(135deg, #fce7f3 0%, #fae8ff 100%)', borderRadius: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {raffle.image_url ? (
                                            <img src={raffle.image_url} alt={raffle.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Ticket size={64} color="#f472b6" opacity={0.5} />
                                        )}
                                    </div>

                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#1e293b' }}>{raffle.title}</h3>
                                    <p style={{ color: '#64748b', flex: 1, marginBottom: '2rem' }}>{raffle.description}</p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Precio Ticket</p>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#be123c' }}>${raffle.price}</span>
                                        </div>
                                        <Link to={`/checkout/${raffle.id}`} className="btn" style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}>
                                            Jugar Ahora
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </>
    );
}

function FeatureCard({ icon, title, desc }: any) {
    return (
        <div style={{ padding: '2rem', background: '#fdfbf7', borderRadius: '1.5rem', border: '1px solid #f1f5f9' }}>
            <div style={{ background: 'white', width: '50px', height: '50px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                {icon}
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{title}</h3>
            <p style={{ color: '#64748b', lineHeight: '1.5', margin: 0 }}>{desc}</p>
        </div>
    );
}
