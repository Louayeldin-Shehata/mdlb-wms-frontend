import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { presignPutObject } from "@/lib/storage";

export const runtime = "nodejs";

type Body = {
  contentType: string;
  folder?: string; // e.g. "products" | "variants"
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json()) as Partial<Body>;
  if (!body.contentType || typeof body.contentType !== "string") {
    return new Response("Missing contentType", { status: 400 });
  }

  const folder =
    body.folder && typeof body.folder === "string" ? body.folder : "uploads";
  const ext = body.contentType.split("/")[1] || "bin";
  const key = `${folder}/${uuidv4()}.${ext}`;

  const presign = await presignPutObject({ key, contentType: body.contentType });

  return Response.json(presign);
}

