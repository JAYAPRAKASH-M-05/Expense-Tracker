import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/tracker', label: 'Expense Tracker', icon: '💳' },
    { path: '/history', label: 'History', icon: '📅' }
  ];

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="site-logo">
          <span className="logo-icon">💸</span>
          <div className="logo-text">
            <h1>Expense Tracker</h1>
            <span className="logo-tagline">Track your spending smartly</span>
          </div>
        </Link>

        <nav className="main-nav">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
