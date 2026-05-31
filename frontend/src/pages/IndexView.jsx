import React, { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { authFetch } from '../api/client';
import { Search, AlertTriangle, FileText, Globe, Clock, X, ExternalLink } from 'lucide-react';

const IndexView = () => {
  const [pages, setPages] = useState([]);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ 
    total: 0, limit: 20, page: 1 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [inspectPage, setInspectPage] = useState(null);
  const { token } = useContext(AuthContext);

  const fetchPages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    setWarning('');

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search ? { search } : {})
      });

      const data = await authFetch(
        `/api/index?${params.toString()}`,
        token,
        { method: 'GET' }
      );

      setPages(data.data || []);
      setPagination({
        total: data.total || 0,
        limit: data.limit || 20,
        page: data.page || 1
      });

      // Show warning if fell back to regex search
      if (data.fallback) {
        setWarning(data.warning || 'Using basic search (text index missing).');
      }

    } catch (err) {
      setError(err.message || 'Failed to load indexed pages.');
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Auto-refresh every 10 seconds if no active search
  useEffect(() => {
    if (search) return;
    const interval = setInterval(fetchPages, 10000);
    return () => clearInterval(interval);
  }, [search, fetchPages]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    setSearch('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  // Highlight matching term in text
  const highlight = (text, term) => {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} style={{
            background: 'rgba(0,212,170,0.2)',
            color: '#00d4aa',
            borderRadius: '2px',
            padding: '0 2px',
            fontStyle: 'normal'
          }}>{part}</mark>
        : part
    );
  };

  return (
    <div style={{ width: '100%' }}>

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Index View</h2>
        <p style={{ color: '#94a3b8' }}>
          Explore indexed pages from the crawler corpus.
          {pagination.total > 0 && (
            <span style={{ marginLeft: '0.5rem', color: '#00d4aa', fontWeight: 600 }}>
              {pagination.total.toLocaleString()} pages indexed
            </span>
          )}
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1rem' }}>
        <form onSubmit={handleSearch} style={{
          display: 'flex', gap: '0.75rem', alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{
              position: 'absolute', left: '0.75rem',
              top: '50%', transform: 'translateY(-50%)',
              color: '#475569', pointerEvents: 'none'
            }} />
            <input
              type="text"
              placeholder='Search by title, URL, or domain (e.g. "crawl", "mozilla", "distributed")'
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary"
            style={{ padding: '0.6rem 1.5rem', whiteSpace: 'nowrap' }}>
            Search
          </button>
          {search && (
            <button type="button" className="btn btn-outline"
              onClick={handleClear}
              style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}>
              Clear
            </button>
          )}
        </form>

        {/* Active search indicator */}
        {search && (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Showing results for{' '}
            <span style={{ color: '#00d4aa', fontWeight: 600 }}>"{search}"</span>
            {' '}— {pagination.total.toLocaleString()} matches
          </p>
        )}
      </div>

      {/* Warning (fallback search) */}
      {warning && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(234,179,8,0.1)',
          border: '1px solid rgba(234,179,8,0.25)',
          borderRadius: '8px', padding: '0.75rem 1rem',
          marginBottom: '1rem', color: '#eab308', fontSize: '0.85rem'
        }}>
          <AlertTriangle size={16} />
          {warning} Run <code style={{ background: 'rgba(255,255,255,0.1)',
            padding: '1px 6px', borderRadius: '4px' }}>
            node scripts/createIndexes.js
          </code> to enable full text search.
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '8px', padding: '1rem 1.5rem',
          marginBottom: '1rem', color: '#ef4444'
        }}>
          <strong>Error:</strong> {error}
          <button className="btn btn-outline"
            onClick={fetchPages}
            style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem',
              fontSize: '0.8rem', color: '#ef4444',
              borderColor: 'rgba(239,68,68,0.3)' }}>
            Retry
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ padding: '1.5rem' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: '44px', marginBottom: '0.5rem',
                background: 'linear-gradient(90deg, #1e2035 25%, #2a2d45 50%, #1e2035 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: '6px'
              }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && pages.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem', color: '#475569'
          }}>
            <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <h3 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
              {search ? `No results for "${search}"` : 'No pages indexed yet'}
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              {search
                ? 'Try: "crawl", "distributed", "mozilla", "github", or "node"'
                : 'Start a crawl from the dashboard to begin indexing pages.'}
            </p>
          </div>
        )}

        {/* Results table */}
        {!loading && pages.length > 0 && (
          <div className="table-responsive">
            <table className="crawls-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Resource</th>
                  <th style={{ width: '25%' }}>Metadata</th>
                  <th style={{ width: '20%' }}>Indexed At</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 500, color: '#f8fafc' }}>
                          {highlight(p.title || 'Untitled', search)}
                        </span>
                        <a href={p.url} target="_blank" rel="noreferrer" style={{
                          fontSize: '0.78rem', color: '#7ab4f5', textDecoration: 'none',
                          maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {highlight(p.url, search)}
                        </a>
                      </div>
                    </td>
                    <td></td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        {new Date(p.indexedAt || p.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => setInspectPage(p)}
                        className="btn btn-ghost" 
                        style={{ fontSize: '0.82rem', color: '#a78bfa', padding: '0.4rem 0.8rem' }}
                      >
                        Inspect &gt;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pages.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '1rem 1.5rem',
            borderTop: '1px solid var(--glass-border)'
          }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Page {pagination.page} of {totalPages}
              {' '}({pagination.total.toLocaleString()} total)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-outline"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: '0.4rem 1rem' }}>
                ← Previous
              </button>
              <button
                className="btn btn-outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '0.4rem 1rem' }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {inspectPage && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setInspectPage(null)}>
          <div style={{
            width: '90%', maxWidth: '700px', maxHeight: '85vh',
            backgroundColor: '#0a0a0f',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: '#f8fafc' }}>
                <span style={{ color: '#a78bfa' }}>#</span> {inspectPage.title || 'Untitled'}
              </h3>
              <button onClick={() => setInspectPage(null)} style={{
                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0
              }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Source URL</div>
                  <a href={inspectPage.url} target="_blank" rel="noreferrer" style={{ color: '#7ab4f5', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', wordBreak: 'break-all' }}>
                    {inspectPage.url} <ExternalLink size={12} />
                  </a>
                </div>
                <div></div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Primary Domain</div>
                  <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{inspectPage.domain}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Ingestion Date</div>
                  <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{new Date(inspectPage.indexedAt || inspectPage.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Meta Description</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {inspectPage.snippet || 'No meta description available.'}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Extracted Vectors / Keywords</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {inspectPage.Keywords && inspectPage.Keywords.length > 0 ? (
                    inspectPage.Keywords.map((tag, i) => (
                      <span key={i} style={{
                        padding: '3px 10px', fontSize: '0.75rem',
                        border: '1px solid rgba(167, 139, 250, 0.2)',
                        borderRadius: '6px', color: '#a78bfa',
                        backgroundColor: 'rgba(167, 139, 250, 0.05)'
                      }}>{tag}</span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>None</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Raw Text Buffer (Preview)</div>
                <pre style={{
                  padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px',
                  fontSize: '0.8rem', color: '#94a3b8',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  maxHeight: '200px', overflowY: 'auto'
                }}>
                  {inspectPage.rawText || inspectPage.snippet || 'No raw text available in preview.'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default IndexView;
