/*
 * Icons from the Offers design, inlined so they take the palette's colors:
 * every glyph paints with currentColor instead of the fixed hex in the
 * exported SVGs. Path data, viewBoxes and stroke widths are unchanged.
 */
import type { SVGProps } from "react";

type IconProps = { size?: number } & Omit<SVGProps<SVGSVGElement>, "width" | "height">;

/** 24×24 line glyphs. The stroke stays 2px at every size, as in the 16 and 20px exports. */
const GLYPHS = {
  "arrow-right": "M4 12H20M14 18L20 12L14 6",
  "arrow-left": "M20 12H4M10 18L4 12L10 6",
  "chevron-right": "M9 5L16 12L9 19",
  "chevron-left": "M16 5L9 12L16 19",
  check: "M5 13L10 18L19 7",
} as const;

export type GlyphName = keyof typeof GLYPHS;

export const GLYPH_NAMES = Object.keys(GLYPHS) as GlyphName[];

export function Icon({ name, size = 24, ...rest }: IconProps & { name: GlyphName }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path
        d={GLYPHS[name]}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** The close cross. Unlike the line glyphs its stroke scales with it (hover grows it to 27px). */
export function CloseGlyph({ size = 24, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path
        d="M18.75 5.25L5.25 18.75M18.75 18.75L5.25 5.25"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ClockIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path
        d="M14.6663 7.99992C14.6663 11.6818 11.6816 14.6666 7.99967 14.6666C4.31778 14.6666 1.33301 11.6818 1.33301 7.99992C1.33301 4.31802 4.31778 1.33325 7.99967 1.33325C11.6816 1.33325 14.6663 4.31802 14.6663 7.99992Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 4V8L10.6667 9.33333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Speech bubble on the floating feedback button. */
export function FeedbackIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path
        fill="currentColor"
        d="M19.3846 11.8415C19.3846 12.1272 19.2712 12.4011 19.0692 12.6031C18.8672 12.8051 18.5933 12.9186 18.3077 12.9186H9.69231C9.40669 12.9186 9.13277 12.8051 8.93081 12.6031C8.72885 12.4011 8.61538 12.1272 8.61538 11.8415C8.61538 11.5559 8.72885 11.282 8.93081 11.08C9.13277 10.878 9.40669 10.7645 9.69231 10.7645H18.3077C18.5933 10.7645 18.8672 10.878 19.0692 11.08C19.2712 11.282 19.3846 11.5559 19.3846 11.8415ZM16 15.0726L9.69231 15.0726C9.40669 15.0726 9.13277 15.1861 8.93081 15.3881C8.72885 15.5901 8.61538 15.864 8.61538 16.1497C8.61538 16.4353 8.72885 16.7092 8.93081 16.9112C9.13277 17.1132 9.40669 17.2267 9.69231 17.2267L16 17.2267C16.2856 17.2267 16.5595 17.1132 16.7615 16.9112C16.9635 16.7092 17.0769 16.4353 17.0769 16.1497C17.0769 15.864 16.9635 15.5901 16.7615 15.3881C16.5595 15.1861 16.2856 15.0726 16 15.0726ZM28 13.9956C28.0005 16.4129 27.3753 18.7892 26.1851 20.8931C24.9949 22.997 23.2803 24.7569 21.2083 26.0015C19.1362 27.2461 16.7772 27.933 14.361 27.9953C11.9447 28.0577 9.55346 27.4933 7.42 26.3572L2.83635 27.8852C2.45685 28.0118 2.0496 28.0301 1.66025 27.9383C1.2709 27.8464 0.914829 27.6478 0.631953 27.3649C0.349078 27.082 0.150573 26.7259 0.0586889 26.3365C-0.0331955 25.9471 -0.0148288 25.5399 0.11173 25.1603L1.63962 20.5762C0.640969 18.6985 0.0831884 16.6179 0.0086118 14.4923C-0.0659648 12.3668 0.344623 10.2522 1.20921 8.30908C2.07379 6.36594 3.36966 4.64532 4.99843 3.27783C6.6272 1.91034 8.54607 0.931912 10.6094 0.416822C12.6727 -0.0982686 14.8263 -0.136486 16.9066 0.305071C18.9869 0.746628 20.9392 1.65635 22.6155 2.96519C24.2918 4.27404 25.6478 5.94759 26.5808 7.85883C27.5138 9.77007 27.9991 11.8688 28 13.9956ZM25.8462 13.9956C25.8456 12.1783 25.4271 10.3854 24.6229 8.75579C23.8187 7.12614 22.6504 5.70335 21.2084 4.59751C19.7664 3.49167 18.0894 2.73242 16.307 2.37851C14.5247 2.02459 12.6848 2.08549 10.9297 2.5565C9.17469 3.02751 7.55151 3.896 6.18578 5.09477C4.82006 6.29355 3.74839 7.79048 3.0537 9.46975C2.359 11.149 2.05991 12.9656 2.17955 14.779C2.29919 16.5924 2.83436 18.3539 3.74365 19.9273C3.81997 20.0594 3.86736 20.2062 3.88267 20.358C3.89799 20.5098 3.88089 20.6631 3.8325 20.8078L2.15385 25.8429L7.18846 24.1641C7.29812 24.1267 7.41318 24.1076 7.52904 24.1075C7.71818 24.1079 7.90389 24.158 8.0675 24.2529C9.86839 25.295 11.9119 25.8443 13.9925 25.8456C16.0731 25.8469 18.1173 25.3002 19.9195 24.2604C21.7217 23.2206 23.2183 21.7245 24.2587 19.9226C25.2991 18.1206 25.8466 16.0764 25.8462 13.9956Z"
      />
    </svg>
  );
}

/** Round check on a selected radio button: accent fill, white ring and tick. */
export function CheckBadge(props: Omit<IconProps, "size">) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="10" cy="10" r="9.5" fill="var(--accent-500)" stroke="var(--neutral-0)" />
      <path
        d="M12.3333 8L8.66667 11.6667L7 10"
        stroke="var(--neutral-0)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
