import { z } from "zod";

export function handleWebhook<T extends z.ZodType>(
  schema: T,
  handler: (payload: z.infer<T>) => Promise<any> | any
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      // Parse request body
      const body = await request.json();

      // Validate against schema
      const parseResult = schema.safeParse(body);

      if (!parseResult.success) {
        return Response.json(
          {
            error: "Validation failed",
            issues: parseResult.error.issues,
          },
          { status: 400 }
        );
      }

      // Call user's handler with validated payload
      const result = await handler(parseResult.data);

      // Return success response
      return Response.json(result, { status: 200 });
    } catch (error) {
      // Handle errors from parsing or handler execution
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";

      return Response.json(
        {
          error: errorMessage,
        },
        { status: 500 }
      );
    }
  };
}
