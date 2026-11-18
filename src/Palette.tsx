import type { CSSProperties, ReactNode } from "react";
import type { Formula } from "./formulas.ts";

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

export type Step = (typeof STEPS)[number];

type PaletteProps = {
  name: string;
  /** CSS color for each step, e.g. a token or a ramp.css variable. */
  color: (step: Step) => string;
  /** Extra controls shown next to the title. */
  aside?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function Palette({ name, color, aside, className, style }: PaletteProps) {
  const titleId = `palette-${name}-${className ?? "static"}`;

  return (
    <section
      className={className ? `palette ${className}` : "palette"}
      aria-labelledby={titleId}
      style={style}
    >
      <header className="palette__header">
        <h3 className="palette__title" id={titleId}>
          {name}
        </h3>
        {aside}
      </header>
      <ul className="palette__steps">
        {STEPS.map((step) => (
          <li
            key={step}
            className="swatch"
            title={`${name}-${step}`}
            style={{ "--swatch": color(step) } as CSSProperties}
          >
            {step}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A palette computed live by one ramp.css formula from a single 500 key color. */
export function LivePalette({
  name,
  keyColor,
  formula,
  aside,
}: {
  name: string;
  keyColor: string;
  formula: Formula;
  aside?: ReactNode;
}) {
  return (
    <Palette
      name={name}
      className={`ramp ramp--${formula}`}
      style={{ "--ramp-key": keyColor } as CSSProperties}
      color={(step) => `var(--ramp-${step})`}
      aside={aside}
    />
  );
}
