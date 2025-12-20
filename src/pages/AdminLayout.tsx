import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, LogOut, Image, Menu, X } from 'lucide-react';

export default function AdminLayout() {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="admin-container">
            {/* Mobile Sidebar Overlay */}
            <div
                className={`admin-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🔥</span>
                        <h2 style={{ margin: 0, color: '#881337', fontSize: '1.5rem' }}>Fénix Admin</h2>
                    </div>
                    <button
                        onClick={closeSidebar}
                        className="admin-mobile-toggle"
                        style={{ padding: '4px' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <div onClick={closeSidebar}>
                        <NavItem to="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" active={isActive('/admin')} />
                    </div>
                    <div onClick={closeSidebar}>
                        <NavItem to="/admin/content" icon={<Image size={20} />} label="Multimedia" active={isActive('/admin/content')} />
                    </div>
                    <div onClick={closeSidebar}>
                        <NavItem to="/admin/raffles" icon={<Ticket size={20} />} label="Mis Rifas" active={isActive('/admin/raffles')} />
                    </div>
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
            <main className="admin-main">
                <div className="admin-mobile-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        style={{ background: 'none', border: 'none', padding: 0, color: '#881337', cursor: 'pointer' }}
                    >
                        <Menu size={28} />
                    </button>
                    <span style={{ fontWeight: 'bold', color: '#881337', fontSize: '1.2rem' }}>Menú</span>
                </div>
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
