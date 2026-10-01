import OpenAI from "openai";
import { z } from "zod";
import type { Classification, InboxInput, Understanding } from "../types";
import { heuristicClassification } from "./heuristic";

const ModelResult = z.object({
  intent: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]).optional(),
  request: z.string().optional(),
  summary: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  signals: z.array(z.string()).optional(),
  reasoning: z.string().optional(),
  amountUsd: z.number().int().nullable().optional(),
  invoiceId: z.string().nullable().optional(),
  duplicateCharge: z.boolean().optional(),
});

const INTENTS = [
  "billing_issue",
  "refund_request",
  "invoice",
  "complaint",
  "meeting_request",
  "sales_inquiry",
  "partnership",
  "support_request",
  "internal_request",
  "faq",
  "spam",
];

const SYSTEM_PROMPT = `You classify inbound business messages for an operations team.
Return ONLY JSON with keys:
intent (one of: ${INTENTS.join(", ")}), priority (LOW|MEDIUM|HIGH), sentiment (POSITIVE|NEUTRAL|NEGATIVE),
request (short noun phrase), summary (one sentence), confidence (0..1), signals (array of short strings),
reasoning (one sentence), amountUsd (integer|null), invoiceId (string|null), duplicateCharge (boolean).
Rules: never invent facts. Use null when unknown. No em dashes.`;

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function resolvedModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/**
 * Classify a message. OpenAI when a key is present, deterministic classifier
 * otherwise, so the pipeline never stalls in a demo or a degraded environment.
 */
export async function classifyMessage(input: InboxInput): Promise<Understanding> {
  const fallbackClassification = heuristicClassification(input);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { classification: fallbackClassification, engine: "heuristic", engineLabel: "deterministic classifier" };
  }

  const model = resolvedModel();
  try {
    const client = new OpenAI({ apiKey, timeout: 20000, maxRetries: 1 });
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            from: input.senderName ?? null,
            company: input.company ?? null,
            subject: input.subject ?? null,
            body: input.body,
          }),
        },
      ],
    });

    const parsed = ModelResult.safeParse(JSON.parse(completion.choices[0]?.message?.content ?? "{}"));
    if (!parsed.success) {
      return { classification: fallbackClassification, engine: "heuristic-fallback", engineLabel: "deterministic classifier (model output rejected)" };
    }

    const d = parsed.data;
    const classification: Classification = {
      intent: d.intent && INTENTS.includes(d.intent) ? d.intent : fallbackClassification.intent,
      priority: d.priority ?? fallbackClassification.priority,
      sentiment: d.sentiment ?? fallbackClassification.sentiment,
      request: d.request ?? fallbackClassification.request,
      summary: d.summary ?? fallbackClassification.summary,
      confidence: d.confidence ?? fallbackClassification.confidence,
      signals: d.signals && d.signals.length > 0 ? d.signals : fallbackClassification.signals,
      reasoning: d.reasoning ?? fallbackClassification.reasoning,
      extracted: {
        amountUsd: d.amountUsd ?? fallbackClassification.extracted.amountUsd,
        invoiceId: d.invoiceId ?? fallbackClassification.extracted.invoiceId,
        duplicateCharge: d.duplicateCharge ?? fallbackClassification.extracted.duplicateCharge,
      },
    };
    return { classification, engine: "openai", engineLabel: model };
  } catch {
    return { classification: fallbackClassification, engine: "heuristic-fallback", engineLabel: "deterministic classifier (model unavailable)" };
  }
}
