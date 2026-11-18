import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import type { Formula } from "./formulas.ts";
import { cssColorToHex } from "./screenColor.ts";

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
  const stepsRef = useRef<HTMLUListElement>(null);

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
        <CopyJsonButton name={name} stepsRef={stepsRef} />
        {aside}
      </header>
      <ul className="palette__steps" ref={stepsRef}>
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

/** `{ "<name>": { "50": "#rrggbb", …, "900": "#rrggbb" } }`, read from the rendered swatches. */
function paletteJson(name: string, steps: HTMLUListElement): string {
  const swatches = Array.from(steps.children);
  const colors = Object.fromEntries(
    STEPS.map((step, i) => [step, cssColorToHex(getComputedStyle(swatches[i]).backgroundColor)]),
  );
  return JSON.stringify({ [name]: colors }, null, 2);
}

type CopyState = "idle" | "copied" | "failed";

const COPY_LABELS: Record<CopyState, string> = {
  idle: "Copy JSON",
  copied: "Copied",
  failed: "Copy failed",
};

function CopyJsonButton({
  name,
  stepsRef,
}: {
  name: string;
  stepsRef: RefObject<HTMLUListElement | null>;
}) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = (next: CopyState) => {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1500);
  };

  const copy = () => {
    if (!stepsRef.current) return;
    navigator.clipboard.writeText(paletteJson(name, stepsRef.current)).then(
      () => show("copied"),
      () => show("failed"),
    );
  };

  return (
    <button
      type="button"
      className="palette__copy"
      aria-label={`Copy ${name} palette as JSON`}
      title="Copy the 50–900 hex values as JSON"
      onClick={copy}
    >
      <span aria-live="polite">{COPY_LABELS[state]}</span>
    </button>
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
