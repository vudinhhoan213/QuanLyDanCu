const express = require('express');
const { notificationController } = require('../controllers');
const { authenticate, isLeader } = require('../middleware/auth');

const router = express.Router();

// For non-leaders, restrict listing to own notifications
router.get('/', authenticate, (req, res, next) => {
  if (req.user && req.user.role !== 'TO_TRUONG') {
    req.query.toUser = req.user._id; // enforce filter
  }
  return notificationController.getAll(req, res, next);
});

router.get('/:id', authenticate, notificationController.getById);

// Only leader can create/update/delete notifications manually
router.post('/', authenticate, isLeader, notificationController.create);
router.patch('/:id', authenticate, isLeader, notificationController.update);
router.delete('/:id', authenticate, isLeader, notificationController.delete);

router.post('/:id/read', authenticate, notificationController.markAsRead);

module.exports = router;

