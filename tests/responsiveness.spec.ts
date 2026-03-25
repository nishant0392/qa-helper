import { test } from "@playwright/test";
import { getAllViewportResolutions } from "./viewport";

const VIEWPORTS = getAllViewportResolutions();

// Options for Emulator
const OPTIONS = {
  LAPTOP_WIDTH: 1470,
  LAPTOP_HEIGHT: 762,
  TAKE_SCREENSHOT: false,
  VIEWPORTS: getAllViewportResolutions(),
  EMULATOR_URL: "http://127.0.0.1:5500/src/emulator/emulator.html",
};

test.describe("Responsive layouts", () => {
  // Run the emulator with the laptop viewport
  test("Emulator", async ({ page }) => {
    await page.setViewportSize({
      width: OPTIONS.LAPTOP_WIDTH,
      height: OPTIONS.LAPTOP_HEIGHT,
    });

    const appUrl = "http://127.0.0.1:5500/src/responsive-demo.html";

    await page.goto(OPTIONS.EMULATOR_URL);

    // Inject runner config: same URL, different emulated viewports.
    await page.evaluate(
      ({ appUrl, viewports }) => {
        (window as any).__setEmulatorConfig({
          pageUrl: appUrl,
          viewports,
          initialIndex: 0,
        });
      },
      { appUrl, viewports: VIEWPORTS },
    );

    // Keep it open so you can click Next/Prev to inspect.
    await page.waitForTimeout(3600000);

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
