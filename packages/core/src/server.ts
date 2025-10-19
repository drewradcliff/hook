import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  saveEvent,
  getEvents,
  getEventById,
  updateEventStatus,
} from "./events.js";
import { verifySignature } from "./signature.js";
import { replayEvent } from "./replay.js";
import { loadWebhooks } from "./loader.js";
import type { WebhookDefinition } from "./define.js";
import path from "path";
import fs from "fs";

export interface ServerOptions {
  port?: number;
  hooksDir?: string;
  dashboardDir?: string;
}

export function createServer(options: ServerOptions = {}) {
  const app = new Hono();
  const { hooksDir = ".hook/hooks", dashboardDir } = options;

  let webhooks = new Map<string, WebhookDefinition>();

  app.use("/_api/*", cors());
  app.use("/_dashboard/*", cors());

  app.get("/_api/events", async (c) => {
    const limit = Number(c.req.query("limit")) || 100;
    const offset = Number(c.req.query("offset")) || 0;
    const webhookName = c.req.query("webhookName");
    const status = c.req.query("status");

    const events = await getEvents({ limit, offset, webhookName, status });
    return c.json({ events });
  });

  app.get("/_api/events/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const event = await getEventById(id);

    if (!event) {
      return c.json({ error: "Event not found" }, 404);
    }

    return c.json({ event });
  });

  app.post("/_api/events/:id/replay", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await replayEvent(id, webhooks);

    return c.json(result);
  });

  if (dashboardDir && fs.existsSync(dashboardDir)) {
    app.use(
      "/_dashboard/*",
      serveStatic({
        root: dashboardDir,
        rewriteRequestPath: (path: string) => path.replace(/^\/_dashboard/, ""),
      })
    );
  }

  app.get("/_dashboard", async (c) => {
    if (dashboardDir && fs.existsSync(dashboardDir)) {
      const indexPath = path.join(dashboardDir, "index.html");
      if (fs.existsSync(indexPath)) {
        return c.html(fs.readFileSync(indexPath, "utf-8"));
      }
    }
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>hook dashboard</title>
          <style>
            body { font-family: system-ui; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { text-align: center; }
            h1 { font-size: 2rem; margin-bottom: 1rem; }
            p { color: #888; margin-bottom: 2rem; }
            code { background: #1a1a1a; padding: 0.25rem 0.5rem; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>hook</h1>
            <p>Dashboard not built yet. Build it first:</p>
            <code>cd packages/dashboard && pnpm build</code>
          </div>
        </body>
      </html>
    `);
  });

  app.all("*", async (c) => {
    const requestPath = c.req.path;
    const method = c.req.method;

    const webhook = Array.from(webhooks.values()).find(
      (w) => w.path === requestPath && w.method === method
    );

    if (!webhook) {
      return c.json({ error: "Webhook not found" }, 404);
    }

    const startTime = Date.now();

    try {
      const rawBody = await c.req.text();
      let body;

      try {
        body = JSON.parse(rawBody || "{}");
      } catch {
        body = rawBody;
      }

      const headers: Record<string, string> = {};
      c.req.raw.headers.forEach((value, key) => {
        headers[key] = value;
      });

      if (webhook.secret && webhook.signatureHeader) {
        const signature = headers[webhook.signatureHeader.toLowerCase()];
        if (!signature) {
          await saveEvent({
            webhookName: webhook.name,
            path: requestPath,
            method,
            headers,
            body,
            status: "failed",
            error: "Missing signature header",
            responseTime: Date.now() - startTime,
          });

          return c.json({ error: "Missing signature header" }, 401);
        }

        const isValid = verifySignature(rawBody, signature, webhook.secret);
        if (!isValid) {
          await saveEvent({
            webhookName: webhook.name,
            path: requestPath,
            method,
            headers,
            body,
            status: "failed",
            error: "Invalid signature",
            responseTime: Date.now() - startTime,
          });

          return c.json({ error: "Invalid signature" }, 401);
        }
      }

      const validatedPayload = webhook.schema.parse(body);

      const event = await saveEvent({
        webhookName: webhook.name,
        path: requestPath,
        method,
        headers,
        body: validatedPayload,
        status: "received",
      });

      try {
        await webhook.handler(validatedPayload);

        await updateEventStatus(event.id, "success", Date.now() - startTime);

        console.log(
          `✓ ${webhook.name} processed successfully (${
            Date.now() - startTime
          }ms)`
        );

        return c.json({ success: true, eventId: event.id });
      } catch (handlerError) {
        const errorMessage =
          handlerError instanceof Error
            ? handlerError.message
            : "Handler error";

        await updateEventStatus(
          event.id,
          "failed",
          Date.now() - startTime,
          errorMessage
        );

        console.error(`✗ ${webhook.name} handler failed:`, errorMessage);

        return c.json(
          { error: "Handler execution failed", details: errorMessage },
          500
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error(`✗ ${webhook.name} validation failed:`, errorMessage);

      return c.json({ error: "Validation failed", details: errorMessage }, 400);
    }
  });

  return {
    app,
    async loadWebhooks() {
      webhooks = await loadWebhooks(hooksDir);
      return webhooks;
    },
    getWebhooks() {
      return webhooks;
    },
  };
}
