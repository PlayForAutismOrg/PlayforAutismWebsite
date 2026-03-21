# DEP-01: Domain and Routing

## Goal
Replace all placeholder domain values with the production domain.

## Files
- `CNAME`
- `worker/wrangler.toml`
- `robots.txt`
- `sitemap.xml`

## Acceptance Criteria
- All placeholder `yourdomain.com` values are replaced.
- Worker route points to the production zone and `/api/*` pattern.

## Also see
- URL-backed checklist: `../PRODUCTION_RESEARCH_GUIDE.md`
