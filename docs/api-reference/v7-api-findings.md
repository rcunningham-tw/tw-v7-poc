# V7 Go API Findings for Estate Document Processing Agent

## Overview
This document summarizes the key V7 Go API capabilities that are relevant for building an intelligent document management system for estate planning attorneys.

## Authentication
- **API Key Generation**: Required for all API calls
- **Header**: `X-API-KEY: <your-key>`
- **Base URL**: `https://go.v7labs.com/api/`

## Core API Components Relevant to Estate Document Processing

### 1. Entity Management APIs
Entities in V7 represent individual data records (documents) that need processing.

#### Key Endpoints:
- **Create Entity**: `POST /workspaces/{workspace_id}/projects/{project_id}/entities`
  - Can pre-populate fields when creating entities
  - Supports synchronous processing with `wait_for` parameter
  - Returns entity ID for tracking

- **List Entities**: `POST /workspaces/{workspace_id}/projects/{project_id}/entities/list`
  - Filter and retrieve entities in a project
  
- **Get Entity**: `GET /workspaces/{workspace_id}/projects/{project_id}/entities/{entity_id}`
  - Retrieve specific entity details and field values

### 2. File Upload Capabilities
Multiple methods for uploading documents:

- **Upload Local Files**: Direct file uploads from local storage
- **Upload from URL**: Files publicly available via URL
- **Base64 Encoded Files**: Direct encoding support
- **Collection Uploads**: Bulk file management through collections

### 3. Workflow Automation (Triggers)
Automations allow reactive processing based on events:

#### Event Types:
- `entity.created` - Triggered when new documents are uploaded
- `entity.field_completed` - Triggered when specific fields are extracted
- `entity.all_fields_completed` - Triggered when all processing is complete
- `project.created` - Triggered for new projects/collections

#### Trigger Actions:
- Webhook URLs for external integrations
- Can filter events based on specific criteria

### 4. AI/LLM Integration (AskGo)
Built-in AI capabilities for document understanding:

- **Ask Questions**: `POST /workspaces/{workspace_id}/ask_go/{session_id}/ask`
  - Natural language queries about documents
  - Session-based for context retention
  - Can reference specific uploaded entities

- **Create Projects from Prompts**: AI-assisted project/workflow creation
- **Session Management**: Maintain conversation context

### 5. Project/Property Management
Projects define the structure and fields to extract:

- **Properties**: Define what information to extract (e.g., client name, address, document type)
- **Property Slugs**: Programmatic identifiers for fields
- **Field Types**: Support for various data types (text, boolean, etc.)

## Recommended Architecture for Estate Document Processing

### 1. Initial Setup
1. Create workspace for the law firm
2. Create project with properties for:
   - Client name
   - Document type (will, trust, etc.)
   - Key dates
   - Beneficiaries
   - Property details
   - Client address/identifiers

### 2. Document Ingestion Flow
1. Upload documents via API (support multiple formats)
2. Create entities for each document
3. Use AskGo to extract initial information
4. Set up triggers for automated processing

### 3. Entity Resolution Strategy
1. Use extracted addresses/names as primary identifiers
2. Create triggers on `entity.field_completed` for key fields
3. Implement matching logic in webhook handlers
4. Group documents by identified clients

### 4. Automation Workflow
1. **On Document Upload**:
   - Create entity
   - Trigger initial AI analysis
   
2. **On Field Completion**:
   - Check for client identifiers
   - Match against existing entities
   - Update client groupings

3. **On All Fields Complete**:
   - Final validation
   - Generate summary reports
   - Notify attorney of completion

### Further Reading
1. [Automation Triggers](automation-triggers.md)
2. [Entity Management](entity-management.md)
3. [File Collections](file-collections.md)