# Product Requirements Document

## Vision
BonGoo ist eine vollständig cloudbasierte, mandantenfähige Bonierungslösung für Vereinsfeste. Vereine können Feste digital abwickeln — von der Artikelkonfiguration bis zum physischen Kassabon — ohne eigene Server oder IT-Infrastruktur betreiben zu müssen. Lediglich eine kleine Windows-Desktop-App muss installiert werden, um ESC/POS-Drucker anzubinden.

## Target Users

| Rolle | Beschreibung | Pain Points |
|-------|-------------|-------------|
| **Vereins-Admin** | Richtet das Fest ein, verwaltet Artikel, Preise und Terminals | Komplizierte Kassensoftware, hohe Lizenzkosten, fehlende Flexibilität |
| **Kassier** | Nimmt Zahlungen entgegen, kassiert Bons | Langsame Bedienung, Fehler bei Wechselgeld, unklare Bonzuordnung |
| **Kellner/Besteller** | Nimmt Bestellungen am Tisch auf | Zettelwirtschaft, Übertragungsfehler zur Küche |
| **Küche / Ausgabestation** | Bereitet Bestellungen vor, gibt sie aus | Unleserliche Zettel, unklare Reihenfolge, fehlende Übersicht |
| **Getränkestation** | Gibt Getränke gegen Bon aus | Einfacher Druck ohne digitale Verwaltung gewünscht |

## Core Features (Roadmap)

| Priority | Feature | ID | Status |
|----------|---------|----|--------|
| P0 (MVP) | Multi-Tenant Onboarding (Vereinsregistrierung + Auth) | PROJ-1 | Planned |
| P0 (MVP) | Event Setup (Fest anlegen & konfigurieren) | PROJ-2 | Planned |
| P0 (MVP) | Artikel- & Kategorieverwaltung | PROJ-3 | Planned |
| P0 (MVP) | Terminal- & Stationskonfiguration | PROJ-4 | Planned |
| P0 (MVP) | Kassaterminal-App (Bestellaufnahme & Zahlung) | PROJ-5 | Planned |
| P0 (MVP) | Desktop Print-Brücke (Windows, ESC/POS) | PROJ-6 | Planned |
| P0 (MVP) | Ausgabeterminal-App (Küche/Bar-Display) | PROJ-7 | Planned |
| P0 (MVP) | Echtzeit-Synchronisierung zwischen Terminals | PROJ-8 | Planned |
| P1 | Kellner/Waiter Bestellaufnahme-App | PROJ-9 | Planned |
| P1 | Tagesabschluss & Umsatzauswertung | PROJ-10 | Planned |
| P2 | Multi-Drucker-Routing (Bon direkt an Zielstation) | PROJ-11 | Planned |
| P2 | Kundenverwaltung / Stammgäste | PROJ-12 | Planned |

## System-Übersicht

Das System besteht aus **5 Apps**, die alle miteinander kommunizieren:

```
┌─────────────────────────────────────────────┐
│             Supabase (Cloud)                │
│   PostgreSQL + Auth + Realtime WebSockets   │
└───────────────────┬─────────────────────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
┌────▼────┐  ┌─────▼─────┐  ┌────▼────────┐
│ Setup   │  │ Kassa-    │  │ Ausgabe-    │
│ WebApp  │  │ terminal  │  │ terminal    │
│ (Admin) │  │ WebApp    │  │ WebApp      │
└─────────┘  └─────┬─────┘  └─────────────┘
                   │
             ┌─────▼──────┐     ┌──────────────┐
             │ Desktop-   │────►│ ESC/POS      │
             │ App (Win)  │     │ Drucker      │
             └────────────┘     └──────────────┘
                   │
             ┌─────▼──────┐
             │ Kellner-   │
             │ App WebApp │
             └────────────┘
```

### Bon-Flow (Kernprozess)

1. **Kassier** wählt Artikel an der Kassaterminal-App aus
2. **System** berechnet Preis, Kassier kassiert Bargeld
3. **Desktop-App** empfängt Druckauftrag und sendet ESC/POS-Befehle an Drucker
4. **Physischer Bon** wird gedruckt und dem Gast ausgehändigt
5. **Gast** geht zu jeweiliger Station (Küche, Getränke, etc.) und gibt Bon ab
6. **Ausgabeterminal** (Küche) zeigt Bestellung, Mitarbeiter markiert als fertig
7. **Einfache Stationen** (Getränke) erhalten nur einen Bon-Ausdruck, kein Display

## Success Metrics

- Zeit pro Kassiervorgang < 30 Sekunden
- Fehlerrate bei Bestellungen < 1%
- Systemverfügbarkeit während des Festes > 99,5%
- Vereins-Setup-Zeit für ein neues Fest < 30 Minuten
- Anzahl aktiver Vereine auf der Plattform (SaaS-Wachstum)

## Constraints

- **Team:** 1-2 Entwickler
- **Budget:** Minimal — Open-Source und günstige SaaS-Dienste (Supabase Free/Pro Tier)
- **Internet:** Stabile Verbindung wird vorausgesetzt (kein Offline-Modus im MVP)
- **Desktop-App:** Windows-only (ESC/POS-Drucker laufen typischerweise auf Windows)
- **Hosting:** Öffentlicher Cloud-Host (Vercel + Supabase)

## Non-Goals (explizit NICHT im MVP)

- Kartenzahlungs-Integration (Stripe, SumUp etc.)
- Offline-Modus / lokale Datenhaltung
- Kundenbindungsprogramm / Loyalty-System
- Native Mobile-Apps (iOS/Android)
- Multi-Drucker-Routing im MVP (alle Bons an einen Drucker)
- Lagerverwaltung / Einkauf

---

_Erstellt mit `/requirements` am 2026-03-01_
