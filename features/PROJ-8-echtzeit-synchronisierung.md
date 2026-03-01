# PROJ-8: Echtzeit-Synchronisierung zwischen Terminals

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-1 (Multi-Tenant Onboarding) — Vereins-Kontext für Datenisolierung
- Requires: PROJ-4 (Terminal- & Stationskonfiguration) — Terminal-IDs bekannt

## User Stories
- Als **Kassier** möchte ich, dass meine Bestellung sofort nach Zahlungsbestätigung an alle relevanten Stationen übermittelt wird, ohne dass ich etwas manuell tun muss.
- Als **Küchenmitarbeiter** möchte ich neue Bestellungen in Echtzeit sehen, ohne die Seite neu laden zu müssen.
- Als **Admin** möchte ich im Dashboard sehen, welche Terminals gerade online sind.
- Als **Kassier** möchte ich wissen, ob das System verbunden ist, damit ich bei einem Problem reagieren kann.

## Acceptance Criteria
- [ ] Neue Bestellung erscheint auf allen relevanten Ausgabeterminals innerhalb von 2 Sekunden
- [ ] Statusänderungen (z.B. "fertig") erscheinen auf allen verbundenen Clients innerhalb von 2 Sekunden
- [ ] Druckaufträge werden via Supabase Realtime an die Desktop-App übermittelt
- [ ] Verbindungsstatus wird in allen WebApps angezeigt (verbunden / getrennt)
- [ ] Bei Verbindungsunterbrechung: automatischer Reconnect innerhalb von 10 Sekunden
- [ ] Nach Reconnect: Zustand wird aus DB neu geladen (kein Datenverlust)
- [ ] Admin-Dashboard zeigt Terminal-Online-Status basierend auf Heartbeat (`last_seen_at`)

## Edge Cases
- Supabase Realtime temporär nicht verfügbar → Apps fallen auf Polling (alle 5 Sekunden) zurück
- Client verliert Verbindung, Bestellungen kommen in der Zwischenzeit rein → beim Reconnect werden alle verpassten Bestellungen nachgeladen
- Mehrere gleichzeitige Updates auf dasselbe `order` → optimistic concurrency, letzter Schreiber gewinnt (akzeptiert für MVP)
- Großes Event mit > 100 gleichzeitigen Terminals → Supabase Realtime Channels sind pro Event aufgeteilt

## Technical Requirements
- **Technologie:** Supabase Realtime (PostgreSQL Logical Replication + WebSocket)
- **Channels:**
  - `orders:{event_id}` — neue Bestellungen und Statusänderungen
  - `print-jobs:{terminal_id}` — Druckaufträge für spezifische Desktop-App
  - `terminals:{event_id}` — Online-Status der Terminals
- **Heartbeat:** Terminals senden alle 30 Sekunden ein Update auf `terminals.last_seen_at`
- **Fallback:** SWR oder React Query mit 5-Sekunden-Polling als Fallback
- **Filtration:** Ausgabeterminals abonnieren nur ihre `station_id`-relevanten Orders

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
