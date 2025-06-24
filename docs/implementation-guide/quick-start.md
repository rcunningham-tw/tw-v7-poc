# V7 Attorney Document Management - Quick Start Guide

## Prerequisites

1. V7 Go Account with API access
2. Python 3.8+ or Node.js 14+
3. Webhook endpoint (for automation)
4. Sample attorney document crate

## Initial Setup

### 1. Generate API Key

1. Log into V7 Go platform
2. Navigate to Settings → API Keys
3. Create new API key with appropriate permissions
4. Store securely in environment variables

```bash
export V7_API_KEY="your-api-key-here"
export V7_WORKSPACE_ID="your-workspace-id"
```

### 2. Install SDK/Dependencies

```bash
# Python
pip install requests python-dotenv

# Node.js
npm install axios dotenv
```

## Create Your First Project

### Step 1: Set Up Project Structure

```python
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
API_KEY = os.getenv('V7_API_KEY')
WORKSPACE_ID = os.getenv('V7_WORKSPACE_ID')
BASE_URL = 'https://go.v7labs.com/api'

headers = {
    'X-API-KEY': API_KEY,
    'Content-Type': 'application/json'
}

# Create main project
project_data = {
    'name': 'Estate Planning Documents',
    'description': 'Attorney document management system'
}

response = requests.post(
    f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects',
    json=project_data,
    headers=headers
)

project_id = response.json()['id']
print(f"Created project: {project_id}")
```

### Step 2: Define Properties

```python
# Define properties for estate documents
properties = [
    {
        'name': 'Client Name',
        'slug': 'client-name',
        'type': 'text',
        'required': True
    },
    {
        'name': 'Document Type',
        'slug': 'document-type',
        'type': 'enum',
        'options': ['will', 'trust', 'power-of-attorney', 'healthcare-directive', 'other'],
        'required': True
    },
    {
        'name': 'Client Address',
        'slug': 'client-address',
        'type': 'text',
        'required': False
    },
    {
        'name': 'Execution Date',
        'slug': 'execution-date',
        'type': 'date',
        'required': False
    },
    {
        'name': 'Attorney Name',
        'slug': 'attorney-name',
        'type': 'text',
        'required': True
    }
]

# Add properties to project
for prop in properties:
    response = requests.post(
        f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects/{project_id}/properties',
        json=prop,
        headers=headers
    )
    print(f"Added property: {prop['name']}")
```

## Upload Your First Document

### Method 1: Local File Upload

```python
def upload_document(file_path, metadata=None):
    """Upload a document and create an entity"""
    
    # Step 1: Get upload URL
    upload_request = requests.post(
        f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects/{project_id}/upload',
        headers=headers
    )
    upload_data = upload_request.json()
    
    # Step 2: Upload file to presigned URL
    with open(file_path, 'rb') as f:
        files = {'file': f}
        requests.put(upload_data['upload_url'], files=files)
    
    # Step 3: Create entity with metadata
    entity_data = {
        'file_id': upload_data['file_id'],
        'fields': metadata or {}
    }
    
    response = requests.post(
        f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects/{project_id}/entities',
        json=entity_data,
        headers=headers
    )
    
    return response.json()

# Upload a will document
entity = upload_document(
    'samples/smith_will.pdf',
    metadata={
        'attorney-name': 'Blackwell',
        'document-type': 'will'
    }
)
print(f"Created entity: {entity['id']}")
```

### Method 2: Batch Upload Collection

```python
def create_attorney_collection(attorney_name, document_paths):
    """Create a collection for an attorney's document crate"""
    
    # Create collection
    collection_data = {
        'name': f'{attorney_name} Document Crate',
        'description': f'Estate planning documents from {attorney_name}'
    }
    
    response = requests.post(
        f'{BASE_URL}/workspaces/{WORKSPACE_ID}/collections',
        json=collection_data,
        headers=headers
    )
    
    collection_id = response.json()['child_project_id']
    
    # Upload documents to collection
    for doc_path in document_paths:
        upload_document_to_collection(collection_id, doc_path, {
            'attorney-name': attorney_name
        })
    
    return collection_id
```

## Set Up Basic Automation

### Create a Webhook Trigger

```python
def setup_client_identification_webhook(webhook_url):
    """Set up webhook for when client name is extracted"""
    
    trigger_data = {
        'event_type': 'entity.field_completed',
        'webhook_url': webhook_url,
        'filters': {
            'field_slug': 'client-name'
        },
        'name': 'Client Identification Trigger'
    }
    
    response = requests.post(
        f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects/{project_id}/triggers',
        json=trigger_data,
        headers=headers
    )
    
    return response.json()

# Set up webhook
webhook_url = 'https://your-server.com/webhooks/client-identified'
trigger = setup_client_identification_webhook(webhook_url)
print(f"Created trigger: {trigger['id']}")
```

### Basic Webhook Handler

```python
from flask import Flask, request
app = Flask(__name__)

@app.route('/webhooks/client-identified', methods=['POST'])
def handle_client_identified():
    data = request.json
    
    entity_id = data['entity_id']
    client_name = data['field_value']
    
    # Search for existing client
    existing_clients = search_clients_by_name(client_name)
    
    if existing_clients:
        # Link to existing client
        update_entity_metadata(entity_id, {
            'client_id': existing_clients[0]['id']
        })
    else:
        # Create new client record
        client_id = create_new_client(client_name)
        update_entity_metadata(entity_id, {
            'client_id': client_id
        })
    
    return {'status': 'success'}, 200
```

## Query and Retrieve Documents

### List All Entities

```python
def list_documents(filters=None):
    """List all documents in the project"""
    
    params = filters or {}
    response = requests.get(
        f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects/{project_id}/entities',
        params=params,
        headers=headers
    )
    
    return response.json()['entities']

# Get all wills
wills = list_documents({
    'filter[document-type]': 'will'
})

# Get documents for specific client
client_docs = list_documents({
    'filter[client-name]': 'John Smith'
})
```

### Get Entity Details

```python
def get_document_details(entity_id):
    """Get full details of a document"""
    
    response = requests.get(
        f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects/{project_id}/entities/{entity_id}',
        headers=headers
    )
    
    return response.json()

# Get document details
doc = get_document_details(entity_id)
print(f"Document: {doc['fields']['document-type']['value']}")
print(f"Client: {doc['fields']['client-name']['value']}")
```

## Next Steps

### 1. Process Full Attorney Crate
```python
# Process Blackwell's documents
import glob

blackwell_docs = glob.glob('crates/blackwell/*.pdf')
collection_id = create_attorney_collection('Blackwell', blackwell_docs)
```

### 2. Implement Client Matching
- Set up fuzzy matching algorithm
- Create client database
- Build relationship tracking

### 3. Add Reporting
- Document processing statistics
- Client document summaries
- Attorney workload reports

### 4. Enhance Automation
- Multi-step processing workflows
- Quality control checks
- Notification system

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify API key is correct
   - Check workspace ID
   - Ensure proper permissions

2. **Upload Failures**
   - Check file size limits
   - Verify file format support
   - Ensure network connectivity

3. **Extraction Issues**
   - Review property configuration
   - Check document quality
   - Adjust confidence thresholds

### Getting Help

- V7 Documentation: https://docs.go.v7labs.com
- API Reference: https://docs.go.v7labs.com/reference
- Support: support@v7labs.com