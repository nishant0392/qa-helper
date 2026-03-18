const MIN_VIEWPORT_WIDTH = 320;
const MIN_VIEWPORT_HEIGHT = 320;
const MAX_VIEWPORT_WIDTH = 1920;
const MAX_VIEWPORT_HEIGHT = 1080;

// List of screen resolutions
const SCREEN_RESOLUTIONS = [
  { name: "TIZEN", width: 1920, height: 1080 },
  { name: "My Mac", width: 1470, height: 801 },
  { name: "Android Mini | N5Max | Tx3 Mini", width: 1280, height: 720 },
  { name: "Sony", width: 962, height: 541 },
  { name: "TCL | Firestick | MI Box", width: 960, height: 540 },
  { name: "C Labs", width: 848, height: 1506 },
  { name: "Ipad Air", width: 405, height: 540 },
];

// List of layouts to check for responsiveness
const LAYOUTS = [
  { name: "Fullscreen", layout: "100w*100h" },
  { name: "Two zones | 50:50", layout: "50w*100h" },
  { name: "Three zones | 70:30", layout: "70w*90h" },
  { name: "Three zones | 70:30", layout: "30w*90h" },
  { name: "Two zones | 70:30", layout: "70w*100h" },
  { name: "Two zones | 70:30", layout: "30w*100h" },
  { name: "Footer", layout: "100w*10h" },
];

/** Function to get the resolution of the screen for the given layout */
function getScreenResolutionForLayout(screenWidth, screenHeight, layout) {
  var dimensions = layout.split("*");
  var lw = dimensions[0];
  var lh = dimensions[1];
  var lw_percent = lw.split("w")[0];
  var lh_percent = lh.split("h")[0];
  var viewWidth = (lw_percent / 100) * screenWidth;
  var viewHeight = (lh_percent / 100) * screenHeight;

  return { width: viewWidth, height: viewHeight };
}

/** Function to get all the viewport resolutions for all the layouts for all screens. */
function getAllViewportResolutions() {
  var viewportResolutions = [];

  SCREEN_RESOLUTIONS.forEach(function (screen, screenIdx) {
    LAYOUTS.forEach(function (layout, layoutIdx) {
      var resolution = getScreenResolutionForLayout(
        screen.width,
        screen.height,
        layout.layout,
      );
      // add resolutions which are practically achievable
      if (
        layout.name == "Footer" ||
        (resolution.width >= MIN_VIEWPORT_WIDTH &&
          resolution.height >= MIN_VIEWPORT_HEIGHT &&
          resolution.width <= MAX_VIEWPORT_WIDTH &&
          resolution.height <= MAX_VIEWPORT_HEIGHT)
      ) {
        viewportResolutions.push({
          screen: screen.name,
          screenIdx: screenIdx,
          layout: layout.name,
          layoutSpec: layout.layout,
          layoutIdx: layoutIdx,
          resolution: resolution,
        });
      }
    });
  });

  return viewportResolutions;
}

function getFontSize(fontMultiplier = 1) {
  var allViewportResolutions = getAllViewportResolutions();

  var fontSizes = [];
  allViewportResolutions.forEach(function (item) {
    // Calculate font size based on breakpoint
    var w = item.resolution.width;
    var h = item.resolution.height;
    var vw = w / 100;
    var vh = h / 100;
    var vmin = Math.min(vw, vh);
    var fontSize = Math.round(fontMultiplier * (vw + vh + vmin));
    fontSizes.push([item.resolution.width, item.resolution.height, fontSize]);
  });

  return fontSizes;
}

/** Returns currently selected screen indices and layout indices */
function getSelectedFilters() {
  var selectedScreens = [];
  var selectedLayouts = [];

  document.querySelectorAll(".filter-screen:checked").forEach(function (cb) {
    selectedScreens.push(parseInt(cb.value, 10));
  });
  document.querySelectorAll(".filter-layout:checked").forEach(function (cb) {
    selectedLayouts.push(parseInt(cb.value, 10));
  });

  return { screens: selectedScreens, layouts: selectedLayouts };
}

/** Renders checkbox controls for screens and layouts */
function renderControls() {
  var controlsEl = document.getElementById("controls");
  if (!controlsEl) return;

  var screenCheckboxes = SCREEN_RESOLUTIONS.map(function (s, i) {
    return (
      "<div class='checkbox-item'><input type='checkbox' class='filter-screen' id='screen-" +
      i +
      "' value='" +
      i +
      "' checked><label for='screen-" +
      i +
      "'>" +
      escapeHtml(s.name) +
      "</label></div>"
    );
  }).join("");

  var layoutCheckboxes = LAYOUTS.map(function (l, i) {
    return (
      "<div class='checkbox-item'><input type='checkbox' class='filter-layout' id='layout-" +
      i +
      "' value='" +
      i +
      "' checked><label for='layout-" +
      i +
      "'>" +
      escapeHtml(l.name) +
      " (" +
      escapeHtml(l.layout) +
      ")</label></div>"
    );
  }).join("");

  controlsEl.innerHTML = [
    "<h2>Screens</h2>",
    "<div class='select-all-row'>",
    "<button type='button' class='btn-select' data-section='screen'>Select All</button>",
    "<button type='button' class='btn-deselect' data-section='screen'>Deselect All</button>",
    "</div>",
    "<div class='checkbox-group' id='screen-checkboxes'>" +
      screenCheckboxes +
      "</div>",
    "<h2>Layouts</h2>",
    "<div class='select-all-row'>",
    "<button type='button' class='btn-select' data-section='layout'>Select All</button>",
    "<button type='button' class='btn-deselect' data-section='layout'>Deselect All</button>",
    "</div>",
    "<div class='checkbox-group' id='layout-checkboxes'>" +
      layoutCheckboxes +
      "</div>",
  ].join("");

  controlsEl
    .querySelectorAll(".filter-screen, .filter-layout")
    .forEach(function (el) {
      el.addEventListener("change", renderViewportResults);
    });

  controlsEl.querySelectorAll(".btn-select").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var section = btn.getAttribute("data-section");
      var selector = section === "screen" ? ".filter-screen" : ".filter-layout";
      document.querySelectorAll(selector).forEach(function (cb) {
        cb.checked = true;
      });
      renderViewportResults();
    });
  });

  controlsEl.querySelectorAll(".btn-deselect").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var section = btn.getAttribute("data-section");
      var selector = section === "screen" ? ".filter-screen" : ".filter-layout";
      document.querySelectorAll(selector).forEach(function (cb) {
        cb.checked = false;
      });
      renderViewportResults();
    });
  });
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/** Renders viewport resolutions and font sizes in HTML table format */
function renderViewportResults() {
  var fontMultiplier = 1;
  var filters = getSelectedFilters();
  var selectedScreenSet = new Set(filters.screens);
  var selectedLayoutSet = new Set(filters.layouts);

  var allViewportResolutions = getAllViewportResolutions();
  var rows = [];

  allViewportResolutions.forEach(function (viewportResolution) {
    if (
      !selectedScreenSet.has(viewportResolution.screenIdx) ||
      !selectedLayoutSet.has(viewportResolution.layoutIdx)
    ) {
      return;
    }

    var w = viewportResolution.resolution.width;
    var h = viewportResolution.resolution.height;
    var vw = w / 100;
    var vh = h / 100;
    var vmin = Math.min(vw, vh);
    var fontSize = Math.round(fontMultiplier * (vw + vh + vmin));

    rows.push({
      screen: viewportResolution.screen,
      layout: viewportResolution.layout,
      layoutSpec: viewportResolution.layoutSpec,
      width: Math.round(viewportResolution.resolution.width),
      height: Math.round(viewportResolution.resolution.height),
      fontSize: fontSize,
    });
  });

  var tableHtml = [
    "<table>",
    "<caption>Viewport Resolutions & Font Sizes</caption>",
    "<thead><tr>",
    "<th>Screen</th><th>Layout</th><th>Layout Spec</th><th>Width</th><th>Height</th><th>Font Size</th>",
    "</tr></thead>",
    "<tbody>",
    rows
      .map(function (r) {
        return (
          "<tr><td>" +
          escapeHtml(r.screen) +
          "</td><td>" +
          escapeHtml(r.layout) +
          "</td><td>" +
          escapeHtml(r.layoutSpec) +
          "</td>" +
          "<td>" +
          r.width +
          "</td><td>" +
          r.height +
          "</td><td>" +
          r.fontSize +
          "</td></tr>"
        );
      })
      .join(""),
    "</tbody></table>",
  ].join("");

  var container = document.getElementById("viewport-results");
  if (container) {
    container.innerHTML = tableHtml;
  }
}

renderControls();
renderViewportResults();
