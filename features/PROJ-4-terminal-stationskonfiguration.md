# PROJ-4: Terminal- & Stationskonfiguration

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

> **Update 2026-03-01:** Terminal-Aktivierung erfolgt ausschließlich via QR-Code (gedruckt vom Bondrucker). Kein manueller Aktivierungscode-Eingabe-Flow mehr. Siehe PROJ-1 für Auth-Details.

## Dependencies
- Requires: PROJ-1 (Multi-Tenant Onboarding)
- Requires: PROJ-2 (Event Setup)
- Requires: PROJ-3 (Artikel- & Kategorieverwaltung) — Stationen werden Artikeln zugewiesen

## User Stories
- Als **Vereins-Admin** möchte ich Ausgabestationen anlegen (z.B. "Küche", "Getränke", "Bar"), damit ich steuern kann, wohin Bestellungen gehen.
- Als **Vereins-Admin** möchte ich für jede Station den Typ festlegen: `display` (digitale Anzeige) oder `print-only` (nur Bon-Ausdruck), damit ich die richtige App konfiguriere.
- Als **Vereins-Admin** möchte ich Kassaterminals anlegen und benennen (z.B. "Kassa 1", "Kassa 2"), damit mehrere Kassaterminals gleichzeitig betrieben werden können.
- Als **Vereins-Admin** möchte ich einem Terminal eine Drucker-ID zuweisen, damit die Desktop-App den richtigen Drucker ansteuert.
- Als **Admin** möchte ich für jedes Terminal / jeden Kellner einen QR-Code generieren und direkt via Bondrucker ausdrucken können.
- Als **Kassier / Küchenmitarbeiter / Kellner** möchte ich durch Scannen des QR-Codes sofort zur richtigen App weitergeleitet werden, ohne Registrierung oder Login-Formular.

## Acceptance Criteria
- [ ] Admin kann Stationen anlegen: Name, Typ (`display` / `print-only`), Farbe (optional zur Identifikation)
- [ ] Admin kann Kassaterminals anlegen: Name, Drucker-ID (freier Text, z.B. "PRINTER_01")
- [ ] Jede Station/jedes Terminal bekommt einen generierbaren QR-Code (via PROJ-1 Auth-Mechanismus)
- [ ] Admin kann QR-Code für jedes Terminal in der Setup-App generieren und als Druckauftrag an Bondrucker senden
- [ ] Gedruckter QR-Code-Bon enthält: Terminal-Name, Station, QR-Code, Gültigkeitsdauer
- [ ] Scannen des QR-Codes öffnet direkt die richtige App (Kassa / Ausgabe / Kellner), keine weiteren Schritte nötig
- [ ] Aktive Terminals erscheinen im Admin-Dashboard mit Status (online/offline, zuletzt gesehen)
- [ ] Admin kann Terminal deaktivieren (z.B. bei Ende des Fests)
- [ ] Pro Fest können beliebig viele Stationen und Kassaterminals angelegt werden
- [ ] Station `print-only` hat kein digitales Display, löst nur Druckauftrag aus
- [ ] Station `display` zeigt Ausgabeterminal-App und ermöglicht Markierung als "fertig"

## Edge Cases
- QR-Code-Token abgelaufen (> 12h) → Nutzer sieht Hinweis "QR-Code abgelaufen", Admin kann neuen drucken
- Terminal geht offline während Betrieb → Status im Admin sofort als offline markiert, Bestellungen bleiben erhalten
- Zwei Terminals mit gleichem Drucker → erlaubt (beide drucken), Warnung im Admin
- Station ohne verknüpfte Artikel → kann angelegt werden, aber Admin-Warnung beim Aktivieren des Fests
- Admin löscht Station mit aktiven Bestellungen → Bestätigungsdialog, Bestellungen werden auf "unzugeordnet" gesetzt

## Technical Requirements
- Tabellen: `stations` (Name, Typ, Farbe, `event_id`), `terminals` (Name, Typ, `printer_id`, `event_id`, `last_seen_at`)
- QR-Code-Token: signiertes JWT (siehe PROJ-1), enthält `terminal_id`, `role`, `event_id`, 12h Gültigkeit
- QR-Code-Druck: Druckauftrag mit eingebettetem QR-Code-Bild (Base64 via ESC/POS GS v 0)
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
