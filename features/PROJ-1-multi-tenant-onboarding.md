# PROJ-1: Multi-Tenant Onboarding (Vereinsregistrierung & Auth)

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- None

## User Stories
- Als **Vereins-Admin** möchte ich mich mit E-Mail und Passwort registrieren, damit ich meinen Verein auf der Plattform anlegen kann.
- Als **Vereins-Admin** möchte ich ein Vereinsprofil anlegen (Name, Logo, Kontaktdaten), damit Kassiere und Mitarbeiter den Verein erkennen.
- Als **Vereins-Admin** möchte ich mich sicher einloggen und ausloggen können.
- Als **Vereins-Admin** möchte ich mein Passwort zurücksetzen können, falls ich es vergessen habe.
- Als **Vereins-Admin** möchte ich weitere Benutzer (Kassiere, Küche, etc.) zu meinem Verein einladen können, damit diese Zugriff auf die richtigen Apps haben.
- Als **eingeladener Mitarbeiter** möchte ich die Einladung per E-Mail annehmen und ein Passwort setzen können.

## Acceptance Criteria
- [ ] Registrierung mit E-Mail + Passwort funktioniert, Bestätigungsmail wird versendet
- [ ] Nach Bestätigung kann sich der Admin einloggen
- [ ] Admin kann Vereinsprofil anlegen: Name (Pflicht), Beschreibung (optional), Logo-Upload (optional)
- [ ] Admin kann weitere Nutzer per E-Mail einladen
- [ ] Eingeladene Nutzer können Einladung annehmen und Passwort setzen
- [ ] Jeder Nutzer ist genau einem Verein zugeordnet (Multi-Tenant-Isolation)
- [ ] Passwort-Reset per E-Mail funktioniert
- [ ] Nicht eingeloggte Nutzer werden auf Login-Seite weitergeleitet
- [ ] Nutzer verschiedener Vereine haben keinen Zugriff auf gegenseitige Daten (RLS)

## Edge Cases
- E-Mail-Adresse bereits registriert → klare Fehlermeldung, kein doppeltes Konto
- Einladungslink abgelaufen (> 7 Tage) → Nutzer sieht Hinweis, Admin kann neu einladen
- Admin löscht eigenen Account → Warnung, Verein kann nicht ohne Admin existieren
- Brute-Force Login → Rate-Limiting durch Supabase Auth
- Nutzer versucht auf anderen Verein zuzugreifen → 403 Forbidden

## Technical Requirements
- Supabase Auth (E-Mail + Passwort)
- Row Level Security: Alle Tabellen filtern nach `organization_id`
- Rollen: `admin`, `cashier`, `kitchen`, `waiter` (gespeichert in `profiles`-Tabelle)
- Logo-Upload: Supabase Storage, max. 2 MB, JPG/PNG
- Session-Management: Supabase Session via Cookie (SSR-kompatibel)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
