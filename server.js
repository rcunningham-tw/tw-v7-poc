const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// V7 API configuration
const V7_BASE_URL = process.env.REACT_APP_V7_BASE_URL || 'https://go.v7labs.com/api';
const V7_API_KEY = process.env.REACT_APP_V7_API_KEY;
const V7_WORKSPACE_ID = process.env.REACT_APP_V7_WORKSPACE_ID;

// Check if credentials are provided
if (!V7_API_KEY || !V7_WORKSPACE_ID) {
  console.error('Missing V7 API credentials. Please set REACT_APP_V7_API_KEY and REACT_APP_V7_WORKSPACE_ID');
} else {
  console.log('V7 API configured with workspace:', V7_WORKSPACE_ID);
  console.log('V7 API key present:', !!V7_API_KEY);
}

// Special handling for file upload endpoints that return presigned URLs
app.post('/api/v7/workspaces/:workspaceId/projects/:projectId/entities/:entityId/properties/:propertyId/start_file_upload', async (req, res) => {
  try {
    const { workspaceId, projectId, entityId, propertyId } = req.params;
    const v7Url = `${V7_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/entities/${entityId}/properties/${propertyId}/start_file_upload`;
    
    console.log(`[${new Date().toISOString()}] Starting file upload: ${v7Url}`);
    
    const response = await fetch(v7Url, {
      method: 'POST',
      headers: {
        'X-API-KEY': V7_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    console.log('Upload URLs generated:', data);
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('File upload start error:', error);
    res.status(500).json({ 
      error: 'Failed to start file upload', 
      message: error.message 
    });
  }
});

// Proxy endpoint for V7 API
app.all('/api/v7/*', async (req, res) => {
  try {
    // Extract the path after /api/v7/
    const v7Path = req.params[0];
    const v7Url = `${V7_BASE_URL}/${v7Path}`;
    
    // Add query parameters if any
    const queryString = new URLSearchParams(req.query).toString();
    const fullUrl = queryString ? `${v7Url}?${queryString}` : v7Url;
    
    console.log(`[${new Date().toISOString()}] Proxying ${req.method} request to: ${fullUrl}`);
    
    // Make the request to V7 API
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'X-API-KEY': V7_API_KEY,
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    // Get the response data
    const data = await response.json();
    
    console.log(`[${new Date().toISOString()}] Response status: ${response.status}, data:`, JSON.stringify(data).substring(0, 200) + '...');
    
    // Forward the response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy server error', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasV7Credentials: !!(V7_API_KEY && V7_WORKSPACE_ID)
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`V7 API proxy available at http://localhost:${PORT}/api/v7/*`);
});

// Keep the process running
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});