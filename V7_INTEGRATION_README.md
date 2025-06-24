# V7 Integration for Attorney Answer Sheet

## Overview
This React application now integrates with the V7 API to fetch and display attorney document data alongside the existing local test data. The integration allows you to toggle between using local data only or merging V7 data with local data.

## Setup

### 1. Environment Variables
Create a `.env` file in the project root with your V7 credentials:

```bash
V7_API_KEY=your-v7-api-key-here
V7_WORKSPACE_ID=your-v7-workspace-id-here
V7_BASE_URL=https://go.v7labs.com/api
```

### 2. Install Dependencies
The app uses native fetch API, so no additional dependencies are needed.

### 3. Run the Application
```bash
npm start
```

## Features

### V7 Data Integration
- **Toggle Control**: Switch between local data only and V7+local merged data
- **Auto-fetch**: V7 data loads automatically on app start
- **Refresh Button**: Manually refresh V7 data anytime
- **Loading States**: Visual feedback during data fetching
- **Error Handling**: Graceful error display if V7 API fails

### Data Display
- **Client Cards**: Show merged data from both local and V7 sources
  - Blue border indicates clients with V7 data
  - Light blue background for V7-only clients
  - "V7" badge on client names with V7 data
- **V7 Extracted Fields**: Display all fields extracted by V7
- **File Lists**: Separate sections for local files and V7 documents
- **File Graph**: Visual representation of all files with V7 badges

### Data Merging Logic
The app intelligently merges V7 data with local data:
1. Matches clients by normalized names
2. Preserves all local client data
3. Adds V7 document references
4. Creates new client entries for V7-only clients
5. Maintains separate tracking of local vs V7 files

## Architecture

### Key Files
- `src/services/v7Api.js` - V7 API service layer
- `src/hooks/useV7Data.js` - React hooks for data fetching
- `src/utils/dataMerger.js` - Data merging utilities
- `src/App.js` - Updated main component with V7 integration
- `src/App.css` - Styles for V7 UI elements

### API Service
The V7 API service provides:
- Project listing
- Property retrieval
- Entity fetching with pagination
- Data processing and grouping by attorney/client

### Data Flow
1. App loads → `useV7Data` hook fetches from V7 API
2. V7 data processed → grouped by attorney and client
3. Data merger combines V7 data with local client data
4. UI renders merged data with visual indicators

## V7 Data Structure
The app expects V7 entities to have these fields:
- `attorney-name` or similar field containing attorney name
- `client-name` or similar field containing client name
- `document-type` or similar field for document classification
- `client-address` or similar field for client address

## Troubleshooting

### No V7 Data Appearing
1. Check console for errors
2. Verify `.env` file has correct credentials
3. Ensure V7 workspace has processed entities
4. Check network tab for API responses

### Data Not Matching
1. Review field names in V7 project properties
2. Check client name normalization in `dataMerger.js`
3. Verify attorney names match between systems

### Performance Issues
1. Large datasets may cause initial load delay
2. Use pagination limits in `v7Api.js` if needed
3. Consider caching strategies for production use

## Future Enhancements
- Real-time updates via webhooks
- Advanced client matching algorithms
- Document preview integration
- Export merged data functionality