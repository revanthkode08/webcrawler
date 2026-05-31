const cron = require('node-cron');
const Crawl = require('../models/Crawl.model');
const Node = require('../models/Node.model');
const QueueItem = require('../models/QueueItem.model');
const IndexedPage = require('../models/IndexedPage.model');
const logger = require('../services/logger.service');

const historySnapshots = [];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomTitle = () => {
  const titles = [
    'Distributed Search Engine',
    'Indexing Deep Web Pages',
    'Real-Time Crawl Snapshot',
    'Streaming Content Graph',
    'Crawling System Overview',
    'Node Performance Metrics'
  ];
  return titles[Math.floor(Math.random() * titles.length)];
};

const snippets = [
  'This page contains detailed information about distributed systems and web crawling techniques.',
  'Explore the latest repositories, open source projects, and developer tools.',
  'Watch videos, discover channels, and explore trending content from creators worldwide.',
  'Learn about algorithms, data structures, and computer science fundamentals.',
  'Documentation and guides for building scalable web applications and APIs.'
];

const createIndexedPage = async (crawl, index, parentUrl = null, depth = 0) => {
  const randomTags = ['distributed', 'web graph', 'react', 'networking', 'architecture', 'crawling', 'seo'];
  const keywords = Array.from({ length: randomBetween(3, 8) }, () => randomTags[Math.floor(Math.random() * randomTags.length)]);

  return IndexedPage.create({
    url: `${crawl.domain}/page/${crawl.pages + index}`,
    title: randomTitle(),
    domain: crawl.domain,
    wordCount: randomBetween(200, 1200),
    crawlId: crawl._id,
    snippet: snippets[Math.floor(Math.random() * snippets.length)],
    Keywords: keywords,
    rawText: `[Simulated document buffer for ${crawl.domain}]\n\n<html>\n<head><title>Simulated</title></head>\n<body>...</body>\n</html>`,
    parentUrl,
    depth
  });
};

const seedData = async () => {
  const nodeCount = await Node.countDocuments();
  if (!nodeCount) {
    await Node.create([
      { nodeId: 'node-1', status: 'online', cpu: 34, memory: 51, pagesProcessed: 120, uptime: 7200 },
      { nodeId: 'node-2', status: 'online', cpu: 22, memory: 43, pagesProcessed: 95, uptime: 5400 },
      { nodeId: 'node-3', status: 'offline', cpu: 0, memory: 0, pagesProcessed: 60, uptime: 0 }
    ]);
  }

  const crawlCount = await Crawl.countDocuments();
  if (!crawlCount) {
    await Crawl.create([
      { domain: 'youtube.com', seedUrl: 'https://youtube.com', status: 'queued', pages: 0, maxPages: 120, threads: 4 },
      { domain: 'github.com', seedUrl: 'https://github.com', status: 'queued', pages: 0, maxPages: 90, threads: 3 }
    ]);
  }
};

const recordSnapshot = async () => {
  const totalPages = await IndexedPage.countDocuments();
  const queueSize = await QueueItem.countDocuments({ status: 'pending' });
  const snapshot = {
    time: new Date().toISOString(),
    queued: queueSize,
    crawled: totalPages
  };
  historySnapshots.push(snapshot);
  if (historySnapshots.length > 20) historySnapshots.shift();
};

const updateCrawls = async () => {
  const crawls = await Crawl.find();
  for (const crawl of crawls) {
    if (crawl.status === 'queued' && Math.random() < 0.5) {
      crawl.status = 'running';
      crawl.startedAt = crawl.startedAt || new Date();
      await QueueItem.updateMany({ crawlId: crawl._id, status: 'pending' }, { status: 'processing' }).limit(2);
      
      logger.info(`Starting crawl for ${crawl.domain}`, { domain: crawl.domain });
    }
    if (crawl.status === 'running') {
      const increment = randomBetween(5, 20);
      crawl.pages += increment;
      crawl.elapsed += 3;
      crawl.threads = clamp(crawl.threads + randomBetween(-1, 1), 1, 6);

      await Promise.all([
        QueueItem.updateMany({ crawlId: crawl._id, status: 'pending' }, { status: 'processing' }).limit(2),
        QueueItem.updateMany({ crawlId: crawl._id, status: 'processing' }, { status: 'completed' }).limit(2)
      ]);

      const previousPages = await IndexedPage.find({ crawlId: crawl._id }).select('url depth').lean();
      
      const created = [];
      for (let i = 0; i < randomBetween(2, 4); i += 1) {
        let parentUrl = crawl.seedUrl;
        let depth = 0;
        
        if (previousPages.length > 0) {
          const parent = previousPages[Math.floor(Math.random() * previousPages.length)];
          parentUrl = parent.url;
          depth = Math.min(parent.depth + 1, 4);
        }
        
        const newPage = await createIndexedPage(crawl, i + 1, parentUrl, depth);
        previousPages.push(newPage);
        created.push(newPage);
      }
      await Promise.all(created);

      logger.success(`Indexed ${crawl.domain}/page/${crawl.pages} [${increment} new pages]`, { domain: crawl.domain });
      if (Math.random() > 0.6)
        logger.info(`Following links on ${crawl.domain}/explore`, { domain: crawl.domain });
      if (Math.random() > 0.85)
        logger.error(`Failed: ${crawl.domain}/login (403 Forbidden)`, { domain: crawl.domain, statusCode: 403 });

      if (crawl.pages >= crawl.maxPages) {
        crawl.status = 'completed';
        crawl.completedAt = new Date();
        await QueueItem.updateMany({ crawlId: crawl._id, status: { $in: ['pending', 'processing'] } }, { status: 'completed' });
        
        logger.success(`Crawl completed for ${crawl.domain} — ${crawl.pages} pages indexed`, { domain: crawl.domain });
      }
    }
    await crawl.save();
  }
};

const updateNodes = async () => {
  const nodes = await Node.find();
  for (const node of nodes) {
    if (node.status === 'online') {
      node.cpu = clamp(node.cpu + randomBetween(-8, 8), 5, 95);
      node.memory = clamp(node.memory + randomBetween(-4, 4), 20, 90);
      node.pagesProcessed += randomBetween(1, 10);
      node.uptime += 3;
      node.lastHeartbeat = new Date();
      await node.save();
      
      if (node.cpu > 80) {
        logger.warn(`Node ${node.nodeId} CPU high: ${node.cpu}%`, { nodeId: node.nodeId });
      }
    }
  }
};

const emitState = async (io) => {
  const stats = {
    totalIndexedPages: await IndexedPage.countDocuments(),
    activeThreads: (await Crawl.aggregate([
      { $match: { status: 'running' } },
      { $group: { _id: null, count: { $sum: '$threads' } } }
    ]))[0]?.count || 0,
    queueSize: await QueueItem.countDocuments({ status: 'pending' }),
    nodesOnline: await Node.countDocuments({ status: 'online' })
  };
  const crawls = await Crawl.find().sort({ createdAt: -1 }).limit(20);
  const nodes = await Node.find().sort({ nodeId: 1 });
  const queueSummary = {
    total: await QueueItem.countDocuments(),
    pending: await QueueItem.countDocuments({ status: 'pending' }),
    processing: await QueueItem.countDocuments({ status: 'processing' }),
    completed: await QueueItem.countDocuments({ status: 'completed' }),
    failed: await QueueItem.countDocuments({ status: 'failed' })
  };

  io.emit('state_update', { stats, crawls, nodes, history: historySnapshots, queue: queueSummary });
};

const startSimulator = async (io) => {
  await seedData();
  await recordSnapshot();

  cron.schedule('*/3 * * * * *', async () => {
    try {
      // Disabled updateCrawls() so the Real Puppeteer Crawler can process QueueItems
      // await updateCrawls();
      await updateNodes();
      await recordSnapshot();
      await emitState(io);
    } catch (err) {
      console.error('Simulator error:', err);
    }
  });
};

const getHistory = () => historySnapshots;

const getGraphData = async (crawlId) => {
  const pages = await IndexedPage.find({ crawlId })
    .select('url parentUrl depth domain title')
    .sort({ indexedAt: 1 }) // ensure we get the root nodes first
    .limit(100);
  
  const nodes = pages.map(p => ({
    id: p.url,
    label: p.url.replace(/https?:\/\//, '').substring(0, 30),
    depth: p.depth || 0,
    domain: p.domain,
    title: p.title
  }));
  
  const nodeIds = new Set(nodes.map(n => n.id));
  
  const edges = pages
    .filter(p => p.parentUrl && nodeIds.has(p.parentUrl) && nodeIds.has(p.url))
    .map(p => ({ source: p.parentUrl, target: p.url }));
  
  return { nodes, edges };
};

module.exports = { startSimulator, getHistory, getGraphData };
