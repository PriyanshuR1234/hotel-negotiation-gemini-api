# Hotel Negotiation AI Agent

An AI-powered hotel negotiation agent that uses Google's Gemini API to negotiate hotel prices and benefits on behalf of users.

## Features

- Natural conversation flow
- Strategic price negotiation
- Benefits negotiation (meals, WiFi, parking, etc.)
- Credit card discount negotiation
- Emotional intelligence in responses
- Conversation history tracking

## Prerequisites

- Node.js 18 or higher
- Google Gemini API key

## Environment Variables

Create a `.env` file in the root directory with:

```
GEMINI_API_KEY=your_api_key_here
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on http://localhost:5000

## API Endpoints

- `POST /negotiate`: Handle hotel negotiation
  - Body: `{ "message": "your message", "userId": "optional user id" }`
  - Returns: `{ "reply": "AI response" }`

- `POST /clear-history`: Clear conversation history
  - Body: `{ "userId": "optional user id" }`
  - Returns: `{ "message": "Conversation history cleared successfully" }`

## Deployment on Vercel

1. Push your code to GitHub
2. Create a new project on Vercel
3. Import your GitHub repository
4. Add environment variable:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key
5. Deploy

## Note

The conversation history is stored in memory and will be cleared between serverless function invocations on Vercel. For production use, consider implementing a database solution for persistent storage. 