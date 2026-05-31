import React, { useEffect, useState, useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, Database, Server, Globe, LayoutDashboard, Play, LogOut, Calendar, Terminal } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import { authFetch } from '../api/client';
import './Dashboard.css';

const Dashboard = () => {
  const [seedUrl, setSeedUrl] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [seedError, setSeedError] = useState('');

  const { token, logout } = useContext(AuthContext);
  const { stats, socket } = useSocket();
  const { addToast } = useToast();
  const navigate = useNavigate();



  const handleStartCrawl = async (e) => {
    e.preventDefault();
    setSeedError('');
    
    if (!seedUrl.trim()) {
      setSeedError('Please enter a valid URL');
      return;
    }

    try {
      new URL(seedUrl);
    } catch {
      setSeedError('Please enter a valid URL (e.g. https://example.com)');
      return;
    }
    
    setIsStarting(true);
    try {
      await authFetch('/api/crawls/start', token, {
        method: 'POST',
        body: JSON.stringify({ url: seedUrl })
      });
      setSeedUrl('');
      setSeedError('');
    } catch (err) {
      setSeedError('Network error');
      addToast('Failed to start crawl', 'error');
      console.error('Failed to start crawl:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const navClass = ({ isActive }) => isActive ? 'nav-item active' : 'nav-item';

  return (
    <div className="dashboard-layout">
      <aside className="sidebar glass-panel">
        <div className="sidebar-logo">
          Web<span className="text-gradient">searcher</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className={navClass}><LayoutDashboard size={20} /> Dashboard</NavLink>
          <NavLink to="/dashboard/active-crawls" className={navClass}><Globe size={20} /> Active Crawls</NavLink>
          <NavLink to="/dashboard/index-view" className={navClass}><Database size={20} /> Index View</NavLink>
          <NavLink to="/dashboard/node-management" className={navClass}><Server size={20} /> Node Management</NavLink>
          <NavLink to="/dashboard/queue-system" className={navClass}><Activity size={20} /> Queue System</NavLink>
          <NavLink to="/dashboard/scheduler" className={navClass}><Calendar size={20} /> Scheduler</NavLink>
          <NavLink to="/dashboard/logs" className={navClass}><Terminal size={20} /> Log Stream</NavLink>
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/home" className="btn btn-outline" style={{ width: '100%' }}>Exit to Search</NavLink>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1>Cluster Overview</h1>
            <button onClick={() => navigate('/home')} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', backgroundColor: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.3)' }}>
              Websearcher →
            </button>
          </div>
          
          <form onSubmit={handleStartCrawl} className="crawl-form glass-panel">
            <input 
              type="url" 
              placeholder="Enter seed URL (e.g. https://example.com)" 
              value={seedUrl}
              onChange={(e) => setSeedUrl(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={isStarting}>
              <Play size={16} style={{ marginRight: '0.5rem' }} /> {isStarting ? 'Starting...' : 'Start Crawl'}
            </button>
          </form>
          {seedError && <div style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '0.5rem' }}>{seedError}</div>}

          <div className="user-profile glass-panel">
            <div>
              <span>Admin</span>
              <button
                type="button"
                className="btn btn-ghost logout-btn"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
            <div className="avatar">A</div>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet context={{ stats, socket }} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
