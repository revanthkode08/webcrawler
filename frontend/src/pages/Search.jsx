import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, ExternalLink, Clock, FileText } from 'lucide-react';
import './Search.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTime, setSearchTime] = useState(0);

  const limit = 10;

  useEffect(() => {
    if (!query) return;
    const start = Date.now();
    setLoading(true);
    setError('');

    fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
      .then(r => r.json())
      .then(data => {
        if (data.message) throw new Error(data.message);
        setResults(data.data || []);
        setTotal(data.total || 0);
        setSearchTime(((Date.now() - start) / 1000).toFixed(2));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setPage(1);
    setQuery(inputVal.trim());
    setSearchParams({ q: inputVal.trim() });
  };

  const renderHighlighted = (text) => {
    if (!text) return null;
    const parts = text.split('%%%');
    return parts.map((part, i) =>
      i % 2 === 1
        ? <mark key={i} className="search-highlight">{part}</mark>
        : <span key={i}>{part}</span>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="search-page">
      <header className="search-header">
        <Link to="/" className="search-logo">
          Web<span className="text-gradient">searcher</span>
        </Link>
        <form onSubmit={handleSearch} className="search-bar-form">
          <div className="search-bar-wrapper">
            <SearchIcon size={18} className="search-bar-icon" />
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Search indexed pages..."
              className="search-bar-input"
              autoFocus
            />
            <button type="submit" className="search-bar-btn">Search</button>
          </div>
        </form>
        <Link to="/dashboard" className="btn btn-outline" 
          style={{ fontSize:'0.85rem', padding:'0.4rem 1rem' }}>
          Dashboard
        </Link>
      </header>

      <main className="search-main">
        {query && !loading && !error && (
          <p className="search-stats">
            About <strong>{total.toLocaleString()}</strong> results for{' '}
            <strong>"{query}"</strong> ({searchTime}s)
          </p>
        )}

        {loading && (
          <div className="search-loading">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="search-skeleton">
                <div className="skeleton-url" />
                <div className="skeleton-title" />
                <div className="skeleton-snippet" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="search-error">
            <p>{error}</p>
            <p style={{ fontSize:'0.85rem', color:'#94a3b8', marginTop:'0.5rem' }}>
              Try a different search term or start a crawl first.
            </p>
          </div>
        )}

        {!loading && !error && query && results.length === 0 && (
          <div className="search-empty">
            <SearchIcon size={48} style={{ opacity:0.3, marginBottom:'1rem' }} />
            <h3>No results for "{query}"</h3>
            <p>Try different keywords or crawl more pages from the dashboard.</p>
            <Link to="/dashboard" className="btn btn-primary" 
              style={{ marginTop:'1rem' }}>
              Start a Crawl
            </Link>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="search-results">
            {results.map((result, i) => (
              <div key={result._id || i} className="search-result-card">
                <div className="result-domain">
                  <span className="domain-favicon">
                    {result.domain?.charAt(0).toUpperCase()}
                  </span>
                  <span className="domain-text">{result.domain}</span>
                </div>
                <h3 className="result-title">
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    {renderHighlighted(result.title)}
                    <ExternalLink size={12} style={{ marginLeft:'6px', opacity:0.5 }} />
                  </a>
                </h3>
                <p className="result-url">{result.url}</p>
                <p className="result-snippet">
                  {renderHighlighted(result.snippet)}
                </p>
                <div className="result-meta">
                  <span><FileText size={12} /> {result.wordCount?.toLocaleString()} words</span>
                  <span><Clock size={12} /> {new Date(result.indexedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="search-pagination">
            <button
              className="btn btn-outline"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button
              className="btn btn-outline"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >Next</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;
