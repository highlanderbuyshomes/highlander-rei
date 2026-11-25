// Deterministic reply classifier for GHL conversations. No AI: a reply is
// "negative" if it matches an opt-out / decline phrase, "positive" if it
// matches a buying-intent phrase, otherwise "neutral". Negatives win, so
// "not interested" never counts as interested.

export type Sentiment = "positive" | "negative" | "neutral";

const NEGATIVE: RegExp[] = [
  /^(no|nope|nah|pass)\b(?!\s+(problem|worries|doubt))/,
  /\bno,? thanks?\b/,
  /\bno thank you\b/,
  /\bnot (really )?(interested|buying|looking|investing|in the market|at this time|right now|now)\b/,
  /\bno longer (interested|buying|looking|investing)\b/,
  /\bnot able\b/,
  /\bnot for (me|us)\b/,
  /\bnot a (fit|match)\b/,
  /\b(i'?ll|we'?ll|gonna|going to) pass\b/,
  /\bpassing\b/,
  /\bto+ ?(big|small|far|much|expensive|pricey|high)/,
  /\bstop\b/,
  /\bunsubscribe\b/,
  /\bremove (me|my|us)\b/,
  /\btake (me|us) off\b/,
  /\bwrong (number|person)\b/,
  /\b(don'?t|do not|stop) (text|contact|call|message|email)/,
  /\blose (my|this) number\b/,
  /\bleave me alone\b/,
  /\bscam/,
  /\bf+u+c+k/,
];

const POSITIVE: RegExp[] = [
  /^(yes|yess+|yeah|yea|yep|yup|ya|sure|absolutely|definitely|of course|for sure|100)\b(?!\s+not\b)/,
  /\binterested\b/,
  /\bstill (buying|looking|investing|active|in the market)\b/,
  /\b(i'?m|i am|we'?re|we are|always) (buying|looking|investing|in)\b/,
  /\bsend (me|it|over|them|the|details|info|pics|photos|address)\b/,
  /\bwhat (do )?(you|u) (have|got)\b/,
  /\bhow much\b/,
  /\bwhat'?s? (is )?the (price|address|asking|arv|number|numbers|rehab|location)\b/,
  /\basking price\b/,
  /\b(price|address|location)\s*\?/,
  /\b(where is it|where'?s it|what area|which area|what city)\b/,
  /\bshow me\b/,
  /\btake a look\b/,
  /\badd me\b/,
  /\bput me on\b/,
  /\b(call|text) me\b/,
  /\bgive me a call\b/,
  /\blet'?s talk\b/,
  /\btell me more\b/,
  /\bmore (info|information|details)\b/,
  /\b(details|pics|photos|pictures|comps)\b/,
  /\b(numbers|price) (work|is right)\b/,
  /\bdeal is right\b/,
  /\bdepends on\b/,
  /\bcan close\b/,
];

export function normalizeReply(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyReply(text: string): Sentiment {
  const t = normalizeReply(text);
  if (!t) return "neutral";
  if (NEGATIVE.some((re) => re.test(t))) return "negative";
  if (POSITIVE.some((re) => re.test(t))) return "positive";
  return "neutral";
}

// Email replies arrive as HTML with the quoted thread underneath — keep only
// the new text so an old "interested?" in the quote can't match.
export function replyText(body: string, messageType: string): string {
  let text = body;
  if (/EMAIL/.test(messageType)) {
    text = text
      .replace(/<(br|\/p|\/div)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"');
    const quote = text.search(/\n\s*(On .{0,200}wrote:|-{2,}\s*Original Message|From: )/i);
    if (quote > 0) text = text.slice(0, quote);
  }
  return text.trim().slice(0, 1000);
}

// Instagram and Facebook DMs stay out; calls and activity entries carry no reply text.
export function isEligibleMessageType(messageType: string | undefined | null): boolean {
  if (!messageType) return false;
  return !/INSTAGRAM|FACEBOOK|TYPE_FB|ACTIVITY|CALL|VOICEMAIL/.test(messageType);
}

export type InboundReply = { body: string; at: Date; messageType: string };

// The latest decisive reply sets the conversation's state: someone who said
// "how much" and later "not interested" is negative.
export function conversationSentiment(replies: InboundReply[]): {
  sentiment: Sentiment;
  positive: InboundReply | null;
} {
  const ordered = [...replies].sort((a, b) => a.at.getTime() - b.at.getTime());
  let sentiment: Sentiment = "neutral";
  let positive: InboundReply | null = null;
  for (const reply of ordered) {
    const s = classifyReply(reply.body);
    if (s === "neutral") continue;
    sentiment = s;
    if (s === "positive") positive = reply;
  }
  return { sentiment, positive: sentiment === "positive" ? positive : null };
}
