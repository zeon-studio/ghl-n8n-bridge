import { generateBridgeKey } from "@/lib/crypto/bridge-key";
import { encrypt } from "@/lib/crypto/encryption";
import {
  exchangeCodeForTokens,
  getInstalledLocations,
  getLocationToken,
} from "@/lib/ghl/oauth";
import { logger } from "@/lib/logger";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/client";
import {
  createBridgeKey,
  linkBridgeLocation,
  upsertInstallation,
  upsertLocationToken,
} from "@/lib/supabase/queries";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    logger.error("OAuth Error from GHL", { error, errorDescription });
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(error)}`, req.url),
    );
  }

  if (!code) {
    logger.warn("OAuth callback missing code parameter");
    return new NextResponse("Missing code", { status: 400 });
  }

  try {
    // 1. Exchange code for token
    const callbackUrl = new URL("/api/auth/callback", req.url).toString();
    const tokenRes = await exchangeCodeForTokens(code, callbackUrl);
    const {
      access_token,
      refresh_token,
      expires_in,
      userType,
      companyId,
      locationId,
      scope,
    } = tokenRes;

    // Calculate expiry date
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Encrypt refresh token
    const encryptedRefreshToken = encrypt(refresh_token);

    // 2. Upsert main installation
    const installation = await upsertInstallation({
      company_id: companyId,
      user_type: userType,
      access_token: access_token,
      refresh_token: encryptedRefreshToken,
      expires_at: expiresAt,
      scopes: scope ? scope.split(" ") : [],
      raw_data: tokenRes as any,
    });

    const supabase = getSupabaseServiceRoleClient();
    let finalBridgeKey = "";
    let redirectLocationId = locationId ?? "";

    // Check if an active bridge key already exists for this company
    const { data: existingBridgeKeys } = await supabase
      .from("bridge_keys")
      .select("id, bridge_key")
      .eq("installation_id", installation.id)
      .eq("is_active", true)
      .limit(1);

    let bridgeKeyRecord =
      existingBridgeKeys && existingBridgeKeys.length > 0
        ? existingBridgeKeys[0]
        : null;

    if (!bridgeKeyRecord) {
      const newKeyStr = generateBridgeKey();
      bridgeKeyRecord = await createBridgeKey({
        bridge_key: newKeyStr,
        installation_id: installation.id,
        company_id: companyId,
        label: `Default Key for ${companyId}`,
        is_active: true,
      });
    }

    finalBridgeKey = bridgeKeyRecord.bridge_key;

    // 3. Handle location tokens
    if (userType === "Location" && locationId) {
      // Single location install
      await upsertLocationToken({
        installation_id: installation.id,
        location_id: locationId,
        access_token: access_token,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt,
      });

      await linkBridgeLocation(bridgeKeyRecord.id, locationId);
    } else if (userType === "Company") {
      // Bulk installation or Company-level install
      // Fetch all installed locations
      const locations = await getInstalledLocations(companyId, access_token);

      for (const loc of locations) {
        if (!loc.isInstalled) continue;

        if (!redirectLocationId) {
          redirectLocationId = loc._id;
        }

        try {
          // Exchange company token for location token
          const locToken = await getLocationToken(
            companyId,
            loc._id,
            access_token,
          );
          const locExpiresAt = new Date(
            Date.now() + locToken.expires_in * 1000,
          ).toISOString();
          const locEncryptedRefresh = encrypt(locToken.refresh_token);

          await upsertLocationToken({
            installation_id: installation.id,
            location_id: loc._id,
            access_token: locToken.access_token,
            refresh_token: locEncryptedRefresh,
            expires_at: locExpiresAt,
          });

          await linkBridgeLocation(bridgeKeyRecord.id, loc._id);
        } catch (e) {
          logger.error(`Failed to process location token for ${loc._id}`, e, {
            companyId,
          });
          // Continue processing other locations
        }
      }
    }

    logger.info("OAuth flow completed successfully", { companyId, userType });

    // Redirect to dashboard, passing the bridge key (for initial display)
    // Normally we might set a cookie, but GHL iframe renders usually pass context via URL or postMessage
    const redirectUrl = new URL(
      `/dashboard?success=1&key=${finalBridgeKey}`,
      req.url,
    );

    if (redirectLocationId) {
      redirectUrl.searchParams.set("locationId", redirectLocationId);
    }

    const response = NextResponse.redirect(redirectUrl);

    if (redirectLocationId) {
      response.cookies.set("ghl_location_id", redirectLocationId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (error) {
    logger.error("OAuth callback failed", error);
    let errorCode = "OAuthFailed";
    let errorDescription = "OAuth callback failed during token exchange.";

    if (error instanceof Error) {
      const appErrorCode = (error as { code?: string }).code;
      if (appErrorCode) {
        errorCode = appErrorCode;
      }

      const messagePayloadMatch = error.message.match(/\{.*\}$/);
      if (messagePayloadMatch && messagePayloadMatch[0]) {
        try {
          const payload = JSON.parse(messagePayloadMatch[0]) as {
            error?: string;
            error_description?: string;
            message?: string;
          };

          if (payload.error) {
            errorCode = payload.error;
          }

          if (payload.error_description) {
            errorDescription = payload.error_description;
          } else if (payload.message) {
            errorDescription = payload.message;
          }
        } catch {
          errorDescription = error.message;
        }
      } else {
        errorDescription = error.message;
      }
    }

    const redirectUrl = new URL("/dashboard", req.url);
    redirectUrl.searchParams.set("error", errorCode);
    redirectUrl.searchParams.set("error_description", errorDescription);
    return NextResponse.redirect(redirectUrl);
  }
}
