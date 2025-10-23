# hook

TypeScript-native webhooks

Test, verify, replay, and debug your app's webhooks

## Features

- 🎯 **Type-safe webhooks** with Zod schemas
- 🔄 **Event replay** for debugging
- 📊 **Self-hosted Dashboard** for monitoring
- 💾 **SQLite persistence** for all events

## Quick Start (Nextjs example)

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Start your Next.js app
cd examples/my-app
npm run dev

# In another terminal, start hook dev server
pnpm hook dev

# Test a webhook
curl -X POST http://localhost:3420/api/webhooks/example \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from Hook!"}'

# View the dashboard
open http://localhost:3420/

# Replay event
pnpm hook replay 1
```

## Next.js Integration

Hook uses a **convention-based approach** that automatically detects webhooks from your Next.js route structure.

### 1. Configure Hook

Create `hook.config.ts` in your project root:

```typescript
import { defineConfig } from "@hook/core";

export default defineConfig({
  out: "./hook",
  webhooks: "./app/api/webhooks",
});
```

### 2. Create Webhook Routes

Define webhooks directly in Next.js route handlers:

**`app/api/webhooks/github/push/route.ts`**:

```typescript
import { handleWebhook } from "@hook/core/next";
import { z } from "zod";

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

export const POST = handleWebhook(githubPushSchema, async (payload) => {
  console.log(
    `Push to ${payload.repository.full_name} by ${payload.pusher.name}`
  );

  // Your business logic here

  return { success: true };
});
```

### 3. Run Hook Dev Server

```bash
npx hook dev
```

The Hook dev server (port 3420) will:

- Auto-detect all webhooks in `./app/api/webhooks/`
- Proxy requests to your app
- Log all events to a local database
- Provide a dashboard to view and replay events

## License

MIT
