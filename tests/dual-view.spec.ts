import { test, chromium, type Page } from "@playwright/test";
import { getAllViewportResolutions } from "./viewport";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:5500";
const APP_URL = `${BASE_URL}/src/responsive-demo.html`;
const CONTROL_URL = `${BASE_URL}/src/control-panel/control-panel.html`;

/** Left ~70% width, right ~30%; heights use full avail height. */
const LEFT_RATIO = 0.7;

function getTargetId(page: Page): string | undefined {
  const p = page as unknown as { _target?: { _targetId?: string } };
  return p._target?._targetId;
}

async function setWindowBounds(
  page: Page,
  bounds: { left: number; top: number; width: number; height: number },
): Promise<void> {
  const targetId = getTargetId(page);
  if (!targetId) return;
  const session = await page.context().newCDPSession(page);
  try {
    const { windowId } = await session.send("Browser.getWindowForTarget", {
      targetId,
    });
    await session.send("Browser.setWindowBounds", {
      windowId,
      bounds: { ...bounds, windowState: "normal" },
    });
  } catch {
    // CDP may fail depending on OS / Chrome build — layout still works without it.
  } finally {
    await session.detach().catch(() => {});
  }
}

test.describe.configure({ mode: "serial" });

test("dual window: app (left ~70%) + control panel (right ~30%)", async () => {
  test.setTimeout(60 * 60 * 1000);

  const browser = await chromium.launch({
    headless: false,
    ...(process.env.PW_CHROME_CHANNEL
      ? { channel: process.env.PW_CHROME_CHANNEL }
      : {}),
    args: ["--disable-popup-blocking"],
  });

  let leftW = 1029;
  let rightW = 441;
  let screenH = 801;

  try {
    const probe = await browser.newContext();
    const probePage = await probe.newPage();
    await probePage.goto("about:blank");
    const dim = await probePage.evaluate(() => ({
      w: window.screen.availWidth,
      h: window.screen.availHeight,
    }));
    await probe.close();

    leftW = Math.floor(dim.w * LEFT_RATIO);
    rightW = dim.w - leftW;
    screenH = dim.h;

    const viewports = getAllViewportResolutions();
    let index = 0;
    let useCustom = false;
    let customW = 441;
    let customH = 721;
    let userZoomPct = 100;

    const ctxLeft = await browser.newContext({
      viewport: { width: leftW, height: screenH },
    });
    const ctxRight = await browser.newContext({
      viewport: { width: rightW, height: screenH },
    });

    const pageLeft = await ctxLeft.newPage();
    const pageRight = await ctxRight.newPage();

    await pageRight.exposeFunction(
      "__pwViewport",
      async (payload: {
        action: "init" | "next" | "prev" | "custom" | "zoom";
        w?: number;
        h?: number;
        zoomPct?: number;
      }) => {
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

        const vw = useCustom
          ? customW
          : Math.round(viewports[index].resolution.width);
        const vh = useCustom
          ? customH
          : Math.round(viewports[index].resolution.height);

        await pageLeft.setViewportSize({ width: vw, height: vh });

        const fit = Math.min(1, leftW / vw, screenH / vh);
        const effectiveZoom = fit * userZoomPct;
        await pageLeft.evaluate((z) => {
          document.documentElement.style.zoom = `${z}%`;
        }, effectiveZoom);

        const vp = viewports[index];
        const label = useCustom
          ? `Custom ${customW}×${customH} • zoom slider ${userZoomPct}% (effective ~${effectiveZoom.toFixed(0)}%)`
          : `${vp.screen} | ${vp.layout} (${vw}×${vh}) [${index + 1}/${viewports.length}] • zoom ${userZoomPct}%`;

        return {
          label,
          zoomPct: userZoomPct,
          index,
          max: viewports.length - 1,
        };
      },
    );

    await pageLeft.goto(APP_URL);
    await pageRight.goto(CONTROL_URL);

    await setWindowBounds(pageLeft, {
      left: 0,
      top: 0,
      width: leftW,
      height: screenH,
    });
    await setWindowBounds(pageRight, {
      left: leftW,
      top: 0,
      width: rightW,
      height: screenH,
    });

    await pageRight.evaluate(async () => {
      const fn = (
        window as unknown as {
          __pwViewport?: (p: {
            action: string;
          }) => Promise<{ label?: string } | null>;
        }
      ).__pwViewport;
      if (typeof fn !== "function") return;
      const r = await fn({ action: "init" });
      const meta = document.getElementById("meta");
      if (meta && r && r.label) meta.textContent = r.label;
    });

    await pageLeft.waitForTimeout(60 * 60 * 1000);
  } finally {
    await browser.close();
  }
});
