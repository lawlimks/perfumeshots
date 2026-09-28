# Decap CMS sign-in Worker

This small, separate Worker handles GitHub sign-in for the `/admin/` Decap CMS. It does not change the public site deployment.

## One-time account setup

1. In GitHub, go to **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Set **Homepage URL** to `https://perfumeshots-cms-auth.lawlimks.workers.dev`.
3. Set **Authorization callback URL** to `https://perfumeshots-cms-auth.lawlimks.workers.dev/callback`.
4. Deploy a Cloudflare Worker named `perfumeshots-cms-auth` using the files in this folder.
5. In the Worker’s **Settings → Variables and Secrets**, add these as **secrets**:
   - `GITHUB_OAUTH_ID`: the OAuth App Client ID
   - `GITHUB_OAUTH_SECRET`: the OAuth App Client Secret
6. Open `https://perfumeshots.lawlimks.workers.dev/admin/` and sign in with a GitHub account that can write to `lawlimks/perfumeshots`.

Keep the Client Secret out of GitHub and out of chat. The CMS uses GitHub’s public-repository access and commits edits to `main`; the connected Cloudflare site should publish those commits automatically.

## Deploying with Wrangler

From this folder, run `npx wrangler deploy`, then add the two Worker secrets with `npx wrangler secret put GITHUB_OAUTH_ID` and `npx wrangler secret put GITHUB_OAUTH_SECRET`.

The CMS uploads images to `assets/gallery` in the GitHub repository. This is Decap’s simple built-in media workflow; it does not upload directly to R2.
