import { useEffect, useState, type ReactNode } from "react";
import {
  FORMULA_KEY_LIGHTNESS,
  FORMULAS,
  LADDER_500_LIGHTNESS,
  LADDER_ENDS,
  LIGHTNESS_TOLERANCE,
  type Formula,
} from "./formulas.ts";
import { oklabLightness } from "./oklch.ts";
import { FormulaExplainer } from "./FormulaExplainer.tsx";
import { LivePalette, Palette } from "./Palette.tsx";
import { DEFAULT_STATE, loadSavedState, saveState, type SavedPalette } from "./savedPalettes.ts";

/** Scales with hand-picked Figma tokens in tokens.css; each has its own formula. */
const FIGMA_SCALES: Formula[] = ["neutral", "accent", "brand"];

/** A generated scale. `id` stays fixed so renaming doesn't remount the palette. */
type Generated = SavedPalette & { id: string };

let lastId = 0;
const nextId = () => `scale-${++lastId}`;

const withIds = (palettes: SavedPalette[]): Generated[] =>
  palettes.map((palette) => ({ ...palette, id: nextId() }));

/** The name to show and copy; a blank name falls back to "untitled". */
const displayName = (name: string) => name.trim() || "untitled";

export function App() {
  // Read once on mount: the palettes and global key saved by the last visit, else the defaults.
  const [initial] = useState(() => loadSavedState() ?? DEFAULT_STATE);
  const [generated, setGenerated] = useState(() => withIds(initial.palettes));
  const [globalKey, setGlobalKey] = useState(initial.globalKey);

  useEffect(() => {
    saveState({ globalKey, palettes: generated.map(({ id: _id, ...palette }) => palette) });
  }, [generated, globalKey]);

  const reset = () => {
    setGenerated(withIds(DEFAULT_STATE.palettes));
    setGlobalKey(DEFAULT_STATE.globalKey);
  };

  const update = (id: string, patch: Partial<Generated>) =>
    setGenerated((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  /** Adds a scale named custom-N, starting from the global key and the vivid formula. */
  const addScale = () => {
    const id = nextId();
    setGenerated((prev) => {
      const names = new Set(prev.map((g) => g.name));
      let n = 1;
      while (names.has(`custom-${n}`)) n++;
      return [...prev, { id, name: `custom-${n}`, key: globalKey, formula: "vivid" }];
    });
  };

  const removeScale = (id: string) => setGenerated((prev) => prev.filter((g) => g.id !== id));

  /** Gives every generated scale the same key; each keeps its own formula. */
  const setAllKeys = (key: string) => {
    setGlobalKey(key);
    setGenerated((prev) => prev.map((g) => ({ ...g, key })));
  };

  return (
    <main className="sheet">
      <Group
        kind="static"
        title="Hardcoded"
        description="Hex values copied from the Figma primitives in tokens.css."
      >
        {FIGMA_SCALES.map((scale) => (
          <Palette key={scale} name={scale} color={(step) => `var(--${scale}-${step})`} />
        ))}
      </Group>

      <Group
        kind="live"
        title="Live"
        description="Computed in the browser by ramp.css from a single 500 key."
      >
        {FIGMA_SCALES.map((scale) => (
          <LivePalette
            key={scale}
            name={scale}
            keyColor={`var(--${scale}-500)`}
            formula={scale}
            aside={
              <code className="key-source">
                key = --{scale}-500 · {scale} formula
              </code>
            }
          />
        ))}
        <GlobalKeyPicker
          value={globalKey}
          scales={generated.map((g) => displayName(g.name))}
          onChange={setAllKeys}
        />
        {generated.map(({ id, name, key, formula }) => (
          <LivePalette
            key={id}
            id={id}
            name={displayName(name)}
            editableName={name}
            onRename={(next) => update(id, { name: next })}
            keyColor={key}
            formula={formula}
            aside={
              <KeyPicker
                scale={displayName(name)}
                value={key}
                formula={formula}
                onKeyChange={(next) => update(id, { key: next })}
                onFormulaChange={(next) => update(id, { formula: next })}
                onRemove={() => removeScale(id)}
              />
            }
          />
        ))}
        <div className="palette-actions">
          <button type="button" className="sheet-button add-palette" onClick={addScale}>
            + Add palette
          </button>
          <button
            type="button"
            className="sheet-button"
            title="Restore the default blue, green and violet palettes"
            onClick={reset}
          >
            Reset palettes
          </button>
        </div>
      </Group>

      <Group
        kind="explain"
        title="How it works"
        description="Each formula drawn on the OKLCH lightness–chroma plane at the key's hue. Change the key to see how each one responds."
      >
        <FormulaExplainer />
      </Group>
    </main>
  );
}

type GroupProps = {
  kind: "static" | "live" | "explain";
  title: string;
  description: string;
  children: ReactNode;
};

function Group({ kind, title, description, children }: GroupProps) {
  const titleId = `group-${kind}`;

  return (
    <section className={`group group--${kind}`} aria-labelledby={titleId}>
      <header className="group__header">
        <h2 className="group__title" id={titleId}>
          <span className="group__badge">{title}</span>
        </h2>
        <p className="group__description">{description}</p>
      </header>
      {children}
    </section>
  );
}

type GlobalKeyPickerProps = {
  value: string;
  scales: string[];
  onChange: (hex: string) => void;
};

/** One key for all generated scales; their own pickers still override it afterwards. */
function GlobalKeyPicker({ value, scales, onChange }: GlobalKeyPickerProps) {
  return (
    <div className="key-picker key-picker--global">
      <span className="key-picker__label">Global key</span>
      <label className="key-picker__control">
        <input
          type="color"
          value={value}
          aria-label={`500 key color for ${scales.join(", ")}`}
          onChange={(event) => onChange(event.target.value)}
        />
        <code>{value}</code>
      </label>
      <span className="key-picker__range">
        {scales.length > 0
          ? `sets the 500 key of ${scales.join(", ")} · each keeps its formula`
          : "no palettes to set · add one below"}
      </span>
    </div>
  );
}

type KeyPickerProps = {
  scale: string;
  value: string;
  formula: Formula;
  onKeyChange: (hex: string) => void;
  onFormulaChange: (formula: Formula) => void;
  onRemove: () => void;
};

function KeyPicker({
  scale,
  value,
  formula,
  onKeyChange,
  onFormulaChange,
  onRemove,
}: KeyPickerProps) {
  return (
    <div className="key-picker">
      <label className="key-picker__control">
        <input
          type="color"
          value={value}
          aria-label={`${scale} 500 key color`}
          onChange={(event) => onKeyChange(event.target.value)}
        />
        <code>{value}</code>
      </label>
      <select
        className="key-picker__formula"
        value={formula}
        aria-label={`${scale} formula`}
        onChange={(event) => onFormulaChange(event.target.value as Formula)}
      >
        {FORMULAS.map((option) => (
          <option key={option} value={option}>
            {option} formula
          </option>
        ))}
      </select>
      <LightnessHint value={value} formula={formula} />
      <button
        type="button"
        className="sheet-button"
        aria-label={`Remove ${scale} palette`}
        onClick={onRemove}
      >
        Remove
      </button>
    </div>
  );
}

/** How the key's lightness relates to what the selected formula expects. */
function LightnessHint({ value, formula }: { value: string; formula: Formula }) {
  const lightness = oklabLightness(value).toFixed(2);

  if (formula === "perceptual-v2" || formula === "vivid" || formula === "bold") {
    const { top, bottom } = LADDER_ENDS;
    const inside = oklabLightness(value) > bottom && oklabLightness(value) < top;
    const spacing =
      formula === "perceptual-v2"
        ? `spaces the other steps evenly toward L ${top} and ${bottom}`
        : `eases the tints toward L ${top}, spaces the shades evenly toward ${bottom}, and lets chroma and hue move along the way`;

    return (
      <span
        className={inside ? "key-picker__range" : "key-picker__range key-picker__range--out"}
        title={`${formula} keeps the key exactly at 500 and ${spacing}`}
      >
        L {lightness} · key kept · ends {top} / {bottom}
        {inside ? "" : " · outside, steps fall out of order"}
      </span>
    );
  }

  if (formula === "perceptual") {
    return (
      <span
        className="key-picker__range"
        title="The perceptual formula keeps only the key's hue and chroma; every 500 sits at the same ladder lightness"
      >
        L {lightness} → ladder {LADDER_500_LIGHTNESS.toFixed(2)}
      </span>
    );
  }

  const fitted = FORMULA_KEY_LIGHTNESS[formula];
  const near = Math.abs(oklabLightness(value) - fitted) <= LIGHTNESS_TOLERANCE;

  return (
    <span
      className={near ? "key-picker__range" : "key-picker__range key-picker__range--out"}
      title={`The ${formula} formula was fitted on a key with OKLCH L ${fitted}`}
    >
      L {lightness} · fitted on {fitted.toFixed(2)}
    </span>
  );
}
