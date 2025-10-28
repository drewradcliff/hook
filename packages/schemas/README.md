# @hook/schemas

Community-contributed webhook schemas for popular services.

## Installation

```bash
npm install @hook/schemas
# or
pnpm add @hook/schemas
```

## Usage

### GitHub Webhooks

GitHub sends all events to a single webhook URL. Route based on the `x-github-event` header:

```typescript
import { hook } from "@hook/core/next";
import { githubPushSchema, githubPullRequestSchema } from "@hook/schemas/github";

export const POST = async (req: Request) => {
  const event = req.headers.get("x-github-event");

  if (event === "push") {
    const { data, error } = await hook(req, {
      schema: githubPushSchema,
      secret: process.env.GITHUB_WEBHOOK_SECRET,
      provider: "github",
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.log(`Push to ${data.repository.full_name} by ${data.pusher.name}`);
    return Response.json({ success: true });
  }

  if (event === "pull_request") {
    const { data, error } = await hook(req, {
      schema: githubPullRequestSchema,
      secret: process.env.GITHUB_WEBHOOK_SECRET,
      provider: "github",
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.log(`PR ${data.action}: ${data.pull_request.title}`);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Unsupported event" }, { status: 400 });
};
```

## Contributing

Want to add more webhook schemas? Contributions are welcome! Please submit a PR with:

1. Well-typed Zod schemas
2. TypeScript types exported from schemas
3. Examples in the README

