import fs from "fs";
import path from "path";
import chalk from "chalk";

export async function initCommand() {
  const hooksDir = ".hook/hooks";

  try {
    if (!fs.existsSync(".hook")) {
      fs.mkdirSync(".hook");
      console.log(chalk.green("✓ Created .hook directory"));
    }

    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
      console.log(chalk.green("✓ Created .hook/hooks directory"));
    }

    const exampleWebhook = `import { z } from 'zod';
import { defineWebhook } from '@hook/core';

const exampleSchema = z.object({
  message: z.string(),
  timestamp: z.string().optional(),
});

export default defineWebhook({
  name: 'example',
  path: '/webhooks/example',
  method: 'POST',
  schema: exampleSchema,
  handler: async (payload) => {
    console.log('Received webhook:', payload.message);
  },
});
`;

    const examplePath = path.join(hooksDir, "example.ts");
    if (!fs.existsSync(examplePath)) {
      fs.writeFileSync(examplePath, exampleWebhook);
      console.log(
        chalk.green("✓ Created example webhook: .hook/hooks/example.ts")
      );
    }

    const gitignorePath = ".gitignore";
    const gitignoreEntries = [
      ".hook/events.db",
      ".hook/events.db-journal",
      ".hook/events.db-shm",
      ".hook/events.db-wal",
    ];

    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
      const linesToAdd = gitignoreEntries.filter(
        (entry) => !gitignoreContent.includes(entry)
      );

      if (linesToAdd.length > 0) {
        fs.appendFileSync(gitignorePath, "\n" + linesToAdd.join("\n") + "\n");
        console.log(chalk.green("✓ Updated .gitignore"));
      }
    } else {
      fs.writeFileSync(gitignorePath, gitignoreEntries.join("\n") + "\n");
      console.log(chalk.green("✓ Created .gitignore"));
    }

    const gitkeepPath = ".hook/.gitkeep";
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(
        gitkeepPath,
        "# This file ensures the .hook directory is tracked by git\n"
      );
      console.log(chalk.green("✓ Created .hook/.gitkeep"));
    }

    console.log(chalk.bold("\n🎉 Hook initialized successfully!"));
    console.log(chalk.dim("\nNext steps:"));
    console.log(
      chalk.dim("  1. Run"),
      chalk.cyan("npx hook dev"),
      chalk.dim("to start the server")
    );
    console.log(
      chalk.dim("  2. Visit"),
      chalk.cyan("http://localhost:3420/_dashboard"),
      chalk.dim("to view events")
    );
    console.log(
      chalk.dim("  3. Test with:"),
      chalk.cyan(
        'curl -X POST http://localhost:3420/webhooks/example -d \'{"message":"hello"}\''
      )
    );
  } catch (error) {
    console.error(chalk.red("Error initializing hook:"), error);
    process.exit(1);
  }
}
