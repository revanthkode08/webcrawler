const Schedule = require('../models/Schedule.model');
const { startSchedule, stopSchedule, computeNextRun } = require('../services/scheduler.service');

const PRESETS = [
  { label: 'Every 15 minutes', cron: '*/15 * * * *' },
  { label: 'Every hour',       cron: '0 * * * *' },
  { label: 'Every 6 hours',    cron: '0 */6 * * *' },
  { label: 'Every 12 hours',   cron: '0 */12 * * *' },
  { label: 'Daily at midnight',cron: '0 0 * * *' },
  { label: 'Weekly (Monday)',  cron: '0 9 * * 1' }
];

exports.getPresets = (req, res) => res.json(PRESETS);

exports.getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username');
    res.json(schedules);
  } catch (err) { next(err); }
};

exports.createSchedule = async (req, res, next) => {
  try {
    const { seedUrl, cronExpr, label, maxPages, threads } = req.body;
    if (!seedUrl || !cronExpr) {
      return res.status(400).json({ message: 'seedUrl and cronExpr required.' });
    }
    const validUrl = new URL(seedUrl);
    const domain = validUrl.hostname;
    const nextRun = computeNextRun(cronExpr);

    const schedule = await Schedule.create({
      seedUrl, domain, cronExpr, label, maxPages, threads,
      nextRun, createdBy: req.user.id
    });

    const io = req.app.get('io');
    startSchedule(schedule, io);

    res.status(201).json(schedule);
  } catch (err) { next(err); }
};

exports.toggleSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Not found.' });

    schedule.enabled = !schedule.enabled;
    if (!schedule.enabled) {
      stopSchedule(schedule._id);
    } else {
      const io = req.app.get('io');
      startSchedule(schedule, io);
      schedule.nextRun = computeNextRun(schedule.cronExpr);
    }
    await schedule.save();
    res.json(schedule);
  } catch (err) { next(err); }
};

exports.deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Not found.' });
    stopSchedule(schedule._id);
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted.' });
  } catch (err) { next(err); }
};
