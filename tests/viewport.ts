/**
 * Viewport resolutions are the resolutions of the screen that are used to test the responsiveness of the website.
 */

import { ViewportResolution } from "../types";

const MIN_VIEWPORT_WIDTH = 320;
const MIN_VIEWPORT_HEIGHT = 320;
const MAX_VIEWPORT_WIDTH = 1920;
const MAX_VIEWPORT_HEIGHT = 1080;

const SCREEN_RESOLUTIONS = [
  { name: "TIZEN", width: 1920, height: 1080 },
  { name: "My Mac", width: 1470, height: 801 },
  { name: "Android Mini | N5Max | Tx3 Mini", width: 1280, height: 720 },
  { name: "Sony", width: 962, height: 541 },
  { name: "TCL | Firestick | MI Box", width: 960, height: 540 },
  { name: "C Labs", width: 848, height: 1506 },
  { name: "Ipad Air", width: 405, height: 540 },
];

const LAYOUTS = [
  { name: "Fullscreen", layout: "100w*100h" },
  { name: "Two zones | 50:50", layout: "50w*100h" },
  { name: "Three zones | 70:30", layout: "70w*90h" },
  { name: "Three zones | 70:30", layout: "30w*90h" },
  { name: "Two zones | 70:30", layout: "70w*100h" },
  { name: "Two zones | 70:30", layout: "30w*100h" },
  { name: "Footer", layout: "100w*10h" },
];

function getScreenResolutionForLayout(screenWidth, screenHeight, layout) {
  const [lw, lh] = layout.split("*");
  const lwPercent = parseFloat(lw.split("w")[0]);
  const lhPercent = parseFloat(lh.split("h")[0]);

  return {
    width: (lwPercent / 100) * screenWidth,
    height: (lhPercent / 100) * screenHeight,
  };
}

function getAllViewportResolutions() {
  const viewportResolutions: ViewportResolution[] = [];

  SCREEN_RESOLUTIONS.forEach((screen, screenIdx) => {
    LAYOUTS.forEach((layout, layoutIdx) => {
      const resolution = getScreenResolutionForLayout(
        screen.width,
        screen.height,
        layout.layout,
      );

      if (
        layout.name === "Footer" ||
        (resolution.width >= MIN_VIEWPORT_WIDTH &&
          resolution.height >= MIN_VIEWPORT_HEIGHT &&
          resolution.width <= MAX_VIEWPORT_WIDTH &&
          resolution.height <= MAX_VIEWPORT_HEIGHT)
      ) {
        viewportResolutions.push({
          screen: screen.name,
          screenIdx,
          layout: layout.name,
          layoutSpec: layout.layout,
          layoutIdx,
          resolution,
        });
      }
    });
  });

  return viewportResolutions;
}

export { getAllViewportResolutions };
