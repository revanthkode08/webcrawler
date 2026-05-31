import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ 
  size = 'large', 
  initialValue = '', 
  onSearch, 
  showSuggestions = false, 
  placeholder = 'Search...' 
}) => {
  const [val, setVal] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { setVal(initialValue); }, [initialValue]);

  const commitSearch = (query) => {
    if (!query) return;
    try {
      const hist = JSON.parse(localStorage.getItem('search_history') || '[]');
      const updated = [query, ...hist.filter(h => h !== query)].slice(0, 6);
      localStorage.setItem('search_history', JSON.stringify(updated));
    } catch(err) {}
    if (onSearch) onSearch(query);
  };

  useEffect(() => {
    if (!showSuggestions) return;
    if (val.trim().length < 1) {
      if (showDropdown) {
        try {
          const hist = JSON.parse(localStorage.getItem('search_history') || '[]');
          setSuggestions(hist.map(h => ({ text: h, type: 'history' })));
        } catch(err) { setSuggestions([]); }
      }
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
        }
      } catch (err) { }
    }, 300);
    return () => clearTimeout(timer);
  }, [val, showSuggestions, showDropdown]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setShowDropdown(false);
    if (val.trim()) commitSearch(val.trim());
  };

  const topSugObj = suggestions.length > 0 ? suggestions[0] : null;
  const topSug = topSugObj ? (typeof topSugObj === 'string' ? topSugObj : topSugObj.text) : '';
  let autoFillText = '';
  if (topSug && val && topSug.toLowerCase().startsWith(val.toLowerCase()) && val.trim().length >= 2) {
     autoFillText = val + topSug.substring(val.length);
  }

  const onKeyDown = (e) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && autoFillText && val !== autoFillText && e.target.selectionEnd === val.length) {
      e.preventDefault();
      setVal(autoFillText);
      return;
    }
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        const activeSug = suggestions[activeIndex];
        const textVal = typeof activeSug === 'string' ? activeSug : activeSug.text;
        setVal(textVal);
        commitSearch(textVal);
        setShowDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const isLarge = size === 'large';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: isLarge ? '600px' : '400px' }}>
      <form onSubmit={handleSubmit} style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: isLarge ? '26px' : '19px',
        height: isLarge ? '52px' : '38px',
        padding: isLarge ? '0 1rem 0 1.25rem' : '0 0.75rem 0 1rem',
        transition: 'all 0.2s',
        boxShadow: val ? '0 0 0 1px rgba(0, 212, 170, 0.4)' : 'none'
      }}>
        <SearchIcon size={isLarge ? 20 : 16} style={{ color: 'var(--text-secondary)' }} />
        <div style={{ position: 'relative', flex: 1, marginLeft: '10px', height: '100%', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={autoFillText}
            readOnly
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-secondary)', opacity: 0.4,
              fontSize: isLarge ? '1.1rem' : '0.95rem',
              width: '100%', pointerEvents: 'none', zIndex: 1
            }}
          />
          <input 
            type="text" 
            value={val}
            onChange={e => {
              setVal(e.target.value);
              setShowDropdown(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onClick={() => setShowDropdown(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            style={{
              position: 'relative', zIndex: 2,
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)',
              fontSize: isLarge ? '1.1rem' : '0.95rem',
              width: '100%'
            }}
          />
        </div>
        {val && (
          <button type="button" onClick={() => { setVal(''); setSuggestions([]); }}
            style={{ background:'transparent', border:'none', color:'var(--text-secondary)', cursor:'pointer', padding: '4px' }}>
            <X size={16} />
          </button>
        )}
      </form>
      
      {showSuggestions && showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: '8px', background: 'var(--bg-color)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px', overflow: 'hidden', zIndex: 10,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          {suggestions.map((sug, i) => {
            const isObj = typeof sug === 'object' && sug !== null;
            const textVal = isObj ? sug.text : sug;
            const isHistory = isObj && sug.type === 'history';
            return (
              <div key={i} onClick={() => {
                  setVal(textVal);
                  setShowDropdown(false);
                  commitSearch(textVal);
                }}
                style={{
                  padding: '0.75rem 1.25rem', cursor: 'pointer',
                  background: i === activeIndex ? 'rgba(0, 212, 170, 0.15)' : 'transparent',
                  color: i === activeIndex ? 'var(--accent-color)' : 'var(--text-primary)'
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {isHistory ? (
                  <History size={14} style={{ marginRight: '10px', opacity: 0.5, display: 'inline-block', verticalAlign:'middle' }} />
                ) : (
                  <SearchIcon size={14} style={{ marginRight: '10px', opacity: 0.5, display: 'inline-block', verticalAlign:'middle' }} />
                )}
                {textVal}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
