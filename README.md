# hook

A TypeScript-native webhook platform.

Test, verify, replay, and debug your app's webhooks — locally or deployed.

## Features

- 🎯 **Type-safe webhooks** with Zod schemas
- 🔄 **Event replay**
- 📊 **Self Hosted Dashboard**
- 🔐 **Signature verification** built-in
- 💾 **SQLite persistence** for all events
- 🚀 **Works locally and in production**

## Quick Start

```bash
# Install dependencies
pnpm install

# Initialize hook config
pnpm hook init

# Start the dev server
pnpm dev

# In another terminal, test a webhook
curl -X POST http://localhost:3420/webhooks/example \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from Hook!"}'

# Replay event
pnpm hook replay 1

# View the dashboard
open http://localhost:3420/_dashboard
```

## Example Webhook

`.hook/hooks/github.push.ts`:

```typescript
import { z } from "zod";
import { defineWebhook } from "@hook/core";

const githubPushSchema = z.object({
  ref: z.string(),
  repository: z.object({
    name: z.string(),
    full_name: z.string(),
  }),
  pusher: z.object({
    name: z.string(),
    email: z.string(),
  }),
});

export default defineWebhook({
  name: "github.push",
  path: "/webhooks/github/push",
  method: "POST",
  secret: process.env.GITHUB_WEBHOOK_SECRET,
  signatureHeader: "X-Hub-Signature-256",
  schema: githubPushSchema,
  handler: async (payload) => {
    console.log(
      `Push to ${payload.repository.full_name} by ${payload.pusher.name}`
    );
  },
});
```

## License

MIT
