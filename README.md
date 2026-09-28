# PerfumeShots

A small, data-driven guide to perfume launches and stockists in Singapore.

## Site content

- New launch feed with search across perfume, brand, and stockist names.
- Brand pages show known stockists and recent launches.
- Stockist pages show their website, brands carried, and locations.
- Launches can have multiple stockists.
- The site reads structured content from `data.json`.

## Content editor

Decap CMS is available at `/admin/`. It edits the structured content in `data.json` and saves changes to the GitHub repository. The connected Cloudflare deployment publishes those commits automatically.

The first sign-in requires a GitHub OAuth App and a separate Cloudflare OAuth Worker. Follow the setup steps in [`cms-auth/README.md`](cms-auth/README.md). Image uploads from the editor are stored in `assets/gallery` in GitHub; the built-in Decap uploader does not send files to R2.

## Local preview

Serve this folder over HTTP with any static web server and open its local address. The app uses `fetch()` to read `data.json`, so opening `index.html` directly as a file will not work.

## Cloudflare Pages

This is a static site. Connect the repository to Cloudflare Pages and use the repository root as the build output directory with no build command.
