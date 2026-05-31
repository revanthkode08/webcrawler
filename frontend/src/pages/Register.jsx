import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authFetch } from '../api/client';
import './Auth.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const data = await authFetch('/api/auth/register', null, {
        method: 'POST',
        body: JSON.stringify({ 
          username, 
          email, 
          password, 
          ...(showAdminCode && adminCode.trim() ? { adminCode: adminCode.trim() } : {})
        })
      });
      if (data) {
        login(data.token);
        if (data.user?.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/home');
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="logo text-center">
          Web<span className="text-gradient">searcher</span>
        </div>
        <h2>Create Account</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={showAdminCode} 
                onChange={() => setShowAdminCode(!showAdminCode)}
                style={{ marginRight: '0.5rem', cursor: 'pointer' }}
              />
              Register as Administrator
            </label>
          </div>

          {showAdminCode && (
            <div className="form-group slide-down">
              <label>Admin Access Code</label>
              <input 
                type="password" 
                value={adminCode} 
                onChange={(e) => setAdminCode(e.target.value)} 
                placeholder="Enter secret code..."
                required={showAdminCode}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block">Register</button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
