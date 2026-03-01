# PROJ-5: Kassaterminal-App (Bestellaufnahme & Zahlung)

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-1 (Multi-Tenant Onboarding)
- Requires: PROJ-2 (Event Setup) — aktives Fest nötig
- Requires: PROJ-3 (Artikel- & Kategorieverwaltung) — Artikel müssen konfiguriert sein
- Requires: PROJ-4 (Terminal- & Stationskonfiguration) — Terminal muss aktiviert sein
- Requires: PROJ-8 (Echtzeit-Synchronisierung) — Bestellung muss in Echtzeit an Ausgabeterminals übermittelt werden

## User Stories
- Als **Kassier** möchte ich Artikel per Tap/Klick auswählen, damit ich schnell eine Bestellung zusammenstellen kann.
- Als **Kassier** möchte ich die aktuelle Bestellung als Liste sehen (Artikel, Menge, Preis), damit ich und der Gast den Überblick haben.
- Als **Kassier** möchte ich einzelne Artikel aus der Bestellung entfernen oder die Menge ändern.
- Als **Kassier** möchte ich den Gesamtbetrag sehen und die Zahlung mit einem Klick bestätigen (Bargeld, Betrag eingegeben oder "Passend").
- Als **Kassier** möchte ich das Wechselgeld automatisch berechnet sehen, wenn ich den erhaltenen Betrag eingebe.
- Als **Kassier** möchte ich nach Bestätigung der Zahlung automatisch einen Druckauftrag auslösen, der physische Bons produziert.
- Als **Kassier** möchte ich nach dem Druck sofort eine neue leere Bestellung beginnen können.

## Acceptance Criteria
- [ ] Terminal lädt nach Aktivierung das Artikel-Menü des aktiven Fests
- [ ] Artikel sind nach Kategorien gefiltert, Kategorie-Tabs oben
- [ ] Artikel als Kacheln mit Name, Preis (und optionalem Bild)
- [ ] Tap auf Artikel fügt ihn zur aktuellen Bestellung hinzu
- [ ] Bestellübersicht zeigt: Artikel, Menge (+/- Buttons), Einzelpreis, Gesamtpreis
- [ ] "Zahlung" Button öffnet Zahlungsdialog: Gesamtbetrag, Eingabefeld für erhaltenen Betrag, Wechselgeld-Anzeige, "Passend"-Button
- [ ] Nach Bestätigung: Bestellung wird in DB gespeichert (Status: `paid`), Druckauftrag wird an Desktop-App gesendet
- [ ] Druckauftrag enthält: Fest-Name, Bestellnummer, alle Artikel mit Menge, Gesamtbetrag, Zeitstempel, Station pro Artikel
- [ ] Nach Druck: Bestellung wird zurückgesetzt, neue Bestellung kann beginnen
- [ ] Falls Druckverbindung nicht verfügbar: Warnung, Bestellung trotzdem gespeichert
- [ ] Kassaterminal funktioniert im Vollbild-Modus (kein Browser-UI sichtbar)

## Edge Cases
- Artikel während aktiver Bestellung vom Admin deaktiviert → Artikel bleibt in laufender Bestellung, wird aber nicht mehr im Menü angezeigt
- Kein Drucker verbunden → Warnung nach Zahlungsbestätigung, Möglichkeit erneut zu senden
- Netzwerkausfall zwischen Zahlung und Druckauftrag → Bestellung ist gespeichert, Druckauftrag kann wiederholt werden
- Versehentlich falscher Artikel hinzugefügt → einfaches Entfernen aus der Bestellung vor Zahlung
- Sehr große Bestellung (> 20 Artikel) → Bestellliste scrollbar
- Fest wird während Betrieb deaktiviert → Terminal zeigt Hinweis, neue Bestellungen nicht mehr möglich

## Technical Requirements
- Touch-optimiertes UI (Mindest-Tap-Ziel 48x48px)
- Offline-Erkennung: Browser online/offline Event → UI-Indikator
- Druckauftrag: HTTP POST an lokale Desktop-App (via `localhost` oder konfigurierbarer IP)
- Bestellnummer: fortlaufend pro Fest (nicht global)
- Performance: Artikel-Laden < 1 Sekunde, Zahlungsbestätigung < 500ms

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
