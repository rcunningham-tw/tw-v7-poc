# DOB Extraction Agent Prompt

Extract the date of birth for the primary client from estate planning documents.

## Task
Find and return ONLY the date of birth of the document's primary owner/client.

## Rules
- Format: MM/DD/YYYY or MM-DD-YYYY
- Return only the primary client's DOB, not beneficiaries or others
- If multiple formats exist, use MM/DD/YYYY
- Return "Unknown" if not found or uncertain

## Output
Return ONLY the date: `03/15/1968` or `Unknown`