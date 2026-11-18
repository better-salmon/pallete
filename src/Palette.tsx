import type { CSSProperties } from "react";

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

type PaletteProps = {
  scale: string;
};

export function Palette({ scale }: PaletteProps) {
  const titleId = `palette-${scale}`;

  return (
    <section className="palette" aria-labelledby={titleId}>
      <h2 className="palette__title" id={titleId}>
        {scale}
      </h2>
      <ul className="palette__steps">
        {STEPS.map((step) => (
          <li
            key={step}
            className="swatch"
            style={{ "--swatch": `var(--${scale}-${step})` } as CSSProperties}
          />
        ))}
      </ul>
    </section>
  );
}
