import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/user/UserNavbar';
import { AuthContext } from '../../context/AuthContext';
import { authFetch } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, ExternalLink, Bookmark, Clock, FileText, Globe, Share2 } from 'lucide-react';
import './PageDetail.css';

const PageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const { addToast } = useToast();

  const [page, setPage] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/page/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPage(data.page);
          setRelated(data.related || []);
        } else {
          setPage(null);
        }
      } catch (err) {}
      setLoading(false);
    };
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (token && page) {
      authFetch('/api/account', token).then(data => {
        if (data && data.bookmarks) {
          setIsBookmarked(data.bookmarks.some(b => b.pageId._id === page._id || b.pageId === page._id));
        }
      }).catch(()=>{});
    }
  }, [token, page]);

  const handleBookmark = async () => {
    if (!token) {
      addToast('Login to bookmark pages', 'info');
      return;
    }
    try {
      if (isBookmarked) {
        await authFetch(`/api/account/bookmarks/${page._id}`, token, { method: 'DELETE' });
        setIsBookmarked(false);
        addToast('Bookmark removed', 'success');
      } else {
        await authFetch(`/api/account/bookmarks`, token, {
          method: 'POST',
          body: JSON.stringify({ pageId: page._id, url: page.url, title: page.title, domain: page.domain })
        });
        setIsBookmarked(true);
        addToast('Page bookmarked!', 'success');
      }
    } catch(err) {}
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('URL Copied to clipboard!', 'success');
  };

  if (loading) {
    return (
      <div className="page-detail-layout">
        <UserNavbar />
        <div className="page-detail-container" style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="page-detail-layout">
        <UserNavbar />
        <div className="page-detail-container glass-panel" style={{ textAlign: 'center', padding: '4rem', marginTop: '2rem' }}>
          <h2>Page Not Found</h2>
          <button className="btn btn-primary" onClick={() => navigate('/home')} style={{ marginTop: '1rem' }}>Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-detail-layout">
      <UserNavbar />
      <div className="page-detail-container">
        <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem', padding: '0.4rem 1rem' }}>
          <ArrowLeft size={16} style={{ marginRight: '0.5rem' }}/> Back to results
        </button>

        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-color)', color: '#000', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {page.domain?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{page.domain}</div>
              <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 600, color: 'var(--link-color)' }}>{page.title || 'Untitled'}</h1>
              <a href={page.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.9rem', color: 'var(--url-color)', borderColor: 'rgba(90, 158, 106, 0.3)' }}>
                Visit Original Page <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '300px' }}>
            <h4 style={{ letterSpacing: '1px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>CONTENT PREVIEW</h4>
            <div className="glass-panel" style={{ padding: '1.5rem', color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '2rem' }}>
              <p>{page.snippet || `A page from ${page.domain} indexed by Websearcher distributed crawler.`}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={handleBookmark} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', opacity: isBookmarked ? 0.8 : 1 }}>
                <Bookmark size={16} fill={isBookmarked ? '#fff' : 'none'}/> {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button className="btn btn-outline" onClick={() => navigate(`/domain/${page.domain}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={16}/> Search this domain
              </button>
              <button className="btn btn-outline" onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={16}/> Share
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h4 style={{ letterSpacing: '1px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>METADATA</h4>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Clock size={16} style={{ marginTop: '2px' }}/> 
                  <div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Indexed On</div>
                    <div style={{ color: 'var(--text-primary)' }}>{new Date(page.indexedAt).toLocaleString()}</div>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <FileText size={16} style={{ marginTop: '2px' }}/> 
                  <div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Word Count</div>
                    <div style={{ color: 'var(--text-primary)' }}>{(page.wordCount || 0).toLocaleString()} words</div>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Globe size={16} style={{ marginTop: '2px' }}/> 
                  <div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Domain</div>
                    <div style={{ color: 'var(--text-primary)' }}>{page.domain}</div>
                  </div>
                </li>
              </ul>
            </div>

            {related.length > 0 && (
              <>
                <h4 style={{ letterSpacing: '1px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', marginTop: '2rem' }}>MORE FROM {page.domain.toUpperCase()}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {related.map(r => (
                    <div key={r._id} className="glass-panel related-card" onClick={() => navigate(`/page/${r._id}`)}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--link-color)', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title || 'Untitled'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--url-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.url.replace(`https://${r.domain}`, '')}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PageDetail;
