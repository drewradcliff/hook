import { createServer, initDatabase } from "@hook/core";
import { watch } from "chokidar";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function devCommand() {
  const port = 3420;
  const hooksDir = ".hook/hooks";

  try {
    console.log(chalk.dim("Initializing database..."));
    initDatabase();

    console.log(chalk.dim("Creating server..."));
    const dashboardDir = findDashboardDir();
    const server = createServer({ port, hooksDir, dashboardDir });

    console.log(chalk.dim("Loading webhooks...\n"));
    await server.loadWebhooks();

    const webhooks = server.getWebhooks();
    if (webhooks.size === 0) {
      console.log(
        chalk.yellow("⚠ No webhooks found. Run"),
        chalk.cyan("hook init"),
        chalk.yellow("to create an example.")
      );
    }

    const { serve } = await import("@hono/node-server");
    const srv = serve({
      fetch: server.app.fetch,
      port,
    });

    console.log(chalk.bold.green(`\n✓ Hook server running!\n`));
    console.log(
      chalk.dim("Server:    "),
      chalk.cyan(`http://localhost:${port}`)
    );
    console.log(
      chalk.dim("Dashboard: "),
      chalk.cyan(`http://localhost:${port}/_dashboard`)
    );
    console.log(
      chalk.dim("API:       "),
      chalk.cyan(`http://localhost:${port}/_api/events`)
    );

    if (webhooks.size > 0) {
      console.log(chalk.dim("\nWebhook endpoints:"));
      webhooks.forEach((webhook) => {
        console.log(
          chalk.dim("  •"),
          chalk.cyan(`${webhook.method} ${webhook.path}`),
          chalk.dim(`(${webhook.name})`)
        );
      });
    }

    console.log(chalk.dim("\nWatching for changes...\n"));

    const watcher = watch(hooksDir, {
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on("all", async (event, filePath) => {
      console.log(chalk.dim(`\n[${event}] ${filePath}`));
      console.log(chalk.dim("Reloading webhooks...\n"));
      await server.loadWebhooks();

      const webhooks = server.getWebhooks();
      console.log(chalk.green(`✓ Loaded ${webhooks.size} webhook(s)\n`));
    });

    const shutdown = () => {
      console.log(chalk.dim("\n\nShutting down..."));
      watcher.close();
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
    path.join(__dirname, "../../../dashboard/dist"),
    path.join(__dirname, "../../../../dashboard/dist"),
    path.join(process.cwd(), "node_modules/@hook/dashboard/dist"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return undefined;
}
