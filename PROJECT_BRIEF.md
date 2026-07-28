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
