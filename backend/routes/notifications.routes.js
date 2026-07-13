const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteNotificationsBulk,
} = require('../controllers/notifications.controller');

router.get('/', verifyToken, getMyNotifications);
router.patch('/:id/read', verifyToken, markAsRead);
router.patch('/read-all', verifyToken, markAllAsRead);
router.delete('/:id', verifyToken, deleteNotification);       
router.delete('/', verifyToken, deleteNotificationsBulk);     

module.exports = router;