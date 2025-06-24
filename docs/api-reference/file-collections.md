# V7 File Collections and Organization

## Collections Overview
Collections in V7 provide a way to organize and manage groups of related files. They act as containers for documents that share common characteristics or processing requirements.

## Working with Collections

### Understanding Collection Structure
- Collections are essentially special projects with a child project ID
- Files uploaded to collections become entities in the child project
- Collections support the same file formats as regular entities

### Obtaining Collection IDs

#### From the UI/URL
1. Navigate to the collection in your browser
2. The collection's child project ID appears in the URL after `/collections/`
3. Example: `https://go.v7labs.com/.../collections/0192338e-57e3-7049-8fb9-7d0e252e2375`

#### Via API
Use the Get Project endpoint to fetch project details and locate the child project ID:
```json
{
  "config": {
    "properties": [
      {
        "name": "Index",
        "type": "text",
        "property_id": "0192331d-0343-780a-beef-bb8f96173a57"
      }
    ],
    "subproject_config": {
      "child_project_id": "0192338e-57e3-7049-8fb9-7d0e252e2375",
      "primary_property_id": null
    }
  }
}
```

### Uploading Files to Collections
Once you have the collection's child project ID, use it as a regular project ID for file uploads:

```python
collection_project_id = "0192338e-57e3-7049-8fb9-7d0e252e2375"
url = f"{base_url}/workspaces/{workspace_id}/projects/{collection_project_id}/entities"

# Upload files using standard entity creation methods
```

## Folder Organization

### Folder Tree API
**Endpoint**: `GET /workspaces/{workspace_id}/folders/tree`

**Features**:
- Returns complete folder hierarchy for a workspace
- Limited to 500 folders total
- Includes membership information (optional)

**Use Cases**:
- Organize projects by attorney or practice area
- Create folder structure matching physical file organization
- Separate active cases from archived matters

### Folder Operations
V7 supports full CRUD operations on folders:
- Create folder
- Update folder
- Delete folder
- Move projects between folders
- List folder contents

## Library Entities

### Library Overview
The Library feature provides a centralized repository for commonly used documents or templates across a workspace.

### List Library Entities
**Endpoint**: `GET /workspaces/{workspace_id}/library/entities`

**Features**:
- Returns all entities in the workspace library
- Supports same filtering and pagination as regular entity lists
- Useful for template documents or reference materials

**Query Parameters**:
- Same as regular entity listing (order_by, limit, offset, etc.)
- Can filter by parent_entity_id for hierarchical organization

### Library Use Cases for Attorneys
1. **Template Storage**: Store standard will/trust templates
2. **Reference Documents**: Keep statutory forms and guidelines
3. **Shared Resources**: Maintain firm-wide document standards
4. **Boilerplate Content**: Store commonly used clauses

## Best Practices for Document Organization

### 1. Collection Strategy
- Create collections per attorney crate
- Use collections for batch processing similar document types
- Separate active matters from completed ones

### 2. Folder Hierarchy
Recommended structure:
```
/Attorneys
  /Blackwell
    /Active Matters
    /Completed Matters
    /Templates
  /Fitzgerald
    /Active Matters
    /Completed Matters
    /Templates
```

### 3. Naming Conventions
- Use consistent naming for collections
- Include dates in folder names for temporal organization
- Prefix with attorney initials for quick identification

### 4. Library Management
- Store firm-approved templates in Library
- Version control important documents
- Use Library for training data consistency

## Integration Considerations

### Bulk Operations
- Collections support bulk upload operations
- Process entire attorney crates as single collections
- Use batch processing for efficiency

### Access Control
- Collections inherit workspace permissions
- Can be shared with specific team members
- Maintain attorney-client privilege through proper access controls

### Automation
- Set up triggers on collection creation
- Automate filing based on extracted properties
- Use webhooks to notify when collections are processed