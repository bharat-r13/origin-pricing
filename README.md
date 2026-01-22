# What this code does
This project automates the Origin Energy pricing page using Playwright and TypeScript. It:
- Searches for a specific address
- Selects a gas plan
- Downloads the plan PDF
- Verifies the PDF content to ensure it’s a gas plan
The code is structured for maintainability, robustness, and CI compatibility (including Docker).

# File/Folder Overview
- `tests/origin-pricing.spec.ts`: The main Playwright test, orchestrating the scenario.
- `pages/pricingPage.ts`: Page Object Model for the Origin pricing page (all UI interactions).
- `utils/fileUtils.ts`: File and download helpers, including robust PDF download logic.
- `utils/pdfText.ts`: Extracts text from PDFs using `pdftotext` (Docker-friendly).
- `utils/pdfAssertions.ts`: Contains assertions to verify the PDF is a gas plan.
- `downloads/`: Where downloaded PDFs are saved.
- `README.md`: Project instructions and documentation.


# Origin Energy Pricing Automation

## Overview
This project automates the Origin Energy pricing flow using Playwright and TypeScript, following the Page Object Model (POM) pattern. It verifies that a downloaded plan PDF is a Gas plan by extracting its text content.

## Features
- Fully automated UI test for the Origin pricing page
- Page Object Model for maintainability
- PDF download and content validation
- Runs locally and in Docker (with headless browser)
- All file and business logic is handled in utility files for clarity

## Prerequisites
- Node.js 18+
- Docker (for containerized runs)

## Local Run

Install dependencies:

```bash
npm install
```

Run the test:

```bash
npx playwright test tests/origin-pricing.spec.ts
```

View the Playwright report:

```bash
npx playwright show-report reports
```

## Docker Run (Recommended for CI)

Build the Docker image:

```bash
docker compose build
```

Run the test in Docker:

```bash
docker compose up --abort-on-container-exit
```

### Where is the downloaded PDF?
- In the container: `/app/downloads/origin-plan.pdf`
- On your host: `./downloads/origin-plan.pdf` (via volume mount)


## PDF Extraction & Gas Plan Validation
PDF text extraction uses `pdftotext` (from poppler-utils), which is installed in the Docker image. The PDF is processed entirely in memory—no temp files are written. The extracted text is then checked for specific signals to confirm it is a Gas plan:

- Required marker: e.g. `fuel type gas`
- At least one strong signal: e.g. `estimated gas cost`, `natural gas`, `gas charges`, etc.
- No forbidden signals: e.g. `fuel type electricity`

This logic is implemented in `utils/pdfAssertions.ts` and ensures the test only passes for genuine Gas plan PDFs.

## File Overwrite Logic
Each test run deletes any existing `origin-plan.pdf` before downloading a new one, ensuring the file is always fresh.

## Troubleshooting
- **Docker test fails at PDF extraction:** Ensure `poppler-utils` is installed (the Dockerfile does this automatically).
- **Test fails to download PDF:** The Origin site may block headless browsers or Docker traffic. The test will print detailed error messages if this occurs.
- **File not overwritten:** The test always deletes the old file before saving a new one.

## Structure
- `pages/`: Page Object Model classes
- `tests/`: Playwright test specs (no business logic)
- `utils/`: File, PDF, and assertion utilities.
