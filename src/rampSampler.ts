import type { Formula } from "./formulas.ts";
import { srgbToHex, srgbToOklch, type Oklch } from "./oklch.ts";
import { toScreenSrgb } from "./screenColor.ts";
import { STEPS, type Step } from "./Palette.tsx";

export type Sample = {
  step: Step;
  /** What the formula asks for: the computed CSS color, before any gamut clipping. */
  intended: Oklch;
  /** What the screen shows: the same color after conversion to 8-bit sRGB. */
  shown: Oklch;
  hex: string;
  /** True when the formula asked for a color sRGB cannot show, so it was clipped. */
  clipped: boolean;
};

const NUMBER = String.raw`(-?[\d.]+(?:e-?\d+)?|none)`;
const OKLCH = new RegExp(String.raw`^oklch\(${NUMBER} ${NUMBER} ${NUMBER}`);
const SRGB = new RegExp(String.raw`^color\(srgb ${NUMBER} ${NUMBER} ${NUMBER}`);

/**
 * The computed color as OKLCH without clipping. Chrome resolves relative
 * oklch() to `oklch(l c h)` and sRGB color-mix() to `color(srgb r g b)`,
 * keeping values outside the gamut; anything else falls back to the screen color.
 */
function parseComputed(color: string, fallback: Oklch): Oklch {
  const num = (v: string) => (v === "none" ? 0 : Number(v));
  const lch = OKLCH.exec(color);
  if (lch) return { l: num(lch[1]), c: num(lch[2]), h: num(lch[3]) };
  const rgb = SRGB.exec(color);
  if (rgb) return srgbToOklch([num(rgb[1]), num(rgb[2]), num(rgb[3])]);
  return fallback;
}

let host: HTMLDivElement | null = null;

/** Off-screen element the sampler renders ramps into, so it reads real ramp.css output. */
function sampleHost(): HTMLDivElement {
  if (!host) {
    host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden";
    document.body.append(host);
  }
  return host;
}

/** The 10 steps one ramp.css formula produces for a key, read back from the browser. */
export function sampleRamp(keyColor: string, formula: Formula): Sample[] {
  const list = document.createElement("ul");
  list.className = `ramp ramp--${formula}`;
  list.style.setProperty("--ramp-key", keyColor);
  const items = STEPS.map((step) => {
    const item = document.createElement("li");
    item.style.background = `var(--ramp-${step})`;
    list.append(item);
    return item;
  });
  sampleHost().append(list);

  const samples = items.map((item, i) => {
    const computed = getComputedStyle(item).backgroundColor;
    const rgb = toScreenSrgb(computed);
    const shown = srgbToOklch(rgb);
    const intended = parseComputed(computed, shown);
    const clipped = Math.hypot(intended.l - shown.l, intended.c - shown.c) > 0.008;
    return { step: STEPS[i], intended, shown, hex: srgbToHex(rgb), clipped };
  });

  list.remove();
  return samples;
}
