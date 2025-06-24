import React, { useState } from 'react';
import './App.css';
import clientData from './data/clientData.json';

function App() {
  const [activeAttorney, setActiveAttorney] = useState('Morrison');

  const attorneys = Object.keys(clientData);

  const getClientFiles = (client) => {
    return client.filenames || [];
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
    return otherIndividuals.filter(person => 
      person.relationship.toLowerCase().includes(client.name.toLowerCase()) ||
      person.relationship.toLowerCase().includes(client.name.split(' ')[0].toLowerCase()) ||
      person.relationship.toLowerCase().includes(client.name.split(' ')[2]?.toLowerCase())
    );
  };

  const getFileGraph = () => {
    const fileMap = new Map();
    
    // Add files assigned to clients
    clientData[activeAttorney].clients.forEach(client => {
      (client.filenames || []).forEach(filename => {
        if (!fileMap.has(filename)) {
          fileMap.set(filename, []);
        }
        fileMap.get(filename).push(client.name);
      });
    });
    
    // Add red herring files with empty client arrays
    const redHerringFiles = getRedHerringFiles();
    redHerringFiles.forEach(filename => {
      if (!fileMap.has(filename)) {
        fileMap.set(filename, []);
      }
    });
    
    return Array.from(fileMap.entries()).map(([filename, clients]) => ({
      filename,
      clients
    }));
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
    clientData[activeAttorney].clients.forEach(client => {
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
          {clientData[activeAttorney].clients.map((client, index) => (
            <div key={index} className="client-card">
              <h3>{client.name}</h3>
              <div className="client-details">
                <p><strong>DOB:</strong> {client.dob}</p>
                <p><strong>Address:</strong> {client.address}</p>
                <p><strong>Phone:</strong> {client.phone}</p>
                <p><strong>SSN:</strong> {client.ssn}</p>
              </div>

              <div className="relatives-section">
                <h4>People in Client's Orbit:</h4>
                {getRelatives(client).map((relative, idx) => (
                  <div key={idx} className="relative-item">
                    <p><strong>{relative.name}</strong> ({relative.relationship})</p>
                    {relative.address && <p className="address">Address: {relative.address}</p>}
                  </div>
                ))}
                {getConnectedOthers(client, clientData[activeAttorney].other_individuals).map((person, idx) => (
                  <div key={`other-${idx}`} className="relative-item other-connection">
                    <p><strong>{person.name}</strong></p>
                    <p className="relationship">{person.relationship}</p>
                    <p className="address">Address: {person.address}</p>
                  </div>
                ))}
              </div>

              <div className="files-section">
                <h4>Related Files:</h4>
                {getClientFiles(client).length > 0 ? (
                  <ul className="file-list">
                    {getClientFiles(client).map((file, idx) => (
                      <li key={idx} className="file-item">{file}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-files">No files associated with this client</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="file-graph-section">
          <h3>File Graph - All Files for {activeAttorney}</h3>
          <div className="file-graph">
            {getFileGraph().map(({ filename, clients }, index) => (
              <div key={index} className="file-node">
                <div className="file-name">{filename}</div>
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
    </div>
  );
}

export default App;