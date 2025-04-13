const { clearConversationHistory } = require('../services/geminiService');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.body;
    clearConversationHistory(userId || 'default');
    
    res.json({ message: 'Conversation history cleared successfully' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 