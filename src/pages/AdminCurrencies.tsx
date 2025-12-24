import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Save, X } from 'lucide-react';

const PRESET_CURRENCIES = [
    { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
    { code: 'VES', name: 'Bolívar Venezolano', symbol: 'Bs.' },
    { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
    { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
    { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
    { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
    { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
    { code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$' },
    { code: 'GTQ', name: 'Quetzal Guatemalteco', symbol: 'Q' },
    { code: 'CRC', name: 'Colón Costarricense', symbol: '₡' },
    { code: 'HNL', name: 'Lempira Hondureño', symbol: 'L' },
    { code: 'NIO', name: 'Córdoba Nicaragüense', symbol: 'C$' },
    { code: 'PYG', name: 'Guaraní Paraguayo', symbol: '₲' },
    { code: 'UYU', name: 'Peso Uruguayo', symbol: '$' },
    { code: 'BOB', name: 'Boliviano', symbol: 'Bs.' }
];

export default function AdminCurrencies() {
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '', rate: '' });

    useEffect(() => {
        fetchCurrencies();
    }, []);

    const fetchCurrencies = async () => {
        setLoading(true);
        const { data } = await supabase.from('currencies').select('*').order('code');
        setCurrencies(data || []);
        setLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCurrency.code || !newCurrency.symbol) return;

        const { error } = await supabase.from('currencies').insert([{
            code: newCurrency.code.toUpperCase(),
            name: newCurrency.name,
            symbol: newCurrency.symbol,
            rate: parseFloat(newCurrency.rate || '1'),
            is_active: true
        }]);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            setNewCurrency({ code: '', name: '', symbol: '', rate: '' });
            setShowForm(false);
            fetchCurrencies();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar moneda? Esto podría afectar rifas que usen esta moneda.')) return;
        await supabase.from('currencies').delete().eq('id', id);
        fetchCurrencies();
    };

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1e293b' }}>Gestión de Monedas</h1>
                    <p style={{ color: '#64748b' }}>Define las monedas disponibles para tus rifas</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Nueva Moneda
                </button>
            </div>

            {showForm && (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <h3 style={{ marginTop: 0 }}>Agregar Moneda</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Seleccionar de la lista (Opcional)</label>
                        <select
                            onChange={(e) => {
                                const selected = PRESET_CURRENCIES.find(c => c.code === e.target.value);
                                if (selected) {
                                    setNewCurrency({ ...newCurrency, ...selected, rate: newCurrency.rate || '' });
                                }
                            }}
                            style={{ ...inputStyle, padding: '0.6rem' }}
                        >
                            <option value="">-- Seleccionar Moneda --</option>
                            {PRESET_CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                            ))}
                            <option value="custom">Otra / Personalizada</option>
                        </select>
                    </div>

                    <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '100px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Código (ej: USD)</label>
                            <input
                                value={newCurrency.code}
                                onChange={e => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                                placeholder="USD"
                                style={inputStyle}
                                maxLength={3}
                                required
                            />
                        </div>
                        <div style={{ flex: 2, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Nombre (ej: Dólar)</label>
                            <input
                                value={newCurrency.name}
                                onChange={e => setNewCurrency({ ...newCurrency, name: e.target.value })}
                                placeholder="Dólar Americano"
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '80px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Símbolo</label>
                            <input
                                value={newCurrency.symbol}
                                onChange={e => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                                placeholder="$"
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '100px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Tasa (Base USD)</label>
                            <input
                                type="number"
                                value={newCurrency.rate}
                                onChange={e => setNewCurrency({ ...newCurrency, rate: e.target.value })}
                                placeholder="1.0"
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" className="btn" style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Save size={16} /> Guardar</button>
                            <button type="button" onClick={() => setShowForm(false)} style={{ border: '1px solid #cbd5e1', background: 'white', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b' }}>Código</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b' }}>Nombre</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Símbolo</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Tasa</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currencies.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#334155' }}>{c.code}</td>
                                <td style={{ padding: '1rem', color: '#475569' }}>{c.name}</td>
                                <td style={{ padding: '1rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>{c.symbol}</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>{c.rate}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button onClick={() => handleDelete(c.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.4rem', borderRadius: '0.4rem', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {currencies.length === 0 && !loading && <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No hay monedas configuradas.</p>}
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '0.5rem',
    border: '1px solid #cbd5e1',
    boxSizing: 'border-box' as const
};
