/**
 * Cloudflare Worker entry point for the Himl frontend.
 *
 * It does two jobs:
 *   1. Reverse-proxies /api/* to the Django service on Render.
 *   2. Hands everything else to the static asset binding, which serves the
 *      built SPA and falls back to index.html for client-side routes.
 *
 * The proxy exists so the browser only ever sees one origin. `src/lib/api.js`
 * calls a relative "/api" base URL, which means no CORS preflight, no
 * cross-site cookie rules, and no build-time API host baked into the bundle —
 * the backend can move without rebuilding the frontend.
 *
 * BACKEND_ORIGIN comes from [vars] in wrangler.toml.
 */

/** Headers that describe a single network hop and must not be forwarded. */
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

async function proxyToBackend(request, backend) {
  const incoming = new URL(request.url);

  // Forward the path verbatim rather than reassembling it from route params:
  // DRF's router relies on trailing slashes, and rebuilding drops them.
  const target = new URL(incoming.pathname + incoming.search, backend);

  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP) headers.delete(name);
  // Host is derived from the target URL; a stale value fails ALLOWED_HOSTS.
  headers.delete("host");
  // Forwarding Accept-Encoding opts this fetch out of the runtime's automatic
  // compression handling, which then returns a brotli body to clients that
  // never advertised brotli. Dropping it lets the runtime negotiate encoding
  // with the origin and re-encode to whatever the real client accepts.
  headers.delete("accept-encoding");

  // DRF throttles per client IP, reading the first entry of X-Forwarded-For.
  // Without this every visitor would share one rate-limit bucket.
  const clientIP = request.headers.get("cf-connecting-ip");
  if (clientIP) headers.set("x-forwarded-for", clientIP);
  headers.set("x-forwarded-proto", "https");

  const response = await fetch(
    new Request(target, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
    }),
  );

  // Rewrite redirects that point back at the origin server so the Render
  // hostname never leaks into the address bar.
  const location = response.headers.get("location");
  if (location) {
    const resolved = new URL(location, target);
    if (resolved.origin === new URL(backend).origin) {
      const rewritten = new Headers(response.headers);
      rewritten.set("location", resolved.pathname + resolved.search);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: rewritten,
      });
    }
  }

  return response;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/api/")) {
      if (!env.BACKEND_ORIGIN) {
        return Response.json(
          { detail: "BACKEND_ORIGIN is not configured for this deployment." },
          { status: 503 },
        );
      }
      return proxyToBackend(request, env.BACKEND_ORIGIN);
    }

    return env.ASSETS.fetch(request);
  },
};
