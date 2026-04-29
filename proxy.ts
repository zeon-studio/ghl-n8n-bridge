import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  burstRateLimit,
  tokenRateLimit,
  webhookRateLimit,
} from "./src/lib/rate-limit";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response to allow adding headers
  const response = NextResponse.next();

  // 1. Tracing ID
  const traceId = crypto.randomUUID();
  response.headers.set("x-trace-id", traceId);

  // Skip rate limiting if Redis isn't configured
  if (!tokenRateLimit || !webhookRateLimit || !burstRateLimit) {
    return response;
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  try {
    // 2. Global burst protection (10/sec)
    const burstRes = await burstRateLimit.limit(ip);
    if (!burstRes.success) {
      return NextResponse.json(
        { error: "RATE_LIMIT_EXCEEDED", message: "Too many requests (burst)" },
        { status: 429, headers: { "Retry-After": "1" } },
      );
    }

    // 3. Endpoint-specific rate limiting
    if (pathname.startsWith("/api/v1/")) {
      // For token endpoint and webhook registration, we rate limit by bridge_key if available, else by IP
      const bridgeKey = request.nextUrl.searchParams.get("bridge_key");
      const identifier = bridgeKey || ip;

      const { success, limit, reset, remaining } =
        await tokenRateLimit.limit(identifier);

      response.headers.set("X-RateLimit-Limit", limit.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", reset.toString());

      if (!success) {
        return NextResponse.json(
          {
            error: "RATE_LIMIT_EXCEEDED",
            message: "Rate limit exceeded (60 req/min)",
          },
          { status: 429, headers: response.headers },
        );
      }
    } else if (pathname.startsWith("/api/webhook")) {
      // For GHL webhooks, rate limit by locationId if present in payload (would need to parse stream,
      // which is tricky in proxy), so we rate limit globally by IP (GHL IP).
      const { success } = await webhookRateLimit.limit(ip);

      if (!success) {
        return NextResponse.json(
          {
            error: "RATE_LIMIT_EXCEEDED",
            message: "Webhook ingestion limit exceeded",
          },
          { status: 429 },
        );
      }
    }
  } catch (error) {
    // Fail open if Redis is down
    console.warn("Rate limiter check failed:", error);
  }

  // 4. CORS for API routes
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-ghl-signature",
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
