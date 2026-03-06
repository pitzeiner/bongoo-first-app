# PROJ-3: Artikel- & Kategorieverwaltung

## Status: In Review
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
- [ ] Beim Erstellen eines Fests werden Artikel automatisch kopiert (nicht verknüpft): vorrangig aus dem letzten Fest inkl. Preis + Station; Fallback auf Vereinsvorlagen ohne Preis/Station
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
_Hinzugefügt am 2026-03-05_

### Überblick

Das Feature arbeitet auf **zwei Ebenen**:
1. **Vereinsebene** — Vorlagen für Kategorien und Artikel (wiederverwendbar für alle Feste)
2. **Festebene** — Artikel werden beim Fest-Erstellen kopiert, dort erhält jeder Artikel Preis + Station

Kopie, keine Verknüpfung: Änderungen an Vorlagen beeinflussen laufende Feste nicht.

---

### Seitenstruktur

```
/setup/articles                    ← NEU: Vereinsvorlagen-Verwaltung
  +-- Kategorie-Panel (links)
  |     +-- Kategorienliste (sortierbar per Reihenfolge-Feld)
  |     +-- "Kategorie hinzufügen"-Button
  |     +-- KategorieFormular (Dialog)
  +-- Artikel-Panel (rechts)
        +-- Filter: Kategorie-Tabs
        +-- Artikelliste
        +-- "Artikel hinzufügen"-Button
        +-- ArtikelVorlagenFormular (Dialog)

/setup/events/[id]/articles        ← NEU: Festspezifische Artikelverwaltung
  +-- Artikel-Tab (erweitert bestehende Event-Detailseite)
  +-- Kategorie-Tabs (Filter)
  +-- Artikelliste
  |     +-- ArtikelKarte
  |           +-- Name, Einheit
  |           +-- Preisfeld (editierbar)
  |           |     +-- Label "Letztes Fest: €X,XX" (wenn last_price_cents != null)
  |           +-- Station-Zuweisung (Dropdown)
  |           +-- Aktiv/Inaktiv-Schalter
  +-- "Artikel hinzufügen"-Button (ohne Vorlage möglich)
  +-- FestArtikelFormular (Dialog)
```

---

### Datenmodell

#### `categories` (Vereinsebene)
- `id`, `organization_id`, `name`, `color` (optional, Hex), `display_order`

#### `product_templates` (Vereinsebene — Vorlagen)
- `id`, `organization_id`, `category_id`, `name` (max. 40 Zeichen), `unit` (Stk./l/kg), `image_url` (optional), `display_order`

#### `products` (Festebene — Kopien)
- `id`, `event_id`, `template_id` (nullable, nur Info), `category_id`, `name`, `unit`
- `price_cents` (Integer, kein Float!), `last_price_cents` (nullable Integer — Preis vom letzten Fest, nur zur Anzeige)
- `station_id` (Pflicht), `is_active`, `display_order`, `image_url`

`last_price_cents` wird beim Kopieren aus dem letzten Fest befüllt und danach nie mehr verändert. Er dient ausschließlich als Referenz für den Admin.

---

### Kopier-Mechanismus beim Fest erstellen

Beim Anlegen eines neuen Fests (PROJ-2) wird die bestehende Event-API erweitert:

**Priorität 1 — letztes Fest vorhanden:**
→ Alle `products` des zeitlich letzten Fests werden ins neue Fest kopiert
→ `price_cents` des letzten Fests → wird als `price_cents` UND als `last_price_cents` übernommen
→ Station wird übernommen
→ Admin sieht beim Bearbeiten: aktueller Preis vorausgefüllt + "Letztes Fest: €X,XX" als Hinweis

**Priorität 2 — kein vorheriges Fest:**
→ Fallback auf `product_templates` des Vereins
→ Preis und Station müssen manuell gesetzt werden

**Ziel:** Minimaler Aufwand bei wiederkehrenden Festen — der Admin sieht immer, was zuletzt verrechnet wurde.

---

### Neue API-Routen

| Route | Funktion |
|-------|---------|
| `GET/POST /api/setup/categories` | Kategorien auflisten / anlegen |
| `PUT/DELETE /api/setup/categories/[id]` | Kategorie bearbeiten / löschen |
| `GET/POST /api/setup/product-templates` | Vorlagen auflisten / anlegen |
| `PUT/DELETE /api/setup/product-templates/[id]` | Vorlage bearbeiten / löschen |
| `GET/POST /api/setup/events/[id]/products` | Fest-Artikel auflisten / anlegen |
| `PUT/DELETE /api/setup/events/[id]/products/[pid]` | Fest-Artikel bearbeiten / löschen |

---

### Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Preis in Cent (Integer) | Verhindert Rundungsfehler bei Dezimalzahlen |
| Kopie statt Verknüpfung | Fest-Artikel bleiben stabil, auch wenn Vorlagen geändert werden |
| Reihenfolge per Zahlenfeld (kein Drag & Drop) | Einfach und ausreichend; Drag & Drop nur wenn Bedarf besteht |
| Supabase Storage für Bilder | Bereits integriert; max. 1 MB, öffentliche URLs für Terminal |
| Station als Pflichtfeld | Fehler früh abfangen, verhindert Bons ohne Ziel-Station |

---

### Navigation

`SetupSidebar.tsx` bekommt neuen Menüpunkt: **"Artikel"** → `/setup/articles`

---

### Verwendete shadcn/ui-Komponenten (bereits installiert)

`Dialog`, `Table`, `Tabs`, `Switch`, `Select`, `Input`, `Badge`, `Card`, `Button`

Keine neuen Pakete erforderlich.

---

### Sicherheit (RLS)

- Alle 3 Tabellen mit Row Level Security
- Admin sieht nur eigene Vereinsdaten (`organization_id`-Filter)
- Kassierer: nur Lesezugriff auf `products`

## QA Test Results
_Hinzugefügt am 2026-03-06_

### Gesamtergebnis: ✅ Bestanden (nach Bugfixes)

### Acceptance Criteria
| Kriterium | Status |
|-----------|--------|
| Kategorien anlegen (Name, Farbe, Reihenfolge) | ✅ |
| Artikelvorlagen anlegen (Name, Kategorie, Einheit, Bild optional) | ✅ (nach BUG-2-Fix) |
| Artikel beim Fest-Erstellen automatisch kopieren | ✅ |
| Preis pro Fest (Pflicht) | ✅ |
| Station zuweisen | ✅ (blockiert bis PROJ-4) |
| Artikel aktivieren/deaktivieren | ✅ |
| Reihenfolge konfigurierbar | ✅ |
| Artikelname max. 40 Zeichen | ✅ |
| Artikel direkt im Fest hinzufügen | ✅ |

### Behobene Bugs
- **BUG-1 (Kritisch):** `station_id: nullable()` in PUT-Route entfernt — Station kann nicht mehr per API auf null gesetzt werden
- **BUG-2 (Mittel):** `image_url` zum `createSchema` der product-templates-Route hinzugefügt
- **BUG-3 (Mittel):** `category_id: string | null` in `Product`-Interface — Typ entspricht jetzt dem DB-Schema (ON DELETE SET NULL)

### Offene Punkte (nicht blockierend)
- **BUG-4:** Kategorie-Löschen ohne Warnung über betroffene Artikel → Fix in späterem Sprint
- **BUG-5:** Kopier-Mechanismus ignoriert Draft-Feste → vermutlich beabsichtigt, Dokumentation fehlt

## Deployment
_To be added by /deploy_
