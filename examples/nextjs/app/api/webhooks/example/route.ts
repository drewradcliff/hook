import { hook } from "@hook/core/handler";
import { z } from "zod";

const schema = z.object({
  message: z.string(),
  timestamp: z.string().optional(),
});

export const POST = async (req: Request) => {
  const { data, error } = await hook(req, schema);

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  console.log("Received webhook:", data.message);

  return Response.json({ success: true, received: data.message });
};
