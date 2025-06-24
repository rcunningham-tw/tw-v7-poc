# V7 API Proxy Setup

## Overview
This application now uses an Express.js proxy server to handle V7 API requests, solving the CORS issues that prevent direct browser access to the V7 API.

## Architecture
- **Frontend**: React app running on port 3000
- **Backend**: Express proxy server running on port 5000
- **API Flow**: React → Express Proxy → V7 API

## Quick Start

1. Make sure your `.env` file has the required V7 credentials:
```
REACT_APP_V7_API_KEY=your-v7-api-key
REACT_APP_V7_WORKSPACE_ID=your-workspace-id
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Start both frontend and backend:
```bash
npm start
```

This will run:
- Express server on http://localhost:5000
- React app on http://localhost:3000

## How It Works

1. The React app makes requests to `/api/v7/*` endpoints
2. These requests are proxied through the Express server
3. The Express server adds the V7 API authentication headers
4. Responses are forwarded back to the React app

## Endpoints

- **Proxy**: `http://localhost:5000/api/v7/*` - All V7 API requests
- **Health Check**: `http://localhost:5000/api/health` - Server status

## Development Commands

- `npm start` - Run both frontend and backend
- `npm run client` - Run only the React frontend
- `npm run server` - Run only the Express backend
- `npm run dev` - Same as `npm start` (alias)

## Troubleshooting

1. **"Cannot connect to proxy server"** - Make sure the backend is running on port 5000
2. **API Key errors** - Check your `.env` file has the correct V7 credentials
3. **Port conflicts** - Ensure ports 3000 and 5000 are available

## Benefits

- No CORS issues
- API keys stay server-side (more secure)
- Easy to add caching or rate limiting
- Can be deployed to any Node.js hosting service