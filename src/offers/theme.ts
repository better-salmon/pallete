/*
 * Which palette each role of the Offers components uses. A role starts on
 * its original tokens (tokens.css) and can switch to another original or to
 * a 500 key run through one of the ramp.css formulas.
 */
import { FORMULAS, type Formula } from "../formulas.ts";
import { STEPS } from "../Palette.tsx";
import { sampleRamp } from "../rampSampler.ts";

export const ROLES = ["neutral", "accent", "brand", "alert", "warning", "success"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_NOTES: Record<Role, string> = {
  neutral: "surfaces, inputs, body text",
  accent: "primary button, selected amount, caret",
  brand: "headings, secondary and tertiary buttons, borders",
  alert: "invalid fields",
  warning: "not used by these components yet",
  success: "valid fields",
};

/**
 * Stored by value rather than by reference to a saved palette: saved
 * palettes get new ids every load and can be renamed or removed.
 */
export type RoleSource =
  | { kind: "original"; role: Role }
  | { kind: "ramp"; key: string; formula: Formula; label?: string };

export type Theme = Record<Role, RoleSource>;

export const ORIGINAL_THEME: Theme = Object.fromEntries(
  ROLES.map((role) => [role, { kind: "original", role }]),
) as Theme;

const STORAGE_KEY = "pallete:components-theme:v1";

const isRole = (value: unknown): value is Role =>
  typeof value === "string" && (ROLES as readonly string[]).includes(value);

function isSource(value: unknown): value is RoleSource {
  if (typeof value !== "object" || value === null) return false;
  const source = value as Record<string, unknown>;
  if (source.kind === "original") return isRole(source.role);
  return (
    source.kind === "ramp" &&
    typeof source.key === "string" &&
    /^#[0-9a-f]{6}$/i.test(source.key) &&
    typeof source.formula === "string" &&
    (FORMULAS as readonly string[]).includes(source.formula) &&
    (source.label === undefined || typeof source.label === "string")
  );
}

/** The saved theme; roles missing or unreadable fall back to their originals. */
export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return ORIGINAL_THEME;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return ORIGINAL_THEME;
    const saved = data as Record<string, unknown>;
    return Object.fromEntries(
      ROLES.map((role) => [role, isSource(saved[role]) ? saved[role] : ORIGINAL_THEME[role]]),
    ) as Theme;
  } catch {
    return ORIGINAL_THEME;
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Storage can be full or blocked; the page still works without it.
  }
}

/** The ten hex values, 50 → 900, of the original scale for a role, read from tokens.css. */
export function originalSteps(role: Role): string[] {
  const root = getComputedStyle(document.documentElement);
  return STEPS.map((step) => root.getPropertyValue(`--${role}-${step}`).trim());
}

/** The ten hex values a source resolves to. */
export function resolveSteps(source: RoleSource): string[] {
  return source.kind === "original"
    ? originalSteps(source.role)
    : sampleRamp(source.key, source.formula).map((sample) => sample.hex);
}

/** The ten hex values every role currently resolves to. */
export function resolveTheme(theme: Theme): Record<Role, string[]> {
  return Object.fromEntries(ROLES.map((role) => [role, resolveSteps(theme[role])])) as Record<
    Role,
    string[]
  >;
}

/**
 * Custom properties that point every role at its chosen palette. Values are
 * resolved hexes, not var() references, so mapping brand to the original
 * accent still works while accent itself is overridden.
 */
export function themeStyle(theme: Theme, steps = resolveTheme(theme)): Record<string, string> {
  const style: Record<string, string> = {};
  for (const role of ROLES) {
    const source = theme[role];
    if (source.kind === "original" && source.role === role) continue;
    steps[role].forEach((hex, i) => {
      style[`--${role}-${STEPS[i]}`] = hex;
    });
  }
  return style;
}
