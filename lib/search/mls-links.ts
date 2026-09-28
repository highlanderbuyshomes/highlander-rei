// Where the Flexmls / CurbView buttons on Deal Search go. `{mls}`, `{address}`
// and `{zip}` are filled in per listing. A template with no placeholder just
// opens that site; the button also copies the MLS # so it can be pasted into
// the site's search box.
export const FLEXMLS_URL = "https://my.flexmls.com/armls/search/new";
// CurbView's listing route is /mls/:sourceMlsId/listings/:listingId; ARMLS is
// source 1 and listingId is the MLS # (curbview.com app bundle, 2026-09).
export const CURBVIEW_URL = "https://curbview.com/mls/1/listings/{mls}";

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
  };
}
