
import { expect } from "@playwright/test";
import { getPdfText } from "./pdfText";

/**
 * Assert that the PDF content represents a Gas plan.
 * Checks for required, optional, and forbidden signals in the extracted text.
 */
export const expectPdfToBeGasPlan = async (pdfBytes: Buffer) => {
  const text = (await getPdfText(pdfBytes)).toLowerCase();

  // Required marker(s) for a Gas plan
  const mustHaveAll = [
    /fuel\s*type\s*gas/i,
  ];

  // At least one of these should be present
  // e.g. "estimated gas cost", "this gas offer", "gas charges" etc
  const mustHaveAny = [
    /estimated\s*gas\s*cost/i,
    /this\s+gas\s+offer/i,
    /gas\s+charges/i,
    /\bnatural\s+gas\b/i,
  ];

  // None of these should be present
  // e.g. "fuel type electricity"
  const mustNotHave = [
    /fuel\s*type\s*electricity/i,
  ];

  for (const pattern of mustHaveAll) {
    expect(
      text,
      `PDF is missing required Gas-plan marker: ${pattern}`
    ).toMatch(pattern);
  }

  const hasAny = mustHaveAny.some((p) => p.test(text));
  expect(
    hasAny,
    `PDF did not contain any strong Gas-plan markers. Looked for: ${mustHaveAny.map(String).join(", ")}`
  ).toBe(true);

  for (const pattern of mustNotHave) {
    expect(
      text,
      `PDF appears to be Electricity (should be Gas). Matched: ${pattern}`
    ).not.toMatch(pattern);
  }
};
