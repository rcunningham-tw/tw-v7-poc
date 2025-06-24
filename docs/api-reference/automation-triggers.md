# V7 Automation and Triggers

## Overview
V7's automation system allows you to create event-driven workflows that react to changes in your documents and data. This is particularly powerful for attorney document management where consistent processing and organization are critical.

## Trigger Events

### Entity-Level Events
1. **entity.created**
   - Fired when a new document is uploaded
   - Useful for initiating processing workflows
   - Can trigger initial AI analysis

2. **entity.field_completed**
   - Fired when a specific field extraction completes
   - Enables progressive processing
   - Perfect for client identification workflows

3. **entity.all_fields_completed**
   - Fired when all field processing is done
   - Triggers final validation and filing
   - Initiates completion notifications

### Project-Level Events
1. **project.created**
   - Fired when new projects/collections are created
   - Useful for setting up folder structures
   - Can initialize project-specific workflows

## Creating Automation Workflows

### Basic Webhook Setup
```python
trigger_payload = {
    "event_type": "entity.field_completed",
    "webhook_url": "https://your-system.com/webhook",
    "filters": {
        "field_slug": "client-name"
    }
}
```

### Event Filtering
Triggers can be filtered based on:
- Specific field completions
- Field values
- Entity metadata
- Project properties

## Attorney Document Processing Workflows

### 1. Client Identification Workflow
**Trigger**: `entity.field_completed` on `client-name` field

**Actions**:
1. Search for existing client records
2. Match based on name and address
3. Create new client record if needed
4. Update entity with client ID

### 2. Document Classification Workflow
**Trigger**: `entity.created`

**Actions**:
1. Initiate AI classification
2. Extract document type
3. Apply appropriate property template
4. Route to correct processing queue

### 3. Completion Workflow
**Trigger**: `entity.all_fields_completed`

**Actions**:
1. Validate all required fields
2. Generate summary report
3. File in appropriate folder
4. Notify assigned attorney

### 4. Quality Control Workflow
**Trigger**: Custom based on confidence scores

**Actions**:
1. Flag low-confidence extractions
2. Route to manual review queue
3. Track review metrics
4. Update training data

## Advanced Automation Patterns

### Entity Relationship Building
```python
# On address extraction completion
def handle_address_extracted(webhook_data):
    entity_id = webhook_data['entity_id']
    address = webhook_data['field_value']
    
    # Search for other entities with same address
    related_entities = search_by_address(address)
    
    # Group entities by client
    client_groups = group_by_client(related_entities)
    
    # Update entity relationships
    update_entity_metadata(entity_id, {
        'client_group': client_groups[0]['id'],
        'related_documents': related_entities
    })
```

### Progressive Enhancement
```python
# Chain multiple field extractions
triggers = [
    {
        "event": "entity.created",
        "action": "extract_document_type"
    },
    {
        "event": "entity.field_completed",
        "field": "document-type",
        "action": "apply_type_specific_extraction"
    },
    {
        "event": "entity.field_completed", 
        "field": "client-name",
        "action": "match_client_records"
    }
]
```

### Batch Processing Triggers
```python
# Process entire collections
def handle_collection_complete(collection_id):
    entities = get_collection_entities(collection_id)
    
    # Group by document type
    grouped = group_by_type(entities)
    
    # Process each group
    for doc_type, docs in grouped.items():
        process_document_batch(doc_type, docs)
```

## Integration with External Systems

### Case Management Integration
```python
def sync_to_case_management(entity_data):
    # Extract relevant fields
    client_name = entity_data['fields']['client-name']
    doc_type = entity_data['fields']['document-type']
    
    # Create or update case record
    case = {
        'client': client_name,
        'documents': [{
            'id': entity_data['id'],
            'type': doc_type,
            'date': entity_data['created_at']
        }]
    }
    
    # Push to external system
    case_management_api.upsert(case)
```

### Document Management System Sync
- Trigger on document completion
- Extract metadata and file location
- Push to DMS with proper categorization
- Maintain bi-directional sync

## Best Practices

### 1. Webhook Reliability
- Implement retry logic
- Use idempotent operations
- Log all webhook events
- Monitor webhook health

### 2. Performance Optimization
- Batch similar operations
- Use async processing
- Cache frequently accessed data
- Implement rate limiting

### 3. Error Handling
- Graceful degradation
- Dead letter queues
- Manual intervention workflows
- Comprehensive logging

### 4. Security Considerations
- Validate webhook signatures
- Use HTTPS endpoints
- Implement access controls
- Audit all automated actions

## Monitoring and Analytics

### Key Metrics
1. **Processing Time**: Track time from upload to completion
2. **Accuracy Rates**: Monitor extraction confidence scores
3. **Error Rates**: Track failed automations
4. **Volume Metrics**: Documents processed per attorney/day

### Alerting
Set up alerts for:
- Failed webhook deliveries
- Low confidence extractions
- Processing bottlenecks
- Unusual document volumes