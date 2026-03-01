# PROJ-7: Ausgabeterminal-App (Küche/Bar-Display)

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-4 (Terminal- & Stationskonfiguration) — Station muss als `display` konfiguriert sein
- Requires: PROJ-5 (Kassaterminal-App) — Bestellungen werden hier empfangen
- Requires: PROJ-8 (Echtzeit-Synchronisierung) — Echtzeit-Updates erforderlich

## User Stories
- Als **Küchen-/Barmitarbeiter** möchte ich alle offenen Bestellungen für meine Station in Echtzeit sehen, damit ich weiß, was zubereitet werden muss.
- Als **Küchen-/Barmitarbeiter** möchte ich eine Bestellung als "fertig" markieren, damit sie aus der Warteschlange verschwindet.
- Als **Küchen-/Barmitarbeiter** möchte ich Bestellungen nach Eingangszeit sortiert sehen (älteste zuerst), damit ich in der richtigen Reihenfolge arbeite.
- Als **Küchen-/Barmitarbeiter** möchte ich sofort einen akustischen/visuellen Hinweis erhalten, wenn eine neue Bestellung eingeht.
- Als **Ausgabe-Mitarbeiter** möchte ich eine bereits als "fertig" markierte Bestellung wieder öffnen können (Rückgängig), falls ich versehentlich geklickt habe.

## Acceptance Criteria
- [ ] Ausgabeterminal lädt nach Aktivierung nur Bestellungen der eigenen Station
- [ ] Bestellungen erscheinen als Karten: Bestellnummer, Artikel (mit Menge), Uhrzeit des Eingangs
- [ ] Karten sind nach Eingangszeit sortiert (älteste zuerst = oben links)
- [ ] Neue Bestellung erscheint in Echtzeit (< 2 Sekunden nach Kassa-Bestätigung)
- [ ] Neue Bestellung löst visuellen Hinweis aus (z.B. kurzes Aufblinken / farbliche Hervorhebung)
- [ ] Akustischer Hinweis (Browser-Beep) bei neuer Bestellung (optional, konfigurierbar)
- [ ] "Fertig"-Button auf jeder Bestellkarte → Bestellung wird aus der Liste entfernt, Status in DB = `completed`
- [ ] "Rückgängig" möglich innerhalb von 30 Sekunden nach "Fertig"-Markierung
- [ ] Bereits fertige Bestellungen sind in einer separaten "Verlauf"-Ansicht sehbar (letzten 2 Stunden)
- [ ] Terminal funktioniert im Vollbild-Modus auf einem handelsüblichen Tablet oder Monitor
- [ ] Verbindungsstatus sichtbar (z.B. grüner Punkt oben rechts)

## Edge Cases
- Netzwerkunterbrechung → UI zeigt "Offline"-Banner, puffert und lädt Bestellungen nach Reconnect
- Viele gleichzeitige Bestellungen (Rush) → Grid-Layout scrollt, kein Datenverlust
- Terminal neu gestartet → Alle offenen Bestellungen werden nachgeladen
- Bestellung an zwei Stationen (z.B. Schnitzel → Küche UND Getränk → Bar) → Jede Station sieht nur ihre eigenen Artikel
- Zwei Mitarbeiter markieren dieselbe Bestellung gleichzeitig als fertig → idempotent, kein Fehler

## Technical Requirements
- Supabase Realtime Subscription auf `orders` gefiltert nach `station_id`
- Touch-optimiertes UI (große Buttons, Mindest-Tap-Ziel 64x64px)
- Grid-Layout: responsive, 2-4 Spalten je nach Bildschirmbreite
- Farbkodierung nach Wartezeit: grün < 5 Min, gelb 5-10 Min, rot > 10 Min
- Kein Login erforderlich — Aktivierung via Terminal-Code (wie Kassaterminal)
- Browser: Chrome/Edge empfohlen (kioskartig betreibbar mit F11)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
