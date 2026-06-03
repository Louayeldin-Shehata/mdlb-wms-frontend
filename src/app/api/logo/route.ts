import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

// Serve the logo from the project's own `public/` directory so the path is
// portable across local dev and serverless deploys (no machine-specific paths).
const LOGO_PATH = path.join(process.cwd(), "public", "logo.svg");

export const runtime = "nodejs";

export async function GET() {
  try {
    const buf = fs.readFileSync(LOGO_PATH);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    // Asset missing — return 404 rather than throwing a 500.
    return new NextResponse("Logo not found", { status: 404 });
  }
}
