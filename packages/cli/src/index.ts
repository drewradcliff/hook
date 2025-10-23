#!/usr/bin/env node

import { Command } from "commander";
import { devCommand } from "./commands/dev.js";
import { replayCommand } from "./commands/replay.js";

const program = new Command();

program
  .name("hook")
  .description("TypeScript-native webhook platform")
  .version("0.1.0");

program
  .command("dev")
  .description("Start local development server")
  .action(devCommand);

program
  .command("replay <eventId>")
  .description("Replay a specific event")
  .action(replayCommand);

program.parse();
