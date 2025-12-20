import { Link } from 'react-router-dom';
import { User, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 100,
            background: 'rgba(253, 251, 247, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>🔥</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, #be123c, #fb7185)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Rifas Fénix
                    </span>
                </Link>

                {/* Desktop Links (Visible > 768px via CSS) */}
                <div className="desktop-links" style={{ gap: '2rem', alignItems: 'center' }}>
                    <Link to="/" style={linkStyle}>Inicio</Link>
                    <Link to="#rifas" style={linkStyle}>Sorteos Activos</Link>
                    <a href="/#/admin" style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={18} /> Admin
                    </a>
                </div>

                {/* Mobile Toggle (Visible < 768px via CSS) */}
                <button
                    className="mobile-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                >
                    <Menu size={28} color="#334155" />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'white', borderBottom: '1px solid #e2e8f0',
                    padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>🏠 Inicio</Link>
                    <Link to="#rifas" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>🎟️ Sorteos Activos</Link>
                    <a href="/#/admin" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>⚙️ Admin</a>
                </div>
            )}
        </nav>
    );
}

const mobileLinkStyle = {
    textDecoration: 'none',
    color: '#334155',
    fontWeight: '600',
    fontSize: '1.1rem',
    padding: '0.8rem',
    borderRadius: '0.5rem',
    background: '#f8fafc'
};

const linkStyle = {
    textDecoration: 'none',
    color: '#334155',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'color 0.2s'
};
