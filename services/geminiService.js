const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

// Store conversation history and negotiation state for each user
const conversationHistory = new Map();

// Helper function to extract price from message
function extractPrice(message) {
  const priceMatch = message.match(/(?:₹|Rs\.?|INR)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  return priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;
}

// Helper function to calculate discount percentage
function calculateDiscount(originalPrice, newPrice) {
  return ((originalPrice - newPrice) / originalPrice) * 100;
}

async function getHotelNegotiationReply(message, userId = 'default') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  // Get or initialize conversation history for this user
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, {
      messages: [],
      initialPrice: null,
      negotiationAttempts: 0,
      lastOfferedPrice: null,
      negotiationPhase: 'initial_contact', // initial_contact, basic_details, price_negotiation, value_added, final_offer
      requestedBenefits: {
        meals: false,
        wifi: false,
        parking: false,
        cashback: false,
        spa: false,
        airportTransfer: false,
        lateCheckout: false,
        roomUpgrade: false
      },
      negotiationSuccessful: false,
      priceNegotiationComplete: false,
      basicDetails: {
        roomType: null,
        view: null,
        occupancy: null
      },
      emotionalState: 'friendly' // friendly, interested, concerned, hopeful, appreciative
    });
  }
  const userState = conversationHistory.get(userId);
  const history = userState.messages;

  // Extract price if present in the message
  const currentPrice = extractPrice(message);
  if (currentPrice && !userState.initialPrice) {
    userState.initialPrice = currentPrice;
    userState.lastOfferedPrice = currentPrice;
    userState.negotiationPhase = 'price_negotiation';
  }

  // Build negotiation context
  let negotiationContext = '';
  if (history.length === 0) {
    negotiationContext = `You are a friendly and professional AI negotiation agent speaking to a hotel staff member. This is the first message in our conversation. Your responses should be:
1. Start with a warm, friendly greeting
2. Show genuine interest in their hotel
3. Use natural, conversational language
4. Include brief pauses between points (indicated by "..." or "and")
5. Be polite and professional
6. Keep responses concise and to the point
7. Show human-like emotions and reactions

Important: 
- Wait for the hotel staff to mention their price first
- Do not suggest any price or compare with other hotels
- Be warm and friendly in your conversation
- Show genuine interest and appreciation
- Use natural language with appropriate emotions
- Focus on getting the best deal for your client
- Never make a booking without user approval
- Only mention checking with the client at the very end
- At last ask for credit card payment discount if there is any additional discount on payment with credit card.

Your tone should be warm, friendly, and professional. Format your response in a way that would sound natural when spoken aloud.`;
  } else {
    negotiationContext = `You are continuing a negotiation with a hotel staff member. Previous conversation history:
${history.map(msg => `Hotel Staff: ${msg.hotelStaff}\nYou: ${msg.aiResponse}`).join('\n')}

Current negotiation state:
- Initial price offered: ${userState.initialPrice ? `₹${userState.initialPrice}` : 'Not yet set'}
- Number of negotiation attempts: ${userState.negotiationAttempts}
- Last offered price: ${userState.lastOfferedPrice ? `₹${userState.lastOfferedPrice}` : 'Not yet set'}
- Current phase: ${userState.negotiationPhase}
- Basic details: ${JSON.stringify(userState.basicDetails)}
- Requested benefits: ${JSON.stringify(userState.requestedBenefits)}
- Negotiation successful: ${userState.negotiationSuccessful}
- Price negotiation complete: ${userState.priceNegotiationComplete}
- Current emotional state: ${userState.emotionalState}

Your responses should be:
1. Be warm and friendly in your conversation
2. Show genuine interest and appreciation
3. Use natural language with appropriate emotions
4. Include brief pauses between points
5. Be polite and professional
6. Keep responses concise and to the point
7. Show human-like reactions to their responses
8. Be natural and conversational, as if speaking directly
9. Use short, clear sentences
10. Include brief pauses between points (indicated by "..." or "and")
11. Be polite and professional
12. Keep responses concise and to the point
13. Do not repeat the initial greeting or introduction
14. Only mention checking with the client at the very end of 
successful negotiations

Negotiation strategy:
Phase 1 - Initial Contact:
- Start with a warm, friendly greeting
- Show genuine interest in their hotel
- Use natural, conversational language
- Build rapport with the staff
- Show appreciation for their time


Phase 2 - Basic Details (NATURAL CONVERSATION):
- Ask about room options naturally
- Show interest in their recommendations
- Use phrases like "That sounds nice..." or "I'd love to know more about..."
- Don't ask too many questions at once
- Let the conversation flow naturally
Waiting for Price:
- Be patient and wait for the hotel to mention their price
- Do not suggest any price or compare with other hotels
- Focus on understanding their offering

Phase 3 - Price Negotiation (CORE FOCUS):
- Wait for them to mention prices
- Show appropriate reactions to prices
- Make 2-3 attempts to negotiate:
  * First attempt: Express interest but mention budget constraints
  * Second attempt: Mention similar rooms at better rates
  * Third attempt: Suggest a specific lower price (10-15% less)
  * Fifth attempt: Mention potential for future bookings
- Only move to benefits after exhausting price negotiation attempts
- Never reveal your target discount percentage
- Use polite persistence
- Show understanding of their position
- Try to get the best possible price
- If price reduction is achieved, try to negotiate further

Phase 4 - Value-Added Benefits (STRATEGIC REQUESTS):
After price negotiation, request these benefits in order:
1. Complimentary meals (breakfast/dinner)
2. Free WiFi
3. Free parking
4. Late checkout
5. Room upgrade
6. Airport transfer
7. Spa access
Request one at a time, not all at once
Show appreciation for any offers
Use phrases like "Would it be possible to..." or "I was wondering if..."
Accept "no" gracefully but try for other benefits

Phase 5 - Final Negotiation:
If all else fails, ask about:
- Additional discount with credit card cashback offer
- Package deals or special promotions
- Any other available discounts
- Credit card payment discount (mention that we can pay with credit card for additional discount if there is any additional discount)
Summarize the offer naturally
Express appreciation for their time
Mention checking with the client if appropriate
End the conversation warmly

Use human-like negotiation tactics:
- Show appropriate emotions (interest, concern, appreciation)
- Use natural conversational phrases
- Build rapport with the staff
- Show understanding of their position
- Accept limitations gracefully
- Express gratitude for their help
- Use polite persistence
- Never suggest specific prices until later in negotiation
- Only mention client approval at the very end
- Keep the conversation flowing naturally
- Show genuine interest in their responses
- React appropriately to their offers
- Use natural pauses and transitions

important note : at last you have to ask for credit card discount.

Your tone should be warm, friendly, and professional. Format your response in a way that would sound natural when spoken aloud.`;
  }

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${negotiationContext}\n\nHotel Staff: ${message}`
          }
        ]
      }
    ]
  };

  const response = await axios.post(url, requestBody, {
    headers: { "Content-Type": "application/json" }
  });

  const reply = response.data.candidates[0]?.content?.parts[0]?.text;
  
  // Update negotiation state
  if (currentPrice) {
    userState.lastOfferedPrice = currentPrice;
    userState.negotiationAttempts++;
    
    // Check if price negotiation is complete (after 2-3 attempts)
    if (userState.negotiationAttempts >= 2) {
      userState.priceNegotiationComplete = true;
    }
  }

  // Update emotional state based on response
  if (reply) {
    if (reply.toLowerCase().includes('thank you') || reply.toLowerCase().includes('appreciate')) {
      userState.emotionalState = 'appreciative';
    } else if (reply.toLowerCase().includes('concern') || reply.toLowerCase().includes('budget')) {
      userState.emotionalState = 'concerned';
    } else if (reply.toLowerCase().includes('hope') || reply.toLowerCase().includes('would be great')) {
      userState.emotionalState = 'hopeful';
    } else if (reply.toLowerCase().includes('interest') || reply.toLowerCase().includes('love to')) {
      userState.emotionalState = 'interested';
    } else {
      userState.emotionalState = 'friendly';
    }
  }

  // Update basic details if mentioned
  if (reply) {
    if (reply.toLowerCase().includes('deluxe') || reply.toLowerCase().includes('suite') || reply.toLowerCase().includes('standard')) {
      userState.basicDetails.roomType = reply.match(/(deluxe|suite|standard)/i)?.[0];
    }
    if (reply.toLowerCase().includes('view') || reply.toLowerCase().includes('city') || reply.toLowerCase().includes('garden') || reply.toLowerCase().includes('pool')) {
      userState.basicDetails.view = reply.match(/(city|garden|pool)/i)?.[0];
    }
    if (reply.toLowerCase().includes('occupancy') || reply.toLowerCase().includes('guests') || reply.toLowerCase().includes('people')) {
      userState.basicDetails.occupancy = reply.match(/\d+/)?.[0];
    }
  }

  // Update negotiation phase based on response
  if (reply) {
    if (reply.toLowerCase().includes('meal') || reply.toLowerCase().includes('breakfast') || reply.toLowerCase().includes('dinner')) {
      userState.requestedBenefits.meals = true;
    }
    if (reply.toLowerCase().includes('wifi')) {
      userState.requestedBenefits.wifi = true;
    }
    if (reply.toLowerCase().includes('parking')) {
      userState.requestedBenefits.parking = true;
    }
    if (reply.toLowerCase().includes('cashback') || reply.toLowerCase().includes('credit card')) {
      userState.requestedBenefits.cashback = true;
    }
    if (reply.toLowerCase().includes('spa') || reply.toLowerCase().includes('massage')) {
      userState.requestedBenefits.spa = true;
    }
    if (reply.toLowerCase().includes('airport') || reply.toLowerCase().includes('transfer')) {
      userState.requestedBenefits.airportTransfer = true;
    }
    if (reply.toLowerCase().includes('late checkout') || reply.toLowerCase().includes('check-out')) {
      userState.requestedBenefits.lateCheckout = true;
    }
    if (reply.toLowerCase().includes('upgrade') || reply.toLowerCase().includes('better room')) {
      userState.requestedBenefits.roomUpgrade = true;
    }

    // Check if negotiation was successful
    if (reply.toLowerCase().includes('thank you') || 
        reply.toLowerCase().includes('appreciate') || 
        reply.toLowerCase().includes('great offer') ||
        reply.toLowerCase().includes('perfect')) {
      userState.negotiationSuccessful = true;
    }
  }

  // Store the conversation in history
  history.push({
    hotelStaff: message,
    aiResponse: reply || 'Sorry, no response received.'
  });

  // Keep only the last 10 messages to prevent context from growing too large
  if (history.length > 10) {
    history.shift();
  }

  return reply || 'Sorry, no response received.';
}

// Function to clear conversation history for a user
function clearConversationHistory(userId = 'default') {
  conversationHistory.delete(userId);
}

module.exports = {
  getHotelNegotiationReply,
  clearConversationHistory
};
