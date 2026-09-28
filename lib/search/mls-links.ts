// Where the Flexmls / Monsoon buttons on Deal Search go. `{mls}`, `{address}`
// and `{zip}` are filled in per listing. A template with no placeholder just
// opens that site; the button also copies the MLS # (Flexmls) or address
// (Monsoon) so it can be pasted into the site's search box.
export const FLEXMLS_URL = "https://my.flexmls.com/armls/search/new";
export const MONSOON_URL = "https://armls.com/";

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
    monsoon: { href: fillTemplate(MONSOON_URL, l), copy: `${l.address}, ${l.city}, AZ ${l.zip}` },
  };
}
