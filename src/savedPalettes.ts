import { FORMULAS, type Formula } from "./formulas.ts";

/** A generated palette as stored: everything but the runtime id. */
export type SavedPalette = { name: string; key: string; formula: Formula };

export type SavedState = { globalKey: string; palettes: SavedPalette[] };

/** Starting names, keys and formulas for the generated scales; all can be changed. */
export const DEFAULT_STATE: SavedState = {
  globalKey: "#3d8fe4",
  palettes: [
    { name: "blue", key: "#3d8fe4", formula: "vivid" },
    { name: "green", key: "#45b164", formula: "vivid" },
    { name: "violet", key: "#9572e7", formula: "vivid" },
  ],
};

const STORAGE_KEY = "pallete:generated:v1";

const isHex = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

const isFormula = (value: unknown): value is Formula =>
  typeof value === "string" && (FORMULAS as readonly string[]).includes(value);

function isSavedPalette(value: unknown): value is SavedPalette {
  if (typeof value !== "object" || value === null) return false;
  const { name, key, formula } = value as Record<string, unknown>;
  return typeof name === "string" && isHex(key) && isFormula(formula);
}

/** The saved state, or undefined when there is none or it can't be read. */
export function loadSavedState(): SavedState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return undefined;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return undefined;
    const { globalKey, palettes } = data as Record<string, unknown>;
    if (!isHex(globalKey) || !Array.isArray(palettes)) return undefined;
    return { globalKey, palettes: palettes.filter(isSavedPalette) };
  } catch {
    return undefined;
  }
}

export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked (e.g. private mode); the page still works without it.
  }
}
