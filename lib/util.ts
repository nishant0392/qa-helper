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
