import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import type { WebhookDefinition } from "./define.js";

export async function loadWebhooks(
  hooksDir: string = ".hook/hooks"
): Promise<Map<string, WebhookDefinition>> {
  const webhooks = new Map<string, WebhookDefinition>();

  if (!fs.existsSync(hooksDir)) {
    console.warn(`Hooks directory not found: ${hooksDir}`);
    return webhooks;
  }

  const files = fs
    .readdirSync(hooksDir)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  for (const file of files) {
    try {
      const filePath = path.resolve(hooksDir, file);
      const fileUrl = pathToFileURL(filePath).href;

      // Dynamic import with cache busting for hot reload
      const module = await import(`${fileUrl}?t=${Date.now()}`);
      const webhook = module.default as WebhookDefinition;

      if (!webhook || !webhook.name || !webhook.path) {
        console.warn(`Invalid webhook definition in ${file}`);
        continue;
      }

      webhooks.set(webhook.name, webhook);
      console.log(`✓ Loaded webhook: ${webhook.name} -> ${webhook.path}`);
    } catch (error) {
      console.error(`Error loading webhook from ${file}:`, error);
    }
  }

  return webhooks;
}
