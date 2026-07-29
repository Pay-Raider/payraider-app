import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * GET /api/openapi
 *
 * Serves docs/openapi.json from the repository root at runtime.
 * The file is read from the filesystem so it is always in sync with
 * the committed spec without requiring a separate static-file copy.
 *
 * During `next build --output standalone` the public/ directory is
 * bundled, but process.cwd() points to the repo root in dev and to
 * the standalone bundle root in production — so we also fall back to
 * /public/openapi.json which is copied there by the CI pipeline.
 */
export async function GET() {
  let spec: string;

  const candidates = [
    // Repo root (dev server, standard build)
    join(process.cwd(), "..", "docs", "openapi.json"),
    // Standalone bundle / Docker image
    join(process.cwd(), "public", "openapi.json"),
  ];

  let loaded = false;
  for (const candidate of candidates) {
    try {
      spec = readFileSync(candidate, "utf-8");
      loaded = true;
      break;
    } catch {
      // try next candidate
    }
  }

  if (!loaded) {
    return NextResponse.json(
      { error: "OpenAPI spec not found" },
      { status: 404 }
    );
  }

  return new NextResponse(spec!, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
