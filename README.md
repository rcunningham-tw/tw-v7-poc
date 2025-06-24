# Estate Planning Test Data Repository

## Overview
This repository contains synthetic test data designed to simulate document collections typically managed by estate planning attorneys. The data represents document crates from multiple attorneys, each containing files related to their clients' wills, trusts, and estate planning matters.

## Purpose
This test dataset is created to develop and test an intelligent document management system for estate attorneys. The system aims to:
- Automatically identify and extract client entities from unstructured documents
- Organize documents by client relationships
- Handle various document formats and naming conventions
- Process documents with varying levels of identifying information

## Data Structure
The repository contains 4 attorney crates:
- **Blackwell**: Entertainment industry focus (NFL players, music industry)
- **Fitzgerald**: Southwest US clients with ranch and mineral rights
- **Morrison**: Maritime and coastal property focus
- **Yamamoto**: Pacific Northwest tech and environmental investments

Each crate contains 10-15 documents representing 3-5 clients with intentionally obscured relationships between documents.

## Document Characteristics
- **Formats**: Various file extensions (.txt, .csv, .docx, .json, .xml, etc.)
- **Content**: Wills, trusts, property transfers, vehicle sales, tax documents
- **Identifying Information**: ~60% of documents contain addresses or client identifiers
- **Relationships**: Document relationships are intentionally non-obvious (different naming conventions, creation dates)

## Client Personas
See `client_personas.json` for detailed information about the synthetic clients represented in each crate.

## Usage
This data is intended for testing document processing algorithms that can:
1. Extract entity information from various document types
2. Identify client relationships across disparate documents
3. Handle incomplete or missing identifying information
4. Process multiple document formats