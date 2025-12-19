import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '4rem 2rem', marginTop: '4rem' }}>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>

                {/* Brand */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🔥</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>Rifas Fénix</span>
                    </div>
                    <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                        La plataforma de sorteos más transparente y emocionante. Gana premios increíbles con total seguridad.
                    </p>
                </div>

                {/* Links */}
                <div>
                    <h4 style={{ color: '#1e293b', marginBottom: '1rem' }}>Explorar</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <li><Link to="/" style={footerLink}>Inicio</Link></li>
                        <li><Link to="#rifas" style={footerLink}>Sorteos</Link></li>
                        <li><Link to="/admin" style={footerLink}>Soy Organizador</Link></li>
                    </ul>
                </div>

                {/* Legal */}
                <div>
                    <h4 style={{ color: '#1e293b', marginBottom: '1rem' }}>Legal</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <li><Link to="#" style={footerLink}>Términos y Condiciones</Link></li>
                        <li><Link to="#" style={footerLink}>Política de Privacidad</Link></li>
                        <li><Link to="#" style={footerLink}>Juego Responsable</Link></li>
                    </ul>
                </div>

            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                © {new Date().getFullYear()} Rifas Fénix. Todos los derechos reservados.

                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Desarrollado con tecnología de vanguardia</p>
                    <a
                        href="https://www.simids.com"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            textDecoration: 'none',
                            background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: '900',
                            fontSize: '1.1rem',
                            letterSpacing: '0.5px'
                        }}
                    >
                        ⚡ Powered by SIMIDS IA TECH
                    </a>
                </div>
            </div>
        </footer>
    );
}

const footerLink = { textDecoration: 'none', color: '#64748b', transition: 'color 0.2s' };
