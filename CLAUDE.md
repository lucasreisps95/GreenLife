# GreenLife instructions for Claude

Read `PROJECT_BRIEF.md` and `LUCAS_HANDOFF.md` before changing this project.

## One shared live menu

Food names and future prices are controlled only by the owner dashboard Settings page. That page
writes the Firestore document `settings/menu`.

- Do **not** edit food names or prices in `index.html` or `admin.html`.
- Do **not** create another hardcoded menu or a second editable menu screen.
- The driver app's static list exists only as an offline emergency fallback.
- Past sales must continue using the price snapshot saved when the item was sold. Never calculate
  historic revenue from the live menu.

## Safe workflow

- Work in small commits and push them promptly.
- Keep `main` (driver app) and `owner-dashboard-v2` (owner dashboard) aligned when a change
  affects shared behavior.
- Before stopping, add a short dated note to the Progress Log in `PROJECT_BRIEF.md`, then commit
  and push that note separately.
- Do not change Firestore rules, authentication, or data structure without first explaining why.
