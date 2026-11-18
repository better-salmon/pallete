import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { FORMULAS, type Formula } from "./formulas.ts";
import { STEPS } from "./Palette.tsx";
import { DEFAULT_STATE, loadSavedState, type SavedPalette } from "./savedPalettes.ts";
import {
  Accordion,
  CloseButton,
  Field,
  FloatingButton,
  MenuItem,
  OfferForm,
  PrimaryButton,
  RadioButton,
  SecondaryButton,
  TertiaryButton,
  TextInput,
  TextLink,
  type Forced,
  type InputStatus,
} from "./offers/components.tsx";
import { GLYPH_NAMES, Icon } from "./offers/icons.tsx";
import {
  loadTheme,
  ORIGINAL_THEME,
  resolveTheme,
  ROLE_NOTES,
  ROLES,
  saveTheme,
  themeStyle,
  type Role,
  type RoleSource,
} from "./offers/theme.ts";
import "./offers/offers.css";

const PANEL_KEY = "pallete:components-panel-collapsed";

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(PANEL_KEY) === "1";
  } catch {
    return false;
  }
}

function saveCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(PANEL_KEY, collapsed ? "1" : "0");
  } catch {
    // Only a convenience; the panel just opens expanded next time.
  }
}

export function ComponentsPage() {
  const [theme, setTheme] = useState(loadTheme);
  // The palettes made on the Palettes page, read once when this page opens.
  const [saved] = useState(() => (loadSavedState() ?? DEFAULT_STATE).palettes);
  const [collapsed, setCollapsed] = useState(loadCollapsed);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveCollapsed(collapsed);
  }, [collapsed]);

  const steps = useMemo(() => resolveTheme(theme), [theme]);
  const style = useMemo(() => themeStyle(theme, steps), [theme, steps]);
  const setRole = (role: Role, source: RoleSource) =>
    setTheme((prev) => ({ ...prev, [role]: source }));

  return (
    <main className="sheet">
      <div className={collapsed ? "workbench workbench--collapsed" : "workbench"}>
        <div className="offers specimens" style={style as CSSProperties}>
          <Gallery />
        </div>

        {/* Sticks beside the gallery (floats bottom-right on narrow screens), so
            colors can change while any component is in view. */}
        <aside className="theme-panel" aria-labelledby="theme-title">
          <header className="theme-panel__header">
            <h2 className="theme-panel__title" id="theme-title">
              Palettes
            </h2>
            {!collapsed && (
              <button
                type="button"
                className="sheet-button"
                onClick={() => setTheme(ORIGINAL_THEME)}
                title="Put every role back on its original scale"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              className="sheet-button theme-panel__toggle"
              aria-expanded={!collapsed}
              aria-controls="theme-panel-body"
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? "Show" : "Hide"}
            </button>
          </header>

          {collapsed ? (
            <ul className="theme-panel__minis" aria-label="Current palettes">
              {ROLES.map((role) => (
                <li key={role} title={role}>
                  <span className="theme-panel__mini-name">{role}</span>
                  <Strip role={role} steps={steps[role]} compact />
                </li>
              ))}
            </ul>
          ) : (
            <div className="theme-panel__body" id="theme-panel-body">
              <p className="theme-panel__description">
                Point each role at another original, a palette from the Palettes page, or a custom
                key. Every component follows.
              </p>
              {ROLES.map((role) => (
                <RolePicker
                  key={role}
                  role={role}
                  source={theme[role]}
                  steps={steps[role]}
                  saved={saved}
                  onChange={(source) => setRole(role, source)}
                />
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function Strip({ role, steps, compact }: { role: Role; steps: string[]; compact?: boolean }) {
  return (
    <ul
      className={compact ? "role-picker__strip role-picker__strip--compact" : "role-picker__strip"}
    >
      {steps.map((hex, i) => (
        <li key={STEPS[i]} style={{ background: hex }} title={`${role}-${STEPS[i]} ${hex}`} />
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------ role picker */

const ORIGINAL_PREFIX = "original:";
const SAVED_PREFIX = "saved:";
const CUSTOM = "custom";

function sourceValue(source: RoleSource, saved: SavedPalette[]): string {
  if (source.kind === "original") return ORIGINAL_PREFIX + source.role;
  const index = saved.findIndex(
    (p) => p.name === source.label && p.key === source.key && p.formula === source.formula,
  );
  return index >= 0 ? SAVED_PREFIX + index : CUSTOM;
}

type RolePickerProps = {
  role: Role;
  source: RoleSource;
  steps: string[];
  saved: SavedPalette[];
  onChange: (source: RoleSource) => void;
};

function RolePicker({ role, source, steps, saved, onChange }: RolePickerProps) {
  const value = sourceValue(source, saved);

  const choose = (next: string) => {
    if (next.startsWith(ORIGINAL_PREFIX)) {
      onChange({ kind: "original", role: next.slice(ORIGINAL_PREFIX.length) as Role });
    } else if (next.startsWith(SAVED_PREFIX)) {
      const palette = saved[Number(next.slice(SAVED_PREFIX.length))];
      onChange({ kind: "ramp", key: palette.key, formula: palette.formula, label: palette.name });
    } else if (source.kind === "ramp") {
      onChange({ kind: "ramp", key: source.key, formula: source.formula });
    } else {
      // Start the custom key from the 500 the role shows now.
      onChange({ kind: "ramp", key: steps[5], formula: "vivid" });
    }
  };

  return (
    <section className="role-picker" aria-label={`${role} palette`}>
      <header className="role-picker__header">
        <h3 className="role-picker__name">{role}</h3>
        <span className="role-picker__note">{ROLE_NOTES[role]}</span>
      </header>
      <div className="key-picker">
        <select
          className="key-picker__formula"
          value={value}
          aria-label={`Palette for ${role}`}
          onChange={(event) => choose(event.target.value)}
        >
          <optgroup label="Originals">
            {ROLES.map((r) => (
              <option key={r} value={ORIGINAL_PREFIX + r}>
                {r === role ? `${r} (original)` : r}
              </option>
            ))}
          </optgroup>
          {saved.length > 0 && (
            <optgroup label="Your palettes">
              {saved.map((p, i) => (
                <option key={i} value={SAVED_PREFIX + i}>
                  {p.name.trim() || "untitled"} · {p.formula}
                </option>
              ))}
            </optgroup>
          )}
          <option value={CUSTOM}>Custom key…</option>
        </select>
        {source.kind === "ramp" && (
          <>
            <label className="key-picker__control">
              <input
                type="color"
                value={source.key}
                aria-label={`${role} 500 key color`}
                onChange={(event) =>
                  onChange({ kind: "ramp", key: event.target.value, formula: source.formula })
                }
              />
              <code>{source.key}</code>
            </label>
            <select
              className="key-picker__formula"
              value={source.formula}
              aria-label={`${role} formula`}
              onChange={(event) =>
                onChange({
                  kind: "ramp",
                  key: source.key,
                  formula: event.target.value as Formula,
                })
              }
            >
              {FORMULAS.map((formula) => (
                <option key={formula} value={formula}>
                  {formula} formula
                </option>
              ))}
            </select>
          </>
        )}
      </div>
      <Strip role={role} steps={steps} />
    </section>
  );
}

/* ---------------------------------------------------------------- gallery */

function Specimen({
  title,
  note,
  surface = "white",
  children,
}: {
  title: string;
  note?: string;
  surface?: "white" | "neutral";
  children: ReactNode;
}) {
  return (
    <section className="specimen">
      <header className="specimen__header">
        <h2 className="specimen__title">{title}</h2>
        {note && <p className="specimen__note">{note}</p>}
      </header>
      <div className={`specimen__stage specimen__stage--${surface}`}>{children}</div>
    </section>
  );
}

/** A table of states: one column per variant, one row per state. */
function StateGrid<R extends string, C extends string>({
  rows,
  columns,
  render,
}: {
  rows: readonly R[];
  columns: readonly C[];
  render: (row: R, column: C) => ReactNode;
}) {
  return (
    <div
      className="state-grid"
      style={{ gridTemplateColumns: `max-content repeat(${columns.length}, max-content)` }}
    >
      <span />
      {columns.map((column) => (
        <span key={column} className="state-grid__label state-grid__label--column">
          {column}
        </span>
      ))}
      {rows.map((row) => (
        <div key={row} className="state-grid__row">
          <span className="state-grid__label">{row}</span>
          {columns.map((column) => (
            <div key={column} className="state-grid__cell">
              {render(row, column)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** A labelled list of states, for components with a single variant axis. */
function StateList<S extends string>({
  states,
  render,
  wide,
}: {
  states: readonly S[];
  render: (state: S) => ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "state-list state-list--wide" : "state-list"}>
      {states.map((state) => (
        <div key={state} className="state-list__item">
          <span className="state-grid__label">{state}</span>
          {render(state)}
        </div>
      ))}
    </div>
  );
}

/** Gallery links point back at this page and don't navigate. */
const DEMO_HREF = "#/components";
const stay = (event: { preventDefault: () => void }) => event.preventDefault();

const BUTTON_STATES = ["Default", "Hover", "Focus", "Disabled"] as const;
type ButtonState = (typeof BUTTON_STATES)[number];

const forcedFor = (state: string): Forced | undefined =>
  state === "Hover"
    ? "hover"
    : state === "Focus"
      ? "focus"
      : state === "Pressed"
        ? "pressed"
        : undefined;

const buttonProps = (state: ButtonState) => ({
  force: forcedFor(state),
  disabled: state === "Disabled",
});

const SIZES = { Small: "small", Medium: "medium", Large: "large" } as const;

const INPUT_STATES = ["Default", "Hover", "Focus", "Invalid", "Disabled", "Success"] as const;
type InputState = (typeof INPUT_STATES)[number];

const inputProps = (state: InputState) => ({
  force:
    state === "Hover" ? ("hover" as const) : state === "Focus" ? ("focus" as const) : undefined,
  status: (state === "Invalid" ? "invalid" : state === "Success" ? "success" : undefined) as
    | InputStatus
    | undefined,
  disabled: state === "Disabled",
});

function LiveField(props: {
  initial: string;
  size: "medium" | "large";
  force?: "hover" | "focus";
}) {
  const [value, setValue] = useState(props.initial);
  return <Field value={value} onChange={setValue} size={props.size} force={props.force} />;
}

function Gallery() {
  return (
    <>
      <Specimen title="Primary button">
        <StateGrid
          rows={BUTTON_STATES}
          columns={["Medium", "Large"] as const}
          render={(state, size) => (
            <PrimaryButton size={SIZES[size]} {...buttonProps(state)}>
              Check my offers
            </PrimaryButton>
          )}
        />
      </Specimen>

      <Specimen title="Secondary button">
        <StateGrid
          rows={BUTTON_STATES}
          columns={["Medium", "Large"] as const}
          render={(state, size) => (
            <SecondaryButton size={SIZES[size]} {...buttonProps(state)}>
              Button
            </SecondaryButton>
          )}
        />
      </Specimen>

      <Specimen title="Tertiary button" note="Icons are optional on either side.">
        <StateGrid
          rows={[...BUTTON_STATES, "With icons"] as const}
          columns={["Large", "Medium", "Small"] as const}
          render={(state, size) =>
            state === "With icons" ? (
              <TertiaryButton
                size={SIZES[size]}
                iconLeft={<Icon name="arrow-left" />}
                iconRight={<Icon name="arrow-right" />}
              >
                Button
              </TertiaryButton>
            ) : (
              <TertiaryButton size={SIZES[size]} {...buttonProps(state)}>
                Button
              </TertiaryButton>
            )
          }
        />
      </Specimen>

      <Specimen title="Radio button" note="Amount chips; the check badge is optional.">
        <StateGrid
          rows={["Default", "Disabled", "Selected", "Selected no mark"] as const}
          columns={["Medium", "Large"] as const}
          render={(state, size) => (
            <RadioButton
              name={`radio-${state}-${size}`}
              value="200"
              size={size === "Large" ? "large" : "medium"}
              checked={state.startsWith("Selected")}
              mark={state === "Selected"}
              disabled={state === "Disabled"}
            >
              $ 200
            </RadioButton>
          )}
        />
      </Specimen>

      <Specimen
        title="Field"
        note="Amount input. Type to edit; an empty medium field shows its limit on hover and focus."
      >
        <StateGrid
          rows={["Default", "Hover", "Focus"] as const}
          columns={
            ["Medium · Filled", "Medium · Empty", "Large · Filled", "Large · Empty"] as const
          }
          render={(state, column) => (
            <LiveField
              initial={column.endsWith("Filled") ? "1000" : ""}
              size={column.startsWith("Large") ? "large" : "medium"}
              force={state === "Hover" ? "hover" : state === "Focus" ? "focus" : undefined}
            />
          )}
        />
      </Specimen>

      <Specimen title="Input">
        <StateList
          states={INPUT_STATES}
          render={(state) => (
            <TextInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              help="Please enter a valid email address"
              {...inputProps(state)}
            />
          )}
        />
      </Specimen>

      <Specimen
        title="Textarea"
        note="Same label, states and help as the input; the box is 100px tall."
      >
        <StateList
          states={INPUT_STATES}
          render={(state) => (
            <TextInput
              multiline
              label="Message"
              placeholder="Tell us what you think…"
              help="Up to 1000 characters"
              {...inputProps(state)}
            />
          )}
        />
      </Specimen>

      <Specimen
        title="Accordion"
        note="Click a row to toggle it. Hover is drawn the same as default."
        surface="neutral"
      >
        <StateList
          wide
          states={["Collapsed", "Expanded", "Collapsed · Hover", "Expanded · Hover"] as const}
          render={(state) => (
            <Accordion
              question="Question"
              answer="Answer"
              defaultOpen={state.startsWith("Expanded")}
              force={state.endsWith("Hover") ? "hover" : undefined}
            />
          )}
        />
      </Specimen>

      <div className="specimen-row">
        <Specimen title="Menu item" note="Hover is drawn the same as default.">
          <StateList
            states={["Default", "Hover", "Focus"] as const}
            render={(state) => (
              <MenuItem
                href={DEMO_HREF}
                onClick={stay}
                force={state === "Default" ? undefined : (forcedFor(state) as "hover" | "focus")}
              >
                Menu item
              </MenuItem>
            )}
          />
        </Specimen>

        <Specimen title="Link">
          <StateList
            states={["Default", "Hover", "Focus"] as const}
            render={(state) => (
              <TextLink
                href={DEMO_HREF}
                onClick={stay}
                force={state === "Default" ? undefined : (forcedFor(state) as "hover" | "focus")}
              >
                Link
              </TextLink>
            )}
          />
        </Specimen>

        <Specimen title="Floating button">
          <StateList
            states={["Default", "Hover", "Pressed", "Focus"] as const}
            render={(state) => <FloatingButton force={forcedFor(state)} />}
          />
        </Specimen>

        <Specimen title="Close button">
          <StateList
            states={["Default", "Hover", "Focus", "Pressed"] as const}
            render={(state) => <CloseButton force={forcedFor(state)} />}
          />
        </Specimen>

        <Specimen title="Icons" note="24×24; the stroke stays 2px at 16 and 20.">
          <StateList
            states={GLYPH_NAMES}
            render={(name) => <Icon name={name} className="specimen__icon" />}
          />
        </Specimen>
      </div>

      <Specimen
        title="Offer form"
        note="Built from the field, radio and primary button. Pick an amount or type one."
      >
        <StateList
          states={
            [
              "Mobile · No background",
              "Mobile · Background",
              "Desktop · No background",
              "Desktop · Background",
            ] as const
          }
          render={(state) => (
            <div className={state.endsWith(" Background") ? "surface surface--neutral" : "surface"}>
              <OfferForm
                termsHref={DEMO_HREF}
                privacyHref={DEMO_HREF}
                breakpoint={state.startsWith("Mobile") ? "mobile" : "desktop"}
                background={state.endsWith(" Background")}
              />
            </div>
          )}
        />
      </Specimen>
    </>
  );
}
