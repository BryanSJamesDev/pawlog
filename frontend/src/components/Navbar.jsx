import { NavLink, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import '../css/Navbar.css';

const LINKS = [
  { to: '/log', label: 'Log' },
  { to: '/history', label: 'History' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/pets', label: 'Pets' },
  { to: '/care', label: 'Care' },
  { to: '/how-to-use', label: 'How to Use' },
];

export default function Navbar({ user, onLogout }) {
  return (
    <header className="navbar">
      <Link to="/log" className="navbar-logo">
        🐾 PawLog
      </Link>
      
      <nav aria-label="Main">
        <ul className="navbar-links">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to}>{link.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="navbar-user">
        <span>{user.username}</span>
        <button type="button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}

Navbar.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
};