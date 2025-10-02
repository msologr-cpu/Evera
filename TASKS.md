# Proposed maintenance tasks

## Fix typo
- **Issue:** Hero headline on the landing page reads "Портал в вчечность", missing the second "е" in "вечность". 【F:index.html†L61-L62】
- **Task:** Update the heading text to "Портал в вечность" to correct the spelling.

## Fix bug
- **Issue:** Secondary pages load `/Evera/css/style.css` and `/Evera/js/script.js`, but the repository only ships `css/styles.css` and `js/app.js`, so styles and scripts fail to load. 【F:pages/b2b.html†L10-L34】【F:js/app.js†L1-L96】【F:css/styles.css†L1-L156】
- **Task:** Point every secondary page to the existing assets (`/Evera/css/styles.css` and `/Evera/js/app.js`) so layout and behaviour match the homepage.

## Correct documentation/comment
- **Issue:** The comment above the main script tag claims it only powers the stars, modal, and reveal animations, but the same file also handles wallet copying logic and the mobile navigation toggle. 【F:index.html†L293-L316】【F:js/app.js†L73-L110】
- **Task:** Update the comment (or accompanying documentation) to reflect all behaviours provided by `js/app.js`, so future maintainers know it also manages the donate dialog interactions and mobile menu state.

## Improve testing
- **Issue:** There is no automated check to catch broken asset references, which allowed the secondary pages to point at non-existent `/Evera/css/style.css` and `/Evera/js/script.js` files. 【F:pages/b2b.html†L10-L34】
- **Task:** Add a lightweight test (for example, a Node script run in CI) that parses HTML files and verifies that linked CSS/JS assets exist in the repository, preventing regressions like the missing stylesheet/script paths.
