import OpenAI from "openai";
import type { Classification, Decision } from "../types";

export interface DraftReply {
  subject: string;
  body: string;
  engineLabel: string;
}

function template(classification: Classification, decision: Decision, senderName: string | null): DraftReply {
  const first = (senderName ?? "there").split(" ")[0];
  const subject = classification.intent === "invoice" ? "Invoice received" : "Re: your message";

  const bodies: Record<string, string> = {
    refund_request: `Hi ${first},

Thanks for flagging this. I can see a refund request on the account and I have routed it to our finance team for review.

Refunds are reviewed by a person before anything is processed, so you will get a confirmation once that review is complete. If there is an order or invoice number you can share, it will speed things up.

Best,
Customer Operations`,
    billing_issue: `Hi ${first},

Thanks for reporting this. I have logged the billing issue and flagged it for our finance team.

If a duplicate charge is confirmed, the refund review will be handled by a person and you will be notified. No action is needed from you in the meantime.

Best,
Customer Operations`,
    complaint: `Hi ${first},

Thank you for telling us, and I am sorry about the experience. I have escalated this to a support lead so it gets proper attention.

Someone will follow up with a concrete next step shortly.

Best,
Customer Operations`,
    meeting_request: `Hi ${first},

Happy to set up a call. I have two openings this week and can send an invite for whichever suits you:

- Tuesday, 10:00 to 10:30
- Thursday, 14:00 to 14:30

Reply with a preference and I will send the invite with a short agenda.

Best,
Sales`,
    sales_inquiry: `Hi ${first},

Thanks for reaching out. I have passed your inquiry to the right person and you will hear back with the details you asked for.

If there is a deadline on your side, reply with it and I will flag it.

Best,
Sales`,
    partnership: `Hi ${first},

Thanks for the partnership note. I have logged it for our partnerships team to review.

If you can share a one paragraph summary of what you have in mind, it will help them respond with something useful.

Best,
Partnerships`,
    support_request: `Hi ${first},

Thanks for the report. I have created a support ticket and it is now with our team.

To help us resolve it faster, reply with any error text or a screenshot if you have one.

Best,
Support`,
    faq: `Hi ${first},

Thanks for the question. I have noted it and someone will confirm the details shortly.

Best,
Customer Operations`,
    internal_request: `Hi ${first},

Thanks, I have logged this as an internal request and routed it to operations.

Best,
Operations`,
  };

  const body =
    bodies[classification.intent] ??
    `Hi ${first},

Thanks for your message. I have logged it and routed it to the ${decision.department} team.

Best,
Customer Operations`;

  return { subject, body, engineLabel: "template" };
}

/**
 * Draft a reply. OpenAI when configured, template otherwise. Templates are
 * specific to the classified intent, not generic filler.
 */
export async function draftReply(
  classification: Classification,
  decision: Decision,
  senderName: string | null,
): Promise<DraftReply> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return template(classification, decision, senderName);

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  try {
    const client = new OpenAI({ apiKey, timeout: 20000, maxRetries: 1 });
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You draft short business email replies for an operations team. Under 120 words. Plain text, no markdown, no em dashes. Do not promise refunds or approvals; say a person will review when that is required. Sign off with the relevant team name.",
        },
        {
          role: "user",
          content: JSON.stringify({
            senderName,
            classification,
            decision: { intent: classification.intent, department: decision.department, requiresApproval: decision.requiresApproval, policy: decision.policy },
          }),
        },
      ],
    });
    const body = completion.choices[0]?.message?.content?.trim();
    if (!body) return template(classification, decision, senderName);
    return { subject: "Re: your message", body, engineLabel: model };
  } catch {
    return template(classification, decision, senderName);
  }
}
