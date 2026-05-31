const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/search.controller');

router.get('/', ctrl.publicSearch);
router.get('/suggestions', ctrl.getSuggestions);
router.get('/trending', ctrl.getTrendingKeywords); // Overrode trending domains 
router.get('/related', ctrl.getRelatedSearches);
router.get('/stats', ctrl.getPublicStats);
router.get('/ai-summary', ctrl.getAiSummary);

router.get('/:id', (req, res, next) => {
  if (req.baseUrl.endsWith('/page')) return ctrl.getPageDetail(req, res, next);
  if (req.baseUrl.endsWith('/domain')) {
    req.params.domain = req.params.id;
    return ctrl.getDomainPages(req, res, next);
  }
  next();
});

module.exports = router;
