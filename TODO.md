# TODO - Play for Autism Website

**Updated:** 2026-03-21  
**Agent:** Update this file when tasks are completed.  
**Details:** See `docs/tasks/` for deep task notes.

---

## Strategic Intent (Why + Sequence)

Ship a secure, low-maintenance charity website that can deploy quickly on static infrastructure, while keeping payment processing off-site with Square-hosted checkout pages.  
The sequence prioritizes foundation and security first (visibility, structure, payment boundaries), then delivery completeness (pages, store, donations, SEO/PWA), then verification (tests and deploy readiness).

## Current Phase

Domain placeholders replaced with `playforautism.org`. All SEO meta, OG images, canonical URLs, sitemap, robots.txt, and Worker config updated. Next: deploy Cloudflare Worker with production Square credentials, set up Web3Forms contact key, and add store product catalog.

## Active Tasks

| ID | Task | Priority | Status | Details |
|----|------|----------|--------|---------|
| DEP-01 | Replace placeholder domain values in `CNAME`, `worker/wrangler.toml`, `robots.txt`, `sitemap.xml` | HIGH | Completed | docs/tasks/task-dep-01-domain-and-routing.md |
| DEP-02 | Configure Cloudflare Worker secrets for Square (`SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`) | CRITICAL | Ready | docs/tasks/task-dep-02-square-secrets.md |
| DEP-03 | Add real product catalog data and media assets | HIGH | Ready | docs/tasks/task-dep-03-product-catalog.md |
| DEP-04 | Add real Web3Forms key on contact page | MEDIUM | Ready | docs/tasks/task-dep-04-contact-form-key.md |
| DEP-05 | Run Playwright tests after dependencies are installed | MEDIUM | Completed | docs/tasks/task-dep-05-testing.md |

## Completed Milestones

- Initial project scaffold created with static architecture and no-build stack.
- Core pages implemented: home, about, store, events, donate, contact, confirmation, and 404.
- Square redirect checkout flow integrated via Cloudflare Worker proxy.
- PWA and SEO baseline added (`manifest.json`, `sw.js`, `robots.txt`, `sitemap.xml`).
- Methodology-aligned visibility and navigation files added.
- Client asset integration: real PFA logo across all pages, OG images, sponsor logos.
- Content integration: real mission copy, event recap (2024 SFA golf outing), contact info.
- Sponsor strip added to home and events pages with 8 vendor logos.
- Events page: 2024 recap section with flyer image, event details, sponsorship tiers, and "coming soon" block.
- Domain placeholders replaced with `playforautism.org` across all files.
- OG image URLs, canonical links, and structured data updated with absolute production URLs.
- Wrangler Worker config routed to `playforautism.org/api/*`.

## Quick Reference

- Navigation index: `docs/llms.txt`
- Production research (your steps + official URLs): `docs/PRODUCTION_RESEARCH_GUIDE.md`
- Worker entrypoint: `worker/index.js`
