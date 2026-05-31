import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/user/UserNavbar';
import ResultCard from '../../components/user/ResultCard';
import DomainChip from '../../components/user/DomainChip';
import AiSearchSummary from '../../components/user/AiSearchSummary';
import { AuthContext } from '../../context/AuthContext';
import { authFetch } from '../../api/client';
import './SearchResults.css';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'relevance';
  const domain = searchParams.get('domain') || '';

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeTaken, setTimeTaken] = useState(0);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [topDomains, setTopDomains] = useState([]);

  useEffect(() => {
    if (!query) return;
    const fetchResults = async () => {
      setLoading(true);
      const start = Date.now();
      try {
        const u = new URLSearchParams({ q: query, page, sort, ...(domain ? { domain } : {}) });
        const res = await fetch(`/api/search?${u.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setTotal(data.totalResults || 0);

          if (user && token && page === 1) {
            authFetch('/api/account/searches', token, {
              method: 'POST',
              body: JSON.stringify({ query, resultCount: data.totalResults || 0 })
            }).catch(()=>null);
          }
        }
      } catch (err) {}
      
      setTimeTaken((Date.now() - start) / 1000);
      setLoading(false);
    };

    fetchResults();
  }, [query, page, sort, domain, user, token]);

  useEffect(() => {
    fetch('/api/search/trending').then(r=>r.json()).then(setTopDomains).catch(()=>null);
    if (token) {
      authFetch('/api/account', token).then(data => {
        if (data && data.bookmarks) {
          setBookmarks(new Set(data.bookmarks.map(b => b.pageId._id || b.pageId)));
        }
      }).catch(()=>null);
    }
  }, [token]);

  const handleBookmarkToggle = async (result) => {
    if (!token) return;
    const isBookmarked = bookmarks.has(result._id);
    try {
      if (isBookmarked) {
        await authFetch(`/api/account/bookmarks/${result._id}`, token, { method: 'DELETE' });
        setBookmarks(prev => { const n = new Set(prev); n.delete(result._id); return n; });
      } else {
        await authFetch(`/api/account/bookmarks`, token, {
          method: 'POST',
          body: JSON.stringify({ pageId: result._id, url: result.url, title: result.title, domain: result.domain })
        });
        setBookmarks(prev => { const n = new Set(prev); n.add(result._id); return n; });
      }
    } catch(err) {}
  };

  const updateFilters = (key, val) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set(key, val);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="search-results-page">
      <UserNavbar initialQuery={query} />
      
      <div className="results-container">
        <div className="results-main">
          {/* Header & filters */}
          <div className="results-header">
            <p className="results-stats">
              About {total.toLocaleString()} results for <span className="highlight-text">"{query}"</span> ({timeTaken.toFixed(2)} seconds)
            </p>
            <div className="results-filters">
              <select value={sort} onChange={e => updateFilters('sort', e.target.value)} className="filter-select">
                <option value="relevance">Relevance</option>
                <option value="date">Date Indexed</option>
                <option value="words">Word Count</option>
              </select>
              <select value={domain} onChange={e => updateFilters('domain', e.target.value)} className="filter-select">
                <option value="">All Domains</option>
                {topDomains.map(d => (
                  <option key={d.domain} value={d.domain}>{d.domain}</option>
                ))}
              </select>
            </div>
          </div>

          <AiSearchSummary query={query} />

          {/* Skeletons */}
          {loading && (
            <div className="skeletons">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          )}

          {/* Results loop */}
          {!loading && results.length > 0 && (
            <div className="results-list">
              {results.map(r => (
                <ResultCard 
                  key={r._id} 
                  result={r} 
                  isBookmarked={bookmarks.has(r._id)}
                  onBookmark={handleBookmarkToggle}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && results.length === 0 && (
            <div className="no-results glass-panel">
              <h3>No results found for "{query}"</h3>
              <p>Suggestions:</p>
              <ul>
                <li>Make sure all words are spelled correctly.</li>
                <li>Try different keywords (e.g. crawl, distributed, github).</li>
                <li>Try more general keywords.</li>
              </ul>
              <div style={{ marginTop: '2rem' }}>
                 <button className="btn btn-outline" onClick={() => navigate('/home')}>Return Home</button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => { setSearchParams({ ...Object.fromEntries(searchParams), page: page - 1 }); window.scrollTo(0,0); }} className="btn btn-outline">&larr; Previous</button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => { setSearchParams({ ...Object.fromEntries(searchParams), page: page + 1 }); window.scrollTo(0,0); }} className="btn btn-outline">Next &rarr;</button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="results-sidebar">
          <div className="glass-panel sidebar-card">
            <h4>Search Tips</h4>
            <ul className="tips-list">
              <li>Use specific terms</li>
              <li>Try domain names like <strong>github</strong></li>
              <li>Search titles or excerpts directly</li>
            </ul>
          </div>
          
          <div className="glass-panel sidebar-card" style={{ marginTop: '1rem' }}>
            <h4>Top Domains</h4>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topDomains.map(d => (
                <DomainChip key={d.domain} domain={d.domain} count={d.count} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SearchResults;
