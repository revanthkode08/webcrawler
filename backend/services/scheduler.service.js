const cron = require('node-cron');
const Schedule = require('../models/Schedule.model');
const Crawl = require('../models/Crawl.model');
const QueueItem = require('../models/QueueItem.model');
const IndexedPage = require('../models/IndexedPage.model');

const activeTasks = new Map(); // scheduleId → cron task

const computeNextRun = (cronExpr) => {
  const parser = require('cron-parser');
  try {
    const interval = parser.parseExpression(cronExpr);
    return interval.next().toDate();
  } catch {
    return null;
  }
};

const triggerCrawl = async (schedule, io) => {
  try {
    const existing = await Crawl.findOne({
      domain: schedule.domain,
      status: { $in: ['queued', 'running'] }
    });
    if (existing) return;

    const crawl = await Crawl.create({
      domain: schedule.domain,
      seedUrl: schedule.seedUrl,
      status: 'queued',
      maxPages: schedule.maxPages,
      threads: schedule.threads,
      createdBy: schedule.createdBy
    });

    const queueItems = [];
    for (let i = 0; i < 5; i++) {
      queueItems.push({
        url: `${schedule.seedUrl}/page/${i + 1}`,
        domain: schedule.domain,
        priority: 1,
        status: 'pending',
        crawlId: crawl._id
      });
    }
    await QueueItem.insertMany(queueItems);
    await IndexedPage.create({
      url: schedule.seedUrl,
      title: `${schedule.domain} Seed Page`,
      domain: schedule.domain,
      wordCount: 0,
      crawlId: crawl._id
    });

    schedule.lastRun = new Date();
    schedule.nextRun = computeNextRun(schedule.cronExpr);
    await schedule.save();

    if (io) io.emit('scheduled_crawl_started', {
      domain: schedule.domain,
      scheduleId: schedule._id
    });
    if (io) io.emit('crawl_started', crawl);

    console.log(`[Scheduler] Triggered crawl for ${schedule.domain}`);
  } catch (err) {
    console.error('[Scheduler] Error:', err.message);
  }
};

const startSchedule = (schedule, io) => {
  if (activeTasks.has(String(schedule._id))) {
    activeTasks.get(String(schedule._id)).stop();
  }
  if (!schedule.enabled) return;

  const task = cron.schedule(schedule.cronExpr, () => {
    triggerCrawl(schedule, io);
  });

  activeTasks.set(String(schedule._id), task);
};

const stopSchedule = (scheduleId) => {
  const task = activeTasks.get(String(scheduleId));
  if (task) { task.stop(); activeTasks.delete(String(scheduleId)); }
};

const loadAllSchedules = async (io) => {
  const schedules = await Schedule.find({ enabled: true });
  for (const s of schedules) startSchedule(s, io);
  console.log(`[Scheduler] Loaded ${schedules.length} active schedules`);
};

module.exports = { startSchedule, stopSchedule, loadAllSchedules, computeNextRun, triggerCrawl };
