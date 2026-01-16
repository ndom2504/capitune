import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          CapiTune
        </Link>
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/communities" className="navbar-link">Communities</Link>
          {isAuthenticated ? (
            <>
              <span className="navbar-user">👋 {user.username}</span>
              <button onClick={logout} className="navbar-logout">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="navbar-link navbar-register">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
