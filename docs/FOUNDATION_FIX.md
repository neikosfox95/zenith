# Foundation Fix — what was broken, what changed, how it is verified

This document records a ground-up repair of the project's **foundation**: the
backend's ability to boot and fail honestly, the way configuration and
credentials are resolved, the frontend's API/realtime plumbing, and the test
harness that proves all of it.

It deliberately does **not** cover feature work. Every item below is something
that was silently broken — meaning it produced no error at build time and no
crash at runtime, it just did the wrong thing.

---

## Contents

1. [Verification status](#verification-status)
2. [Backend: boot, configuration, and failure modes](#1-backend-boot-configuration-and-failure-modes)
3. [Backend: authentication](#2-backend-authentication)
4. [The realtime event contract](#3-the-realtime-event-contract)
5. [Frontend: one backend URL, one API layer](#4-frontend-one-backend-url-one-api-layer)
6. [Frontend: type safety](#5-frontend-type-safety)
7. [Developer experience: running the stack](#6-developer-experience-running-the-stack)
8. [Housekeeping](#7-housekeeping)
9. [Known gaps](#8-known-gaps)

---

## Verification status

| Check | Command | Result |
| --- | --- | --- |
| Backend unit + integration tests | `cd backend && npm test` | **79 / 79 pass** (incl. analytics) |
| Frontend type check | `cd frontend && npx tsc --noEmit -p tsconfig.json` | **0 errors** (was 128) |
| Frontend lint | `cd frontend && npx expo lint` | **0 errors** (warnings pre-existing) |
| Web bundle builds | `cd frontend && npx expo export --platform web` | clean |
| Live API smoke test | `node scripts/smoke-test.mjs` | **17 / 17 pass** (1 skip, needs a DB) |
| Live preview | `node scripts/dev-proxy.js` | app + API on one origin, `:8080` |

### User-scoped analytics (follow-up)

The foundation left a gap: the analytics screen called `/api/analytics/summary`
and `/api/analytics/realtime`, but those routes did not exist, and the dashboard
hook served hard-coded mock numbers. That gap is closed:

- `GET /api/analytics/summary` — authenticated, scoped through `user_creators`,
  aggregates `creators` / `live_streams` / `gifts` into total revenue, gifts,
  viewers, peak viewers, stream totals/averages, live gift/revenue totals, and
  current vs previous 30-day revenue periods (with `revenue_trend` /
  `revenue_change_pct`).
- `GET /api/analytics/realtime` — same ownership scope, live counters only.
- Both answer `401` anonymously and `503 DB_UNAVAILABLE` when Mongo is down.
- Frontend: `useAnalytics` / `useDashboard` hit the real endpoints; the revenue
  trend indicator is restored from period data; `creatorsAPI` normalises the
  paginated `{ data, pagination }` envelope and Mongo `_id` fields.
- Regression coverage lives in `backend/tests/analytics.test.js` (auth,
  ownership isolation, summary aggregation, realtime). The suite uses an
  in-process fake DB because this environment cannot download a MongoDB binary;
  it automatically prefers `mongodb-memory-server` when that host is reachable.

The TypeScript baseline of **128 errors** is the number of `error TS…` lines
reported by `tsc --noEmit` at commit `6ff843a`. It is not an estimate.

> ⚠️ **Use the project's own `tsc`.** `npx tsc` can resolve a *decoy* npm
> package also named `tsc`, which prints a banner ("This is not the tsc command
> you are looking for") and exits non-zero **without type-checking anything**.
> A pipeline that counts `error TS` lines then reads a clean "0 errors".
> Run `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`, or
> `npx --no-install tsc`, so the local compiler is guaranteed.

---

## 1. Backend: boot, configuration, and failure modes

### The server could not start

`server.js` read `process.env.*` inline at dozens of call sites. With no `.env`
file present:

- `jwt.sign(payload, undefined)` threw `secretOrPrivateKey must have a value`,
  so **every** register and login request 500'd.
- `httpServer.listen(PORT, HOST)` was a bare top-level call, so the module
  could not be imported without opening a socket — the server was untestable.
- An un-awaited `dbManager.connect()` rejected with nobody listening, producing
  an unhandled rejection that appeared as noise in every boot log.
- Cron schedules were written with four fields, which `node-cron` rejects.

**Now:**

- `backend/config/index.js` is the single place environment variables are read.
  It snapshots `process.env` once at module evaluation, validates it, coerces
  types, and collects human-readable `configWarnings` that are printed at boot.
- In non-production, a missing `JWT_SECRET` derives a **stable per-install**
  secret persisted to `backend/.dev-jwt-secret` (git-ignored). Auth works out of
  the box in development; in production a missing secret is a hard, visible
  failure rather than a silent one.
- `startServer()` is exported and only auto-invoked when `server.js` is the
  process entrypoint.
- `backend/.env.example` documents every variable with its default.

### The database took the whole API down

Mongo being unreachable used to prevent routes from mounting, so clients saw
`404 Not Found` — indistinguishable from "this endpoint does not exist".

**Now:** `backend/lib/db.js` owns one `dbManager` (an `EventEmitter`).

- Routes are **always** mounted, regardless of DB state.
- A DB-backed endpoint answers `503` with a structured `DB_UNAVAILABLE` code,
  never an opaque `500` and never a `404`.
- `connect()` **resolves to `null`** on failure; it never rejects. Retries are
  scheduled in the background (every 15s) and logged once.
- The failure event is named `connection-error`. This matters: `emit('error', …)`
  on an `EventEmitter` with no `error` listener **throws** — Node's special
  case — and that throw escaped the `catch` in `connect()`, so the retry was
  never scheduled and the promise rejected. There is a regression test for it.
- `/health` (liveness) always answers `200`; `/health/ready` answers `503` while
  the DB is down; `/api/health` reports per-component state honestly. All three
  are exempt from the rate limiter.
- `/api/health` never leaks a connection string's credentials. There is a test
  that pastes a `mongodb+srv://user:supersecret@host` URL in and asserts the
  password does not appear in the response.

### `.gitignore` did not work

It contained three duplicated "Environment files" blocks and literal `-e `
lines — shell artefacts from an unquoted `echo -e`. Worse, `android-sdk/ -e `
was parsed by git as a *pattern*, so it never matched anything.

**Now:** one consolidated, sectioned file. Runtime data (`backend/storage/`,
`backend/uploads/`, `backend/recorded_streams/`) is ignored, and `.env.example`
is explicitly un-ignored so the template stays in the repo.

---

## 2. Backend: authentication

`backend/middleware/auth.js` centralises token handling.

- `requireAuth` returns one consistent `401` envelope. An expired token and a
  malformed token are distinguishable (`TOKEN_EXPIRED` vs `INVALID_TOKEN`)
  without leaking why verification failed beyond that.
- `AUTH_MODE=permissive` exists for local development against fixtures. The
  default is `enforce`.
- `attachUser` populates `req.userId` when a valid token is present and never
  blocks — used by endpoints that personalise but do not require a login.
- Tokens are signed with an explicit `issuer`, and a token signed by someone
  else's issuer is rejected. Tested.

---

## 3. The realtime event contract

**This was the largest silent failure in the codebase.**

The backend emitted snake_case names — `new_gift`, `new_chat`, `creator_live`,
`viewer_update`. Every frontend hook subscribed to colon-separated names —
`live:gift`, `live:comment`, `creator:status`, `creator:viewers`.

The two sets had **zero overlap**. A grep for the intersection returned nothing.

The consequences were invisible: the socket connected, the UI showed a green
"live" indicator, and then no event ever arrived. Every realtime screen quietly
fell back to the mock data it shipped with. Nothing logged an error, because
from Socket.IO's perspective emitting an event nobody listens to is normal.

### The fix

`docs/REALTIME_EVENT_CONTRACT.md` is now the source of truth, with one
implementation per side:

- `backend/lib/realtime-events.js` — `REALTIME_EVENTS`, `LEGACY_EVENT_ALIASES`,
  `emitLive()`, `emitToUser()`, `userRoom()`, `normalizePayload()`.
- `frontend/src/realtime/events.ts` — the mirror, plus payload interfaces and
  field resolvers (`creatorIdFrom()`, `actorNameFrom()`, `commentTextFrom()`,
  `likeCountFrom()`).

`emitLive(io, event, payload)` broadcasts under the **canonical name and every
legacy alias**, so un-migrated clients keep working. Removing an alias is
therefore a deliberate breaking change, not an accident.

`normalizePayload()` guarantees the envelope:

- `creator_id`, `stream_id`, `user_id` are always **strings**. A live ObjectId is
  converted via `toHexString()`; an id that has already been through JSON
  arrives as a bare `{ $oid: "…" }` and is unwrapped — without that branch
  `String(value)` produced `"[object Object]"` and clients could not match the
  event to a creator.
- `timestamp` is always present and ISO-8601.
- The six activity events (`live:comment`, `live:gift`, `live:like`,
  `live:share`, `live:follow`, `live:join`) are stamped with `type` so a client
  on the generic feed can route them.
- It never mutates the caller's object. Call sites reuse payload objects across
  emitters; a mutation would leak `type`/`timestamp` into unrelated broadcasts.

`live:event` is deliberately **not** stamped. It *is* the generic feed, so its
`type` is the routing information the caller supplies (`logActivity()` passes
the activity kind). Overwriting it would destroy the only field a feed
subscriber can route on.

A serialisation failure on one alias does not suppress the others — each
`io.emit` is individually guarded. Tested.

### Targeted notifications reached nobody

`server.js` emitted to room `` `user_${userId}` `` (underscore). `emitToUser()`
targeted `` `user:${id}` `` (colon). And **no code anywhere ever joined either
room** — there was no `socket.join()` in the connection handler at all.

So `sendPushNotification()` completed successfully, returned a notification
object, and delivered it to an empty room. Every time.

**Now:**

- `userRoom()` is the single source of truth for the name, used by both the
  connection handler and `emitToUser()`. They cannot drift apart again.
- The connection handler authenticates the socket — either from
  `handshake.auth.token` or a later `authenticate` message — and joins it to
  `user:<id>`. `joinUserRoom()` is idempotent and emits `authenticated` with the
  room name so a client can confirm it worked.
- Creator-scoped rooms (`creator:<id>`) are available via `watch:creator` /
  `unwatch:creator`, so a monitoring screen can subscribe to only the creators
  it is displaying instead of the global firehose.

### Nine events bypassed the contract

`clip_created`, `gift_combo_milestone`, `gift_streak_milestone`,
`treasure_box_opened`, `new_subscription`, `milestone_achieved`,
`fan_tier_upgrade`, `badge_earned` and the targeted `notification` were still
hand-rolled `io.emit(...)` calls. They used canonical names, so they arrived —
but they skipped normalisation entirely: no `timestamp`, no id stringification,
and several had no `creator_id` at all (`fan_tier_upgrade`, `badge_earned`,
`gift_combo_milestone`), so a client could not attribute them to a creator.

All nine now go through `emitLive()` / `emitToUser()`. `new_subscription` was
missing from the canonical list and has been added as `SUBSCRIPTION_CREATED` on
both sides. **`server.js` now contains zero raw `io.emit()` calls.**

### Frontend hook bugs fixed alongside

- `socket.off('event')` with no handler removes **all** listeners for that
  event, including other hooks'. Every `off()` now passes the exact handler
  reference it registered.
- `useCreatorStatus` leaked its debounce timers and read `ref.current` inside
  effect cleanups, which resolves whatever the ref points at *when cleanup
  runs* — possibly a different `Set` after a re-render. Timers are tracked and
  cleared; ref values are captured at effect start.
- `useTikTokLiveEvents` **debounced** its batch flush. On a busy stream a
  debounce never fires — each new event pushed the flush further out — so the
  UI updated never. It is now a **throttle**: guaranteed flush at least every
  window, with an immediate flush on unmount.

### Drift guard

`backend/tests/realtime-events.test.js` parses `frontend/src/realtime/events.ts`
and asserts the two `REALTIME_EVENTS` maps have identical keys **and** values,
and that every legacy alias the backend emits is declared on the client. It
also greps `server.js` (comments stripped, so prose cannot trip it) for raw
`io.emit()` of any contract name and for hand-built `user:`/`user_` room names.

Renaming an event on one side only now fails `npm test` instead of silently
breaking every realtime screen.

---

## 4. Frontend: one backend URL, one API layer

### 35 screens were calling `undefined/api/...`

Two patterns were used to derive the backend URL:

```ts
process.env.EXPO_PUBLIC_BACKEND_URL
Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL
```

There was no `.env` file, and `app.json` had **no `extra` block at all**. Both
expressions evaluated to `undefined`.

Template-literal interpolation then produced the *string* `"undefined"`, so ten
AI screens were POSTing to a URL literally beginning `undefined/api/`. That is
not a network error a developer recognises — it looks like a typo in a path, and
the `fetch` rejection was caught by a generic handler that set an `error`
string the UI mostly ignored.

**Now:**

- `frontend/src/config/backend.ts` is the only place a backend URL is derived.
  Resolution order: `EXPO_PUBLIC_BACKEND_URL` (env, inlined by Babel) →
  `app.json` `extra` → **same-origin relative `/api` on web** → LAN IP on
  native. `BACKEND_URL`, `API_BASE`, `SOCKET_URL` and `mediaUrl()` are exported.
- Same-origin `/api` on web is what makes the single-origin dev proxy possible:
  no CORS, no mixed content (https page → http API), and no `localhost` that
  resolves to the *viewer's* machine rather than the server.
- All 35 screens import from it. Local derivation is gone.
- `app.json` now declares `extra.EXPO_PUBLIC_BACKEND_URL` (empty = "use the
  platform default") so the knob is discoverable.
- `frontend/src/services/authToken.ts` exposes `getTokenSync()` for the screens
  that call `fetch` directly instead of going through the API client, so they
  still send a bearer token.

A shipped-bundle check confirms zero occurrences of `undefined/api` and that the
canonical contract names are present in the 12 MB web bundle.

### Two API clients

There were two parallel HTTP layers — `src/services/api.ts` and
`src/services/api/apiClient.ts` plus `endpoints/*`. They are now unified on
`API_BASE`, with `apiClient` as the single transport and the endpoint modules as
thin wrappers.

---

## 5. Frontend: type safety

**128 → 0** TypeScript errors. The recurring root causes:

### `useLocalStorage` inferred `null`

```ts
const [cached, setCached] = useLocalStorage('alerts', null);
```

With the hook declared `<T>(key: string, initial: T)`, `T` inferred as `null`,
so the setter's type became `(val: null) => null`. Every `setCached(someArray)`
was an error, and every read was `null`.

The hook is now `<D, T = D>(key: string, initial: D)` — the *default* drives
inference and the *stored* type can be widened explicitly. It also:

- resolves the initial value synchronously through a `valueRef`, removing a
  stale-closure bug where the first render after a cache hit used the fallback;
- memoises with `useCallback`;
- guards cache reads with real types;
- sets a `cancelled` flag so an unmounted component cannot write state.

This one hook was the root cause of **40+** of the 128 errors across
`analytics`, `dashboard`, `live-monitoring` and `ai-studio-home-enhanced`.
Explicit type arguments were added at 8 call sites.

### Untyped `useState(null)`

An app-wide audit found exactly 10. In `phase10.tsx` five states held AI
prediction payloads; `useState(null)` inferred `null`, so reads like
`viralPrediction.viral_score` reported *"Property does not exist on type
never"* — 12 errors from 5 lines, and the entire screen's rendering was
unverifiable by the compiler.

They now have real interfaces (`ViralPrediction`, `GrowthForecast`,
`RevenueInsights`, `SentimentSnapshot`, `CompetitorSnapshot`) with optional
fields, because the API may return a partial payload.

Typing them **exposed a second, genuine runtime bug**: the fields are optional,
so `(viralPrediction.predicted_views / 1000).toFixed(1)` rendered `NaN`, and
`revenueInsights.current_revenue?.monthly.toFixed(2)` threw when
`current_revenue` was present but `monthly` was not — optional chaining guarded
the wrong link in the chain. `current_revenue` was also typed as a `number`
when the screen reads `.monthly` off it; it is a `Money` object. Defaults
(`?? 0`) and a `monthlyOf()` helper fixed both.

This is the argument for the type work: it was not cosmetic, it found crashes.

### Other recurring causes

- `LinearGradient` `colors` needs `readonly [ColorValue, ColorValue, ...]`.
  Palette arrays declared `string[]` are not assignable; `as const` fixes it.
- `{user && ({/* comment */} <Text>…)}` is **invalid JSX** — a comment plus an
  element is two children inside an expression container.
- `StyleSheet.create` had a duplicate `offlineText` key in `dashboard.tsx`; the
  second silently won, so one style was dead. Split into `offlineText` and
  `offlineBadgeText`.
- `<Ionicons name="database" />` is not a valid glyph — it renders *nothing*,
  with no warning. Changed to `server-outline`.
- `expo-blur`'s props differ from the legacy `BlurView` the glass components
  assumed. `src/components/glass/glassBlur.ts` adapts them in one place.
- `Haptics` calls rejected on web and on devices without a haptic engine; they
  are now fire-and-forget with a caught rejection.
- `useRef<NodeJS.Timeout>` vs `ReturnType<typeof setTimeout>`, and React 19's
  stricter `useRef` initial-argument rule.

---

## 6. Developer experience: running the stack

### `npm test` ran nothing

The script was `node --test tests/`. **Node 22 does not treat a bare directory
as a test root** — it tries to `require()` it and dies with `MODULE_NOT_FOUND`.
The output read `# tests 1 / # fail 1`, which looks like one broken test rather
than "the suite never ran".

It is now an explicit quoted glob, which Node expands recursively:

```json
"test": "NODE_ENV=test node --test --test-concurrency=1 'tests/**/*.test.js'"
```

`--test-concurrency=1` is required: the integration tests share a rate-limit
bucket and an app instance. `tests/helpers/env.js` must be the **first import**
in any test that transitively loads `config/index.js`, because that module
snapshots `process.env` at evaluation time. `tests/helpers/app.js` force-exits
100 ms after teardown (on an `unref`'d timer) because a live socket keeps the
runner hanging otherwise.

### Babel printed a deprecation on every build

`babel.config.js` listed `expo-router/babel`. In SDK 50+ that module is an
**empty stub** whose entire body is a `console.warn`. The real transform lives
in `babel-preset-expo/build/expo-router-plugin.js`. Removing it cleared two
warning lines from every Metro build, which matters because log noise is where
real problems hide.

### One origin for the browser

`scripts/dev-proxy.js` sits in front of both servers (dependency-free,
`node:http` only):

```
browser ──► dev-proxy (:8080, 0.0.0.0)
              ├── /api/*       ──► backend  (:8001)
              ├── /socket.io/* ──► backend  (:8001)   [incl. WS upgrade]
              ├── /uploads/*   ──► backend  (:8001)
              ├── /health*     ──► backend  (:8001)
              └── everything else ─► expo web (:8081)  [incl. HMR WS upgrade]
```

This is not a convenience. The Expo web bundle executes in the *viewer's*
browser, so it cannot call `localhost:8001` (that is the viewer's own machine),
cannot mix an https page with an http API, and would trip CORS on every request.

```bash
# terminal 1 — API
cd backend && node server.js                 # :8001

# terminal 2 — web
cd frontend && EXPO_OFFLINE=1 CI=1 npx expo start --web --port 8081 --host lan

# terminal 3 — single origin for the browser
node scripts/dev-proxy.js                    # :8080
```

`EXPO_OFFLINE=1 EXPO_NO_DEPENDENCY_VALIDATION=1` lets Expo start without
phoning home. `--host lan` binds `0.0.0.0`; note `--host 0.0.0.0` is **invalid**
— Expo asserts the value against `/^(lan|tunnel|localhost)$/`.

### Smoke test

`scripts/smoke-test.mjs` exercises a *running* server rather than a mocked one:
health trio honesty, no credential leakage, routes mounted while the DB is down,
`503 DB_UNAVAILABLE` instead of `500`, `401` on protected groups,
`INVALID_TOKEN` on a bad token, JSON `404` envelope, `400 MALFORMED_JSON`, no
stack traces in any response, upload path traversal rejected, `/uploads`
reachable without a token, CORS preflight not returning a literal `*`, no
`X-Powered-By`, and rate-limit headers present.

It reports **17/17** with one skip: the register → login → authenticated-call
round trip needs a real database.

---

## 7. Housekeeping

- 24 screens imported `Constants` from `expo-constants` and no longer used it
  after the URL migration. Removed — an unused import that reads as meaningful
  is how the next person re-introduces local URL derivation.
- 20 test artefacts had been **committed** under `backend/uploads/` (files named
  `rate_test_0.txt`, `serve_test.png`, …). Deleted, and `backend/uploads/` is
  now ignored. Tests write to `DATA_ROOT`, which defaults to a temp directory.
- 5 ESLint **errors** (`react/no-unescaped-entities` — apostrophes in JSX text
  in `login.tsx`, `alerts.tsx`, `dashboard.tsx`, `phase11.tsx`, `phase23.tsx`)
  were breaking `expo lint`. Escaped.
- Lint warnings fixed in files touched by this work: duplicate imports,
  `Array<T>` → `T[]`, unused `useCallback` / `networkMonitor` /
  `ActivityIndicator`, and the `useCreatorStatus` ref-cleanup warnings.
- `creatorsStore.ts`'s `Creator` type gained `viewer_count`, `peak_viewers`,
  `like_count`, `stream_title` and `updated_at` — fields the realtime payloads
  carry but the store could not hold.

---

## 8. Known gaps

Honest about what is *not* done:

- **No real MongoDB binary in this environment.** `mongod` and `redis-server`
  are not installable here. DB-backed paths are verified by (a) the `503`
  contract against a down database and (b) analytics aggregation against an
  in-process fake DB (`backend/tests/helpers/fake-db.js`). The fake prefers
  `mongodb-memory-server` automatically when the download host is reachable.
  The register/login round trip is still skipped in the smoke test.
- **ESLint warnings remain**, overwhelmingly unused variables and
  `react-hooks/exhaustive-deps` across screens not touched by this work. They
  are real debt; they are not fixed here because clearing them means reasoning
  about each screen's intent, which is feature work.
- **`useLiveGifts`, `useLiveComments` and `useLiveAnalytics` have not been
  audited** against the contract the way `useCreatorStatus` and
  `useTikTokLiveEvents` were. They subscribe through the shared contract module,
  so their *names* are correct; their debounce/throttle behaviour and their
  `off()` handling have not been individually reviewed.
- **`npm test` uses inline `NODE_ENV=test`**, which is POSIX-only. A Windows
  contributor needs `cross-env` (a new dependency) or to set the variable
  themselves. Deliberately not added here.
- **The frontend has no test runner.** There is no Jest/Vitest config in
  `frontend/package.json`, so the frontend is verified by `tsc`, `eslint`, a
  successful production export, and the backend's cross-language drift guard —
  not by unit tests. The drift guard is the load-bearing piece: it is what
  stops the event-name mismatch from recurring.
- **`withBackendProxy.js`** (an Expo config plugin that would attach the proxy
  to `expo start` directly) exists but is **not** wired into `app.json`'s
  `plugins`. The standalone `scripts/dev-proxy.js` is the supported path.

> Closed gap: user-scoped `/api/analytics/summary` and `/api/analytics/realtime`
> now exist, are authenticated, isolate ownership, and are covered by
> `backend/tests/analytics.test.js`. The dashboard and analytics hooks no longer
> ship mock numbers as their primary data source.
