import api from './api';
import { API_ENDPOINTS } from '../config/api';

const chatbotService = {
  // Send message to chatbot
  sendMessage: async (message, conversationHistory = []) => {
    return await api.post(`${API_ENDPOINTS.chatbot}/chat`, {
      message,
      conversationHistory,
    });
  },
};

export default chatbotService;
