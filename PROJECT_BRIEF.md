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

### 2026-07-28 — Codex safe historical-import dashboard support (Firestore blocked)

Owner approved the safe approach: keep the spreadsheet as a separate historical source while
leaving Lucas's real phone identity unclaimed for future live sync.

- Added dashboard support for `settings/historicalData`: historical records are merged into
  overview totals, stop rankings, and the Lucas driver performance row through `mergeKey: "lucas"`.
  Existing `test_driver_a` and `test_driver_b` can be hidden from the owner view without deleting
  their Firestore docs. The code is committed as `e9f2585` on `owner-dashboard-v2`.
- Constructed a one-time import payload from the workbook with the 2026-07-28 Lucas sales, item
  price snapshots, nine named revenue stops, payment totals, and aggregate returned count. It does
  **not** create or modify `drivers/lucas`, so it cannot break Lucas's device claim or future sync.
- Attempted the approved one-time write to `settings/historicalData`; Firebase returned 403
  `PERMISSION_DENIED`. No dashboard data was deleted, and no spreadsheet data was written. This
  proves the currently published Firebase rules still do not match the repository's public
  `settings/*` write rule.
- Next required human step: Firebase Console → Firestore Database → Rules, replace/publish the
  current repository `firestore.rules` (it contains `match /settings/{settingId}` then
  `allow write: if true;`). Once published, retry the one-time historical import. This public write
  rule is a known integrity risk chosen by the owner for a no-login Settings experience.

### 2026-07-28 — Codex historical Lucas import completed

After the owner published the current Firestore rules, the approved one-time import succeeded.

- Wrote only `settings/historicalData`, containing Lucas's 2026-07-28 spreadsheet history:
  $473.50 revenue, 36 sold items, 12 aggregate returned/unsold items, $302.50 Square, and nine
  named sales stops. The owner dashboard is confirmed live with the import-aware React build.
- The two old test driver docs are hidden from owner-dashboard totals through the historical-data
  configuration; they were not deleted.
- The importer never wrote to any `drivers/*` document. A final read showed a `drivers/lucas`
  document exists (presumably from Lucas's real app); it was not created, updated, or claimed by
  the import. The historical record uses a separate ID with `mergeKey: "lucas"`, so dashboard
  totals combine historical Lucas data and future live Lucas phone data safely.
- Temporary import tooling and data payload files were removed from the repository after success.

### 2026-07-28 — Codex weekday-only menu-edit safeguard

Owner reported that adding Chicken Salad Sandwich on Tuesday appeared to affect other days.

- Checked the original weekly menu: Chicken Salad Sandwich was already part of the Monday,
  Thursday, and Friday menus; it was not originally part of Tuesday. The Tuesday change did not
  create those existing entries.
- Strengthened the Settings editor so every add/remove action explicitly names the selected weekday,
  updates only that weekday's menu data, and confirms that removal leaves the product on all other
  days.
- Added a clearly visible “This day only: [weekday]” label beside the weekday selector (also
  translated into Vietnamese), so it is obvious which day is being edited before saving.
- Built and pushed the safeguard as `1fd01fe` on `owner-dashboard-v2`. The owner-dashboard Netlify
  site deploys this branch automatically. The matching source will also be mirrored to `main`.

### 2026-07-28 — Codex dynamic sales-chart refinement

Reworked the Overview “Sales activity” chart after owner feedback that the prior single-point line
chart left too much empty space and did not make the values easy to read.

- Replaced it with a compact shadcn-style vertical bar chart, using subdued guide lines and a
  dollar-value scale on the left, inspired by the provided subscription-chart reference.
- The scale is dynamic: it calculates from the currently displayed daily sales and rounds upward,
  so it remains useful when daily sales increase or decrease. Individual day totals and dates stay
  directly visible.
- Production build completed successfully. The feature is commit `9e0b36f` on
  `owner-dashboard-v2`; Netlify deploys this branch automatically. The matching source will also
  be mirrored to `main`.

### 2026-07-28 — Codex React driver-app rebuild

The driver-facing root page was rebuilt in React, Tailwind CSS, and shadcn-style components, using
the same reference family as the owner dashboard. This is a visual and workflow rebuild, not a
data-model redesign.

- The mobile-first driver screen now has large tap targets and three clear views: Route, Returns,
  and Summary. It keeps stop navigation, renamed stops, arrival/departure timestamps, item sales,
  payments (including the existing $0.50 Square fee behavior), cash pouch, customer requests,
  returns, and spreadsheet-ready CSV export.
- Existing local browser records remain compatible: the new app reads both the previous per-day
  storage entries and new aggregate local storage. It continues using the existing Firestore
  `drivers/{driverId}/days/{date}` schema and anonymous-phone identity claim.
- Price snapshots are preserved: each sale saves `{ sold, price }` when logged, so menu changes
  cannot change the revenue on prior sales.
- Added `driver-app/` source and build configuration. Its Vite build emits the root `index.html`
  and `assets/` folder expected by the existing driver Netlify site, so no Netlify setting changes
  are required. `npx vite build` completed successfully. There are npm dependency audit findings;
  do not run a force audit upgrade without review.

Feature commit: `6564cd7` on `owner-dashboard-v2`; this must be mirrored to `main` for the live
driver site. Before field rollout, test one sale from Lucas's phone and confirm the dashboard
updates without changing his existing driver name.

### 2026-07-28 — Codex driver Excel-export compatibility

After the React rebuild, restored the original Excel export capability in addition to CSV export.
The Summary view now creates an `.xlsx` workbook with a `Days` sheet and an item-level `Items`
sheet, using the same sale price snapshots used for dashboard revenue. Build verified successfully.
Feature commit: `2e73898`; mirror it to `main` with the driver rebuild.

### 2026-07-28 — Codex driver-app rebuild reverted by owner request

The owner reviewed the React/Tailwind driver-app redesign and explicitly preferred the original
single-file driver app because its established functionality and English/Spanish toggle worked
better in practice.

- Reverted the React driver rebuild, its build-cache change, and its altered export package on both
  `owner-dashboard-v2` and `main`. The original `index.html`, its original data model, all legacy
  logging/export functions, and the English/Spanish toggle are restored.
- The owner dashboard was not changed by this revert.
- Revert commits on `main`: `23511fa`, `e943553`, and `5009887`. Netlify should automatically
  restore the original driver interface from `main`.
- A temporary untracked local dependency cache directory may remain in the local work folder due
  to a Windows file lock; it is not committed, not deployed, and can be ignored or removed after
  restarting the local development environment.

### 2026-07-28 — Codex returned-food possible-sales value

Owner requested that the Overview returned-food card show the money represented by returned plates,
not only the plate count.

- The card now keeps the returned plate count as its main number and adds the calculated dollar
  amount underneath as “possible sales value” (also translated to Vietnamese).
- This value is calculated from each returned item count and the matching menu price for that day.
  It is explicitly not presented as food cost, money already spent, or profit lost; the system does
  not have food-cost data.
- Production build completed successfully. Feature commit `96905b1` is on `owner-dashboard-v2`
  and should be mirrored to `main`.

### 2026-07-28 — Codex complete Vietnamese dashboard labels and clear removals

Owner reported that selecting Vietnamese translated only parts of the owner dashboard, and that
the driver-list deletion control was unclear.

- Completed visible Vietnamese labels for Overview, Drivers, and Settings, including dashboard
  card notes, no-data states, table headings, settings descriptions, save feedback, and controls.
  Product names, business stop names, and driver names remain unchanged because they are entered
  business data, not interface text.
- Replaced the small icon-only delete controls in Settings with clear red **Remove** buttons for
  products and future driver entries. Synced driver records remain protected: they cannot be
  deleted from Settings because deleting their history would be unsafe; the screen states this
  plainly.
- Production build completed successfully. Feature commit `b3a5573` is on `owner-dashboard-v2`
  and should be mirrored to `main`.

### 2026-07-28 — Codex intuitive driver-list removal

Owner clarified that the previous Driver list looked like a confusing name-editing form and did
not provide an apparent way to remove an existing driver such as Lucas.

- The Settings driver list now treats each person as a manageable entry with a clear red
  **Remove** button, rather than an icon-only action.
- Removing a synced driver now hides that driver from the owner dashboard through
  `settings/driverDirectory.hiddenDriverIds`; it does **not** delete their Firestore sales data or
  prevent the driver app from continuing to sync. The owner must press **Save driver list** to make
  the removal permanent.
- Future/manual drivers are removed from the list normally. Synced-driver removal is deliberately
  a safe dashboard hide rather than a destructive data delete.
- Production build completed successfully. Feature commit `5297151` is on `owner-dashboard-v2`
  and should be mirrored to `main`.

### 2026-07-29 — Codex Steak Burrito weekday menu addition

Owner requested the change shown in Lucas's handoff: add **Steak Burrito** at **$13** to the
Breakfast section on Monday through Friday.

- Added the item to all five weekdays in the driver app's built-in `MENU` and to the owner
  dashboard's `GREENLIFE_DEFAULT_MENU` source. The dashboard source now programmatically ensures
  the same default item exists for every weekday, avoiding drift between the two starting menus.
- Read the live `settings/menu` Firestore document before changing code: it returned 404, so no
  cloud-managed menu currently overrides these defaults. The new item is therefore active for
  drivers after Netlify deploys and their page is refreshed.
- No historical sales changed: only future menus are affected, and sold-item revenue remains based
  on saved price snapshots.
- Owner-dashboard production build passed. Feature commit `fa746fb` is on `owner-dashboard-v2`
  and should be mirrored to `main`.

### 2026-08-02 — Codex Lucas Cloud Code handoff

Prepared `LUCAS_HANDOFF.md` so Lucas can start from an empty Cloud Code session after receiving
his own GitHub, Netlify, and Firebase account invitations. It records the project links, branch
deployment arrangement, and the safeguards that must be preserved when working on sales, menus,
and Firestore. No credentials or private keys are stored in the repository.

### 2026-08-02 — Codex owner daily driver lists (Build 1)

Implemented the first half of the paper-sheet replacement: the owner dashboard now has a separate
**Daily lists** screen. The owner chooses a weekday date and driver, enters only the quantities
handed to that driver, and saves the list. Each saved line includes its category, item name,
quantity, and that day’s price snapshot. Existing lists can be reopened and updated without
affecting historical driver sales.

- Daily lists are stored in the existing public `settings/assignments-YYYY-MM` documents rather
  than a new public Firestore collection. This keeps the previous owner-approved no-login access
  boundary unchanged. Each month contains separately keyed driver/date entries.
- The owner dashboard build completed successfully. Feature commit `17b96a3` is on
  `owner-dashboard-v2` and needs mirroring to `main`.
- Build 2 remains open: update the driver app to load its own assigned list, record each sale by
  reducing that assignment, and reconcile unsold items as returns. Preserve the existing stored
  sale-price snapshot rule when doing this.

### 2026-08-02 — Codex daily-list driver integration (Build 2, initial rollout)

Connected the existing driver app to the owner-created daily lists without replacing the route,
payment, returns, timing, or export workflow that drivers already know.

- Once a driver’s name and selected date match a saved owner list, the app loads that list from
  `settings/assignments-YYYY-MM`, shows only assigned items, displays the remaining count beside
  each item, and prevents a driver from selling more than was assigned.
- A sale still saves its item price inside the sales record. When a daily list is active, that
  price comes from the owner’s saved daily-list price snapshot; otherwise the normal menu price is
  used. Past sales are not recalculated.
- If no matching list is available, or the phone is offline, the original normal-menu workflow
  remains available. The driver can refresh/reopen after the owner saves a list to load it.
- JavaScript syntax check passed. Feature commit `b9b7e2c` is on `owner-dashboard-v2` and needs
  mirroring to `main`. Field test still required: create a small Lucas daily list, refresh Lucas’s
  phone, sell one item, and verify remaining quantity and owner dashboard sales match.

### 2026-08-02 — Codex simplified daily-list and one-tap driver sales

Owner requested a substantially simpler daily-list experience for a nontechnical user, and asked
for the driver app to work as an assigned-inventory subtraction tool.

- Replaced the long all-items quantity sheet with a simple flow: choose date and driver, choose
  one food and quantity, press **Add to list**, adjust the selected list with visible plus/minus
  buttons, then press one large **Save driver list** button. Existing saved lists still reopen.
- When a driver has a matching daily list, the driver app now presents each assigned item with its
  remaining quantity and one **Sold 1** button. The driver selects a payment method once; each
  tap records one sale and its payment together, decreases the remaining amount, and cannot exceed
  the owner-assigned quantity. The old route workflow remains as fallback when no list exists.
- Each one-tap sale still stores its own daily-list price snapshot, so later menu changes cannot
  alter past sales. Owner-dashboard build and driver JavaScript syntax checks passed.
- Feature commit `7daebe5` is on `owner-dashboard-v2` and must be mirrored to `main`. A real
  Lucas phone test is still required before relying on it for a full route.

### 2026-08-02 — Codex categorized daily lists and prominent driver stock

Owner requested that the food picker stop using dropdowns and that both sides of the daily-list
screen stay visually organized. The driver also needed the remaining item quantity to be prominent
instead of a small note below the name.

- The owner’s **Food available** panel is now a regular categorized list with an **Add** button
  next to every item. **Items given to driver** is grouped by those same categories, with large
  visible plus/minus quantity controls.
- In assigned-list mode, the driver app now shows a large number of items **left** beside every
  food and a single **-1** button. The former +1/+2 counter controls are not shown for assigned
  food. Tapping -1 records that sale and the chosen payment method as before.
- Owner build and driver JavaScript syntax checks passed. Feature commit `d2fb89a` is on
  `owner-dashboard-v2` and must be mirrored to `main`.

### 2026-08-02 — Codex useful Unsold tab for assigned routes

Reworked the driver app’s Unsold tab so it is useful with the new assigned-inventory workflow.

- When a daily list is active, the tab is now an **End-of-day check** grouped by food category. It
  shows each item’s assigned quantity, sold quantity, and remaining quantity, plus route totals.
- The driver presses one clear **Finish route: save items left as returns** button at the end. This
  writes the remaining assigned quantities into the existing `day.returns` field, preserving the
  dashboard’s returned-food reporting and possible-sales-value calculations.
- The prior manual Unsold controls remain as fallback for days without an owner daily list. Driver
  JavaScript syntax check passed. Feature commit `aa6a066` is on `owner-dashboard-v2` and needs
  mirroring to `main`.

### 2026-08-02 — Codex restored bottom payment bar with payment splits

Owner reported that automatic payment recording per assigned-item sale removed the useful bottom
payment bar and made orders split across Square, Zelle, and Cash impossible.

- Assigned-item **-1** buttons now record only the food sale. Payment is collected separately for
  the whole order, restoring the bottom payment area whenever that stop has an unpaid balance.
- In assigned-list mode, the bottom area is now a **Payment split** panel. Each payment method has
  a slider and dollar field; drivers can fill two or more methods at once, see the entered total
  and balance left, then press **Record these payments**. Square still uses the existing fee logic.
- The original single-method quick-pay buttons remain on non-assigned days. Driver JavaScript
  syntax check passed. Feature commit `46cc816` is on `owner-dashboard-v2` and needs mirroring to
  `main`.

### 2026-08-02 — Codex compact optional payment splits

Owner found the full-height slider payment-split panel intrusive and hard to dismiss.

- Restored the compact bottom payment bar for assigned-list routes as well as normal routes.
  Tapping Cash, Square, Zelle, or another method immediately records the full unpaid balance,
  exactly as the original quick-payment flow did.
- Added a small optional **Split payment** section beneath the buttons. It stays hidden unless
  opened, can be closed at once, and records one partial amount at a time. The driver can reopen
  it and add a second or third payment method without any large overlay or sliders. Existing
  Square-fee calculation remains intact.
- Driver JavaScript syntax check passed. Feature commit `d881c3b` is on `owner-dashboard-v2` and
  must be mirrored to `main` before finishing. The field test is: record a sale, tap one payment
  method for a normal full payment; then record another sale, add two partial payments through
  Split payment, and confirm the remaining amount reaches zero.

### 2026-08-02 — Codex payment reminder and per-item sale undo

Owner reported that the payment controls could be hard to find after closing the optional split
section, and that a mistaken assigned-item sale could only be corrected by clearing the whole stop.

- The compact bottom payment bar remains present whenever the current stop has money still due.
  The order summary now also has a clear **Pay $...** reminder which points the driver back to the
  bottom payment buttons; it does not create or hide a separate payment state.
- Every assigned food item now has an **Undo** button beside **-1**. It puts back exactly one
  mistakenly logged item. To protect totals, Undo is blocked after any payment was recorded at
  that stop; the driver first removes the relevant payment, then undoes the item.
- Driver JavaScript syntax and whitespace checks passed. Feature commit `c12528e` is on
  `owner-dashboard-v2` and must be mirrored to `main` before finishing. Field test: log one item,
  undo it, log it again, then use the Pay reminder and collect it through the bottom bar.

### 2026-08-02 — Codex persistent payment bar and independent undo

Owner confirmed the prior Undo restriction was unacceptable and that the payment bar must be
reliably reachable even after a payment has been recorded.

- Assigned-item **Undo** now always puts back one item; it no longer requires clearing the stop or
  removing a payment first. If the sale had already been paid, the driver is reminded to check the
  payment. The persistent payment bar provides a clear **Remove [method] [amount]** button for
  correcting that payment without clearing the entire stop.
- The blue bottom payment bar now remains available for every stop with one or more logged items,
  instead of disappearing as soon as its unpaid balance reaches zero. When money is due it shows
  the usual payment-method buttons; when complete or over-collected it shows a plain status and
  the payment correction buttons. This restores a consistent place to handle payments.
- Driver JavaScript syntax and whitespace checks passed. Feature commit `2e9455e` is on
  `owner-dashboard-v2` and must be mirrored to `main` before finishing. Field test: log a sale,
  undo it before and after a payment, then remove the payment from the bottom bar if correction
  is needed.

### 2026-08-02 — Codex draggable payment sheet and slider payment splits

Owner asked for payment controls that do not depend on page scrolling, plus a slider-based way to
record an order paid with several payment methods.

- The blue payment area is now a true bottom sheet with a visible notch/handle. Tap the handle to
  minimize or reopen it; on a phone, swipe the handle down to minimize and up to reopen. It never
  self-minimizes in app logic. The order's **Pay** reminder also reopens it.
- In assigned-list mode, **Use more than one payment method** opens a compact split flow. The
  driver taps every method used, sees a slider under each selected method, adjusts the split, and
  records all selected payments together. Selecting methods starts with an even split of the
  remaining balance; sliders provide the final adjustment. Square continues to add its existing
  fee logic.
- The old manual dollar-entry split form was removed. Driver JavaScript syntax and whitespace
  checks passed. Feature commit `6a12fcf` is on `owner-dashboard-v2` and must be mirrored to
  `main` before finishing. Field test: minimize/reopen with the handle; split one order across two
  methods, adjust both sliders, and confirm recorded payments equal the order total.

### 2026-08-02 — Codex emergency driver-page syntax repair

The draggable payment-sheet update introduced a missing closing parenthesis in the generated
payment-bar markup. In browsers this caused `Unexpected token ';'`, which stopped the entire
driver application from loading.

- Corrected the malformed expression in `index.html` and immediately pushed the repair to both
  deployment branches. The feature is otherwise unchanged.
- Verified using a real browser against the live Netlify driver URL: the app now renders normal
  content and reports no page script errors. Repair commit `9f73245` is on
  `owner-dashboard-v2` and its mirrored commit `3be1187` is on `main`.
- Important regression check for future edits: run a browser load test, not only `node --check`,
  whenever modifying the large HTML-string rendering blocks in `index.html`.

### 2026-08-02 — Codex exact amount fields for split payments

Owner found range sliders impractical for entering precise payment amounts.

- Kept the multi-method selection workflow, but replaced every selected method's slider with a
  dollar amount field. The driver can now type the exact amount paid by Square, Zelle, Venmo,
  Credit Card, Cash, Owed, or any selected combination. The running selected-total and amount-left
  indicators remain, and **Record selected payments** uses those exact entered values.
- Confirmed no range-slider controls remain. JavaScript syntax, whitespace, and real-browser
  local load tests passed. Feature commit `e9703e3` is on `owner-dashboard-v2` and must be
  mirrored to `main` before finishing.

### 2026-08-02 — Codex stale payment-record repair

Lucas reported a payment panel showing one $12 food sale but many prior Cash entries and a large
overpayment. The screenshot showed payments from earlier cleared orders were retained on the same
stop while the food entries were removed, so the new sale was compared against stale payments.

- Added **Clear all payments for this stop** to the blue payment sheet. It asks for confirmation,
  removes every payment entry for that stop, and deliberately keeps the current food sale. This is
  the one-step repair Lucas needs for the existing affected stop.
- The existing two-tap **clear** action now clears both items and payments, preventing cleared
  orders from leaving behind payment records in future. Cash-pouch adjustments are unchanged.
- JavaScript syntax, whitespace, and real-browser load tests passed. Feature commit `ac2e108` is
  on `owner-dashboard-v2` and must be mirrored to `main` before finishing. Field test: record an
  item and payment, clear the order, then confirm no stale payment appears on the next order.

### 2026-08-02 — Codex stable payments, simplified Cash Pouch, faster first screen

Owner approved a simpler fixed layout and a responsiveness improvement.

- Replaced the minimizable/dragging payment sheet with a normal, always-open payment section in
  the Log screen. It appears above the Cash Pouch and keeps the same payment methods, exact
  multi-method amount fields, payment correction controls, and Square fee behavior.
- Moved Cash Pouch to the bottom of the Log screen. Kept the Starting Change setup and fixed the
  flex sizing so its confirmation button fits on narrow phones. Removed the manual Give/Add amount
  controls and the $1/$5/$10/$20 quick-change buttons beneath Cash Pouch as requested. Existing
  saved cash adjustments remain visible for historical context.
- Startup now renders today's route before it scans older local route history and begins cloud
  sync. This makes the first screen available sooner while preserving the same offline cache and
  Firestore sync behavior.
- JavaScript syntax, whitespace, mobile-width overflow, and real-browser load checks passed.
  Feature commit `7ad0c49` is on `owner-dashboard-v2` and must be mirrored to `main` before
  finishing. Field test: open the app on a phone, verify Payment stays open above Cash Pouch,
  confirm Starting Change Set fits, and verify normal sales still sync.

### 2026-08-02 â€” Codex restored floating payment panel

Owner preferred the blue payment controls attached to the bottom of the phone screen rather than
the inline always-open version.

- Restored the fixed bottom payment panel and its notch. Tap the notch to minimize or reopen; on
  a phone, swipe down to minimize and up to reopen. The order's **Pay** reminder reopens it.
- Preserved the prior Cash Pouch improvements: it remains at the bottom of the Log content, its
  Starting Change confirmation control fits narrow screens, and the removed Give/Add controls
  remain removed. The faster first-screen startup change also remains.
- JavaScript syntax, whitespace, mobile-width overflow, and real-browser load checks passed.
  Feature commit `c05588b` is on `owner-dashboard-v2` and must be mirrored to `main` before
  finishing.

### 2026-08-02 â€” Codex automatically open payment panel after sale

Owner requested a small convenience improvement for the assigned-food `-1` sale action.

- Whenever the driver taps **-1** to log an assigned item sale, the bottom payment panel now
  automatically expands if it was minimized. The driver can immediately choose payment without
  tapping the notch first. Manual minimize/expand behavior is otherwise unchanged.
- JavaScript syntax, whitespace, and real-browser load tests passed. Feature commit `afd81a4` is
  on `owner-dashboard-v2` and must be mirrored to `main` before finishing.

### 2026-08-02 â€” Codex simple usual lists and past-list history

Owner approved a simpler Daily Lists workflow for a nontechnical owner: reusable weekday lists
plus a compact history inside the existing Daily Lists screen.

- Replaced the active Daily Lists view with a paper-form-like screen: choose driver, choose date,
  add food with large buttons, review **Food given today**, then press one large **Save today's
  list** button.
- Added a driver-specific **Usual list** for each weekday. When a driver/date without a saved
  dated list is opened, its usual weekday quantities fill in automatically. **Use usual list**
  restores it at any time. **Make this the usual list** changes only that driver’s future same-
  weekday starting list.
- Usual lists save only food/category/quantity under `settings/assignmentTemplates`; every dated
  list still stores current item prices in its own dated record, preserving the sales-price
  snapshot rule and leaving past lists/sales unchanged.
- Added a compact **Past lists** section under the same form. It shows the selected driver's recent
  lists with date, item count, value, Open, Use again, and Show older lists. Use again copies
  quantities into the selected date; the owner must still press Save today's list.
- Owner production build and local/live real-browser checks passed. Feature commit `17d3de5` is
  on `owner-dashboard-v2` and must be mirrored to `main` before finishing. Field test: save a
  usual Monday list for Lucas, open a future Monday, confirm it fills automatically, make a
  today-only change, save, and verify a past Monday remains unchanged.

### 2026-08-02 â€” Codex streamlined Daily Lists

Owner found the visible usual-list and past-list controls redundant. The Daily Lists screen is
now only the simple current-day workflow: choose driver and date, add or subtract food, then
press **Save today's list**.

- Removed the visible Usual List banner, its restore button, its separate save button, and the
  Past Lists/history section.
- Kept the useful behavior behind the scenes: saving a driver's dated list automatically updates
  that driver's future list for the same weekday. Opening a new matching weekday starts from that
  remembered list without asking the owner to manage templates.
- The dated assignment still retains its own current prices, and completed sales still use their
  individual sale-price snapshots. Existing historical assignment records were not deleted.
- Owner production build passed. Feature commit `88a41b0` is on `owner-dashboard-v2`; mirror it
  to `main`, then confirm a saved driver list carries into the next matching weekday.

### 2026-08-02 â€” Codex Thai owner dashboard

The owner is Thai, not Vietnamese. Replaced the dashboard's English/Vietnamese chooser with an
English/Thai chooser, including the navigation, overview, settings, daily-list screen, and legacy
daily-list components. The visible language button now says **ไทย**.

- A browser that had previously selected Vietnamese is automatically switched to Thai the next
  time it opens the dashboard, so it cannot get stuck using a removed language option.
- Owner production build passed. Feature commit `f3b28e9` is on `owner-dashboard-v2`; mirror it
  to `main` and check the ไทย toggle on the live owner dashboard.

### 2026-08-03 â€” Codex one shared menu and Claude guidance

Lucas found an old, separate hardcoded menu in `admin.html`. It had drifted from the driver app,
so editing one file could silently leave the other view outdated.

- Removed the old `admin.html` food-and-price copy. That retired dashboard now loads only the
  shared `settings/menu` Firestore record, the same record saved by the owner dashboard Settings
  page and read by the driver app. If that shared record is unavailable, the retired dashboard
  shows an error rather than quietly using stale prices.
- Added root `CLAUDE.md`, which Claude Code automatically reads, and updated `LUCAS_HANDOFF.md`.
  Both state that menu changes must happen through owner Settings / `settings/menu`, never by
  editing `index.html` or `admin.html`. The driver app's static menu remains emergency offline
  fallback only.
- Admin JavaScript parsing and whitespace checks passed. Feature commit `66e56fc` is on
  `owner-dashboard-v2`. The safeguard was rebased safely onto Lucas's newer `main` menu work and
  published there as `d97e2eb` plus this log update; Lucas's current menu commits through
  `b95c551` were preserved. Lucas can use Claude on his phone for feature work, but its project
  instructions now prevent this menu-copy mistake.

### 2026-08-03 â€” Codex read-only regression check

Ran a non-destructive regression check against the current live driver app, live owner dashboard,
and the retired legacy dashboard. No sales, assignments, menu records, or driver identities were
created or changed.

- Latest `main` driver and legacy-dashboard scripts parsed successfully. Owner dashboard production
  build passed.
- The live owner dashboard loaded Overview, Drivers, Daily Lists, and Settings at phone width with
  no runtime page errors or horizontal overflow. The English/Thai switch also worked.
- **Open issue:** the shared Firestore document `settings/menu` does not currently exist. The
  driver app therefore falls back to its built-in emergency menu, and `admin.html` correctly shows
  that the shared menu is not ready instead of using stale copied prices. To activate shared menu
  sync, open the owner dashboard **Settings** tab and press **Save menu** once after confirming
  the displayed items/prices are correct. Do not seed or overwrite that menu from code without
  owner approval.
- A write-free browser session cannot fully exercise the real Lucas/Gabriel daily-assignment and
  payment-recording paths because using their names on a fresh browser would claim a driver
  identity. After the shared menu is saved, field-check on each driver phone: refresh the page,
  confirm the assigned list and current menu appear, record one sale, verify it reaches owner
  Overview/Drivers, then remove/correct it only if needed.
- **Additional blocker found during comparison:** the owner dashboard's local starting menu is
  older than Lucas's latest `main` driver menu (132 versus 141 items; it lacks recent Tuna
  Avocado/Tuna Protein Plate additions and several updated Wednesday/Friday items and prices).
  Therefore do **not** press owner Settings **Save menu** yet: doing so would create
  `settings/menu` using the older owner fallback and replace Lucas's newer live-menu baseline for
  drivers. A follow-up change must first make the owner dashboard start from the current main
  menu, then the owner can review and save that single shared record.
