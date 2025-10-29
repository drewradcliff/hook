const API_BASE = "/api";

export interface Event {
  id: number;
  webhookName: string;
  path: string;
  method: string;
  headers: string;
  body: string;
  status: "received" | "success" | "failed";
  responseTime: number | null;
  error: string | null;
  timestamp: string;
}

export interface EventsResponse {
  events: Event[];
}

export interface EventResponse {
  event: Event;
}

export interface ReplayResponse {
  success: boolean;
  error?: string;
  responseTime: number;
}

export async function fetchEvents(params?: {
  limit?: number;
  offset?: number;
  webhookName?: string;
  status?: string;
}): Promise<Event[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.webhookName) query.set("webhookName", params.webhookName);
  if (params?.status) query.set("status", params.status);

  const response = await fetch(`${API_BASE}/events?${query}`);
  if (!response.ok) throw new Error("Failed to fetch events");

  const data: EventsResponse = await response.json();
  return data.events;
}

export async function fetchEvent(id: number): Promise<Event> {
  const response = await fetch(`${API_BASE}/events/${id}`);
  if (!response.ok) throw new Error("Failed to fetch event");

  const data: EventResponse = await response.json();
  return data.event;
}

export async function replayEvent(id: number): Promise<ReplayResponse> {
  const response = await fetch(`${API_BASE}/events/${id}/replay`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to replay event");

  return response.json();
}

export interface Webhook {
  name: string;
  path: string;
  mockData: any;
  mockHeaders?: Record<string, string>;
}

export interface WebhooksResponse {
  webhooks: Webhook[];
}

export interface TestWebhookResponse {
  success: boolean;
  status?: number;
  responseTime: number;
  data?: any;
  error?: string;
}

export interface MockDataResponse {
  mockData: any;
}

export async function fetchWebhooks(): Promise<Webhook[]> {
  const response = await fetch(`${API_BASE}/webhooks`);
  if (!response.ok) throw new Error("Failed to fetch webhooks");

  const data: WebhooksResponse = await response.json();
  return data.webhooks;
}

export async function scanWebhooks(): Promise<Webhook[]> {
  const response = await fetch(`${API_BASE}/webhooks/scan`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to scan webhooks");

  const data: WebhooksResponse = await response.json();
  return data.webhooks;
}

export async function testWebhook(
  name: string,
  mockData: any,
  headers?: Record<string, string>
): Promise<TestWebhookResponse> {
  const response = await fetch(`${API_BASE}/webhooks/${name}/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mockData, headers }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to test webhook");
  }

  return response.json();
}

export async function getMockData(name: string): Promise<any> {
  const response = await fetch(`${API_BASE}/webhooks/${name}/mock`);
  if (!response.ok) throw new Error("Failed to fetch mock data");

  const data: MockDataResponse = await response.json();
  return data.mockData;
}

export async function saveMockData(
  name: string,
  mockData: any,
  mockHeaders?: Record<string, string>
): Promise<any> {
  const response = await fetch(`${API_BASE}/webhooks/${name}/mock`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mockData, mockHeaders }),
  });

  if (!response.ok) throw new Error("Failed to save mock data");

  const data: MockDataResponse = await response.json();
  return data.mockData;
}
