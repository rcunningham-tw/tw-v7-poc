// V7 Upload Service
// Handles uploading files to V7 collections and tracking extraction results

const BASE_URL = process.env.REACT_APP_PROXY_URL || 'http://localhost:5001/api/v7';
const WORKSPACE_ID = process.env.REACT_APP_V7_WORKSPACE_ID;

class V7UploadService {
  constructor() {
    this.uploadQueue = [];
    this.uploadProgress = {};
  }

  // Get existing projects
  async getProjects() {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data.projects || [];
  }

  // Get the first project or a specific project by name
  async getProjectId(projectName = null) {
    const projects = await this.getProjects();
    console.log('Available projects:', projects.map(p => ({ id: p.id, name: p.name })));
    
    if (projectName) {
      const project = projects.find(p => p.name === projectName);
      return project ? project.id : null;
    }
    
    // Return the first project if no name specified
    if (projects.length > 0) {
      console.log('Using project:', projects[0].name, 'with ID:', projects[0].id);
      return projects[0].id;
    }
    
    return null;
  }

  // Create an entity (document holder) in the project
  async createEntity(projectId, attorneyName = null, additionalFields = {}) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/entities`;
    
    // Build fields object with attorney name and any additional fields
    const payload = {};
    const fields = {};
    
    if (attorneyName) {
      fields['attorney-name'] = attorneyName;  // Using the slug format
    }
    
    // Add any additional fields passed in (DOB, Address, Phone, SSN, etc.)
    Object.assign(fields, additionalFields);
    
    if (Object.keys(fields).length > 0) {
      payload.fields = fields;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Entity creation failed:', errorData);
      throw new Error(`Failed to create entity: ${response.statusText} - ${errorData.message || ''}`);
    }

    const data = await response.json();
    // V7 returns the entity data directly with an 'id' field
    return data.id;
  }

  // Get or create the file property for the project
  async getFileProperty(projectId) {
    const url = `${BASE_URL}/workspaces/${WORKSPACE_ID}/projects/${projectId}/properties`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      const properties = data.data || data.properties || [];
      
      console.log('All properties:', properties);
      
      // Look for file property - V7 uses lowercase in the actual API
      const fileProperty = properties.find(p => 
        p.name === 'file' || // lowercase as shown in the fetch response
        p.name === 'File' || // uppercase from CSV export
        p.name === 'Document' || 
        p.type === 'file'
      );
      
      if (fileProperty) {
        console.log('Found file property:', fileProperty.id);
        return fileProperty.id;
      }
    }

    console.log('No file property found');
    throw new Error('No file property found in project. Please ensure the V7 project has a file property configured.');
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
    // Extract the path from the full URL to route through proxy
    let apiPath = confirmUrl;
    
    // If it's a full URL, extract just the API path
    if (confirmUrl.includes('go.v7labs.com/api/')) {
      apiPath = confirmUrl.split('go.v7labs.com/api/')[1];
      // Route through our proxy
      confirmUrl = `${BASE_URL}/${apiPath}`;
    }
    
    console.log('Confirming upload via proxy:', confirmUrl);
    
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


  // Upload a single file with attorney information
  async uploadFile(projectId, file, attorneyName, onProgress, additionalFields = {}) {
    try {
      console.log(`Starting upload for ${file.name} (attorney: ${attorneyName})`);
      
      // Create entity for this document with attorney name and additional fields
      const entityId = await this.createEntity(projectId, attorneyName, additionalFields);
      console.log(`Created entity: ${entityId} with attorney: ${attorneyName}`);

      // Get property IDs
      const filePropertyId = await this.getFileProperty(projectId);

      // Start file upload
      const uploadUrls = await this.startFileUpload(projectId, entityId, filePropertyId, file.name);
      console.log('Upload URLs received:', uploadUrls);
      
      // Upload to S3 (this goes directly to S3, not through proxy)
      await this.uploadToS3(uploadUrls.file_upload_url, file, onProgress);
      console.log('File uploaded to S3 successfully');
      
      // Confirm upload (this needs to go through proxy)
      await this.confirmFileUpload(uploadUrls.confirm_upload_url);
      console.log('Upload confirmed successfully');

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
  async uploadBatch(projectId, files, attorneyName, onOverallProgress, additionalFields = {}) {
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
        },
        additionalFields
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