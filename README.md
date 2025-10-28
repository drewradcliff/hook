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
import { defineConfig } from "@hook/core/next";

export default defineConfig({
  out: "./hook",
  webhooks: "./app/api/webhooks",
});
```

### 2. Create Webhook Routes

Define webhooks directly in Next.js route handlers:

**`app/api/webhooks/github/push/route.ts`**:

```typescript
import { hook } from "@hook/core/next";
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

export const POST = async (request: Request) => {
  const { data, error } = await hook(request, githubPushSchema);

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  console.log(`Push to ${data.repository.full_name} by ${data.pusher.name}`);

  // Your business logic here

  return Response.json({ success: true });
};
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
