import { createHmac, timingSafeEqual } from "crypto";

// Server-only HMAC signing for passport bundles.
// Key is derived from SUPABASE_SERVICE_ROLE_KEY + a fixed namespace so it
// remains stable across deploys without an extra secret.
function getSigningKey(): Buffer {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("Signing key unavailable");
  return createHmac("sha256", "agentpass.passport.v1")
    .update(base)
    .digest();
}

export function canonicalize(value: unknown): string {
  // Deterministic JSON: sort object keys recursively.
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return (
      "{" +
      keys
        .map(
          (k) =>
            JSON.stringify(k) + ":" + canonicalize((value as Record<string, unknown>)[k]),
        )
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(value ?? null);
}

export function signPayload(payload: unknown): string {
  const key = getSigningKey();
  return createHmac("sha256", key).update(canonicalize(payload)).digest("hex");
}

export function verifyPayload(payload: unknown, signatureHex: string): boolean {
  try {
    const expected = signPayload(payload);
    const a = Buffer.from(signatureHex, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const PASSPORT_ISSUER = "agentpass.v1";
export const SIGNATURE_ALG = "HMAC-SHA256";
