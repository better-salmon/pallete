/*
 * Light or dark for the whole app: the page chrome (--sheet-* tokens) and the
 * Offers gallery (.offers--dark) both follow it.
 */
export type Mode = "light" | "dark";

const STORAGE_KEY = "pallete:mode";
/** Where the components page kept it before the mode became app-wide. */
const OLD_KEY = "pallete:components-mode";

export function loadMode(): Mode {
  try {
    const value = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(OLD_KEY);
    return value === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function saveMode(mode: Mode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Only a convenience; the app just opens in light mode next time.
  }
}

/** Puts the mode on <html>, where tokens.css and style.css read it. */
export function applyMode(mode: Mode): void {
  document.documentElement.dataset.mode = mode;
}
