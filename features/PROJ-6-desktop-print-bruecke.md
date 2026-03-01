# PROJ-6: Desktop Print-Brücke (Windows, ESC/POS)

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-4 (Terminal- & Stationskonfiguration) — Drucker-ID muss konfiguriert sein
- Requires: PROJ-5 (Kassaterminal-App) — sendet Druckaufträge

## User Stories
- Als **Kassier / IT-Verantwortlicher** möchte ich eine kleine Desktop-App installieren, die automatisch im Hintergrund läuft und Druckaufträge entgegennimmt.
- Als **Kassier** möchte ich nach der Zahlung automatisch einen physischen Bon am ESC/POS-Drucker ausgedruckt bekommen, ohne etwas manuell zu tun.
- Als **Admin** möchte ich in der Desktop-App den Drucker auswählen und die Terminal-ID eingeben, damit die App weiß, welche Aufträge ihr gehören.
- Als **IT-Verantwortlicher** möchte ich sehen, ob die Desktop-App verbunden ist, und Druckfehler in einem einfachen Log sehen.

## Acceptance Criteria
- [ ] Installer für Windows (`.exe` oder `.msi`) ist verfügbar zum Download aus der Setup-App
- [ ] Nach Installation startet die App automatisch beim Windows-Start (optional konfigurierbar)
- [ ] App läuft als System-Tray-Icon (kein Hauptfenster im Vordergrund)
- [ ] Beim ersten Start: Konfigurationsmasken für Terminal-ID und Drucker-Auswahl (aus installierten Windows-Druckern)
- [ ] App verbindet sich via WebSocket mit Supabase Realtime und hört auf Druckaufträge für die eigene Terminal-ID
- [ ] Eingehender Druckauftrag wird in ESC/POS-Befehle übersetzt und an den ausgewählten Drucker gesendet
- [ ] Bon-Layout: Fest-Name (zentriert, groß), Bestellnummer, Trennlinie, Artikel-Liste (Name linksbündig, Menge + Preis rechtsbündig), Trennlinie, Gesamtbetrag, Zeitstempel, "Danke!" Zeile
- [ ] Verbindungsstatus sichtbar im Tray-Icon (grün = verbunden, rot = getrennt)
- [ ] Fehlerhafte Druckaufträge werden im Log mit Zeitstempel gespeichert
- [ ] Wiederholung: fehlgeschlagene Druckaufträge können manuell wiederholt werden

## Edge Cases
- Drucker ausgeschaltet oder offline → Fehlermeldung im Tray, Log-Eintrag, Bon kann wiederholt werden
- Druckauftrag kommt an, aber App ist offline → Auftrag wird in Supabase zwischengespeichert, App verarbeitet ihn bei Reconnect (max. 10 Minuten)
- Mehrere Bons gleichzeitig (Rush-Situation) → Druckqueue, FIFO-Reihenfolge
- Drucker läuft aus Papier → System-Druckerfehler wird abgefangen und im Log angezeigt
- Windows-Neustart während Betrieb → App startet automatisch neu und reconnectet
- Falsche Terminal-ID konfiguriert → App empfängt keine Aufträge, Log-Hinweis

## Technical Requirements
- **Framework:** Electron (Windows-only, aber Electron unterstützt auch andere Plattformen)
- **Druck-Library:** `node-escpos` oder `escpos-buffer` für ESC/POS-Befehle
- **Verbindung:** Supabase Realtime WebSocket (Channel: `print-jobs:{terminal_id}`)
- **Drucker-Zugriff:** Windows Raw Printer API via Node.js `win32-api` oder direkter LPT/USB-Port
- **Update:** Auto-Update via Electron-Updater (lädt neue Version von Supabase Storage oder GitHub Releases)
- **Logging:** Lokale Log-Datei (`%APPDATA%\BonGoo\logs\`)
- **Installer:** NSIS oder Electron-Builder

## Bon-Format (Referenz)

```
================================
         MAIFEST 2026
         Turnverein Muster
================================
Bestellung #0042    15:32 Uhr
--------------------------------
Bier 0,5l      x2       7,00 €
Schnitzel            12,50 €
Cola 0,33l     x1       2,00 €
--------------------------------
GESAMT               21,50 €
================================
         Danke schön!
================================
```

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
