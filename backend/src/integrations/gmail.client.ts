// STUB — Gmail integration not yet approved by Nicolas.
// When the real Gmail integration is provisioned:
//   1. Decide on the approach: SMTP (nodemailer) is simplest, Gmail API is more robust
//   2. Install the chosen library
//   3. Replace sendEmail() with real send logic
//   4. Add credentials (SMTP_USER, SMTP_PASS or GMAIL_API_TOKEN) to .env
//   5. Nothing else in the app changes.

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  await new Promise((r) => setTimeout(r, 100));

  console.log('═════════════════════════════════════════');
  console.log(`[GMAIL STUB] To: ${payload.to}`);
  console.log(`[GMAIL STUB] Subject: ${payload.subject}`);
  console.log(`[GMAIL STUB] Body:`);
  console.log(payload.body);
  console.log('═════════════════════════════════════════');
}