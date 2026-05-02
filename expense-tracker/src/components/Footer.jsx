import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer compact-footer">
      <div className="footer-container">
        <div className="compact-footer-content">
          <p className="footer-copyright">
            &copy; {currentYear} <span className="gradient-text">Expense Tracker</span>
          </p>
          <nav className="compact-footer-links">
            <Link to="/">Dashboard</Link>
            <Link to="/tracker">Tracker</Link>
            <Link to="/history">History</Link>
          </nav>
          <span className="compact-footer-note">React + MongoDB</span>
        </div>
      </div>
    </footer>
  );
}
