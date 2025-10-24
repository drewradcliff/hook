# hook

TypeScript-native webhooks

Test, verify, replay, and debug your app's webhooks

## Features

- 🎯 **Type-safe webhooks** with Zod schemas
- 🔄 **Event replay** for debugging
- 📊 **Self-hosted Dashboard** for monitoring
- 💾 **SQLite persistence** for all events

## Next.js Integration

Hook uses a **convention-based approach** that automatically detects webhooks from your Next.js route structure.

### 1. Configure Hook (Optional)

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

  return { success: true };
});
```

### 3. Run Hook Dev Server

```bash
npx hook dev
```

The Hook dev server will:

- Auto-detect all webhooks in `./app/api/webhooks/`
- Proxy requests to your app
- Log all events locally
- Provide a dashboard to view and replay events

## License

MIT
