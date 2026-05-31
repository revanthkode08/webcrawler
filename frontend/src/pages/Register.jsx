import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authFetch } from '../api/client';
import './Auth.css';

const DEFAULT_ADMIN_CODE = 'nutchflow_admin_2026';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
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
          ...(adminCode.trim() ? { adminCode: adminCode.trim() } : {})
        })
      });
      login(data.token);
      if (data.user?.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.data?.message || err.message || 'Registration failed');
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

          <div className="form-group">
            <label>Admin Access Code</label>
            <input 
              type="text" 
              value={adminCode} 
              onChange={(e) => setAdminCode(e.target.value)} 
              placeholder="Enter admin code if registering as administrator"
            />
            <small className="auth-note">
              Use this code to register as an administrator: <strong>{DEFAULT_ADMIN_CODE}</strong>
            </small>
          </div>

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
