# Production research guide (step-by-step, URL-backed)

**Purpose:** When *you* need to act (domain, accounts, secrets), use this sequence. Every external link below points to official vendor or project documentation that was verified to resolve (not invented).

**Constraints (do this in order):**

1. Read only primary sources (vendor docs, official API reference). Avoid random blog posts for security or billing decisions.
2. For each step, record: what you decided, which URL you used, and the date.
3. Never commit API tokens, access keys, or `.dev.vars` to git.

---

## Phase A — Square (payments, hosted checkout)

**Goal:** Understand how Square-hosted checkout works and what credentials you need.

| Step | You do | Official reference |
|------|--------|--------------------|
| A1 | Read how Checkout / payment links work (no card data on your site). | [Checkout API overview](https://developer.squareup.com/docs/checkout-api-overview) |
| A2 | Open the API reference for creating a payment link (request body, permissions). | [CreatePaymentLink](https://developer.squareup.com/reference/square/checkout-api/create-payment-link) |
| A3 | Browse related Checkout API endpoints for context. | [Checkout API reference index](https://developer.squareup.com/reference/square/checkout-api) |
| A4 | In the Square Developer Dashboard, create or locate an application and credentials (sandbox vs production is your choice; follow Square’s current UI labels). | [Developer Dashboard / devtools docs](https://developer.squareup.com/docs/devtools/developer-dashboard) |
| A5 | Obtain a **Location ID** (Worker code expects `SQUARE_LOCATION_ID`). Use Square’s Locations API reference to see how locations are listed. | [ListLocations](https://developer.squareup.com/reference/square/locations-api/list-locations) |

**Human checkpoint:** You paste `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` into Cloudflare Worker secrets (Phase C), not into the public repo.

---

## Phase B — GitHub Pages (static site origin)

**Goal:** Confirm how custom domains and HTTPS work for your repo.

| Step | You do | Official reference |
|------|--------|--------------------|
| B1 | Understand publishing source (branch/folder vs Actions). | [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) |
| B2 | Add your real domain in repo Settings → Pages; align the committed `CNAME` with what GitHub expects. | [Managing a custom domain for GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) |
| B3 | Optional but recommended: verify the domain to reduce takeover risk. | [Verifying your custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages) |
| B4 | Enable / wait for HTTPS after DNS settles. | [Securing GitHub Pages with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https) |

**Human checkpoint:** You own the domain and GitHub admin access.

---

## Phase C — Cloudflare Worker (Square proxy, `/api/*`)

**Goal:** Deploy the Worker and attach secrets; route your domain’s `/api/*` to the Worker (architecture in this repo: `worker/index.js`).

| Step | You do | Official reference |
|------|--------|--------------------|
| C1 | Install Wrangler locally (npm/pnpm/yarn per docs). | [Install and update Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) |
| C2 | Learn how secrets work (encrypted bindings; not plaintext in `wrangler.toml`). | [Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/) |
| C3 | Set production secrets (`SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`) via CLI or dashboard. | [wrangler secret put](https://developers.cloudflare.com/workers/wrangler/commands/general/#secret) |
| C4 | Configure **routes** / **triggers** so `https://your-domain/api/checkout` and `/api/donate` hit this Worker; edit `worker/wrangler.toml` to match your zone. | [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) (see **routes** / **triggers** on that page) |
| C5 | Set `SITE_ORIGIN` in `wrangler.toml` `[vars]` to your real `https://yourdomain.com` (must match browser origin for CORS in this project). | Same Wrangler configuration doc as C4 |

**Local testing (optional):** Copy `worker/.dev.vars.example` → `worker/.dev.vars` and fill values; see [Secrets — Local development](https://developers.cloudflare.com/workers/configuration/secrets/).

**Human checkpoint:** Cloudflare account, zone DNS for your domain, and Wrangler login.

---

## Phase D — Cloudflare DNS + proxy (if using Cloudflare in front of GitHub Pages)

**Goal:** Match the architecture in [ARCHITECTURE_PLAYBOOK.md](../ARCHITECTURE_PLAYBOOK.md): DNS, proxy, SSL mode.

| Step | You do | Official reference |
|------|--------|--------------------|
| D1 | Understand zone setup (your domain must be an active Cloudflare zone). | [DNS zone setups](https://developers.cloudflare.com/dns/zone-setups/) |
| D2 | Create/manage DNS records (apex / subdomain) consistent with GitHub Pages (Phase B) and orange-cloud proxy. | [Create DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/) |
| D3 | Understand how Worker **routes** attach to a hostname that already has proxied DNS. | [Workers Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/) |
| D4 | Set SSL/TLS to **Full (strict)** when origin is GitHub Pages with a valid cert (see playbook). | [Full (strict) encryption mode](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/) |

**Human checkpoint:** You reconcile Worker routes vs Pages origin (A records / CNAME to GitHub as in GitHub’s doc above).

---

## Phase E — Contact form (Web3Forms)

**Goal:** Replace the placeholder access key in `contact.html`.

| Step | You do | Official reference |
|------|--------|--------------------|
| E1 | Create a form / access key (verify email if required). | [Web3Forms](https://web3forms.com/) · [Create your form (app)](https://app.web3forms.com/) |
| E2 | Follow integration and options (redirect, spam options, etc.). | [Web3Forms documentation](https://docs.web3forms.com/) |
| E3 | Paste the key into `contact.html` where `REPLACE_WITH_WEB3FORMS_KEY` is today. | Example form on [web3forms.com](https://web3forms.com/) |

**Human checkpoint:** You accept Web3Forms terms and deliverability behavior per their site.

---

## Phase F — Repo hygiene before launch

| Step | You do | Reference |
|------|--------|-----------|
| F1 | Replace every `yourdomain.com` in `CNAME`, `robots.txt`, `sitemap.xml`, Open Graph placeholders, and `worker/wrangler.toml`. | This repo + GitHub Pages domain doc (Phase B) |
| F2 | Run tests after `npm install`: `npm test`. | [Playwright documentation](https://playwright.dev/docs/intro) |
| F3 | Bump service worker cache name in `sw.js` after meaningful static asset changes. | PWA caching pattern in [ARCHITECTURE_PLAYBOOK.md](../ARCHITECTURE_PLAYBOOK.md) |

---

## Quick URL index (bookmark)

- Square Checkout overview: https://developer.squareup.com/docs/checkout-api-overview  
- Square CreatePaymentLink: https://developer.squareup.com/reference/square/checkout-api/create-payment-link  
- Square Developer Dashboard docs: https://developer.squareup.com/docs/devtools/developer-dashboard  
- Cloudflare Workers secrets: https://developers.cloudflare.com/workers/configuration/secrets/  
- Wrangler `secret put`: https://developers.cloudflare.com/workers/wrangler/commands/general/#secret  
- Wrangler configuration (routes): https://developers.cloudflare.com/workers/wrangler/configuration/  
- Workers Routes (patterns, dashboard): https://developers.cloudflare.com/workers/configuration/routing/routes/  
- Cloudflare DNS zone setups: https://developers.cloudflare.com/dns/zone-setups/  
- Cloudflare SSL Full (strict): https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/  
- GitHub Pages custom domain: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site  
- Web3Forms: https://web3forms.com/ · Docs: https://docs.web3forms.com/  
- Playwright docs: https://playwright.dev/docs/intro  

---

*Guide URLs verified resolvable as of creation; if a vendor changes paths, use their on-site search from the same domain.*
