import { createHash, randomBytes } from "crypto";

/**
 * Server-side equivalents of agent-utils that run inside the Worker runtime.
 * The browser version uses WebCrypto; here we use node:crypto for performance
 * and to keep the public API endpoints fully self-contained.
 */

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function generateApiKey(): { plaintext: string; prefix: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const plaintext = `ap_live_${raw}`;
  const prefix = plaintext.slice(0, 12);
  const hash = sha256Hex(plaintext);
  return { plaintext, prefix, hash };
}

export function generateHandle(seed?: string): string {
  const base =
    (seed ?? "agent")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 16) || "agent";
  const suffix = randomBytes(3).toString("hex").slice(0, 5);
  return `${base}-${suffix}`;
}

/**
 * Extract bearer token from an Authorization header.
 */
export function extractBearer(req: Request): string | null {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
