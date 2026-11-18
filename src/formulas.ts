/**
 * The ramp.css formulas: accent, neutral and brand were each fitted on one
 * Figma palette; perceptual and perceptual-v2 are designed lightness ladders;
 * vivid and bold are perceptual-v2 with a chroma bulge and a hue
 * shift; vivid-dark is vivid with shades shaped as dark-mode surfaces.
 */
export const FORMULAS = [
  "vivid",
  "vivid-dark",
  "bold",
  "perceptual-v2",
  "perceptual",
  "accent",
  "neutral",
  "brand",
] as const;

export type Formula = (typeof FORMULAS)[number];

/**
 * OKLab lightness of the Figma 500 key each formula was fitted on. Keys far
 * from it push the formula outside the data it was fitted to.
 */
export const FORMULA_KEY_LIGHTNESS: Record<
  Exclude<Formula, "perceptual" | "perceptual-v2" | "vivid" | "vivid-dark" | "bold">,
  number
> = {
  accent: 0.714,
  neutral: 0.63,
  brand: 0.555,
};

/** How far a key's lightness may drift from the fitted key before we warn. */
export const LIGHTNESS_TOLERANCE = 0.08;

/** OKLCH lightness the perceptual formula gives every 500, whatever the key. */
export const LADDER_500_LIGHTNESS = 0.57;

/** OKLCH lightness perceptual-v2, vivid and bold pin every 50 and 900 to. */
export const LADDER_ENDS = { top: 0.97, bottom: 0.25 } as const;

/**
 * OKLCH lightness vivid-dark pins its dark-surface shades to, whatever the
 * key. Its 50 stays at LADDER_ENDS.top; its 600 sits halfway from the key to 700.
 */
export const DARK_SHADES = { 700: 0.27, 800: 0.22, 900: 0.18 } as const;

/** OKLCH lightness of each step in the perceptual formula, 50 → 900. */
export const PERCEPTUAL_LADDER = [0.97, 0.89, 0.81, 0.73, 0.65, 0.57, 0.49, 0.41, 0.33, 0.25];

/** Keys the "How it works" section offers as presets and draws in the staircase. */
export const KEY_PRESETS = [
  { label: "accent 500", hex: "#fd715e" },
  { label: "neutral 500", hex: "#918878" },
  { label: "brand 500", hex: "#148385" },
  { label: "blue", hex: "#3d8fe4" },
  { label: "yellow", hex: "#f5c518" },
];
