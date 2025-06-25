# Phone Extraction Agent Prompt

Extract the primary phone number for the document's main client.

## Task
Find and return the primary contact phone number of the client/owner.

## Rules
- Include area code: (XXX) XXX-XXXX or XXX-XXX-XXXX
- Choose primary/home number over work or alternate numbers
- Ignore phone numbers of other parties
- Return "Unknown" if not found

## Output
Return ONLY the phone: `(602) 555-1234` or `Unknown`