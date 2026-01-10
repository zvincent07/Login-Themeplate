const express = require('express');
const router = express.Router();
const { chatWithBot } = require('../controllers/chatbotController');

// Chatbot route - Public (no auth required for support)
router.post('/chat', chatWithBot);

module.exports = router;
