// V7 Upload Service
// Handles uploading files to V7 collections and tracking extraction results

const BASE_URL = process.env.REACT_APP_PROXY_URL || 'http://localhost:5001/api/v7';
const WORKSPACE_ID = process.env.REACT_APP_V7_WORKSPACE_ID;

class V7UploadService {
  constructor() {
    this.uploadQueue = [];
    this.uploadProgress = {};
  }

  // Create a new project/collection for uploads
  async createUploadProject(name, description) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        type: 'collection' // V7 uses collections for document processing
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id || data.project_id;
  }

  // Create an entity (document holder) in the project
  async createEntity(projectId, metadata = {}) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/entities`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metadata
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create entity: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id || data.entity_id;
  }

  // Get or create the file property for the project
  async getFileProperty(projectId) {
    // First, try to get existing properties
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/properties`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      const properties = data.data || data.properties || [];
      const fileProperty = properties.find(p => p.name === 'file' || p.type === 'file');
      
      if (fileProperty) {
        return fileProperty.id;
      }
    }

    // If no file property exists, create one
    const createResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'file',
        type: 'file',
        description: 'Document file'
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create file property: ${createResponse.statusText}`);
    }

    const newProperty = await createResponse.json();
    return newProperty.id || newProperty.property_id;
  }

  // Get or create the attorney name property
  async getAttorneyProperty(projectId) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/properties`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      const properties = data.data || data.properties || [];
      const attorneyProperty = properties.find(p => p.name === 'attorney-name');
      
      if (attorneyProperty) {
        return attorneyProperty.id;
      }
    }

    // Create attorney-name property
    const createResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'attorney-name',
        type: 'text',
        description: 'Attorney name',
        config: {
          user_input: true // Mark as user input field
        }
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create attorney property: ${createResponse.statusText}`);
    }

    const newProperty = await createResponse.json();
    return newProperty.id || newProperty.property_id;
  }

  // Start file upload process
  async startFileUpload(projectId, entityId, propertyId, filename) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/entities/${entityId}/properties/${propertyId}/start_file_upload`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename })
    });

    if (!response.ok) {
      throw new Error(`Failed to start upload: ${response.statusText}`);
    }

    return await response.json();
  }

  // Upload file to S3 presigned URL
  async uploadToS3(presignedUrl, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('S3 upload failed'));
      });

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });
  }

  // Confirm file upload completion
  async confirmFileUpload(confirmUrl) {
    const response = await fetch(confirmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'complete',
        error_message: null
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to confirm upload: ${response.statusText}`);
    }

    return await response.json();
  }

  // Set attorney name for an entity
  async setAttorneyName(projectId, entityId, propertyId, attorneyName) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/entities/${entityId}/properties/${propertyId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        manual_value: {
          value: attorneyName
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to set attorney name: ${response.statusText}`);
    }

    return await response.json();
  }

  // Upload a single file with attorney information
  async uploadFile(projectId, file, attorneyName, onProgress) {
    try {
      // Create entity for this document
      const entityId = await this.createEntity(projectId, {
        attorneyName,
        originalFilename: file.name
      });

      // Get property IDs
      const filePropertyId = await this.getFileProperty(projectId);
      const attorneyPropertyId = await this.getAttorneyProperty(projectId);

      // Set attorney name
      await this.setAttorneyName(projectId, entityId, attorneyPropertyId, attorneyName);

      // Start file upload
      const uploadUrls = await this.startFileUpload(projectId, entityId, filePropertyId, file.name);
      
      // Upload to S3
      await this.uploadToS3(uploadUrls.file_upload_url, file, onProgress);
      
      // Confirm upload
      await this.confirmFileUpload(uploadUrls.confirm_upload_url);

      return {
        success: true,
        entityId,
        filename: file.name,
        attorneyName
      };
    } catch (error) {
      console.error(`Upload failed for ${file.name}:`, error);
      return {
        success: false,
        filename: file.name,
        error: error.message
      };
    }
  }

  // Batch upload multiple files
  async uploadBatch(projectId, files, attorneyName, onOverallProgress) {
    const results = [];
    let completed = 0;

    for (const file of files) {
      const result = await this.uploadFile(
        projectId,
        file,
        attorneyName,
        (fileProgress) => {
          if (onOverallProgress) {
            const overallProgress = ((completed + fileProgress / 100) / files.length) * 100;
            onOverallProgress(overallProgress);
          }
        }
      );

      results.push(result);
      completed++;
    }

    return results;
  }

  // Check extraction status for entities
  async checkExtractionStatus(projectId, entityIds) {
    const results = [];

    for (const entityId of entityIds) {
      const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/entities/${entityId}`;
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          results.push(data);
        }
      } catch (error) {
        console.error(`Failed to check entity ${entityId}:`, error);
      }
    }

    return results;
  }

  // Get all entities in a project with their extraction results
  async getProjectResults(projectId, limit = 100) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/entities?limit=${limit}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch results: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data.entities || [];
  }
}

// Export singleton instance
const v7UploadService = new V7UploadService();
export default v7UploadService;