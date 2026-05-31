import React, { useContext } from 'react';
import { Bookmark, Globe, Clock, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr);
  if (diff < 60000)   return `${Math.floor(diff/1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000)return `${Math.floor(diff/3600000)}h ago`;
  return new Date(dateStr).toLocaleDateString();
};

const renderHighlight = (html) => {
  if (!html) return null;
  const parts = html.split('%%%');
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} style={{
        background: 'var(--highlight-bg, rgba(0, 212, 170, 0.15))', 
        color: 'var(--highlight-text, #00d4aa)',
        borderRadius: '2px', padding: '0 2px', fontStyle: 'normal'
      }}>{part}</mark>
    ) : part
  );
};

const ResultCard = ({ result, isBookmarked, onBookmark }) => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleBookmark = (e) => {
    e.stopPropagation();
    if (!user) {
      addToast('Login to bookmark pages.', 'info');
      return;
    }
    if (onBookmark) onBookmark(result);
  };

  return (
    <div 
      onClick={() => navigate(`/page/${result._id}`)}
      style={{
        padding: '1.25rem', background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px', marginBottom: '1rem',
        cursor: 'pointer', transition: 'all 0.15s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.3)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#000', fontSize: '10px', fontWeight: 'bold'
        }}>
          {result.domain?.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
          {result.domain}
          {(() => {
            let path = result.url.replace(`https://${result.domain}`, '').replace(`http://${result.domain}`, '');
            if (path.startsWith('/')) path = path.slice(1);
            return path.length > 0 ? ` › ${path.substring(0, 30)}` : '';
          })()}
        </span>
      </div>

      <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.15rem', fontWeight: 500 }}>
        <span style={{ color: 'var(--link-color, #7ab4f5)', textDecoration: 'none' }}>
          {renderHighlight(result.title)}
        </span>
      </h3>
      
      <p style={{ fontSize: '0.85rem', color: 'var(--url-color, #5a9e6a)', margin: '0 0 0.6rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {result.url}
      </p>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
        {renderHighlight(result.snippet)}
      </p>

      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
        <span style={{ display:'flex', alignItems: 'center', gap: '4px' }}>
          <FileText size={12} /> {(result.wordCount || 0).toLocaleString()} words
        </span>
        <span style={{ display:'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {timeAgo(result.indexedAt)}
        </span>
      </div>

      <button 
        onClick={handleBookmark}
        title={user ? (isBookmarked ? 'Remove Bookmark' : 'Bookmark') : 'Login to bookmark'}
        style={{
          position: 'absolute', top: '1.25rem', right: '1.25rem',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: isBookmarked ? 'var(--accent-color)' : '#64748b'
        }}
      >
        <Bookmark size={18} fill={isBookmarked ? 'var(--accent-color)' : 'transparent'} />
      </button>
    </div>
  );
};
export default ResultCard;
