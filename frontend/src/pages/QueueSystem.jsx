import React from 'react';
import { useSocket } from '../hooks/useSocket';

const QueueSystem = () => {
  const { queue, history } = useSocket();

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <h2>Queue System</h2>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'#22c55e', fontSize:'0.85rem', fontWeight:600 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'pulse 1.5s infinite' }} />
            LIVE
          </div>
        </div>
        <p>Inspect queue depth, throughput, and task distribution across the system.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {!queue ? <p className="text-secondary">Waiting for live data...</p> : (
          <>
            <div className="dashboard-grid" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Tasks', value: queue.total },
                { label: 'Pending', value: queue.pending },
                { label: 'Processing', value: queue.processing },
                { label: 'Completed', value: queue.completed },
                { label: 'Failed', value: queue.failed }
              ].map((item) => (
                <div key={item.label} className="stat-card glass-panel" style={{ flex: 1 }}>
                  <p className="stat-title">{item.label}</p>
                  <p className="stat-value">{item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="table-responsive">
              <table className="crawls-table">
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Domain</th>
                    <th>Status</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.items?.length > 0 ? queue.items.map((item) => (
                    <tr key={item._id}>
                      <td className="domain-cell">{item.url}</td>
                      <td>{item.domain}</td>
                      <td>
                        <span className={`status-badge ${
                          item.status === 'pending' ? 'badge-warning' :
                          item.status === 'processing' ? 'badge-teal' :
                          item.status === 'completed' ? 'badge-success' :
                          item.status === 'failed' ? 'badge-danger' : ''
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.priority}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center' }}>No queue items found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {(history || []).length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3>Recent Queue Activity</h3>
            <div className="table-responsive">
              <table className="crawls-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Crawled</th>
                    <th>Queued</th>
                  </tr>
                </thead>
                <tbody>
                  {(history || []).map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.name}</td>
                      <td>{entry.crawled.toLocaleString()}</td>
                      <td>{entry.queued.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueSystem;
