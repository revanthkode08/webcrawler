require('dotenv').config();
const mongoose = require('mongoose');
const crawlerService = require('./services/crawler');
const Queue = require('./models/Queue');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/webcrawler';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log(`[Worker ${process.pid}] Connected to MongoDB`);

    const initialPending = await Queue.exists({ status: 'pending' });
    if (initialPending) {
      crawlerService.startCrawling();
    }

    // FIX 15: Added overlap guard so multiple queue checks don't stack up and crash MongoDB
    let isChecking = false; 
    
    setInterval(async () => {
      // FIX 15: Return immediately if true
      if (isChecking || crawlerService.isRunning) return; 
      
      // FIX 15: Lock
      isChecking = true; 
      try {
        const hasPending = await Queue.exists({ status: 'pending' });
        if (hasPending) {
          crawlerService.startCrawling();
        }
      } catch (err) {
        console.error('[Worker] Queue check error:', err.message);
      } finally {
        // FIX 15: Unlock
        isChecking = false; 
      }
    }, 5000);
  })
  .catch(err => console.error('MongoDB connection error:', err));
