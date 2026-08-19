// STUB — Slack integration not yet approved by Nicolas.
// When the real Slack bot is provisioned:
//   1. Install @slack/web-api: npm install @slack/web-api
//   2. Replace the postMessage() function body with:
//        const client = new WebClient(process.env.SLACK_BOT_TOKEN);
//        await client.chat.postMessage({ channel, text });
//   3. Add SLACK_BOT_TOKEN to .env
//   4. Nothing else in the app changes.

export interface SlackMessage {
  channel: string;
  text: string;
}

export async function postMessage(message: SlackMessage): Promise<void> {
  // Simulate small network latency for realism
  await new Promise((r) => setTimeout(r, 80));

  console.log('─────────────────────────────────────────');
  console.log(`[SLACK STUB] Channel: ${message.channel}`);
  console.log(`[SLACK STUB] Text:`);
  console.log(message.text);
  console.log('─────────────────────────────────────────');
}