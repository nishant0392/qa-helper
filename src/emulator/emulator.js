let viewports = [];
let pageUrl = "";
let index = 0;

const metaEl = document.getElementById("meta");
const viewportEl = document.getElementById("viewport");
const emulatorEl = document.getElementById("emulator");
const appIframeEl = document.getElementById("appIframe");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

function setMeta(text) {
  if (!metaEl) return;
  metaEl.textContent = text;
}

function getCurrentViewport() {
  if (!viewports || viewports.length === 0) return null;
  const safeIndex = Math.max(0, Math.min(index, viewports.length - 1));
  return viewports[safeIndex];
}

function updateEmulation() {
  const vp = getCurrentViewport();

  if (!vp || !viewportEl || !emulatorEl || !appIframeEl) return;

  // Logical viewport size for the app under test.
  // The iframe content should behave as if browser viewport is emuW x emuH.
  const emuW = Math.round(vp.resolution.width);
  const emuH = Math.round(vp.resolution.height);

  // Visible space available in the emulator shell.
  const styles = getComputedStyle(viewportEl);
  const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const padY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
  const emuShellW = viewportEl.clientWidth - padX - 50; // Emulator shell width
  const emuShellH = viewportEl.clientHeight - padY - 50; // Emulator shell height

  // Fit the emulated viewport into available space (DevTools-like zoom).
  // This changes only visual scale, not emulated logical dimensions.
  const scale = Math.min(emuShellW / emuW, emuShellH / emuH);

  // Emulator sets logical size, transform sets visual zoom.
  emulatorEl.style.width = emuW + "px";
  emulatorEl.style.height = emuH + "px";
  emulatorEl.style.transform = "scale(" + scale.toFixed(2) + ")";

  appIframeEl.style.background = "white";
  if (pageUrl) {
    // Load target URL once; viewport changes are driven by emulator sizing.
    if (appIframeEl.getAttribute("src") !== pageUrl) {
      appIframeEl.src = pageUrl;
    }
  }

  const name = `${vp.screen} | ${vp.layout}`;
  setMeta(`${name} (${emuW}×${emuH})  •  ${Math.round(scale * 100)}%`);
}

function next() {
  if (!viewports || viewports.length === 0) return;
  index = Math.min(index + 1, viewports.length - 1);
  updateEmulation();
}

function prev() {
  if (!viewports || viewports.length === 0) return;
  index = Math.max(index - 1, 0);
  updateEmulation();
}

// Public API for Playwright injection
window.__setEmulatorConfig = (cfg) => {
  viewports = cfg && cfg.viewports ? cfg.viewports : [];
  pageUrl = cfg && cfg.pageUrl ? cfg.pageUrl : "";
  index = cfg && typeof cfg.initialIndex === "number" ? cfg.initialIndex : 0;
  updateEmulation();
};

window.addEventListener("resize", () => updateEmulation());
nextBtn && nextBtn.addEventListener("click", next);
prevBtn && prevBtn.addEventListener("click", prev);
