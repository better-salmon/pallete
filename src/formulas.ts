/**
 * The ramp.css formulas: accent, neutral and brand were each fitted on one
 * Figma palette; perceptual and perceptual-v2 are designed lightness ladders.
 */
export const FORMULAS = ["perceptual-v2", "perceptual", "accent", "neutral", "brand"] as const;

export type Formula = (typeof FORMULAS)[number];

/**
 * OKLab lightness of the Figma 500 key each formula was fitted on. Keys far
 * from it push the formula outside the data it was fitted to.
 */
export const FORMULA_KEY_LIGHTNESS: Record<
  Exclude<Formula, "perceptual" | "perceptual-v2">,
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

/** OKLCH lightness perceptual-v2 pins every 50 and 900 to. */
export const LADDER_ENDS = { top: 0.97, bottom: 0.25 } as const;
