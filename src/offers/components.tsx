/*
 * Offers components. Every color comes from the six role scales
 * (--neutral-*, --accent-*, --brand-*, --alert-*, --warning-*, --success-*)
 * through offers.css, so swapping a role's palette restyles all of them.
 *
 * Interactive states come from the real pseudo-classes. `force` pins a
 * state for the gallery (it sets data-state, which the CSS treats like
 * :hover / :focus-visible / :active).
 */
import { useId, useState, type MouseEvent, type ReactNode } from "react";
import { CheckBadge, ClockIcon, CloseGlyph, FeedbackIcon } from "./icons.tsx";

export type Forced = "hover" | "focus" | "pressed";

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ buttons */

type ButtonProps = {
  children: ReactNode;
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  force?: Forced;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  onClick?: () => void;
};

function makeButton(variant: "primary" | "secondary" | "tertiary") {
  return function Button({
    children,
    size = "medium",
    disabled,
    force,
    iconLeft,
    iconRight,
    fullWidth,
    onClick,
  }: ButtonProps) {
    return (
      <button
        type="button"
        className={cx("o-btn", `o-btn--${variant}`, `o-btn--${size}`, fullWidth && "o-btn--full")}
        data-state={force}
        disabled={disabled}
        onClick={onClick}
      >
        {iconLeft && <span className="o-btn__icon">{iconLeft}</span>}
        <span className="o-btn__label">{children}</span>
        {iconRight && <span className="o-btn__icon">{iconRight}</span>}
      </button>
    );
  };
}

/** Accent call to action. Sizes: medium 48, large 64. */
export const PrimaryButton = makeButton("primary");
/** Brand-filled button. Sizes: medium 48, large 64. */
export const SecondaryButton = makeButton("secondary");
/** Outlined button with optional icons. Sizes: small 44, medium 48, large 64. */
export const TertiaryButton = makeButton("tertiary");

/** Round feedback button, 48×48, meant for the bottom-right corner. */
export function FloatingButton({
  force,
  label = "Send feedback",
  onClick,
}: {
  force?: Forced;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="o-fab" data-state={force} aria-label={label} onClick={onClick}>
      <FeedbackIcon />
    </button>
  );
}

/** 24×24 close cross for dialogs. */
export function CloseButton({
  force,
  label = "Close",
  onClick,
}: {
  force?: Forced;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="o-close"
      data-state={force}
      aria-label={label}
      onClick={onClick}
    >
      <CloseGlyph className="o-close__glyph" />
    </button>
  );
}

/* --------------------------------------------------------------- selection */

type RadioButtonProps = {
  children: ReactNode;
  name: string;
  value: string;
  checked?: boolean;
  disabled?: boolean;
  /** Show the check badge on the selected button (false = "Selected no mark"). */
  mark?: boolean;
  size?: "medium" | "large";
  fill?: boolean;
  onSelect?: (value: string) => void;
};

/** Amount chip that behaves as a radio input. */
export function RadioButton({
  children,
  name,
  value,
  checked = false,
  disabled,
  mark = true,
  size = "medium",
  fill,
  onSelect,
}: RadioButtonProps) {
  return (
    <label className={cx("o-radio", `o-radio--${size}`, fill && "o-radio--fill")}>
      <input
        type="radio"
        className="o-radio__input"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect?.(value)}
      />
      <span className="o-radio__label">{children}</span>
      {checked && mark && <CheckBadge className="o-radio__badge" />}
    </label>
  );
}

/* ------------------------------------------------------------------- fields */

type FieldProps = {
  value: string;
  onChange?: (value: string) => void;
  size?: "medium" | "large";
  force?: Exclude<Forced, "pressed">;
  /** Shown above an empty medium field on hover and focus. */
  hint?: string;
  /** Greyed digits in an empty large field. */
  placeholder?: string;
  fullWidth?: boolean;
  label?: string;
};

/** Dollar amount field: "$" prefix, serif digits, accent caret. */
export function Field({
  value,
  onChange,
  size = "medium",
  force,
  hint = "Up to $ 5000",
  placeholder = "1000",
  fullWidth,
  label = "Amount in dollars",
}: FieldProps) {
  const empty = value === "";
  return (
    <label
      className={cx(
        "o-field",
        `o-field--${size}`,
        empty && "o-field--empty",
        fullWidth && "o-field--full",
      )}
      data-state={force}
    >
      <span className="o-field__prefix" aria-hidden="true">
        $
      </span>
      <input
        className="o-field__input"
        inputMode="numeric"
        aria-label={label}
        value={value}
        placeholder={size === "large" ? placeholder : ""}
        onChange={(event) => onChange?.(event.target.value.replace(/\D/g, ""))}
      />
      {/* drawn caret for the pinned focus state; a live focus shows the real one */}
      <span className="o-field__caret" aria-hidden="true" />
      {size === "medium" && empty && hint && (
        <span className="o-field__hint" aria-hidden="true">
          {hint}
        </span>
      )}
    </label>
  );
}

export type InputStatus = "invalid" | "success";

type TextInputProps = {
  label: string;
  placeholder?: string;
  help?: string;
  status?: InputStatus;
  disabled?: boolean;
  force?: Exclude<Forced, "pressed">;
  multiline?: boolean;
  /** Input type for the single-line control. */
  type?: "text" | "email" | "tel" | "url" | "password" | "search";
  defaultValue?: string;
};

/** Labelled text input (InputRegular) or textarea (TextareaRegular) with help text. */
export function TextInput({
  label,
  placeholder,
  help,
  status,
  disabled,
  force,
  multiline,
  type = "text",
  defaultValue,
}: TextInputProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const control = {
    id,
    className: "o-input__control",
    placeholder,
    disabled,
    defaultValue,
    "aria-invalid": status === "invalid" || undefined,
    "aria-describedby": help ? helpId : undefined,
  };

  return (
    <div
      className={cx(
        "o-input",
        multiline && "o-input--multiline",
        status && `o-input--${status}`,
        disabled && "o-input--disabled",
      )}
      data-state={force}
    >
      <label className="o-input__label" htmlFor={id}>
        {label}
      </label>
      <div className="o-input__box">
        <span className="o-input__caret" aria-hidden="true" />
        {multiline ? <textarea {...control} /> : <input type={type} {...control} />}
      </div>
      {help && (
        <p className="o-input__help" id={helpId}>
          {help}
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- navigation */

type LinkProps = {
  children: ReactNode;
  href: string;
  force?: Exclude<Forced, "pressed">;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

/** Plain navigation entry; focus draws a tight 2px ring. */
export function MenuItem({ children, href, force, onClick }: LinkProps) {
  return (
    <a className="o-menu-item" href={href} data-state={force} onClick={onClick}>
      {children}
    </a>
  );
}

/** Inline text link with a border-bottom underline. */
export function TextLink({ children, href, force, onClick }: LinkProps) {
  return (
    <a className="o-link" href={href} data-state={force} onClick={onClick}>
      {children}
    </a>
  );
}

/* ---------------------------------------------------------------- accordion */

type AccordionProps = {
  question: ReactNode;
  answer: ReactNode;
  defaultOpen?: boolean;
  force?: "hover";
};

export function Accordion({ question, answer, defaultOpen = false, force }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className={cx("o-accordion", open && "o-accordion--open")} data-state={force}>
      <button
        type="button"
        className="o-accordion__header"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="o-accordion__question">{question}</span>
        <span className="o-accordion__sign" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      <div className="o-accordion__answer" id={id} hidden={!open}>
        {answer}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- offer form */

const AMOUNTS = ["200", "1000", "2000", "3000"];

type OfferFormProps = {
  breakpoint: "mobile" | "desktop";
  background?: boolean;
  termsHref?: string;
  privacyHref?: string;
};

/** "How much do you need?" — amount field, preset chips, submit and terms. */
export function OfferForm({
  breakpoint,
  background = false,
  termsHref = "#terms-of-use",
  privacyHref = "#privacy-policy",
}: OfferFormProps) {
  const [amount, setAmount] = useState("1000");
  const name = useId();
  const size = breakpoint === "desktop" ? "large" : "medium";

  return (
    <form
      className={cx("o-offer", `o-offer--${breakpoint}`, background && "o-offer--card")}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="o-offer__ask">
        <h3 className="o-offer__title">How much do you need?</h3>
        <Field value={amount} onChange={setAmount} size={size} fullWidth hint="" />
        <div className="o-offer__amounts" role="radiogroup" aria-label="Suggested amounts">
          {AMOUNTS.map((value) => (
            <RadioButton
              key={value}
              name={name}
              value={value}
              size={size}
              checked={amount === value}
              mark={false}
              fill
              onSelect={setAmount}
            >
              $ {value}
            </RadioButton>
          ))}
        </div>
      </div>
      <div className="o-offer__submit">
        <div className="o-offer__cta">
          <PrimaryButton size={size} fullWidth>
            Check my offers
          </PrimaryButton>
          <p className="o-offer__eta">
            <ClockIcon />
            About 2 minutes
          </p>
        </div>
        <div className="o-offer__terms">
          <p>By clicking “Check my offers”, you:</p>
          <ul>
            <li>
              Acknowledge our{" "}
              <a className="o-offer__term" href={termsHref}>
                Terms of Use
              </a>{" "}
              and{" "}
              <a className="o-offer__term" href={privacyHref}>
                Privacy Policy
              </a>{" "}
              (including the Notice at Collection); and
            </li>
            <li>
              Understand that we will use the information we already maintain about you to process
              this request
            </li>
          </ul>
        </div>
      </div>
    </form>
  );
}
