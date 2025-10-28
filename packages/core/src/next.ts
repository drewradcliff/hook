import { z } from "zod";

export async function hook<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<
  | { data: z.infer<T>; error: null }
  | { data: null; error: { message: string; issues?: any[] } }
> {
  try {
    const body = await request.json();
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
