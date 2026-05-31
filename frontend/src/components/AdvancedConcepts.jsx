import React from 'react';
import './AdvancedConcepts.css';

const AdvancedConcepts = () => {
  return (
    <section id="advanced" className="advanced-section container">
      <div className="advanced-header">
        <h2>Advanced <span className="text-gradient">Concepts</span></h2>
        <p>Built from the ground up for massive scale and resilience.</p>
      </div>

      <div className="concept-list">
        <div className="concept-item">
          <div className="concept-content">
            <h3 className="text-gradient">Multi-Threading</h3>
            <p>
              Maximize your hardware utilization. Our crawler spawns intelligent worker threads 
              that process domains concurrently, significantly reducing crawl time while respecting server limits.
            </p>
          </div>
          <div className="concept-visual glass-panel">
            <div className="thread-visual">
              <div className="line main-thread"></div>
              <div className="line sub-thread st-1"></div>
              <div className="line sub-thread st-2"></div>
              <div className="line sub-thread st-3"></div>
            </div>
          </div>
        </div>

        <div className="concept-item reverse">
          <div className="concept-content">
            <h3 className="text-gradient">Queue Systems</h3>
            <p>
              Robust fault tolerance using distributed message queues. Ensure no URL is lost during outages. 
              Prioritize important domains and distribute workload seamlessly across your network.
            </p>
          </div>
          <div className="concept-visual glass-panel">
            <div className="queue-visual">
              <div className="queue-box qb-1"></div>
              <div className="queue-box qb-2"></div>
              <div className="queue-box qb-3"></div>
              <div className="queue-box qb-4"></div>
            </div>
          </div>
        </div>

        <div className="concept-item">
          <div className="concept-content">
            <h3 className="text-gradient">Distributed Crawling</h3>
            <p>
              Scale horizontally by adding more nodes to your cluster. The master node automatically 
              partitions the URL frontier and distributes fetch tasks to worker nodes worldwide.
            </p>
          </div>
          <div className="concept-visual glass-panel">
            <div className="network-visual">
              <div className="node master"></div>
              <div className="node worker w-1"></div>
              <div className="node worker w-2"></div>
              <div className="node worker w-3"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvancedConcepts;
