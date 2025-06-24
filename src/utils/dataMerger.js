// Utility to merge V7 data with local client data
// This allows us to combine the V7 API data with the existing test data

export const mergeClientData = (localData, v7Data) => {
  if (!v7Data || !v7Data.attorneyGroups) {
    return localData;
  }

  // Create a deep copy of local data to avoid mutations
  const mergedData = JSON.parse(JSON.stringify(localData));

  // Process each attorney in V7 data
  Object.entries(v7Data.attorneyGroups).forEach(([attorneyName, v7Documents]) => {
    // Skip if attorney doesn't exist in local data
    if (!mergedData[attorneyName]) {
      // Create new attorney entry if it doesn't exist
      mergedData[attorneyName] = {
        clients: [],
        other_individuals: []
      };
    }

    // Create a map of existing clients for this attorney
    const existingClientsMap = {};
    mergedData[attorneyName].clients.forEach((client, index) => {
      const key = normalizeClientName(client.name);
      existingClientsMap[key] = { client, index };
    });

    // Process V7 documents and merge with existing clients
    const v7ClientMap = {};
    
    v7Documents.forEach(doc => {
      if (!doc.client) return;

      const clientKey = normalizeClientName(doc.client);
      
      if (!v7ClientMap[clientKey]) {
        v7ClientMap[clientKey] = {
          name: doc.client,
          documents: [],
          v7Data: {}
        };
      }

      v7ClientMap[clientKey].documents.push(doc);
      
      // Extract V7 specific data
      if (doc.address) v7ClientMap[clientKey].v7Data.address = doc.address;
      
      // Extract additional fields
      Object.entries(doc.fields).forEach(([fieldName, fieldData]) => {
        const value = fieldData.value || fieldData.manual_value?.value;
        if (value) {
          v7ClientMap[clientKey].v7Data[fieldName] = value;
        }
      });
    });

    // Merge V7 clients with existing clients
    Object.entries(v7ClientMap).forEach(([clientKey, v7Client]) => {
      if (existingClientsMap[clientKey]) {
        // Merge with existing client
        const { client, index } = existingClientsMap[clientKey];
        
        // Add V7 document references
        const v7Files = v7Client.documents.map(doc => ({
          type: 'v7',
          entityId: doc.id,
          documentType: doc.type,
          createdAt: doc.created
        }));

        mergedData[attorneyName].clients[index] = {
          ...client,
          v7Files: v7Files,
          v7Data: v7Client.v7Data,
          hasV7Data: true
        };
      } else {
        // Add new client from V7
        const newClient = {
          name: v7Client.name,
          address: v7Client.v7Data.address || 'Address from V7',
          dob: v7Client.v7Data['date-of-birth'] || v7Client.v7Data.dob || 'N/A',
          phone: v7Client.v7Data.phone || 'N/A',
          ssn: v7Client.v7Data.ssn || 'N/A',
          filenames: [],
          v7Files: v7Client.documents.map(doc => ({
            type: 'v7',
            entityId: doc.id,
            documentType: doc.type,
            createdAt: doc.created
          })),
          v7Data: v7Client.v7Data,
          hasV7Data: true,
          isV7Only: true
        };

        mergedData[attorneyName].clients.push(newClient);
      }
    });
  });

  return mergedData;
};

// Normalize client names for matching
const normalizeClientName = (name) => {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

// Create a summary of V7 data for display
export const createV7Summary = (v7Data) => {
  if (!v7Data) return null;

  return {
    totalProjects: v7Data.projects?.length || 0,
    totalEntities: v7Data.totalEntities || 0,
    attorneys: Object.keys(v7Data.attorneyGroups || {}),
    clients: Object.keys(v7Data.clientGroups || {}),
    documentTypes: v7Data.documentTypes || {},
    projects: v7Data.projects || []
  };
};

// Map V7 document types to display names
export const getDocumentTypeDisplay = (docType) => {
  const typeMap = {
    'will': 'Last Will & Testament',
    'trust': 'Trust Agreement',
    'power-of-attorney': 'Power of Attorney',
    'healthcare-directive': 'Healthcare Directive',
    'estate-planning': 'Estate Planning Document',
    'property-deed': 'Property Deed',
    'beneficiary': 'Beneficiary Information'
  };

  return typeMap[docType?.toLowerCase()] || docType || 'Unknown Document';
};