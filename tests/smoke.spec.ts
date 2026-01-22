import { test, expect } from "@playwright/test";
import { getPricingPage } from "../pages/pricingPage";

test("smoke: pricing page opens (functional POM)", async ({ page }) => {
  const pricingPage = getPricingPage(page);

  await pricingPage.open();

  await expect(page).toHaveURL(/pricing\.html/);

  await pricingPage.expectLoaded();
});
