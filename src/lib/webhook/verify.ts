import crypto from "crypto";
import { WebhookError } from "../errors";

// Ed25519 public key for X-GHL-Signature (current)
// Source: https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide
const GHL_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----`;

// RSA-SHA256 public key for X-WH-Signature (legacy — deprecated July 1 2026)
// Source: https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide
const LEGACY_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAokvo/r9tVgcfZ5DysOSC
Frm602qYV0MaAiNnX9O8KxMbiyRKWeL9JpCpVpt4XHIcBOK4u3cLSqJGOLaPuXw6
dO0t6Q/ZVdAV5Phz+ZtzPL16iCGeK9po6D6JHBpbi989mmzMryUnQJezlYJ3DVfB
csedpinheNnyYeFXolrJvcsjDtfAeRx5ByHQmTnSdFUzuAnC9/GepgLT9SM4nCpv
uxmZMxrJt5Rw+VUaQ9B8JSvbMPpez4peKaJPZHBbU3OdeCVx5klVXXZQGNHOs8gF
3kvoV5rTnXV0IknLBXlcKKAQLZcY/Q9rG6Ifi9c+5vqlvHPCUJFT5XUGG5RKgOKU
J062fRtN+rLYZUV+BjafxQauvC8wSWeYja63VSUruvmNj8xkx2zE/Juc+yjLjTXp
IocmaiFeAO6fUtNjDeFVkhf5LNb59vECyrHD2SQIrhgXpO4Q3dVNA5rw576PwTzN
h/AMfHKIjE4xQA1SZuYJmNnmVZLIZBlQAF9Ntd03rfadZ+yDiOXCCs9FkHibELhC
HULgCsnuDJHcrGNd5/Ddm5hxGQ0ASitgHeMZ0kcIOwKDOzOU53lDza6/Y09T7sYJ
PQe7z0cvj7aE4B+Ax1ZoZGPzpJlZtGXCsu9aTEGEnKzmsFqwcSsnw3JB31IGKAyk
T1hhTiaCeIY/OwwwNUY2yvcCAwEAAQ==
-----END PUBLIC KEY-----`;

function verifyGhl(rawBody: string, signature: string): boolean {
  try {
    const payloadBuffer = Buffer.from(rawBody, "utf8");
    const signatureBuffer = Buffer.from(signature, "base64");
    return crypto.verify(null, payloadBuffer, GHL_PUBLIC_KEY, signatureBuffer);
  } catch {
    return false;
  }
}

function verifyLegacy(rawBody: string, signature: string): boolean {
  try {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(rawBody);
    return verifier.verify(LEGACY_PUBLIC_KEY, signature, "base64");
  } catch {
    return false;
  }
}

/**
 * Verifies a GHL webhook signature.
 * Prefers X-GHL-Signature (Ed25519). Falls back to X-WH-Signature (RSA-SHA256 legacy).
 * @param rawBody The raw, unparsed request body string
 * @param signature The signature header value (X-GHL-Signature or X-WH-Signature)
 */
export function verifyGhlWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) {
    throw new WebhookError("Missing webhook signature header");
  }

  if (verifyGhl(rawBody, signature)) return true;
  if (verifyLegacy(rawBody, signature)) return true;

  throw new WebhookError("Invalid webhook signature");
}
