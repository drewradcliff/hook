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

# Start the dev server
pnpm dev

# In another terminal, test a webhook
curl -X POST http://localhost:3420/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from Hook!"}'

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

## Development Commands

```bash
# Start the dev server
pnpm dev

# Run any hook command
pnpm hook init
pnpm hook replay 1

# Build all packages
pnpm build
```

## Dashboard

Visit `http://localhost:3420/_dashboard` to view all webhook events, inspect payloads, and replay events.

## API Endpoints

- `GET /_api/events` - List all events
- `GET /_api/events/:id` - Get single event
- `POST /_api/events/:id/replay` - Replay an event

## License

MIT
