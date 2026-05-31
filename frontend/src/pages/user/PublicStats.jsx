import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/user/UserNavbar';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './PublicStats.css';

const CountUp = ({ value, duration = 1200 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const pct = Math.min(progress / duration, 1);
      const easeOut = 1 - Math.pow(1 - pct, 3);
      setCount(Math.floor(easeOut * value));
      if (pct < 1) requestAnimationFrame(animate);
      else setCount(value);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <span>{count.toLocaleString()}</span>;
};

const PublicStats = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    totalPages: 0, totalDomains: 0, recentPages: 0, 
    topDomains: [], dailyHistory: [] 
  });
  const [recentLive, setRecentLive] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/public/stats');
      if (res.ok) {
        setStats(await res.json());
      }
    } catch(err) {}
  };

  const fetchRecent = async () => {
    try {
      const res = await fetch('/api/search?limit=10&sort=date');
      if (res.ok) {
        const d = await res.json();
        setRecentLive(d.results || []);
      }
    } catch(err) {}
  };

  useEffect(() => {
    fetchStats();
    fetchRecent();
    const int1 = setInterval(fetchStats, 10000);
    const int2 = setInterval(fetchRecent, 5000);
    return () => { clearInterval(int1); clearInterval(int2); };
  }, []);

  const maxDomainCount = Math.max(...(stats.topDomains || []).map(d => d.count), 1);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    if (diff < 60000)   return `${Math.floor(diff/1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000)return `${Math.floor(diff/3600000)}h ago`;
    return 'older';
  };

  return (
    <div className="public-stats-page">
      <UserNavbar />
      <div className="stats-container">
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            Index Statistics 
            <span style={{ fontSize: '0.8rem', background: 'rgba(0,212,170,0.1)', color: '#00d4aa', padding: '0.2rem 0.6rem', border: '1px solid rgba(0,212,170,0.3)', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-dot"></span> Live
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Real-time data about the crawled index</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="glass-panel stat-card text-center">
            <div className="stat-value"><CountUp value={stats.totalPages || 0} /></div>
            <div className="stat-label">Pages</div>
          </div>
          <div className="glass-panel stat-card text-center">
            <div className="stat-value"><CountUp value={stats.totalDomains || 0} /></div>
            <div className="stat-label">Domains</div>
          </div>
          <div className="glass-panel stat-card text-center">
            <div className="stat-value"><CountUp value={stats.recentPages || 0} /></div>
            <div className="stat-label">Last 24h</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '350px' }}>
            <h3 className="section-title">PAGES INDEXED OVER TIME (7 days)</h3>
            <div className="glass-panel" style={{ height: '300px', padding: '1.5rem', paddingRight: '2rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyHistory || []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickMargin={10} minTickGap={20} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickCount={5} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                    formatter={(val) => [`${val} pages`, 'Count']}
                  />
                  <Area type="monotone" dataKey="count" stroke="#00d4aa" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3 className="section-title">TOP DOMAINS</h3>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '300px' }}>
              {(stats.topDomains || []).map((d, i) => (
                <div key={i} className="domain-bar-row" onClick={() => navigate(`/domain/${d.domain}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--link-color)' }}>{d.domain}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{d.count.toLocaleString()} pages</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max((d.count / maxDomainCount) * 100, 2)}%`, background: 'var(--accent-color)', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '3rem' }}>
          <h3 className="section-title">RECENTLY INDEXED</h3>
          <div className="glass-panel list-group">
            {recentLive.map((r, i) => (
              <div key={r._id + i} className="list-item" onClick={() => navigate(`/page/${r._id}`)}>
                <span className="domain-pill">{r.domain}</span>
                <span className="page-title">{r.title || 'Untitled'}</span>
                <span className="time-ago">{timeAgo(r.indexedAt)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
export default PublicStats;
