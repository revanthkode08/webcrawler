import React, { useEffect, useState, useContext } from 'react';
import './ActiveCrawlsTable.css';
import { AuthContext } from '../../context/AuthContext';
import { authFetch } from '../../api/client';
import { useNavigate } from 'react-router-dom';

const formatElapsed = (seconds) => {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const ActiveCrawlsTable = ({ socket }) => {
  const [crawls, setCrawls] = useState([]);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchCrawls = () => {
    if (!token) return;

    authFetch('/api/crawls', token, { method: 'GET' })
      .then(res => setCrawls(res.data || res))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (!token) return;

    fetchCrawls();
    const interval = setInterval(fetchCrawls, 3000);

    if (socket) {
      socket.on('state_update', fetchCrawls);
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('state_update', fetchCrawls);
      }
    };
  }, [socket, token]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Running': return 'text-accent';
      case 'Crawling': return 'text-accent';
      case 'Indexing': return 'text-warning';
      case 'Queued': return 'text-secondary';
      case 'Completed': return 'text-success';
      default: return '';
    }
  };

  return (
    <div className="table-responsive">
      <table className="crawls-table">
        <thead>
          <tr>
            <th>Domain</th>
            <th>Status</th>
            <th>Pages</th>
            <th>Progress</th>
            <th>Elapsed</th>
            <th>Graph</th>
          </tr>
        </thead>
        <tbody>
          {crawls.map(crawl => (
            <tr key={crawl._id}>
              <td className="domain-cell">{crawl.domain}</td>
              <td>
                <span className={`status-badge ${getStatusColor(crawl.status)}`}>
                  {crawl.status}
                </span>
              </td>
              <td>{crawl.pages.toLocaleString()}</td>
              <td>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:'120px' }}>
                  <div style={{ flex:1, background:'#1e2035', borderRadius:'4px', height:'6px', overflow:'hidden' }}>
                    <div style={{ 
                      width:`${Math.min(100, ((crawl.pages / crawl.maxPages) * 100))}%`,
                      height:'100%',
                      background:'linear-gradient(90deg, #00d4aa, #7c3aed)',
                      transition:'width 0.6s ease'
                    }} />
                  </div>
                  <span style={{ fontSize:'0.8rem', minWidth:'36px', color:'#94a3b8' }}>
                    {Math.min(100, ((crawl.pages / crawl.maxPages) * 100)).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td>{formatElapsed(crawl.elapsed)}</td>
              <td>
                <button
                  className="btn btn-outline"
                  style={{ padding:'0.3rem 0.7rem', fontSize:'0.8rem' }}
                  onClick={() => navigate(`/dashboard/graph/${crawl._id}`)}
                >
                  View Graph
                </button>
              </td>
            </tr>
          ))}
          {crawls.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ActiveCrawlsTable;
