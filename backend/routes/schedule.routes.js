const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/schedule.controller');

router.get('/presets', auth, ctrl.getPresets);
router.get('/', auth, ctrl.getSchedules);
router.post('/', auth, ctrl.createSchedule);
router.patch('/:id/toggle', auth, ctrl.toggleSchedule);
router.delete('/:id', auth, ctrl.deleteSchedule);

module.exports = router;
