const QueueItem = require('../models/QueueItem.model');

exports.getQueue = async (req, res, next) => {
  try {
    const total = await QueueItem.countDocuments();
    const pending = await QueueItem.countDocuments({ status: 'pending' });
    const processing = await QueueItem.countDocuments({ status: 'processing' });
    const completed = await QueueItem.countDocuments({ status: 'completed' });
    const failed = await QueueItem.countDocuments({ status: 'failed' });

    const items = await QueueItem.find({ status: 'pending' })
      .sort({ priority: -1, addedAt: -1 })
      .limit(20);

    res.json({ total, pending, processing, completed, failed, items });
  } catch (err) {
    next(err);
  }
};
