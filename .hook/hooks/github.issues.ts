import { z } from "zod";
import { defineWebhook } from "../../packages/core/src/index.js";

export default defineWebhook({
  name: "github.issues",
  path: "/webhooks/github/issues",
  method: "POST",
  secret: process.env.GITHUB_WEBHOOK_SECRET,
  signatureHeader: "X-Hub-Signature-256",
  schema: z.object({
    action: z.string(),
    issue: z.object({
      id: z.number(),
      number: z.number(),
      title: z.string(),
      body: z.string().nullable(),
      state: z.string(),
      user: z.object({
        login: z.string(),
        id: z.number(),
      }),
    }),
    repository: z.object({
      name: z.string(),
      full_name: z.string(),
    }),
  }),
  handler: async (payload) => {
    console.log("GitHub Issues Event:", payload);
  },
});
