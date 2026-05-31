import React, { useEffect, useRef, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { authFetch } from '../../api/client';
import { useSocket } from '../../hooks/useSocket';
import { Terminal, Trash2, Download, PauseCircle, PlayCircle } from 'lucide-react';

const LOG_ICONS = {
  success: '✓',
  info:    '→',
  error:   '✗',
  warn:    '⚠'
};

const LOG_COLORS = {
  success: '#22c55e',
  info:    '#00d4aa',
  error:   '#ef4444',
  warn:    '#eab308'
};

const LogStream = () => {
  const [logs, setLogs] = useState([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const bottomRef = useRef(null);
  const { token } = useContext(AuthContext);
  const { socket } = useSocket();

  useEffect(() => {
    authFetch('/api/logs', token, { method: 'GET' })
      .then(data => setLogs(data))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    const handler = (entry) => {
      if (!paused) {
        setLogs(prev => {
          const updated = [...prev, entry];
          return updated.length > 500 ? updated.slice(-500) : updated;
        });
      }
    };
    socket.on('log_entry', handler);
    return () => socket.off('log_entry', handler);
  }, [socket, paused]);

  useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, paused]);

  const filteredLogs = logs.filter(log => {
    const matchType = filter === 'all' || log.type === filter;
    const matchSearch = !search || 
      log.message.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const clearLogs = () => setLogs([]);

  const downloadLogs = () => {
    const text = filteredLogs.map(l =>
      `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.type.toUpperCase()}] ${l.message}`
    ).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crawl-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width:'100%' }}>
      <div className="page-header" style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <Terminal size={22} style={{ color:'var(--accent-color)' }} />
          <div>
            <h2>Live Log Stream</h2>
            <p>Real-time crawler activity — {filteredLogs.length} entries</p>
          </div>
          {!paused && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px',
              color:'#22c55e', fontSize:'0.8rem', fontWeight:600,
              background:'rgba(34,197,94,0.1)', padding:'3px 10px',
              borderRadius:'999px', border:'1px solid rgba(34,197,94,0.2)' }}>
              <span style={{ width:7, height:7, borderRadius:'50%',
                background:'#22c55e', animation:'pulse 1.5s infinite',
                display:'inline-block' }} />
              LIVE
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn btn-outline"
            style={{ padding:'0.4rem 0.8rem' }}
            onClick={() => setPaused(p => !p)}>
            {paused
              ? <><PlayCircle size={16} /> Resume</>
              : <><PauseCircle size={16} /> Pause</>}
          </button>
          <button className="btn btn-outline"
            style={{ padding:'0.4rem 0.8rem' }}
            onClick={downloadLogs}>
            <Download size={16} />
          </button>
          <button className="btn btn-outline"
            style={{ padding:'0.4rem 0.8rem', color:'#ef4444',
              borderColor:'rgba(239,68,68,0.3)' }}
            onClick={clearLogs}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem',
        flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {['all','success','info','warn','error'].map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className="btn"
              style={{
                padding:'0.3rem 0.9rem',
                fontSize:'0.8rem',
                background: filter === f ? 'var(--accent-color)' : 'transparent',
                color: filter === f ? '#000' : '#94a3b8',
                border: `1px solid ${filter === f
                  ? 'var(--accent-color)' : 'var(--glass-border)'}`,
                borderRadius:'999px'
              }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span style={{ marginLeft:'4px' }}>
                  ({logs.filter(l => l.type === f).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Filter logs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background:'var(--glass-bg)',
            border:'1px solid var(--glass-border)',
            borderRadius:'8px',
            padding:'0.3rem 0.8rem',
            color:'var(--text-primary)',
            fontSize:'0.85rem',
            outline:'none',
            width:'200px'
          }}
        />
      </div>

      <div className="glass-panel" style={{
        padding: 0,
        borderRadius: '12px',
        overflow: 'hidden',
        fontFamily: "'JetBrains Mono', 'Courier New', monospace"
      }}>
        <div style={{
          background: '#0d0e1a',
          padding: '0.6rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          <span style={{ width:12, height:12, borderRadius:'50%',
            background:'#ef4444', display:'inline-block' }} />
          <span style={{ width:12, height:12, borderRadius:'50%',
            background:'#eab308', display:'inline-block' }} />
          <span style={{ width:12, height:12, borderRadius:'50%',
            background:'#22c55e', display:'inline-block' }} />
          <span style={{ marginLeft:'0.5rem', fontSize:'0.8rem',
            color:'#475569' }}>websearcher — crawler log stream</span>
        </div>

        <div style={{
          height: '500px',
          overflowY: 'auto',
          padding: '1rem',
          fontSize: '0.82rem',
          lineHeight: '1.8',
          background: '#080910'
        }}>
          {filteredLogs.length === 0 && (
            <div style={{ color:'#475569', textAlign:'center',
              paddingTop:'4rem' }}>
              Waiting for crawler activity...
            </div>
          )}
          {filteredLogs.map((log) => (
            <div key={log.id} style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
              padding: '1px 0',
              borderRadius: '3px'
            }}>
              <span style={{ color:'#475569', flexShrink:0, fontSize:'0.78rem' }}>
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span style={{
                color: LOG_COLORS[log.type],
                flexShrink: 0,
                width: '14px',
                textAlign: 'center',
                fontWeight: 700
              }}>
                {LOG_ICONS[log.type]}
              </span>
              <span style={{ color:'#c9d1d9', wordBreak:'break-word' }}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {paused && (
        <p style={{ color:'#eab308', fontSize:'0.82rem',
          marginTop:'0.5rem', textAlign:'center' }}>
          ⏸ Stream paused — new logs buffered. Click Resume to continue.
        </p>
      )}
    </div>
  );
};

export default LogStream;
