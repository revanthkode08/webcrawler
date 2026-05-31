import React from 'react';
import { useNavigate } from 'react-router-dom';

const DomainChip = ({ domain, count }) => {
  const navigate = useNavigate();
  if (!domain) return null;
  return (
    <button 
      onClick={() => navigate(`/domain/${domain}`)}
      style={{
        background: 'rgba(0, 212, 170, 0.05)',
        border: '1px solid rgba(0, 212, 170, 0.2)',
        borderRadius: '999px',
        padding: '0.4rem 1.1rem',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s ease',
        marginRight: '0.6rem',
        marginBottom: '0.6rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-color)';
        e.currentTarget.style.boxShadow = '0 0 10px rgba(0,212,170,0.15)';
        e.currentTarget.style.background = 'rgba(0, 212, 170, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.2)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.background = 'rgba(0, 212, 170, 0.05)';
      }}
    >
      <span style={{ 
        width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-color)', 
        color: '#000', fontSize: '10px', fontWeight: 'bold', display: 'flex',
        alignItems: 'center', justifyContent: 'center' 
      }}>
        {domain.charAt(0).toUpperCase()}
      </span>
      {domain}
      {count !== undefined && (
        <span style={{ fontSize: '0.8rem', color: 'rgba(0, 212, 170, 0.8)' }}>
          ({count.toLocaleString()})
        </span>
      )}
    </button>
  );
};
export default DomainChip;
