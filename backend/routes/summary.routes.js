const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { summarizeDocument } = require('../controllers/summary.controller');

router.post('/:id/summary', verifyToken, summarizeDocument);

module.exports = router;

