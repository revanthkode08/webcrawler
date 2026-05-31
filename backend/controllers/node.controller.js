const Node = require('../models/Node.model');

exports.getNodes = async (req, res, next) => {
  try {
    const nodes = await Node.find().sort({ nodeId: 1 });
    res.json(nodes);
  } catch (err) {
    next(err);
  }
};

exports.createOrUpdateNode = async (req, res, next) => {
  try {
    const { nodeId, status, cpu, memory, pagesProcessed, uptime } = req.body;
    const node = await Node.findOneAndUpdate(
      { nodeId },
      { status, cpu, memory, pagesProcessed, uptime, lastHeartbeat: new Date() },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    res.json(node);
  } catch (err) {
    next(err);
  }
};
