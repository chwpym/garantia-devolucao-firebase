# **App Name**: Warranty Wise

## Core Features:

- Warranty Data Entry: Capture warranty information including code, description, quantity, defect, sales requisition, warranty requisition, purchase invoice, purchase value, client, mechanic, return note, and observation using a structured form.
- Local Data Storage: Store all warranty data locally within the browser using IndexedDB for offline access and persistence.
- Data Grid Display: Display warranty records in an HTML table with columns for Code, Description, Quantity, Defect, Client, and Actions, with ability to select rows for PDF generation.
- Record Editing: Enable editing of warranty records by pre-filling the entry form with existing data when an 'Edit' action is selected from the data grid.
- Record Deletion: Implement a 'Delete' action to remove warranty records from IndexedDB, with a confirmation dialog for data integrity.
- PDF Report Generation: Generate PDF reports for suppliers using jsPDF and jsPDF-AutoTable, including selected records and columns with a customizable title and date.
- Dynamic Report Filtering: Allows users to filter and customize PDF reports, LLM tool considers what columns (fields) have been selected in the UI.

## Style Guidelines:

- Primary color: Soft lavender (#D0BFFF) to evoke a sense of calm and reliability.
- Background color: Light gray (#F0F0F5) to ensure readability and a modern, neutral backdrop.
- Accent color: Muted blue (#A0B4E0) for interactive elements and highlights, creating a subtle yet engaging user experience.
- Font: 'PT Sans', a humanist sans-serif suitable for both headlines and body text.
- Implement a responsive grid layout for the data entry form to adapt to various screen sizes.
- Use minimalist icons for actions like 'Edit' and 'Delete', ensuring clarity and ease of use.
- Incorporate subtle transitions and feedback animations to enhance user interaction when saving, editing, or deleting records.