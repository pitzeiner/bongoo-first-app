# PROJ-9: Kellner/Waiter Bestellaufnahme-App

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-1 (Multi-Tenant Onboarding)
- Requires: PROJ-3 (Artikel- & Kategorieverwaltung)
- Requires: PROJ-4 (Terminal- & Stationskonfiguration) — Waiter-Terminal aktivieren
- Requires: PROJ-7 (Ausgabeterminal-App) — Bestellungen landen dort
- Requires: PROJ-8 (Echtzeit-Synchronisierung)

## User Stories
- Als **Kellner** möchte ich auf meinem Smartphone oder Tablet Bestellungen aufnehmen, damit ich nicht zur Kassa laufen muss.
- Als **Kellner** möchte ich eine Tischnummer eingeben, damit die Küche weiß, wohin das Essen gebracht werden soll.
- Als **Kellner** möchte ich Artikel aus dem gleichen Menü wie die Kassa auswählen.
- Als **Kellner** möchte ich eine Bestellung absenden, ohne Zahlung zu verarbeiten — die Zahlung erfolgt später an der Kassa.
- Als **Küchenmitarbeiter** möchte ich Kellner-Bestellungen genauso wie Kassa-Bestellungen sehen, damit ich keine spezielle Unterscheidung machen muss.

## Acceptance Criteria
- [ ] Waiter-Terminal aktivierbar via Terminal-Code (wie Kassa und Ausgabeterminal)
- [ ] Artikel-Menü identisch wie Kassaterminal (Kategorien, Kacheln, Bilder)
- [ ] Tischnummer oder Tischname eingeben (Freitextfeld oder vordefinierte Liste)
- [ ] Bestellung absenden ohne Zahlungsschritt → Status: `open` (nicht `paid`)
- [ ] Bestellung erscheint sofort am Ausgabeterminal der jeweiligen Station
- [ ] Kellner erhält Bestätigung nach erfolgreichem Absenden
- [ ] Mehrere Kellner können gleichzeitig Bestellungen aufnehmen (concurrent users)
- [ ] Bestellhistorie des letzten Diensts sichtbar (letzten 2 Stunden)
- [ ] Mobiloptimiertes UI (Smartphone 375px+)

## Edge Cases
- Netzwerkausfall beim Absenden → Fehlermeldung, Bestellung bleibt lokal, Retry-Button
- Kellner sendet Bestellung ohne Tischnummer → Warnung, aber Absenden erlaubt
- Artikel wird während Bestellung deaktiviert → Warnung beim Absenden, Artikel wird trotzdem übergeben
- Zwei Kellner bestellen für denselben Tisch gleichzeitig → beide Bestellungen separat, keine Zusammenführung

## Technical Requirements
- Responsive UI (Mobile-first, min. 375px)
- Gleicher Artikel-Endpunkt wie Kassaterminal
- Druckauftrag: optionales Drucken eines Kellner-Bons (mit Tischnummer) über Desktop-App
- Terminal-Typ: `waiter`

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
