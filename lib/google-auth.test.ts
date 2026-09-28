import { describe, expect, it } from "vitest";
import { allowedGoogleEmails, PRIMARY_ADMIN_EMAIL } from "./google-auth";

describe("allowedGoogleEmails", () => {
  it("always allows the primary login", () => {
    expect(allowedGoogleEmails(undefined)).toEqual(new Set([PRIMARY_ADMIN_EMAIL]));
  });

  it("adds normalized extra emails", () => {
    const allowed = allowedGoogleEmails(" Steven@Example.com , ,admin@flipwithhighlander.com");
    expect([...allowed]).toEqual([PRIMARY_ADMIN_EMAIL, "steven@example.com", "admin@flipwithhighlander.com"]);
    expect(allowed.has("someone@else.com")).toBe(false);
  });
});
