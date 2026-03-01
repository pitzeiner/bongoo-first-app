# PROJ-4: Terminal- & Stationskonfiguration

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-1 (Multi-Tenant Onboarding)
- Requires: PROJ-2 (Event Setup)
- Requires: PROJ-3 (Artikel- & Kategorieverwaltung) — Stationen werden Artikeln zugewiesen

## User Stories
- Als **Vereins-Admin** möchte ich Ausgabestationen anlegen (z.B. "Küche", "Getränke", "Bar"), damit ich steuern kann, wohin Bestellungen gehen.
- Als **Vereins-Admin** möchte ich für jede Station den Typ festlegen: `display` (digitale Anzeige) oder `print-only` (nur Bon-Ausdruck), damit ich die richtige App konfiguriere.
- Als **Vereins-Admin** möchte ich Kassaterminals anlegen und benennen (z.B. "Kassa 1", "Kassa 2"), damit mehrere Kassaterminals gleichzeitig betrieben werden können.
- Als **Vereins-Admin** möchte ich einem Terminal eine Drucker-ID zuweisen, damit die Desktop-App den richtigen Drucker ansteuert.
- Als **Kassier / Küchenmitarbeiter** möchte ich ein Terminal über einen einfachen Code oder Link aktivieren, damit kein Login nötig ist.

## Acceptance Criteria
- [ ] Admin kann Stationen anlegen: Name, Typ (`display` / `print-only`), Farbe (optional zur Identifikation)
- [ ] Admin kann Kassaterminals anlegen: Name, Drucker-ID (freier Text, z.B. "PRINTER_01")
- [ ] Jede Station/Terminal bekommt einen eindeutigen Aktivierungscode (6-stellig) oder Link
- [ ] Kassier öffnet Terminal-URL und gibt Aktivierungscode ein → Terminal ist aktiv
- [ ] Aktive Terminals erscheinen im Admin-Dashboard mit Status (online/offline, zuletzt gesehen)
- [ ] Admin kann Terminal deaktivieren (z.B. bei Ende des Fests)
- [ ] Pro Fest können beliebig viele Stationen und Kassaterminals angelegt werden
- [ ] Station `print-only` hat kein digitales Display, löst nur Druckauftrag aus
- [ ] Station `display` zeigt Ausgabeterminal-App und ermöglicht Markierung als "fertig"

## Edge Cases
- Aktivierungscode falsch eingegeben → klare Fehlermeldung, max. 5 Versuche, dann gesperrt
- Terminal geht offline während Betrieb → Status im Admin sofort als offline markiert, Bestellungen bleiben erhalten
- Zwei Terminals mit gleichem Drucker → erlaubt (beide drucken), Warnung im Admin
- Station ohne verknüpfte Artikel → kann angelegt werden, aber Admin-Warnung beim Aktivieren des Fests
- Admin löscht Station mit aktiven Bestellungen → Bestätigungsdialog, Bestellungen werden auf "unzugeordnet" gesetzt

## Technical Requirements
- Tabellen: `stations` (Name, Typ, Farbe, `event_id`), `terminals` (Name, Typ, `activation_code`, `printer_id`, `event_id`, `last_seen_at`)
- Aktivierungscode: zufällig generiert, in DB gespeichert, einmalig verwendbar bis Aktivierung
- Terminal-Typ: `cashier` | `display` | `waiter`
- Heartbeat: Terminal sendet alle 30 Sekunden Ping → `last_seen_at` wird aktualisiert
- RLS: Terminals können nur ihren eigenen Event-Kontext lesen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
