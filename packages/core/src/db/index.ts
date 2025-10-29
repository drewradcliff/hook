import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";
import path from "path";
import fs from "fs";

let db: ReturnType<typeof drizzle> | null = null;

export async function initDatabase(dbPath: string = "./.hook/events.db") {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const client = createClient({
    url: `file:${path.resolve(dbPath)}`,
  });

  db = drizzle(client, { schema });

  await initSchema();

  return db;
}

async function initSchema() {
  if (!db) return;

  await db.run(sql`
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
    )
  `);

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_webhook_name ON events(webhook_name)`
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp DESC)`
  );
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_status ON events(status)`);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS webhook_mocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webhook_name TEXT NOT NULL UNIQUE,
      path TEXT NOT NULL,
      mock_data TEXT NOT NULL,
      mock_headers TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Migration: Add mock_headers column if it doesn't exist
  try {
    await db.run(sql`ALTER TABLE webhook_mocks ADD COLUMN mock_headers TEXT`);
  } catch {
    // Column already exists, ignore error
  }

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_webhook_mocks_name ON webhook_mocks(webhook_name)`
  );
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

export { schema };
