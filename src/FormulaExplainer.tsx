import { useMemo, useState, type CSSProperties } from "react";
import {
  DARK_SHADES,
  FORMULAS,
  LADDER_500_LIGHTNESS,
  LADDER_ENDS,
  PERCEPTUAL_LADDER,
  KEY_PRESETS as PRESETS,
  type Formula,
} from "./formulas.ts";
import {
  hexToSrgb,
  maxChroma,
  oklchToSrgb,
  srgbToHex,
  srgbToLinear,
  srgbToOklch,
  type Oklch,
  type Srgb,
} from "./oklch.ts";
import { STEPS, type Step } from "./Palette.tsx";
import { sampleRamp, type Sample } from "./rampSampler.ts";
import { Staircase } from "./Staircase.tsx";

/** Mix endpoints used by ramp.css; repeated here only to draw the guides. */
const ACCENT_INK = "#16171e";
const NEUTRAL_INK = "#0d0a06";

/** Fourier terms [amplitude, phase°] of bold's --bold-cap; repeated here only to draw the guide. */
const BOLD_WHITE_CONE = {
  mean: -0.3541,
  terms: [
    [0.6467, 133.5],
    [0.3525, 292.7],
    [0.1405, 291.2],
    [0.0521, 93.1],
    [0.1094, 211.2],
    [0.0156, 65.7],
  ],
};
const BOLD_BLACK_CONE = {
  mean: 0.2994,
  terms: [
    [0.139, 327.4],
    [0.0731, 262.6],
    [0.0431, 99.1],
    [0.0182, 87.3],
    [0.0098, 322.8],
    [0.0196, 156.4],
  ],
};

const fourier = ({ mean, terms }: { mean: number; terms: number[][] }, h: number) =>
  terms.reduce(
    (sum, [a, phase], i) => sum + a * Math.cos((((i + 1) * h - phase) * Math.PI) / 180),
    mean,
  );

/** bold's estimate of the largest chroma sRGB can show at this lightness and hue. */
const boldCap = (l: number, h: number) =>
  Math.min(
    Math.exp(fourier(BOLD_WHITE_CONE, h)) * (1 - l) * (2 - l),
    fourier(BOLD_BLACK_CONE, h) * l,
  );

const CAPTIONS: Record<Formula, string> = {
  vivid:
    "perceptual-v2's key and pinned ends, with chroma pushed off v2's straight lines (the thin tent) toward the outer lines: the room this key has in sRGB. Tints go up to half-way there and ease toward white; shades take all of it by 800. Hue drifts too, which this plane cannot show: compare the yellow and blue strips.",
  "vivid-dark":
    "vivid for a dark UI: the same key, tints and roof (the outer line above the key), but the shades are rebuilt as dark-mode surfaces. 700, 800 and 900 are pinned at L 0.27, 0.22 and 0.18 for every key and sit on v2's straight line to black, with none of vivid's extra chroma; 600 is halfway from the key to 700. In dark mode those three are page, card and fill; 50–300 become text.",
  bold: "perceptual-v2's frame — key kept, ends pinned at 0.97 and 0.25 — with chroma that bows out past the straight lines (the thin tent) toward the dashed curve, bold's own estimate of the sRGB edge at the key's hue. It stays between 85% and 2× of the straight-line chroma, so where the estimate is too cautious the dots sit just past the dashed curve. Hue turns too: toward yellow-green as steps lighten, away as they darken, so shades deepen instead of greying.",
  accent:
    "Two straight mixes in sRGB: tints slide toward white, shades toward the ink #16171e. A straight line in sRGB bends in OKLCH, so the dots trace curves.",
  neutral:
    "Tints are OKLCH shifts that lift lightness but keep most of the chroma — compare them with the thin line, where a plain white mix would put them. Shades mix toward the warm black #0d0a06.",
  brand:
    "Every step is its own fixed offset from the key (the spokes): a lightness shift and a chroma factor. With brand's own key, 300 keeps the key's full chroma and 400 gets more (× 1.26), which no mix toward white can do; with brighter keys those steps run past sRGB and the browser clips them onto the gamut edge.",
  perceptual:
    "Lightness comes from a fixed ladder (the horizontal lines) shared by every key. The key's own lightness is dropped: its 500 moves to 0.57 (the arrow). Chroma follows the straight lines from white through the 500 to black.",
  "perceptual-v2":
    "The key stays where it is. Tints are spaced evenly from the key up to 0.97 and shades down to 0.25, the two pinned ends every palette shares. Chroma follows the straight lines through the key.",
};

export function FormulaExplainer() {
  // The picked key, and an optional lightness override from the slider. The slider keeps
  // the picked key's hue and chroma, reducing chroma only where sRGB cannot show it.
  const [baseHex, setBaseHex] = useState(PRESETS[0].hex);
  const [lightness, setLightness] = useState<number | null>(null);
  const base = srgbToOklch(hexToSrgb(baseHex));
  const hue = Number.isFinite(base.h) ? base.h : 0;
  const fitChroma = lightness === null ? base.c : Math.min(base.c, maxChroma(lightness, hue));
  const keyHex =
    lightness === null ? baseHex : srgbToHex(oklchToSrgb({ l: lightness, c: fitChroma, h: hue }));
  const key = srgbToOklch(hexToSrgb(keyHex));
  const chromaReduced = base.c - fitChroma > 0.002;

  const pickBase = (hex: string) => {
    setBaseHex(hex);
    setLightness(null);
  };

  // One chroma scale for every panel, wide enough for the most saturated step any
  // formula asks for (brand 400 is the key × 1.264), even where sRGB cannot show it.
  const gamut = useMemo(
    () => Array.from({ length: 101 }, (_, i) => ({ l: i / 100, c: maxChroma(i / 100, hue) })),
    [hue],
  );
  const cmax = Math.min(0.4, Math.max(0.05, key.c * 1.45));

  return (
    <div className="explainer">
      <div className="explainer__controls">
        <label className="key-picker__control">
          <input
            type="color"
            value={keyHex}
            aria-label="Key color for every formula below"
            onChange={(event) => pickBase(event.target.value)}
          />
          <code>{keyHex}</code>
        </label>
        <div className="explainer__presets" role="group" aria-label="Preset keys">
          {PRESETS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              className="explainer__preset"
              aria-pressed={preset.hex === keyHex}
              onClick={() => pickBase(preset.hex)}
            >
              <span className="explainer__preset-dot" style={{ background: preset.hex }} />
              {preset.label}
            </button>
          ))}
        </div>
        <span className="explainer__note">
          Key L {key.l.toFixed(2)} · C {key.c.toFixed(3)} · h {hue.toFixed(0)}°
        </span>
      </div>

      <div className="explainer__slider">
        <label htmlFor="key-lightness">Key lightness</label>
        <input
          id="key-lightness"
          type="range"
          min="0.2"
          max="0.98"
          step="0.005"
          list="key-lightness-marks"
          value={key.l}
          onChange={(event) => setLightness(Number(event.target.value))}
        />
        <datalist id="key-lightness-marks">
          <option value={LADDER_500_LIGHTNESS} label="0.57" />
        </datalist>
        <output htmlFor="key-lightness">{key.l.toFixed(2)}</output>
        <span className="explainer__note">
          Moves the key lighter or darker, keeping its hue and chroma.
          {chromaReduced && " Chroma reduced to fit sRGB at this lightness."} At{" "}
          <button
            type="button"
            className="explainer__link"
            onClick={() => setLightness(LADDER_500_LIGHTNESS)}
          >
            L 0.57
          </button>{" "}
          perceptual and perceptual-v2 make the same ramp, to rounding.
        </span>
        {lightness !== null && (
          <button type="button" className="explainer__link" onClick={() => setLightness(null)}>
            Reset to {baseHex}
          </button>
        )}
      </div>

      <div className="explainer__grid">
        {FORMULAS.map((formula) => (
          <Panel
            key={formula}
            formula={formula}
            keyHex={keyHex}
            keyColor={key}
            gamut={gamut}
            cmax={cmax}
          />
        ))}
      </div>

      <Staircase keyHex={keyHex} />
    </div>
  );
}

type PanelProps = {
  formula: Formula;
  keyHex: string;
  keyColor: Oklch;
  gamut: { l: number; c: number }[];
  cmax: number;
};

function Panel({ formula, keyHex, keyColor, gamut, cmax }: PanelProps) {
  // Read the colors ramp.css actually produces, so the plot can never drift from the CSS.
  const samples = useMemo(() => sampleRamp(keyHex, formula), [keyHex, formula]);

  const titleId = `explainer-${formula}`;

  return (
    <article className="explainer__panel" aria-labelledby={titleId}>
      <h3 className="explainer__title" id={titleId}>
        {formula}
      </h3>
      <p className="explainer__caption">{CAPTIONS[formula]}</p>
      <Plot
        formula={formula}
        keyHex={keyHex}
        samples={samples}
        keyColor={keyColor}
        gamut={gamut}
        cmax={cmax}
      />
      <ul
        className={`explainer__strip ramp ramp--${formula}`}
        style={{ "--ramp-key": keyHex } as CSSProperties}
        aria-label={`${formula} palette`}
      >
        {STEPS.map((step) => (
          <li key={step} style={{ background: `var(--ramp-${step})` }} title={`${step}`} />
        ))}
      </ul>
      <details className="explainer__table">
        <summary>Values</summary>
        <table>
          <thead>
            <tr>
              <th>step</th>
              <th>hex</th>
              <th>L</th>
              <th>C</th>
              <th>asked for</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((s) => (
              <tr key={s.step}>
                <td>{s.step}</td>
                <td>
                  <code>{s.hex}</code>
                </td>
                <td>{s.shown.l.toFixed(3)}</td>
                <td>{s.shown.c.toFixed(3)}</td>
                <td>
                  {s.clipped
                    ? `L ${s.intended.l.toFixed(3)} C ${s.intended.c.toFixed(3)} (clipped)`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </article>
  );
}

const W = 320;
const H = 300;
const M = { left: 40, right: 14, top: 12, bottom: 34 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;
const LABELLED: Step[] = [50, 500, 900];

type PlotProps = {
  formula: Formula;
  keyHex: string;
  samples: Sample[];
  keyColor: Oklch;
  gamut: { l: number; c: number }[];
  cmax: number;
};

function Plot({ formula, keyHex, samples, keyColor, gamut, cmax }: PlotProps) {
  const [active, setActive] = useState<Sample | null>(null);
  const x = (c: number) => M.left + (Math.min(c, cmax) / cmax) * PW;
  const y = (l: number) => M.top + (1 - Math.min(1, Math.max(0, l))) * PH;
  const key = { x: x(keyColor.c), y: y(keyColor.l) };
  const markerId = `arrow-${formula}`;

  const gamutPath =
    `M ${x(0)} ${y(0)} ` +
    gamut.map((p) => `L ${x(p.c)} ${y(p.l)}`).join(" ") +
    ` L ${x(0)} ${y(1)} Z`;

  /** Polyline of a straight sRGB mix from the key toward `toward`, drawn in the OKLCH plane. */
  const srgbMixPath = (toward: string) => {
    const a = hexToSrgb(keyHex);
    const b = hexToSrgb(toward);
    return Array.from({ length: 41 }, (_, i) => {
      const t = i / 40;
      const p = srgbToOklch(a.map((v, k) => v + (b[k] - v) * t) as Srgb);
      return `${i === 0 ? "M" : "L"} ${x(p.c)} ${y(p.l)}`;
    }).join(" ");
  };

  const tent = (apexL: number) =>
    `M ${x(0)} ${y(1)} L ${x(keyColor.c)} ${y(apexL)} L ${x(0)} ${y(0)}`;

  /**
   * vivid's chroma limits, from the two numbers ramp.css reads off the key's linear
   * channels: the roof white → brightest undiluted key → key, and the richest shade line.
   * Drawn unclamped in chroma, so the plot clips them at its right edge.
   */
  const vividLimits = (withShades: boolean) => {
    const [r, g, b] = srgbToLinear(hexToSrgb(keyHex));
    const top = Math.cbrt(Math.max(r, g, b));
    const grey = Math.min(r, g, b) / (0.25 * r + 0.55 * g + 0.2 * b);
    const px = (c: number) => M.left + (c / cmax) * PW;
    const rich = keyColor.c * (1 + Math.min(0.5, Number.isFinite(grey) ? grey : 0));
    const roof = `M ${px(0)} ${y(1)} L ${px(keyColor.c / top)} ${y(keyColor.l / top)} L ${key.x} ${key.y}`;
    return withShades ? `${roof} M ${px(rich)} ${key.y} L ${px(0)} ${y(0)}` : roof;
  };

  const cTicks = [0, cmax / 2, cmax];

  return (
    <div className="plot">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${formula} formula: lightness against chroma for each step`}
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="plot__arrowhead" />
          </marker>
          <clipPath id={`area-${formula}`}>
            <rect x={M.left} y={M.top} width={PW} height={PH} />
          </clipPath>
        </defs>

        <path d={gamutPath} className="plot__gamut" />
        <text x={M.left + 6} y={H - M.bottom - 6} className="plot__note">
          sRGB gamut at key hue
        </text>

        {[0, 0.25, 0.5, 0.75, 1].map((l) => (
          <g key={l}>
            <line x1={M.left} x2={W - M.right} y1={y(l)} y2={y(l)} className="plot__grid" />
            <text x={M.left - 6} y={y(l)} className="plot__tick" textAnchor="end" dy="0.32em">
              {l}
            </text>
          </g>
        ))}
        <line x1={M.left} x2={M.left} y1={M.top} y2={H - M.bottom} className="plot__axis" />
        {cTicks.map((c) => (
          <text key={c} x={x(c)} y={H - M.bottom + 14} className="plot__tick" textAnchor="middle">
            {c === 0 ? "0" : c.toFixed(2)}
          </text>
        ))}
        <text x={W - M.right} y={H - 4} className="plot__axis-title" textAnchor="end">
          chroma →
        </text>
        <text x={M.left - 30} y={M.top - 2} className="plot__axis-title" dy="0.7em">
          L
        </text>

        {/* formula-specific guides */}
        {formula === "accent" && (
          <>
            <path d={srgbMixPath("#ffffff")} className="plot__guide" />
            <path d={srgbMixPath(ACCENT_INK)} className="plot__guide" />
            {/* white sits in the top-left corner; unlabeled so it does not collide with 50 */}
            <Endpoint x={x(0)} y={y(1)} />
            <Endpoint
              x={x(srgbToOklch(hexToSrgb(ACCENT_INK)).c)}
              y={y(srgbToOklch(hexToSrgb(ACCENT_INK)).l)}
              label={ACCENT_INK}
            />
          </>
        )}
        {formula === "neutral" && (
          <>
            <path d={srgbMixPath("#ffffff")} className="plot__guide plot__guide--reference" />
            <path d={srgbMixPath(NEUTRAL_INK)} className="plot__guide" />
            <Endpoint
              x={x(srgbToOklch(hexToSrgb(NEUTRAL_INK)).c)}
              y={y(srgbToOklch(hexToSrgb(NEUTRAL_INK)).l)}
              label={NEUTRAL_INK}
            />
          </>
        )}
        {formula === "brand" &&
          samples
            .filter((s) => s.step !== 500)
            .map((s) => (
              <line
                key={s.step}
                x1={key.x}
                y1={key.y}
                x2={x(s.intended.c)}
                y2={y(s.intended.l)}
                className="plot__guide"
              />
            ))}
        {formula === "perceptual" && (
          <>
            {PERCEPTUAL_LADDER.map((l) => (
              <line
                key={l}
                x1={M.left}
                x2={W - M.right}
                y1={y(l)}
                y2={y(l)}
                className="plot__ladder"
              />
            ))}
            <path d={tent(LADDER_500_LIGHTNESS)} className="plot__guide" />
            {Math.abs(keyColor.l - LADDER_500_LIGHTNESS) > 0.02 && (
              <line
                x1={key.x}
                y1={key.y}
                x2={key.x}
                y2={y(LADDER_500_LIGHTNESS) + (keyColor.l > LADDER_500_LIGHTNESS ? -9 : 9)}
                className="plot__arrow"
                markerEnd={`url(#${markerId})`}
              />
            )}
          </>
        )}
        {(formula === "perceptual-v2" ||
          formula === "vivid" ||
          formula === "vivid-dark" ||
          formula === "bold") && (
          <>
            {(formula === "vivid-dark"
              ? [LADDER_ENDS.top, DARK_SHADES[700], DARK_SHADES[800], DARK_SHADES[900]]
              : [LADDER_ENDS.top, LADDER_ENDS.bottom]
            ).map((l) => (
              <g key={l}>
                <line x1={M.left} x2={W - M.right} y1={y(l)} y2={y(l)} className="plot__ladder" />
                {/* the three dark pins sit too close for a label each */}
                {(l === LADDER_ENDS.top || formula !== "vivid-dark" || l === DARK_SHADES[700]) && (
                  <text x={W - M.right} y={y(l) - 4} className="plot__note" textAnchor="end">
                    {formula === "vivid-dark" && l !== LADDER_ENDS.top
                      ? `pinned ${DARK_SHADES[700]} / ${DARK_SHADES[800]} / ${DARK_SHADES[900]}`
                      : `pinned ${l}`}
                  </text>
                )}
              </g>
            ))}
            {formula === "perceptual-v2" ? (
              <path d={tent(keyColor.l)} className="plot__guide" />
            ) : (
              <>
                <path d={tent(keyColor.l)} className="plot__guide plot__guide--reference" />
                {formula === "vivid" || formula === "vivid-dark" ? (
                  <path
                    d={vividLimits(formula === "vivid")}
                    className="plot__guide"
                    clipPath={`url(#area-${formula})`}
                  />
                ) : (
                  <path
                    d={gamut
                      .filter((p) => p.l >= 0.2 && p.l <= 0.98)
                      .map(
                        (p, i) => `${i === 0 ? "M" : "L"} ${x(boldCap(p.l, keyColor.h))} ${y(p.l)}`,
                      )
                      .join(" ")}
                    className="plot__guide plot__guide--dashed"
                  />
                )}
              </>
            )}
          </>
        )}

        {/* the key: where the picked color really sits */}
        <circle cx={key.x} cy={key.y} r="11" className="plot__key" />
        <text x={key.x + 14} y={key.y - 10} className="plot__note">
          key
        </text>

        {/* where the formula asked to go, when sRGB could not show it */}
        {samples
          .filter((s) => s.clipped)
          .map((s) => (
            <g key={s.step}>
              <line
                x1={x(s.intended.c)}
                y1={y(s.intended.l)}
                x2={x(s.shown.c)}
                y2={y(s.shown.l)}
                className="plot__clip"
              />
              <circle cx={x(s.intended.c)} cy={y(s.intended.l)} r="5" className="plot__intended" />
            </g>
          ))}

        {samples.map((s) => (
          <g key={s.step}>
            <circle
              cx={x(s.shown.c)}
              cy={y(s.shown.l)}
              r={s.step === 500 ? 7 : 5.5}
              fill={s.hex}
              className="plot__dot"
            />
            {LABELLED.includes(s.step) && (
              <text x={x(s.shown.c) + 10} y={y(s.shown.l)} dy="0.32em" className="plot__label">
                {s.step}
              </text>
            )}
          </g>
        ))}

        {/* hit areas bigger than the dots, for hover and keyboard focus */}
        {samples.map((s) => (
          <circle
            key={s.step}
            cx={x(s.shown.c)}
            cy={y(s.shown.l)}
            r="12"
            className="plot__hit"
            tabIndex={0}
            aria-label={`${s.step}: ${s.hex}, L ${s.shown.l.toFixed(2)}, C ${s.shown.c.toFixed(3)}${
              s.clipped ? `, clipped from C ${s.intended.c.toFixed(3)}` : ""
            }`}
            onPointerEnter={() => setActive(s)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(s)}
            onBlur={() => setActive(null)}
          />
        ))}
      </svg>

      {active && (
        <div
          className="plot__tooltip"
          style={{
            left: `${(x(active.shown.c) / W) * 100}%`,
            top: `${(y(active.shown.l) / H) * 100}%`,
          }}
        >
          <strong>{active.hex}</strong>
          <span>
            {active.step} · L {active.shown.l.toFixed(2)} · C {active.shown.c.toFixed(3)}
          </span>
          {active.clipped && (
            <span>
              asked for L {active.intended.l.toFixed(2)} · C {active.intended.c.toFixed(3)} —
              outside sRGB, clipped
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Endpoint({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="4" className="plot__endpoint" />
      {label && (
        <text x={x + 8} y={y} dy="-0.4em" className="plot__note">
          {label}
        </text>
      )}
    </g>
  );
}
