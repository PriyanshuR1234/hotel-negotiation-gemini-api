const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { getHotelNegotiationReply, clearConversationHistory } = require('./services/geminiService');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Negotiation endpoint
app.post('/negotiate', async (req, res) => {
  try {
    const { message, userId = 'default' } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const reply = await getHotelNegotiationReply(message, userId);
    res.json({ reply });
  } catch (error) {
    console.error('Negotiation error:', error);
    res.status(500).json({ 
      error: 'Failed to process negotiation request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Clear history endpoint
app.post('/clear-history', (req, res) => {
  try {
    const { userId = 'default' } = req.body;
    clearConversationHistory(userId);
    res.json({ message: 'Conversation history cleared successfully' });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ 
      error: 'Failed to clear conversation history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`Hotel negotiation agent running on port ${port}`);
});
