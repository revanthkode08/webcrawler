import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="container">
      <div className="logo">
        Web<span className="text-gradient">searcher</span>
      </div>
      <div className="nav-links">
        <a href="#features">Features</a>
        <a href="#advanced">Advanced Concepts</a>
        <Link to="/dashboard" className="btn btn-outline" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>Dashboard</Link>
      </div>
    </nav>
  );
};

export default Navbar;
