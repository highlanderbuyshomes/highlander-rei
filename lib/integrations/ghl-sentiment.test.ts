import { describe, expect, it } from "vitest";
import { classifyReply, conversationSentiment, isEligibleMessageType, replyText } from "./ghl-sentiment";

describe("classifyReply", () => {
  it.each([
    "Yes",
    "Yeah what do you have",
    "How much?",
    "Still buying in Mesa",
    "Send me the address",
    "What's the price",
    "Interested, send details",
    "Price?",
    "Call me tomorrow",
    "Depends on the numbers",
  ])("positive: %s", (text) => expect(classifyReply(text)).toBe("positive"));

  it.each([
    "No not interested. Not able to move at this time..",
    "Not interested",
    "STOP",
    "Sorry to bigfor me",
    "Too far for me",
    "Wrong number",
    "Please remove me from your list",
    "No thanks",
    "I'll pass",
    "Don't text me again",
  ])("negative: %s", (text) => expect(classifyReply(text)).toBe("negative"));

  it.each(["Thank you", "Who is this?", "ok", "", "Definitely not Tucson"])("neutral: %s", (text) =>
    expect(classifyReply(text)).toBe("neutral"),
  );

  it("does not treat 'no problem' as a decline", () => {
    expect(classifyReply("No problem, send it over")).toBe("positive");
  });
});

describe("conversationSentiment", () => {
  const at = (m: number) => new Date(Date.UTC(2026, 10, 1, 0, m));
  it("latest decisive reply wins", () => {
    const r = conversationSentiment([
      { body: "How much", at: at(1), messageType: "TYPE_SMS" },
      { body: "Too big for me", at: at(5), messageType: "TYPE_SMS" },
      { body: "Thanks", at: at(9), messageType: "TYPE_SMS" },
    ]);
    expect(r.sentiment).toBe("negative");
    expect(r.positive).toBeNull();
  });
  it("keeps the most recent positive reply", () => {
    const r = conversationSentiment([
      { body: "Yes", at: at(1), messageType: "TYPE_SMS" },
      { body: "Send me the address", at: at(3), messageType: "TYPE_SMS" },
      { body: "Thanks", at: at(4), messageType: "TYPE_SMS" },
    ]);
    expect(r.sentiment).toBe("positive");
    expect(r.positive?.body).toBe("Send me the address");
  });
});

describe("message filtering", () => {
  it("drops Instagram, Facebook, calls", () => {
    expect(isEligibleMessageType("TYPE_INSTAGRAM")).toBe(false);
    expect(isEligibleMessageType("TYPE_FACEBOOK")).toBe(false);
    expect(isEligibleMessageType("TYPE_CALL")).toBe(false);
    expect(isEligibleMessageType("TYPE_SMS")).toBe(true);
    expect(isEligibleMessageType("TYPE_EMAIL")).toBe(true);
  });
  it("strips the quoted thread from email replies", () => {
    const html = "<div>Yes send it</div><div>On Mon, Nov 3 Someone wrote:</div><div>Not interested?</div>";
    expect(replyText(html, "TYPE_EMAIL")).toBe("Yes send it");
  });
});
