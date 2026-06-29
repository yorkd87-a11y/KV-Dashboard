# Parallel-Arbeitsanweisung fuer Dashboard-App

Ziel: Codex und Claude sollen parallel am neuen Dashboard arbeiten, ohne sich gegenseitig Dateien, Logik oder Styles kaputt zu machen.

## Grundregel

Keine gemischten Aenderungen in denselben Dateien zur gleichen Zeit.

Wenn doch dieselbe Datei betroffen waere, dann nur nach diesem Prinzip:

1. Einer arbeitet an Struktur und Verhalten.
2. Der andere arbeitet nur an klar abgegrenzten neuen Dateien oder nur an rein visuellen Teilbereichen.

## Aktueller Stand

Bereits vorhanden:

- Grundlayout
- Tabs
- Firestore-Lesen
- Listen fuer `kv` und `mario`
- Inspector rechts
- Editor-Modal
- Speichern in Firestore
- Basis-Mobile-Layout

Wichtige Dateien:

- `dashboard-app/index.html`
- `dashboard-app/scripts/app.js`
- `dashboard-app/scripts/firebase.js`
- `dashboard-app/scripts/state.js`
- `dashboard-app/styles/base.css`
- `dashboard-app/styles/app.css`
- `dashboard-app/styles/mobile.css`

## Aufteilung ohne Konflikte

### Codex uebernimmt

Codex arbeitet an Logik, Datenfluss und bestehenden Kern-Dateien.

Dateien:

- `dashboard-app/index.html`
- `dashboard-app/scripts/app.js`
- `dashboard-app/scripts/firebase.js`
- `dashboard-app/scripts/state.js`

Aufgaben:

- Editor-Logik weiter ausbauen
- Aktivieren / Deaktivieren
- Loeschen
- Cross-Publish zwischen `kv` und `mario`
- Ticketformular-Reminder-Logik
- Datenvalidierung
- Firestore-Schreiblogik
- Inspector-Aktionen

Wichtig:

- Codex darf bestehende Datenfelder nicht ohne Absprache umbenennen
- Codex darf HTML-Struktur nur dann aendern, wenn es fuer Funktionen wirklich noetig ist

### Claude uebernimmt

Claude arbeitet an UI-Verfeinerung, Styling und neuen rein praesentativen Hilfsdateien.

Dateien:

- `dashboard-app/styles/app.css`
- `dashboard-app/styles/mobile.css`
- neue optionale CSS-Dateien, falls noetig:
  - `dashboard-app/styles/editor.css`
  - `dashboard-app/styles/components.css`
- neue optionale JS-UI-Hilfsdateien, aber nur fuer Darstellung:
  - `dashboard-app/scripts/ui-preview.js`
  - `dashboard-app/scripts/ui-toast.js`

Aufgaben:

- Mobile-Feinschliff
- Abstaende, Typografie, Kartenoptik
- Editor optisch verbessern
- Preview optisch verbessern
- Toast optisch verbessern
- bessere Touch-Bedienung
- bessere responsive Anordnung

Wichtig:

- Claude soll keine Firestore-Logik anfassen
- Claude soll keine Feldnamen aendern
- Claude soll `firebase.js` und `state.js` nicht bearbeiten
- Claude soll in `app.js` nur dann arbeiten, wenn es ausschliesslich um UI-Rendering-Helfer geht und vorher klar abgesprochen ist

## Harte No-Go-Zonen

### Nur Codex

Diese Bereiche sind fuer Claude tabu:

- Firestore lesen/schreiben
- Save-Handler
- Datenmapping
- Validierung der Payloads
- Feldstruktur fuer `kv` und `mario`
- Cross-Platform-Logik

### Nur Claude

Diese Bereiche kann Claude frei gestalten, ohne Codex zu blockieren:

- Farben
- Schatten
- Border-Radius
- Kartenlayout
- Mobile-Spacing
- Button-Look
- Editor-Layout-Optik
- Preview-Optik

## Sichere Parallel-Strategie

Beste Variante:

1. Codex arbeitet an Verhalten und Business-Logik.
2. Claude arbeitet parallel nur an Styling und UI-Polish.
3. Wenn Claude fuer das Styling neue Klassen braucht, soll er neue Klassen ergaenzen statt bestehende Logik-Klassen umzubenennen.

Beispiel:

- erlaubt: neue Klasse wie `.editor-panel-compact`
- schlecht: vorhandene Klasse wie `.editor-layout` umbenennen

## Konkrete Arbeitsauftraege

### Auftrag fuer Codex

Bitte uebernimm die funktionale Weiterentwicklung des neuen Dashboards in den bestehenden Kern-Dateien.

Prioritaet:

1. Aktivieren / Deaktivieren von Eintraegen
2. Loeschen mit Sicherheitsabfrage
3. Cross-Publish `kv <-> mario`
4. Ticketformular-Reminder fuer `kv`
5. stabile Editor-Validierung

Arbeite in:

- `dashboard-app/scripts/app.js`
- `dashboard-app/scripts/firebase.js`
- `dashboard-app/index.html`

Nicht prioritaer:

- optisches Feintuning
- reine CSS-Verschoenerung

### Auftrag fuer Claude

Bitte uebernimm das visuelle und responsive Feintuning des neuen Dashboards, ohne die Firestore- oder Save-Logik anzufassen.

Prioritaet:

1. Mobile-Optimierung fuer Listen, Inspector und Editor
2. visuelle Verbesserung von Karten, Buttons und Vorschau
3. besseres Spacing und bessere Lesbarkeit
4. Editor auf Smartphone angenehmer machen
5. Toast und Preview optisch klarer machen

Arbeite in:

- `dashboard-app/styles/app.css`
- `dashboard-app/styles/mobile.css`

Optional, falls sauber getrennt:

- `dashboard-app/styles/editor.css`
- `dashboard-app/styles/components.css`

Nicht anfassen:

- `dashboard-app/scripts/firebase.js`
- `dashboard-app/scripts/state.js`
- Firestore-Feldnamen
- Save- und Publish-Logik

## Wenn beide doch dieselbe Datei brauchen

Dann nur mit dieser Trennung:

- Codex aendert JS-Funktionen und Datenlogik
- Claude aendert nur CSS-Klassen, Styles oder neue Wrapper-Elemente

Wenn HTML geaendert werden muss:

- nur einer aendert `index.html`
- der andere arbeitet solange in CSS oder in neuen Hilfsdateien

## Handover-Regel

Nach jeder groesseren Aenderung kurz notieren:

- Was wurde geaendert
- Welche Dateien wurden angefasst
- Was sollte der andere gerade nicht ueberschreiben

Mini-Format:

```text
Stand:
- Datei:
- Geaendert:
- Bitte nicht ueberschreiben:
```

## Empfehlung fuer genau jetzt

Sinnvolle Aufteilung ab sofort:

- Codex: Aktivieren / Deaktivieren, Loeschen, Cross-Publish, Ticket-Reminder
- Claude: Mobile-Editor, Listen-Polish, Inspector-Polish, bessere Preview-Optik

So koennen beide parallel liefern, ohne dass Merge-Chaos entsteht.
