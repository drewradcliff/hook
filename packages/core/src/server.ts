import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  saveEvent,
  getEvents,
  getEventById,
  updateEventStatus,
} from "./events.js";
import { replayEvent } from "./replay.js";
import { scanWebhooks, type WebhookMetadata } from "./scanner.js";
import type { HookConfig } from "./config.js";
import path from "path";
import fs from "fs";

export interface ServerOptions {
  port?: number;
  config?: HookConfig;
  dashboardDir?: string;
  proxyUrl?: string;
}

export function createServer(options: ServerOptions = {}) {
  const app = new Hono();
  const { config, dashboardDir, proxyUrl = "http://localhost:3000" } = options;

  let webhooks = new Map<string, WebhookMetadata>();

  app.use("/api/*", cors());
  app.use("/*", cors());

  app.get("/api/events", async (c) => {
    const limit = Number(c.req.query("limit")) || 100;
    const offset = Number(c.req.query("offset")) || 0;
    const webhookName = c.req.query("webhookName");
    const status = c.req.query("status");

    const events = await getEvents({ limit, offset, webhookName, status });
    return c.json({ events });
  });

  app.get("/api/events/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const event = await getEventById(id);

    if (!event) {
      return c.json({ error: "Event not found" }, 404);
    }

    return c.json({ event });
  });

  app.post("/api/events/:id/replay", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await replayEvent(id, webhooks, proxyUrl);

    return c.json(result);
  });

  if (dashboardDir && fs.existsSync(dashboardDir)) {
    app.use(
      "/*",
      serveStatic({
        root: dashboardDir,
      })
    );
  }

  app.get("/", async (c) => {
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
      (w) => w.path === requestPath
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

      // Save event as received
      const event = await saveEvent({
        webhookName: webhook.name,
        path: requestPath,
        method,
        headers,
        body,
        status: "received",
      });

      const targetUrl = `${proxyUrl}${webhook.path}`;
      console.log(`→ Proxying ${method} ${requestPath} to ${targetUrl}`);

      const proxyResponse = await fetch(targetUrl, {
        method,
        headers: {
          ...headers,
          host: new URL(proxyUrl).host,
        },
        body: rawBody,
      });

      const responseTime = Date.now() - startTime;
      const responseBody = await proxyResponse.text();
      let responseJson;

      try {
        responseJson = JSON.parse(responseBody);
      } catch {
        responseJson = responseBody;
      }

      // Update event status based on response
      if (proxyResponse.ok) {
        await updateEventStatus(event.id, "success", responseTime);
        console.log(
          `✓ ${webhook.name} processed successfully (${responseTime}ms)`
        );
      } else {
        const errorMessage =
          responseJson?.error || `HTTP ${proxyResponse.status}`;
        await updateEventStatus(event.id, "failed", responseTime, errorMessage);
        console.error(
          `✗ ${webhook.name} failed: ${errorMessage} (${responseTime}ms)`
        );
      }

      return c.json(responseJson, proxyResponse.status as any);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const responseTime = Date.now() - startTime;

      console.error(`✗ ${webhook.name} proxy error:`, errorMessage);

      return c.json({ error: "Proxy failed", details: errorMessage }, 500);
    }
  });

  return {
    app,
    scanWebhooks() {
      if (config?.webhooks) {
        webhooks = scanWebhooks(config.webhooks);
      }
      return webhooks;
    },
    getWebhooks() {
      return webhooks;
    },
  };
}
