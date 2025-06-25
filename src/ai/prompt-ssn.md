# SSN Extraction Agent Prompt

Extract the Social Security Number for the document's primary client.

## Task
Find and return ONLY the SSN of the primary client/owner.

## Rules
- Format: XXX-XX-XXXX
- Must be the primary client's SSN only
- Handle with appropriate security awareness
- Return "Unknown" if not found

## Output
Return ONLY the SSN: `123-45-6789` or `Unknown`