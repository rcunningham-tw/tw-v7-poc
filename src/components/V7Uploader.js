import React, { useState, useRef } from 'react';
import v7UploadService from '../services/v7Upload';
import './V7Uploader.css';

function V7Uploader({ onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedAttorney, setSelectedAttorney] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadResults, setUploadResults] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const fileInputRef = useRef(null);

  const attorneys = ['Morrison', 'Yamamoto', 'Blackwell', 'Fitzgerald', 'Template'];

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!selectedAttorney || selectedFiles.length === 0) {
      alert('Please select an attorney and at least one file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Use the specific project ID
      let currentProjectId = projectId;
      if (!currentProjectId) {
        // Use the extraction project ID directly
        currentProjectId = '0197a2b7-971d-7e9b-87ba-59bd6e2aed3f';
        setProjectId(currentProjectId);
        console.log('Using V7 project:', currentProjectId);
      }

      // Upload all files
      const results = await v7UploadService.uploadBatch(
        currentProjectId,
        selectedFiles,
        selectedAttorney,
        setUploadProgress
      );

      setUploadResults(results);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(currentProjectId, results);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCheckResults = async () => {
    if (!projectId) return;

    try {
      const entities = await v7UploadService.getProjectResults(projectId);
      console.log('Extraction results:', entities);
      
      // Display results in a modal or update the UI
      const extractedData = entities.map(entity => {
        const fields = entity.fields || {};
        const clientName = fields['client-name']?.manual_value?.value || 
                         fields['client-name']?.tool_value?.value || 
                         'Not extracted';
        
        return {
          id: entity.id,
          originalFile: entity.metadata?.originalFilename || 'Unknown',
          attorneyName: fields['attorney-name']?.manual_value?.value || selectedAttorney,
          clientName,
          allFields: fields
        };
      });

      console.log('Processed extraction results:', extractedData);
      alert(`Found ${extractedData.length} documents. Check console for details.`);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      alert(`Failed to fetch results: ${error.message}`);
    }
  };

  const resetUploader = () => {
    setSelectedFiles([]);
    setUploadResults(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="v7-uploader">
      <h2>Upload Documents to V7</h2>
      
      <div className="upload-form">
        <div className="form-group">
          <label>Select Attorney:</label>
          <select 
            value={selectedAttorney} 
            onChange={(e) => setSelectedAttorney(e.target.value)}
            disabled={isUploading}
          >
            <option value="">-- Select Attorney --</option>
            {attorneys.map(attorney => (
              <option key={attorney} value={attorney}>{attorney}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Select Files:</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.pdf,.doc,.docx,.csv"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <p>Selected {selectedFiles.length} file(s):</p>
              <ul>
                {selectedFiles.map((file, idx) => (
                  <li key={idx}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="button-group">
          <button 
            onClick={handleUpload} 
            disabled={isUploading || !selectedAttorney || selectedFiles.length === 0}
            className="upload-button"
          >
            {isUploading ? 'Uploading...' : 'Upload to V7'}
          </button>
          
          {projectId && (
            <button 
              onClick={handleCheckResults}
              disabled={isUploading}
              className="check-button"
            >
              Check Extraction Results
            </button>
          )}
          
          <button 
            onClick={resetUploader}
            disabled={isUploading}
            className="reset-button"
          >
            Reset
          </button>
        </div>

        {isUploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p>{uploadProgress.toFixed(1)}% Complete</p>
          </div>
        )}

        {uploadResults && (
          <div className="upload-results">
            <h3>Upload Results:</h3>
            <ul>
              {uploadResults.map((result, idx) => (
                <li key={idx} className={result.success ? 'success' : 'error'}>
                  {result.filename}: {result.success ? '✅ Success' : `❌ ${result.error}`}
                  {result.entityId && <span> (Entity: {result.entityId})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="upload-info">
        <h4>How it works:</h4>
        <ol>
          <li>Select the attorney who owns these documents</li>
          <li>Choose one or more files from your local data directory</li>
          <li>Click "Upload to V7" to send files for processing</li>
          <li>V7 will extract client names and other information</li>
          <li>Click "Check Extraction Results" to see what V7 found</li>
        </ol>
      </div>
    </div>
  );
}

export default V7Uploader;