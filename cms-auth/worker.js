const COOKIE_NAME = "decap_oauth_state";

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function page(status, token = "") {
  const tokenLiteral = JSON.stringify(token).replaceAll("<", "\\u003c");
  const statusLiteral = JSON.stringify(status);
  return new Response(`<!doctype html><meta charset="utf-8"><title>Decap sign-in</title>
<script>
  if (window.opener) {
    const status = ${statusLiteral};
    const token = ${tokenLiteral};
    const sendAuthorization = () => {
      window.opener.postMessage("authorization:github:" + status + ":" + JSON.stringify({ token }), "*");
    };
    window.addEventListener("message", function receiveMessage() {
      window.removeEventListener("message", receiveMessage, false);
      sendAuthorization();
    }, false);
    window.opener.postMessage("authorizing:github", "*");
  }
</script>
<p>${status === "success" ? "Signed in. You can close this window." : "Sign-in failed. Close this window and try again."}</p>`, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff"
    }
  });
}

function clearStateCookie() {
  return `${COOKIE_NAME}=; Path=/callback; Max-Age=0; Secure; HttpOnly; SameSite=Lax`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("PerfumeShots CMS sign-in service", {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
      });
    }

    if (url.pathname === "/auth") {
      if (url.searchParams.get("provider") !== "github") {
        return new Response("Unsupported provider", { status: 400 });
      }
      if (!env.GITHUB_OAUTH_ID) {
        return new Response("GitHub OAuth is not configured yet.", { status: 503 });
      }

      const state = randomState();
      const redirectUri = `https://${url.hostname}/callback?provider=github`;
      const authorize = new URL("https://github.com/login/oauth/authorize");
      authorize.searchParams.set("client_id", env.GITHUB_OAUTH_ID);
      authorize.searchParams.set("redirect_uri", redirectUri);
      authorize.searchParams.set("scope", "public_repo,user");
      authorize.searchParams.set("state", state);

      return new Response(null, {
        status: 302,
        headers: {
          location: authorize.toString(),
          "cache-control": "no-store",
          "set-cookie": `${COOKIE_NAME}=${state}; Path=/callback; Max-Age=300; Secure; HttpOnly; SameSite=Lax`
        }
      });
    }

    if (url.pathname === "/callback") {
      if (url.searchParams.get("provider") !== "github") {
        return new Response("Unsupported provider", { status: 400 });
      }

      const cookies = request.headers.get("cookie") || "";
      const expectedState = cookies.split(";").map((value) => value.trim())
        .find((value) => value.startsWith(COOKIE_NAME + "="))?.slice(COOKIE_NAME.length + 1);
      const suppliedState = url.searchParams.get("state");

      if (!expectedState || !suppliedState || expectedState !== suppliedState) {
        return new Response("Sign-in state check failed. Close this window and try again.", {
          status: 400,
          headers: { "cache-control": "no-store", "set-cookie": clearStateCookie() }
        });
      }

      const code = url.searchParams.get("code");
      if (!code || url.searchParams.get("error") || !env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) {
        return new Response(page("error").body, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
            "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
            "x-content-type-options": "nosniff",
            "set-cookie": clearStateCookie()
          }
        });
      }

      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({
          client_id: env.GITHUB_OAUTH_ID,
          client_secret: env.GITHUB_OAUTH_SECRET,
          code,
          redirect_uri: `https://${url.hostname}/callback?provider=github`
        })
      });
      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        return new Response(page("error").body, {
          status: 502,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
            "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
            "x-content-type-options": "nosniff",
            "set-cookie": clearStateCookie()
          }
        });
      }

      const response = page("success", tokenData.access_token);
      response.headers.set("set-cookie", clearStateCookie());
      return response;
    }

    return new Response("Not found", { status: 404 });
  }
};
