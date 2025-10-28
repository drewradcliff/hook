import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";

export type WebhookProvider = "github";

export interface HookOptions<T extends z.ZodType> {
  schema: T;
  secret?: string;
  provider?: WebhookProvider;
}

async function verifyGitHubSignature(
  request: Request,
  body: string,
  secret: string
): Promise<boolean> {
  const signature = request.headers.get("x-hub-signature-256");
  
  if (!signature) {
    return false;
  }

  const hmac = createHmac("sha256", secret);
  hmac.update(body);
  const expectedSignature = `sha256=${hmac.digest("hex")}`;

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

async function verifySignature(
  request: Request,
  body: string,
  secret: string,
  provider: WebhookProvider
): Promise<boolean> {
  switch (provider) {
    case "github":
      return verifyGitHubSignature(request, body, secret);
    default:
      return false;
  }
}

export async function hook<T extends z.ZodType>(
  request: Request,
  schemaOrOptions: T | HookOptions<T>
): Promise<
  | { data: z.infer<T>; error: null }
  | { data: null; error: { message: string; issues?: any[] } }
> {
  try {
    // Handle both old and new API
    const options: HookOptions<T> =
      "schema" in schemaOrOptions
        ? schemaOrOptions
        : { schema: schemaOrOptions };

    const { schema, secret, provider } = options;

    // Get the raw body for signature verification
    const rawBody = await request.text();

    // Verify signature if secret and provider are provided
    if (secret && provider) {
      const isValid = await verifySignature(request, rawBody, secret, provider);
      
      if (!isValid) {
        return {
          data: null,
          error: {
            message: "Invalid signature",
          },
        };
      }
    }

    // Parse the body
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return {
        data: null,
        error: {
          message: "Failed to parse JSON body",
        },
      };
    }

    // Validate against schema
    const parseResult = schema.safeParse(body);

    if (!parseResult.success) {
      return {
        data: null,
        error: {
          message: "Validation failed",
          issues: parseResult.error.issues,
        },
      };
    }

    return { data: parseResult.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error instanceof Error ? error.message : "Failed to parse request",
      },
    };
  }
}
