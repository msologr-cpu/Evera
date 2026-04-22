# Evera code review — 2026-04-22

## Scope
- Repository-wide static review for HTML integrity and broken local references.
- Validation method: parsed all `*.html` files and checked local `href`/`src` targets against the filesystem.

## Findings

### 1) Broken internal links on English sitemap page (high)
**Impact:** A large block of navigation links on `/en/pages/sitemap.html` points to non-existent targets, causing 404s and breaking discovery paths for users and crawlers.

**Examples:**
- `../en/index.html#...` from `/en/pages/sitemap.html` resolves to `/en/en/index.html#...` (non-existent).
- `../en/pages/...` from `/en/pages/sitemap.html` resolves to `/en/en/pages/...` (non-existent).
- `../robots.txt`, `../sitemap.xml`, `../manifest.json`, `../404.html` resolve to `/en/robots.txt`, etc., which are also non-existent.

**Recommendation:**
- Replace these links with absolute paths (preferred): `/en/index.html`, `/en/pages/...`, `/robots.txt`, `/sitemap.xml`, `/manifest.json`, `/404.html`.

---

### 2) Blog article includes missing JavaScript bundles (high)
**Impact:** `blog/verax` pages include scripts that do not exist (`/js/nav.js`, `/js/nebula.js`). Navigation/visual behaviors can silently fail depending on the template assumptions.

**Affected files:**
- `blog/verax/index.html`
- `en/blog/verax/index.html`

**Recommendation:**
- Replace with the existing unified script (`/js/app.js`) if that is the current architecture, or add the missing files if they are intentionally split.

---

### 3) Blog footer/legal links point to missing legal pages (medium)
**Impact:** Legal links in blog pages return 404 (`offer`, `privacy`, `agreement`), which creates trust/compliance risk.

**Affected targets:**
- RU: `/pages/terms/offer.html`, `/pages/terms/privacy.html`, `/pages/terms/agreement.html`
- EN: `/en/pages/terms/offer.html`, `/en/pages/terms/privacy.html`, `/en/pages/terms/agreement.html`

**Recommendation:**
- Retarget to existing legal pages currently in the repo:
  - `terms-of-use.html`
  - `privacy-policy.html`
  - `cookies-policy.html` / other applicable docs.

---

### 4) Mentorship links in Ethics Charter lead to missing page (low / expected-but-broken)
**Impact:** Both RU/EN charter pages link to `/pages/mentorship.html`, which does not exist. The text says this page is “in development”, but current link still produces 404.

**Recommendation:**
- Either (a) create a placeholder `mentorship.html`, or (b) remove/disable the link until the page is published.

## Validation output snapshot
Detected missing local references in:
- `en/pages/sitemap.html`
- `blog/verax/index.html`
- `en/blog/verax/index.html`
- `pages/terms/ethics-charter.html`
- `en/pages/terms/ethics-charter.html`

(Full command and line-level evidence were collected in terminal output during this review.)
