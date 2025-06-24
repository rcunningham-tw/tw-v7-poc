#!/usr/bin/env python3
"""
Map V7 entities back to local crate files
"""

import os
import json
import requests
from dotenv import load_dotenv
from pathlib import Path
import glob

# Load environment variables
load_dotenv()

# Configuration
API_KEY = os.getenv('V7_API_KEY')
WORKSPACE_ID = os.getenv('V7_WORKSPACE_ID')
BASE_URL = 'https://go.v7labs.com/api'

headers = {
    'X-API-KEY': API_KEY,
    'Content-Type': 'application/json'
}

# Known attorney-client mappings from the screenshot
KNOWN_MAPPINGS = {
    'Blackwell': {
        'annual_disclosure_2023.tex.md.txt': 'Jonathan Blake Sterling',
        'caribbean_development_permits.json5.txt': 'Alejandra Cristina Mendoza-Perez',
        'entertainment_venue_licenses.ini.txt': 'Jonathan Blake Sterling',
        'MUSIC_ROYALTY_AUDIT_2023Q2.tsv.txt': 'Fuego Latino Records LLC',
        'NFL_pension_distribution.html.txt': 'Demarco Tyrell Washington',
        'production_company_distribution.toml.txt': 'Jonathan Blake Sterling',
        'offshore_company_formation.tex.txt': 'Alejandra Cristina Mendoza-Perez',
        'recording_studio_lease.asc.txt': 'Marcus Antonio Rivera',
        'stadium_naming_rights.sql.txt': 'Demarco Washington',
        'vessel_registration_malta.log.txt': 'Azure Holdings Ltd',
        'yacht_charter_agreement.rtf.txt': 'Harrison Wellington III'
    },
    'Fitzgerald': {
        '2023_HOLOGRAPHIC_WILL.txt.txt': 'Maria Guadalupe Hernandez',
        'business_valuation_2023Q2.csv.txt': 'David M. Chen',
        'AZ_DMV_Title_Transfer.txt.txt': 'Jennifer Lee',
        'correspondence_08_15_23.txt.txt': 'Unknown',
        'IRS_Form_706_Draft.txt.txt': 'Thomas James Sullivan',
        'medical_lien_notice.txt.txt': 'David Michael Chen',
        'mineral_rights_assignment.docx.txt': 'Martinez Properties LLC',
        'PODER_NOTARIAL_Martinez.txt.txt': 'Roberto Carlos Martinez',
        'native_american_artifact_appraisal.docx.txt': 'Estate of Patricia Anne Sullivan',
        'ranch_deed_1987.txt.txt': 'Thomas James Sullivan and Patricia Anne Sullivan',
        'restaurant_lease_2019.txt.txt': 'Maria G. Hernandez',
        'SullivanTrustAmendment_03.pdf.txt': 'Patricia Anne Sullivan'
    },
    'Morrison': {
        'auto_transfer_record.csv.txt': 'Thompson, M.E.',
        'estate_planning_letter_jc.docx.txt': 'James A. Castellano',
        'beneficiary_info_mitchell.txt.txt': 'Sarah Thompson-Mitchell',
        'Insurance_Claim_2021.txt.txt': 'Barbara Ann Mitchell',
        'Family_Contact_List.csv.txt': 'Unknown',
        'LastWillTestament_2023_draft.txt.txt': 'Margaret Elizabeth Thompson',
        'marina_lease_agreement.docx.txt': 'Joseph Michael Romano',
        'medical_directive_draft.txt.txt': 'James Anthony Castellano',
        'misc_correspondence_2023.txt.txt': 'Eleanor Grace Williams',
        'Property_Transfer_Deed.docx.txt': 'Richard Alan Foster and Linda Marie Foster',
        'tax_summary_2022.txt.txt': 'Dorothy J. Henderson',
        'TRUST_AGREEMENT_2022.txt.txt': 'Dorothy June Henderson',
        'vehicle_sale_agreement_2023.txt.txt': 'Estate of Robert James Thompson',
        'will_revision_notes.txt.txt': 'M.E.T.'
    },
    'Yamamoto': {
        'brewery_acquisition_loi.txt.txt': 'Willamette Valley Brewing Company',
        'employee_handbook_acknowledgment.pdf.txt': 'Jessica Thompson'
    }
}

def get_all_entities_detailed(project_id):
    """Get all entities with full details"""
    url = f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects/{project_id}/entities'
    all_entities = []
    offset = 0
    limit = 50
    
    while True:
        params = {'limit': limit, 'offset': offset}
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"Error: {response.status_code}")
            break
            
        data = response.json()
        entities = data.get('entities', [])
        
        if not entities:
            break
            
        all_entities.extend(entities)
        
        if len(entities) < limit:
            break
            
        offset += limit
    
    return all_entities

def extract_field_value(field_data):
    """Extract value from V7 field data structure"""
    if isinstance(field_data, dict):
        # Try different value locations
        if 'value' in field_data:
            return field_data['value']
        if 'manual_value' in field_data and isinstance(field_data['manual_value'], dict):
            return field_data['manual_value'].get('value')
        if 'tool_value' in field_data and isinstance(field_data['tool_value'], dict):
            return field_data['tool_value'].get('value')
    return None

def find_local_files():
    """Find all local crate files"""
    crate_files = {}
    
    for attorney in ['Blackwell', 'Fitzgerald', 'Morrison', 'Yamamoto']:
        attorney_dir = f'Cratos/{attorney}'
        if os.path.exists(attorney_dir):
            files = glob.glob(f'{attorney_dir}/*.txt')
            crate_files[attorney] = [os.path.basename(f) for f in files]
    
    return crate_files

def main():
    print("Mapping V7 entities to local files...\n")
    
    # Get local files
    local_files = find_local_files()
    total_local = sum(len(files) for files in local_files.values())
    print(f"Found {total_local} local files")
    for attorney, files in local_files.items():
        print(f"  {attorney}: {len(files)} files")
    
    # Get projects
    url = f'{BASE_URL}/workspaces/{WORKSPACE_ID}/projects'
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"Error fetching projects: {response.status_code}")
        return
    
    projects = response.json().get('projects', [])
    print(f"\nFound {len(projects)} V7 projects")
    
    # Analyze each project
    all_mappings = []
    unmapped_entities = []
    
    for project in projects:
        project_id = project['id']
        project_name = project.get('name', 'Unnamed')
        print(f"\n--- Project: {project_name} ---")
        
        entities = get_all_entities_detailed(project_id)
        print(f"Found {len(entities)} entities")
        
        for entity in entities:
            entity_id = entity['id']
            fields = entity.get('fields', {})
            
            # Extract all field values
            field_values = {}
            for field_name, field_data in fields.items():
                value = extract_field_value(field_data)
                if value:
                    field_values[field_name] = value
            
            # Try to find file name in various fields
            filename = None
            for key in ['filename', 'file_name', 'name', 'title']:
                if key in field_values:
                    filename = field_values[key]
                    break
            
            # Get attorney and client info
            attorney = None
            client = None
            
            for key, value in field_values.items():
                if 'attorney' in key.lower():
                    attorney = value
                elif 'client' in key.lower():
                    client = value
            
            # Create mapping entry
            mapping = {
                'entity_id': entity_id,
                'project': project_name,
                'filename': filename,
                'attorney': attorney,
                'client': client,
                'fields': field_values,
                'created_at': entity.get('created_at')
            }
            
            # Try to match with known mappings
            matched = False
            if attorney and filename:
                if attorney in KNOWN_MAPPINGS and filename in KNOWN_MAPPINGS[attorney]:
                    expected_client = KNOWN_MAPPINGS[attorney][filename]
                    mapping['expected_client'] = expected_client
                    mapping['client_match'] = client == expected_client if client else False
                    matched = True
            
            if matched or filename:
                all_mappings.append(mapping)
            else:
                unmapped_entities.append(mapping)
    
    # Display results
    print(f"\n=== MAPPING RESULTS ===")
    print(f"Total V7 entities: {len(all_mappings) + len(unmapped_entities)}")
    print(f"Mapped entities: {len(all_mappings)}")
    print(f"Unmapped entities: {len(unmapped_entities)}")
    
    # Group by attorney
    print("\n=== BY ATTORNEY ===")
    attorney_groups = {}
    for mapping in all_mappings:
        attorney = mapping.get('attorney', 'Unknown')
        if attorney not in attorney_groups:
            attorney_groups[attorney] = []
        attorney_groups[attorney].append(mapping)
    
    for attorney, mappings in sorted(attorney_groups.items()):
        print(f"\n{attorney}: {len(mappings)} documents")
        
        # Check client accuracy
        correct_clients = sum(1 for m in mappings if m.get('client_match', False))
        if any('expected_client' in m for m in mappings):
            print(f"  Client matching accuracy: {correct_clients}/{len(mappings)} ({correct_clients/len(mappings)*100:.1f}%)")
        
        # Show sample mappings
        for mapping in mappings[:3]:
            print(f"  - {mapping.get('filename', 'Unknown file')}")
            if mapping.get('client'):
                print(f"    Client: {mapping['client']}")
            if mapping.get('expected_client') and mapping['expected_client'] != mapping.get('client'):
                print(f"    Expected: {mapping['expected_client']}")
    
    # Save detailed mapping
    output = {
        'summary': {
            'total_local_files': total_local,
            'total_v7_entities': len(all_mappings) + len(unmapped_entities),
            'mapped_entities': len(all_mappings),
            'unmapped_entities': len(unmapped_entities)
        },
        'mappings': all_mappings,
        'unmapped': unmapped_entities,
        'local_files': local_files
    }
    
    with open('v7_local_mapping.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print("\n✓ Detailed mapping saved to v7_local_mapping.json")
    
    # Show unmapped entities
    if unmapped_entities:
        print(f"\n=== UNMAPPED ENTITIES ({len(unmapped_entities)}) ===")
        for entity in unmapped_entities[:5]:
            print(f"Entity ID: {entity['entity_id']}")
            print(f"  Project: {entity['project']}")
            print(f"  Fields: {list(entity['fields'].keys())}")
            print()

if __name__ == '__main__':
    main()