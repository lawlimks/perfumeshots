# PerfumeShots

A small, data-driven guide to perfume launches and stockists in Singapore.

## First working slice

- New launch feed with search across perfume, brand, and store names.
- Brand pages show known stockists and recent launches.
- Store pages show their website, brands carried, and recent launches.
- Launches can have multiple stockists; each stockist is a specific store/location.
- The site reads structured content from `data.json`.

This is the visitor-facing prototype. It has no admin editor or database yet. We will use a few real entries to decide how the content should be entered before adding more infrastructure.

## Local preview

Serve this folder over HTTP with any static web server and open its local address. The app uses `fetch()` to read `data.json`, so opening `index.html` directly as a file will not work.

## Cloudflare Pages

This is a static site. Connect the repository to Cloudflare Pages and use the repository root as the build output directory with no build command.
