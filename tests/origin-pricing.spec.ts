import { test } from "@playwright/test";

import { getPricingPage } from "../pages/pricingPage";
import { expectPdfToBeGasPlan } from "../utils/pdfAssertions";
import {
  ensureDirExists,
  getDownloadsDir,
  buildDownloadPath,
  robustDownloadPlanPdf,
} from "../utils/fileUtils";

test("Origin pricing - gas plan PDF flow", async ({ page }) => {
  // Ensure downloads directory exists
  const downloadsDir = getDownloadsDir();
  ensureDirExists(downloadsDir);
  const outPath = buildDownloadPath("origin-plan.pdf");

  const pricingPage = getPricingPage(page);

  // 1. Navigate
  await pricingPage.open();
  await pricingPage.expectLoaded();

  // 2-3. Search + select address
  await pricingPage.searchAndSelectAddress("17 Bolinda Road, Balwyn North, VIC 3104");

  // 4. Verify plans list is displayed
  await pricingPage.expectPlansListDisplayed();

  // 5. Uncheck Electricity
  await pricingPage.setElectricityChecked(false);

  // 6. Verify plans still is displayed
  await pricingPage.expectPlansListDisplayed();

  // 7. Get the plan PDF URL from the first row (Plan BPID/EFS column)
  const pdfUrl = await pricingPage.getFirstPlanPdfUrl();

  // 8-10. Robustly download the PDF and assert it is a Gas plan
  const savedBytes = await robustDownloadPlanPdf(
    page,
    pricingPage.openFirstPlanInNewTab,
    pdfUrl,
    outPath
  );
  await expectPdfToBeGasPlan(savedBytes);
});
