import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/user/UserNavbar';
import { Globe, ArrowLeft, Clock, FileText, ExternalLink } from 'lucide-react';
import './DomainExplorer.css';

const DomainExplorer = () => {
  const { domain } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'date';
  const [localFilter, setLocalFilter] = useState('');

  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const u = new URLSearchParams({ page, sort });
      const res = await fetch(`/api/domain/${domain}?${u.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setStats(d.stats || {});
        setTotal(d.total || 0);
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [domain, page, sort]);

  useEffect(() => {
    const int = setInterval(fetchData, 15000);
    return () => clearInterval(int);
  }, [domain, page, sort]);

  const filteredData = data.filter(r => 
    r.title?.toLowerCase().includes(localFilter.toLowerCase()) ||
    r.url?.toLowerCase().includes(localFilter.toLowerCase())
  );

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    if (diff < 60000)   return `${Math.floor(diff/1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000)return `${Math.floor(diff/3600000)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="domain-explorer-page">
      <UserNavbar />
      <div className="domain-container">
        <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem', padding: '0.4rem 1rem' }}>
          <ArrowLeft size={16} style={{ marginRight: '0.5rem' }}/> Back
        </button>

        <div className="glass-panel domain-header-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-color)', color: '#000', fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {domain.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {domain}
                <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', marginLeft: '1rem' }} title="Visit Website">
                  <ExternalLink size={20} />
                </a>
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <span><strong>{total.toLocaleString()}</strong> pages indexed</span>
            <span><strong>{Math.round(stats.avgWords || 0).toLocaleString()}</strong> avg words</span>
            {stats.firstIndexed && <span>First indexed: {new Date(stats.firstIndexed).toLocaleDateString()}</span>}
          </div>
        </div>

        <div className="domain-tools">
          <input 
            type="text" 
            placeholder="Filter current results..." 
            value={localFilter}
            onChange={e => setLocalFilter(e.target.value)}
            className="domain-filter-input"
          />
          <select value={sort} onChange={e => { setSearchParams({ page: '1', sort: e.target.value }); }} className="domain-sort-select">
            <option value="date">Sort: Date (Newest)</option>
            <option value="words">Sort: Word Count</option>
          </select>
        </div>

        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
          )}
          {!loading && filteredData.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No pages found.</div>
          )}
          {!loading && filteredData.map(r => (
            <div key={r._id} onClick={() => navigate(`/page/${r._id}`)} className="domain-row">
              <div style={{ width: '100%' }}>
                <div style={{ color: 'var(--url-color)', fontSize: '0.85rem', fontFamily: 'monospace', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.url.replace(`https://${r.domain}`, '').replace(`http://${r.domain}`, '')}</div>
                <div style={{ color: 'var(--link-color)', fontSize: '1.05rem', fontWeight: 500, marginBottom: '0.5rem' }}>{r.title || 'Untitled'}</div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                  <span style={{ display:'flex', alignItems: 'center', gap: '4px' }}><FileText size={12} /> {r.wordCount} words</span>
                  <span style={{ display:'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {timeAgo(r.indexedAt)}</span>
                </div>
              </div>
            </div>
          ))}
          {!loading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <button disabled={page <= 1} onClick={() => { setSearchParams({ sort, page: page - 1 }); window.scrollTo(0,0); }} className="btn btn-outline">Previous</button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => { setSearchParams({ sort, page: page + 1 }); window.scrollTo(0,0); }} className="btn btn-outline">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DomainExplorer;
