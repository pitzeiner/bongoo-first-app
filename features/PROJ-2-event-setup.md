# PROJ-2: Event Setup (Fest anlegen & konfigurieren)

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

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
- Status-Übergang: draft → active → archived (keine Rückschritte)
- Duplikation per Server Action (kopiert Artikel + Stationen, nicht Bestellungen)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
