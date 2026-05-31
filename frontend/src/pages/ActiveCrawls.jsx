import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ActiveCrawlsTable from '../components/dashboard/ActiveCrawlsTable';

const ActiveCrawls = () => {
  const { socket } = useOutletContext();

  return (
    <>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Active Crawls</h2>
        <p>Monitor active crawler jobs and progress in real time.</p>
      </div>

      <div className="dashboard-grid">
        <div className="table-container glass-panel">
          <ActiveCrawlsTable socket={socket} />
        </div>
      </div>
    </>
  );
};

export default ActiveCrawls;
