#!/usr/bin/env python3
"""
Fetch and analyze documents from V7 API
"""

import os
import json
import requests
from dotenv import load_dotenv
from collections import defaultdict
from datetime import datetime

# Load environment variables
load_dotenv()

# Configuration
API_KEY = os.getenv('V7_API_KEY')
WORKSPACE_ID = os.getenv('V7_WORKSPACE_ID')
BASE_URL = 'https://go.v7labs.com/api'

if not API_KEY or not WORKSPACE_ID:
    print("Error: Please set V7_API_KEY and V7_WORKSPACE_ID in your .env file")
    exit(1)

headers = {
    'X-API-KEY': API_KEY,
    'Content-Type': 'application/json'
}

def get_projects():
    """Get all projects in the workspace"""
    url = f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects'
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"Error fetching projects: {response.status_code}")
        print(response.text)
        return []
    
    return response.json().get('projects', [])

def get_project_properties(project_id):
    """Get properties defined for a project"""
    url = f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects/{project_id}/properties'
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"Error fetching properties: {response.status_code}")
        return []
    
    return response.json().get('properties', [])

def get_entities(project_id, limit=100, offset=0):
    """Get entities (documents) in a project"""
    url = f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects/{project_id}/entities'
    params = {
        'limit': limit,
        'offset': offset
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code != 200:
        print(f"Error fetching entities: {response.status_code}")
        print(response.text)
        return []
    
    return response.json().get('entities', [])

def get_all_entities(project_id):
    """Get all entities in a project with pagination"""
    all_entities = []
    offset = 0
    limit = 100
    
    while True:
        entities = get_entities(project_id, limit, offset)
        if not entities:
            break
        all_entities.extend(entities)
        if len(entities) < limit:
            break
        offset += limit
    
    return all_entities

def analyze_entities(entities):
    """Analyze entities and group by attorney and client"""
    attorney_groups = defaultdict(list)
    client_groups = defaultdict(list)
    document_types = defaultdict(int)
    
    for entity in entities:
        fields = entity.get('fields', {})
        
        # Extract field values
        attorney_name = None
        client_name = None
        doc_type = None
        
        # Check different possible field names
        for field_name, field_data in fields.items():
            if isinstance(field_data, dict):
                value = field_data.get('value') or field_data.get('manual_value', {}).get('value')
                
                if 'attorney' in field_name.lower():
                    attorney_name = value
                elif 'client' in field_name.lower():
                    client_name = value
                elif 'type' in field_name.lower() or 'document' in field_name.lower():
                    doc_type = value
        
        # Group by attorney
        if attorney_name:
            attorney_groups[attorney_name].append({
                'id': entity['id'],
                'client': client_name,
                'type': doc_type,
                'created': entity.get('created_at')
            })
        
        # Group by client
        if client_name:
            client_groups[client_name].append({
                'id': entity['id'],
                'attorney': attorney_name,
                'type': doc_type,
                'created': entity.get('created_at')
            })
        
        # Count document types
        if doc_type:
            document_types[doc_type] += 1
    
    return attorney_groups, client_groups, document_types

def main():
    print("Fetching V7 data...\n")
    
    # Get all projects
    projects = get_projects()
    print(f"Found {len(projects)} projects")
    
    all_entities = []
    
    for project in projects:
        project_id = project['id']
        project_name = project.get('name', 'Unnamed')
        print(f"\nProject: {project_name} (ID: {project_id})")
        
        # Get properties
        properties = get_project_properties(project_id)
        if properties:
            print("  Properties:")
            for prop in properties:
                print(f"    - {prop.get('name', 'Unknown')} ({prop.get('slug', 'no-slug')})")
        
        # Get entities
        entities = get_all_entities(project_id)
        print(f"  Found {len(entities)} entities")
        all_entities.extend(entities)
    
    if not all_entities:
        print("\nNo entities found. Please check if documents have been processed.")
        return
    
    # Analyze entities
    print(f"\nAnalyzing {len(all_entities)} total entities...")
    attorney_groups, client_groups, document_types = analyze_entities(all_entities)
    
    # Display results
    print("\n=== SUMMARY ===")
    print(f"Total documents: {len(all_entities)}")
    print(f"Unique attorneys: {len(attorney_groups)}")
    print(f"Unique clients: {len(client_groups)}")
    
    print("\n=== DOCUMENTS BY ATTORNEY ===")
    for attorney, docs in sorted(attorney_groups.items()):
        print(f"\n{attorney}: {len(docs)} documents")
        # Show first few clients
        unique_clients = set(doc['client'] for doc in docs if doc['client'])
        if unique_clients:
            print(f"  Clients: {', '.join(list(unique_clients)[:5])}")
            if len(unique_clients) > 5:
                print(f"  ... and {len(unique_clients) - 5} more")
    
    print("\n=== DOCUMENTS BY CLIENT ===")
    # Show top 10 clients by document count
    sorted_clients = sorted(client_groups.items(), key=lambda x: len(x[1]), reverse=True)[:10]
    for client, docs in sorted_clients:
        print(f"{client}: {len(docs)} documents")
        doc_types = [doc['type'] for doc in docs if doc['type']]
        if doc_types:
            print(f"  Types: {', '.join(set(doc_types))}")
    
    print("\n=== DOCUMENT TYPES ===")
    for doc_type, count in sorted(document_types.items(), key=lambda x: x[1], reverse=True):
        print(f"{doc_type}: {count}")
    
    # Save raw data for further analysis
    output_data = {
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'total_entities': len(all_entities),
            'attorneys': len(attorney_groups),
            'clients': len(client_groups),
            'document_types': dict(document_types)
        },
        'attorney_groups': {k: v for k, v in attorney_groups.items()},
        'client_groups': {k: v for k, v in client_groups.items()}
    }
    
    with open('v7_data_analysis.json', 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print("\n✓ Analysis saved to v7_data_analysis.json")

if __name__ == '__main__':
    main()