
import { Page, Locator, expect } from "@playwright/test";

const DEFAULT_ADDRESS = "17 Bolinda Road, Balwyn North, VIC 3104";

const escapeForRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getPricingPage = (page: Page) => {

  const addressSearchInput = (): Locator => page.locator("#address-lookup");

  const addressSuggestionsListbox = (): Locator => page.getByRole("listbox");
  const addressSuggestionOptions = (): Locator => page.getByRole("option");

  const searchResultsContainer = (): Locator => page.locator("#searchResultsContainer");

  const resultRows = (): Locator =>
    searchResultsContainer().locator('[data-id^="row-"]');

  // First row in results
  const firstResultRow = (): Locator => resultRows().first();

  // Plan link lives in 3rd column (Plan BPID/EFS) => td index 2
  const firstPlanLink = (): Locator =>
    firstResultRow().locator("td").nth(2).locator("a").first();

  // Checkbox: Electricity exists in multiple tabs.
  // Always scope to Address tab panel (#tabpanel-0).
  const addressTabPanel = (): Locator => page.locator("#tabpanel-0");

  const electricityCheckbox = (): Locator =>
    addressTabPanel().getByLabel("Electricity", { exact: true });

// Base URL for the application
const BASE_URL = process.env.BASE_URL || "https://www.originenergy.com.au";

// Open the pricing page
const open = async () => {
  // Always use absolute URL for Docker reliability
  const url = `${BASE_URL.replace(/\/$/, "")}/pricing.html`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
};

// Expect the page to be fully loaded
const expectLoaded = async () => {
  await page.waitForLoadState("domcontentloaded");

  const url = page.url();
  const title = await page.title();
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const bodySample = bodyText.slice(0, 200).replace(/\s+/g, " ").trim();

  try {
    await expect(addressSearchInput()).toBeVisible({ timeout: 30000 });
    await expect(addressSearchInput()).toBeEnabled();
  } catch (e) {
    // Print debug info if the element is not found
    // This will show up in Playwright's HTML/video report and Docker logs
    // so you can see what page actually loaded
    // eslint-disable-next-line no-console
    console.error("[DEBUG] Failed to find #address-lookup");
    console.error(`[DEBUG] URL: ${url}`);
    console.error(`[DEBUG] Title: ${title}`);
    console.error(`[DEBUG] Body sample: ${bodySample}`);
    throw e;
  }
};

// Address search and expect suggestions to appear
  const searchAddress = async (address: string = DEFAULT_ADDRESS) => {
    await addressSearchInput().fill(address);
    await expect(addressSuggestionsListbox()).toBeVisible();
  };

  // Select address from suggestions
  const selectAddressFromSuggestions = async (fullAddress: string = DEFAULT_ADDRESS) => {
    await expect(addressSuggestionsListbox()).toBeVisible();
    await expect(addressSuggestionOptions().first()).toBeVisible();

    // Best: exact match for the full address
    // e.g. "123 Fake St, Springfield"
    const exact = page.getByRole("option", { name: fullAddress });
    if ((await exact.count()) > 0) {
      await exact.first().click();
      await expect(addressSuggestionsListbox()).toBeHidden();
      return;
    }

    // Next best: fuzzy match by "street + suburb". This allows for slight variations in the address format.
    // e.g. "123 Fake St, Springfield" could match "123 Fake Street, Springfield"
    const streetPart = fullAddress.split(",")[0]?.trim();
    const suburbPart = fullAddress.split(",")[1]?.trim();

    const fuzzyRegex = new RegExp(
      `${escapeForRegex(streetPart)}.*${escapeForRegex(suburbPart)}`,
      "i"
    );

    // Fuzzy match by "street + suburb".
    const fuzzy = page.getByRole("option", { name: fuzzyRegex });
    if ((await fuzzy.count()) > 0) {
      await fuzzy.first().click();
      await expect(addressSuggestionsListbox()).toBeHidden();
      return;
    }

    // Last resort: pick the first suggestion
    await addressSuggestionOptions().first().click();
    await expect(addressSuggestionsListbox()).toBeHidden();
  };

  // Search and select address from suggestions
  const searchAndSelectAddress = async (fullAddress: string = DEFAULT_ADDRESS) => {
    await searchAddress(fullAddress);
    await selectAddressFromSuggestions(fullAddress);
  };

  // Expect plans list to be displayed
  const expectPlansListDisplayed = async () => {
    await expect(searchResultsContainer()).toBeVisible();
    // “Plans displayed” = at least one row visible
    await expect(resultRows().first()).toBeVisible({ timeout: 15000 });
  };

  // Checkbox toggle to set or unset electricity plan
  const setElectricityChecked = async (checked: boolean) => {
    const cb = electricityCheckbox();

    await expect(cb).toBeVisible({ timeout: 15000 });
    await expect(cb).toBeEnabled();

    await cb.setChecked(checked);

    if (checked) {
      await expect(cb).toBeChecked();
    } else {
      await expect(cb).not.toBeChecked();
    }
  };

  // Plan PDF link helpers to extract PDF URLs from the plans list
  const getFirstPlanPdfUrl = async (): Promise<string> => {
    await expectPlansListDisplayed();

    // Avoid “hidden” failures: scroll it into view first
    await firstPlanLink().scrollIntoViewIfNeeded();
    await expect(firstPlanLink()).toBeVisible({ timeout: 15000 });

    const href = await firstPlanLink().getAttribute("href");
    if (!href) throw new Error("Missing href for first plan PDF link");

    return href;
  };

// Open the first plan PDF link in a new tab
const openFirstPlanInNewTab = async (): Promise<Page> => {
  // click the first PDF link in the Plan BPID/EFS column
  const link = firstPlanLink();
  await expect(link).toBeVisible({ timeout: 15000 });

  let popup: Page | undefined;
  try {
    [popup] = await Promise.all([
      page.waitForEvent("popup", { timeout: 10000 }),
      link.click(),
    ]);
  } catch (e) {
    // If popup fails, fallback to direct PDF download
    // Return the main page so the test can continue with direct download
    // eslint-disable-next-line no-console
    console.warn("[WARN] Popup window for PDF did not open. Falling back to direct download.");
    return page;
  }

  // If popup exists, check its URL
  try {
    await expect
      .poll(() => popup.url(), { timeout: 15000 })
      .toMatch(/\.pdf(\?.*)?$/i);
    return popup;
  } catch (e) {
    // If popup URL is not a PDF, fallback
    // eslint-disable-next-line no-console
    console.warn("[WARN] Popup did not navigate to a PDF URL. Falling back to direct download.");
    return page;
  }
};


  return {
    open,
    expectLoaded,
    addressSearchInput,
    searchAddress,
    selectAddressFromSuggestions,
    searchAndSelectAddress,
    expectPlansListDisplayed,
    setElectricityChecked,
    getFirstPlanPdfUrl,
    openFirstPlanInNewTab,
  };
};
