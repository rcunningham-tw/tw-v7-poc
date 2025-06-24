// V7 API Service
// Handles all interactions with the V7 Go API

// Use local proxy server to avoid CORS issues
const BASE_URL = process.env.REACT_APP_PROXY_URL || 'http://localhost:5001/api/v7';
const WORKSPACE_ID = process.env.REACT_APP_V7_WORKSPACE_ID;

class V7ApiService {
  constructor() {
    this.hasCredentials = !!WORKSPACE_ID;
    
    if (!this.hasCredentials) {
      console.warn('V7 workspace ID not found. Please set REACT_APP_V7_WORKSPACE_ID');
    }
    
    // Headers are now handled by the proxy server
    this.headers = {
      'Content-Type': 'application/json'
    };
  }

  async fetchWithAuth(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('V7 API Error:', error);
      
      // Check for proxy connection error
      if (error.message && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to proxy server. Please ensure the backend server is running on port 5001.');
      }
      
      throw error;
    }
  }

  // Get all projects in the workspace
  async getProjects() {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects`;
    const data = await this.fetchWithAuth(url);
    return data.projects || [];
  }

  // Get properties for a specific project
  async getProjectProperties(projectId) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/properties`;
    const data = await this.fetchWithAuth(url);
    return data.properties || [];
  }

  // Get entities (documents) with pagination
  async getEntities(projectId, limit = 100, offset = 0) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/entities`;
    const params = new URLSearchParams({ limit, offset });
    const data = await this.fetchWithAuth(`${url}?${params}`);
    return data.entities || [];
  }

  // Get all entities for a project (handles pagination)
  async getAllEntities(projectId) {
    const allEntities = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const entities = await this.getEntities(projectId, limit, offset);
      if (!entities.length) break;
      
      allEntities.push(...entities);
      
      if (entities.length < limit) break;
      offset += limit;
    }

    return allEntities;
  }

  // Get a single entity by ID
  async getEntity(projectId, entityId) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/entities/${entityId}`;
    return await this.fetchWithAuth(url);
  }

  // Process and group entities by attorney and client
  processEntities(entities) {
    const attorneyGroups = {};
    const clientGroups = {};
    const documentTypes = {};

    entities.forEach(entity => {
      const fields = entity.fields || {};
      
      // Extract field values (handling V7's field structure)
      let attorneyName = null;
      let clientName = null;
      let docType = null;
      let clientAddress = null;

      Object.entries(fields).forEach(([fieldName, fieldData]) => {
        if (typeof fieldData === 'object' && fieldData !== null) {
          const value = fieldData.value || fieldData.manual_value?.value;
          
          if (fieldName.toLowerCase().includes('attorney')) {
            attorneyName = value;
          } else if (fieldName.toLowerCase().includes('client') && fieldName.toLowerCase().includes('name')) {
            clientName = value;
          } else if (fieldName.toLowerCase().includes('type') || fieldName.toLowerCase().includes('document')) {
            docType = value;
          } else if (fieldName.toLowerCase().includes('address')) {
            clientAddress = value;
          }
        }
      });

      // Group by attorney
      if (attorneyName) {
        if (!attorneyGroups[attorneyName]) {
          attorneyGroups[attorneyName] = [];
        }
        attorneyGroups[attorneyName].push({
          id: entity.id,
          client: clientName,
          type: docType,
          address: clientAddress,
          created: entity.created_at,
          fields: fields
        });
      }

      // Group by client
      if (clientName) {
        if (!clientGroups[clientName]) {
          clientGroups[clientName] = [];
        }
        clientGroups[clientName].push({
          id: entity.id,
          attorney: attorneyName,
          type: docType,
          address: clientAddress,
          created: entity.created_at,
          fields: fields
        });
      }

      // Count document types
      if (docType) {
        documentTypes[docType] = (documentTypes[docType] || 0) + 1;
      }
    });

    return { attorneyGroups, clientGroups, documentTypes };
  }

  // Fetch and process all data from V7
  async fetchAllData() {
    // Check if we have workspace ID before attempting to fetch
    if (!this.hasCredentials) {
      throw new Error('V7 workspace ID not configured. Please set REACT_APP_V7_WORKSPACE_ID in your .env file and restart the development server.');
    }
    
    try {
      // Get all projects
      const projects = await this.getProjects();
      
      // Collect all entities from all projects
      const allEntities = [];
      const projectInfo = [];

      for (const project of projects) {
        const properties = await this.getProjectProperties(project.id);
        const entities = await this.getAllEntities(project.id);
        
        allEntities.push(...entities);
        projectInfo.push({
          id: project.id,
          name: project.name,
          properties: properties,
          entityCount: entities.length
        });
      }

      // Process the entities
      const processed = this.processEntities(allEntities);

      const result = {
        projects: projectInfo,
        totalEntities: allEntities.length,
        ...processed,
        raw: allEntities // Include raw data for debugging
      };

      // Log all V7 data
      console.log('=== V7 DATA LOADED ===');
      console.log('Projects:', projectInfo);
      console.log('Total Entities:', allEntities.length);
      console.log('Attorney Groups:', processed.attorneyGroups);
      console.log('Client Groups:', processed.clientGroups);
      console.log('Document Types:', processed.documentTypes);
      console.log('Raw Entities:', allEntities);
      console.log('===================');

      return result;
    } catch (error) {
      console.error('Error fetching V7 data:', error);
      throw error;
    }
  }
}

// Export singleton instance
const v7ApiService = new V7ApiService();
export default v7ApiService;