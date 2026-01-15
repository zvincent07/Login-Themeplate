/**
 * CHATBOT CONTROLLER (THIN)
 * 
 * Controllers MUST:
 * - Parse request
 * - Call service
 * - Return response
 */

const asyncHandler = require('../middleware/asyncHandler');
const chatbotService = require('../services/chatbotService');

// @desc    Chat with AI bot
// @route   POST /api/v1/chatbot
// @access  Public (or Private if you want to restrict)
exports.chatWithBot = asyncHandler(async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  const response = await chatbotService.chatWithBot(message, conversationHistory);

  res.json({
    success: true,
    response,
  });
});
