import React from 'react';
import { useOutletContext } from 'react-router-dom';
import StatCards from '../components/dashboard/StatCards';
import ActiveCrawlsTable from '../components/dashboard/ActiveCrawlsTable';
import CrawlChart from '../components/dashboard/CrawlChart';

const DashboardHome = () => {
  const { stats, socket } = useOutletContext();

  return (
    <>
      <StatCards stats={stats} />

      <div className="dashboard-grid">
        <div className="chart-container glass-panel">
          <h3>Queue vs Crawled History</h3>
          <CrawlChart />
        </div>

        <div className="table-container glass-panel">
          <h3>Active Crawl Jobs</h3>
          <ActiveCrawlsTable socket={socket} />
        </div>
      </div>
    </>
  );
};

export default DashboardHome;
