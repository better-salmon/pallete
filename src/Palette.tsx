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
  /** Unique id for the heading; defaults to the name. */
  id?: string;
  /** Raw text of an editable name; with `onRename`, the title becomes a text field. */
  editableName?: string;
  onRename?: (name: string) => void;
  /** CSS color for each step, e.g. a token or a ramp.css variable. */
  color: (step: Step) => string;
  /** Extra controls shown next to the title. */
  aside?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function Palette({
  name,
  id,
  editableName,
  onRename,
  color,
  aside,
  className,
  style,
}: PaletteProps) {
  const titleId = `palette-${id ?? name}-${className ?? "static"}`;
  const editable = onRename !== undefined;
  const stepsRef = useRef<HTMLUListElement>(null);

  return (
    <section
      className={className ? `palette ${className}` : "palette"}
      aria-labelledby={editable ? undefined : titleId}
      aria-label={editable ? name : undefined}
      style={style}
    >
      <header className="palette__header">
        <h3 className="palette__title" id={titleId}>
          {editable ? (
            <input
              className="palette__name"
              value={editableName ?? name}
              placeholder="untitled"
              size={Math.max((editableName ?? name).length, 8)}
              spellCheck={false}
              aria-label="Palette name"
              onChange={(event) => onRename(event.target.value)}
            />
          ) : (
            name
          )}
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
      className="sheet-button"
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
  keyColor,
  formula,
  ...rest
}: Pick<PaletteProps, "name" | "id" | "editableName" | "onRename" | "aside"> & {
  keyColor: string;
  formula: Formula;
}) {
  return (
    <Palette
      {...rest}
      className={`ramp ramp--${formula}`}
      style={{ "--ramp-key": keyColor } as CSSProperties}
      color={(step) => `var(--ramp-${step})`}
    />
  );
}
