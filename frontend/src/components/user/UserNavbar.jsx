import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import SearchBar from './SearchBar';
import { User, LogOut, ChartBar } from 'lucide-react';
import './UserNavbar.css';

const UserNavbar = ({ hideSearch = false, initialQuery = '' }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearch = (q) => {
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const doLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/home');
  };

  return (
    <nav className="user-navbar">
      <div className="user-navbar-content">
        <Link to="/home" className="user-navbar-logo">
          Web<span className="text-gradient">searcher</span>
        </Link>
        <div className="user-navbar-center">
          {!hideSearch && (
            <SearchBar 
              size="small" 
              initialValue={initialQuery}
              showSuggestions={true} 
              onSearch={handleSearch} 
              placeholder="Search..."
            />
          )}
        </div>
        <div className="user-navbar-right">
          {user ? (
            <div className="user-dropdown-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {user.role === 'admin' && (
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                  Admin Dashboard
                </button>
              )}
              <button className="user-avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </button>
              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <strong>{user.username}</strong>
                  </div>
                  <Link to="/account" className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <User size={14} /> My Account
                  </Link>
                  <Link to="/stats" className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <ChartBar size={14} /> Public Stats
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/dashboard" className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="user-dropdown-divider" />
                  <button onClick={doLogout} className="user-dropdown-item logout">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize:'0.9rem' }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize:'0.9rem' }}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default UserNavbar;
