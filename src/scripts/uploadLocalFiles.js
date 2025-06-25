// Script to help prepare local files for V7 upload
// This script maps the local file structure to prepare for upload

const fs = require('fs');
const path = require('path');

// Define the data directory structure
const dataDir = path.join(__dirname, '../data');
const attorneys = ['Morrison', 'Yamamoto', 'Blackwell'];

// Get all files for each attorney
function getAttorneyFiles(attorney) {
  const attorneyDir = path.join(dataDir, attorney);
  
  if (!fs.existsSync(attorneyDir)) {
    console.log(`No directory found for ${attorney}`);
    return [];
  }
  
  const files = fs.readdirSync(attorneyDir)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.txt', '.csv', '.docx', '.pdf'].includes(ext);
    })
    .map(filename => ({
      attorney,
      filename,
      path: path.join(attorneyDir, filename),
      size: fs.statSync(path.join(attorneyDir, filename)).size
    }));
  
  return files;
}

// Get all files organized by attorney
function getAllFiles() {
  const filesByAttorney = {};
  
  attorneys.forEach(attorney => {
    filesByAttorney[attorney] = getAttorneyFiles(attorney);
  });
  
  return filesByAttorney;
}

// Generate upload manifest
function generateManifest() {
  const files = getAllFiles();
  const manifest = {
    timestamp: new Date().toISOString(),
    attorneys: {},
    summary: {
      totalFiles: 0,
      totalSize: 0
    }
  };
  
  Object.entries(files).forEach(([attorney, attorneyFiles]) => {
    manifest.attorneys[attorney] = {
      files: attorneyFiles,
      count: attorneyFiles.length,
      totalSize: attorneyFiles.reduce((sum, file) => sum + file.size, 0)
    };
    
    manifest.summary.totalFiles += attorneyFiles.length;
    manifest.summary.totalSize += manifest.attorneys[attorney].totalSize;
  });
  
  return manifest;
}

// Main execution
console.log('=== Local Files Upload Manifest ===\n');
const manifest = generateManifest();

console.log(`Total Files: ${manifest.summary.totalFiles}`);
console.log(`Total Size: ${(manifest.summary.totalSize / 1024 / 1024).toFixed(2)} MB\n`);

Object.entries(manifest.attorneys).forEach(([attorney, data]) => {
  console.log(`\n${attorney}: ${data.count} files (${(data.totalSize / 1024).toFixed(2)} KB)`);
  data.files.forEach(file => {
    console.log(`  - ${file.filename} (${(file.size / 1024).toFixed(2)} KB)`);
  });
});

// Save manifest to file
const manifestPath = path.join(__dirname, 'upload-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\nManifest saved to: ${manifestPath}`);

console.log('\n=== Upload Instructions ===');
console.log('1. Use the "Upload Files to V7" button in the UI');
console.log('2. Select an attorney from the dropdown');
console.log('3. Choose files from the data/<attorney>/ directory');
console.log('4. Click "Upload to V7" to start the process');
console.log('5. V7 will extract client names and other information');
console.log('6. Click "Check Extraction Results" to see the extracted data');

module.exports = { getAllFiles, generateManifest };