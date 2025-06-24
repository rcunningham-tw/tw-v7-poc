import React, { useState } from 'react';
import './App.css';
import clientData from './clientData.json';
import { fileMapping } from './fileMapping';

function App() {
  const [activeAttorney, setActiveAttorney] = useState('Morrison');

  const attorneys = Object.keys(clientData);

  const getClientFiles = (attorneyName, clientName) => {
    return fileMapping[attorneyName]?.[clientName] || [];
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
              </div>

              <div className="files-section">
                <h4>Related Files:</h4>
                {getClientFiles(activeAttorney, client.name).length > 0 ? (
                  <ul className="file-list">
                    {getClientFiles(activeAttorney, client.name).map((file, idx) => (
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

        <div className="other-section">
          <h3>Other Individuals</h3>
          {clientData[activeAttorney].other_individuals.map((person, index) => (
            <div key={index} className="other-person">
              <p><strong>{person.name}</strong></p>
              <p className="relationship">{person.relationship}</p>
              <p className="address">{person.address}</p>
            </div>
          ))}
        </div>

        <div className="red-herring-section">
          <h3>Red Herring Files (Unrelated)</h3>
          <ul className="file-list">
            {fileMapping[activeAttorney]?.redHerring?.map((file, idx) => (
              <li key={idx} className="file-item red-herring">{file}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;