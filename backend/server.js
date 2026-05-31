require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const crawlRoutes = require('./routes/crawl.routes');
const nodeRoutes = require('./routes/node.routes');
const indexRoutes = require('./routes/index.routes');
const queueRoutes = require('./routes/queue.routes');
const searchRoutes = require('./routes/search.routes');
const logger = require('./services/logger.service');
const { loadAllSchedules } = require('./services/scheduler.service');
const { startSimulator } = require('./simulator/crawler.simulator');
const realCrawler = require('./services/realCrawler.service');

const app = express();
const server = http.createServer(app);

// CORS allowed origins - supports both local development and production
const allowedOrigins = [
  'http://localhost:5173',  // Local development
  'https://webcrawler-red.vercel.app'  // Production
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

const PORT = process.env.PORT || 5000;

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/crawls', crawlRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/index', indexRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/public', searchRoutes);
app.use('/api/domain', searchRoutes);
app.use('/api/page', searchRoutes);
app.use('/api/account', require('./routes/userAccount.routes'));
app.use('/api/graph', require('./routes/graph.routes'));
app.use('/api/schedules', require('./routes/schedule.routes'));
app.use('/api/logs', require('./routes/logs.routes'));

app.use(errorHandler);

// FIX 1: Move logger.setIO outside so it only runs once at startup, not on every client connection
logger.setIO(io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// FIX 2: Memory monitor to auto-restart via nodemon before OOM crash
setInterval(() => {
  const heapUsedMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);
  if (heapUsedMB > 400) {
    console.warn(`[MEMORY] Heap: ${heapUsedMB}MB used / ${heapTotalMB}MB total`);
  }
  if (heapUsedMB > 1500) {
    console.error(`[MEMORY] CRITICAL: ${heapUsedMB}MB - Exiting for clean nodemon restart...`);
    process.exit(1);
  }
}, 30000);

const startApp = async () => {
  await connectDB();

  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const col = db.collection('indexedpages');
    const indexes = await col.indexes();
    const hasTextIndex = indexes.some(idx =>
      Object.values(idx.key || {}).includes('text')
    );
    if (!hasTextIndex) {
      await col.createIndex(
        { title: 'text', url: 'text', domain: 'text' },
        { name: 'search_text_index' }
      );
      console.log('Text index auto-created on indexedpages');
    }
  } catch (e) {
    console.warn('Could not auto-create text index:', e.message);
  }

  await startSimulator(io);
  await loadAllSchedules(io);

  realCrawler.start();

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startApp();
