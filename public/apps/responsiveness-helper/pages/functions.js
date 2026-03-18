// Reference width and height for the 1920×1080 screen
const REF_WIDTH = 1920;
const REF_HEIGHT = 1080;


/**
 * Converts a pixel value to a fluid CSS formula: "X * (1vw + 1vh + 1vmin)"
 * @param {number} pixels - The desired pixel value
 * @param {{ width: number, height: number } | null} viewport - Optional fixed viewport dimensions
 */
function pixelsToFluidFormula(pixels, viewport = null) {
  const width = viewport ? viewport.width : window.innerWidth;
  const height = viewport ? viewport.height : window.innerHeight;

  const vw = width / 100;
  const vh = height / 100;
  const vmin = Math.min(width, height) / 100;
  const sum = vw + vh + vmin;

  if (sum <= 0) return '0 * (1vw + 1vh + 1vmin)';

  const coefficient = pixels / sum;
  const rounded = Math.round(coefficient * 100) / 100;

  return `${rounded} * (1vw + 1vh + 1vmin)`;
}

/**
 * Scale image dimensions (designed for 1920×1080) to current viewport.
 * Width scaled by currentWidth/1920, height scaled by currentHeight/1080.
 */
function scaleImageForViewport(widthPx, heightPx) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 0 || h <= 0) return { width: 0, height: 0 };

  const scaleW = w / REF_WIDTH;
  const scaleH = h / REF_HEIGHT;

  return {
    width: Math.round(widthPx * scaleW * 100) / 100,
    height: Math.round(heightPx * scaleH * 100) / 100,
  };
}

/**
 * Scale pixels (designed for 1920×1080) to current viewport by height only.
 */
function scaleTextForViewport(pixels) {
  const h = window.innerHeight;
  if (h <= 0) return 0;
  const scale = h / REF_HEIGHT;
  return Math.round(pixels * scale * 100) / 100;
}

function updateScaleOutput() {
  const output = document.getElementById('scale-output');
  const fluidOutput = document.getElementById('fluid-output');
  const type = document.querySelector('input[name="scale-type"]:checked')?.value || 'image';

  const fluidOutputHeight = document.getElementById('fluid-output-height');
  const formulaHeightRow = document.getElementById('formula-height-row');

  if (type === 'image') {
    const widthPx = parseFloat(document.getElementById('scale-width-input')?.value) || 0;
    const heightPx = parseFloat(document.getElementById('scale-height-input')?.value) || 0;
    const { width, height } = scaleImageForViewport(widthPx, heightPx);
    output.textContent = `${width} × ${height} px`;
    fluidOutput.textContent = pixelsToFluidFormula(width, null);
    fluidOutput.previousElementSibling.textContent = 'Formula (width)';
    fluidOutputHeight.textContent = pixelsToFluidFormula(height, null);
    formulaHeightRow.hidden = false;
  } else {
    const pixels = parseFloat(document.getElementById('scale-pixels-input')?.value) || 0;
    const scaled = scaleTextForViewport(pixels);
    output.textContent = `${scaled} px`;
    fluidOutput.textContent = pixelsToFluidFormula(scaled, null);
    fluidOutput.previousElementSibling.textContent = 'Formula';
    formulaHeightRow.hidden = true;
  }
}

function toggleScaleInputs() {
  const type = document.querySelector('input[name="scale-type"]:checked')?.value || 'image';
  const imageInputs = document.getElementById('scale-image-inputs');
  const textInputs = document.getElementById('scale-text-inputs');

  if (type === 'image') {
    imageInputs.hidden = false;
    textInputs.hidden = true;
  } else {
    imageInputs.hidden = true;
    textInputs.hidden = false;
  }
  updateScaleOutput();
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('resize', updateScaleOutput);

  document.getElementById('scale-width-input')?.addEventListener('input', updateScaleOutput);
  document.getElementById('scale-width-input')?.addEventListener('change', updateScaleOutput);
  document.getElementById('scale-height-input')?.addEventListener('input', updateScaleOutput);
  document.getElementById('scale-height-input')?.addEventListener('change', updateScaleOutput);
  document.getElementById('scale-pixels-input')?.addEventListener('input', updateScaleOutput);
  document.getElementById('scale-pixels-input')?.addEventListener('change', updateScaleOutput);
  document.querySelectorAll('input[name="scale-type"]').forEach((r) => {
    r.addEventListener('change', () => {
      toggleScaleInputs();
    });
  });

  toggleScaleInputs();
  updateScaleOutput();
});
