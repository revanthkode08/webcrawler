import React, { useState, useEffect } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import './AiSearchSummary.css';

const AiSearchSummary = ({ query }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query) return;

    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      setSummary('');
      try {
        const u = new URLSearchParams({ q: query });
        const res = await fetch(`/api/search/ai-summary?${u.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary || '');
        } else {
          setError('Failed to load AI overview.');
        }
      } catch (err) {
        setError('Error fetching AI overview.');
      } finally {
        setLoading(false);
      }
    };

    // Debounce slightly in case of rapid typing if used outside Results directly
    const timer = setTimeout(() => {
      fetchSummary();
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  if (!query) return null;
  if (!loading && !summary && !error) return null;

  return (
    <div className="ai-summary-container glass-panel">
      <div className="ai-summary-header">
        <Sparkles size={18} className="ai-sparkle-icon" />
        <span className="ai-summary-title">AI Overview</span>
      </div>
      <div className="ai-summary-content">
        {loading ? (
          <div className="ai-loading">
            <Loader size={16} className="spinner" /> Generating summary for "{query}"...
          </div>
        ) : error ? (
          <div className="ai-error">{error}</div>
        ) : (
          <p className="ai-text">{summary}</p>
        )}
      </div>
    </div>
  );
};

export default AiSearchSummary;
