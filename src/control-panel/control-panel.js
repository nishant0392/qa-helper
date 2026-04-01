(function () {
  var metaEl = document.getElementById("meta");
  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");
  var zoomInput = document.getElementById("zoomInput");
  var zoomValue = document.getElementById("zoomValue");
  var customWInput = document.getElementById("customW");
  var customHInput = document.getElementById("customH");
  var customApplyBtn = document.getElementById("customApply");

  function setMeta(text) {
    if (metaEl) metaEl.textContent = text;
  }

  /**
   * Call the Playwright bridge to set the viewport.
   * @param {Object} payload - The payload to send to the Playwright bridge.
   * @returns {Promise<Object>} - The result from the Playwright bridge.
   */
  function callPlaywright(payload) {
    var fn = window.__playwrightViewport;

    if (typeof fn !== "function") {
      setMeta("Playwright bridge missing — open via npm run view");
      return Promise.resolve(null);
    }

    console.log("Calling Playwright bridge with payload:", payload);
    return Promise.resolve(fn(payload)).then(
      function (result) {
        if (result && result.label) setMeta(result.label);
        return result;
      },
      function () {
        setMeta("Bridge error");
      },
    );
  }

  function syncZoomFromResult(result) {
    if (result && typeof result.zoomPercent === "number") {
      if (zoomInput) zoomInput.value = String(result.zoomPercent);
      if (zoomValue) zoomValue.textContent = result.zoomPercent + "%";
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      callPlaywright({ action: "prev" }).then(syncZoomFromResult);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      callPlaywright({ action: "next" }).then(syncZoomFromResult);
    });
  }

  if (customApplyBtn) {
    customApplyBtn.addEventListener("click", function () {
      var w = parseInt(customWInput.value, 10);
      var h = parseInt(customHInput.value, 10);
      if (isNaN(w) || isNaN(h) || w < 10 || h < 10) {
        setMeta("Invalid width or height");
        return;
      }
      callPlaywright({ action: "custom", w: w, h: h }).then(syncZoomFromResult);
    });
  }

  if (zoomInput) {
    zoomInput.addEventListener("input", function () {
      var z = parseInt(zoomInput.value, 10) || 100;
      if (zoomValue) zoomValue.textContent = z + "%";
      callPlaywright({ action: "zoom", zoomPercent: z });
    });
  }

  window.__controlPanelReady = true;
})();
