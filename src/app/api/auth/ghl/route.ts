import { NextResponse } from "next/server";
import { GHL_SCOPES_STRING } from "@/lib/ghl/scopes";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const base = process.env.GHL_BASE_URL || "https://marketplace.leadconnectorhq.com";
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
    const clientId = process.env.NEXT_PUBLIC_GHL_CLIENT_ID;

    if (!clientId) {
      throw new Error("Missing NEXT_PUBLIC_GHL_CLIENT_ID");
    }

    const params: Record<string, string> = {
      response_type: "code",
      redirect_uri: redirectUri,
      client_id: clientId,
      scope: GHL_SCOPES_STRING,
    };

    // Sometimes GHL requires version_id for unpublished or custom apps
    const appId = process.env.GHL_MARKETPLACE_APP_ID;
    if (appId) {
      params.version_id = appId;
    }

    const searchParams = new URLSearchParams(params);
    const authUrl = `${base}/oauth/chooselocation?${searchParams.toString()}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[GHL Auth] Failed to build authorization URL:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
