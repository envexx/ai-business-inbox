import type { Classification, ExtractedData, InboxInput, Priority, Sentiment } from "../types";

const INTENT_RULES: Array<{ intent: string; needles: string[] }> = [
  { intent: "refund_request", needles: ["refund", "money back", "reimburse"] },
  { intent: "billing_issue", needles: ["charged twice", "double charge", "duplicate charge", "billing", "charged again", "billed twice"] },
  { intent: "invoice", needles: ["invoice", "purchase order", "receipt", "vat"] },
  { intent: "complaint", needles: ["complaint", "unacceptable", "disappointed", "angry", "appalling", "frustrat"] },
  { intent: "meeting_request", needles: ["meeting", "call", "schedule", "calendar", "availability", "book a time"] },
  { intent: "partnership", needles: ["partnership", "partner with", "reseller", "integration partner"] },
  { intent: "sales_inquiry", needles: ["pricing", "quote", "purchase", "demo", "trial", "buy"] },
  { intent: "support_request", needles: ["not working", "broken", "error", "bug", "issue", "help", "cannot log in", "can't log in"] },
  { intent: "faq", needles: ["hours", "opening", "policy", "do you offer", "how do i"] },
  { intent: "internal_request", needles: ["expense", "laptop", "onboarding", "access request", "it support"] },
  { intent: "spam", needles: ["seo services", "crypto", "guest post", "backlink", "unsubscribe me from this"] },
];

const NEGATIVE = ["charged twice", "unacceptable", "angry", "frustrat", "disappointed", "appalling", "broken", "not working", "still waiting", "no response", "urgent"];
const POSITIVE = ["thanks", "thank you", "great", "love", "appreciate", "happy"];

function parseAmount(text: string): number | null {
  const kMatch = text.match(/(?:\$|usd\s*)?\s?(\d+(?:\.\d+)?)\s?k\b/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
  const money = text.match(/\$\s?([\d,]+(?:\.\d+)?)/);
  if (money) return parseInt(money[1].replace(/,/g, ""), 10);
  return null;
}

function detectIntent(text: string): string {
  for (const rule of INTENT_RULES) {
    if (rule.needles.some((n) => text.includes(n))) return rule.intent;
  }
  return "support_request";
}

function detectSentiment(text: string): Sentiment {
  if (NEGATIVE.some((w) => text.includes(w))) return "NEGATIVE";
  if (POSITIVE.some((w) => text.includes(w))) return "POSITIVE";
  return "NEUTRAL";
}

function detectPriority(intent: string, sentiment: Sentiment, text: string): Priority {
  if (/(urgent|asap|immediately|right away|today)/.test(text)) return "HIGH";
  if (["refund_request", "complaint", "billing_issue"].includes(intent)) {
    return sentiment === "NEGATIVE" ? "HIGH" : "MEDIUM";
  }
  if (intent === "invoice") return "MEDIUM";
  if (intent === "spam") return "LOW";
  return "MEDIUM";
}

function requestPhrase(intent: string): string {
  const map: Record<string, string> = {
    refund_request: "refund",
    billing_issue: "billing investigation",
    invoice: "invoice processing",
    complaint: "complaint resolution",
    meeting_request: "meeting scheduling",
    partnership: "partnership review",
    sales_inquiry: "sales follow-up",
    support_request: "support resolution",
    internal_request: "internal request",
    spam: "unwanted message",
    faq: "general question",
  };
  return map[intent] ?? "message triage";
}

export function heuristicClassification(input: InboxInput): Classification {
  const text = `${input.subject ?? ""} ${input.body}`.toLowerCase();
  const intent = detectIntent(text);
  const sentiment = detectSentiment(text);
  const priority = detectPriority(intent, sentiment, text);
  const amountUsd = parseAmount(text);
  const duplicateCharge = /(charged twice|double charge|duplicate charge|billed twice)/.test(text);
  const invoiceMatch = text.match(/invoice\s*#?\s*([a-z0-9-]{4,})/i);

  const signals: string[] = [`Intent matched: ${intent.replace(/_/g, " ")}`];
  if (sentiment === "NEGATIVE") signals.push("Negative tone detected");
  if (amountUsd) signals.push(`Amount detected: $${amountUsd.toLocaleString("en-US")}`);
  if (duplicateCharge) signals.push("Duplicate charge language");
  if (priority === "HIGH") signals.push("High priority signal");

  const extracted: ExtractedData = {
    amountUsd,
    invoiceId: invoiceMatch ? invoiceMatch[1] : null,
    duplicateCharge,
  };

  return {
    intent,
    priority,
    sentiment,
    request: requestPhrase(intent),
    summary: `Message reads as ${intent.replace(/_/g, " ")} with ${priority.toLowerCase()} priority.`,
    confidence: Math.min(0.6 + signals.length * 0.08, 0.95),
    signals,
    reasoning: `Rule based classifier matched ${signals.length} signal(s) in the message text.`,
    extracted,
  };
}
