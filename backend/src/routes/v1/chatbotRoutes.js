const express = require('express');
const router = express.Router();
const { chatWithBot } = require('../../controllers/chatbotController');
const { rejectUnknownFields } = require('../../middleware/validateInput');

// Define allowed fields
const chatFields = ['message', 'conversationHistory'];

// Chatbot route - Public (no auth required for support)
router.post('/chat', rejectUnknownFields(chatFields), chatWithBot);

module.exports = router;
