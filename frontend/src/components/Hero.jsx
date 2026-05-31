import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  const [heroQuery, setHeroQuery] = useState('');
  const navigate = useNavigate();

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroQuery.trim()) navigate(`/search?q=${encodeURIComponent(heroQuery.trim())}`);
  };
  return (
    <section className="hero container">
      <div className="hero-content">
        <h1>
          Distributed Web Crawler <br />
          <span className="text-gradient">for the Modern Web</span>
        </h1>
        <p>
          A highly extensible, highly scalable, matured, production-ready Web crawler 
          which enables fine grained configuration and accommodates a wide variety of data acquisition tasks. 
          Built on the MERN stack for optimal performance.
        </p>
        <div className="hero-actions" style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
          <Link to="/home" className="btn btn-outline">Try Search</Link>
          <Link to="/login" className="btn btn-outline secondary">Open Dashboard</Link>
        </div>
        
        <form onSubmit={handleHeroSearch} className="hero-search-form" style={{ marginTop: '2rem', maxWidth: '600px', width: '100%' }}>
          <div className="hero-search-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.75rem 0.75rem 0.75rem 1.5rem', borderRadius: '32px', gap: '0.75rem', transition: 'border-color 0.2s', fontSize: '1.1rem' }}>
            <SearchIcon size={20} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder='Try "distributed systems" or "github.com"'
              value={heroQuery}
              onChange={e => setHeroQuery(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '1.1rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '24px', padding: '0.5rem 1.5rem' }}>Search</button>
          </div>
        </form>
      </div>
      <div className="hero-visual">
        <div className="glow-sphere"></div>
        <div className="glass-panel crawler-mockup">
          <div className="mockup-header">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <div className="mockup-body">
            <code>
              <span className="code-accent">[INFO]</span> Initializing Distributed Crawler...<br/>
              <span className="code-accent">[INFO]</span> Connecting to Queue System... OK<br/>
              <span className="code-accent">[INFO]</span> Spawning 50 worker threads...<br/>
              <span className="code-text">&gt; Crawling https://example.com [200 OK]</span><br/>
              <span className="code-text">&gt; Extracted 124 links. Added to index.</span>
            </code>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
