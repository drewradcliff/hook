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

export const webhookMocks = sqliteTable("webhook_mocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  webhookName: text("webhook_name").notNull().unique(),
  path: text("path").notNull(),
  mockData: text("mock_data").notNull(), // JSON string
  mockHeaders: text("mock_headers"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type WebhookMock = typeof webhookMocks.$inferSelect;
export type NewWebhookMock = typeof webhookMocks.$inferInsert;
