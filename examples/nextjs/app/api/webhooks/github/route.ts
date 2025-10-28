import { hook } from "@hook/core/next";
import { githubPushSchema, githubPullRequestSchema } from "@hook/schemas/github";

export const POST = async (req: Request) => {
  const event = req.headers.get("x-github-event");

  // Handle push events
  if (event === "push") {
    const { data, error } = await hook(req, {
      schema: githubPushSchema,
      secret: process.env.GITHUB_WEBHOOK_SECRET,
      provider: "github",
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.log(`Push to ${data.repository?.full_name} by ${data.pusher?.name}`);
    console.log(`Commits: ${data.commits?.length}`);
    console.log(`Ref: ${data.ref}`);

    return Response.json({
      success: true,
      event: "push",
      repository: data.repository?.full_name,
      commits: data.commits?.length,
    });
  }

  // Handle pull request events
  if (event === "pull_request") {
    const { data, error } = await hook(req, {
      schema: githubPullRequestSchema,
      secret: process.env.GITHUB_WEBHOOK_SECRET,
      provider: "github",
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.log(`Pull Request ${data.action} on ${data.repository?.full_name}`);
    console.log(`PR #${data.number}: ${data.pull_request?.title}`);
    console.log(`State: ${data.pull_request?.state}`);

    return Response.json({
      success: true,
      event: "pull_request",
      action: data.action,
      number: data.number,
      title: data.pull_request?.title,
    });
  }

  // Unsupported event type
  return Response.json(
    { error: `Unsupported event type: ${event}` },
    { status: 400 }
  );
};

