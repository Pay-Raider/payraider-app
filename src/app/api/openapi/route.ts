import { NextResponse } from "next/server";

// The spec belongs to the backend (Pay-Raider/payraider-backend), which serves
// it at /api/docs/openapi.json. Proxy it so the docs page stays same-origin.
// Rendered per request so a build without a running backend does not bake in
// an error; the upstream fetch is cached for an hour.
export const dynamic = "force-dynamic";

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured" },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/docs/openapi.json`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend responded ${res.status}` },
        { status: 502 },
      );
    }
    return new NextResponse(await res.text(), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
