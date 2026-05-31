const MAX_LOGS = 200;
let io = null;
const logs = [];

const LOG_TYPES = {
  SUCCESS: 'success',
  INFO:    'info',
  ERROR:   'error',
  WARN:    'warn'
};

const log = (type, message, meta = {}) => {
  const entry = {
    id: Date.now() + Math.random(),
    type,
    message,
    meta,
    timestamp: new Date().toISOString()
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();
  if (io) io.emit('log_entry', entry);
  return entry;
};

const setIO = (socketIO) => { io = socketIO; };
const getLogs = () => [...logs];

module.exports = {
  setIO,
  getLogs,
  LOG_TYPES,
  success: (msg, meta) => log(LOG_TYPES.SUCCESS, msg, meta),
  info:    (msg, meta) => log(LOG_TYPES.INFO, msg, meta),
  error:   (msg, meta) => log(LOG_TYPES.ERROR, msg, meta),
  warn:    (msg, meta) => log(LOG_TYPES.WARN, msg, meta)
};
