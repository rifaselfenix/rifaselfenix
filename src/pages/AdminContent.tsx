import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Image, Video } from 'lucide-react';

export default function AdminContent() {
    const [content, setContent] = useState<any[]>([]);
    const [section, setSection] = useState<'carousel' | 'winner'>('carousel');
    const [showForm, setShowForm] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        type: 'image',
        url: '',
        title: '',
        subtitle: '',
        winner_name: '',
        prize_text: ''
    });

    useEffect(() => {
        fetchContent();
    }, [section]);

    const fetchContent = async () => {
        const { data } = await supabase
            .from('site_content')
            .select('*')
            .eq('section', section)
            .order('created_at', { ascending: false });
        setContent(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.url) return;

        await supabase.from('site_content').insert([{
            section,
            type: formData.type,
            url: formData.url,
            title: formData.title,
            subtitle: formData.subtitle,
            winner_name: formData.winner_name,
            prize_text: formData.prize_text
        }]);

        setShowForm(false);
        setFormData({ type: 'image', url: '', title: '', subtitle: '', winner_name: '', prize_text: '' });
        fetchContent();
    };

    const deleteItem = async (id: string) => {
        if (!confirm('¿Borrar este elemento?')) return;
        await supabase.from('site_content').delete().eq('id', id);
        fetchContent();
    };

    return (
        <div>
            <h1 style={{ color: '#1e293b', marginBottom: '2rem' }}>🎨 Gestor Multimedia</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => { setSection('carousel'); setShowForm(false); }}
                    className="btn"
                    style={{
                        background: section === 'carousel' ? '#3b82f6' : '#e2e8f0',
                        color: section === 'carousel' ? 'white' : '#64748b'
                    }}
                >
                    🎡 Carrusel Principal
                </button>
                <button
                    onClick={() => { setSection('winner'); setShowForm(false); }}
                    className="btn"
                    style={{
                        background: section === 'winner' ? '#ec4899' : '#e2e8f0',
                        color: section === 'winner' ? 'white' : '#64748b'
                    }}
                >
                    🏆 Historias Ganadores
                </button>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>
                    {section === 'carousel' ? 'Diapositivas del Inicio' : 'Testimonios de Ganadores'}
                </h3>
                <button onClick={() => setShowForm(!showForm)} className="btn" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Plus size={18} /> Agregar Nuevo
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="radio" checked={formData.type === 'image'} onChange={() => setFormData({ ...formData, type: 'image' })} />
                                Imagen
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="radio" checked={formData.type === 'video'} onChange={() => setFormData({ ...formData, type: 'video' })} />
                                Video
                            </label>
                        </div>

                        <input
                            type="text"
                            placeholder="URL de la imagen/video (https://...)"
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            style={inputStyle}
                            required
                        />

                        {section === 'carousel' ? (
                            <>
                                <input
                                    type="text" placeholder="Título Principal (Ej: Gana una Moto)"
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    style={inputStyle}
                                />
                                <input
                                    type="text" placeholder="Subtítulo (Ej: Sorteo este viernes)"
                                    value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                    style={inputStyle}
                                />
                            </>
                        ) : (
                            <>
                                <input
                                    type="text" placeholder="Nombre del Ganador (Ej: Juan Perez)"
                                    value={formData.winner_name} onChange={e => setFormData({ ...formData, winner_name: e.target.value })}
                                    style={inputStyle}
                                />
                                <input
                                    type="text" placeholder="Premio Ganado (Ej: iPhone 15 Pro)"
                                    value={formData.prize_text} onChange={e => setFormData({ ...formData, prize_text: e.target.value })}
                                    style={inputStyle}
                                />
                            </>
                        )}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn" style={{ background: '#10b981' }}>Guardar</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn" style={{ background: '#94a3b8' }}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {content.map(item => (
                    <div key={item.id} style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                        <div style={{ height: '150px', background: '#000', position: 'relative' }}>
                            {item.type === 'video' ? (
                                <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                {item.type === 'video' ? <Video size={12} /> : <Image size={12} />}
                            </div>
                        </div>

                        <div style={{ padding: '1rem' }}>
                            {section === 'carousel' ? (
                                <>
                                    <h4 style={{ margin: '0 0 0.2rem 0' }}>{item.title || '(Sin título)'}</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{item.subtitle}</p>
                                </>
                            ) : (
                                <>
                                    <h4 style={{ margin: '0 0 0.2rem 0' }}>{item.winner_name || '(Anónimo)'}</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{item.prize_text}</p>
                                </>
                            )}

                            <button
                                onClick={() => deleteItem(item.id)}
                                style={{
                                    marginTop: '1rem', width: '100%', padding: '0.5rem',
                                    border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444',
                                    borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}
                            >
                                <Trash2 size={14} /> Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {content.length === 0 && !showForm && (
                <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '3rem' }}>No has agregado contenido aún.</p>
            )}
        </div>
    );
}

const inputStyle = { padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' };
