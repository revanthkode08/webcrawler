import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/user/UserNavbar';
import { AuthContext } from '../../context/AuthContext';
import { authFetch } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Trash2, Bookmark, Search, History } from 'lucide-react';
import './UserAccount.css';

const UserAccount = () => {
  const { user, token } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('bookmarks');
  const [data, setData] = useState({ bookmarks: [], savedSearches: [], searchHistory: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login?returnUrl=/account', { replace: true });
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const d = await authFetch('/api/account', token);
        setData(d);
      } catch (err) {}
      setLoading(false);
    };
    fetchData();
  }, [token, navigate]);

  const removeBookmark = async (id) => {
    try {
      await authFetch(`/api/account/bookmarks/${id}`, token, { method: 'DELETE' });
      setData(prev => ({ ...prev, bookmarks: prev.bookmarks.filter(b => b.pageId._id !== id) }));
      addToast('Bookmark removed', 'success');
    } catch(err) {}
  };

  const removeSavedSearch = async (id) => {
    try {
      await authFetch(`/api/account/searches/${id}`, token, { method: 'DELETE' });
      setData(prev => ({ ...prev, savedSearches: prev.savedSearches.filter(s => s._id !== id) }));
      addToast('Saved search removed', 'success');
    } catch(err) {}
  };

  const clearHistory = async () => {
    if (!window.confirm('Clear all search history?')) return;
    try {
      await authFetch('/api/account/history', token, { method: 'DELETE' });
      setData(prev => ({ ...prev, searchHistory: [] }));
      addToast('History cleared', 'success');
    } catch(err) {}
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    if (diff < 60000)   return `${Math.floor(diff/1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000)return `${Math.floor(diff/3600000)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (!user || loading) return <div className="account-page"><UserNavbar /><div style={{padding:'3rem', textAlign:'center', color: 'var(--text-secondary)'}}>Loading...</div></div>;

  return (
    <div className="account-page">
      <UserNavbar />
      <div className="account-container">
        
        <div className="glass-panel account-hero">
          <div className="account-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: '0 0 0.25rem 0' }}>Welcome back, {user.username}</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="tabs-container">
          <div className="tabs-header">
            <button className={`tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`} onClick={() => setActiveTab('bookmarks')}>
              <Bookmark size={16} /> Bookmarks
            </button>
            <button className={`tab-btn ${activeTab === 'savedSearches' ? 'active' : ''}`} onClick={() => setActiveTab('savedSearches')}>
              <Search size={16} /> Saved Searches
            </button>
            <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <History size={16} /> History
            </button>
          </div>

          <div className="tab-content glass-panel">
            
            {activeTab === 'bookmarks' && (
              <div className="account-list">
                {data.bookmarks.length === 0 ? (
                  <div className="empty-state">No bookmarks yet. Search and bookmark pages.</div>
                ) : (
                  data.bookmarks.map(b => (
                    <div key={b._id} className="account-list-item" onClick={() => navigate(`/page/${b.pageId._id}`)}>
                      <div className="item-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{b.domain} › {b.url.replace(`https://${b.domain}`, '')}</span>
                        </div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--link-color)', fontSize: '1.05rem', fontWeight: 500 }}>{b.title || 'Untitled'}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Saved {timeAgo(b.savedAt)}</div>
                      </div>
                      <button className="del-btn" onClick={(e) => { e.stopPropagation(); removeBookmark(b.pageId._id); }} title="Remove Bookmark">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'savedSearches' && (
              <div className="account-list">
                {data.savedSearches.length === 0 ? (
                  <div className="empty-state">No saved searches.</div>
                ) : (
                  data.savedSearches.map(s => (
                    <div key={s._id} className="account-list-item" onClick={() => navigate(`/search?q=${encodeURIComponent(s.query)}`)}>
                      <div className="item-content">
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem' }}>"{s.query}" <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 'normal' }}>({s.resultCount} results)</span></h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Searched {timeAgo(s.searchedAt)}</div>
                      </div>
                      <button className="del-btn" onClick={(e) => { e.stopPropagation(); removeSavedSearch(s._id); }} title="Remove Saved Search">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {data.searchHistory.length > 0 && (
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" onClick={clearHistory} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', padding: '0.4rem 1rem' }}>Clear All History</button>
                  </div>
                )}
                <div className="account-list">
                  {data.searchHistory.length === 0 ? (
                    <div className="empty-state">No recent search history.</div>
                  ) : (
                    data.searchHistory.map((h, i) => (
                      <div key={i} className="account-list-item" onClick={() => navigate(`/search?q=${encodeURIComponent(h.query)}`)}>
                        <div className="item-content">
                          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 500 }}>{h.query}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{timeAgo(h.searchedAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
export default UserAccount;
