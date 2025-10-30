# hook

Dev tools for webhooks

## Features

- 🎯 **Type-safe** schema validation
- 🔄 **Event replay** for debugging
- 📊 **Dashboard** for monitoring
- 💾 **Persisted logs** for all events

## Next.js Integration

hook uses a **convention-based approach** that automatically detects webhooks from your route structure.

### 1. Configure hook (Optional)

Create `hook.config.mjs` in your project root:

```javascript
/** @type {import('@hook/core').HookConfig} */
export default {
  out: "./.hook",
  webhooks: "./app/api/webhooks",
  proxyUrl: "http://localhost:3000",
};
```

### 2. Create Webhook Routes

Define webhooks directly in Next.js route handlers:

**`app/api/webhooks/github/push/route.ts`**:

```typescript
import { hook } from "@hook/core/handler";
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

  return Response.json({ success: true });
};
```

### 3. Run Hook Dev Server

```bash
npx hook dev
```

## CLI

### `hook dev`

Start the Hook development server.

**Options:**

- `--port`, `-p` &nbsp;&nbsp;&nbsp;&nbsp;Port for the Hook dev server (default: `3420`)
- `--proxy-url` &nbsp;URL where your application is running (default: `http://localhost:3000`)

### `hook replay <event_id>`

Replay a recorded webhook event by its number (ID).

## License

MIT
