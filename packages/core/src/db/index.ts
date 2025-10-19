import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import path from "path";
import fs from "fs";

let db: ReturnType<typeof drizzle> | null = null;

export function initDatabase(dbPath: string = ".hook/events.db") {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const client = createClient({
    url: `file:${path.resolve(dbPath)}`,
  });

  db = drizzle(client, { schema });

  initSchema();

  return db;
}

async function initSchema() {
  if (!db) return;

  await db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webhook_name TEXT NOT NULL,
      path TEXT NOT NULL,
      method TEXT NOT NULL,
      headers TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'received',
      response_time INTEGER,
      error TEXT,
      timestamp INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_webhook_name ON events(webhook_name);
    CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_status ON events(status);
  `);
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

export { schema };
