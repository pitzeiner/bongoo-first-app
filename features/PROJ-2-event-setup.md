# PROJ-2: Event Setup (Fest anlegen & konfigurieren)

## Status: In Review
**Created:** 2026-03-01
**Last Updated:** 2026-03-05

## Dependencies
- Requires: PROJ-1 (Multi-Tenant Onboarding) — eingeloggter Admin mit Vereinszugehörigkeit

## User Stories
- Als **Vereins-Admin** möchte ich ein neues Fest anlegen (Name, Datum, Ort), damit es als Kontext für alle weiteren Konfigurationen dient.
- Als **Vereins-Admin** möchte ich ein Fest aktivieren oder deaktivieren, damit Terminals nur bei aktiven Festen funktionieren.
- Als **Vereins-Admin** möchte ich mehrere Feste verwalten (z.B. Maifest, Herbstfest), damit ich den Überblick behalte.
- Als **Vereins-Admin** möchte ich ein vergangenes Fest archivieren (schreibgeschützt), damit die Daten erhalten bleiben ohne aktiv zu sein.
- Als **Vereins-Admin** möchte ich ein bestehendes Fest duplizieren, damit ich beim nächsten Fest nicht alles neu einrichten muss.

## Acceptance Criteria
- [ ] Admin kann ein neues Fest anlegen mit: Name (Pflicht), Datum (Pflicht), Ort (optional), Beschreibung (optional)
- [ ] Fest hat einen Status: `draft`, `active`, `archived`
- [ ] Nur ein Fest kann gleichzeitig `active` sein (pro Verein)
- [ ] Terminals können sich nur mit einem `active` Fest verbinden
- [ ] Admin kann Fest-Details jederzeit bearbeiten (solange nicht archiviert)
- [ ] Fest kann dupliziert werden (Artikel + Stationen werden kopiert, Bestellungen nicht)
- [ ] Fest-Liste zeigt alle Feste des Vereins, sortiert nach Datum (neueste zuerst)
- [ ] Archivierte Feste sind lesbar, aber nicht bearbeitbar

## Edge Cases
- Fest-Datum in der Vergangenheit beim Anlegen → Warnung, aber erlaubt (für nachträgliche Eingabe)
- Aktivieren eines Fests, wenn bereits eines aktiv ist → Bestätigungsdialog: altes Fest deaktivieren?
- Fest mit aktiven Bestellungen deaktivieren → Warnung, laufende Bestellungen bleiben sichtbar
- Fest löschen → nur möglich im `draft`-Status, sonst nur archivieren
- Duplikat eines Fests ohne Artikel → leeres Fest mit Metadaten

## Technical Requirements
- Tabelle: `events` mit `organization_id`, `status`, `name`, `date`, `location`
- RLS: Nur eigener Verein kann lesen/schreiben
- Status-Übergänge:
  - `draft → active` (Aktivieren)
  - `active → draft` (Deaktivieren — erlaubt, solange keine laufenden Bestellungen)
  - `draft/active → archived` (Archivieren — keine Rückschritte aus archived)
  - Hinweis: Archivierung ist endgültig, kein Zurücksetzen möglich
- Duplikation per Server Action (kopiert Artikel + Stationen, nicht Bestellungen)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Overview
Event Setup extends the existing `/setup` area from PROJ-1. The Admin gets a new "Events" section in the sidebar to create, manage, and control the lifecycle of their association's events.

### Component Structure

```
/setup/events  (Event List Page)
├── EventsHeader
│   └── "New Event" button → /setup/events/new
├── EventStatusTabs  (filter: All | Draft | Active | Archived)
└── EventsTable
    └── EventRow (one per event)
        ├── EventStatusBadge  (draft / active / archived)
        ├── Event info (name, date, location)
        └── ActionsDropdown
            ├── Edit → /setup/events/[id]
            ├── Activate  (draft only)
            ├── Deactivate  (active only)
            ├── Duplicate
            ├── Archive  (active or draft)
            └── Delete  (draft only)

/setup/events/new  (Create Event Page)
└── EventForm
    ├── Name field  (required)
    ├── Date picker  (required)
    ├── Location field  (optional)
    ├── Description field  (optional)
    └── Cancel + Save buttons

/setup/events/[id]  (Edit Event Page)
├── EventForm  (pre-filled)
├── EventStatusBadge + status transition buttons
│   ├── "Activate"  (draft only)
│   ├── "Archive"   (draft or active)
│   └── Read-only notice  (archived)
└── DangerZone
    └── "Delete Event"  (draft only)

Dialogs:
├── ActivateConfirmDialog  — another event is active, deactivate it first?
├── DeactivateWarningDialog  — active orders exist, deactivate anyway?
├── DuplicateDialog  — choose name for the copy
└── DeleteConfirmDialog  — cannot be undone
```

### Data Model

**Table: `events`**

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| organization_id | UUID | Links to the association (from PROJ-1) |
| name | Text | Required, e.g. "Maifest 2026" |
| date | Date | Required |
| location | Text | Optional |
| description | Text | Optional |
| status | Enum | `draft`, `active`, or `archived` |
| created_at / updated_at | Timestamp | Auto-managed |

**Status rules:**
- Transitions are one-way only: `draft → active → archived`
- Only one event per organization can be `active` at a time
- Terminals (PROJ-4/5) check for an `active` event to connect
- Duplication copies metadata only; articles + stations copied as stubs for future features

### API Routes

| Route | Purpose |
|---|---|
| `GET /api/setup/events` | Load all events for the organization |
| `POST /api/setup/events` | Create a new event |
| `GET /api/setup/events/[id]` | Load a single event |
| `PATCH /api/setup/events/[id]` | Edit event details |
| `DELETE /api/setup/events/[id]` | Delete a draft event |
| `POST /api/setup/events/[id]/activate` | Activate (with conflict check) |
| `POST /api/setup/events/[id]/archive` | Archive an event |
| `POST /api/setup/events/[id]/duplicate` | Copy event to new draft |

### Tech Decisions

| Decision | Reasoning |
|---|---|
| Extends `/setup` layout | Reuses sidebar, auth guard, and org context from PROJ-1 — no extra setup |
| Status enforced server-side | "Only one active event" rule needs server-side enforcement to prevent race conditions |
| Status as 3-state enum | draft/active/archived maps cleanly to business states; booleans would be ambiguous |
| Dedicated duplicate endpoint | Multi-step copy is atomic and auditable as a dedicated server action |
| shadcn Calendar + Popover | Already available in the project — no new date library needed |
| react-hook-form + Zod | Already used in PROJ-1; consistent validation across the app |

### Dependencies

| Package | Purpose | Status |
|---|---|---|
| `react-hook-form` | Form state management | Already installed |
| `zod` | Input validation | Already installed |
| `date-fns` | Date formatting in table | Check if installed |
| shadcn `calendar` | Date picker component | May need: `npx shadcn@latest add calendar` |

## QA Test Results

**Tested:** 2026-03-05
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (Next.js production build compiles cleanly, all routes registered)
**Lint Status:** FAIL (pre-existing BUG-20 from PROJ-1 -- `next lint` misconfigured)

---

### Acceptance Criteria Status

#### AC-1: Admin kann ein neues Fest anlegen mit Name (Pflicht), Datum (Pflicht), Ort (optional), Beschreibung (optional)
- [x] **EventForm** renders Name (required), Date picker (required), Location (optional), Description (optional)
- [x] **Zod validation** enforces `name.min(1).max(100)`, `date` as required Date object, `location.max(200)`, `description.max(1000)`
- [x] **POST /api/setup/events** validates with Zod, inserts into `events` table with `status: 'draft'`
- [x] **Server-side auth check** verifies user is authenticated and has admin role before creating
- [x] **Calendar component** uses shadcn Calendar with German locale (date-fns `de`)

#### AC-2: Fest hat einen Status: draft, active, archived
- [x] **Database CHECK constraint** enforces `status IN ('draft', 'active', 'archived')`
- [x] **EventStatusBadge** renders correct label and variant for each status
- [x] **Status displayed** in EventsTable and on event detail page

#### AC-3: Nur ein Fest kann gleichzeitig active sein (pro Verein)
- [x] **Unique partial index** `idx_events_one_active_per_org` enforces at database level
- [x] **RPC function** `activate_event` atomically deactivates other active events before activating the target
- [x] **ActivateConfirmDialog** shown when another event is already active (client-side check in EventsTable)

#### AC-4: Terminals koennen sich nur mit einem active Fest verbinden
- [x] **Not directly testable in PROJ-2 scope** -- terminal connection is PROJ-4/5 territory
- [x] **Infrastructure ready:** `events.status` field and "only one active" constraint are in place for downstream features to query

#### AC-5: Admin kann Fest-Details jederzeit bearbeiten (solange nicht archiviert)
- [x] **PATCH /api/setup/events/[id]** checks `event.status === 'archived'` and returns 409 if true
- [x] **RLS UPDATE policy** includes `AND status != 'archived'` in USING clause
- [x] **EventForm** passes `readOnly={isArchived || !isAdmin}` to disable inputs for archived events and non-admins

#### AC-6: Fest kann dupliziert werden (Artikel + Stationen werden kopiert, Bestellungen nicht)
- [x] **POST /api/setup/events/[id]/duplicate** copies name, date, location, description; sets status to 'draft'
- [x] **DuplicateDialog** prompts user for new name with default "(Kopie)" suffix
- [ ] **BUG-27:** Duplication does NOT copy articles or stations as specified in the acceptance criterion. The spec states "Artikel + Stationen werden kopiert, Bestellungen nicht" but the duplicate endpoint only copies event metadata. The Tech Design notes say "articles + stations copied as stubs for future features" -- however the acceptance criterion explicitly requires it. Since articles/stations tables do not exist yet (PROJ-3/4), this is blocked by dependencies.

#### AC-7: Fest-Liste zeigt alle Feste des Vereins, sortiert nach Datum (neueste zuerst)
- [x] **GET /api/setup/events** and EventsPage server component both query with `.order('date', { ascending: false })`
- [x] **EventsTable** renders all events with name, date (formatted with date-fns German locale), location, and status badge
- [x] **EventStatusTabs** filter events by All, Active, Draft, Archived with correct counts
- [x] **Empty state** shows "Keine Veranstaltungen gefunden." when no events match

#### AC-8: Archivierte Feste sind lesbar, aber nicht bearbeitbar
- [x] **EventForm** renders as read-only when `isArchived` is true (all inputs disabled, no save button)
- [x] **EventActionsPanel** returns null when status is 'archived' (no action buttons)
- [x] **PATCH API** returns 409 for archived events
- [x] **RLS UPDATE policy** blocks updates to archived events at database level
- [x] **EventsTable dropdown** shows "Ansehen" instead of "Bearbeiten" for archived events, and hides Activate/Archive options

---

### Edge Cases Status

#### EC-1: Fest-Datum in der Vergangenheit beim Anlegen
- [ ] **BUG-28:** No warning is displayed when selecting a past date. The spec says "Warnung, aber erlaubt (fuer nachtraegliche Eingabe)". The EventForm and Calendar component do not restrict or warn about past dates -- selection is allowed (which is correct), but there is no warning message shown to the user.

#### EC-2: Aktivieren eines Fests, wenn bereits eines aktiv ist -- Bestaetigungsdialog
- [x] **EventsTable** checks for an existing active event via `events.find(e => e.status === 'active')` and shows `ActivateConfirmDialog` when found
- [x] **ActivateConfirmDialog** names the currently active event and explains it will be deactivated
- [x] **Server-side RPC** atomically handles the swap in a single transaction
- [ ] **BUG-29:** On the event detail page (`EventActionsPanel`), clicking "Fest aktivieren" always shows the ActivateConfirmDialog, even when NO other event is active. The dialog's `activeEventName` prop receives the CURRENT event's name (not the conflicting one), making the message confusing. It says "Das Fest [current event name] ist derzeit aktiv" which is misleading when the event is in draft status.

#### EC-3: Fest mit aktiven Bestellungen deaktivieren -- Warnung
- [ ] **BUG-30:** The `DeactivateWarningDialog` specified in the tech design is NOT implemented. Deactivating an active event (from both the list and detail page) happens without any warning about active orders. The spec requires a warning that active orders remain visible. This is partially acceptable since the orders feature (PROJ-5) does not exist yet, but the dialog component itself is missing.

#### EC-4: Fest loeschen -- nur moeglich im draft-Status
- [x] **DELETE API** returns 409 `"Nur Entwuerfe koennen geloescht werden"` for non-draft events
- [x] **RLS DELETE policy** enforces `AND status = 'draft'` at database level (double protection)
- [x] **EventsTable** only shows "Loeschen" dropdown item for draft events
- [x] **EventActionsPanel** only shows DangerZone for draft events
- [x] **DeleteConfirmDialog** warns that deletion is irreversible

#### EC-5: Duplikat eines Fests ohne Artikel
- [x] Duplication works correctly even without articles -- copies event metadata only and creates a new draft

---

### Security Audit Results (Red Team)

#### Authentication
- [x] **All API routes verify authentication:** Every handler calls `supabase.auth.getUser()` and returns 401 if not authenticated
- [x] **Server pages verify authentication:** `EventsPage`, `NewEventPage`, `EventDetailPage` all redirect to `/auth/login` if no user
- [x] **Middleware protection:** Proxy guards all `/setup/*` routes (from PROJ-1)

#### Authorization
- [x] **Admin-only write operations:** POST (create), PATCH (update), DELETE, activate, archive, duplicate all check `profile.role !== 'admin'` and return 403
- [x] **RLS enforces org isolation:** All queries filter by `organization_id` from the authenticated user's profile
- [x] **RLS INSERT policy:** Only admins can insert events (checked at DB level)
- [x] **RLS UPDATE policy:** Only admins can update non-archived events (DB level)
- [x] **RLS DELETE policy:** Only admins can delete draft events (DB level)
- [x] **New event page blocks non-admins:** `NewEventPage` redirects to `/setup/events` if role is not admin
- [x] **Event detail page blocks non-admin editing:** Form rendered as readOnly for non-admins
- [ ] **BUG-31:** The GET `/api/setup/events` endpoint does NOT check for admin role -- it only checks for `profile.organization_id`. This means `setup_user` roles can read all events via the API. However, this appears INTENTIONAL since setup_users should be able to see events. The `EventsPage` server component also allows any org member to view events. The "Neues Fest" button is correctly hidden for non-admins. PASS (not a bug -- setup_users need read access).

#### Input Validation
- [x] **Zod schemas on all write routes:** Create (POST), Update (PATCH), Duplicate all validate input with Zod
- [x] **Date format validation:** Regex `^\d{4}-\d{2}-\d{2}$` ensures only valid date strings
- [x] **Max lengths enforced:** Name (100), Location (200), Description (1000) -- both Zod and DB CHECK constraints
- [x] **Min length enforced:** Name must be at least 1 character -- both Zod and DB CHECK
- [ ] **BUG-32:** The PATCH endpoint accepts partial updates via `z.object` with all `.optional()` fields. Sending an empty body `{}` passes Zod validation and executes `supabase.from('events').update({}).eq('id', id)`. While Supabase likely handles this as a no-op, the API should reject empty update payloads. Additionally, the update schema does not include `status` as a field, which is correct (status changes go through dedicated endpoints), but there is no explicit rejection of a `status` field in the body -- Zod's default behavior strips unknown fields, which is safe.

#### Cross-Organization Data Access
- [x] **Event lookup always scoped:** `resolveEvent()` queries with both `eq('id', eventId)` AND `eq('organization_id', profile.organization_id)` -- prevents accessing other org's events even with a known UUID
- [x] **RLS as second defense:** Even if application code had a bug, RLS policies filter by `auth.uid()` linked to the user's org

#### SQL Injection / RPC Security
- [x] **Supabase client handles parameterization** -- no raw SQL in application code
- [ ] **BUG-33 (HIGH):** The `activate_event` RPC function is declared as `SECURITY DEFINER`, meaning it runs with the privileges of the function owner (typically the database owner/superuser), bypassing RLS entirely. Any authenticated user who knows an event UUID can call `supabase.rpc('activate_event', { target_event_id: '<any-event-uuid>' })` and activate ANY event in the database, regardless of organization. The API route does check org membership before calling the RPC, but the RPC itself has no internal authorization check for `organization_id` ownership. If the API check were bypassed (e.g., direct Supabase client call from browser using the anon key), this would allow cross-org event manipulation.

#### Rate Limiting
- [ ] **BUG-34:** None of the PROJ-2 API routes use the `checkRateLimit` function from `src/lib/rate-limit.ts`. An authenticated admin could send rapid requests to create, duplicate, activate, archive, or delete events without any throttling.

#### Sensitive Data Exposure
- [x] **No secrets in client code:** All event operations use the user-scoped Supabase client
- [x] **API responses are minimal:** Only return event data or success/error messages
- [x] **GET /api/setup/events** selects only needed columns (id, name, date, location, status, created_at)

---

### Cross-Browser Testing (Code Review)

All components use standard React, shadcn/ui primitives, and Tailwind CSS. No browser-specific APIs detected.

- [x] **Chrome:** Standard compatibility expected
- [x] **Firefox:** No Firefox-incompatible APIs or CSS used. `date-fns` format is locale-safe.
- [x] **Safari:** Calendar uses `react-day-picker` which is cross-browser compatible. Date parsing uses `new Date(event.date + 'T00:00:00')` which avoids timezone issues.

### Responsive Testing (Code Review)

- [x] **Mobile (375px):** EventForm uses `max-w-xl` with standard form layout -- responsive. Calendar Popover aligns to start.
- [ ] **BUG-35:** The EventsTable renders a full-width HTML `<Table>` component with 5 columns (Name, Datum, Ort, Status, Actions). On 375px screens, this will likely overflow horizontally. No horizontal scroll wrapper (`overflow-x-auto`) is applied, and there is no responsive card layout for mobile. Same issue as BUG-23 from PROJ-1 (UserManagementTable).
- [x] **Tablet (768px):** Layout works well -- sidebar switches from sheet to fixed, content area has sufficient width for the table.
- [x] **Desktop (1440px):** Content constrained by `max-w-xl` on form pages; table stretches to fill available space.

---

### Bugs Found

#### BUG-27: Duplication does not copy articles or stations
- **Severity:** Low
- **Steps to Reproduce:**
  1. Duplicate an event via the Duplicate action
  2. Expected: Articles and stations are copied to the new event (per acceptance criterion AC-6)
  3. Actual: Only event metadata (name, date, location, description) is copied
- **Note:** This is blocked by PROJ-3 and PROJ-4 (articles and stations tables do not exist yet). The Tech Design explicitly notes "articles + stations copied as stubs for future features." This should be revisited when those features are built.
- **Priority:** Fix when PROJ-3/PROJ-4 are implemented (deferred)

#### BUG-28: No warning for past dates when creating an event
- **Severity:** Low
- **Steps to Reproduce:**
  1. Go to /setup/events/new
  2. Select a date in the past
  3. Expected: A warning message is shown (spec: "Warnung, aber erlaubt")
  4. Actual: Event is created without any warning
- **Priority:** Fix in next sprint

#### BUG-29: ActivateConfirmDialog on detail page shows misleading message
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Create two events (Event A and Event B), both in draft status
  2. Open Event B's detail page at /setup/events/[id]
  3. Click "Fest aktivieren"
  4. Expected: If no other event is active, activation proceeds directly (no dialog). If another event IS active, dialog shows that event's name.
  5. Actual: ActivateConfirmDialog always opens, showing "Das Fest [Event B] ist derzeit aktiv" -- which is the current event's own name, not a conflicting event's name. The dialog message is misleading because Event B is not yet active.
- **Root Cause:** `EventActionsPanel` always opens the dialog on click (line 50: `onClick={() => setActivateDialog(true)}`). Unlike `EventsTable`, it does not check if another event is currently active before showing the dialog. The `activeEventName` prop is set to the current event's name, not the name of the currently active event.
- **Priority:** Fix before deployment

#### BUG-30: DeactivateWarningDialog not implemented
- **Severity:** Low
- **Steps to Reproduce:**
  1. The tech design specifies a `DeactivateWarningDialog` for deactivating events with active orders
  2. Expected: A dialog component exists and is shown when deactivating an event that has active orders
  3. Actual: No `DeactivateWarningDialog` component exists. Deactivation happens immediately without warning.
- **Note:** Since the orders feature (PROJ-5) does not exist yet, this is not functionally blocking. The dialog should be added when PROJ-5 is implemented.
- **Priority:** Fix when PROJ-5 is implemented (deferred)

#### BUG-31: INTENTIONAL -- setup_users can read events
- **Note:** Reclassified as NOT A BUG after analysis. Setup users need event read access. No action needed.

#### BUG-32: PATCH endpoint accepts empty update payload
- **Severity:** Low
- **Steps to Reproduce:**
  1. Send `PATCH /api/setup/events/[id]` with body `{}`
  2. Expected: Returns 400 (no fields to update)
  3. Actual: Returns 200 success (Supabase runs a no-op UPDATE)
- **Impact:** No data corruption, but unnecessarily triggers the `updated_at` timestamp update
- **Priority:** Nice to have

#### BUG-33: activate_event RPC uses SECURITY DEFINER without authorization check
- **Severity:** High
- **Steps to Reproduce:**
  1. As any authenticated user, call `supabase.rpc('activate_event', { target_event_id: '<event-id-from-another-org>' })` directly via the Supabase JS client (bypassing the API route)
  2. Expected: RPC rejects the call because the user is not in the same organization
  3. Actual: RPC executes with superuser privileges (SECURITY DEFINER), activating the event regardless of org membership. The function does not check `auth.uid()` or organization ownership internally.
- **Impact:** Any authenticated user on the platform could activate/deactivate events belonging to other organizations by calling the RPC directly with the Supabase anon key.
- **Mitigation:** The API route `/api/setup/events/[id]/activate` does check org membership before calling the RPC, but the RPC is callable directly from the browser via the Supabase client.
- **Priority:** Fix before deployment

#### BUG-34: No rate limiting on PROJ-2 API routes
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Send 100 rapid POST requests to `/api/setup/events` with valid data
  2. Expected: Rate limiter blocks after N requests
  3. Actual: All 100 requests succeed, creating 100 events
- **Impact:** Could be used to flood the events table. Less critical than invite/token spam but still a concern.
- **Priority:** Fix before deployment

#### BUG-35: EventsTable not responsive on mobile (375px)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open /setup/events on a 375px viewport
  2. Expected: Table is readable without horizontal scrolling, or wrapped in a scroll container
  3. Actual: 5-column HTML table overflows horizontally, content is cut off
- **Note:** Same pattern as BUG-23 from PROJ-1 (UserManagementTable).
- **Priority:** Fix in next sprint

#### BUG-36: Status transition allows active-to-draft (spec says no backsteps)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Activate a draft event (status becomes active)
  2. Click "Deaktivieren" on the active event
  3. Expected: Based on the spec "draft -> active -> archived (keine Rueckschritte)", deactivation should not be possible -- only archiving
  4. Actual: The `activate_event` RPC function (line 124) toggles an active event back to draft: `IF v_status = 'active' THEN UPDATE events SET status = 'draft'`. The UI also provides a "Deaktivieren (-> Entwurf)" button for active events.
- **Impact:** This contradicts the spec requirement "Status-Uebergang: draft -> active -> archived (keine Rueckschritte)". However, the UI intentionally supports deactivation, and the User Story says "Fest aktivieren oder deaktivieren". This is a spec inconsistency.
- **Note:** The spec text and user stories are contradictory. The user story says "aktivieren oder deaktivieren" which implies bidirectional transitions, but the technical requirements say "keine Rueckschritte" (no backsteps). The implementation follows the user story interpretation.
- **Priority:** Clarify with product owner. If bidirectional is intended, update the spec. If one-way is intended, remove the deactivation feature.

---

### Regression Testing (PROJ-1)

- [x] **Sidebar navigation:** "Veranstaltungen" link correctly added to admin nav items; setup_user nav unchanged
- [x] **Auth flow:** Login/register/password-reset pages unaffected by PROJ-2 changes
- [x] **Setup layout:** `/setup` layout and auth guards still functional
- [x] **Profile page:** Accessible, no visual regressions from sidebar change
- [x] **Users page:** Accessible, no regressions

---

### Summary

- **Acceptance Criteria:** 7/8 passed (1 partially failed: AC-6 duplication lacks article/station copy, but blocked by dependencies)
- **Edge Cases:** 2/5 passed, 1 deferred, 2 have bugs
- **Bugs Found:** 9 total (excluding BUG-31 which is not a bug)
  - 0 Critical
  - 1 High (BUG-33: SECURITY DEFINER RPC bypasses RLS)
  - 3 Medium (BUG-29: misleading activate dialog, BUG-34: no rate limiting, BUG-36: status transition inconsistency)
  - 5 Low (BUG-27: duplication scope, BUG-28: past date warning, BUG-30: deactivate dialog, BUG-32: empty PATCH, BUG-35: mobile table overflow)
- **Security:** 1 High issue found (SECURITY DEFINER RPC)
- **Production Ready:** NO
- **Recommendation:** Fix BUG-33 (critical security) and BUG-29 (confusing UX) before deployment. Clarify BUG-36 with product owner. Add rate limiting (BUG-34) for defense in depth.

## Deployment
_To be added by /deploy_
