import { Link } from 'react-router-dom';
import { User, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 100,
            background: 'rgba(253, 251, 247, 0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>🔥</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, #be123c, #fb7185)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Rifas Fénix
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="desktop-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <Link to="/" style={linkStyle}>Inicio</Link>
                    <Link to="#rifas" style={linkStyle}>Sorteos Activos</Link>
                    <Link to="/admin" style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={18} /> Admin
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none' }}>
                    <Menu size={24} color="#334155" />
                </button>
            </div>
        </nav>
    );
}

const linkStyle = {
    textDecoration: 'none',
    color: '#334155',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'color 0.2s'
};
