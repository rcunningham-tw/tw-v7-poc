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
    const response = await this.fetchWithAuth(url);
    return response.data || response.projects || [];
  }

  // Get properties for a specific project
  async getProjectProperties(projectId) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/properties`;
    const response = await this.fetchWithAuth(url);
    return response.data || response.properties || [];
  }

  // Get entities (documents) with pagination
  async getEntities(projectId, limit = 100, offset = 0) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/entities`;
    const params = new URLSearchParams({ limit, offset });
    const response = await this.fetchWithAuth(`${url}?${params}`);
    return response.data || response.entities || [];
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
      let clientDOB = null;
      let clientPhone = null;
      let clientSSN = null;
      let originalFilename = null;
      let fileUrl = null;

      Object.entries(fields).forEach(([fieldName, fieldData]) => {
        if (typeof fieldData === 'object' && fieldData !== null) {
          const lowerFieldName = fieldName.toLowerCase();
          
          // Special handling for file field
          if (lowerFieldName === 'file') {
            originalFilename = fieldData.manual_value?.original_filename || fieldData.tool_value?.original_filename;
            fileUrl = fieldData.manual_value?.value || fieldData.tool_value?.value;
            return;
          }
          
          // V7 API structure: check manual_value first, then tool_value
          const value = fieldData.manual_value?.value || fieldData.tool_value?.value || fieldData.value;
          
          if (!value) return;
          
          if (lowerFieldName.includes('attorney') && lowerFieldName.includes('name')) {
            attorneyName = value;
          } else if (lowerFieldName.includes('client') && lowerFieldName.includes('name')) {
            clientName = value;
          } else if (lowerFieldName.includes('type') || lowerFieldName.includes('document')) {
            docType = value;
          } else if (lowerFieldName === 'address' || (lowerFieldName.includes('address') && !lowerFieldName.includes('email'))) {
            clientAddress = value;
          } else if (lowerFieldName === 'dob' || lowerFieldName.includes('birth')) {
            clientDOB = value;
          } else if (lowerFieldName === 'phone' || lowerFieldName.includes('phone')) {
            clientPhone = value;
          } else if (lowerFieldName === 'ssn' || lowerFieldName.includes('social')) {
            clientSSN = value;
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
          dob: clientDOB,
          phone: clientPhone,
          ssn: clientSSN,
          created: entity.created_at,
          fields: fields,
          originalFilename: originalFilename,
          fileUrl: fileUrl
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
          dob: clientDOB,
          phone: clientPhone,
          ssn: clientSSN,
          created: entity.created_at,
          fields: fields,
          originalFilename: originalFilename,
          fileUrl: fileUrl
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
    
    console.log('Starting V7 data fetch...');
    console.log('Workspace ID:', WORKSPACE_ID);
    console.log('Base URL:', BASE_URL);
    
    try {
      // Get all projects
      console.log('Fetching projects...');
      const projects = await this.getProjects();
      console.log('Projects response:', projects);
      
      // Filter for the specific project we're working with
      const targetProjectId = '0197a2b7-971d-7e9b-87ba-59bd6e2aed3f';
      const filteredProjects = projects.filter(p => p.id === targetProjectId);
      const projectsToProcess = filteredProjects.length > 0 ? filteredProjects : projects;
      
      // Collect all entities from all projects
      const allEntities = [];
      const projectInfo = [];

      for (const project of projectsToProcess) {
        
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