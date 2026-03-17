import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");

  if (!target) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new Response("Only http/https protocols are allowed", { status: 400 });
  }

  const upstream = await fetch(parsed.toString());

  if (!upstream.ok || !upstream.body) {
    return new Response("Failed to fetch image", { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/*";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": contentType,
      // Do not send any Cross-Origin-Resource-Policy header so this image
      // can be embedded on this origin even when the app uses COOP/COEP.
      "cache-control": "public, max-age=3600",
    },
  });
}

