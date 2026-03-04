# PROJ-1: Multi-Tenant Onboarding (Vereinsregistrierung & Auth)

## Status: In Review
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- None

## Rollen-Übersicht

Das System kennt **zwei grundlegend verschiedene Auth-Mechanismen**:

| Rolle | Auth-Methode | App-Zugriff |
|-------|-------------|-------------|
| `admin` | E-Mail + Passwort | Setup-App (voller Zugriff) |
| `setup_user` | E-Mail + Passwort (vom Admin angelegt) | Setup-App (eingeschränkt, kein Systemzugriff) |
| `cashier` | QR-Code (gedruckt via Bondrucker) | Kassaterminal-App |
| `kitchen` / `bar` | QR-Code (gedruckt via Bondrucker) | Ausgabeterminal-App |
| `waiter` | QR-Code (gedruckt via Bondrucker) | Kellner-App |

### Setup-User — erlaubte Aktionen
- Artikel als ausverkauft markieren / reaktivieren
- Gratis-Bons erstellen (Freibon für bestimmte Artikel)
- Kellner abrechnen (Bestellübersicht pro Kellner einsehen)
- Artikel-Preise einsehen (nicht ändern)
- QR-Codes für Terminals / Kellner generieren und ausdrucken

### Setup-User — verbotene Aktionen
- Feste anlegen, bearbeiten oder löschen
- Artikel, Kategorien, Stationen konfigurieren
- Andere Benutzer anlegen oder verwalten
- Vereinsprofil ändern
- Systemeinstellungen ändern
- Tagesabschluss durchführen

### QR-Code Auth (für operative Rollen)
- Admin **und Setup-User** generieren in der Setup-App einen QR-Code pro Terminal/Kellner
- QR-Code wird via Bondrucker (ESC/POS) ausgedruckt und an Mitarbeiter übergeben
- Mitarbeiter scannt den QR-Code mit einem beliebigen Gerät (Smartphone/Tablet/PC)
- Browser öffnet direkt die richtige App (Kassa / Küche / Kellner), **kein Login-Formular**
- Der QR-Code enthält ein signiertes, kurzlebiges Token (z.B. JWT, 12 Stunden gültig)
- Token kann vom Admin jederzeit widerrufen werden (Terminal deaktivieren)
- **Keine E-Mail-Registrierung für operative Nutzer**

## User Stories

### Admin
- Als **Vereins-Admin** möchte ich mich mit E-Mail und Passwort registrieren, damit ich meinen Verein auf der Plattform anlegen kann.
- Als **Vereins-Admin** möchte ich ein Vereinsprofil anlegen (Name, Logo, Kontaktdaten).
- Als **Vereins-Admin** möchte ich mein Passwort zurücksetzen können.
- Als **Vereins-Admin** möchte ich weitere Setup-User anlegen (Name + E-Mail), damit diese begrenzt auf das Setup zugreifen können.
- Als **Vereins-Admin** möchte ich Setup-User sperren oder löschen können.

### Setup-User
- Als **Setup-User** möchte ich mich mit E-Mail + Passwort einloggen (Zugangsdaten vom Admin erhalten).
- Als **Setup-User** möchte ich Artikel als ausverkauft markieren, damit Kassaterminals sie nicht mehr anzeigen.
- Als **Setup-User** möchte ich Gratis-Bons erstellen (Artikel + Anzahl, ohne Zahlung), damit z.B. Ehrengäste bedient werden können.
- Als **Setup-User** möchte ich die Bestellübersicht pro Kellner einsehen, um Abrechnungen zu machen.
- Als **Setup-User** möchte ich QR-Codes für Terminals / Kellner generieren und ausdrucken, damit ich das auch ohne Admin-Hilfe erledigen kann.

### Operative Nutzer (QR-Code)
- Als **Admin oder Setup-User** möchte ich für jedes Terminal / jeden Kellner einen QR-Code generieren und ausdrucken können.
- Als **Kassier / Küchenmitarbeiter / Kellner** möchte ich durch Scannen eines QR-Codes sofort Zugang zur richtigen App bekommen, ohne mich registrieren oder einloggen zu müssen.
- Als **Admin** möchte ich einen QR-Code (Terminal) deaktivieren können, damit der Zugang sofort entzogen wird.

## Acceptance Criteria

### Admin-Registrierung & Login
- [ ] Registrierung mit E-Mail + Passwort; Bestätigungsmail wird versendet
- [ ] Nach Bestätigung kann Admin einloggen und Vereinsprofil anlegen
- [ ] Vereinsprofil: Name (Pflicht), Beschreibung (optional), Logo-Upload (optional, max. 2 MB)
- [ ] Passwort-Reset per E-Mail funktioniert
- [ ] Nicht eingeloggte Nutzer werden auf Login-Seite weitergeleitet

### Setup-User-Verwaltung
- [ ] Admin kann Setup-User anlegen: Name + E-Mail (kein Self-Sign-up)
- [ ] Neu angelegter Setup-User erhält E-Mail mit temporärem Passwort oder Set-Password-Link
- [ ] Setup-User kann sich einloggen und Passwort ändern
- [ ] Admin kann Setup-User sperren (sofortiger Zugriffsentzug) oder löschen
- [ ] Setup-User sieht in der Setup-App nur die erlaubten Bereiche (eingeschränktes Nav)
- [ ] Setup-User-Aktionen (Ausverkauft, Gratis-Bon) werden mit User-ID protokolliert

### QR-Code Auth (operative Rollen)
- [ ] Admin **und Setup-User** können in der Setup-App pro Terminal/Kellner einen QR-Code generieren
- [ ] QR-Code enthält ein signiertes Token mit: `terminal_id`, `role`, `event_id`, Ablaufzeit (12h)
- [ ] QR-Code wird als Druckauftrag an Bondrucker gesendet (Bon-Format mit QR-Code und Terminal-Name)
- [ ] Scannen des QR-Codes öffnet die richtige App und setzt Session automatisch
- [ ] Nach Ablauf (12h) wird der QR-Code ungültig → Nutzer wird zur "Abgelaufen"-Seite weitergeleitet
- [ ] Admin kann QR-Code-Token jederzeit widerrufen (Terminal deaktivieren in PROJ-4)
- [ ] Setup-User-Aktionen beim QR-Code-Generieren werden mit User-ID protokolliert
- [ ] Kein Login-Formular, keine E-Mail-Adresse für Kassiere / Küche / Kellner

### Sicherheit & Isolation
- [ ] Jeder Nutzer (Admin, Setup-User) ist genau einem Verein zugeordnet
- [ ] RLS: Nutzer verschiedener Vereine haben keinen Zugriff auf gegenseitige Daten
- [ ] QR-Token kann serverseitig validiert und widerrufen werden (Blacklist in DB)

## Edge Cases
- E-Mail-Adresse bereits registriert → klare Fehlermeldung
- Admin versucht sich selbst zu löschen → Warnung: Verein braucht mindestens einen Admin
- QR-Code-Token abgelaufen → Nutzer sieht Hinweis, Admin kann neuen QR-Code drucken
- QR-Code gescannt auf falschem Gerät (z.B. Privathandy) → funktioniert trotzdem, Session läuft nach 12h ab
- Setup-User versucht Admin-Bereich aufzurufen → 403-Seite mit Erklärung
- Brute-Force auf Login → Rate-Limiting durch Supabase Auth
- E-Mail-Einladung für Setup-User abgelaufen (> 48h) → Admin kann neu einladen

## Technical Requirements
- **Admin/Setup-User:** Supabase Auth (E-Mail + Passwort)
- **Operative Nutzer:** Signed JWT in QR-Code URL, z.B. `/terminal/activate?token=<jwt>`
- **Rollen:** `admin`, `setup_user`, `cashier`, `kitchen`, `waiter` — gespeichert in `profiles`-Tabelle
- **Token-Blacklist:** Tabelle `revoked_tokens` mit `jti` (JWT ID) für Widerruf
- **RLS:** Alle Tabellen filtern nach `organization_id`
- **Logo-Upload:** Supabase Storage, max. 2 MB, JPG/PNG
- **QR-Code-Generierung:** serverseitig (Next.js API Route), z.B. mit `qrcode`-Library
- **QR-Code-Druck:** als Druckauftrag an Desktop-App (wie normale Bons)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

_Added by /architecture on 2026-03-01_

### Routen-Struktur

```
/auth/register              Admin-Registrierung (E-Mail + Passwort)
/auth/login                 Login-Seite (Admin + Setup-User)
/auth/reset-password        Passwort-zurücksetzen
/auth/callback              Supabase-Weiterleitungsziel

/setup/profile              Vereinsprofil anlegen / bearbeiten (Admin only)
/setup/users                Setup-User-Verwaltung (Admin only)
/setup/users/invite         Neuen Setup-User einladen (Admin only)

/terminal/activate          QR-Code-Einstiegspunkt (?token=<jwt>)
/terminal/expired           Seite bei abgelaufenem / ungültigem Token
```

### UI-Komponentenstruktur

```
Auth-Bereich
+-- LoginPage (E-Mail, Passwort, "Passwort vergessen"-Link)
+-- RegisterPage (E-Mail, Passwort, Bestätigung, Hinweis-Banner)
+-- ResetPasswordPage (E-Mail-Feld)

Setup-App (nach Login)
+-- Sidebar Navigation (rollenabhängig gerendert)
+-- OrganizationProfileForm (Name, Beschreibung, Logo-Upload)
+-- UserManagementTable (Liste, Sperren/Löschen-Aktionen)
+-- InviteUserDialog (Name, E-Mail, Absenden)

QR-Code-Aktivierung
+-- TerminalActivatePage (Token validieren → Weiterleitung)
+-- TokenExpiredPage (Fehlermeldung + Hinweis für Admin)
```

### Datenmodell

**`organizations`** — Der Verein
- id, name (Pflicht), description, logo_url, created_at

**`profiles`** — Benutzerprofil + Rolle
- id (= Supabase Auth User ID), organization_id, role (admin | setup_user), display_name, status (active | suspended)

**`terminal_tokens`** — QR-Code-Zugänge
- id, organization_id, event_id, role (cashier | kitchen | bar | waiter), terminal_name, expires_at, is_revoked

**`revoked_tokens`** — Token-Blacklist
- jti (JWT ID), revoked_at

**Supabase Storage Bucket `logos`** — Vereins-Logos (max. 2 MB, JPG/PNG)

### Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Supabase Auth für Admin/Setup-User | E-Mail-Bestätigung + Passwort-Reset out-of-the-box |
| Eigene JWTs für QR-Codes | Operative Nutzer brauchen kein Supabase-Konto; Token trägt Rolle + Terminal-Info |
| RLS auf allen Tabellen | Datentrennung zwischen Vereinen auf DB-Ebene erzwungen |
| Token-Blacklist-Tabelle | Admin kann Terminal sofort sperren, ohne Ablaufzeit abwarten |
| Next.js Middleware | Routenschutz vor jedem Seitenaufruf, Weiterleitung zu /auth/login |
| Rollenbasierte Sidebar | Setup-User sieht nur erlaubte Bereiche, keine 403-Seiten im Normalbetrieb |

### Neue Pakete

| Paket | Zweck |
|---|---|
| `@supabase/ssr` | Supabase Auth mit Next.js App Router (Cookie-basierte Sessions) |
| `jose` | JWT signieren + validieren (QR-Code-Tokens) |
| `qrcode` | QR-Code als PNG generieren (serverseitig) |

## QA Test Results

**Tested:** 2026-03-04
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (Next.js 16.1.1, Turbopack, compiles cleanly)
**Lint Status:** FAIL (next lint misconfigured -- see BUG-20)

---

### Acceptance Criteria Status

#### AC-1: Admin-Registrierung & Login

- [x] **Registrierung mit E-Mail + Passwort; Bestaetigungsmail wird versendet**
  - RegisterPage uses `supabase.auth.signUp()` with `emailRedirectTo` set to `/auth/callback`
  - Zod validation enforces min 8 chars password, email format, and password confirmation match
  - On success, shows confirmation banner with "E-Mail bestaetigen" message

- [x] **Nach Bestaetigung kann Admin einloggen und Vereinsprofil anlegen**
  - `/auth/callback` route exchanges code for session and redirects to `/setup/profile`
  - LoginPage calls `signInWithPassword()` and redirects to `/setup/profile` on success
  - OrganizationProfileForm supports create mode (no initial data) and edit mode

- [x] **Vereinsprofil: Name (Pflicht), Beschreibung (optional), Logo-Upload (optional, max. 2 MB)**
  - Zod schema enforces `name.min(1).max(100)`, `description.max(500).optional()`
  - Logo validation: file.size > 2MB blocked, only image/jpeg and image/png accepted
  - Drag-and-drop and click-to-upload both implemented
  - Logo uploaded to Supabase Storage bucket `logos` with upsert

- [x] **Passwort-Reset per E-Mail funktioniert**
  - ResetPasswordPage sends reset via `supabase.auth.resetPasswordForEmail()`
  - Redirect URL set to `/auth/callback?next=/auth/update-password`
  - UpdatePasswordPage uses `supabase.auth.updateUser()` with new password
  - After success, auto-redirects to `/setup/profile` after 2 seconds

- [x] **Nicht eingeloggte Nutzer werden auf Login-Seite weitergeleitet**
  - Middleware (proxy.ts) checks `!user && pathname.startsWith('/setup')` and redirects
  - SetupLayout also checks `!user` server-side and calls `redirect('/auth/login')`
  - Double protection (middleware + server component)

#### AC-2: Setup-User-Verwaltung

- [x] **Admin kann Setup-User anlegen: Name + E-Mail (kein Self-Sign-up)**
  - InviteUserDialog sends POST to `/api/setup/users/invite`
  - API validates admin role, active status, and organization_id
  - Uses `adminSupabase.auth.admin.inviteUserByEmail()` (service role)
  - Creates profile with `role: 'setup_user'`

- [x] **Neu angelegter Setup-User erhaelt E-Mail mit Set-Password-Link**
  - Invite uses Supabase invite mechanism which sends email with magic link
  - Redirect URL points to `/auth/callback?next=/auth/update-password`
  - Re-invite for already-registered org users sends password reset link

- [x] **Setup-User kann sich einloggen und Passwort aendern**
  - Login page works for both admin and setup_user
  - "Passwort aendern" link visible in sidebar for all roles
  - UpdatePasswordPage accessible at `/auth/update-password`

- [x] **Admin kann Setup-User sperren (sofortiger Zugriffsentzug) oder loeschen**
  - PATCH `/api/setup/users/[id]` toggles status between active/suspended
  - DELETE `/api/setup/users/[id]` removes auth user (profile via CASCADE)
  - Both endpoints verify admin role, active status, same organization
  - Self-suspend/delete prevented
  - Middleware checks suspended status on each /setup request and signs out

- [x] **Setup-User sieht in der Setup-App nur die erlaubten Bereiche (eingeschraenktes Nav)**
  - SetupSidebar renders `setupUserNavItems` (only "QR-Codes") for non-admin roles
  - Admin sees "Vereinsprofil" + "Benutzer"
  - ProfilePage has server-side role check returning "Keine Berechtigung" alert for non-admins

- [ ] **BUG: Setup-User-Aktionen (Ausverkauft, Gratis-Bon) werden mit User-ID protokolliert**
  - NOT IMPLEMENTED: QR token creation records `created_by` in terminal_tokens table, but there is no audit log table or general action-logging mechanism for setup_user actions. This acceptance criterion requires a broader audit trail that does not exist yet.

#### AC-3: QR-Code Auth (operative Rollen)

- [x] **Admin und Setup-User koennen in der Setup-App pro Terminal/Kellner einen QR-Code generieren**
  - POST `/api/terminal/tokens` allows any active org member (admin or setup_user) to generate tokens
  - Token roles: kassa, ausgabe, kellner

- [x] **QR-Code enthaelt ein signiertes Token mit terminal_id, role, event_id, Ablaufzeit (12h)**
  - JWT signed with HS256 using QR_TOKEN_SECRET
  - Payload includes: organizationId, terminalRole, terminalName, tokenId, eventId (optional)
  - Default expiry: 12 hours (configurable 1-72h)
  - JTI stored in terminal_tokens table

- [ ] **BUG: QR-Code wird als Druckauftrag an Bondrucker gesendet (Bon-Format mit QR-Code und Terminal-Name)**
  - NOT IMPLEMENTED: The API returns a `token` and `activationUrl` as JSON, but there is no QR-code image generation (no usage of the `qrcode` package) and no print job submission to the desktop app. The `qrcode` package is listed as a dependency in the architecture but there is no import anywhere in the codebase.

- [x] **Scannen des QR-Codes oeffnet die richtige App und setzt Session automatisch**
  - `/terminal/activate?token=<jwt>` sends POST to `/api/terminal/activate`
  - API verifies JWT signature, expiry, revocation status via DB lookup
  - Returns redirect URL based on terminal_role (kassa/ausgabe/kellner)
  - ActivateClient redirects browser to the correct app URL

- [x] **Nach Ablauf (12h) wird der QR-Code ungueltig, Nutzer wird zur Abgelaufen-Seite weitergeleitet**
  - JWT `exp` claim checked by `jwtVerify()`
  - DB-level `expires_at` check as secondary validation
  - On failure, ActivateClient redirects to `/terminal/expired`
  - ExpiredPage shows clear message and link to Setup-App

- [x] **Admin kann QR-Code-Token jederzeit widerrufen (Terminal deaktivieren in PROJ-4)**
  - `terminal_tokens.is_revoked` field exists and is checked during activation
  - Note: No UI for revocation exists yet (deferred to PROJ-4 as stated)

- [x] **Setup-User-Aktionen beim QR-Code-Generieren werden mit User-ID protokolliert**
  - `terminal_tokens.created_by` stores the user ID of whoever generated the token

- [x] **Kein Login-Formular, keine E-Mail-Adresse fuer Kassiere / Kueche / Kellner**
  - Terminal activation flow uses JWT-in-URL, no login form
  - No email registration for operative roles

#### AC-4: Sicherheit & Isolation

- [x] **Jeder Nutzer (Admin, Setup-User) ist genau einem Verein zugeordnet**
  - `profiles.organization_id` links each user to exactly one organization
  - Invite route sets `organization_id` to the inviting admin's org

- [x] **RLS: Nutzer verschiedener Vereine haben keinen Zugriff auf gegenseitige Daten**
  - Code uses user-scoped Supabase client for data queries (RLS enforced)
  - Admin client (service role) only used for bootstrapping operations where RLS cannot apply
  - Cross-org profile query in invite route uses RLS-scoped client to verify membership

- [x] **QR-Token kann serverseitig validiert und widerrufen werden (Blacklist in DB)**
  - `terminal_tokens.is_revoked` checked during activation
  - Note: `revoked_tokens` table mentioned in spec but implementation uses `is_revoked` flag on `terminal_tokens` instead. Functionally equivalent.

---

### Edge Cases Status

#### EC-1: E-Mail-Adresse bereits registriert
- [x] **RegisterPage:** Supabase returns "User already registered" which is translated to "Diese E-Mail-Adresse ist bereits registriert"
- [x] **InviteRoute:** Handles "already been registered" error -- checks if user belongs to same org (re-invite with reset link) or different org (clear error message)

#### EC-2: Admin versucht sich selbst zu loeschen
- [x] Self-delete prevented in DELETE API route (returns 400)
- [ ] **BUG:** The error message says "Sie koennen sich nicht selbst loeschen" but the spec requires a **warning** that the org needs at least one admin. The current UI also hides the action menu for the current user, so the user never sees this message. However, the API does not check if the org has at least one admin remaining -- it only prevents self-deletion. An admin COULD delete another admin (though the UI prevents this by checking `user.role !== 'admin'` in UserManagementTable line 135).

#### EC-3: QR-Code-Token abgelaufen
- [x] Expired tokens correctly redirect to `/terminal/expired`
- [x] ExpiredPage shows clear message and suggests contacting admin

#### EC-4: QR-Code gescannt auf falschem Geraet
- [x] Works on any device -- token-in-URL approach is device-agnostic
- [x] Session expires based on JWT expiry, not device

#### EC-5: Setup-User versucht Admin-Bereich aufzurufen
- [x] ProfilePage shows "Keine Berechtigung" alert with explanation for non-admins
- [x] Sidebar does not show admin-only links to setup_users

#### EC-6: Brute-Force auf Login
- [x] Delegated to Supabase Auth built-in rate limiting

#### EC-7: E-Mail-Einladung fuer Setup-User abgelaufen (> 48h)
- [x] Re-invite mechanism implemented -- sends password reset link for already-registered org users

---

### Security Audit Results (Red Team)

#### Authentication

- [x] **Route protection:** Middleware (proxy.ts) guards all `/setup/*` routes, redirecting unauthenticated users to `/auth/login`
- [x] **Server-side auth verification:** All API routes call `supabase.auth.getUser()` and return 401 if not authenticated
- [x] **Session management:** Uses `@supabase/ssr` cookie-based sessions, no JWT in localStorage
- [x] **Suspended user enforcement:** Middleware checks profile status and signs out suspended users
- [ ] **BUG-16:** Login page does not display error messages from query params (`?error=account_suspended` and `?error=auth_callback_error`). Suspended users are signed out and redirected to login but see no explanation of why.

#### Authorization

- [x] **Admin-only routes protected:** Profile API checks `role === 'admin'`, invite API checks `role === 'admin'`, user management APIs check `role === 'admin'`
- [x] **Cross-org isolation:** RLS enforced via user-scoped Supabase client; admin client scoped to specific operations
- [x] **Self-modification prevented:** Cannot suspend or delete own account
- [x] **Cannot modify other admins:** API checks `targetProfile.role !== 'admin'` (PATCH) and `targetProfile.role !== 'setup_user'` (DELETE)
- [ ] **BUG-17:** The invite route (line 69) calls `adminSupabase.auth.admin.listUsers({ perPage: 1000 })` which fetches ALL users from the entire Supabase project (not just the current org) to find one by email. While the actual data exposure is limited (server-side only, not returned to client), this is a performance concern and loads sensitive user data unnecessarily. If the platform grows beyond 1000 users, the lookup will silently fail to find existing users.

#### Input Validation

- [x] **Zod schemas on all API routes:** Profile, invite, user management, terminal token creation, terminal activation
- [x] **Client-side validation:** All forms use `react-hook-form` with `zodResolver`
- [x] **File upload validation:** Logo size (2MB) and type (JPG/PNG) checked client-side
- [ ] **BUG-18:** Logo file upload validation is CLIENT-SIDE ONLY. The file is uploaded directly to Supabase Storage from the browser (`supabase.storage.from('logos').upload()`), bypassing the API route entirely. A malicious user could use the Supabase client to upload arbitrary files (e.g., .exe, .html with XSS) to the logos bucket if Supabase Storage policies are not properly configured. The server never validates the file type or size.

#### Open Redirect

- [ ] **BUG-19:** The `/auth/callback` route accepts a `next` query parameter and redirects to `${origin}${next}`. While the redirect is relative to the origin (safe against external redirects), an attacker could craft `?next=/terminal/expired` or any internal path. This is low risk since it stays on the same origin, but there is no validation that `next` is an allowed path. More critically, the `next` parameter could contain encoded characters that may lead to unexpected behavior.

#### Security Headers

- [x] **X-Frame-Options: DENY** -- configured in next.config.ts
- [x] **X-Content-Type-Options: nosniff** -- configured
- [x] **Referrer-Policy: origin-when-cross-origin** -- configured
- [x] **Strict-Transport-Security** with includeSubDomains and preload -- configured
- [ ] **Missing:** Content-Security-Policy header is not configured (Low priority for MVP)

#### Secrets Management

- [x] `.env.local` in `.gitignore`
- [x] `.env.local.example` with dummy values documented
- [x] `SUPABASE_SERVICE_ROLE_KEY` and `QR_TOKEN_SECRET` are server-only (no NEXT_PUBLIC_ prefix)
- [ ] **BUG-21 (CRITICAL):** Real secrets were committed to git history and are still recoverable. The `.env.local` file containing the Supabase URL and anon key, and the `.mcp.json` file containing a Supabase Management API bearer token (`sbp_04642146d680b2936edaadac9248d4550a7d3b6c`), were committed in early history and only removed in commit `c5c0646`. These are still accessible via `git show`. The anon key is public by design, but the MCP bearer token grants management API access and MUST be rotated immediately.

#### Rate Limiting

- [x] Authentication rate limiting delegated to Supabase Auth
- [ ] **BUG-22:** No application-level rate limiting on API routes (`/api/setup/profile`, `/api/setup/users/invite`, `/api/terminal/tokens`, `/api/terminal/activate`). An authenticated user could send rapid requests to create unlimited terminal tokens or spam invite emails.

---

### Cross-Browser Testing (Code Review)

All pages use standard React, shadcn/ui components, and Tailwind CSS. No browser-specific APIs detected.

- [x] **Chrome:** Standard compatibility expected (shadcn/ui targets modern browsers)
- [x] **Firefox:** No Firefox-incompatible APIs or CSS used
- [x] **Safari:** `crypto.randomUUID()` used server-side only (Node.js); no client-side Web Crypto usage. `URL.createObjectURL()` used for logo preview -- supported in all modern browsers.

### Responsive Testing (Code Review)

- [x] **Mobile (375px):** Auth layout uses `max-w-md px-4` -- responsive. Setup sidebar uses Sheet (slide-out) on mobile with `md:hidden` breakpoint. Main content uses `pt-14 md:pt-0` to account for mobile header.
- [x] **Tablet (768px):** `md:` breakpoint switches from mobile sheet to fixed sidebar.
- [x] **Desktop (1440px):** Sidebar fixed at `w-64`, main content `max-w-4xl` centered.
- [ ] **BUG-23:** On mobile, the UserManagementTable renders a full-width HTML table that will overflow horizontally on 375px screens. No horizontal scroll wrapper or responsive table layout.

---

### Bugs Found

#### BUG-16: Login page ignores error query parameters
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Be a suspended user and try to access /setup/profile
  2. Middleware signs you out and redirects to /auth/login?error=account_suspended
  3. Expected: Login page shows a message explaining the account is suspended
  4. Actual: Login page renders normally with no error indication
- **Priority:** Fix before deployment

#### BUG-17: Invite route fetches all platform users via listUsers
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Admin invites a user whose email is already registered
  2. `adminSupabase.auth.admin.listUsers({ perPage: 1000 })` is called
  3. Expected: Efficient lookup of the specific user
  4. Actual: All users across all organizations are loaded into memory
- **Impact:** Performance degradation at scale; will silently break for platforms with >1000 users
- **Priority:** Fix before deployment

#### BUG-18: Logo upload has no server-side file validation
- **Severity:** High
- **Steps to Reproduce:**
  1. Intercept the Supabase Storage upload request from OrganizationProfileForm
  2. Modify the file to be an .html file with embedded JavaScript, or a file >2MB
  3. Expected: Server rejects invalid files
  4. Actual: File is uploaded directly to Supabase Storage with only client-side checks. If Supabase Storage bucket policies do not enforce type/size restrictions, any file can be uploaded.
- **Note:** The actual risk depends on Supabase Storage bucket configuration (RLS policies on the `logos` bucket). If properly configured server-side, this is mitigated. However, the application code does not enforce it.
- **Priority:** Fix before deployment (verify Supabase Storage policies OR add server-side validation)

#### BUG-19: Auth callback next parameter not validated
- **Severity:** Low
- **Steps to Reproduce:**
  1. Navigate to `/auth/callback?code=VALID_CODE&next=/some/unexpected/path`
  2. Expected: Redirect only to allowed paths
  3. Actual: Redirects to any same-origin path
- **Note:** Since redirect is same-origin only, risk is minimal. No external redirect possible.
- **Priority:** Nice to have

#### BUG-20: npm run lint is broken
- **Severity:** Low
- **Steps to Reproduce:**
  1. Run `npm run lint`
  2. Expected: ESLint runs successfully
  3. Actual: "Invalid project directory provided, no such directory: F:\Repos\bongoo-first-app\lint"
- **Priority:** Fix in next sprint

#### BUG-21: Secrets exposed in git history (CRITICAL)
- **Severity:** Critical
- **Steps to Reproduce:**
  1. Run `git show c5c0646^:.mcp.json`
  2. MCP bearer token `sbp_04642146d680b2936edaadac9248d4550a7d3b6c` is visible
  3. This token grants Supabase Management API access
- **Required Actions:**
  1. IMMEDIATELY rotate the Supabase Management API token in the Supabase dashboard
  2. Consider using `git filter-branch` or BFG Repo Cleaner to purge the history
  3. If the repo is public or has been pushed to a shared remote, assume the token is compromised
- **Priority:** Fix IMMEDIATELY (rotate token now, clean history before deployment)

#### BUG-22: No application-level rate limiting on API routes
- **Severity:** Medium
- **Steps to Reproduce:**
  1. As an authenticated admin, send 100 POST requests to `/api/terminal/tokens` in rapid succession
  2. Expected: Rate limiting kicks in after N requests
  3. Actual: All 100 requests succeed, creating 100 terminal tokens
- **Impact:** Could be abused to spam invite emails or create excessive tokens
- **Priority:** Fix before deployment

#### BUG-23: UserManagementTable not responsive on mobile
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open /setup/users on a 375px-wide viewport
  2. Expected: Table is readable without horizontal scrolling
  3. Actual: HTML table overflows, content cut off or requires scroll
- **Priority:** Fix in next sprint

#### BUG-24: Setup-User action audit logging not implemented
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Acceptance criterion states "Setup-User-Aktionen (Ausverkauft, Gratis-Bon) werden mit User-ID protokolliert"
  2. Expected: An audit log table or mechanism tracking setup_user actions
  3. Actual: Only `terminal_tokens.created_by` exists for QR token generation. No general audit trail for other setup_user actions.
- **Note:** The Ausverkauft and Gratis-Bon features are not yet implemented (future PROJ features), so the logging for those specific actions is not yet relevant. However, the audit infrastructure is missing.
- **Priority:** Fix in next sprint (when the relevant features are built)

#### BUG-25: QR-Code image generation not implemented
- **Severity:** High
- **Steps to Reproduce:**
  1. The spec requires "QR-Code wird als Druckauftrag an Bondrucker gesendet (Bon-Format mit QR-Code und Terminal-Name)"
  2. Expected: An API endpoint generates a QR code image and formats it for printing
  3. Actual: POST `/api/terminal/tokens` returns only a JSON response with `token` and `activationUrl`. No QR code image is generated. The `qrcode` package (listed in architecture) is not used anywhere in the codebase.
- **Note:** The Desktop Print Bridge (PROJ-6) is a separate feature, but the QR code image generation itself is part of PROJ-1's scope.
- **Priority:** Fix before deployment

#### BUG-26: NEXT_PUBLIC_APP_URL in .env.local.example is unused
- **Severity:** Low
- **Steps to Reproduce:**
  1. `.env.local.example` documents `NEXT_PUBLIC_APP_URL=http://localhost:3000`
  2. Grep for `NEXT_PUBLIC_APP_URL` in codebase returns no results
  3. The code derives URLs from `request.url` and `window.location.origin` instead
- **Note:** This is actually the correct approach (commit 4a90330 fixed this), but the .env.local.example should be updated to remove the misleading variable.
- **Priority:** Nice to have

---

### Summary

- **Acceptance Criteria:** 16/19 passed (3 failed: QR code image generation, QR print job, audit logging)
- **Edge Cases:** 6/7 passed (admin self-delete warning wording is incomplete but functionally safe)
- **Bugs Found:** 11 total
  - 1 Critical (BUG-21: secrets in git history)
  - 2 High (BUG-18: logo upload validation, BUG-25: QR code generation missing)
  - 4 Medium (BUG-16: login error display, BUG-17: listUsers, BUG-22: rate limiting, BUG-24: audit logging)
  - 4 Low (BUG-19: callback redirect, BUG-20: lint broken, BUG-23: mobile table, BUG-26: unused env var)
- **Security:** Issues found (1 Critical, 1 High, 2 Medium)
- **Production Ready:** NO
- **Recommendation:** Fix critical and high bugs first. Rotate the exposed MCP token immediately.

## Deployment
_To be added by /deploy_
