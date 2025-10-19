import chalk from "chalk";

export async function replayCommand(
  eventId: string,
  options?: { port?: number }
) {
  try {
    const id = Number(eventId);
    if (isNaN(id)) {
      console.error(chalk.red("Error: Event ID must be a number"));
      process.exit(1);
    }

    const port = options?.port || 3420;
    const url = `http://localhost:${port}/_api/events/${id}/replay`;

    console.log(chalk.dim(`Replaying event ${id}...`));

    const response = await fetch(url, { method: "POST" });

    if (!response.ok) {
      if (response.status === 404) {
        console.error(
          chalk.red(`Error: Event ${id} not found or server not running`)
        );
        console.log(
          chalk.dim(
            `\nMake sure the dev server is running: ${chalk.cyan("pnpm dev")}`
          )
        );
      } else {
        const error = await response.text();
        console.error(chalk.red(`Error: ${error}`));
      }
      process.exit(1);
    }

    const result = (await response.json()) as {
      success: boolean;
      responseTime: number;
      error?: string;
    };

    if (result.success) {
      console.log(chalk.green("\n✓ Event replayed successfully"));
      console.log(chalk.dim(`Response time: ${result.responseTime}ms`));
      console.log(
        chalk.dim("\nCheck the dev server terminal for handler output.")
      );
    } else {
      console.error(chalk.red("\n✗ Event replay failed"));
      console.error(chalk.red(`Error: ${result.error}`));
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      console.error(chalk.red("Error: Could not connect to dev server"));
      console.log(
        chalk.dim(
          `\nMake sure the dev server is running: ${chalk.cyan("pnpm dev")}`
        )
      );
    } else {
      console.error(chalk.red("Error replaying event:"), error);
    }
    process.exit(1);
  }
}
