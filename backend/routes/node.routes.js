const express = require('express');
const router = express.Router();
const nodeController = require('../controllers/node.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth, nodeController.getNodes);
router.post('/', auth, nodeController.createOrUpdateNode);

module.exports = router;
