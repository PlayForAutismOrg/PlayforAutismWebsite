# TODO - Play for Autism Website

**Updated:** 2026-03-15  
**Agent:** Update this file when tasks are completed.  
**Details:** See `docs/tasks/` for deep task notes.

---

## Strategic Intent (Why + Sequence)

Ship a secure, low-maintenance charity website that can deploy quickly on static infrastructure, while keeping payment processing off-site with Square-hosted checkout pages.  
The sequence prioritizes foundation and security first (visibility, structure, payment boundaries), then delivery completeness (pages, store, donations, SEO/PWA), then verification (tests and deploy readiness).

## Current Phase

**Complete.** All features and optimizations shipped. No remaining tasks.

## Active Tasks

None — all tasks completed.

## Completed Milestones

- Initial project scaffold created with static architecture and no-build stack.
- Core pages implemented: home, about, store, events, donate, contact, confirmation, and 404.
- Square redirect checkout flow integrated via Cloudflare Worker proxy.
- PWA and SEO baseline added (`manifest.json`, `sw.js`, `robots.txt`, `sitemap.xml`).
- Client asset integration: real PFA logo across all pages, OG images, sponsor logos.
- Content integration: real mission copy, event recap (2024 SFA golf outing), contact info.
- Sponsor strip added to home and events pages with 8 vendor logos.
- Events page: 2024 recap section with flyer image, event details, sponsorship tiers, and "coming soon" block.
- Domain placeholders replaced with `playforautism.org` across all files.
- Cloudflare Worker deployed to `api.playforautism.org` with production Square credentials.
- Store wired to Square Catalog API with real variation IDs for price-enforced checkout.
- Real-time inventory from Square Inventory API with stock badges and pre-order flow.
- Store UX overhaul: tabbed category filter, compact cards, deep linking.
- Store product family grouping: variant chip selectors (sizes, quantities, types).
- Mobile cart ribbon: sticky bottom bar on phones showing item count and total.
- Contact form live via Web3Forms.
- Service worker fixed: `skipWaiting` + `clients.claim` + network-first strategy.
- **Security audit completed:**
  - Self-hosted Google Fonts (CORS fix).
  - Content-Security-Policy + referrer policy on all 8 pages.
  - Worker CORS: strict origin validation, no localhost bypass.
  - Worker: variation ID whitelist, redirect URL validation, input bounds.
  - Worker: sanitized error messages, no internal details leaked.
  - Contact form: honeypot field added.
  - Heading hierarchy fixed (footer h4 -> h3).
- **Optimization pass completed:**
  - Compressed all oversized images (total savings ~7MB).
  - PWA icons added (192x192 and 512x512).
  - JSON-LD structured data on all pages.
  - `loading="lazy"` on all below-fold images.
  - Font preload link for Lexend on all pages.

## Quick Reference

- Navigation index: `docs/llms.txt`
- Production research (your steps + official URLs): `docs/PRODUCTION_RESEARCH_GUIDE.md`
- Worker entrypoint: `worker/index.js`
