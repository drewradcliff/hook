import { eq, desc } from "drizzle-orm";
import { getDatabase } from "./db/index.js";
import { events, type NewEvent, type Event } from "./db/schema.js";

export interface SaveEventData {
  webhookName: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  status?: "received" | "success" | "failed";
  responseTime?: number;
  error?: string;
}

export async function saveEvent(data: SaveEventData): Promise<Event> {
  const db = getDatabase();

  const eventData: NewEvent = {
    webhookName: data.webhookName,
    path: data.path,
    method: data.method,
    headers: JSON.stringify(data.headers),
    body: JSON.stringify(data.body),
    status: data.status || "received",
    responseTime: data.responseTime,
    error: data.error,
    timestamp: new Date(),
  };

  const result = await db.insert(events).values(eventData).returning();
  return result[0];
}

export interface GetEventsOptions {
  limit?: number;
  offset?: number;
  webhookName?: string;
  status?: string;
}

export async function getEvents(
  options: GetEventsOptions = {}
): Promise<Event[]> {
  const db = getDatabase();
  const { limit = 100, offset = 0 } = options;

  let query = db.select().from(events).orderBy(desc(events.timestamp));

  if (options.webhookName) {
    query = query.where(eq(events.webhookName, options.webhookName)) as any;
  }

  if (options.status) {
    query = query.where(eq(events.status, options.status)) as any;
  }

  return query.limit(limit).offset(offset);
}

export async function getEventById(id: number): Promise<Event | null> {
  const db = getDatabase();
  const result = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  return result[0] || null;
}

export async function updateEventStatus(
  id: number,
  status: "received" | "success" | "failed",
  responseTime?: number,
  error?: string
): Promise<void> {
  const db = getDatabase();
  await db
    .update(events)
    .set({
      status,
      responseTime,
      error,
    })
    .where(eq(events.id, id));
}
