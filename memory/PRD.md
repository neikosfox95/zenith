# PRD — Zenith Grade Super App (TikTok Live Stream Monitoring Platform)

## Original Problem Statement
Build a "1,000,000/1,000,000 Zenith Grade Super App" — a TikTok live stream monitoring platform.
Overarching goal: a "GOD TIER Enterprise level" codebase refactor across all 81 screens
(Phases 1 and 2), implemented in batches of 10 screens.

### Product Requirements
- Apply the `GodTierFramework` wrapper to systematically double code robustness/scale of the
  app's screens, batch by batch (10 screens per batch).
- Each enhanced screen gets: GodTierErrorBoundary, performance monitoring, analytics tracking,
  offline caching (useLocalStorage), network detection banner, haptics, testIDs.
- Frontend + backend testing must pass after each batch.

## Architecture
- **Backend**: Node.js/Express monolith on port 8001 (`/app/backend`). AI routing: Emergent LLM
  (primary) + Atlas Cloud (backup). 30 "phase" route groups + AI Studio + Analytics Engine +
  Creator Management routes.
- **Frontend**: Expo React Native (expo-router, tabs at `/app/frontend/app/(tabs)/`).
  Web preview: https://zenith-dashboard-3.preview.emergentagent.com
- **God Tier Framework**: `/app/frontend/src/utils/GodTierFramework.tsx` (error boundary,
  perf monitor, cache manager, network monitor, retry, validator, analytics tracker) +
  `/app/frontend/src/hooks/GodTierHooks.tsx` (useApiCall, useNetwork, useLocalStorage,
  useDebounce, useSearch, etc.)
- **Theme**: `/app/frontend/theme/TikTokTheme.ts` (dark, cyan #00F2EA / pink #FE2C55).
- **Charts**: victory-native **pinned to 37.3.6** (legacy VictoryChart API). DO NOT upgrade to
  v40/41 — that is the Skia rewrite which drops VictoryChart/VictoryLine/VictoryTheme and
  crashes 6 screens (trends, analytics, gift-analytics, business-dashboard + enhanced variants).

## What's Been Implemented
### Earlier sessions
- Batch 1 (10 screens) refactor complete + frontend tested.
- Fixed Expo Web "Cannot use 'import.meta'" via `babel.config.js` + `metro.config.js`.
- Batch 2 partial: `dashboard-enhanced.tsx`, `live-monitoring-enhanced.tsx`, `analytics-enhanced.tsx`.

### 2026-02 (this session) — Batch 2 COMPLETE (10/10)
- Created remaining 7 enhanced screens in `/app/frontend/app/(tabs)/`:
  `fan-club-enhanced.tsx`, `settings-enhanced.tsx`, `creators-enhanced.tsx`, `fans-enhanced.tsx`,
  `alerts-enhanced.tsx`, `trends-enhanced.tsx`, `history-enhanced.tsx`.
- Registered all enhanced routes in `(tabs)/_layout.tsx` with `href: null` (URL-accessible,
  hidden from tab bar).
- **Fixed app-wide chart crash**: downgraded victory-native 41.20.2 → 37.3.6 (legacy API).
- Fixed creators-enhanced delete button on web (added hitSlop).
- Testing: testing agent ran frontend suite → 6/7 pass; trends-enhanced chart crash fixed and
  re-verified via screenshot; creators delete re-verified. Report: /app/test_reports/iteration_1.json
- **God Tier Metrics dev screen** (`god-tier-metrics.tsx`, route `/god-tier-metrics`, hidden from
  tab bar): live observability dashboard — screen views / interactions / error counts, network
  status, performance timer bars (avg/min/max per label via new `performanceMonitor.getAllMetrics()`),
  live event stream (2s auto-refresh, LIVE/PAUSED toggle), clear-all button. Self-tested via
  browser automation (render + toggle verified).

## Known Issues (open)
- P1: Backend DB connection failing for Creator Management endpoints —
  `/api/analytics/creator/:username/events` fails; `/api/creators` returns 401 in preview
  (fans-enhanced shows empty state gracefully). Redis (ioredis) spams ECONNREFUSED 127.0.0.1:6379
  in backend logs (Redis not installed in pod) — non-fatal noise.
- MOCKED data: fan-club, creators, alerts, trends, history enhanced screens use local mock data;
  dashboard realtime hooks (`useDashboard.ts`) are mocked.

## Prioritized Backlog
- **P0**: Swap original Batch 2 screens with `-enhanced` versions (rename/replace or remap router)
  once user confirms.
- **P1**: Fix backend DB connection for Creator Management endpoints (then wire fans/creators
  enhanced screens to real APIs).
- **P1**: Phase 2, Batch 3 — God Tier enhancements for screens 21–30.
- **P1**: Phase 2, Batch 4 — screens 31–40.
- **P2**: Continue batches until all 81 screens enhanced.
- **P2**: Connect real DB data to mocked realtime hooks.

## Operational Notes
- Metro runs in CI mode — new route files require `sudo supervisorctl restart expo`.
- Expo web first load takes 60–90s (bundle compile); use generous timeouts in tests.
- Use `yarn` for frontend deps. Backend on 8001 via supervisor; routes prefixed `/api`.
