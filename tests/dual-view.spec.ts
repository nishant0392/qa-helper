import { chromium, test, type Page } from "@playwright/test";
import { getAllViewportResolutions } from "../src/viewport";

const BASE_URL = "http://127.0.0.1:5500";
const APP_URL = `${BASE_URL}/src/responsive-demo.html`;
const CONTROL_URL = `${BASE_URL}/src/control-panel/control-panel.html`;

const LEFT_WINDOW = { width: 1029, height: 801 };
const RIGHT_WINDOW = { width: 441, height: 801 };

let leftPage: Page;
let rightPage: Page;

// Playwright bridge variables
let index = 0;
let useCustom = false;
let customW = 441;
let customH = 721;
let userZoomPct = 100;

// Viewports
const viewports = getAllViewportResolutions();

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

async function openRendererAndControlPanel() {
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

    // Create the left and right page.
    leftPage = await leftContext.newPage();
    rightPage = await rightContext.newPage();

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
}

/**
 * The Playwright bridge function.
 * @param {Object} payload - The payload to send to the Playwright bridge.
 * @returns {Promise<Object>} - The result from the Playwright bridge.
 */
async function __playwrightViewport(payload: {
  action: "init" | "next" | "prev" | "custom" | "zoom";
  w?: number;
  h?: number;
  zoomPct?: number;
}) {
  if (payload.action === "zoom" && typeof payload.zoomPct === "number") {
    userZoomPct = Math.max(30, Math.min(200, payload.zoomPct));
  } else if (payload.action === "init") {
    useCustom = false;
    index = 0;
  } else if (payload.action === "next") {
    useCustom = false;
    index = Math.min(index + 1, viewports.length - 1);
  } else if (payload.action === "prev") {
    useCustom = false;
    index = Math.max(index - 1, 0);
  } else if (payload.action === "custom") {
    useCustom = true;
    customW = Math.max(1, Math.round(payload.w ?? 441));
    customH = Math.max(1, Math.round(payload.h ?? 721));
  }

  let vw = useCustom ? customW : Math.round(viewports[index].resolution.width);
  let vh = useCustom ? customH : Math.round(viewports[index].resolution.height);
  console.log("vw:", vw, "vh:", vh);
  vw = 1029;
  vh = 801;
  await leftPage.setViewportSize({ width: vw, height: vh });

  const fit = Math.min(1, vw / 1920, vh / 1080);
  const effectiveZoom = fit * userZoomPct;
  await leftPage.evaluate((z) => {
    document.documentElement.style.zoom = `${z}%`;
  }, effectiveZoom);

  const vp = viewports[index];
  const label = useCustom
    ? `Custom ${customW}x${customH} • zoom slider ${userZoomPct}% (effective ~${effectiveZoom.toFixed(0)}%)`
    : `${vp.screen} | ${vp.layout} (${vw}x${vh}) [${index + 1}/${viewports.length}] • zoom ${userZoomPct}%`;

  return {
    label,
    zoomPct: userZoomPct,
    index,
    max: viewports.length - 1,
  };
}

// Test: Open the renderer and control panel to test the responsive design.
test("open renderer and control panel side-by-side", async () => {
  test.setTimeout(60 * 60 * 1000);

  // Open the renderer and control panel
  await openRendererAndControlPanel();

  // Setup the Playwright bridge.
  await rightPage.exposeFunction("__playwrightViewport", __playwrightViewport);

  // Initialize the Playwright bridge.
  await rightPage.evaluate(async () => {
    const r = await __playwrightViewport({ action: "init" });
    const meta = document.getElementById("meta");
    if (meta && r && r.label) meta.textContent = r.label;
  });

  // Wait for the test to complete.
  await leftPage.waitForTimeout(60 * 60 * 1000);
});
