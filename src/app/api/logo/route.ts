import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

// Dev-time asset path provided via Cursor attachment.
// For production, copy this PNG into `frontend/public/` and reference it directly.
const LOGO_ABS_PATH = path.resolve(
  "/Users/louayeldin/.cursor/projects/Users-louayeldin-Desktop-mdlb-inv-sys/assets/mdlb-blk-wht-bg-logo-892c5dbc-bd5f-4fbd-ac71-7a49271877ae.png",
);

export const runtime = "nodejs";

export async function GET() {
  const buf = fs.readFileSync(LOGO_ABS_PATH);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

