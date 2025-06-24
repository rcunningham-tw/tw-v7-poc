import React, { useState, useEffect } from 'react';
import './App.css';
import localClientData from './data/clientData.json';
import { useV7Data } from './hooks/useV7Data';
import { mergeClientData, createV7Summary, getDocumentTypeDisplay } from './utils/dataMerger';
import ComparisonView from './components/ComparisonView';

function App() {
  const [activeAttorney, setActiveAttorney] = useState('Morrison');
  const [shouldUseV7Data, setShouldUseV7Data] = useState(true);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [clientData, setClientData] = useState(localClientData);
  
  // Fetch V7 data
  const { data: v7Data, loading: v7Loading, error: v7Error, refetch } = useV7Data();

  // Merge V7 data with local data when available
  useEffect(() => {
    if (v7Data && shouldUseV7Data) {
      const mergedData = mergeClientData(localClientData, v7Data);
      setClientData(mergedData);
    } else {
      setClientData(localClientData);
    }
  }, [v7Data, shouldUseV7Data]);

  const attorneys = Object.keys(clientData);
  const v7Summary = v7Data ? createV7Summary(v7Data) : null;

  const getClientFiles = (client) => {
    const localFiles = client.filenames || [];
    const v7Files = client.v7Files || [];
    return { localFiles, v7Files };
  };

  const getRelatives = (client) => {
    const relatives = [];
    if (client.spouse && client.spouse !== 'Divorced') {
      relatives.push({ name: client.spouse, relationship: 'Spouse' });
    }
    if (client.children) {
      client.children.forEach(child => {
        relatives.push({ ...child, relationship: 'Child' });
      });
    }
    return relatives;
  };

  const getConnectedOthers = (client, otherIndividuals) => {
    if (!otherIndividuals) return [];
    return otherIndividuals.filter(person => 
      person.relationship.toLowerCase().includes(client.name.toLowerCase()) ||
      person.relationship.toLowerCase().includes(client.name.split(' ')[0].toLowerCase()) ||
      person.relationship.toLowerCase().includes(client.name.split(' ')[2]?.toLowerCase())
    );
  };

  const getFileGraph = () => {
    const fileMap = new Map();
    
    // Add files assigned to clients
    clientData[activeAttorney]?.clients?.forEach(client => {
      // Local files
      (client.filenames || []).forEach(filename => {
        if (!fileMap.has(filename)) {
          fileMap.set(filename, { clients: [], type: 'local' });
        }
        fileMap.get(filename).clients.push(client.name);
      });

      // V7 files
      (client.v7Files || []).forEach(v7File => {
        const filename = v7File.originalFilename || `${v7File.documentType || 'Document'}_${v7File.entityId.slice(-8)}`;
        if (!fileMap.has(filename)) {
          fileMap.set(filename, { 
            clients: [], 
            type: 'v7', 
            entityId: v7File.entityId,
            originalFilename: v7File.originalFilename 
          });
        }
        fileMap.get(filename).clients.push(client.name);
      });
    });
    
    // Add red herring files with empty client arrays
    const redHerringFiles = getRedHerringFiles();
    redHerringFiles.forEach(filename => {
      if (!fileMap.has(filename)) {
        fileMap.set(filename, { clients: [], type: 'local' });
      }
    });
    
    return Array.from(fileMap.entries())
      .map(([filename, data]) => ({
        filename,
        clients: data.clients,
        type: data.type,
        entityId: data.entityId
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename));
  };

  const getRedHerringFiles = () => {
    // Define all files for each attorney (manually curated based on the data directory)
    const allFilesByAttorney = {
      Morrison: [
        'Family_Contact_List.csv',
        'Insurance_Claim_2021.txt',
        'LastWillTestament_2023_draft.txt',
        'Property_Transfer_Deed.docx',
        'TRUST_AGREEMENT_2022.txt',
        'auto_transfer_record.csv',
        'beneficiary_info_mitchell.txt',
        'estate_planning_letter_jc.docx',
        'marina_lease_agreement.docx',
        'medical_directive_draft.txt',
        'misc_correspondence_2023.txt',
        'tax_summary_2022.txt',
        'vehicle_sale_agreement_2023.txt',
        'will_revision_notes.txt'
      ],
      Fitzgerald: [
        '2023_HOLOGRAPHIC_WILL.txt',
        'AZ_DMV_Title_Transfer.txt',
        'IRS_Form_706_Draft.txt',
        'PODER_NOTARIAL_Martinez.txt',
        'SullivanTrustAmendment_03.pdf',
        'business_valuation_2023Q2.csv',
        'correspondence_08_15_23.txt',
        'medical_lien_notice.txt',
        'mineral_rights_assignment.docx',
        'native_american_artifact_appraisal.docx',
        'ranch_deed_1987.txt',
        'restaurant_lease_2019.txt'
      ],
      Yamamoto: [
        'ENVIRONMENTAL_TRUST_DEED.md',
        'OLCC_license_transfer.txt',
        'brewery_acquisition_loi.txt',
        'carbon_offset_portfolio.csv',
        'employee_handbook_acknowledgment.pdf',
        'hop_farm_purchase_2021.txt',
        'maritime_insurance_claim.docx',
        'orcas_island_property.eml',
        'restricted_stock_agreement_MSFT.json',
        'solar_investment_k1_2022.txt',
        'startup_equity_docs.xml',
        'vessel_documentation_2023.yaml'
      ],
      Blackwell: [
        'MUSIC_ROYALTY_AUDIT_2023Q2.tsv',
        'NFL_pension_distribution.html',
        'annual_disclosure_2023.tex.md',
        'caribbean_development_permits.json5',
        'entertainment_venue_licenses.ini',
        'offshore_company_formation.tex',
        'production_company_distribution.toml',
        'recording_studio_lease.asc',
        'stadium_naming_rights.sql',
        'vessel_registration_malta.log',
        'yacht_charter_agreement.rtf'
      ]
    };

    const attorneyFiles = allFilesByAttorney[activeAttorney] || [];
    
    // Get all files assigned to clients
    const assignedFiles = new Set();
    clientData[activeAttorney]?.clients?.forEach(client => {
      (client.filenames || []).forEach(filename => {
        assignedFiles.add(filename);
      });
    });

    // Return files that aren't assigned to any client
    return attorneyFiles.filter(file => !assignedFiles.has(file));
  };

  return (
    <div className="App">
      <h1>Attorney Client Answer Sheet</h1>
      
      <div className="v7-controls">
        <label className="v7-toggle">
          <input 
            type="checkbox" 
            checked={shouldUseV7Data} 
            onChange={(e) => setShouldUseV7Data(e.target.checked)}
          />
          Use V7 Data
        </label>
        {v7Loading && <span className="loading">Loading V7 data...</span>}
        {v7Error && (
          <span className="error" title={v7Error}>
            V7 Error: {v7Error.includes('credentials') ? 
              'Credentials not configured (restart server after adding .env)' : 
              v7Error.includes('CORS') ? 
                'CORS blocked - V7 API requires server-side access' : 
                v7Error
            }
          </span>
        )}
        {v7Summary && shouldUseV7Data && (
          <span className="v7-summary">
            V7: {v7Summary.totalEntities} documents, {v7Summary.clients.length} clients
          </span>
        )}
        <button onClick={refetch} disabled={v7Loading}>Refresh V7 Data</button>
        {v7Data && (
          <button 
            onClick={() => setShowComparisonView(!showComparisonView)}
          >
            {showComparisonView ? 'Show Normal View' : 'Show Comparison View'}
          </button>
        )}
      </div>
      
      {showComparisonView && v7Data ? (
        <ComparisonView localData={localClientData} v7Data={v7Data} />
      ) : (
        <>
          <div className="attorney-tabs">
        {attorneys.map(attorney => (
          <button 
            key={attorney}
            className={`tab ${activeAttorney === attorney ? 'active' : ''}`}
            onClick={() => setActiveAttorney(attorney)}
          >
            {attorney}
          </button>
        ))}
      </div>

      <div className="attorney-content">
        <h2>{activeAttorney}'s Clients</h2>
        
        <div className="clients-section">
          {clientData[activeAttorney]?.clients?.map((client, index) => (
            <div key={index} className={`client-card ${client.hasV7Data ? 'has-v7' : ''} ${client.isV7Only ? 'v7-only' : ''}`}>
              <h3>
                {client.name}
                {client.hasV7Data && <span className="v7-indicator" title="Has V7 data">V7</span>}
              </h3>
              <div className="client-details">
                <p><strong>DOB:</strong> {client.dob}</p>
                <p><strong>Address:</strong> {client.address}</p>
                <p><strong>Phone:</strong> {client.phone}</p>
                <p><strong>SSN:</strong> {client.ssn}</p>
              </div>

              {client.v7Data && (
                <div className="v7-fields">
                  <h4>V7 Extracted Data:</h4>
                  {Object.entries(client.v7Data).map(([field, value]) => (
                    <p key={field}><strong>{field}:</strong> {value}</p>
                  ))}
                </div>
              )}

              <div className="relatives-section">
                <h4>People in Client's Orbit:</h4>
                {getRelatives(client).map((relative, idx) => (
                  <div key={idx} className="relative-item">
                    <p><strong>{relative.name}</strong> ({relative.relationship})</p>
                    {relative.address && <p className="address">Address: {relative.address}</p>}
                  </div>
                ))}
                {getConnectedOthers(client, clientData[activeAttorney]?.other_individuals).map((person, idx) => (
                  <div key={`other-${idx}`} className="relative-item other-connection">
                    <p><strong>{person.name}</strong></p>
                    <p className="relationship">{person.relationship}</p>
                    <p className="address">Address: {person.address}</p>
                  </div>
                ))}
              </div>

              <div className="files-section">
                <h4>Related Files:</h4>
                {(() => {
                  const { localFiles, v7Files } = getClientFiles(client);
                  const hasFiles = localFiles.length > 0 || v7Files.length > 0;
                  
                  if (!hasFiles) {
                    return <p className="no-files">No files associated with this client</p>;
                  }

                  return (
                    <>
                      {localFiles.length > 0 && (
                        <>
                          <h5>Local Files:</h5>
                          <ul className="file-list">
                            {localFiles.map((file, idx) => (
                              <li key={idx} className="file-item">{file}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {v7Files.length > 0 && (
                        <>
                          <h5>V7 Documents:</h5>
                          <ul className="file-list v7-files">
                            {v7Files.map((v7File, idx) => (
                              <li key={idx} className="file-item v7-file">
                                {v7File.originalFilename || getDocumentTypeDisplay(v7File.documentType)}
                                {!v7File.originalFilename && (
                                  <span className="entity-id" title={`Entity ID: ${v7File.entityId}`}>
                                    ({v7File.entityId.slice(-8)})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        <div className="file-graph-section">
          <h3>File Graph - All Files for {activeAttorney}</h3>
          <div className="file-graph">
            {getFileGraph().map(({ filename, clients, type, entityId }, index) => (
              <div key={index} className={`file-node ${type}`}>
                <div className="file-name">
                  {filename}
                  {type === 'v7' && <span className="v7-badge">V7</span>}
                </div>
                <div className="client-connections">
                  {clients.map((clientName, idx) => (
                    <span key={idx} className="client-tag">{clientName}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
        </>
      )}
    </div>
  );
}

export default App;