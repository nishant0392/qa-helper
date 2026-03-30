// Imports
import { test } from "@playwright/test";
import {
  auditDomForTextOverflow,
  type DomOverflowIssue,
} from "./domOverflowAudit";
import { getAllViewportResolutions } from "./viewport";

// Options for Emulator
const OPTIONS = {
  LAPTOP_WIDTH: 1470,
  LAPTOP_HEIGHT: 762,
  TAKE_SCREENSHOT: false,
  VIEWPORTS: getAllViewportResolutions(),
  EMULATOR_URL: "http://127.0.0.1:5500/src/control-panel/control-panel.html",
  APP_URL: "http://127.0.0.1:5500/src/responsive-demo.html", // The app URL to test
};

// Run the test suite
test.describe("Responsive layouts", () => {
  // Run the emulator with the laptop viewport
  test("Emulator", async ({ page }) => {
    test.setTimeout(60 * 60 * 1000); // 1 hour (default is 30 seconds)

    // Set the viewport size as what would fit on the laptop screen
    await page.setViewportSize({
      width: OPTIONS.LAPTOP_WIDTH,
      height: OPTIONS.LAPTOP_HEIGHT,
    });

    // Go to the emulator URL
    await page.goto(OPTIONS.EMULATOR_URL);

    // Inject emulator config: same URL, different emulated viewports.
    await page.evaluate(
      ({ appUrl, viewports }) => {
        (window as any).__setEmulatorConfig({
          pageUrl: appUrl,
          viewports: viewports,
          initialIndex: 0,
        });
      },
      {
        appUrl: OPTIONS.APP_URL,
        viewports: OPTIONS.VIEWPORTS,
      },
    );

    const iframe = page.locator("#appIframe");
    await iframe.waitFor({ state: "attached", timeout: 15_000 });
    await page
      .frameLocator("#appIframe")
      .locator("body")
      .waitFor({ state: "visible", timeout: 15_000 });

    const appFrame = await page.locator("#appIframe").elementHandle();
    const frame = await appFrame?.contentFrame();

    if (!frame) {
      throw new Error(
        "Emulator iframe has no content frame (same-origin app URL required).",
      );
    }

    console.log("frame found");
    /** Full-DOM overflow pass on the app document inside the emulator. */
    const overflowIssues: DomOverflowIssue[] = await frame.evaluate(
      auditDomForTextOverflow as () => DomOverflowIssue[],
    );
    // eslint-disable-next-line no-console
    console.log(
      `[dom overflow] ${overflowIssues.length} issue(s) on initial viewport:\n`,
      JSON.stringify(overflowIssues, null, 2),
    );
    await test.info().attach("dom-overflow-initial.json", {
      body: JSON.stringify(overflowIssues, null, 2),
      contentType: "application/json",
    });

    // Keep it open so you can click Next/Prev to inspect.
    await page.waitForTimeout(3600 * 1000); // 1 hour

    if (OPTIONS.TAKE_SCREENSHOT) {
      // Take screenshot so you can visually inspect layouts
      // const screenshotPath =
      //   `screenshots/${vp.screen}-${vp.layout}-${Math.round(
      //     width,
      //   )}x${Math.round(height)}.png`.replace(/\s+/g, "_");
      // await page.screenshot({
      //   path: screenshotPath,
      //   fullPage: true,
      // });
    }
  });
});
