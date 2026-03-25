let viewports = [];
let pageUrl = "";
let index = 0;

const metaEl = document.getElementById("meta");
const frameEl = document.getElementById("viewportFrame");
const holderEl = document.getElementById("emulatedHolder");
const iframeEl = document.getElementById("appFrame");
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
  if (!vp) return;
  if (!frameEl || !holderEl || !iframeEl) return;

  // Logical viewport size for the app under test.
  // The iframe content should behave as if browser viewport is emuW x emuH.
  const emuW = Math.round(vp.resolution.width);
  const emuH = Math.round(vp.resolution.height);

  // Visible space available in the runner shell.
  const shellW = frameEl.clientWidth;
  const shellH = frameEl.clientHeight;

  // Fit the emulated viewport into available space (DevTools-like zoom).
  // This changes only visual scale, not emulated logical dimensions.
  const scale = Math.min(shellW / emuW, shellH / emuH);

  // Holder sets logical size, transform sets visual zoom.
  holderEl.style.width = emuW + "px";
  holderEl.style.height = emuH + "px";
  holderEl.style.transform = "scale(" + scale.toFixed(2) + ")";

  iframeEl.style.background = "white";
  if (pageUrl) {
    // Load target URL once; viewport changes are driven by holder sizing.
    if (iframeEl.getAttribute("src") !== pageUrl) {
      iframeEl.src = pageUrl;
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
window.__setDevtoolsRunnerConfig = (cfg) => {
  viewports = cfg && cfg.viewports ? cfg.viewports : [];
  pageUrl = cfg && cfg.pageUrl ? cfg.pageUrl : "";
  index = cfg && typeof cfg.initialIndex === "number" ? cfg.initialIndex : 0;
  updateEmulation();
};

window.addEventListener("resize", () => updateEmulation());
nextBtn && nextBtn.addEventListener("click", next);
prevBtn && prevBtn.addEventListener("click", prev);
