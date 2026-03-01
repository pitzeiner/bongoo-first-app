# PROJ-1: Multi-Tenant Onboarding (Vereinsregistrierung & Auth)

## Status: Planned
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

### Setup-User — verbotene Aktionen
- Feste anlegen, bearbeiten oder löschen
- Artikel, Kategorien, Stationen konfigurieren
- Andere Benutzer anlegen oder verwalten
- Vereinsprofil ändern
- Systemeinstellungen ändern
- Tagesabschluss durchführen

### QR-Code Auth (für operative Rollen)
- Admin generiert in der Setup-App einen QR-Code pro Terminal/Kellner
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

### Operative Nutzer (QR-Code)
- Als **Admin** möchte ich für jedes Terminal / jeden Kellner einen QR-Code generieren und ausdrucken können.
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
- [ ] Admin kann in der Setup-App pro Terminal/Kellner einen QR-Code generieren
- [ ] QR-Code enthält ein signiertes Token mit: `terminal_id`, `role`, `event_id`, Ablaufzeit (12h)
- [ ] QR-Code wird als Druckauftrag an Bondrucker gesendet (Bon-Format mit QR-Code und Terminal-Name)
- [ ] Scannen des QR-Codes öffnet die richtige App und setzt Session automatisch
- [ ] Nach Ablauf (12h) wird der QR-Code ungültig → Nutzer wird zur "Abgelaufen"-Seite weitergeleitet
- [ ] Admin kann QR-Code-Token jederzeit widerrufen (Terminal deaktivieren in PROJ-4)
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
_To be added by /qa_

## Deployment
_To be added by /deploy_
