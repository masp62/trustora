# #29 â€” Legal Pages (Datenschutz, Nutzungsbedingungen, Unternehmensangaben, Cookie-Richtlinie)

**Type:** AFK
**Blocked by:** None

## What to build

Implementiere einen vollstÃ¤ndigen Legal-Block fÃ¼r Trustora mit vier Ã¶ffentlich erreichbaren Seiten:

- Datenschutz
- Nutzungsbedingungen
- Angaben zum Unternehmen (Impressum/Unternehmensangaben)
- Cookie-Richtlinie

Die Seiten sollen dauerhaft Ã¼ber die Ã¶ffentliche Navigation erreichbar sein (z. B. Footer), ohne Login zugÃ¤nglich sein und als statische, SEO-fÃ¤hige Seiten ausgeliefert werden.

Inhaltlicher Fokus:

- Klare Struktur mit Ãœberschriften, Abschnitten und Datumsstand (â€žzuletzt aktualisiertâ€œ)
- VerstÃ¤ndliche Sprache (kein Platzhalter-Text wie "Lorem ipsum")
- Konsistente Darstellung im bestehenden Design-System

Technischer Fokus:

- Eigene Routen unter `src/app` fÃ¼r jede Legal-Seite
- Interne Verlinkung zwischen den Legal-Seiten
- Einheitliche Metadata (`title`, `description`, Canonical)

## Acceptance criteria

- [ ] Es existieren vier eigenstÃ¤ndige Seiten fÃ¼r Datenschutz, Nutzungsbedingungen, Unternehmensangaben und Cookie-Richtlinie.
- [ ] Alle vier Seiten sind ohne Authentifizierung Ã¶ffentlich erreichbar.
- [ ] Alle vier Seiten sind dauerhaft Ã¼ber die Haupt-UI erreichbar (z. B. Footer-Links auf allen Ã¶ffentlichen Seiten).
- [ ] Jede Seite enthÃ¤lt einen sichtbaren Stand-Hinweis (â€žZuletzt aktualisiert am â€¦â€œ).
- [ ] Jede Seite hat sinnvolle SEO-Metadaten (Title + Description + Canonical).
- [ ] Die Seiten sind responsive und auf Mobile/Desktop gut lesbar.
- [ ] Die Seiten verwenden konsistente Typografie und AbstÃ¤nde im bestehenden UI-Stil.
- [ ] Interne Links zwischen den Legal-Seiten funktionieren korrekt.
- [ ] Es gibt Playwright-Abdeckung, die Erreichbarkeit, Kerninhalte und Footer-Navigation prÃ¼ft.

## Blocked by

- None

