import { useState, useEffect } from 'react';
import v7Api from '../services/v7Api';

// Custom hook for fetching and managing V7 data
function useV7Data() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const v7Data = await v7Api.fetchAllData();
        console.log('V7 Data received in hook:', v7Data);
        setData(v7Data);
      } catch (err) {
        setError(err.message || 'Failed to fetch V7 data');
        console.error('Error in useV7Data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const v7Data = await v7Api.fetchAllData();
      console.log('V7 Data received in refetch:', v7Data);
      setData(v7Data);
    } catch (err) {
      setError(err.message || 'Failed to fetch V7 data');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

// Hook for mapping V7 data to the existing client data structure
export function useV7ClientData() {
  const { data: v7Data, loading, error } = useV7Data();
  const [clientData, setClientData] = useState(null);

  useEffect(() => {
    if (!v7Data) return;

    // Transform V7 data to match the existing client data structure
    const transformedData = {};

    // Process each attorney's data
    Object.entries(v7Data.attorneyGroups).forEach(([attorneyName, documents]) => {
      // Initialize attorney structure
      if (!transformedData[attorneyName]) {
        transformedData[attorneyName] = {
          clients: [],
          other_individuals: []
        };
      }

      // Group documents by client
      const clientMap = {};
      
      documents.forEach(doc => {
        if (!doc.client) return;

        if (!clientMap[doc.client]) {
          clientMap[doc.client] = {
            name: doc.client,
            address: doc.address || 'Address not available',
            dob: 'DOB not available',
            phone: 'Phone not available',
            ssn: 'SSN not available',
            filenames: [],
            children: [],
            spouse: null,
            v7EntityIds: []
          };
        }

        // Add document info
        if (doc.type) {
          const filename = `${doc.type}_${doc.id.slice(-8)}.v7`;
          clientMap[doc.client].filenames.push(filename);
        }
        
        clientMap[doc.client].v7EntityIds.push(doc.id);
        
        // Extract additional info from fields if available
        Object.entries(doc.fields).forEach(([fieldName, fieldData]) => {
          const value = fieldData.value || fieldData.manual_value?.value;
          
          if (fieldName.toLowerCase().includes('dob') || fieldName.toLowerCase().includes('birth')) {
            clientMap[doc.client].dob = value || clientMap[doc.client].dob;
          } else if (fieldName.toLowerCase().includes('phone')) {
            clientMap[doc.client].phone = value || clientMap[doc.client].phone;
          } else if (fieldName.toLowerCase().includes('ssn') || fieldName.toLowerCase().includes('social')) {
            clientMap[doc.client].ssn = value || clientMap[doc.client].ssn;
          } else if (fieldName.toLowerCase().includes('spouse')) {
            clientMap[doc.client].spouse = value || clientMap[doc.client].spouse;
          }
        });
      });

      // Convert client map to array
      transformedData[attorneyName].clients = Object.values(clientMap);
    });

    setClientData(transformedData);
  }, [v7Data]);

  return { clientData, loading, error, v7Data };
}

export { useV7Data };