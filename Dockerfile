# Dockerfile
# Use Playwright’s official image (includes browsers + system deps)
FROM mcr.microsoft.com/playwright:v1.57.0-jammy

WORKDIR /app

# Poppler provides pdftotext (needed for Step 10 PDF text extraction)
RUN apt-get update \
  && apt-get install -y --no-install-recommends poppler-utils \
  && rm -rf /var/lib/apt/lists/*

# Install deps first (better caching)
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Choose ONE installer based on what your repo uses:
# If you use npm:
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest
COPY . .

# Ensure downloads dir exists (your test writes origin/downloads/origin-plan.pdf)
RUN mkdir -p /app/downloads

# Default command: run the test
CMD ["npx", "playwright", "test", "tests/origin-pricing.spec.ts"]
