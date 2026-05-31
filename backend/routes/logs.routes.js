const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const logger = require('../services/logger.service');
router.get('/', auth, (req, res) => res.json(logger.getLogs()));
module.exports = router;
