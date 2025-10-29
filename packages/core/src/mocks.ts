import { eq } from "drizzle-orm";
import { getDatabase } from "./db/index.js";
import {
  webhookMocks,
  type WebhookMock,
  type NewWebhookMock,
} from "./db/schema.js";

export async function getMockData(
  webhookName: string
): Promise<WebhookMock | null> {
  const db = getDatabase();
  const result = await db
    .select()
    .from(webhookMocks)
    .where(eq(webhookMocks.webhookName, webhookName))
    .limit(1);

  return result[0] || null;
}

export async function saveMockData(
  webhookName: string,
  path: string,
  mockData: any,
  mockHeaders?: Record<string, string>
): Promise<WebhookMock> {
  const db = getDatabase();
  const now = new Date();

  const existing = await getMockData(webhookName);

  if (existing) {
    const result = await db
      .update(webhookMocks)
      .set({
        path,
        mockData: JSON.stringify(mockData),
        mockHeaders: mockHeaders ? JSON.stringify(mockHeaders) : undefined,
        updatedAt: now,
      })
      .where(eq(webhookMocks.webhookName, webhookName))
      .returning();

    return result[0];
  } else {
    const mockDataRecord: NewWebhookMock = {
      webhookName,
      path,
      mockData: JSON.stringify(mockData),
      mockHeaders: mockHeaders ? JSON.stringify(mockHeaders) : null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .insert(webhookMocks)
      .values(mockDataRecord)
      .returning();

    return result[0];
  }
}

export async function getAllMocks(): Promise<WebhookMock[]> {
  const db = getDatabase();
  return db.select().from(webhookMocks);
}
