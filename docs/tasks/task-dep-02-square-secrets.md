# DEP-02: Square Worker Secrets

## Goal
Configure Square credentials as Cloudflare Worker secrets.

## Required Secrets
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`

## Command Examples
```bash
cd worker
wrangler secret put SQUARE_ACCESS_TOKEN
wrangler secret put SQUARE_LOCATION_ID
```

## Acceptance Criteria
- Worker can create payment links for both `/api/checkout` and `/api/donate`.

## Also see
- URL-backed checklist: `../PRODUCTION_RESEARCH_GUIDE.md`
