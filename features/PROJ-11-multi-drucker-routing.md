# PROJ-11: Multi-Drucker-Routing (Bon direkt an Zielstation)

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-6 (Desktop Print-Brücke)
- Requires: PROJ-4 (Terminal- & Stationskonfiguration) — Drucker-IDs pro Station

## User Stories
- Als **Vereins-Admin** möchte ich jeder Station einen eigenen Drucker zuweisen, damit Bons automatisch am richtigen Drucker ausgedruckt werden.
- Als **Kassier** möchte ich nach der Zahlung keine manuelle Entscheidung treffen müssen — das System schickt jeden Teil-Bon an den richtigen Drucker.
- Als **Küchenmitarbeiter** möchte ich nur den Bon für meine Station bekommen, nicht alle Bestellungen des gesamten Fests.

## Acceptance Criteria
- [ ] Admin kann pro Station eine Drucker-ID hinterlegen (in der Stationskonfiguration)
- [ ] Nach Zahlungsbestätigung: System splittet Bestellung nach Stationen auf
- [ ] Pro Station wird ein eigener Teil-Bon an den zugehörigen Drucker geschickt
- [ ] Jeder Teil-Bon enthält: Station-Name, Bestellnummer, nur die Artikel für diese Station
- [ ] Desktop-App leitet Druckauftrag anhand der Drucker-ID an den richtigen Drucker weiter
- [ ] Fallback: Kein stations-spezifischer Drucker → Bon geht an Standard-Drucker (wie MVP)

## Edge Cases
- Station hat keinen eigenen Drucker → Bon geht an Kassa-Drucker (Fallback)
- Drucker einer Station offline → Warnung, Bon wird nicht verloren, Retry möglich
- Artikel ohne Stationszuordnung → geht an Kassa-Drucker

## Technical Requirements
- Druckauftrag enthält `station_id` und `printer_id`
- Desktop-App verwaltet Drucker-Registry (Mapping `printer_id → Windows-Drucker`)
- Mehrere Desktop-Apps möglich (eine pro Drucker oder eine für alle)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
