import React from 'react';
import './ComparisonView.css';

function ComparisonView({ localData, v7Data }) {
  // Calculate comparison metrics
  const calculateMetrics = () => {
    const metrics = {
      totalClients: 0,
      v7MatchedClients: 0,
      v7MissedClients: 0,
      v7ExtraClients: 0,
      fieldAccuracy: {
        clientName: { correct: 0, total: 0 },
        attorneyName: { correct: 0, total: 0 },
        address: { correct: 0, total: 0 },
        files: { correct: 0, total: 0 }
      }
    };

    // Get all unique client names from both sources
    const allClientNames = new Set();
    
    // Add local clients
    Object.values(localData).forEach(attorneyData => {
      attorneyData.clients?.forEach(client => {
        allClientNames.add(client.name.toLowerCase());
        metrics.totalClients++;
      });
    });

    // Check V7 data
    Object.entries(v7Data.clientGroups || {}).forEach(([clientName, v7Docs]) => {
      const normalizedName = clientName.toLowerCase();
      
      if (allClientNames.has(normalizedName)) {
        metrics.v7MatchedClients++;
      } else {
        metrics.v7ExtraClients++;
        allClientNames.add(normalizedName);
      }
    });

    metrics.v7MissedClients = metrics.totalClients - metrics.v7MatchedClients;

    return metrics;
  };

  const metrics = calculateMetrics();

  // Create comparison table data
  const createComparisonData = () => {
    const comparisons = [];

    // Process each attorney's clients
    Object.entries(localData).forEach(([attorneyName, attorneyData]) => {
      attorneyData.clients?.forEach(client => {
        const v7ClientData = v7Data.clientGroups?.[client.name] || 
                           v7Data.clientGroups?.[client.name.toLowerCase()] ||
                           Object.entries(v7Data.clientGroups || {}).find(([name]) => 
                             name.toLowerCase() === client.name.toLowerCase()
                           )?.[1];

        const v7AttorneyData = v7Data.attorneyGroups?.[attorneyName];
        
        comparisons.push({
          attorneyName,
          localClient: client,
          v7Data: v7ClientData,
          v7Attorney: v7AttorneyData,
          hasV7Match: !!v7ClientData
        });
      });
    });

    // Add V7-only clients
    Object.entries(v7Data.clientGroups || {}).forEach(([clientName, v7Docs]) => {
      const isAlreadyIncluded = comparisons.some(comp => 
        comp.localClient?.name.toLowerCase() === clientName.toLowerCase()
      );
      
      if (!isAlreadyIncluded && v7Docs.length > 0) {
        comparisons.push({
          attorneyName: v7Docs[0].attorney || 'Unknown',
          localClient: null,
          v7Data: v7Docs,
          v7Attorney: v7Data.attorneyGroups?.[v7Docs[0].attorney],
          hasV7Match: true,
          isV7Only: true
        });
      }
    });

    return comparisons;
  };

  const comparisonData = createComparisonData();

  return (
    <div className="comparison-view">
      <div className="metrics-summary">
        <h2>V7 Extraction Performance</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{metrics.totalClients}</div>
            <div className="metric-label">Total Clients in Answer Sheet</div>
          </div>
          <div className="metric-card success">
            <div className="metric-value">{metrics.v7MatchedClients}</div>
            <div className="metric-label">Correctly Identified by V7</div>
          </div>
          <div className="metric-card warning">
            <div className="metric-value">{metrics.v7MissedClients}</div>
            <div className="metric-label">Missed by V7</div>
          </div>
          <div className="metric-card info">
            <div className="metric-value">{metrics.v7ExtraClients}</div>
            <div className="metric-label">Additional V7 Findings</div>
          </div>
        </div>
      </div>

      <div className="comparison-table-section">
        <h2>Detailed Comparison</h2>
        <div className="comparison-table">
          <div className="table-header">
            <div className="col-attorney">Attorney</div>
            <div className="col-client">Client Name</div>
            <div className="col-answer">Answer Sheet Data</div>
            <div className="col-v7">V7 Extracted Data</div>
            <div className="col-status">Status</div>
          </div>
          
          {comparisonData.map((comp, index) => (
            <div key={index} className={`table-row ${comp.isV7Only ? 'v7-only' : ''} ${!comp.hasV7Match ? 'missed' : ''}`}>
              <div className="col-attorney">{comp.attorneyName}</div>
              <div className="col-client">
                {comp.localClient?.name || comp.v7Data?.[0]?.client || 'Unknown'}
              </div>
              <div className="col-answer">
                {comp.localClient ? (
                  <div className="data-details">
                    <p><strong>Address:</strong> {comp.localClient.address}</p>
                    <p><strong>DOB:</strong> {comp.localClient.dob}</p>
                    <p><strong>Phone:</strong> {comp.localClient.phone}</p>
                    <p><strong>Files:</strong> {comp.localClient.filenames?.length || 0}</p>
                  </div>
                ) : (
                  <div className="no-data">Not in answer sheet</div>
                )}
              </div>
              <div className="col-v7">
                {comp.v7Data ? (
                  <div className="data-details">
                    <p><strong>Address:</strong> {comp.v7Data[0]?.address || 'Not extracted'}</p>
                    <p><strong>Type:</strong> {comp.v7Data[0]?.type || 'Not extracted'}</p>
                    <p><strong>Documents:</strong> {comp.v7Data.length}</p>
                    {comp.v7Data && comp.v7Data.length > 0 && comp.v7Data[0].originalFilename && (
                      <p><strong>File:</strong> {comp.v7Data[0].originalFilename}</p>
                    )}
                  </div>
                ) : (
                  <div className="no-data">Not found by V7</div>
                )}
              </div>
              <div className="col-status">
                {comp.isV7Only ? (
                  <span className="status-badge v7-extra">V7 Only</span>
                ) : comp.hasV7Match ? (
                  <span className="status-badge matched">Matched</span>
                ) : (
                  <span className="status-badge missed">Missed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="accuracy-summary">
        <h3>Accuracy Summary</h3>
        <p>
          V7 successfully identified <strong>{metrics.v7MatchedClients}</strong> out of{' '}
          <strong>{metrics.totalClients}</strong> clients from the answer sheet
          ({metrics.totalClients > 0 ? Math.round((metrics.v7MatchedClients / metrics.totalClients) * 100) : 0}% accuracy).
        </p>
        {metrics.v7ExtraClients > 0 && (
          <p>
            V7 also found <strong>{metrics.v7ExtraClients}</strong> additional clients not in the answer sheet.
          </p>
        )}
      </div>
    </div>
  );
}

export default ComparisonView;