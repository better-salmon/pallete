/** The ramp.css formulas; each was fitted on one Figma palette. */
export const FORMULAS = ["accent", "neutral", "brand"] as const;

export type Formula = (typeof FORMULAS)[number];

/**
 * OKLab lightness of the Figma 500 key each formula was fitted on. Keys far
 * from it push the formula outside the data it was fitted to.
 */
export const FORMULA_KEY_LIGHTNESS: Record<Formula, number> = {
  accent: 0.714,
  neutral: 0.63,
  brand: 0.555,
};

/** How far a key's lightness may drift from the fitted key before we warn. */
export const LIGHTNESS_TOLERANCE = 0.08;
