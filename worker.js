const COLLECTION_COOKIE = "perfumeshots_collection";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const PAGE_PATHS = new Set([
  "/collection/",
  "/collection/index.html",
  "/collection/collection.css",
  "/collection/collection.js"
]);

function headers(extra = {}) {
  return {
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Cache-Control": "private, no-store",
    ...extra
  };
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: headers({ "Content-Type": "text/html; charset=utf-8" })
  });
}

function loginPage(env, message = "") {
  if (!message && (!env.COLLECTION_PASSWORD || !env.COLLECTION_PASSWORD)) {
    return html(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Collection setup required — PerfumeShots</title><style>body{margin:0;background:#f7f6f3;color:#222;font:16px/1.6 Arial,sans-serif;display:grid;min-height:100vh;place-items:center}.box{max-width:28rem;padding:2rem;text-align:center}h1{font-weight:400}</style></head><body><main class="box"><h1>Private collection</h1><p>This page is waiting for its Cloudflare password settings.</p></main></body></html>`, 503);
  }
  const error = message ? `<p class="error" role="alert">${message}</p>` : "";
  return html(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Private collection — PerfumeShots</title><style>
    *{box-sizing:border-box}body{margin:0;background:#f7f6f3;color:#222;font:16px/1.6 Arial,sans-serif;display:grid;min-height:100vh;place-items:center}.box{width:min(100% - 2rem,27rem);padding:2.4rem;background:#fff;border:1px solid #e5e2dd;text-align:center}h1{margin:0 0 .4rem;font-size:1.6rem;font-weight:400}p{color:#666}.error{color:#9b2828}label{display:block;text-align:left;margin:.9rem 0 .35rem}input{width:100%;padding:.8rem;border:1px solid #bbb;font:inherit}button{margin-top:1rem;padding:.75rem 1.1rem;border:1px solid #222;background:#222;color:#fff;font:inherit;cursor:pointer}a{display:block;margin-top:1.2rem;color:#555;font-size:.9rem}
    </style></head><body><main class="box"><h1>Private collection</h1><p>Enter the password to continue.</p>${error}<form method="post" action="/collection/login"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus><button type="submit">Open collection</button></form><a href="/">Return to PerfumeShots</a></main></body></html>`, message ? 401 : 200);
}

function cookieValue(request) {
  const cookie = request.headers.get("Cookie") || "";
  const pair = cookie.split(";").map(part => part.trim()).find(part => part.startsWith(COLLECTION_COOKIE + "="));
  return pair ? pair.slice(COLLECTION_COOKIE.length + 1) : "";
}

async function signature(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signed)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function isAuthorized(request, secret) {
  const [expires, supplied] = cookieValue(request).split(".");
  if (!expires || !supplied || !/^\d+$/.test(expires) || Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  const expected = await signature(expires, secret);
  if (expected.length !== supplied.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ supplied.charCodeAt(index);
  return difference === 0;
}

async function passwordsMatch(candidate, expected) {
  const digest = async value => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const [left, right] = await Promise.all([digest(candidate), digest(expected)]);
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left[index] ^ right[index];
  return difference === 0;
}

function withNoIndex(response) {
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  responseHeaders.set("Cache-Control", "private, no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/collection" && !url.pathname.startsWith("/collection/")) return env.ASSETS.fetch(request);

    if (url.pathname === "/collection") {
      return new Response(null, { status: 301, headers: headers({ Location: "/collection/" }) });
    }

    if (url.pathname === "/collection/login" && request.method === "POST") {
      if (request.headers.get("Origin") && request.headers.get("Origin") !== url.origin) return html("Request rejected.", 403);
      if (!env.COLLECTION_PASSWORD || !env.COLLECTION_PASSWORD) return loginPage(env);
      const form = await request.formData();
      const candidate = String(form.get("password") || "");
      if (!await passwordsMatch(candidate, env.COLLECTION_PASSWORD)) return loginPage(env, "That password did not match. Please try again.");
      const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
      const signed = await signature(expires, env.COLLECTION_PASSWORD);
      return new Response(null, {
        status: 303,
        headers: headers({
          "Location": "/collection/",
          "Set-Cookie": `${COLLECTION_COOKIE}=${expires}.${signed}; Max-Age=${SESSION_SECONDS}; Path=/collection; HttpOnly; Secure; SameSite=Strict`
        })
      });
    }

    if (url.pathname === "/collection/logout" && request.method === "POST") {
      return new Response(null, {
        status: 303,
        headers: headers({
          "Location": "/collection/",
          "Set-Cookie": `${COLLECTION_COOKIE}=; Max-Age=0; Path=/collection; HttpOnly; Secure; SameSite=Strict`
        })
      });
    }

    if (!env.COLLECTION_PASSWORD || !env.COLLECTION_PASSWORD) return loginPage(env);
    if (!await isAuthorized(request, env.COLLECTION_PASSWORD)) return loginPage(env);
    if (url.pathname === "/collection/api/data" && request.method === "GET") {
      if (!env.PRIVATE_COLLECTION) return new Response(JSON.stringify({ error: "Private collection storage is not connected yet." }), {
        status: 503,
        headers: headers({ "Content-Type": "application/json; charset=utf-8" })
      });
      const object = await env.PRIVATE_COLLECTION.get("collection.json");
      if (!object) return new Response(JSON.stringify({ error: "The collection file has not been uploaded to private storage yet." }), {
        status: 404,
        headers: headers({ "Content-Type": "application/json; charset=utf-8" })
      });
      return new Response(object.body, { headers: headers({ "Content-Type": "application/json; charset=utf-8" }) });
    }

    if (PAGE_PATHS.has(url.pathname) && (request.method === "GET" || request.method === "HEAD")) {
      return withNoIndex(await env.ASSETS.fetch(request));
    }
    return new Response("Not found", { status: 404, headers: headers({ "Content-Type": "text/plain; charset=utf-8" }) });
  }
};
