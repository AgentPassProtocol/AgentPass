import { createFileRoute } from "@tanstack/react-router";
import { verifyPayload, PASSPORT_ISSUER } from "@/lib/passport-sign.server";

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/v1/verify-bundle")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(
            JSON.stringify({ valid: false, error: "invalid_json" }),
            { status: 400, headers: cors },
          );
        }

        const b = body as {
          format?: string;
          version?: number;
          payload?: { issuer?: string; subject?: { handle?: string } };
          signature?: string;
        };

        if (
          !b ||
          b.format !== "agentpass.passport-bundle" ||
          b.version !== 1 ||
          !b.payload ||
          typeof b.signature !== "string"
        ) {
          return new Response(
            JSON.stringify({ valid: false, error: "malformed_bundle" }),
            { status: 400, headers: cors },
          );
        }

        if (b.payload.issuer !== PASSPORT_ISSUER) {
          return new Response(
            JSON.stringify({ valid: false, error: "unknown_issuer" }),
            { status: 400, headers: cors },
          );
        }

        const ok = verifyPayload(b.payload, b.signature);

        return new Response(
          JSON.stringify({
            valid: ok,
            issuer: PASSPORT_ISSUER,
            handle: b.payload.subject?.handle ?? null,
            verified_at: new Date().toISOString(),
          }),
          { status: ok ? 200 : 401, headers: cors },
        );
      },
    },
  },
});
