import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { authFetch } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../hooks/useSocket';
import { Calendar, Trash2, Pause, Play, Plus } from 'lucide-react';

const Scheduler = () => {
  const { token } = useContext(AuthContext);
  const { addToast } = useToast();
  const { socket } = useSocket();

  const [schedules, setSchedules] = useState([]);
  const [presets, setPresets] = useState([]);
  const [now, setNow] = useState(Date.now());

  const [seedUrl, setSeedUrl] = useState('');
  const [useCustomCron, setUseCustomCron] = useState(false);
  const [cronExpr, setCronExpr] = useState('');
  const [label, setLabel] = useState('');
  const [maxPages, setMaxPages] = useState(100);
  const [threads, setThreads] = useState(3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await authFetch('/api/schedules', token, { method: 'GET' });
      setSchedules(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPresets = async () => {
    try {
      const data = await authFetch('/api/schedules/presets', token, { method: 'GET' });
      setPresets(data);
      if (data.length > 0 && !cronExpr) {
        setCronExpr(data[0].cron);
        setLabel(data[0].label);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      loadSchedules();
      loadPresets();
    }
    const interval = setInterval(() => {
      if (token) loadSchedules();
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      addToast(`Scheduled crawl started: ${data.domain}`, 'success');
      loadSchedules();
    };
    socket.on('scheduled_crawl_started', handler);
    return () => socket.off('scheduled_crawl_started', handler);
  }, [socket, addToast]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authFetch('/api/schedules', token, {
        method: 'POST',
        body: JSON.stringify({ seedUrl, cronExpr, label: useCustomCron ? 'Custom' : label, maxPages, threads })
      });
      addToast('Crawl scheduled!', 'success');
      setSeedUrl('');
      loadSchedules();
    } catch (err) {
      addToast(err.message || 'Error creating schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = async (id) => {
    try {
      await authFetch(`/api/schedules/${id}/toggle`, token, { method: 'PATCH' });
      loadSchedules();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const deleteSchedule = async (id) => {
    try {
      await authFetch(`/api/schedules/${id}`, token, { method: 'DELETE' });
      addToast('Schedule deleted', 'success');
      loadSchedules();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const timeUntil = (nextRun) => {
    if (!nextRun) return 'Unknown';
    const diff = new Date(nextRun) - now;
    if (diff <= 0) return 'Running soon...';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2><Calendar size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Crawl Scheduler</h2>
        <p>Automate recurring crawls for domains on a continuous basis.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3>Create New Schedule</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Seed URL</label>
            <input type="url" required style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: '#fff' }} value={seedUrl} onChange={e => setSeedUrl(e.target.value)} placeholder="https://example.com" />
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Frequency</label>
              {!useCustomCron ? (
                <select style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: '#fff' }} value={cronExpr} onChange={e => {
                  setCronExpr(e.target.value);
                  setLabel(e.target.options[e.target.selectedIndex].text);
                }}>
                  {presets.map(p => <option key={p.cron} value={p.cron}>{p.label}</option>)}
                </select>
              ) : (
                <input type="text" required style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: '#fff' }} value={cronExpr} onChange={e => setCronExpr(e.target.value)} placeholder="0 0 * * *" />
              )}
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={useCustomCron} onChange={e => setUseCustomCron(e.target.checked)} />
                Custom Cron Expr
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Max Pages ({maxPages})</label>
              <input type="number" min="10" max="10000" style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: '#fff' }} value={maxPages} onChange={e => setMaxPages(Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Threads ({threads})</label>
              <input type="range" min="1" max="6" style={{ width: '100%', marginTop: '0.5rem' }} value={threads} onChange={e => setThreads(Number(e.target.value))} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Schedule Crawl
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3>Active Schedules</h3>
        {schedules.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No active schedules found.</p>
        ) : (
          <div className="table-responsive" style={{ marginTop: '1rem' }}>
            <table className="crawls-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Frequency</th>
                  <th>Last Run</th>
                  <th>Next Run</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(sch => (
                  <tr key={sch._id}>
                    <td>{sch.domain}</td>
                    <td>{sch.label || sch.cronExpr}</td>
                    <td>{sch.lastRun ? new Date(sch.lastRun).toLocaleString() : 'Never'}</td>
                    <td>{sch.enabled ? timeUntil(sch.nextRun) : '-'}</td>
                    <td>
                      <span className={`status-badge ${sch.enabled ? 'badge-success' : 'badge-danger'}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                        {sch.enabled ? 'Enabled' : 'Paused'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.3rem 0.5rem' }} onClick={() => toggleSchedule(sch._id)}>
                          {sch.enabled ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.3rem 0.5rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }} onClick={() => deleteSchedule(sch._id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
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

export default Scheduler;
