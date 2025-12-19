import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, LogOut, Image } from 'lucide-react';

export default function AdminLayout() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#fdfbf7' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                background: 'white',
                borderRight: '1px solid #e2e8f0',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🔥</span>
                    <h2 style={{ margin: 0, color: '#881337', fontSize: '1.5rem' }}>Fénix Admin</h2>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <NavItem to="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" active={isActive('/admin')} />
                    <NavItem to="/admin/content" icon={<Image size={20} />} label="Multimedia" active={isActive('/admin/content')} />
                    <NavItem to="/admin/raffles" icon={<Ticket size={20} />} label="Mis Rifas" active={isActive('/admin/raffles')} />
                    {/* <NavItem to="/admin/settings" icon={<Settings size={20} />} label="Configuración" active={isActive('/admin/settings')} /> */}
                </nav>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <Link to="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        textDecoration: 'none',
                        color: '#64748b',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s'
                    }}>
                        <LogOut size={20} />
                        <span>Salir a la Web</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
                <Outlet />
            </main>
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
