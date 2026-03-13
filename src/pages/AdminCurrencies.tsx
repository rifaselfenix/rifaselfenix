import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Save, X, Building2 } from 'lucide-react';

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
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Currency Form States
    const [showForm, setShowForm] = useState(false);
    const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '', rate: '' });

    // Payment Method Form States
    const [showMethodForm, setShowMethodForm] = useState(false);
    const [newMethod, setNewMethod] = useState({ bank_name: '', account_number: '', account_type: '', account_owner: '', bank_phone: '', account_id_number: '', instructions: '', image_url: '' });
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [currenciesRes] = await Promise.all([
            supabase.from('currencies').select('*').order('code'),
            supabase.from('payment_methods').select('*').is('raffle_id', null).order('created_at', { ascending: false })
        ]);

        setCurrencies(currenciesRes.data || []);
        // En caso de que haya registros pasados con raffle_id, mostramos todos por si acaso, 
        // pero la idea es migrar hacia que ya no dependan del raffle_id
        const { data: allMethods } = await supabase.from('payment_methods').select('*');
        setPaymentMethods(allMethods || []);

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
            fetchData();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar moneda? Esto podría afectar rifas que usen esta moneda.')) return;
        await supabase.from('currencies').delete().eq('id', id);
        fetchData();
    };

    const handleAddMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMethod.bank_name || !newMethod.account_number) return alert('Banco y Número de Cuenta son obligatorios');

        const { error } = await supabase.from('payment_methods').insert([{
            ...newMethod,
            raffle_id: null // Explicitamente null para ser global
        }]);

        if (error) {
            alert('Error grabando método: ' + error.message);
        } else {
            setNewMethod({ bank_name: '', account_number: '', account_type: '', account_owner: '', bank_phone: '', account_id_number: '', instructions: '', image_url: '' });
            setShowMethodForm(false);
            fetchData();
        }
    };

    const handleDeleteMethod = async (id: string) => {
        if (!confirm('¿Eliminar método de pago permanentemente?')) return;
        await supabase.from('payment_methods').delete().eq('id', id);
        fetchData();
    };

    const handleMethodImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploadingImage(true);
        const file = e.target.files[0];
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `bank-${Date.now()}.${fileExt}`;
            const filePath = `payment-methods/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            setNewMethod(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error: any) {
            alert('Error subiendo logo: ' + error.message);
        } finally {
            setUploadingImage(false);
        }
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

            {/* SECCIÓN DE MÉTODOS DE PAGO */}
            <hr style={{ margin: '3rem 0', border: '1px solid #e2e8f0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={24} /> Métodos de Pago (Globales)
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                        Estos métodos de pago aparecerán para <strong>todas</strong> las rifas.
                    </p>
                </div>
                <button onClick={() => setShowMethodForm(true)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: 'white' }}>
                    <Plus size={18} /> Nuevo Método
                </button>
            </div>

            {showMethodForm && (
                <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #bfdbfe', marginBottom: '2rem', animation: 'fadeIn 0.3s' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e3a8a' }}>Añadir Método de Pago Global</h3>
                    <form onSubmit={handleAddMethod} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.3rem' }}>Banco/Billetera *</label>
                                <input placeholder="Ej: Banesco, Zelle, Binance" value={newMethod.bank_name} onChange={e => setNewMethod({ ...newMethod, bank_name: e.target.value })} style={inputStyle} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.3rem' }}>Número/Correo de Cuenta *</label>
                                <input placeholder="0134-xxxx-xxxx..." value={newMethod.account_number} onChange={e => setNewMethod({ ...newMethod, account_number: e.target.value })} style={inputStyle} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.3rem' }}>Tipo de Cuenta</label>
                                <input placeholder="Corriente / Ahorros / Pago Móvil" value={newMethod.account_type} onChange={e => setNewMethod({ ...newMethod, account_type: e.target.value })} style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.3rem' }}>Titular</label>
                                <input placeholder="Nombre del Titular" value={newMethod.account_owner} onChange={e => setNewMethod({ ...newMethod, account_owner: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.3rem' }}>Cédula/ID (Para Pago Móvil)</label>
                                <input placeholder="V-12345678" value={newMethod.account_id_number} onChange={e => setNewMethod({ ...newMethod, account_id_number: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.3rem' }}>Teléfono (Para Pago Móvil)</label>
                                <input placeholder="0414-0000000" value={newMethod.bank_phone} onChange={e => setNewMethod({ ...newMethod, bank_phone: e.target.value })} style={inputStyle} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.3rem' }}>Instrucciones Adicionales</label>
                            <input placeholder="Ej: Enviar comprobante al WhatsApp al transferir." value={newMethod.instructions} onChange={e => setNewMethod({ ...newMethod, instructions: e.target.value })} style={inputStyle} />
                        </div>

                        <div style={{ padding: '1rem', background: '#dbeafe', borderRadius: '0.5rem', border: '1px dashed #93c5fd' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.5rem' }}>🖼️ Logo del Banco o QR (Opcional)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input type="file" accept="image/*" onChange={handleMethodImageUpload} style={{ fontSize: '0.9rem' }} />
                                {uploadingImage && <span style={{ color: '#2563eb', fontWeight: 'bold' }}>Subiendo...</span>}
                            </div>
                            {newMethod.image_url && (
                                <div style={{ marginTop: '1rem' }}>
                                    <img src={newMethod.image_url} alt="Logo Previsto" style={{ height: '60px', borderRadius: '8px', border: '1px solid #bfdbfe' }} />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button type="submit" disabled={uploadingImage} className="btn" style={{ background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', opacity: uploadingImage ? 0.5 : 1 }}>
                                <Save size={18} /> Guardar Método Global
                            </button>
                            <button type="button" onClick={() => setShowMethodForm(false)} style={{ background: 'white', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.8rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {paymentMethods.map(m => (
                    <div key={m.id} style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <button
                            onClick={() => handleDeleteMethod(m.id)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.4rem', borderRadius: '0.4rem', cursor: 'pointer' }}
                            title="Eliminar Método"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            {m.image_url ? (
                                <img src={m.image_url} alt={m.bank_name} style={{ width: '50px', height: '50px', objectFit: 'contain', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '2px' }} />
                            ) : (
                                <div style={{ width: '50px', height: '50px', background: '#e0f2fe', color: '#0369a1', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
                                    🏦
                                </div>
                            )}
                            <div>
                                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>{m.bank_name}</h3>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '99px' }}>{m.account_type || 'General'}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem', color: '#475569' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.3rem' }}>
                                <span style={{ color: '#94a3b8' }}>Cuenta:</span>
                                <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{m.account_number}</span>
                            </div>
                            {m.account_owner && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Titular:</span>
                                    <span>{m.account_owner}</span>
                                </div>
                            )}
                            {m.account_id_number && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>ID/Cédula:</span>
                                    <span>{m.account_id_number}</span>
                                </div>
                            )}
                            {m.bank_phone && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Pago Móvil:</span>
                                    <span>{m.bank_phone}</span>
                                </div>
                            )}
                        </div>

                        {m.instructions && (
                            <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', borderLeft: '3px solid #cbd5e1' }}>
                                "{m.instructions}"
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {paymentMethods.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '1rem', border: '2px dashed #e2e8f0' }}>
                    <Building2 size={40} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>No tienes métodos de pago</h3>
                    <p style={{ color: '#94a3b8', margin: 0 }}>Crea uno arriba para que tus clientes puedan pagar las rifas.</p>
                </div>
            )}
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
