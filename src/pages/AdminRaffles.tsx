import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminRaffles() {
    const [raffles, setRaffles] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', price: '', description: '' });

    useEffect(() => {
        fetchRaffles();
    }, []);

    const fetchRaffles = async () => {
        const { data } = await supabase.from('raffles').select('*').order('created_at', { ascending: false });
        setRaffles(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.price) return;

        const { error } = await supabase.from('raffles').insert([{
            title: formData.title,
            price: parseFloat(formData.price),
            description: formData.description,
            status: 'on_sale'
        }]);

        if (!error) {
            setShowForm(false);
            setFormData({ title: '', price: '', description: '' });
            fetchRaffles();
        } else {
            alert('Error creando rifa: ' + error.message);
        }
    };

    const deleteRaffle = async (id: string) => {
        if (!confirm('¿Seguro que quieres borrar esta rifa?')) return;
        await supabase.from('raffles').delete().eq('id', id);
        fetchRaffles();
    };

    return (
        <div>
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
