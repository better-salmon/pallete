import { useMemo, useState, type PointerEvent } from "react";
import { FORMULAS, KEY_PRESETS, type Formula } from "./formulas.ts";
import { STEPS } from "./Palette.tsx";
import { sampleRamp, type Sample } from "./rampSampler.ts";

type Line = { id: string; label: string; hex: string; current: boolean };

const W = 260;
const H = 260;
const M = { left: 32, right: 10, top: 10, bottom: 24 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;
const x = (i: number) => M.left + (i / (STEPS.length - 1)) * PW;
const y = (l: number) => M.top + (1 - Math.min(1, Math.max(0, l))) * PH;

/**
 * Lightness each formula assigns to every step, one line per key, one small chart per formula. It shows
 * what each formula does with lightness across keys, which no single-key view can.
 */
export function Staircase({ keyHex }: { keyHex: string }) {
  const lines: Line[] = [
    ...KEY_PRESETS.map((p) => ({ id: p.hex, label: p.label, hex: p.hex, current: false })),
    { id: "current", label: `current key ${keyHex}`, hex: keyHex, current: true },
  ];

  const presetSamples = useMemo(
    () =>
      Object.fromEntries(
        FORMULAS.map((f) => [f, KEY_PRESETS.map((p) => sampleRamp(p.hex, f))]),
      ) as Record<Formula, Sample[][]>,
    [],
  );
  const currentSamples = useMemo(
    () =>
      Object.fromEntries(FORMULAS.map((f) => [f, sampleRamp(keyHex, f)])) as Record<
        Formula,
        Sample[]
      >,
    [keyHex],
  );

  return (
    <section className="staircase" aria-labelledby="staircase-title">
      <h3 className="explainer__title" id="staircase-title">
        Lightness by step, across keys
      </h3>
      <p className="explainer__caption staircase__caption">
        One line per key. Under perceptual every key lands on the same line; under perceptual-v2 the
        lines pinch together at 50 and 900 and fan out around each key; the fitted formulas carry
        each key's lightness through the whole ramp.
      </p>

      <ul className="staircase__legend" aria-label="Keys">
        {lines.map((line) => (
          <li key={line.id}>
            <span
              className={line.current ? "staircase__key staircase__key--current" : "staircase__key"}
              style={line.current ? undefined : { background: line.hex }}
            />
            {line.label}
          </li>
        ))}
      </ul>

      <div className="staircase__grid">
        {FORMULAS.map((formula) => (
          <Chart
            key={formula}
            formula={formula}
            lines={lines}
            ramps={[...presetSamples[formula], currentSamples[formula]]}
          />
        ))}
      </div>
    </section>
  );
}

type ChartProps = { formula: Formula; lines: Line[]; ramps: Sample[][] };

function Chart({ formula, lines, ramps }: ChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  // Snap the crosshair to the nearest step, so the reader aims at a step, not a line.
  const onMove = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const px = ((event.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - M.left) / PW) * (STEPS.length - 1));
    setHover(Math.min(STEPS.length - 1, Math.max(0, i)));
  };

  const rows =
    hover === null
      ? []
      : lines.map((line, k) => ({ line, l: ramps[k][hover].intended.l })).sort((a, b) => b.l - a.l);

  return (
    <figure className="staircase__chart">
      <figcaption className="staircase__name">{formula}</figcaption>
      <div className="plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${formula}: lightness of each step for ${lines.length} keys`}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((l) => (
            <g key={l}>
              <line x1={M.left} x2={W - M.right} y1={y(l)} y2={y(l)} className="plot__grid" />
              <text x={M.left - 6} y={y(l)} dy="0.32em" textAnchor="end" className="plot__tick">
                {l}
              </text>
            </g>
          ))}
          {STEPS.map((step, i) =>
            step === 50 || step === 500 || step === 900 ? (
              <text key={step} x={x(i)} y={H - 6} textAnchor="middle" className="plot__tick">
                {step}
              </text>
            ) : null,
          )}

          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={H - M.bottom} className="plot__axis" />
          )}

          {ramps.map((ramp, k) => (
            <polyline
              key={lines[k].id}
              points={ramp.map((s, i) => `${x(i)},${y(s.intended.l)}`).join(" ")}
              className={lines[k].current ? "staircase__line--current" : "staircase__line"}
              style={lines[k].current ? undefined : { stroke: lines[k].hex }}
            />
          ))}
          {ramps[ramps.length - 1].map((s, i) => (
            <circle
              key={s.step}
              cx={x(i)}
              cy={y(s.intended.l)}
              r="4"
              fill={s.hex}
              className="plot__dot"
            />
          ))}

          <rect
            x={M.left - 8}
            y={M.top}
            width={PW + 16}
            height={PH}
            className="plot__hit"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hover !== null && (
          <div
            className="plot__tooltip staircase__tooltip"
            style={{ left: `${(x(hover) / W) * 100}%`, top: "0%" }}
          >
            <strong>{STEPS[hover]}</strong>
            {rows.map(({ line, l }) => (
              <span key={line.id} className="staircase__row">
                <span
                  className={
                    line.current ? "staircase__key staircase__key--current" : "staircase__key"
                  }
                  style={line.current ? undefined : { background: line.hex }}
                />
                <b>L {l.toFixed(2)}</b> {line.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <details className="explainer__table">
        <summary>Values</summary>
        <table>
          <thead>
            <tr>
              <th>key</th>
              {STEPS.map((step) => (
                <th key={step}>{step}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, k) => (
              <tr key={line.id}>
                <td>{line.label}</td>
                {ramps[k].map((s) => (
                  <td key={s.step}>{s.intended.l.toFixed(2)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
