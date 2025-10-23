import { getEventById, updateEventStatus } from "./events.js";
import type { WebhookMetadata } from "./scanner.js";

export interface ReplayResult {
  success: boolean;
  error?: string;
  responseTime: number;
}

export async function replayEvent(
  eventId: number,
  webhooks: Map<string, WebhookMetadata>,
  proxyUrl: string = "http://localhost:3000"
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

    const body = event.body;
    const headers = JSON.parse(event.headers);

    console.log(`🔄 Replaying event #${eventId}: ${event.webhookName}`);

    const targetUrl = `${proxyUrl}${webhook.path}`;
    const response = await fetch(targetUrl, {
      method: event.method,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: body,
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      await updateEventStatus(eventId, "success", responseTime);
      return {
        success: true,
        responseTime,
      };
    } else {
      const errorText = await response.text();
      const errorMessage = `HTTP ${response.status}: ${errorText}`;
      await updateEventStatus(eventId, "failed", responseTime, errorMessage);
      return {
        success: false,
        error: errorMessage,
        responseTime,
      };
    }
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
