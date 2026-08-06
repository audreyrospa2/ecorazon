/**
 * GitHub OAuth token-exchange worker for the Ecorazón custom CMS.
 *
 * WHY THIS EXISTS:
 * GitHub's OAuth flow requires exchanging a temporary `code` for an access
 * token using your Client Secret. That exchange MUST happen server-side —
 * a secret can never live in browser JS. This worker is that tiny server.
 *
 * DEPLOY:
 *   1. npm install -g wrangler        (if you don't have it)
 *   2. wrangler login
 *   3. wrangler secret put GITHUB_CLIENT_ID
 *   4. wrangler secret put GITHUB_CLIENT_SECRET
 *   5. wrangler secret put ALLOWED_ORIGIN     (e.g. https://ecorazon.com or https://yourdomain.com)
 *   6. wrangler deploy
 *
 * Then set your GitHub OAuth App's "Authorization callback URL" to:
 *   https://<your-worker-subdomain>.workers.dev/callback
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    // Step 1: redirect the admin panel's "Login with GitHub" button here
    if (url.pathname === "/auth") {
      const redirectUri = `${url.origin}/callback`;
      const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
      githubAuthUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
      githubAuthUrl.searchParams.set("scope", "repo");
      githubAuthUrl.searchParams.set("state", url.searchParams.get("state") || "");
      return Response.redirect(githubAuthUrl.toString(), 302);
    }

    // Step 2: GitHub redirects back here with a ?code=...
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Missing code", { status: 400 });
      }

      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        return new Response(`OAuth error: ${tokenData.error_description || tokenData.error}`, {
          status: 400,
        });
      }

      // Post the token back to the admin panel via a tiny HTML page that
      // uses window.opener.postMessage — the admin panel opens this flow
      // in a popup window and listens for the message.
      const html = `<!DOCTYPE html>
<html><body>
<script>
  window.opener.postMessage(
    { type: "ecorazon-cms-auth", token: "${tokenData.access_token}" },
    "${env.ALLOWED_ORIGIN}"
  );
  window.close();
</script>
Login successful — you can close this window if it doesn't close automatically.
</body></html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html", ...corsHeaders(env) },
      });
    }

    // Client password login: exchanges a shared password for the service PAT
    if (url.pathname === "/password-login" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders(env) },
        });
      }

      if (!body.password || body.password !== env.CLIENT_PASSWORD) {
        return new Response(JSON.stringify({ error: "Incorrect password" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders(env) },
        });
      }

      return new Response(JSON.stringify({ token: env.GITHUB_PAT }), {
        headers: { "Content-Type": "application/json", ...corsHeaders(env) },
      });
    }

    return new Response("Ecorazón CMS OAuth worker is running.", {
      headers: corsHeaders(env),
    });
  },
};

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}