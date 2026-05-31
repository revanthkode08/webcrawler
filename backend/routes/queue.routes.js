const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queue.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth, queueController.getQueue);

module.exports = router;
