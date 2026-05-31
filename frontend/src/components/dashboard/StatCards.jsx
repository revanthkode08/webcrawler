import React from 'react';
import './StatCards.css';

const StatCards = ({ stats }) => {
  if (!stats) return <div className="loading">Loading stats...</div>;

  const cards = [
    { title: 'Total Indexed Pages', value: (stats.totalIndexedPages || 0).toLocaleString(), icon: '📄', color: 'var(--accent-color)' },
    { title: 'Active Threads', value: stats.activeThreads || 0, icon: '⚡', color: 'var(--accent-secondary)' },
    { title: 'Queue Size', value: (stats.queueSize || 0).toLocaleString(), icon: '📋', color: '#ffbd2e' },
    { title: 'Nodes Online', value: stats.nodesOnline || 0, icon: '🖥️', color: '#27c93f' }
  ];

  return (
    <div className="stat-cards-container">
      {cards.map((card, index) => (
        <div className="stat-card glass-panel" key={index}>
          <div className="stat-icon" style={{ color: card.color, borderColor: card.color }}>
            {card.icon}
          </div>
          <div className="stat-info">
            <h4>{card.title}</h4>
            <div className="stat-value">{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
