import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useSocket } from '../../hooks/useSocket';

const CrawlChart = () => {
  const { history } = useSocket();
  const data = history || [];

  if (data.length === 0) return <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCrawled" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorQueued" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7000ff" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#7000ff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis dataKey="time" stroke="#a0a0a0" tick={{ fill: '#a0a0a0' }} axisLine={false} tickLine={false} tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
          <YAxis stroke="#a0a0a0" tick={{ fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(5, 5, 5, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Area type="monotone" dataKey="crawled" stroke="#00f0ff" fillOpacity={1} fill="url(#colorCrawled)" />
          <Area type="monotone" dataKey="queued" stroke="#7000ff" fillOpacity={1} fill="url(#colorQueued)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CrawlChart;
