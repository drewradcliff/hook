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
