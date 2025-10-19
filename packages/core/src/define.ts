import { z } from "zod";

export interface WebhookConfig<T extends z.ZodType> {
  name: string;
  path: string;
  method?: string;
  secret?: string;
  signatureHeader?: string;
  schema: T;
  handler: (payload: z.infer<T>) => Promise<void> | void;
}

export function defineWebhook<T extends z.ZodType>(
  config: WebhookConfig<T>
): WebhookConfig<T> {
  return {
    ...config,
    method: config.method || "POST",
  };
}

export type WebhookDefinition = WebhookConfig<z.ZodType>;
