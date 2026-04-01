/**
 * Get the zoom percent required to display a scaled view.
 * @param rendererResolution - The resolution of the renderer window.
 * @param actualResolution - The actual resolution to emulate.
 * @returns The zoom percent.
 */
export const getZoomPercent = (
  rendererResolution: { width: number; height: number },
  actualResolution: { width: number; height: number },
) => {
  const fit = Math.min(
    1,
    rendererResolution.width / actualResolution.width,
    rendererResolution.height / actualResolution.height,
  );
  return fit * 100;
};

/**
 * Apply the emulated viewport to the document.
 * @param _document - The document to apply the emulated viewport to.
 * @param emulatedWidth - The width of the emulated viewport.
 * @param emulatedHeight - The height of the emulated viewport.
 */
export const applyEmulatedViewport = (
  _document: Document,
  emulatedWidth: number,
  emulatedHeight: number,
) => {
  const scale = Math.min(
    window.innerWidth / emulatedWidth,
    window.innerHeight / emulatedHeight,
  );
  const tx = (window.innerWidth - emulatedWidth * scale) / 2;
  const ty = (window.innerHeight - emulatedHeight * scale) / 2;

  const root = _document.documentElement;
  root.style.width = `${emulatedWidth}px`;
  root.style.height = `${emulatedHeight}px`;
  root.style.overflow = "hidden";
  root.style.position = "fixed";
  root.style.left = `${tx}px`;
  root.style.top = `${ty}px`;
  root.style.transform = `scale(${scale})`;
  root.style.transformOrigin = "0 0";
};
