import { seedDemoData } from "../src/core/seed";

seedDemoData({ reset: true })
  .then((result) => {
    console.log(`Seeded ${result.seeded} messages.`);
    for (const row of result.results) {
      console.log(`  ${row.risk.padEnd(6)} ${row.mode.padEnd(16)} ${row.intent.padEnd(18)} ${row.sender}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
