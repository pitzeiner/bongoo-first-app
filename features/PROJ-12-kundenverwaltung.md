# PROJ-12: Kundenverwaltung / Stammgäste

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-1 (Multi-Tenant Onboarding)
- Requires: PROJ-5 (Kassaterminal-App)

## User Stories
- Als **Kassier** möchte ich einen Stammgast per Name oder Nummer suchen und einer Bestellung zuweisen.
- Als **Vereins-Admin** möchte ich Stammgästen ein Guthaben aufladen, das bei Bestellungen automatisch verrechnet wird.
- Als **Vereins-Admin** möchte ich die Guthaben-Guthaben der Gäste nach dem Fest einsehen und auszahlen.
- Als **Stammgast** möchte ich keinen physischen Bon brauchen, sondern mit meiner Kundennummer bestellen.

## Acceptance Criteria
- [ ] Admin kann Kundenstamm anlegen: Name, optionale Kundennummer, Guthaben
- [ ] Kassier kann Gast per Name oder Nummer suchen (Autovervollständigung)
- [ ] Bestellung kann einem Gast zugewiesen werden → Betrag wird vom Guthaben abgezogen
- [ ] Unzureichendes Guthaben → Warnung, Differenz wird bar bezahlt
- [ ] Guthaben-Aufladung durch Admin (Betrag + Grund)
- [ ] Guthaben-Übersicht pro Gast (Verlauf der Transaktionen)
- [ ] Export der Restguthaben nach Fest-Ende

## Edge Cases
- Gast mit 0 Guthaben → Zahlung muss komplett bar erfolgen
- Gast-Name nicht eindeutig → Liste mehrerer Treffer, manuelle Auswahl
- Guthaben wird negativ → nicht erlaubt, System verhindert Transaktion

## Technical Requirements
- Tabellen: `customers` (pro Verein), `customer_transactions` (Guthaben-Verlauf)
- Guthaben: Integer in Cent
- Kein Gast-Login nötig (Verwaltung durch Admin und Kassier)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
