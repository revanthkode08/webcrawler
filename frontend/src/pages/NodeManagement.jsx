import React from 'react';
import { useSocket } from '../hooks/useSocket';

const formatUptime = (s) => `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;

const NodeManagement = () => {
  const { nodes } = useSocket();

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Node Management</h2>
        <p>Monitor crawler nodes, worker status, and cluster health.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', minHeight: '320px' }}>
        {!nodes || nodes.length === 0 ? <p className="text-secondary">Connecting to nodes...</p> : (
          <div className="table-responsive">
            <table className="crawls-table">
              <thead>
                <tr>
                  <th>Node</th>
                  <th>Status</th>
                  <th>CPU</th>
                  <th>Memory</th>
                  <th>Pages</th>
                  <th>Uptime</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr key={node._id}>
                    <td>{node.nodeId}</td>
                    <td><span className={`status-badge ${node.status === 'online' ? 'badge-success' : 'badge-danger'}`}>{node.status}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ flex:1, background:'#1e2035', borderRadius:'4px', height:'6px', overflow:'hidden' }}>
                          <div style={{ width:`${node.cpu}%`, height:'100%', background:'var(--accent-color)', transition:'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize:'0.8rem', minWidth:'36px' }}>{node.cpu}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ flex:1, background:'#1e2035', borderRadius:'4px', height:'6px', overflow:'hidden' }}>
                          <div style={{ width:`${node.memory}%`, height:'100%', background:'var(--accent-color)', transition:'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize:'0.8rem', minWidth:'36px' }}>{node.memory}%</span>
                      </div>
                    </td>
                    <td>{node.pagesProcessed?.toLocaleString() ?? 0}</td>
                    <td>{formatUptime(node.uptime || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeManagement;
