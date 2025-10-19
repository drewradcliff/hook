import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  webhookName: text("webhook_name").notNull(),
  path: text("path").notNull(),
  method: text("method").notNull(),
  headers: text("headers").notNull(), // JSON string
  body: text("body").notNull(), // JSON string
  status: text("status").notNull().default("received"), // received, success, failed
  responseTime: integer("response_time"), // milliseconds
  error: text("error"), // error message if failed
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
