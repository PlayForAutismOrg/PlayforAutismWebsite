# TODO - Play for Autism Website

**Updated:** 2026-03-21  
**Agent:** Update this file when tasks are completed.  
**Details:** See `docs/tasks/` for deep task notes.

---

## Strategic Intent (Why + Sequence)

Ship a secure, low-maintenance charity website that can deploy quickly on static infrastructure, while keeping payment processing off-site with Square-hosted checkout pages.  
The sequence prioritizes foundation and security first (visibility, structure, payment boundaries), then delivery completeness (pages, store, donations, SEO/PWA), then verification (tests and deploy readiness).

## Current Phase

Production-ready. Square catalog integration live with real-time inventory. Security audit completed and all critical/medium issues resolved. Remaining items are low-priority optimizations.

## Active Tasks

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| DEP-04 | Add real Web3Forms key on contact page | MEDIUM | Ready | Replace `REPLACE_WITH_WEB3FORMS_KEY` in `contact.html` |
| OPT-01 | Compress large images (>500KB) | LOW | Open | `sfa-2024-flyer.png` (~1.2MB), `sfa-2024-sponsorship.png` (~1.2MB), `golf-classic-example.jpg` (~1.1MB), `og-events.png` (~1.2MB), `weber-security-group.jpeg` (~828KB), `pfa-logo.png` (~429KB) |
| OPT-02 | Add PWA icons 192x192 and 512x512 | LOW | Open | Current manifest only has SVG and 2000x2000 PNG |
| OPT-03 | Add JSON-LD structured data to inner pages | LOW | Open | about, contact, events, store, donate pages lack page-specific structured data |
| OPT-04 | Add `loading="lazy"` to below-fold images | LOW | Open | Footer logos, event flyer on events page |
| OPT-05 | Add font preload link for Lexend | LOW | Open | `<link rel="preload" href="assets/fonts/lexend-latin.woff2" as="font" type="font/woff2" crossorigin>` |

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
- Service worker fixed: `skipWaiting` + `clients.claim` + network-first strategy.
- **Security audit completed (2026-03-21):**
  - Self-hosted Google Fonts (CORS fix).
  - Content-Security-Policy + referrer policy on all 8 pages.
  - Worker CORS: strict origin validation, no localhost bypass.
  - Worker: variation ID whitelist, redirect URL validation, input bounds.
  - Worker: sanitized error messages, no internal details leaked.
  - Contact form: honeypot field added.
  - Heading hierarchy fixed (footer h4 -> h3).
  - CSS `--muted` variable fixed to `--text-muted`.

## Quick Reference

- Navigation index: `docs/llms.txt`
- Production research (your steps + official URLs): `docs/PRODUCTION_RESEARCH_GUIDE.md`
- Worker entrypoint: `worker/index.js`
