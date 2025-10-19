import { z } from "zod";
import { defineWebhook } from "../../packages/core/src/index.js";

const exampleSchema = z.object({
  message: z.string(),
  timestamp: z.string().optional(),
});

export default defineWebhook({
  name: "example",
  path: "/webhooks/example",
  method: "POST",
  schema: exampleSchema,
  handler: async (payload) => {
    console.log("Received webhook:", payload.message);
  },
});
