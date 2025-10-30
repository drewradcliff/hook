import path from "path";
import fs from "fs";

/**
 * Hook configuration options
 * @typedef {Object} HookConfig
 * @property {string} out - Directory where hook stores event database
 * @property {string} webhooks - Directory containing webhook route handlers
 * @property {string} [proxyUrl] - URL where your application is running (default: http://localhost:3000)
 */
export interface HookConfig {
  out: string;
  webhooks: string;
  proxyUrl?: string;
}

/**
 * Define hook configuration with type hints
 * @param {HookConfig} config - Hook configuration object
 * @returns {HookConfig}
 */
export function defineConfig(config: HookConfig): HookConfig {
  return config;
}

const DEFAULT_CONFIG: HookConfig = {
  out: "./.hook",
  webhooks: "./app/api/webhooks",
  proxyUrl: "http://localhost:3000",
};

export async function loadConfig(): Promise<HookConfig> {
  const cwd = process.cwd();
  const configFile = "hook.config.mjs";
  const fullPath = path.resolve(cwd, configFile);

  if (!fs.existsSync(fullPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    // Load ESM config using dynamic import
    const fileUrl = `file://${fullPath.replace(/\\/g, "/")}`;
    const module = await import(fileUrl);
    const config = module.default || module;

    return {
      ...DEFAULT_CONFIG,
      ...config,
    };
  } catch (error) {
    console.error(`Error loading config from ${configFile}:`);
    if (error instanceof Error) {
      console.error("  ", error.message);
    }
    console.error("Using default configuration");
    return DEFAULT_CONFIG;
  }
}
