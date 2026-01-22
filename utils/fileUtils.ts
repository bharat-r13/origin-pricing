import fs from "fs";
import path from "path";
import { Page, expect } from "@playwright/test";

/**
 * Handles clicking the plan link, opening the popup if possible, or falling back to direct download.
 * Always downloads the PDF and saves to outPath, returning the PDF bytes.
 */
export const robustDownloadPlanPdf = async (
  page: Page,
  openFirstPlanInNewTab: () => Promise<Page>,
  pdfUrl: string,
  outPath: string
) => {
  const planPage = await openFirstPlanInNewTab();
  // Only check for PDF URL if a popup was actually opened (not fallback)
  if (planPage !== page) {
    await expect(planPage).toHaveURL(/\.pdf(\?.*)?$/i);
  } else {
    // eslint-disable-next-line no-console
    console.warn("[WARN] No popup for PDF, proceeding with direct download on main page.");
  }
  const pdfBytes = await downloadPdfToFile(planPage, pdfUrl, outPath);
  const savedBytes = await readFileBytes(outPath);
  expect(savedBytes.length).toBeGreaterThan(0);
  return savedBytes;
};

/**
 * Remove a file if it exists (no error if not found)
 */
export const removeFileIfExists = async (filePath: string) => {
  try {
    await fs.promises.unlink(filePath);
  } catch (err: any) {
    if (err.code !== "ENOENT") throw err;
  }
};

/**
 * Download a PDF from a page context and save to file, always replacing old file
 */
export const downloadPdfToFile = async (page: any, pdfUrl: string, outPath: string) => {
  await removeFileIfExists(outPath);
  const byteArray: number[] = await page.evaluate(async (url: string) => {
    const res = await fetch(url, { method: "GET", credentials: "include" });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Browser fetch failed: ${res.status} ${res.statusText}. Body: ${body.slice(0, 200)}`
      );
    }
    const buf = await res.arrayBuffer();
    return Array.from(new Uint8Array(buf));
  }, pdfUrl);
  const pdfBytes = Buffer.from(byteArray);
  await writeFileBytes(outPath, pdfBytes);
  return pdfBytes;
};

/**
 * Ensure a directory exists (creates it recursively if needed)
 */
export const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Write bytes to a file (overwrites if exists)
 */
export const writeFileBytes = async (filePath: string, bytes: Buffer) => {
  await fs.promises.writeFile(filePath, bytes);
};

/**
 * Read bytes from a file
 */
export const readFileBytes = async (filePath: string): Promise<Buffer> => {
  return await fs.promises.readFile(filePath);
};

/**
 * Get the absolute path to the downloads directory
 */
export const getDownloadsDir = (): string => {
  return path.resolve(process.cwd(), "downloads");
};

/**
 * Build the absolute path for a file in the downloads directory
 */
export const buildDownloadPath = (fileName: string): string => {
  return path.join(getDownloadsDir(), fileName);
};
