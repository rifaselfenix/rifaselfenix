import { useRef, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Play } from 'lucide-react';

export default function WinnerStories() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [winners, setWinners] = useState<any[]>([]);

    useEffect(() => {
        fetchWinners();
    }, []);

    const fetchWinners = async () => {
        const { data } = await supabase.from('site_content').select('*').eq('section', 'winner').order('created_at', { ascending: false });
        if (data && data.length > 0) {
            setWinners(data);
        } else {
            setWinners([
                {
                    type: 'video',
                    url: 'https://cdn.coverr.co/videos/coverr-happy-people-dancing-with-confetti-5645/1080p.mp4',
                    winner_name: 'Carlos M.',
                    prize_text: 'Ganó una Moto Yamaha'
                },
                {
                    type: 'image',
                    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=2574&auto=format&fit=crop',
                    winner_name: 'Ana García',
                    prize_text: 'Ganó iPhone 14 Pro'
                },
                {
                    type: 'image',
                    url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2670&auto=format&fit=crop',
                    winner_name: 'Grupo Amigos',
                    prize_text: 'Ganaron Bono de $5M'
                }
            ]);
        }
    };

    if (winners.length === 0) return null;

    return (
        <section style={{ padding: '6rem 0', background: '#fff' }}>
            <div className="container" style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '0.5rem' }}>Nuestros Ganadores 🏆</h2>
                <p style={{ color: '#64748b' }}>Historias reales de personas felices.</p>
            </div>

            {/* Scroll Horizontal Container */}
            <div
                ref={scrollRef}
                style={{
                    display: 'flex', gap: '2rem', overflowX: 'auto', padding: '0 2rem 2rem 2rem',
                    scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch'
                }}
            >
                {winners.map((winner, idx) => (
                    <div key={idx} style={{
                        flex: '0 0 280px', height: '400px', position: 'relative', borderRadius: '1rem', overflow: 'hidden',
                        scrollSnapAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                    }}>
                        {winner.type === 'video' ? (
                            <>
                                <video src={winner.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', padding: '1rem' }}>
                                    <Play size={30} fill="white" color="white" />
                                </div>
                            </>
                        ) : (
                            <img src={winner.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}

                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, width: '100%',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                            padding: '2rem 1.5rem 1.5rem', color: 'white'
                        }}>
                            <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{winner.winner_name || winner.name}</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>{winner.prize_text || winner.prize}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
