# #29 — Legal Pages (Datenschutz, Nutzungsbedingungen, Unternehmensangaben, Cookie-Richtlinie)

**Type:** AFK
**Blocked by:** None

## What to build

Implementiere einen vollständigen Legal-Block für RealBnB mit vier öffentlich erreichbaren Seiten:

- Datenschutz
- Nutzungsbedingungen
- Angaben zum Unternehmen (Impressum/Unternehmensangaben)
- Cookie-Richtlinie

Die Seiten sollen dauerhaft über die öffentliche Navigation erreichbar sein (z. B. Footer), ohne Login zugänglich sein und als statische, SEO-fähige Seiten ausgeliefert werden.

Inhaltlicher Fokus:

- Klare Struktur mit Überschriften, Abschnitten und Datumsstand („zuletzt aktualisiert“)
- Verständliche Sprache (kein Platzhalter-Text wie "Lorem ipsum")
- Konsistente Darstellung im bestehenden Design-System

Technischer Fokus:

- Eigene Routen unter `src/app` für jede Legal-Seite
- Interne Verlinkung zwischen den Legal-Seiten
- Einheitliche Metadata (`title`, `description`, Canonical)

## Acceptance criteria

- [ ] Es existieren vier eigenständige Seiten für Datenschutz, Nutzungsbedingungen, Unternehmensangaben und Cookie-Richtlinie.
- [ ] Alle vier Seiten sind ohne Authentifizierung öffentlich erreichbar.
- [ ] Alle vier Seiten sind dauerhaft über die Haupt-UI erreichbar (z. B. Footer-Links auf allen öffentlichen Seiten).
- [ ] Jede Seite enthält einen sichtbaren Stand-Hinweis („Zuletzt aktualisiert am …“).
- [ ] Jede Seite hat sinnvolle SEO-Metadaten (Title + Description + Canonical).
- [ ] Die Seiten sind responsive und auf Mobile/Desktop gut lesbar.
- [ ] Die Seiten verwenden konsistente Typografie und Abstände im bestehenden UI-Stil.
- [ ] Interne Links zwischen den Legal-Seiten funktionieren korrekt.
- [ ] Es gibt Playwright-Abdeckung, die Erreichbarkeit, Kerninhalte und Footer-Navigation prüft.

## Blocked by

- None
