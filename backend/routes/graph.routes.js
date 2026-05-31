const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getGraphData } = require('../simulator/crawler.simulator');

router.get('/:crawlId', auth, async (req, res, next) => {
  try {
    const data = await getGraphData(req.params.crawlId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
