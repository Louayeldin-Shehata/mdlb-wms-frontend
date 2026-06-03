import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  // Simple DB connectivity check for scaffolding.
  // We intentionally avoid assuming any tables exist yet.
  await prisma.$queryRaw`SELECT 1`;

  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
}

