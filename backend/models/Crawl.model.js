const mongoose = require('mongoose');

const crawlSchema = new mongoose.Schema({
  domain: { type: String, required: true, trim: true },
  seedUrl: { type: String, required: true, trim: true },
  status: { type: String, enum: ['queued', 'running', 'completed', 'failed'], default: 'queued' },
  pages: { type: Number, default: 0 },
  maxPages: { type: Number, default: 100 },
  threads: { type: Number, default: 3 },
  elapsed: { type: Number, default: 0 },
  startedAt: { type: Date },
  completedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

crawlSchema.virtual('progressPercent').get(function () {
  return ((this.pages / this.maxPages) * 100).toFixed(1);
});

crawlSchema.index({ status: 1, domain: 1, createdAt: -1 });

module.exports = mongoose.model('Crawl', crawlSchema);
