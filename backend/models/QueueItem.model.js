const mongoose = require('mongoose');

const queueItemSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  domain: { type: String, required: true, trim: true },
  priority: { type: Number, default: 1 },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  crawlId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crawl' },
  parentUrl: { type: String, default: null },
  depth: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
});

queueItemSchema.index({ status: 1, priority: -1, addedAt: -1 });

module.exports = mongoose.model('QueueItem', queueItemSchema);
