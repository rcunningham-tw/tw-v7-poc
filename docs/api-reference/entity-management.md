# V7 Entity Management API Reference

## Overview
V7's entity management system is the core of their document processing platform. Each document uploaded becomes an "entity" that can have properties extracted, processed, and managed through the API.

## Key Concepts

### Entities
- Represent individual documents or data records
- Can have multiple properties/fields
- Support various file formats (.docx, .pdf, .txt, .csv, .json, .xml)
- Each entity has a unique ID for tracking

### Properties
- Define what information to extract from entities
- Have unique slugs for programmatic access
- Support various data types (text, boolean, dates, etc.)
- Can be configured for manual or automated extraction

## Core Entity APIs

### 1. Create Entity
**Endpoint**: `POST /workspaces/{workspace_id}/projects/{project_id}/entities`

**Key Features**:
- Can pre-populate fields when creating
- Supports synchronous processing with `wait_for` parameter
- Returns entity ID immediately for tracking

**Example**:
```python
# Create entity with pre-populated field
payload = {
    "fields": {
        "client-name": "John Smith Estate",
        "document-type": "Will"
    }
}
response = requests.post(url, json=payload, headers=headers)
```

**Synchronous Processing**:
```python
# Wait for specific fields to complete processing
url = f"{base_url}/entities?wait_for[]=client-name&wait_for[]=document-type"
```

### 2. List Entities
**Endpoint**: `GET /workspaces/{workspace_id}/projects/{project_id}/entity_ids`

**Features**:
- Supports pagination (limit, offset, first, last, after, before)
- Can filter by parent_entity_id
- Supports ordering by property values
- Returns entity IDs for efficient processing

**Query Parameters**:
- `order_by`: Array of property slugs to sort by
- `order_directions`: Array of sort directions
- `limit`: Maximum records to return
- `offset`: Pagination offset

### 3. Get Entity Details
**Endpoint**: `GET /workspaces/{workspace_id}/projects/{project_id}/entities/{entity_id}`

Returns complete entity information including all field values and processing status.

## File Upload Methods

### 1. Local File Upload
- Direct upload from local storage
- Supports multiple file formats
- Can attach files to existing entities

### 2. URL Upload
- Upload files from publicly accessible URLs
- Useful for cloud storage integration

### 3. Base64 Upload
- Direct encoding support
- Ideal for programmatic file generation

### 4. Collection Upload
- Bulk file management
- Organized storage for related documents

## Property Management

### List Project Properties
**Endpoint**: `GET /workspaces/{workspace_id}/projects/{project_id}/properties`

Returns all properties configured for a project, including:
- Property name and slug
- Data type
- Configuration settings
- Processing rules

## Best Practices for Attorney Document Management

### 1. Property Design
For estate planning documents, recommended properties:
- `client-name`: Primary client identifier
- `document-type`: Will, Trust, Power of Attorney, etc.
- `execution-date`: Document signing date
- `beneficiaries`: List of beneficiaries
- `property-addresses`: Real estate references
- `attorney-name`: Preparing attorney
- `client-address`: For entity matching

### 2. Entity Creation Flow
1. Upload document via preferred method
2. Create entity with known metadata
3. Use `wait_for` for critical fields
4. Set up webhooks for completion notifications

### 3. Batch Processing
- Use bulk upload for document crates
- Leverage async processing for large volumes
- Implement retry logic for failed extractions

### 4. Entity Matching Strategy
- Use client addresses as primary identifiers
- Match on normalized client names
- Cross-reference document dates
- Group by attorney crate for initial organization