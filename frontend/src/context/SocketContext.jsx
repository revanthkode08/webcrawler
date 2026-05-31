import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { useToast } from './ToastContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState(null);
  const [crawls, setCrawls] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [history, setHistory] = useState([]);
  const [queue, setQueue] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));

    newSocket.on('state_update', (data) => {
      if (data.stats) setStats(data.stats);
      if (data.crawls) setCrawls(data.crawls);
      if (data.nodes) setNodes(data.nodes);
      if (data.history) setHistory(data.history);
      if (data.queue) setQueue(data.queue);
    });

    newSocket.on('crawl_started', (crawl) => {
      addToast(`Crawl started for ${crawl.domain}`, 'success');
    });

    newSocket.on('crawl_completed', (crawl) => {
      addToast(`Crawl completed for ${crawl.domain}`, 'success');
    });
    
    newSocket.on('crawl_stopped', () => {
      addToast('Crawl stopped successfully', 'success');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [addToast]);

  return (
    <SocketContext.Provider value={{ socket, connected, stats, crawls, nodes, history, queue }}>
      {children}
    </SocketContext.Provider>
  );
};
