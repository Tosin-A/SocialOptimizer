// Quick test script for Gmail SMTP email sending
// Usage: npx tsx scripts/test-email.ts

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sendAnalysisReady } from "../lib/email";

async function main() {
  const to = process.argv[2] || process.env.GMAIL_USER;
  if (!to) {
    console.error("Usage: npx tsx scripts/test-email.ts <recipient-email>");
    console.error("Or set GMAIL_USER in .env.local");
    process.exit(1);
  }

  console.log(`Sending test email to ${to}...`);

  const result = await sendAnalysisReady({
    to,
    username: "testcreator",
    platform: "tiktok",
    growthScore: 72,
    niche: "Fitness & Health",
    topInsight:
      "Your CTA usage rate of 23% is below the platform median of 61%. Adding a clear call-to-action in your first 3 seconds could increase engagement by 15-25%.",
    reportId: "test-123",
  });

  console.log("Email sent successfully!");
  console.log("Message ID:", result.messageId);
}

main().catch((err) => {
  console.error("Failed to send email:", err.message);
  process.exit(1);
});
