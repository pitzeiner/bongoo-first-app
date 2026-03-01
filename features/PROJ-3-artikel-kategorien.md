# PROJ-3: Artikel- & Kategorieverwaltung

## Status: Planned
**Created:** 2026-03-01
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-1 (Multi-Tenant Onboarding)
- Requires: PROJ-2 (Event Setup) — Artikel werden pro Fest konfiguriert

## User Stories
- Als **Vereins-Admin** möchte ich Artikelvorlagen auf Vereinsebene anlegen (z.B. "Bier 0,5l"), damit ich diese bei jedem Fest wiederverwenden kann.
- Als **Vereins-Admin** möchte ich Kategorien definieren (z.B. "Speisen", "Getränke", "Desserts"), damit Artikel übersichtlich gruppiert sind.
- Als **Vereins-Admin** möchte ich die Artikelvorlagen für ein konkretes Fest übernehmen und dort Preise und Verfügbarkeit anpassen.
- Als **Vereins-Admin** möchte ich einem Artikel eine Ausgabestation zuweisen (z.B. Bier → Getränkestation), damit der Bon an die richtige Stelle weitergeleitet wird.
- Als **Vereins-Admin** möchte ich Artikel deaktivieren (z.B. ausverkauft), ohne sie zu löschen.
- Als **Kassier** möchte ich Artikel am Terminal schnell finden — nach Kategorie gefiltert und nach Häufigkeit sortiert.

## Acceptance Criteria
- [ ] Admin kann Kategorien anlegen: Name, Farbe (optional), Reihenfolge (Drag & Drop oder Nummerfeld)
- [ ] Admin kann Artikelvorlagen anlegen: Name, Kategorie, Einheit (Stk./l/kg), Bild (optional)
- [ ] Beim Erstellen eines Fests werden Vereinsvorlagen automatisch übernommen (kopiert, nicht verknüpft)
- [ ] Pro Fest kann jeder Artikel einen eigenen Preis haben (Pflicht)
- [ ] Jeder Artikel wird einer Station zugewiesen (aus konfigurierten Stationen, PROJ-4)
- [ ] Artikel können aktiviert/deaktiviert werden (pro Fest)
- [ ] Artikel-Reihenfolge am Terminal entspricht der konfigurierten Reihenfolge
- [ ] Maximale Länge Artikelname: 40 Zeichen (Bon-Druck-Limit)
- [ ] Admin kann Artikel direkt im Fest hinzufügen, auch ohne Vorlage

## Edge Cases
- Artikel ohne zugewiesene Station → Fehler beim Speichern, Station ist Pflichtfeld
- Preis = 0 → erlaubt (kostenlose Artikel, z.B. Brot zum Essen)
- Kategorie mit keinen Artikeln → bleibt bestehen, erscheint aber nicht am Terminal
- Artikel-Vorlage gelöscht → Fest-Artikel bleiben unverändert (Kopie, keine Verknüpfung)
- Sehr viele Artikel (> 50) → Terminal-Ansicht paginiert oder scrollbar
- Artikelname länger als 40 Zeichen → Validierungsfehler mit Hinweis auf Bon-Limit

## Technical Requirements
- Tabellen: `product_templates` (Vereinsebene), `products` (pro Fest, Kopie der Vorlage)
- Tabelle: `categories` mit `organization_id` + `display_order`
- Bild-Upload: Supabase Storage, max. 1 MB, wird am Terminal angezeigt (optional)
- Preis: Integer in Cent (kein Float-Problem)
- RLS: Vereinsisolierung auf allen Tabellen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
