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
    
    clientData[activeAttorney].clients.forEach(client => {
      (client.filenames || []).forEach(filename => {
        if (!fileMap.has(filename)) {
          fileMap.set(filename, []);
        }
        fileMap.get(filename).push(client.name);
      });
    });
    
    return Array.from(fileMap.entries()).map(([filename, clients]) => ({
      filename,
      clients
    }));
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