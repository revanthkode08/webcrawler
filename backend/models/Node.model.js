const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['online', 'offline'], default: 'online' },
  cpu: { type: Number, default: 0 },
  memory: { type: Number, default: 0 },
  pagesProcessed: { type: Number, default: 0 },
  uptime: { type: Number, default: 0 },
  lastHeartbeat: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Node', nodeSchema);
