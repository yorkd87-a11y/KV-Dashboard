# Changelog

Alle nennenswerten Änderungen am KV Dashboard (`dashboard-app/`). Versionsnummern entsprechen `version.json` bzw. der `?v=`-Query an den Asset-Links in `index.html` — genau das, was die Auto-Update-Erkennung in der App vergleicht.

## [20260719-8] – 2026-07-19

### Geändert
- Mario-Tab (Mobile): Inspector-Vorschau steht jetzt unter der Event-Liste statt darüber, genau wie bei Kulturverein. Desktop bleibt unverändert (Inspector weiterhin oben, volle Breite).
- Kulturverein-Bereichskopf: Platzhaltertext („Erste Lesestufe: …") ersetzt durch vier Status-Chips (aktiv / bald / abgelaufen / pausiert) mit farbigem Punkt statt Textzeile.
- Zahnrad-Symbol in den Event-Karten: Kreishintergrund im Ruhezustand entfernt, nur das Icon ist sichtbar.

### Neu
- „+ Neues Event"-Button im Kulturverein-Bereichskopf, analog zum bestehenden „+ Neuer Termin" bei Mario.

## [20260719-7] – 2026-07-19

### Geändert
- Event-Karten (Kulturverein + Mario): Zahnrad-Button sitzt jetzt in der Titelzeile statt in einer eigenen Spalte über die volle Kartenhöhe — mehr Platz für Datum, Ort und Status, Bild auf Mobile vergrößert (44×56 → 54×70).
- „Schnell hinzufügen"-Buttons auf der Startseite: kompakteres Padding, kleinere Schrift, damit die Labels nicht gequetscht wirken.

## [20260719-6] – 2026-07-19

### Neu
- Auto-Update-Erkennung für die zum Homescreen hinzugefügte App: prüft beim Öffnen, Zurückkehren aus dem Hintergrund und alle 5 Minuten, ob eine neue Version vorliegt, und zeigt dann einen Hinweis mit „Aktualisieren"-Button.

## [20260719-5] – 2026-07-19

### Geändert
- Burger-Menü (Mobile): Kreishintergrund entfernt, im Ruhezustand nur die drei Striche sichtbar.

## [20260719-4] – 2026-07-19

### Neu
- Header-Alert (rotes Ausrufezeichen) gilt jetzt auch für abgelaufene Mario-Termine, nicht mehr nur für offene KV-Ticketformulare.

## [20260719-3] – 2026-07-19

### Neu
- Cache-Busting für CSS/JS-Assets über Versionsquery-Strings (Grundlage für die spätere Auto-Update-Erkennung).
- GitHub Pages live geschaltet: `https://yorkd87-a11y.github.io/KV-Dashboard/dashboard-app/`
- Header-Alert (rotes Ausrufezeichen) für offene Ticketformular-Prüfungen bei Kulturverein-Events, Klick springt direkt zum betroffenen Eintrag.
- Neues eckiges App-Icon als Header-Logo sowie Homescreen-/App-Symbol (`apple-touch-icon`, Favicon, `manifest.json`-Icons).
- Startseite: Logo im Header, „Schnell hinzufügen"-Block auf Überschrift + Buttons verschlankt, Platzhalter-Button für künftige dritte Plattform ergänzt.

## Vor der Versionierung

### 2026-06-29
- KV-Inspector: Aktionen hinter Zahnrad-Toggle versteckt, 3×2-Aktionsraster.
- KV-Editor: Bild-Upload als erster Schritt (Canvas-Resize, kein Firebase Storage nötig), alle Schritte auf Feldblock-Container umgebaut.
- Chips eckig statt rund, Mobile-Editor-Button-Logik bereinigt.
- Bugfix: Bildvalidierung akzeptierte `data:image/…`-URLs vom Gerät fälschlich nicht.

### 2026-06-24
- Neues Dashboard als eigene App-Struktur (`dashboard-app/`) aufgebaut, altes Monolith-Dashboard als Referenz eingefroren.
- Editor von Scroll-Formular auf geführten Schritt-für-Schritt-Ablauf umgebaut.
- Schnellauswahl für Uhrzeiten, Orte, Preise, Telefonnummer sowie Mario-Button-Vorlagen ergänzt.
- Cross-Publishing zwischen Mario und Kulturverein, Ablauf-Handling für abgelaufene Vereins-Events mit Ticketformular-Bestätigung.
- Mario-Tab: eigenes 2-Spalten-Layout mit Inspector oben, Live-Vorschau ans echte Widget angeglichen.

## Bekannte offene Punkte

Siehe „Offene Punkte / TODO" in `HEUTE-2026-06-24.md` für Details (u. a. dritte Plattform/Seite als Platzhalter-Button, Login/Zugriffsschutz noch nicht umgesetzt).
