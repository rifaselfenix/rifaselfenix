import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        setLoading(false);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            navigate('/admin');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc'
        }}>
            <form onSubmit={handleLogin} style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '1rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '3rem' }}>🔥</span>
                    <h1 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Admin Acceso</h1>
                    <p style={{ color: '#64748b' }}>Ingresa tus credenciales para gestionar.</p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Contraseña</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#be123c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Entrando...' : 'Iniciar Sesión'}
                </button>
            </form>
        </div>
    );
}
