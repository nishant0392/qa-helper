import { test } from "@playwright/test";
import { getAllViewportResolutions } from "./viewport";

const VIEWPORTS = getAllViewportResolutions();
const TAKE_SCREENSHOT = false; // Set to true to take screenshots of the layouts
const LAPTOP_WIDTH = 1470;
const LAPTOP_HEIGHT = 762;
const EMULATOR_URL = "http://127.0.0.1:5500/src/emulator/emulator.html";

test.describe("Responsive layouts", () => {
  // Set the timeout to 1 hour
  test.describe.configure({ timeout: 60 * 60 * 1000 });

  //   test("responsive layouts in a single window", async ({ page }) => {
  //     await page.goto(
  //       "http://127.0.0.1:5500/js-playground/responsiveness-check/index.html",
  //     );

  //     for (const vp of viewports) {
  //       const { width, height } = vp.resolution;

  //       await page.setViewportSize({
  //         width: Math.round(width),
  //         height: Math.round(height),
  //       });

  //       console.log(
  //         `Now showing: ${vp.screen} | ${vp.layout} (${Math.round(width)}x${Math.round(height)})`,
  //       );

  //       // Small delay so you can see each layout
  //       await page.waitForTimeout(10000);

  //       if (TAKE_SCREENSHOT) {
  //         // Take screenshot so you can visually inspect layouts
  //         const screenshotPath =
  //           `screenshots/${vp.screen}-${vp.layout}-${Math.round(
  //             width,
  //           )}x${Math.round(height)}.png`.replace(/\s+/g, "_");

  //         await page.screenshot({
  //           path: screenshotPath,
  //           fullPage: true,
  //         });
  //       }
  //     }
  //   });

  test("devtools-like runner (single window + Next)", async ({ page }) => {
    await page.setViewportSize({ width: LAPTOP_WIDTH, height: LAPTOP_HEIGHT });

    const appUrl = "http://127.0.0.1:5500/src/responsive-demo.html";

    await page.goto(EMULATOR_URL);

    // Inject runner config: same URL, different emulated viewports.
    await page.evaluate(
      ({ appUrl, viewports }) => {
        (window as any).__setDevtoolsRunnerConfig({
          pageUrl: appUrl,
          viewports,
          initialIndex: 0,
        });
      },
      { appUrl, viewports: VIEWPORTS },
    );

    // Keep it open so you can click Next/Prev to inspect.
    await page.waitForTimeout(3600000);
  });
});
