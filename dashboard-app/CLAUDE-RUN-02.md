# Claude Arbeitsauftrag Runde 2

Ziel: Du uebernimmst ausschliesslich UI-, Layout- und CSS-Arbeit am neuen `dashboard-app`, ohne die Firestore- oder Business-Logik zu veraendern.

Bitte arbeite die folgenden Schritte in der genannten Reihenfolge ab.

## Wichtig vor dem Start

### Nicht anfassen

Diese Dateien und Bereiche sind fuer diese Runde tabu:

- `dashboard-app/scripts/firebase.js`
- Firestore-Lese-/Schreiblogik
- Feldnamen in den Daten
- Cross-Publish-Logik
- Delete-/Save-Logik
- Ticketformular-Logik

### Mit Vorsicht anfassen

Diese Datei darfst du nur fuer praesentative Render-Helfer oder kleine Strukturverbesserungen anfassen:

- `dashboard-app/scripts/app.js`

Wenn du dort arbeitest, dann nur fuer:

- zusaetzliche Wrapper
- zusaetzliche Klassen
- bessere Struktur fuer Layout

Nicht erlaubt in `app.js`:

- Logik aendern
- Firestore-Aufrufe aendern
- Payloads aendern
- Event-Handler fachlich umbauen

### Primaere Arbeitsdateien

- `dashboard-app/styles/app.css`
- `dashboard-app/styles/mobile.css`

Optional neu anlegen, wenn es sauberer wird:

- `dashboard-app/styles/editor.css`
- `dashboard-app/styles/components.css`

Wenn du neue CSS-Dateien anlegst, bitte auch sauber in `index.html` einbinden.

## Gesamtziel dieser Runde

Das Dashboard soll sich hochwertiger, ruhiger und klarer anfuehlen.

Besonders wichtig:

- bessere mobile Bedienung
- bessere visuelle Hierarchie
- klarere Aktionsbereiche
- weniger CSS-Dopplungen
- konsistente Buttons, Dialoge und Statusdarstellung

## Aufgabe 1: CSS aufraeumen

### Ziel

Die aktuelle `app.css` hat doppelte oder ueberschneidende Bereiche, besonders beim Confirm-Dialog und bei Danger-Buttons.

### Was du tun sollst

1. Suche doppelte Definitionen in `app.css`.
2. Fuehre doppelte Regeln zusammen.
3. Achte darauf, dass sich das Verhalten visuell nicht verschlechtert.
4. Halte die Datei logisch gruppiert.

### Besonders pruefen

- `.confirm-modal`
- `.confirm-panel`
- `.confirm-actions`
- `.danger-button`
- Hover-/Micro-Interaction-Bloecke

### Ergebnis

- weniger Redundanz
- leichter wartbares CSS
- kein visueller Rueckschritt

## Aufgabe 2: Confirm-Dialog hochwertiger machen

### Ziel

Der Loesch-Dialog soll wie ein bewusster Teil der App wirken und nicht wie ein nachtraeglich aufgesetztes Notfenster.

### Was du tun sollst

1. Verbessere die optische Hierarchie im Confirm-Dialog.
2. Mache die Sicherheitsabfrage deutlicher.
3. Gib dem Dialog einen klaren Fokuspunkt.
4. Sorge fuer gute mobile Darstellung.

### Gewuenschte Richtung

- deutliche Ueberschrift
- ruhiger Fliesstext
- visuell klar getrennte Aktionsbuttons
- Gefahr-Aktion erkennbar, aber nicht billig rot
- etwas mehr Luft und Ruhe

### Optional

- kleines Warn-Icon oder Badge
- bessere Abstaende zwischen Text und Buttons

## Aufgabe 3: Aktionsbuttons in den Listen verbessern

### Ziel

Die Karten haben inzwischen mehrere Buttons. Das soll auf Desktop ordentlich und auf Mobile nicht gequetscht wirken.

### Was du tun sollst

1. Ueberarbeite die Aktionszone jeder Kartenzeile.
2. Sorge dafuer, dass die Buttons zusammengehoerig wirken.
3. Verhindere optisches Chaos bei schmalen Breiten.

### Gewuenschte Richtung

- Desktop: sauber nebeneinander oder logisch gruppiert
- Mobile: Buttons duerfen auf zweite Reihe, aber kontrolliert
- klare Gewichtung:
  - wichtigste Aktion am sichtbarsten
  - destruktive Aktion deutlich, aber nicht zu dominant

### Achte besonders auf

- `Ticket erledigt / offen`
- `Aktivieren / Deaktivieren`
- `Bearbeiten`
- `Loeschen`

## Aufgabe 4: Inspector visuell staerker machen

### Ziel

Der rechte Inspector soll sich mehr wie eine echte Fokusflaeche anfuehlen und weniger wie ein grosser dunkler Block mit Text.

### Was du tun sollst

1. Verbessere die visuelle Hierarchie in der Vorschau.
2. Arbeite den Bereich fuer Titel, Status und Meta-Daten klarer heraus.
3. Mache die Actions im Inspector angenehmer und geordneter.

### Gewuenschte Richtung

- Titel klarer
- Meta-Daten ruhiger
- etwas staerkere Trennung einzelner Informationszeilen
- Aktionsbuttons harmonischer
- wenn moeglich etwas weniger "schwere dunkle Masse"

### Optional

- leicht bessere Bildinszenierung
- etwas bessere Tag-/Badge-Inszenierung

## Aufgabe 5: Mobile Editor deutlich verbessern

### Ziel

Der Editor soll auf dem Smartphone nicht nur funktionieren, sondern angenehm sein.

### Was du tun sollst

1. Optimiere die Feldabstaende auf Mobile.
2. Verbessere die Reihenfolge und Lesbarkeit.
3. Mache die Footer-Aktionen auf Mobile klarer.
4. Sorge dafuer, dass die Vorschau im Editor auf Handy nicht zu gross und nicht zu schwer wird.

### Gewuenschte Richtung

- weniger gequetscht
- klare Reihenfolge
- gute Touch-Ziele
- Buttons unten leicht erreichbar
- keine unnötige Hoehe durch Vorschau

### Gute Loesungen waeren z.B.

- kompaktere Preview auf Mobile
- Footer klar sticky oder zumindest visuell stabil
- Inputs etwas ruhiger gruppiert

## Aufgabe 6: Toasts aufwerten

### Ziel

Die Toasts sollen besser lesbar und hochwertiger wirken.

### Was du tun sollst

1. Verbessere die Typografie im Toast.
2. Sorge fuer klarere visuelle Unterschiede zwischen normalem Hinweis und Fehler.
3. Behalte den Close-Button gut bedienbar.

### Optional

- kleines Status-Icon
- bessere Einblendung
- leicht bessere Schatten und Breite

## Aufgabe 7: Statussprache visuell vereinheitlichen

### Ziel

`Aktiv`, `Inaktiv`, `Ticket offen`, `Ticket erledigt`, `Bald` sollen nicht nur textlich, sondern auch visuell konsistent erscheinen.

### Was du tun sollst

1. Ueberpruefe alle Statusdarstellungen.
2. Vereinheitliche Farben, Pillen, Button-Staerken und Warnhinweise.
3. Vermeide gemischte Sprache oder widerspruechliche Gewichtung.

### Achte auf

- Status-Pills
- Ticket-Warnsymbol
- Button-Farben
- Inspector-Anzeige

## Aufgabe 8: Fokus- und Hover-Zustaende sauber machen

### Ziel

Die App soll sich hochwertig und kontrolliert anfuehlen, auch bei Maus und Tastatur.

### Was du tun sollst

1. Ueberpruefe Hover-Zustaende.
2. Fuege sinnvolle Focus-States hinzu.
3. Achte darauf, dass Buttons und interaktive Elemente nicht nur per Farbe reagieren.

### Wichtig

- nicht ueberanimieren
- lieber klar und ruhig

## Aufgabe 9: Kleines visuelles Abschluss-Paket

### Ziel

Zum Schluss soll die App insgesamt wie aus einem Guss wirken.

### Bitte pruefen

1. Sind alle Button-Familien konsistent?
2. Sind Dialoge, Toasts und Karten Teil derselben Designsprache?
3. Ist Mobile wirklich angenehm?
4. Gibt es optische Brueche zwischen Listen, Inspector und Editor?

Wenn ja:

- bitte gezielt glätten
- keine komplette Neugestaltung
- nur verfeinern

## Was nicht noetig ist

Bitte in dieser Runde nicht:

- neue grosse Features erfinden
- neue Datenlogik bauen
- Publish-Flow umbauen
- Login bauen
- Firestore-Struktur veraendern

## Gewuenschter Arbeitsstil

Bitte Schritt fuer Schritt arbeiten:

1. erst CSS bereinigen
2. dann Confirm-Dialog
3. dann Listenaktionen
4. dann Inspector
5. dann Mobile-Editor
6. dann Toasts
7. dann finaler Polishing-Durchgang

## Handover-Format am Ende

Bitte am Ende genau dieses Format nutzen:

```text
Stand:
- Dateien:
- Optisch verbessert:
- Nicht angefasst:
- Eventuelle Restpunkte:
```

## Kurzfassung fuer dich

Dein Fokus ist:

- visuelle Klarheit
- Mobile-Qualitaet
- CSS aufraeumen
- Komponenten vereinheitlichen

Mein Fokus bleibt:

- Cross-Publish
- Firestore-Logik
- Datenfluss
- Verknuepfungen zwischen `kv` und `mario`
