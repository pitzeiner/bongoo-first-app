# PROJ-10: Tagesabschluss & Umsatzauswertung

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-1 (Multi-Tenant Onboarding)
- Requires: PROJ-2 (Event Setup)
- Requires: PROJ-5 (Kassaterminal-App) — Bestelldaten vorhanden

## User Stories
- Als **Vereins-Admin** möchte ich nach dem Fest eine Übersicht sehen, wie viel Umsatz pro Station und insgesamt gemacht wurde.
- Als **Vereins-Admin** möchte ich sehen, welche Artikel am meisten verkauft wurden, damit ich für das nächste Fest besser planen kann.
- Als **Vereins-Admin** möchte ich die Auswertung als CSV exportieren, damit ich sie in Excel weiterverarbeiten kann.
- Als **Kassier** möchte ich am Ende des Diensts die Anzahl der abgewickelten Bestellungen sehen.
- Als **Vereins-Admin** möchte ich den Tagesabschluss manuell auslösen, um die laufenden Zahlen einzufrieren.

## Acceptance Criteria
- [ ] Dashboard zeigt Echtzeit-Umsatz während des Fests (Gesamtumsatz, Anzahl Bestellungen)
- [ ] Auswertung nach Fest-Ende: Umsatz pro Kategorie, pro Artikel (Menge + Umsatz), pro Kassa
- [ ] Zeitlicher Verlauf: Bestellungen pro Stunde (als einfaches Balkendiagramm)
- [ ] Top 5 meistverkaufte Artikel
- [ ] Export als CSV: Alle Bestellungen mit Zeitstempel, Artikel, Menge, Preis
- [ ] Tagesabschluss-Funktion: friert Bestellstatus ein, verhindert weitere Eingaben
- [ ] Auswertung auch für archivierte Feste einsehbar
- [ ] Zugriff nur für Admin-Rolle

## Edge Cases
- Fest mit 0 Bestellungen → leere Auswertung mit Hinweis
- CSV-Export mit Sonderzeichen in Artikelnamen → korrekte UTF-8-Kodierung
- Tagesabschluss bei noch offenen Bestellungen → Warnung, offene Bestellungen werden als "offen" markiert

## Technical Requirements
- Aggregation via Supabase SQL-Views oder Serverless Functions
- CSV-Export: clientseitig generiert (keine serverseitige Datei)
- Diagramm: einfache Bibliothek (z.B. Recharts)
- Kein separates Reporting-Tool — alles in der Setup-WebApp

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
