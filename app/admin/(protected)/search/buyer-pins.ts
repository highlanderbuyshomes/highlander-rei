/**
 * Map pins drawn to match InvestorBase's: teardrop pins, crossed tools for
 * flippers (blue), a key for landlords (green), gold with a sparkle and glow
 * for SmartMatch, and a red magnifier pin for the subject.
 */
export type PinKind = "flipper" | "landlord" | "subject";

export const PIN_COLORS = { flipper: "#72c3ef", landlord: "#5fbd67", smart: "#f4c66f", subject: "#e46a66" } as const;
const INK = "#1f2328";

const TOOLS = `<g stroke="${INK}" stroke-linecap="round" fill="none">
  <path d="m20.5 12.5 7.5 7.5" stroke-width="2.2"/><path d="m28.8 20.8 5.4 5.4" stroke-width="4.6"/>
  <path d="M33 15 21.5 26.5" stroke-width="3.2"/></g>
  <path fill="${INK}" d="M37.6 10.4a5 5 0 0 0-6.9 5.6l2.6 2.6a5 5 0 0 0 5.6-6.9l-2.4 2.4-1.9-.5-.5-1.9z"/>`;
const KEY = (hole: string) => `<circle cx="32.5" cy="15.5" r="5.4" fill="${INK}"/><circle cx="34" cy="14" r="1.7" fill="${hole}"/>
  <g stroke="${INK}" stroke-linecap="round" fill="none"><path d="M29 19 19.8 28.2" stroke-width="3.2"/><path d="m22.4 25.6 2.6 2.6M25.2 22.8l2.2 2.2" stroke-width="2.6"/></g>`;
const LENS = `<g fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"><circle cx="26.5" cy="18.5" r="5.6"/><path d="m30.6 22.6 4.4 4.4"/></g>`;
const SPARKLE = `<path fill="${INK}" d="M15.5 8.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>`;

const PIN_PATH = "M28 4C18.6 4 11 11.5 11 20.8c0 11.7 14.6 25.7 15.9 27a1.6 1.6 0 0 0 2.2 0C30.4 46.5 45 32.5 45 20.8 45 11.5 37.4 4 28 4z";

export function pinSvg(kind: PinKind, smart = false): string {
  const fill = kind === "subject" ? PIN_COLORS.subject : smart ? PIN_COLORS.smart : PIN_COLORS[kind];
  const glow = smart ? `<defs><radialGradient id="g"><stop offset="0" stop-color="#f6c75a" stop-opacity=".9"/><stop offset="1" stop-color="#f6c75a" stop-opacity="0"/></radialGradient></defs><circle cx="28" cy="24" r="26" fill="url(#g)"/>` : "";
  const glyph = kind === "subject" ? LENS : kind === "flipper" ? TOOLS : KEY(fill);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">${glow}`
    + `<ellipse cx="28" cy="50" rx="5" ry="1.6" fill="#000" opacity=".18"/>`
    + `<path d="${PIN_PATH}" fill="${fill}" stroke="${kind === "subject" ? INK : "rgba(0,0,0,.18)"}" stroke-width="${kind === "subject" ? 1.4 : 1}"/>`
    + glyph + (smart ? SPARKLE : "") + "</svg>";
}

/** A Google Maps icon for the pin; the tip sits on the location. */
export function pinIcon(kind: PinKind, smart = false, size = 40): google.maps.Icon {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg(kind, smart))}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, (48.5 / 56) * size),
  };
}
