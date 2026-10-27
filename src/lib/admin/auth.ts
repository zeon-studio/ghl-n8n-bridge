import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "ghl_admin_session";

function getSecretKey(): Uint8Array {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.TOKEN_ENCRYPTION_KEY ||
    "ghl-n8n-bridge-admin-default-secret-key-32";
  return new TextEncoder().encode(secret.padEnd(32, "0").slice(0, 32));
}

/**
 * Validates the admin password using constant-time comparison to prevent timing attacks.
 */
export function verifyAdminPassword(password: string): boolean {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword || !password) {
    return false;
  }

  const bufGiven = Buffer.from(password);
  const bufExpected = Buffer.from(expectedPassword);

  if (bufGiven.length !== bufExpected.length) {
    // Prevent short-circuiting on length to obscure exact timing
    crypto.timingSafeEqual(bufExpected, bufExpected);
    return false;
  }

  return crypto.timingSafeEqual(bufGiven, bufExpected);
}

/**
 * Creates a signed JWT for the admin session.
 */
export async function createAdminToken(): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * Verifies the validity of an admin token.
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Checks if the current request has an active, valid admin session.
 */
export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}
