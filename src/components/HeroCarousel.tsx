import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroCarousel() {
    const [slides, setSlides] = useState<any[]>([]);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        const { data } = await supabase.from('site_content').select('*').eq('section', 'carousel').order('created_at', { ascending: false });
        if (data && data.length > 0) {
            setSlides(data);
        } else {
            // Default fallbacks if nothing in DB
            setSlides([
                {
                    type: 'video',
                    url: 'https://cdn.coverr.co/videos/coverr-driving-a-convertible-car-5432/1080p.mp4',
                    title: 'Gana la Libertad',
                    subtitle: 'Participa por vehículos de alta gama'
                },
                {
                    type: 'image',
                    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2670&auto=format&fit=crop',
                    title: 'Adrenalina Pura',
                    subtitle: 'Motos deportivas esperan por ti'
                }
            ]);
        }
    };

    useEffect(() => {
        if (slides.length === 0) return;
        const timer = setInterval(() => {
            nextSlide();
        }, 6000);
        return () => clearInterval(timer);
    }, [current, slides]);

    const nextSlide = () => {
        setCurrent(c => (c + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrent(c => (c - 1 + slides.length) % slides.length);
    };

    if (slides.length === 0) return (
        <div style={{ height: '600px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ position: 'relative', height: '600px', overflow: 'hidden', background: '#000' }}>

            {/* SLIDES */}
            {slides.map((slide, idx) => (
                <div key={idx} style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    opacity: current === idx ? 1 : 0,
                    transition: 'opacity 1s ease-in-out',
                    zIndex: current === idx ? 1 : 0
                }}>
                    {slide.type === 'video' ? (
                        <video
                            src={slide.url}
                            autoPlay muted loop playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
                        />
                    ) : (
                        <img
                            src={slide.url}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
                        />
                    )}

                    {/* TEXT CONTENT */}
                    <div className="container" style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        textAlign: 'center', color: 'white', width: '100%', zIndex: 10
                    }}>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: '800', marginBottom: '1rem', textShadow: '0 4px 20px rgba(0,0,0,0.5)', lineHeight: 1.1 }}>
                            {slide.title}
                        </h1>
                        <p style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', marginBottom: '2rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)', maxWidth: '90%', margin: '0 auto 2rem auto' }}>
                            {slide.subtitle}
                        </p>
                        <a href="#rifas" className="btn" style={{
                            background: 'white', color: '#1e293b', border: 'none',
                            padding: '1rem 3rem', fontSize: '1.2rem', fontWeight: 'bold'
                        }}>
                            Participar Ahora
                        </a>
                    </div>
                </div>
            ))}

            {/* CONTROLS */}
            <button onClick={prevSlide} style={{ ...arrowStyle, left: '2rem' }}><ChevronLeft size={30} /></button>
            <button onClick={nextSlide} style={{ ...arrowStyle, right: '2rem' }}><ChevronRight size={30} /></button>

            {/* INDICATORS */}
            <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem', zIndex: 20 }}>
                {slides.map((_, idx) => (
                    <div key={idx} onClick={() => setCurrent(idx)} style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: current === idx ? 'white' : 'rgba(255,255,255,0.3)',
                        cursor: 'pointer', transition: 'all 0.3s'
                    }} />
                ))}
            </div>
        </div>
    );
}

const arrowStyle = {
    position: 'absolute' as const, top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)',
    color: 'white', borderRadius: '50%', width: '50px', height: '50px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20,
    transition: 'background 0.2s'
};
