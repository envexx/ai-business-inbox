import { prisma } from "../lib/prisma";
import { createMessage, runAutomation } from "./engine";
import { setPolicyConfig } from "./settings";
import type { InboxInput } from "./types";

const DEMO_MESSAGES: InboxInput[] = [
  {
    senderName: "Sarah Mendez",
    senderEmail: "sarah.mendez@fieldstoneretail.com",
    company: "Fieldstone Retail",
    subject: "Charged twice this month",
    body: "Hello, we have been charged twice for our subscription this month. Can someone help us resolve this? The second charge is $184 and it should not be there.",
    channel: "email",
  },
  {
    senderName: "Tomas Herrera",
    senderEmail: "tomas@herrera-design.co",
    company: "Herrera Design",
    subject: "Refund request",
    body: "We cancelled last week but were billed $240 for another year. I would like a refund please. Order reference ORD-88213.",
    channel: "email",
  },
  {
    senderName: "Mike Ellison",
    senderEmail: "mike@ellisonpartners.com",
    company: "Ellison Partners",
    subject: "Can we set up a call?",
    body: "Hi, we would like to schedule a meeting to go over onboarding for our team. Do you have availability this week or next?",
    channel: "email",
  },
  {
    senderName: "Priya Nair",
    senderEmail: "priya@sundialfoods.in",
    company: "Sundial Foods",
    subject: "Pricing for 40 seats",
    body: "We are evaluating tools for a 40 person team and would like pricing and a demo. What does the annual plan cost?",
    channel: "form",
  },
  {
    senderName: "Denise Okafor",
    senderEmail: "denise.okafor@brightlane.org",
    company: "Brightlane",
    subject: "This is unacceptable",
    body: "This is the third time I have written and still no response. The experience has been unacceptable and I am extremely disappointed with how this has been handled.",
    channel: "email",
  },
  {
    senderName: "Accounts Payable",
    senderEmail: "ap@baerenwerk.de",
    company: "Barenwerk GmbH",
    subject: "Invoice INV-2291 attached",
    body: "Please find invoice INV-2291 for the March services. Payment terms are 30 days. Let us know if you need the purchase order number.",
    channel: "email",
  },
  {
    senderName: "Lucas Brandt",
    senderEmail: "lucas@northgate-io.com",
    company: "Northgate IO",
    subject: "Partnership proposal",
    body: "We would like to explore a partnership and a possible reseller arrangement for the DACH region. Who is the right person to speak with?",
    channel: "email",
  },
  {
    senderName: "Aisha Rahman",
    senderEmail: "aisha.rahman@verdantclinic.com",
    company: "Verdant Clinic",
    subject: "Cannot log in",
    body: "Since this morning I cannot log in. The page shows an error after I enter my password. This is blocking our front desk, please help urgently.",
    channel: "email",
  },
  {
    senderName: "Colin Doyle",
    senderEmail: "colin.doyle@gmail.com",
    subject: "Opening hours",
    body: "Hi, what are your support hours and do you offer onboarding on weekends? Thanks.",
    channel: "form",
  },
  {
    senderName: "Marta Kowalski",
    senderEmail: "marta@internal.example.com",
    subject: "Access request",
    body: "I need an access request for the analytics dashboard for the new hire on my team. Can this be set up this week?",
    channel: "email",
  },
  {
    senderName: "Growth Team",
    senderEmail: "outreach@rankboost-seo.biz",
    subject: "Boost your rankings with guest posts",
    body: "We provide SEO services and high quality backlink guest post placements. Reply to get our crypto and finance media list.",
    channel: "email",
  },
  {
    senderName: "Ines Caetano",
    senderEmail: "ines@ateliercaetano.pt",
    company: "Atelier Caetano",
    subject: "Small refund",
    body: "I was charged $45 for a plan I did not mean to renew. Could I get a refund? It is a small amount but I would appreciate it.",
    channel: "email",
  },
];

export async function seedDemoData({ reset = true }: { reset?: boolean } = {}) {
  if (reset) {
    await prisma.auditLog.deleteMany();
    await prisma.action.deleteMany();
    await prisma.approval.deleteMany();
    await prisma.task.deleteMany();
    await prisma.runStep.deleteMany();
    await prisma.automationRun.deleteMany();
    await prisma.classification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.setting.deleteMany();
  }

  await setPolicyConfig({});

  const results: Array<{ sender: string; intent: string; mode: string; risk: string }> = [];

  for (const input of DEMO_MESSAGES) {
    const message = await createMessage(input);
    const offset = results.length * 11 * 60 * 1000;
    await prisma.message.update({
      where: { id: message.id },
      data: { createdAt: new Date(Date.now() - offset) },
    });
    const run = await runAutomation(message.id, "seed");
    await prisma.automationRun.update({
      where: { id: run.runId },
      data: { startedAt: new Date(Date.now() - offset) },
    });
    results.push({
      sender: input.senderName ?? "Unknown",
      intent: run.understanding.classification.intent,
      mode: run.decision.mode,
      risk: run.decision.risk,
    });
  }

  return { seeded: results.length, results };
}
