# GreenLife — Lucas handoff

Welcome. This document lets a new Cloud Code session safely continue the GreenLife project.

## Before you begin

The project owner must invite **your own accounts** to:

1. GitHub repository: `lucasreisps95/GreenLife` (write access is enough to make code changes).
2. Netlify team/project (developer access lets you view and manage deployments).
3. Firebase project `greenlife-ad21a` (editor access lets you manage the database and rules).

Do not share passwords, one-time codes, or private keys. Use account invitations instead.

## Project links

- Driver app: https://statuesque-florentine-36259d.netlify.app/
- Owner dashboard: https://zippy-flan-6a77ad.netlify.app/
- Repository: https://github.com/lucasreisps95/GreenLife

## How deployments work

- `main` publishes the driver app.
- `owner-dashboard-v2` publishes the owner dashboard.
- Important changes that affect shared logic or menu defaults should be mirrored to both branches.

## Important safety rules

- Read `PROJECT_BRIEF.md` fully before editing. Its Progress Log is the current handoff record.
- Read `index.html`, `admin.html`, `firebase-config.js`, and `firestore.rules` before changing sync,
  sales, or permissions.
- Sales revenue must always use the price saved with each sale. Never recalculate historic revenue
  from the current menu price.
- Do not redesign the Firestore data model, authentication approach, or file layout without first
  confirming why the existing approach was chosen.
- The owner dashboard is currently intentionally open without a sign-in page. Treat its Firestore
  access rules carefully and discuss any security change before publishing it.
- **Menu rule — do not edit food names or prices in `index.html` or `admin.html`.** The live menu
  is only `settings/menu` in Firestore, edited through the owner dashboard's **Settings** page.
  The driver app and the retired `admin.html` dashboard read that shared record. The driver's
  built-in list is an offline emergency fallback only, not a second menu to maintain.

## First Cloud Code task

1. Clone or open the repository after the GitHub invitation is accepted.
2. Read the files named above and `PROJECT_BRIEF.md`.
3. Confirm the current branch before editing.
4. Make a documentation-only access-test branch if you need to verify push permissions.
5. Commit small changes with clear messages and push them. Update the Progress Log before stopping.
