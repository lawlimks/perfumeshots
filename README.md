# PerfumeShots

A small, data-driven guide to perfume launches and stockists in Singapore.

## Site content

- New launch feed with search across perfume, brand, and stockist names.
- Brand pages show known stockists and recent launches.
- Stockist pages show their website, brands carried, and locations.
- Launches can have multiple stockists.
- The site reads structured content from `data.json`.

## Local preview

Serve this folder over HTTP with any static web server and open its local address. The app uses `fetch()` to read `data.json`, so opening `index.html` directly as a file will not work.

## Cloudflare Pages

This is a static site. Connect the repository to Cloudflare Pages and use the repository root as the build output directory with no build command.
