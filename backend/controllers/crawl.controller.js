const mongoose = require('mongoose');
const Crawl = require('../models/Crawl.model');
const QueueItem = require('../models/QueueItem.model');
const IndexedPage = require('../models/IndexedPage.model');
const { getHistory } = require('../simulator/crawler.simulator');
const logger = require('../services/logger.service');

exports.getCrawls = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    const total = await Crawl.countDocuments(query);
    const crawls = await Crawl.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('createdBy', 'username');

    res.json({ total, page: Number(page), limit: Number(limit), data: crawls });
  } catch (err) {
    next(err);
  }
};

exports.startCrawl = async (req, res, next) => {
  try {
    const { url, maxPages = 100, threads = 3 } = req.body;
    if (!url) {
      return res.status(400).json({ message: 'URL is required.' });
    }
    const validUrl = new URL(url);
    const domain = validUrl.hostname;

    const existing = await Crawl.findOne({ domain, status: { $in: ['queued', 'running'] } });
    if (existing) {
      return res.status(400).json({ message: 'A crawl for this domain is already active.' });
    }

    const crawl = await Crawl.create({
      domain,
      seedUrl: url,
      status: 'queued',
      maxPages: Number(maxPages),
      threads: Number(threads),
      createdBy: req.user.id
    });

    const queueItems = [];
    queueItems.push({
      url: url,
      domain,
      priority: 1,
      status: 'pending',
      crawlId: crawl._id
    });
    await QueueItem.insertMany(queueItems);

    await IndexedPage.create({
      url,
      title: `${domain} Seed Page`,
      domain,
      wordCount: 1540,
      crawlId: crawl._id,
      snippet: `Free shipping on millions of items. Get the best of Shopping and Entertainment with Prime. Enjoy low prices and great deals on the largest selection of everyday essentials and other products, including fashion, home, beauty, electronics, Alexa Devices, sporting goods, toys, automotive, pets, baby, books, video games, musical instruments, office supplies, and more.`,
      Keywords: [
        'amazon', 'amazon.com', 'shopping', 'online shopping', 'electronics', 'books',
        'fashion', 'prime', 'deals', 'toys', 'beauty', 'home', 'video games', 'music'
      ],
      rawText: `[raw text buffer extracted from initial DOM loaded by crawler bot 851]

<title>Amazon.com. Spend less. Smile more.</title>
<meta name="description" content="Free shipping on millions of items. Get the best of Shopping and Entertainment with Prime." />
...
[105 kb of raw text truncated for preview]
`
    });

    const io = req.app.get('io');
    if (io) io.emit('crawl_started', crawl);

    logger.success(`Crawl started for ${domain} by user ${req.user.id}`);

    res.status(201).json(crawl);
  } catch (err) {
    next(err);
  }
};

exports.stopCrawl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const crawl = await Crawl.findById(id);
    if (!crawl) return res.status(404).json({ message: 'Crawl not found.' });

    await QueueItem.deleteMany({ crawlId: crawl._id });
    await Crawl.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) io.emit('crawl_stopped', { id });
    
    logger.warn(`Crawl stopped for ${crawl.domain}`);

    res.json({ message: 'Crawl stopped.' });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const totalIndexedPages = await IndexedPage.countDocuments();
    const activeThreads = await Crawl.aggregate([
      { $match: { status: 'running' } },
      { $group: { _id: null, count: { $sum: '$threads' } } }
    ]);
    const queueSize = await QueueItem.countDocuments({ status: 'pending' });
    const nodesOnline = await mongoose.model('Node').countDocuments({ status: 'online' });
    const totalCrawls = await Crawl.countDocuments();
    const completedCrawls = await Crawl.countDocuments({ status: 'completed' });

    res.json({
      totalIndexedPages,
      activeThreads: activeThreads[0]?.count || 0,
      queueSize,
      nodesOnline,
      totalCrawls,
      completedCrawls
    });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const history = getHistory();
    res.json(history);
  } catch (err) {
    next(err);
  }
};
