import fs from "fs";
import path from "path";

export interface WebhookMetadata {
  name: string;
  path: string;
}

/**
 * Scans a directory for webhook route files and extracts metadata
 * @param webhooksDir - Base directory containing webhook routes (e.g., './app/api/webhooks')
 * @returns Map of webhook name to metadata
 */
export function scanWebhooks(
  webhooksDir: string
): Map<string, WebhookMetadata> {
  const webhooks = new Map<string, WebhookMetadata>();
  const resolvedDir = path.resolve(process.cwd(), webhooksDir);

  if (!fs.existsSync(resolvedDir)) {
    console.warn(`Webhooks directory not found: ${webhooksDir}`);
    return webhooks;
  }

  // Extract the base path pattern for Next.js App Router
  // e.g., './app/api/webhooks' -> '/api/webhooks' (strip leading ./ and app/)
  let basePath = webhooksDir.replace(/^\.\//, "").replace(/\\/g, "/");

  // Remove 'app/' prefix if present (Next.js App Router convention)
  if (basePath.startsWith("app/")) {
    basePath = basePath.substring(4);
  }

  // Ensure leading slash
  if (!basePath.startsWith("/")) {
    basePath = "/" + basePath;
  }

  scanDirectory(resolvedDir, resolvedDir, basePath, webhooks);

  return webhooks;
}

function scanDirectory(
  dir: string,
  baseDir: string,
  basePath: string,
  webhooks: Map<string, WebhookMetadata>
): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      scanDirectory(fullPath, baseDir, basePath, webhooks);
    } else if (
      entry.isFile() &&
      (entry.name === "route.ts" || entry.name === "route.js")
    ) {
      // Found a route file, extract metadata
      const relativePath = path.relative(baseDir, dir);
      const webhookPath = path.join(basePath, relativePath).replace(/\\/g, "/");

      // Generate name from path
      // e.g., '/api/webhooks/example' -> 'example'
      // e.g., '/api/webhooks/github/push' -> 'github.push'
      const pathSegments = relativePath.split(path.sep).filter(Boolean);
      const name = pathSegments.length > 0 ? pathSegments.join(".") : "root";

      webhooks.set(name, {
        name,
        path: webhookPath,
      });

      console.log(`✓ Detected webhook: ${name} -> ${webhookPath}`);
    }
  }
}
