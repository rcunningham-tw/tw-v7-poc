# Address Extraction Agent Prompt

Extract the primary residence address for the document's main client.

## Task
Find and return the current home address of the primary client/owner.

## Rules
- Return full street address with city, state, ZIP
- Choose primary residence over vacation homes or business addresses
- Ignore addresses of beneficiaries, attorneys, or witnesses
- Return "Unknown" if not found

## Output
Return ONLY the address: `123 Main Street, Phoenix, AZ 85001` or `Unknown`