import { createServer, initDatabase, loadConfig } from "@hook/core";
import { watch } from "chokidar";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function devCommand() {
  const port = 3420;

  try {
    console.log(chalk.dim("Loading configuration..."));
    const config = await loadConfig();

    console.log(chalk.dim("Initializing database..."));
    const dbPath = path.join(config.out, "events.db");
    await initDatabase(dbPath);

    console.log(chalk.dim("Creating server..."));
    const dashboardDir = findDashboardDir();
    const server = createServer({ port, config, dashboardDir });

    console.log(chalk.dim("Scanning webhooks...\n"));
    server.scanWebhooks();

    const webhooks = server.getWebhooks();
    if (webhooks.size === 0) {
      console.log(
        chalk.yellow("⚠ No webhooks found in"),
        chalk.cyan(config.webhooks)
      );
      console.log(chalk.dim("  Create route files to define webhooks"));
    }

    const { serve } = await import("@hono/node-server");
    const srv = serve({
      fetch: server.app.fetch,
      port,
    });

    console.log(chalk.bold.green(`\n✓ Hook server running!\n`));
    console.log(
      chalk.dim("Dashboard: "),
      chalk.cyan(`http://localhost:${port}/`)
    );

    if (webhooks.size > 0) {
      console.log(chalk.dim("\nWebhook endpoints:"));
      webhooks.forEach((webhook) => {
        console.log(
          chalk.dim("  •"),
          chalk.cyan(webhook.path),
          chalk.dim(`(${webhook.name})`)
        );
      });
    }

    console.log(chalk.dim("\nWatching for changes...\n"));

    const webhooksDir = path.resolve(config.webhooks);
    let watcher: ReturnType<typeof watch> | null = null;

    if (fs.existsSync(webhooksDir)) {
      watcher = watch(webhooksDir, {
        persistent: true,
        ignoreInitial: true,
      });

      watcher.on("all", async (event, filePath) => {
        console.log(chalk.dim(`\n[${event}] ${filePath}`));
        console.log(chalk.dim("Rescanning webhooks...\n"));
        server.scanWebhooks();

        const webhooks = server.getWebhooks();
        console.log(chalk.green(`✓ Found ${webhooks.size} webhook(s)\n`));
      });
    }

    const shutdown = () => {
      console.log(chalk.dim("\n\nShutting down..."));
      if (watcher) {
        watcher.close();
      }
      srv.close(() => {
        console.log(chalk.dim("Server closed"));
        process.exit(0);
      });

      setTimeout(() => {
        console.log(chalk.yellow("Force closing..."));
        process.exit(1);
      }, 2000);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("SIGHUP", shutdown);
  } catch (error) {
    console.error(chalk.red("Error starting dev server:"), error);
    process.exit(1);
  }
}

function findDashboardDir(): string | undefined {
  const possiblePaths = [
    // When running from dist or src (both resolve to cli package root)
    path.join(__dirname, "../../dashboard"),
    // When running from monorepo root in development
    path.join(__dirname, "../../../dashboard/dist"),
    // When installed as a package
    path.join(process.cwd(), "node_modules/hook/dashboard"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return undefined;
}
