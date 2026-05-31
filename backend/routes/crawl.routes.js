const express = require('express');
const router = express.Router();
const crawlController = require('../controllers/crawl.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth, crawlController.getCrawls);
router.post('/start', auth, crawlController.startCrawl);
router.delete('/:id', auth, crawlController.stopCrawl);
router.get('/stats', auth, crawlController.getStats);
router.get('/history', auth, crawlController.getHistory);

module.exports = router;
