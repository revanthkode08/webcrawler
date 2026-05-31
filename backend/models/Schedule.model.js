const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  seedUrl:     { type: String, required: true },
  domain:      { type: String, required: true },
  cronExpr:    { type: String, required: true },
  label:       { type: String },  // e.g. "Every 6 hours"
  maxPages:    { type: Number, default: 100 },
  threads:     { type: Number, default: 3 },
  enabled:     { type: Boolean, default: true },
  lastRun:     { type: Date },
  nextRun:     { type: Date },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
