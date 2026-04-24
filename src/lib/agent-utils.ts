/**
 * Generate a unique handle like "scout-7f3a2"
 */
export function generateHandle(seed?: string): string {
  const base = (seed ?? "agent").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 16) || "agent";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

/**
 * Generate a fresh API key. Returns { plaintext, prefix, hash } where hash is sha256.
 */
export async function generateApiKey(): Promise<{ plaintext: string; prefix: string; hash: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const plaintext = `ap_live_${raw}`;
  const prefix = plaintext.slice(0, 12);
  const hash = await sha256(plaintext);
  return { plaintext, prefix, hash };
}

export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function tierForScore(score: number): { tier: string; color: string } {
  if (score >= 900) return { tier: "PLATINUM", color: "text-cyan" };
  if (score >= 800) return { tier: "GOLD", color: "text-amber" };
  if (score >= 700) return { tier: "SILVER", color: "text-foreground" };
  if (score >= 600) return { tier: "BRONZE", color: "text-amber" };
  return { tier: "UNVERIFIED", color: "text-muted-foreground" };
}
