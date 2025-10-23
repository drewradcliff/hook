import path from "path";
import fs from "fs";

export interface HookConfig {
  out: string;
  webhooks: string;
}

export function defineConfig(config: HookConfig): HookConfig {
  return config;
}

const DEFAULT_CONFIG: HookConfig = {
  out: "./hook",
  webhooks: "./app/api/webhooks",
};

export async function loadConfig(
  configPath: string = "hook.config.ts"
): Promise<HookConfig> {
  const fullPath = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(fullPath)) {
    console.warn(
      `Config file not found at ${configPath}, using default configuration`
    );
    return DEFAULT_CONFIG;
  }

  try {
    // Use tsx to handle TypeScript files directly
    const { execSync } = await import("child_process");

    // Use tsx to evaluate the TypeScript file and capture the output
    const result = execSync(
      `npx tsx -e "import('${fullPath}').then(m => console.log(JSON.stringify(m.default)))"`,
      {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    const config = JSON.parse(result.trim());

    return {
      ...DEFAULT_CONFIG,
      ...config,
    };
  } catch (error) {
    console.error(`Error loading config from ${configPath}:`, error);
    return DEFAULT_CONFIG;
  }
}
