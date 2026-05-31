import React from 'react';
import './Features.css';

const Features = () => {
  const features = [
    {
      title: 'Crawl Websites',
      description: 'Distributed architecture allows you to crawl thousands of websites concurrently with intelligent politeness delays.',
      icon: '🌐'
    },
    {
      title: 'Store Page Content',
      description: 'Efficiently capture and store raw HTML, metadata, and assets into your MongoDB clusters.',
      icon: '💾'
    },
    {
      title: 'Extract Links',
      description: 'Automatic outlink extraction and prioritization using advanced queue systems to discover new content.',
      icon: '🔗'
    },
    {
      title: 'Build Search Index',
      description: 'Parse content and build comprehensive search indexes ready for querying by your end users.',
      icon: '🔍'
    }
  ];

  return (
    <section id="features" className="features-section container">
      <h2>Core <span className="text-gradient">Features</span></h2>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div className="glass-panel feature-card" key={index}>
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
