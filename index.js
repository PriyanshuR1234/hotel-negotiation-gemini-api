const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { getHotelNegotiationReply, clearConversationHistory } = require('./services/geminiService');

dotenv.config();
const app = express();
app.use(bodyParser.json());

app.post('/negotiate', async (req, res) => {
  try {
    const { message, userId = 'default' } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const reply = await getHotelNegotiationReply(message, userId);
    res.json({ reply });
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: 'Gemini API failed' });
  }
});

// Endpoint to clear conversation history for a user
app.post('/clear-history', (req, res) => {
  try {
    const { userId = 'default' } = req.body;
    clearConversationHistory(userId);
    res.json({ message: 'Conversation history cleared successfully' });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Failed to clear conversation history' });
  }
});

app.listen(5000, () => {
  console.log('Gemini negotiation agent running on port 5000');
});
