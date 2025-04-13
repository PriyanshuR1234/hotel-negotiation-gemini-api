const { handleNegotiation } = require('../services/geminiService');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // For Vercel, req.body is already parsed
    const { message, history, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await handleNegotiation(message, history || [], userId || 'default');
    res.json(response);
  } catch (error) {
    console.error('Negotiation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 