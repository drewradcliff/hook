import { getEventById, updateEventStatus } from "./events.js";
import type { WebhookDefinition } from "./define.js";

export interface ReplayResult {
  success: boolean;
  error?: string;
  responseTime: number;
}

export async function replayEvent(
  eventId: number,
  webhooks: Map<string, WebhookDefinition>
): Promise<ReplayResult> {
  const startTime = Date.now();

  try {
    const event = await getEventById(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    const webhook = webhooks.get(event.webhookName);
    if (!webhook) {
      throw new Error(`Webhook ${event.webhookName} not found`);
    }

    const body = JSON.parse(event.body);

    const validatedPayload = webhook.schema.parse(body);

    console.log(`🔄 Replaying event #${eventId}: ${event.webhookName}`);
    await webhook.handler(validatedPayload);

    const responseTime = Date.now() - startTime;

    await updateEventStatus(eventId, "success", responseTime);

    return {
      success: true,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await updateEventStatus(eventId, "failed", responseTime, errorMessage);

    return {
      success: false,
      error: errorMessage,
      responseTime,
    };
  }
}
