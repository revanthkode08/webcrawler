import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/DashboardHome';
import ActiveCrawls from './pages/ActiveCrawls';
import IndexView from './pages/IndexView';
import NodeManagement from './pages/NodeManagement';
import QueueSystem from './pages/QueueSystem';
import Search from './pages/Search';
import CrawlGraph from './pages/dashboard/CrawlGraph';
import Scheduler from './pages/dashboard/Scheduler';
import LogStream from './pages/dashboard/LogStream';
import ProtectedRoute from './components/ProtectedRoute';

import UserHome from './pages/user/UserHome';
import SearchResults from './pages/user/SearchResults';
import DomainExplorer from './pages/user/DomainExplorer';
import PageDetail from './pages/user/PageDetail';
import PublicStats from './pages/user/PublicStats';
import UserAccount from './pages/user/UserAccount';

const RootRedirect = () => {
  const { user, token } = useContext(AuthContext);
  if (!token) return <Navigate to="/home" replace />;
  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/home" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/home" element={<UserHome />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/domain/:domain" element={<DomainExplorer />} />
        <Route path="/page/:id" element={<PageDetail />} />
        <Route path="/stats" element={<PublicStats />} />
        <Route path="/account" element={<UserAccount />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="active-crawls" element={<ActiveCrawls />} />
          <Route path="index-view" element={<IndexView />} />
          <Route path="node-management" element={<NodeManagement />} />
          <Route path="queue-system" element={<QueueSystem />} />
          <Route path="graph/:crawlId" element={<CrawlGraph />} />
          <Route path="scheduler" element={<Scheduler />} />
          <Route path="logs" element={<LogStream />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
