import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/user/UserNavbar';
import SearchBar from '../../components/user/SearchBar';
import DomainChip from '../../components/user/DomainChip';
import { BASE_URL } from '../../api/client';
import './UserHome.css';

const UserHome = () => {
  const [stats, setStats] = useState({ totalPages: 0, totalDomains: 0 });
  const [trending, setTrending] = useState([]);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const ms = await fetch(`${BASE_URL}/api/public/stats`);
      if (ms.ok) {
        const data = await ms.json();
        setStats({ totalPages: data.totalPages, totalDomains: data.totalDomains });
      }
      const trendReq = await fetch(`${BASE_URL}/api/search/trending`);
      if (trendReq.ok) {
        const tData = await trendReq.json();
        setTrending(tData);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchStats();
    const int = setInterval(fetchStats, 30000);
    return () => clearInterval(int);
  }, []);

  const handleSearch = (q) => {
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleLucky = () => {
    if (trending.length > 0) {
      navigate(`/domain/${trending[Math.floor(Math.random() * trending.length)].domain}`);
    } else {
      navigate('/search?q=websearcher');
    }
  };

  return (
    <div className="user-home-container">
      <UserNavbar hideSearch={true} />
      
      <div className="user-home-main fade-in">
        <h1 className="user-home-title">
          <span style={{ fontSize: '3.5rem', marginRight: '1rem' }}>🕷️</span>
          Web<span className="text-gradient">searcher</span>
        </h1>
        <p className="user-home-subtitle">Search the indexed web</p>
        
        <div className="user-home-search">
          <SearchBar size="large" showSuggestions={true} onSearch={handleSearch} />
          <div className="user-home-buttons">
            <button className="btn btn-primary" onClick={() => handleSearch('')} style={{ padding: '0.75rem 2rem' }}>Search</button>
            <button className="btn btn-outline" onClick={handleLucky} style={{ padding: '0.75rem 2rem' }}>I'm Feeling Lucky</button>
          </div>
        </div>

        <div className="user-home-stats">
          <span className="stat-badge">● {(stats.totalPages || 0).toLocaleString()} pages</span>
          <span className="stat-badge">● {(stats.totalDomains || 0).toLocaleString()} domains</span>
          <span className="stat-badge">● Updated live</span>
        </div>

        {trending.length > 0 && (
          <div className="user-home-trending">
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem', letterSpacing: '1px' }}>
              POPULAR DOMAINS
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {trending.slice(0, 5).map((t, i) => (
                <DomainChip key={i} domain={t.domain} count={t.count} />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="user-home-footer">
        Powered by Websearcher · <a href="/dashboard" style={{ color: 'var(--link-color)' }}>Admin Dashboard</a>
      </footer>
    </div>
  );
};
export default UserHome;
