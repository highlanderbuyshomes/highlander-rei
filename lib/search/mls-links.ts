// Where the Flexmls / CurbView buttons on Deal Search go. `{mls}`, `{address}`
// and `{zip}` are filled in per listing. A template with no placeholder just
// opens that site; the button also copies the MLS # so it can be pasted into
// the site's search box.
// Flexmls opens listings as an overlay with no per-listing URL, so this is the
// ARMLS Flexmls home; the MLS # is copied for its quick search.
export const FLEXMLS_URL = "https://armls.flexmls.com/";
// CurbView's listing route is /mls/:sourceMlsId/listings/:listingId; ARMLS is
// source 1 and listingId is the MLS # (curbview.com app bundle, 2026-09).
export const CURBVIEW_URL = "https://curbview.com/mls/1/listings/{mls}";
// RPR's Deep Links endpoint resolves the property from the MLS # through the
// ARMLS sign-in (cbcode). Used for underwriting from the Deal Intelligence address.
export const RPR_URL = "https://www.narrpr.com/deep-link?cbcode=armls&listingid={mls}";

type Linkable = { mlsNumber: string; address: string; city: string; zip: string };

export function fillTemplate(template: string, l: Linkable): string {
  return template
    .replaceAll("{mls}", encodeURIComponent(l.mlsNumber))
    .replaceAll("{address}", encodeURIComponent(`${l.address}, ${l.city}, AZ ${l.zip}`))
    .replaceAll("{zip}", encodeURIComponent(l.zip));
}

export function mlsLinks(l: Linkable) {
  return {
    flexmls: { href: fillTemplate(FLEXMLS_URL, l), copy: l.mlsNumber },
    curbview: { href: fillTemplate(CURBVIEW_URL, l), copy: l.mlsNumber },
    rpr: { href: fillTemplate(RPR_URL, l) },
  };
}
