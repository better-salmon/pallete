import { useState, type ReactNode } from "react";
import { FORMULA_KEY_LIGHTNESS, FORMULAS, LIGHTNESS_TOLERANCE, type Formula } from "./formulas.ts";
import { oklabLightness } from "./oklch.ts";
import { LivePalette, Palette } from "./Palette.tsx";

/** Scales with hand-picked Figma tokens in tokens.css; each has its own formula. */
const FIGMA_SCALES: Formula[] = ["neutral", "accent", "brand"];

type Generated = { key: string; formula: Formula };

/** Starting keys and formulas for the generated scales; both can be changed. */
const DEFAULT_GENERATED: Record<string, Generated> = {
  blue: { key: "#3d8fe4", formula: "accent" },
  green: { key: "#45b164", formula: "accent" },
  violet: { key: "#9572e7", formula: "accent" },
};

export function App() {
  const [generated, setGenerated] = useState(DEFAULT_GENERATED);

  const update = (scale: string, patch: Partial<Generated>) =>
    setGenerated((prev) => ({ ...prev, [scale]: { ...prev[scale], ...patch } }));

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
        {Object.entries(generated).map(([scale, { key, formula }]) => (
          <LivePalette
            key={scale}
            name={scale}
            keyColor={key}
            formula={formula}
            aside={
              <KeyPicker
                scale={scale}
                value={key}
                formula={formula}
                onKeyChange={(next) => update(scale, { key: next })}
                onFormulaChange={(next) => update(scale, { formula: next })}
              />
            }
          />
        ))}
      </Group>
    </main>
  );
}

type GroupProps = {
  kind: "static" | "live";
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

type KeyPickerProps = {
  scale: string;
  value: string;
  formula: Formula;
  onKeyChange: (hex: string) => void;
  onFormulaChange: (formula: Formula) => void;
};

function KeyPicker({ scale, value, formula, onKeyChange, onFormulaChange }: KeyPickerProps) {
  const lightness = oklabLightness(value);
  const fitted = FORMULA_KEY_LIGHTNESS[formula];
  const near = Math.abs(lightness - fitted) <= LIGHTNESS_TOLERANCE;

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
      <span
        className={near ? "key-picker__range" : "key-picker__range key-picker__range--out"}
        title={`The ${formula} formula was fitted on a key with OKLCH L ${fitted}`}
      >
        L {lightness.toFixed(2)} · fitted on {fitted.toFixed(2)}
      </span>
    </div>
  );
}
