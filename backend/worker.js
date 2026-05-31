require('dotenv').config();
const mongoose = require('mongoose');
const crawlerService = require('./services/crawler');
const Queue = require('./models/Queue');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/webcrawler';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log(`[Worker ${process.pid}] Connected to MongoDB`);
    
    // We do NOT clear the queue on restart for workers, 
    // unless they crashed while processing. 
    // A more robust system would use a timeout or lock, 
    // but for simplicity we'll let the worker pick up 'pending' tasks.
    
    // Start polling the queue manually if not already running
    setInterval(async () => {
      if (!crawlerService.isRunning) {
        const hasPending = await Queue.exists({ status: 'pending' });
        if (hasPending) {
          crawlerService.startCrawling();
        }
      }
    }, 5000);
    
    // Start immediately if there are pending jobs
    const initialPending = await Queue.exists({ status: 'pending' });
    if (initialPending) {
      crawlerService.startCrawling();
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));
