import { handleWebhook } from "@hook/core/next";
import { z } from "zod";

const exampleSchema = z.object({
  message: z.string(),
  timestamp: z.string().optional(),
});

export const POST = handleWebhook(exampleSchema, async (payload) => {
  console.log("Received webhook:", payload.message);

  // Business logic here
  // payload is fully typed: payload.message is string, payload.timestamp is string | undefined

  return { success: true, received: payload.message };
});
