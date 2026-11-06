const express = require('express');
const { getStats, getUsers } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Restrict all admin routes to authenticated admin users
router.use(protect, authorize('admin'));

// GET /api/admin/stats - System performance & sales statistics
router.get('/stats', getStats);

// GET /api/admin/users - Customer listing (role='user')
router.get('/users', getUsers);

module.exports = router;
