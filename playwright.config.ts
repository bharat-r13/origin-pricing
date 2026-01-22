// import { defineConfig } from "@playwright/test";

// export default defineConfig({
//   testDir: "./tests",
//   timeout: 90_000,
//   expect: { timeout: 15_000 },
//   retries: process.env.CI ? 1 : 0,
//   workers: process.env.CI ? 2 : 2,

//   reporter: [["html", { outputFolder: "reports", open: "never" }], ["list"]],

//   use: {
//     baseURL: "https://www.originenergy.com.au",
//     locale: "en-AU",
//     userAgent:
//       "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
//     headless: true,
//     screenshot: "only-on-failure",
//     video: "retain-on-failure",
//     trace: "retain-on-failure"
//   }
// });


// import { defineConfig } from "@playwright/test";

// export default defineConfig({
//   testDir: "./tests",
//   timeout: 60_000,
//   expect: { timeout: 15_000 },

//   retries: process.env.CI ? 1 : 0,
//   workers: process.env.CI ? 1 : undefined,

//   reporter: [
//     ["html", { outputFolder: "reports", open: "never" }],
//     ["list"],
//   ],

//   use: {
//     baseURL: "https://www.originenergy.com.au",
//     headless: true, // works both locally + docker; use --headed locally when needed
//     screenshot: "only-on-failure",
//     video: "retain-on-failure",
//     trace: "retain-on-failure",
//   },

//   outputDir: "test-results",
// });

// import { defineConfig } from "@playwright/test";

// export default defineConfig({
//   testDir: "./tests",

//   // Live site -> be generous
//   timeout: 90_000,
//   expect: { timeout: 20_000 },

//   // ✅ Best practice for live external systems:
//   // Run serially to avoid rate limiting / hydration races / flakiness.
//   workers: 1,
//   fullyParallel: false,

//   retries: process.env.CI ? 1 : 0,

//   reporter: [
//     ["html", { outputFolder: "reports", open: "never" }],
//     ["list"],
//   ],

//   use: {
//     baseURL: "https://www.originenergy.com.au",

//     // Headless is best for Docker/CI, but you can still run locally with --headed
//     headless: true,

//     // Useful artifacts for debugging
//     screenshot: "only-on-failure",
//     video: "retain-on-failure",
//     trace: "retain-on-failure",

//     // Live sites sometimes take longer to hydrate
//     navigationTimeout: 60_000,
//     actionTimeout: 30_000,
//   },

//   outputDir: "test-results",
// });

// below is a working solution, but fails on docker
// playwright.config.ts
// import { defineConfig } from "@playwright/test";

// export default defineConfig({
//   testDir: "./tests",
//   retries: process.env.CI ? 1 : 0,
//   reporter: [["html", { outputFolder: "reports", open: "never" }]],
//   use: {
//     baseURL: process.env.BASE_URL ?? "https://www.originenergy.com.au",
//     trace: "on-first-retry",
//     video: "retain-on-failure",
//     screenshot: "only-on-failure",
//   },
// });

// import { defineConfig } from "@playwright/test";

// const baseURL = process.env.BASE_URL ?? "https://www.originenergy.com.au/pricing.html";

// export default defineConfig({
//   testDir: "./tests",
//   timeout: 60_000,
//   expect: { timeout: 15_000 },

//   retries: process.env.CI ? 1 : 0,
//   workers: process.env.CI ? 1 : undefined,

//   reporter: [["html", { outputFolder: "reports", open: "never" }]],

//   use: {
//     baseURL,
//     headless: process.env.CI ? true : false,

//     screenshot: "only-on-failure",
//     video: "retain-on-failure",
//     trace: "retain-on-failure",

//     // Make Docker look like a “normal” browser session.
//     // This often avoids “bot-style” 404 pages.
//     userAgent:
//       "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
//     locale: "en-AU",
//     timezoneId: "Australia/Melbourne",
//     extraHTTPHeaders: {
//       "Accept-Language": "en-AU,en;q=0.9",
//     },
//   },
// });

// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "https://www.originenergy.com.au";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 15_000 },

  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,

  use: {
    baseURL,
    headless: isCI,               // headless in Docker/CI, headed locally
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",

    // Make Docker behave closer to a real AU user
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    extraHTTPHeaders: {
      "Accept-Language": "en-AU,en;q=0.9",
    },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/121.0.0.0 Safari/537.36",

    // Helpful for Docker stability
    launchOptions: {
      args: ["--disable-dev-shm-usage"],
    },
  },

  reporter: [["html", { outputFolder: "reports", open: "never" }]],
});
