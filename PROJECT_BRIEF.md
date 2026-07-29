# Project Brief: GreenLife Multi-Driver Sync + Owner Dashboard

**Read this whole document before writing any code.** This is a handoff brief — you may not be the
first AI agent working on this project, and you may not be the last. Update the Progress Log at the
bottom before you stop working, regardless of whether the goal is finished, so the next agent (which
may be a different AI tool entirely) can pick up cleanly.

## What already exists

There is a working single-file web app at `index.html` in the GitHub repo `lucasreisps95/GreenLife`,
deployed automatically to Netlify from the `main` branch (push to `main` → live in ~30 seconds).

This app is a **route sales logger** for a meal-prep delivery driver. Read the actual file first —
it is the source of truth, not this description — but in summary it currently:

- Tracks a fixed weekly menu (Monday–Friday, different items per day) with prices
- Lets the driver log sales per stop, per item, with quantity
- Tracks arrival/departure times per stop and calculates drive time between stops
- Tracks payment method per sale (Square, Zelle, Venmo, Credit Card, Cash, Owed), including a
  per-sale Square fee calculation
- Tracks a personal cash float/pouch
- Calculates daily revenue, commission (30% of revenue), and various KPIs
- Exports data as CSV and native Excel (.xlsx via SheetJS)
- Supports English/Spanish via an in-app translation dictionary
- **Stores all data using a `window.storage` API with a `localStorage` fallback — this means data
  currently lives only on one device, in one browser. There is no shared backend.**

**Important existing bug fix — do not reintroduce it:** revenue used to be calculated by looking up
prices from the *current* live menu, which meant editing the menu retroactively changed historical
revenue. This was fixed by snapshotting `price` onto each sold item at the moment of sale
(`stop.items[name] = {sold, price}`), and revenue is now calculated only from that stored snapshot.
Any new sync/backend logic must preserve this — a sale's price must never be recalculated from a
live menu lookup after the fact.

## The goal

Three things, which are really one connected system:

1. **A real shared cloud backend.** Every driver's data currently lives only on their own phone.
   Replace/extend the storage layer so driver data also syncs to a shared cloud database.

2. **A simple driver identity.** Each driver identifies themselves (name is sufficient — no need for
   passwords or full auth for v1) so their data is attributable and separable in the shared database.

3. **A new owner/admin dashboard.** A separate page, `admin.html`, in the same repo, that connects to
   the same cloud database and shows company-wide aggregated views: total revenue across all drivers,
   commission paid out, waste/returns by driver, cash reconciliation, best-sellers company-wide, and
   a per-driver comparison/leaderboard. Drivers never see this page; the owner does.

## Technical decisions already made — follow these, don't re-litigate them

- **Backend: Firebase (Firestore).** Free tier is more than sufficient for this scale (a handful of
  drivers, low daily volume). Use the Firestore Web SDK via CDN `<script>` tags — this app has no
  build step and that must not change. Do not introduce a bundler, npm build process, or framework.
- **Driver ID: name-based, no passwords.** A driver types their name once (the app already has a
  "Seller" field — extend that concept rather than building something new).
- **Two HTML files, one repo:** `index.html` (existing driver app, keep working exactly as it does
  today) and `admin.html` (new owner dashboard). Both load the same Firebase config and read/write
  the same Firestore collections.
- **Security rules matter.** A driver's app should be able to write their own data but not read or
  overwrite another driver's data. The admin dashboard needs read access to everything. Write real
  Firestore security rules — do not ship with open read/write access.
- **Keep local storage as a fallback**, not a replacement — if the driver's phone loses connection
  mid-route, they should still be able to log sales locally and have them sync when back online.
  Don't make connectivity a hard requirement to use the app.

## Step-by-step plan

1. **Read `index.html` in full** before changing anything. Understand the existing data model
   (`day`, `stops`, `items`, `payments`, etc.) exactly as it is today.
2. **Set up the Firebase project.** If you don't have credentials, stop and ask the user for a
   Firebase config object (project setup takes them ~2 minutes in the Firebase console — walk them
   through it step by step if they haven't done it before).
3. **Design the Firestore data schema** for multi-driver data (e.g., a `drivers/{driverName}/days/{date}`
   structure, or similar — use your judgment, but document the schema in this file's Progress Log
   once decided, since the next agent needs it too).
4. **Write Firestore security rules** enforcing the access pattern above.
5. **Add driver identity capture** to `index.html` (extend the existing Seller field).
6. **Add cloud sync** to the existing storage functions in `index.html`, with local storage as
   fallback/cache, not full replacement. Do not touch the revenue/price-snapshot logic described above.
7. **Build `admin.html`** as a new file: company-wide KPIs, per-driver breakdown, comparison views.
   Reuse the visual design system already in `index.html` (colors, fonts, card styles) so it looks
   like the same product, not a bolted-on separate tool.
8. **Test with at least two fake drivers** before considering this done — log sales as "Test Driver A"
   and "Test Driver B" from two different browser sessions, then confirm `admin.html` shows both,
   combined correctly, with accurate totals.
9. **Commit and push to `main`** with clear, descriptive commit messages. Verify the Netlify deploy
   succeeds and both `index.html` and `admin.html` load correctly on the live site.
10. **Update the Progress Log below** before ending your session, whether or not the goal is complete.

## Acceptance criteria — how to know it's actually done

- [ ] A driver can open `index.html`, enter their name once, and log sales as before with no
      loss of existing functionality
- [ ] That driver's data appears in Firestore under their name
- [ ] A second driver's data does not interfere with or overwrite the first driver's data
- [ ] `admin.html` loads and shows combined totals across all drivers that match the sum of what
      each driver individually logged (verify the math, don't just eyeball it)
- [ ] Revenue figures in `admin.html` still respect the price-snapshot rule (menu edits don't
      retroactively change historical numbers)
- [ ] The driver app still works if the device is offline when a sale is logged
- [ ] Firestore security rules prevent a driver from reading or writing another driver's data
- [ ] Both files are live on the Netlify deployment

## Constraints

- Do not remove or break any existing driver-facing feature.
- Do not introduce a build step, framework, or bundler.
- Do not commit real API keys or secrets in a way that grants broader access than intended —
  Firebase web config values are meant to be public, but security rules must do the actual
  access control. Ask the user before pushing if unsure.
- Prefer small, testable commits over one giant change.

---

## Progress Log

*Whoever is working on this: add an entry below with the date, what you completed, what's still
open, and anything the next agent needs to know (schema decisions, blockers, credentials still
needed, etc.). Do not delete earlier entries.*

### 2026-07-28 — Claude (Sonnet 5, via Claude Code)

**Repo state at start:** only this brief existed locally. Cloned `lucasreisps95/GreenLife` fresh
into this folder (`./repo` relative to the brief — the git repo root). All paths below are relative
to the repo root.

**What I completed:**

1. Read `index.html` in full (1915 lines) before changing anything. Confirmed the existing
   price-snapshot revenue fix (`stop.items[name] = {sold, price}`) and did not touch it — all new
   sync code reads/writes the `day` object verbatim, snapshot included.
2. **Firestore schema** (decided, implemented against):
   - `drivers/{driverId}` — one doc per driver. `driverId` is the driver's typed name, slugified
     (`lowercase, non-alphanumeric → _`). Fields: `name` (original display name), `ownerUid`
     (Firebase anonymous-auth uid of the device that first claimed this name), `createdAt`,
     `updatedAt`.
   - `drivers/{driverId}/days/{date}` — one doc per day per driver, `date` = `YYYY-MM-DD` (same key
     index.html already uses locally). Document body is the **exact same `day` object** index.html
     stores locally (`date, stopNames, menuOverride, stops, returns, startFloat`), plus `driverName`
     and a server `updatedAt` timestamp.
   - `admins/{uid}` — one doc per owner/admin account (see auth model below). Content doesn't
     matter, only existence.
3. **Auth model (important — read before changing security rules):** the brief says drivers need
   no password, but real Firestore rules can't tell devices apart without *some* identity. Solution:
   - Drivers get silent **Firebase Anonymous Auth** (no password, no UI, happens automatically on
     load). The first device to type a given name "claims" that `driverId` by writing `ownerUid`.
     A different device typing the same name will be refused writes (rules check `ownerUid` match)
     — the app shows "that name is already syncing from another device" in that case.
     **Known limitation:** if a driver clears browser storage or switches devices, they lose their
     claim to their old name and need to either use a slightly different name or have the owner
     manually clear `ownerUid` in the Firebase console. Acceptable tradeoff for a v1 with no
     passwords — flagging so it's not a surprise later.
   - The owner authenticates to `admin.html` with **real Firebase email/password auth** (this does
     not contradict the "no passwords for drivers" requirement — it's a single admin account, not
     driver identity). After creating that account (Firebase console → Authentication → Users →
     Add user) and signing in once via `admin.html`, the owner must add one document to the
     `admins` collection whose ID equals their account's UID. `admin.html` displays that UID on a
     permission-denied error so the owner can self-serve without a developer.
4. Wrote `firestore.rules`: drivers can only read/write their own `drivers/{driverId}` doc and its
   `days` subcollection (enforced via the `ownerUid` check above); admins (present in `admins/{uid}`)
   can read everything; nobody can delete a driver doc; `admins` docs are console-managed only
   (`allow write: if false`).
5. Added a shared `firebase-config.js` (currently placeholder `REPLACE_ME` values) loaded by both
   `index.html` and `admin.html` via a plain `<script src="firebase-config.js">` tag — keeps the
   config in one place with no build step, no bundler.
6. **index.html changes** (all additive, existing driver-facing behavior unchanged):
   - Firebase compat SDK (`app`, `auth`, `firestore`, v10.14.1) added via CDN `<script>` tags, plus
     `firebase-config.js`.
   - New cloud-sync section (search `CLOUD SYNC` in the file) with `initCloud()`, `claimDriver()`,
     `cloudPushDay()`, `hydrateFromCloud()`. All of it is try/catch-wrapped and fails silently to
     "local only" if Firebase isn't configured yet or the device is offline — **local storage is
     still the primary, synchronous write path**; cloud push happens after, in the background, from
     inside `persistDay()`.
   - `init()` now calls `initCloud()` (fire-and-forget) *after* the first local render, so the app
     never blocks on network.
   - `setSellerName()` now also claims the driver doc and pulls any existing cloud days for that
     name into local storage (covers "new device, same driver" recovery).
   - Added a small status line under the Seller field (`cloudStatusLabel()` /
     `cloud_offline`/`cloud_connecting`/`cloud_synced`/`cloud_taken` translation keys, EN+ES) so a
     driver can see at a glance whether they're syncing — useful for verifying the feature actually
     works in the field, not just in code.
7. **Built `admin.html`** from scratch: email/password login gate, then company-wide KPI cards
   (total revenue, commission paid out, waste value, real Square fees), a per-driver leaderboard
   table (sorted by revenue), a cash-reconciliation table per driver (cash sales / cash added /
   change given / net cash), and a company-wide best-sellers table (top 10 by quantity). Visual
   style (colors, fonts, glass-card look) copied from `index.html`'s `:root` variables so it reads
   as the same product. Necessarily duplicates the `MENU` object and a handful of pure calculation
   functions from `index.html` (`stopRevenue`, `dayRevenue`, `dayFeesTotal`, etc.) since there's no
   build step / module system to share code between the two static files — kept them byte-for-byte
   equivalent to index.html's logic, including using the *live* menu price only for valuing unsold
   returns (matching index.html's own existing behavior for waste, which is separate from the
   sold-item price-snapshot rule).

**What's still open / next steps for whoever picks this up:**

- [ ] `admin.html` shows all-time totals only (no date-range filter). Brief didn't ask for one;
      easy to add later (`days.filter(d => d.date >= from && d.date <= to)`) if the owner wants it.
- [ ] Have not yet verified the price-snapshot rule specifically through `admin.html` (edit a menu
      price, confirm historical revenue in the dashboard doesn't change) — the code path reuses the
      same `it.price` snapshot as index.html so this should hold, but hasn't been explicitly
      re-checked end-to-end post-deploy.
- [ ] Haven't done a real two-separate-devices test (two different phones/computers) — only
      simulated it in one browser by clearing `localStorage` + the Firebase Auth IndexedDB between
      "drivers" (see below). Worth a real two-device pass before fully trusting this in the field.
- [ ] Owner still needs to finish their own one-time setup: create their Email/Password admin
      account in Firebase console → Authentication → Users, then add a doc under `admins/` whose ID
      is that account's UID (admin.html shows the UID on a permission-denied screen to make this
      easy — sign in once, copy the UID it displays, paste it as a new document ID in the `admins`
      collection in Firestore, content doesn't matter).

### 2026-07-28 (later same day) — Claude (Sonnet 5, via Claude Code) — Firebase config wired in + tested

User supplied a real Firebase project (`greenlife-ad21a`) config, now live in `firebase-config.js`.
Testing this surfaced two real bugs in what I built earlier today, both fixed:

1. **Rules bug — reading a driver doc before it exists was always denied.** My original
   `isOwnerOfDriver()` required `exists(...)` to be true before checking `ownerUid`, which is
   correct once a driver doc exists, but meant the very first `get()` a device ever made (to check
   "does this name exist yet, should I create it") was denied outright — Firestore denies reads on
   a rules-protected path regardless of whether the target doc exists. This surfaced as every new
   driver name incorrectly showing "that name is already syncing from another device," which was
   just a swallowed permission-denied error, not a real conflict.
   **Fix:** `claimDriver()` no longer reads before writing. It does a single `set(..., {merge:true})`
   — Firestore evaluates that as a `create` the first time (allowed, since we're setting ourselves
   as `ownerUid`) and as an `update` every time after (allowed only if we're already the owner, so a
   genuine hijack attempt from a different device now correctly fails and is caught as `'taken'`).
   Also split `claimDriver`'s return value into `{status:'synced'|'taken'|'error', ...}` instead of
   a bare truthy/falsy value, so genuine errors (offline, rules misconfigured, etc.) no longer get
   mislabeled as a name conflict in the UI. Simplified `firestore.rules` accordingly — drivers never
   need read access to their own `drivers/{driverId}` doc at all (only to their `days` subcollection,
   and only admins need to read `drivers/{driverId}` itself, to list names).
   **If you touch `firestore.rules` or the claim flow again: re-test a brand-new, never-before-seen
   driver name specifically** — that first-write path is exactly what broke.
2. **admin.html bug — a driver's anonymous session was mistaken for an admin login.** Since
   `index.html` and `admin.html` share the same browser storage (same origin), and drivers sign in
   silently via Firebase Anonymous Auth, opening `admin.html` in a browser that had already used
   `index.html` skipped the login form entirely and tried to load the dashboard as that anonymous
   user — which correctly failed with permission-denied, but the *login gate itself* was wrong, not
   just the permissions. **Fix:** `admin.html`'s `onAuthStateChanged` handler now explicitly checks
   `user && !user.isAnonymous` before treating someone as logged in.

**Verified working, in the browser, against the real Firestore project** (via a local static
server serving the repo — Firebase Auth doesn't behave reliably over `file://`):
- Anonymous auth signs in silently and gets a stable uid.
- Setting a seller name claims `drivers/{driverId}` and shows "Synced to cloud as {name}".
- Logging a sale writes the full `day` object (including the `{sold, price}` snapshot) to
  `drivers/{driverId}/days/{date}` in Firestore within ~1s, confirmed by reading it back directly.
- **Write isolation, confirmed adversarially:** signed in as a second anonymous uid and attempted to
  (a) overwrite `drivers/test_driver_a`'s `ownerUid`, (b) write into its `days` subcollection, and
  (c) read its `days` subcollection — all three correctly denied with `permission-denied`.
- Simulated a second driver ("Test Driver B", after clearing local storage + Firebase's auth
  IndexedDB to mimic a fresh device) — got their own separate `driverId`/uid and synced
  independently without touching Driver A's data.
- `admin.html` login gate now correctly requires real email/password auth, separate from any
  driver's anonymous session in the same browser.

**Not yet done:** admin.html's dashboard *view* (KPIs/leaderboard/tables) hasn't been visually
confirmed against these two test drivers yet — that still needs the owner's admin account +
`admins/{uid}` doc to exist first (see checklist above). Code changes in this entry are pushed to
`main`; Netlify deploy not yet spot-checked live post-push.

### 2026-07-28 — Codex handoff verification

Read this brief and the full current `index.html`, `admin.html`, `firebase-config.js`, and
`firestore.rules` before making changes. The working tree was clean at commit `1bb7c9c`; no
application or schema changes were made.

**Verified in this pass:**

- The shared Firebase config is populated for `greenlife-ad21a`.
- The committed Firestore rules still implement the documented anonymous-driver ownership and
  admin-read model.
- Driver sales still store and calculate revenue from each sold item's saved `price` snapshot.
  The admin calculation also uses `it.price`; it does not look sold-item prices up in `MENU`.
- Both `index.html` and `admin.html` serve successfully from a local HTTP server (HTTP 200).
- The two simulated driver identities and adversarial isolation tests documented in the previous
  entry remain the latest completed live-Firestore driver tests.

**Still open / blocker:**

- The acceptance-criteria check of signing into `admin.html`, viewing Test Driver A and Test Driver
  B together, and numerically confirming the company total equals the sum of their individual
  totals is still blocked on the owner-provided Firebase email/password account plus its
  `admins/{uid}` authorization document. Do not weaken the rules or invent credentials to bypass
  this.
- Once owner access is available, explicitly record each driver's expected revenue, the displayed
  per-driver revenue, and the displayed combined total. Also change a live menu price temporarily
  (without changing the stored sale documents) and confirm the dashboard's historical revenue does
  not move.
- The production Netlify URL is not recorded in the repository and could not be reliably
  discovered from public search. Obtain it from the owner or Netlify project UI, then spot-check
  both `/index.html` and `/admin.html` after the final push.
- A headless visual pass was attempted locally, but the bundled browser runtime exited on a Windows
  filesystem-permission error. This is an environment limitation, not a passing UI test.

### 2026-07-28 — Codex owner-access and production checks

The owner supplied the Firebase email/password login and the Netlify production URL. Credentials
were used only for verification and were not written to the repository.

**Results:**

- Firebase Email/Password authentication succeeds. The owner account UID is
  `eq0DDMPneBbU3RZBo0WkMfcPSb63`.
- Reading the `drivers` collection as that authenticated account returns HTTP 403. The owner must
  create a Firestore document at `admins/eq0DDMPneBbU3RZBo0WkMfcPSb63` (document contents may be
  empty) and ensure the committed `firestore.rules` are deployed. Until then, the admin dashboard
  cannot read either test driver's data.
- The supplied production URL is `https://statuesque-florentine-36259d.netlify.app/`. Its root
  returns HTTP 200, but `/admin.html` and `/firebase-config.js` both return HTTP 404. The live root
  also does not contain the current Firebase project configuration. Therefore this Netlify site is
  serving an older or differently configured publish directory and is not deploying the current
  `main` branch contents described above.

**Human actions required before final verification:**

1. In Firestore, create `admins/eq0DDMPneBbU3RZBo0WkMfcPSb63` and deploy `firestore.rules`.
2. In Netlify, confirm the project is linked to `lucasreisps95/GreenLife`, production branch
   `main`, with the repository root as its publish directory (no build command), then trigger a
   production deploy of the latest commit.
3. Re-run the two-driver numerical aggregation and historical price-snapshot checks after both
   actions are complete.

### 2026-07-28 — Codex final live verification

The owner completed both human setup actions: the Firebase admin document was created and Netlify
successfully published the latest `main` branch.

**Verified live:**

- `https://statuesque-florentine-36259d.netlify.app/`, `/admin.html`, and
  `/firebase-config.js` all return HTTP 200.
- The owner email/password account authenticates and can read both driver records.
- Firestore contains two separate driver identities: `test_driver_a` and `test_driver_b`, each with
  its own day document and one Chicken Enchiladas sale saved at the captured price of `$16`.
- The live `admin.html` dashboard displays Test Driver A at `$16.00`, Test Driver B at `$16.00`,
  combined revenue of `$32.00`, combined commission of `$9.60`, and Chicken Enchiladas quantity 2.
  These values exactly match an independent calculation from the two saved day documents.
- Historical-price protection was explicitly tested in the live dashboard: after changing the
  browser's in-memory live-menu price for Chicken Enchiladas from `$16` to `$999` and re-rendering
  the same Firestore records, total historical revenue remained `$32.00`. No database or repository
  data was changed during this test.

The temporary browser-verification script contained the supplied owner credentials only while the
test ran; it was deleted before this log update and was never committed. All acceptance checks that
can be performed in this environment are now complete. A real two-physical-device field pass is
still advisable before rollout, but the two independent anonymous identities, write isolation,
cloud records, admin aggregation, live deployment, and price-snapshot behavior have all been
verified.

### 2026-07-28 — Codex owner dashboard v2 frontend

Created and pushed the review branch `owner-dashboard-v2`; `main` and the current live owner
dashboard were intentionally left unchanged.

**What changed in `admin.html`:**

- Rebuilt the owner interface around large, plain-language summary cards for total sales, driver
  commission, expected cash, and customer balances still owed.
- Added simple date filters for today, this week, this month, and all time.
- Added a daily sales chart, plain-sentence attention alerts, driver comparison, best sellers, and
  cash-by-driver reconciliation.
- Added a persistent English/Vietnamese switch. Vietnamese was chosen because the owner is
  Vietnamese with limited English; the translation covers login, navigation, filters, metrics,
  tables, alerts, and status text.
- Added responsive desktop, tablet, and phone layouts inspired by the two owner-provided dashboard
  references, while preserving GreenLife's green/teal identity and avoiding dense business jargon.
- Preserved the existing Firebase auth/schema and every calculation function. Sold revenue still
  comes only from each item's saved `price` snapshot.

**Verification:**

- Tested the branch locally against the real Firebase project and both existing driver records.
- Dashboard values remain exact: `$32.00` revenue, `$9.60` commission, two drivers, two items sold.
- Vietnamese overview renders correctly as `Tổng quan`.
- No JavaScript page errors occurred and a 390px-wide phone viewport had zero page-level horizontal
  overflow.
- A full-page visual screenshot was inspected; temporary screenshot/test files and the supplied
  owner credentials were removed before committing and were never pushed.

Next step: create or use Netlify's deploy preview for `owner-dashboard-v2`, let the owner review it
on her actual phone/tablet, then merge the branch to `main` only after approval.

### 2026-07-28 — Codex compact dashboard refinement

Refined `owner-dashboard-v2` after owner feedback that the first redesign felt too spread out.

- Reduced whitespace, card padding, chart height, and section spacing so the important information
  fits much more naturally on a laptop screen.
- Replaced the mostly empty attention area with a compact, more expressive green “business pulse”
  card inspired by the owner’s second dashboard reference. It shows total sales in a quick visual
  summary and becomes a clear warning when there is money to collect or food that was not sold.
- Corrected the wording around returns: the dashboard now describes this as **possible sales value
  from unsold food**, explicitly not the cost of making the food. The existing calculation is still
  based on each returned item’s menu value, so it must never be interpreted as actual food cost or
  profit loss.
- Kept English/Vietnamese translations aligned with the new language and verified the refreshed
  layout with the real Firebase driver data. The same `$32.00` sales and `$9.60` commission totals
  render correctly, with no phone-width overflow or browser errors.

The compact refinement is committed as `778103e` on `owner-dashboard-v2`; it is not on `main`.

### 2026-07-28 — Codex standalone owner-dashboard Netlify package

Added `owner-dashboard/` on the `owner-dashboard-v2` branch so the owner dashboard can be deployed
as its own Netlify site with a clean root URL, without affecting the existing driver app deployment.

- `owner-dashboard/index.html` is the approved compact owner dashboard.
- `owner-dashboard/firebase-config.js` contains the same public Firebase web configuration required
  by that independent static site.
- `owner-dashboard/README.md` documents the Netlify settings: choose branch `owner-dashboard-v2`,
  leave build command blank, and set publish directory to `owner-dashboard`.
- Verified locally that the standalone root and its Firebase config both return HTTP 200.

The standalone package is committed as `9c71672`. Future approved changes to `admin.html` must be
copied into `owner-dashboard/index.html` before redeploying the separate site.

### 2026-07-28 — Codex standalone Netlify deployment verification

The user created a separate Netlify site at `https://zippy-flan-6a77ad.netlify.app/` and reported
that the branch and publish settings were updated. A direct, cache-bypassed verification still shows
that this URL serves the old 107 KB driver app rather than the standalone 39 KB owner-dashboard
package. Its Firebase config file is available, but the root page is not yet the dashboard.

Before treating this deployment as complete, open the Netlify **Deploys** page and confirm that the
newest production deployment specifically reads `owner-dashboard-v2@59f8d45` (or a later commit on
that branch), not `main@…`. If it still shows `main`, the Production branch setting did not save.
If it shows the correct branch but still serves the driver app, confirm the Publish directory is
exactly `owner-dashboard`, save it, and trigger **Deploy project without cache**. The remaining work
is limited to this Netlify configuration/deploy state; repository source files are ready.

### 2026-07-28 — Codex public owner dashboard (explicit owner choice)

The owner explicitly chose to remove the owner sign-in page, despite the privacy trade-off. The
`owner-dashboard-v2` branch now makes the dashboard open directly with no Firebase Auth UI or
password flow.

- `admin.html` and `owner-dashboard/index.html` no longer show a login page or call Firebase Auth.
- `firestore.rules` now allow public reads of `drivers/{driverId}` and their `days` subcollections
  (`allow read: if true`). Driver write ownership rules were not changed.
- This exposes driver names, sales, cash figures, customer balances, returned-food figures, and
  best-selling items to anyone who knows the public dashboard URL. This is intentional per owner
  instruction, but it is a material loss of privacy and must remain clearly understood.
- The dashboard layout was checked locally: no login form is present, the dashboard shell is visible,
  and the Refresh action remains available. Firebase data will not load publicly until the updated
  Firestore rules are manually published in Firebase Console.

The no-login change is committed as `9e98133`. After Netlify deploys that commit, publish the
matching `firestore.rules` in Firebase Console → Firestore Database → Rules, then reload the
standalone dashboard URL.

### 2026-07-28 — Codex five-minute owner dashboard refresh

Added a gentle automatic data refresh to both `admin.html` and the standalone
`owner-dashboard/index.html`.

- The dashboard now runs its existing read-only refresh function every five minutes and displays a
  small “Updates every 5 minutes” notice (translated to Vietnamese as well).
- The manual Refresh button remains available.
- Verified at a 390px phone viewport: the no-login dashboard still has zero horizontal overflow and
  the refresh notice renders correctly.
- This does not write, alter, or recalculate sales. It only re-reads Firestore data. With the two
  current drivers, it is well within Firestore’s free daily read allowance for normal owner use;
  public access remains the larger usage/privacy consideration.

The refresh change is committed as `ec68370` on `owner-dashboard-v2`.

### 2026-07-28 — Codex owner product and driver controls

The owner only had a photograph of the legacy spreadsheet, not an importable workbook. Built the
first control-center version from that reference and the current GreenLife menu instead of guessing
at spreadsheet formulas.

- Added the protected `owner-dashboard/manage.html` page. It requires the real Firebase owner
  account to edit data, even though the reporting dashboard remains public by explicit owner choice.
- Added a weekday product-price editor initialized from the existing GreenLife menu. It supports
  changing prices, adding products within an existing category, and removing products from future
  menus. The first save creates `settings/menu` in Firestore.
- Added an editable driver display-name directory in `settings/driverDirectory`. These names appear
  on the dashboard but deliberately do not change a driver’s anonymous-auth identity, claimed
  driver ID, or historical records.
- Updated the driver app to read `settings/menu` when it starts. It falls back to the built-in menu
  if that document does not exist or cannot be read. Menu changes therefore apply to new sales after
  a driver refreshes or reopens the app; every completed sale retains its own saved `price` snapshot.
- Added owner-only write rules for `settings/*`; public reads remain enabled due the earlier explicit
  no-login dashboard decision. The updated Firestore rules must be published in Firebase Console
  before the controls can save.

Verified both the manager page and driver app inline JavaScript parse successfully. Commit
`97ce88d` contains the control center. Once Netlify deploys it, open `/manage.html` on the
standalone dashboard URL, sign in with the Firebase owner account, make a small price change, save,
then refresh a driver app before logging a new test sale to verify the new snapshot price.

### 2026-07-28 — Codex integrated public Settings tab

At the owner's explicit request, the separate management-page sign-in was removed and the controls
were placed directly in the standalone owner dashboard as one additional **Settings** navigation
item. The old `/manage.html` URL now immediately redirects to `/#settings`.

- The Settings tab combines the two everyday control tasks: choose a weekday and change future
  product prices; change the display names of drivers. The panel is compact, uses plain numbered
  steps, and keeps the save action next to the relevant task.
- The dashboard still uses saved item price snapshots for all sold-item revenue. A price change is
  stored in `settings/menu` for driver apps to use after refresh/reopen, and cannot change prior
  sales.
- Because the owner explicitly removed all authorization from this control center, `settings/*`
  writes are now public (`allow write: if true`). Anyone with the dashboard URL could alter future
  prices or driver display names. This is a serious integrity trade-off and was made solely at the
  owner's request for speed and no-login operation.
- The new dashboard source is committed and pushed to both `main` and the Netlify production branch
  `owner-dashboard-v2` as `f9f6b67`. Netlify should deploy it automatically. The matching updated
  Firestore rules still must be copied into Firebase Console and **Published** before Settings can
  save successfully.

### 2026-07-28 — Codex separated owner dashboard views

The owner requested simpler navigation and separate screens rather than a long combined dashboard.

- The owner dashboard navigation now has exactly three tabs: **Overview**, **Drivers**, and
  **Settings**. Overview contains only the reporting dashboard; Settings contains only operational
  controls.
- Settings now allows adding and removing products within each existing menu category, in addition
  to price edits. It also allows adding a future driver name and removing an un-synced driver from
  that list. Removing a driver never deletes an already-synced driver or any historical sales,
  which protects the sales record.
- The new Drivers tab gives a concise per-driver table: estimated items taken (sold plus returned),
  sold, returned, sales revenue, and the 30% driver commission. The current data schema does not
  separately record a physical “taken” count, so the UI clearly labels that figure as an estimate.

Source changes are committed and pushed to the Netlify branch as `23ab759`. Verify after deploy:
click each tab; add then remove a test product without saving; add a test future driver, save, then
reload. Remember Settings writes remain public by the owner’s explicit no-login choice.

### 2026-07-28 — Codex React, Tailwind, and shadcn-style rebuild

The owner explicitly requested a visual rebuild using React, Tailwind CSS, and shadcn dashboard
patterns, using `shadcndashboard/shadcndashboard` as the reference.

- Replaced the standalone `owner-dashboard/index.html` implementation with a compiled React/Vite
  app. Its source lives in `owner-dashboard/app/`; the compiled `index.html` and `assets/` remain
  directly in `owner-dashboard/`, so the existing Netlify project can keep publishing that same
  directory with no build-setting change.
- Added Tailwind configuration, shadcn registry metadata, React, Firebase modular SDK, and
  Lucide icons. The new presentation uses a clean shadcn-style sidebar, compact statistic cards,
  responsive tables, and clear one-action-per-control Settings UI while retaining the three
  existing data-backed views: Overview, Drivers, and Settings.
- Preserved Firestore data paths and safety behavior: historical sold revenue always uses each
  item's stored price snapshot; changing a menu price still affects future driver sales only.
- Verified `npm run build` succeeds with Vite and produces the committed static deploy files.
  `npm install` reported 12 dependency audit findings (10 moderate, 2 high); do not run an
  automatic force audit fix without reviewing a future dependency upgrade.
- Added a footer attribution link to Shadcn Dashboard, whose reference repository is MIT-licensed.

The feature commit is `a121169` on `owner-dashboard-v2`. Netlify should deploy it automatically.

### 2026-07-28 — Codex owner metrics and bilingual refinements

Owner requested a more practical overview based on data actually recorded in the driver app.

- Replaced the Sales activity bars with a responsive SVG line graph of daily sales.
- Replaced the unhelpful Cash expected card with **Square received**, calculated from driver-recorded
  Square payment entries. The dashboard still shows driver commission and returned-food count.
- Added **Top earning stops**, calculated from sold item price snapshots per named driver-app stop.
  This is revenue, not profit: the system does not have meal costs, so it must not be called actual
  profit.
- Restored the EN/VI toggle for desktop and mobile. Key navigation, filters, overview cards, and
  settings controls are translated; product names and driver/stop names remain as entered.
- Redesigned the Settings driver section around a visible name field plus **Add driver** button and
  clear remove buttons, rather than an icon-only control. Future driver removal never deletes sales.
- Removed the visible Shadcn attribution footer at the owner’s request.

Verified `npm run build` after the changes. Feature commit `43ac3fd` is pushed to the Netlify
production branch. Live deployment should occur automatically.

### 2026-07-28 — Codex route-manifest import assessment (not imported)

The owner supplied `route_manifest_2026-07-28 2.xlsx` and asked to wipe dashboard data and import
it. Workbook was inspected, but no Firestore data was deleted or written because the requested
operation needs an explicit safe import decision and Firebase write authority.

- Workbook has a `Days` summary and an `Items` detail sheet. It records Lucas on 2026-07-28 with
  $473.50 revenue, 36 sold items, 12 unsold items, $302.50 Square, $80.50 Zelle, $46 Venmo, and
  $44.50 cash. It has item-level price snapshots and named stop sales for nine identifiable stops.
- The summary says 10 stops while the item sheet identifies nine stops with sales; the zero-sale
  stop cannot be reconstructed from this export. It also does not identify which individual food
  items were returned, only the aggregate unsold count/value.
- **Do not seed `drivers/lucas` directly.** Driver IDs are permanently claimed by each device's
  anonymous Firebase owner UID. Creating that document from an import would prevent Lucas's actual
  driver app from claiming/syncing under his name later. A safe historical-import collection (or
  an explicitly labelled `Lucas (historical)` source) is required instead, then dashboard totals
  can combine it with future live Lucas data.
- Current Firestore rules also do not permit a client to delete/seed driver docs or write a
  historical-import collection. A human must either publish narrowly scoped import rules in Firebase
  Console or provide a temporary, local-only Firebase deploy credential. Never paste credentials in
  chat or commit them.

No project code changed in this assessment. The temporary workbook-inspection helper was kept
outside the repository.
