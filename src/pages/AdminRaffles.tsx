import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminRaffles() {
    const [raffles, setRaffles] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', price: '', description: '', image_url: '' });
    const [uploading, setUploading] = useState(false);

    // ... useEffect ...

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `raffle-images/${fileName}`;

            // Try 'images' bucket first, then 'public'
            let bucketName = 'images';
            let { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file);

            if (uploadError) {
                bucketName = 'public'; // Fallback
                const { error: publicError } = await supabase.storage.from(bucketName).upload(filePath, file);
                if (publicError) throw publicError;
            }

            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error: any) {
            alert('Error subiendo imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.price) return;

        const { error } = await supabase.from('raffles').insert([{
            title: formData.title,
            price: parseFloat(formData.price),
            description: formData.description,
            image_url: formData.image_url,
            status: 'on_sale'
        }]);

        if (!error) {
            setShowForm(false);
            setFormData({ title: '', price: '', description: '', image_url: '' });
            fetchRaffles();
        } else {
            alert('Error creando rifa: ' + error.message);
        }
    };

    // ... deleteRaffle ...

    return (
        <div>
            {/* ... Header ... */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', color: '#1e293b' }}>Mis Rifas</h1>
                    <p style={{ color: '#64748b' }}>Gestiona tus sorteos activos</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> Nueva Rifa
                </button>
            </div>

            {showForm && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid #e2e8f0', animation: 'fadeIn 0.3s' }}>
                    <h3 style={{ marginTop: 0 }}>✨ Crear Nueva Rifa</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Título de la Rifa (ej: Moto BMW)"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            style={inputStyle}
                        />
                        <input
                            type="text"
                            placeholder="Descripción corta"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            style={inputStyle}
                        />
                        <input
                            type="number"
                            placeholder="Precio del Ticket ($)"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            style={inputStyle}
                        />

                        {/* Image Fields */}
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Imagen o Video del Premio</label>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleImageUpload}
                                    style={{ fontSize: '0.9rem' }}
                                />
                                {uploading && <span style={{ color: '#0284c7', fontSize: '0.9rem' }}>Subiendo...</span>}
                            </div>

                            <input
                                type="text"
                                placeholder="O pega la URL de la imagen/video aquí..."
                                value={formData.image_url}
                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                            />

                            {formData.image_url && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    {formData.image_url.match(/\.(mp4|webm|ogg)$/i) ? (
                                        <video src={formData.image_url} style={{ height: '150px', borderRadius: '0.5rem', background: '#000' }} controls />
                                    ) : (
                                        <img src={formData.image_url} alt="Preview" style={{ height: '100px', borderRadius: '0.5rem', objectFit: 'cover' }} />
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn">Guardar Rifa</button>
                            <button type="button" onClick={() => setShowForm(false)} style={{ ...blobButtonStyle, background: '#f1f5f9', color: '#64748b' }}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {raffles.map(raffle => (
                    <div key={raffle.id} style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>{raffle.title}</h3>
                            <span style={{
                                background: '#ecfdf5',
                                color: '#059669',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}>
                                ${raffle.price}
                            </span>
                            <span style={{ marginLeft: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                {new Date(raffle.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link to={`/admin/raffles/${raffle.id}`} style={{ ...blobButtonStyle, background: '#e0f2fe', color: '#0284c7' }} title="Ver Ventas">
                                <Eye size={18} />
                            </Link>
                            <Link to={`/checkout/${raffle.id}`} target="_blank" style={{ ...blobButtonStyle, background: '#f0fdf4', color: '#16a34a' }} title="Ir a la Web">
                                ↗
                            </Link>
                            <button onClick={() => deleteRaffle(raffle.id)} style={{ ...blobButtonStyle, background: '#fee2e2', color: '#dc2626' }} title="Eliminar">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const inputStyle = {
    padding: '0.8rem',
    borderRadius: '0.5rem',
    border: '1px solid #cbd5e1',
    fontSize: '1rem',
    fontFamily: 'inherit'
};

const blobButtonStyle = {
    border: 'none',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
};
