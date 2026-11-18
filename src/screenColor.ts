import { srgbToHex, type Srgb } from "./oklch.ts";

/** Canvas that turns any CSS color into 8-bit sRGB, as the screen shows it. */
let canvas: CanvasRenderingContext2D | null = null;

export function toScreenSrgb(color: string): Srgb {
  canvas ??= Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext(
    "2d",
    { willReadFrequently: true },
  );
  if (!canvas) return [0, 0, 0];
  canvas.clearRect(0, 0, 1, 1);
  canvas.fillStyle = "#000";
  canvas.fillStyle = color;
  canvas.fillRect(0, 0, 1, 1);
  const [r, g, b] = canvas.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

/** #rrggbb of any CSS color as the screen shows it, clipped to sRGB. */
export function cssColorToHex(color: string): string {
  return srgbToHex(toScreenSrgb(color));
}
