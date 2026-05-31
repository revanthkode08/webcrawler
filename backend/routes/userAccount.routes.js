const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userAccount.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth, ctrl.getAccount);
router.post('/bookmarks', auth, ctrl.addBookmark);
router.delete('/bookmarks/:pageId', auth, ctrl.removeBookmark);
router.post('/searches', auth, ctrl.saveSearch);
router.delete('/searches/:id', auth, ctrl.removeSavedSearch);
router.delete('/history', auth, ctrl.clearHistory);

module.exports = router;
