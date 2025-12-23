import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ticket, LogOut, Image } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isActive = (path: string) => location.pathname === path;
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate('/login');
        }
        setChecking(false);
    };

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (checking) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Cargando panel...</div>;

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🔥</span>
                        <h2 style={{ margin: 0, color: '#881337', fontSize: '1.5rem' }}>Fénix Admin</h2>
                    </div>

                    <Link to="/" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        background: '#fff1f2', color: '#be123c', padding: '0.6rem', borderRadius: '0.5rem',
                        textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #fda4af',
                        transition: 'all 0.2s', position: 'relative', top: 0
                    }}>
                        <LogOut size={18} /> Salir a la Web
                    </Link>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <NavItem to="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" active={isActive('/admin')} />
                    <NavItem to="/admin/content" icon={<Image size={20} />} label="Multimedia" active={isActive('/admin/content')} />
                    <NavItem to="/admin/raffles" icon={<Ticket size={20} />} label="Mis Rifas" active={isActive('/admin/raffles')} />
                </nav>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <button onClick={handleLogout} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        textDecoration: 'none',
                        color: '#64748b',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s',
                        background: 'none',
                        border: 'none',
                        width: '100%',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}>
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <Outlet />
            </main>

            {/* Bottom Navigation (Mobile) */}
            <nav className="admin-bottom-nav">
                <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>
                    <LayoutDashboard size={24} />
                    <span>Inicio</span>
                </Link>
                <Link to="/admin/content" className={isActive('/admin/content') ? 'active' : ''}>
                    <Image size={24} />
                    <span>Media</span>
                </Link>
                <Link to="/admin/raffles" className={isActive('/admin/raffles') ? 'active' : ''}>
                    <Ticket size={24} />
                    <span>Rifas</span>
                </Link>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.75rem', gap: '0.2rem' }}>
                    <LogOut size={24} />
                    <span>Salir</span>
                </button>
            </nav>
        </div>
    );
}

function NavItem({ to, icon, label, active }: any) {
    return (
        <Link to={to} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: active ? '#be123c' : '#64748b',
            background: active ? '#ffe4e6' : 'transparent',
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            fontWeight: active ? '600' : '400',
            transition: 'all 0.2s'
        }}>
            {icon}
            {label}
        </Link>
    );
}
