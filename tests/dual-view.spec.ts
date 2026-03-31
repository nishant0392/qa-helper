import { chromium, test, type Page } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:5500";
const APP_URL = `${BASE_URL}/src/responsive-demo.html`;
const CONTROL_URL = `${BASE_URL}/src/control-panel/control-panel.html`;

const LEFT_WINDOW = { width: 1029, height: 801 };
const RIGHT_WINDOW = { width: 441, height: 801 };

async function setWindowBounds(
  page: Page,
  bounds: { left: number; top: number; width: number; height: number },
): Promise<void> {
  const session = await page.context().newCDPSession(page);
  try {
    // For a page-bound CDP session, targetId is optional and inferred.
    const { windowId } = await session.send("Browser.getWindowForTarget");
    const target = { ...bounds, windowState: "normal" as const };

    // macOS may apply bounds asynchronously; retry once and verify.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await session.send("Browser.setWindowBounds", {
        windowId,
        bounds: target,
      });
      await page.waitForTimeout(120);
      const current = await session.send("Browser.getWindowBounds", {
        windowId,
      });
      if (
        current.bounds.left === bounds.left &&
        current.bounds.top === bounds.top
      ) {
        break;
      }
    }
  } finally {
    await session.detach().catch(() => {});
  }
}

test("dual windows side-by-side", async () => {
  test.setTimeout(60 * 60 * 1000);

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-popup-blocking"],
  });

  try {
    const leftContext = await browser.newContext({
      viewport: LEFT_WINDOW,
    });
    const rightContext = await browser.newContext({
      viewport: RIGHT_WINDOW,
    });

    const leftPage = await leftContext.newPage();
    const rightPage = await rightContext.newPage();

    await leftPage.goto(APP_URL);
    await rightPage.goto(CONTROL_URL);

    await setWindowBounds(leftPage, {
      left: 0,
      top: 0,
      width: LEFT_WINDOW.width,
      height: LEFT_WINDOW.height,
    });
    await setWindowBounds(rightPage, {
      left: LEFT_WINDOW.width,
      top: 0,
      width: RIGHT_WINDOW.width,
      height: RIGHT_WINDOW.height,
    });

    await leftPage.waitForTimeout(60 * 60 * 1000);
  } finally {
    await browser.close();
  }
});
