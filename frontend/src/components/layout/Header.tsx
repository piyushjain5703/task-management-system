import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/tasks', label: 'Tasks' },
    { to: '/analytics', label: 'Analytics' },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleNavClick = () => setMenuOpen(false);

  return (
    <header className="app-header">
      <div className="header-inner">
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <Link to="/dashboard" className="header-logo">
          TaskFlow
        </Link>

        <nav className={`header-nav ${menuOpen ? 'nav-open' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${isActive(link.to) ? 'nav-link-active' : ''}`}
              onClick={handleNavClick}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link to="/profile" className={`header-user ${isActive('/profile') ? 'nav-link-active' : ''}`}>
            <div className="header-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="header-username">{user?.name}</span>
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
