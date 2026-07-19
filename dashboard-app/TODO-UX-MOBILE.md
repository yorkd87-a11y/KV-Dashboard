# TODO – UX/Mobile-Optimierung Dashboard

Analyse vom 2026-07-19 (siehe Chat/Claude Sonnet 5). Fokus: mobile Bedienung.
Jeder Punkt hat **Was / Warum / Wo / Wie**, damit auch ohne Chat-Kontext (z. B. mit Codex) direkt weitergearbeitet werden kann.

Betroffene Dateien liegen alle in `dashboard-app/`:
- `index.html` – Markup
- `scripts/app.js` – komplette App-Logik (Rendering, State, Event-Handling, Firebase-Calls)
- `scripts/state.js` – zentraler App-State (`appState`)
- `scripts/firebase.js` – Firestore CRUD (`saveEventDocument`, `patchEventDocument`, `removeEventDocument`, `subscribeToEvents`)
- `styles/app.css` – Hauptstyles (Desktop-first)
- `styles/mobile.css` – Overrides in `@media`-Blöcken (820px / 640px / 1100px Breakpoints), lädt NACH `app.css`

**Wichtig:** Nach jeder Änderung an `index.html`/`app.js`/CSS-Dateien die `?v=`-Query-Strings in `index.html` UND `version.json` synchron hochzählen (Cache-Busting + Auto-Update-Toast). Siehe `CHANGELOG.md` für das bisherige Versionsschema (`20260719-8` etc.).

---

## Priorität 1 – größter Hebel

### [x] 1. Bottom-Tab-Bar statt Burger-Menü (Mobile)
- **Was:** Feste Tab-Leiste unten (Start / Verein / Mario), ersetzt Burger-Menü auf Mobile.
- **Warum:** Nur 3 Bereiche = Idealfall für Bottom-Nav. 1 Tap statt 2, Daumenzone statt oben.
- **Wo:**
  - `index.html`: `.mobile-nav` (Zeile 41-45) und `.mobile-menu-toggle` (Zeile 37) sind die bestehenden Bausteine.
  - `styles/app.css`: `.mobile-menu-toggle` (Zeile 86-101), `.mobile-nav` (Zeile 103-110), `.top-tabs`/`.mobile-nav-link` (Zeile 58-78).
  - `styles/mobile.css`: `@media (max-width: 820px)`-Block (Zeile 35-122) – hier `.mobile-menu-toggle { display: inline-grid }` und `.mobile-nav-link`-Styles.
  - `scripts/app.js`: `bindEvents()` → `mobileToggle?.addEventListener(...)` (ca. Zeile 2112), `render()` steuert `mobileNav.hidden` (Zeile 1300).
- **Wie:**
  1. Neue feste Leiste `<nav class="mobile-tabbar">` mit 3 Buttons (`data-tab="home|kv|mario"`) am Ende von `.app-shell` in `index.html` einfügen – wiederverwendet dieselbe `tabButtons`-Logik in `app.js` (die selektiert `[data-tab]` global, s. Zeile 20), also einfach dieselben `data-tab`-Attribute nutzen, keine neue JS-Logik nötig.
  2. In `mobile.css` `@media (max-width: 820px)`: `.mobile-tabbar { display: flex; position: fixed; bottom: 0; left: 0; right: 0; ... }`, `body { padding-bottom: <Höhe der Bar> }` damit Content nicht verdeckt wird.
  3. `.mobile-menu-toggle` + `.mobile-nav` (Burger-Menü) und `.top-tabs` auf Mobile ausblenden (`display: none` im gleichen Breakpoint) – der Jotform-Link (`index.html` Zeile 33-35) braucht einen neuen Platz, z. B. als kleiner Link im Home-Tab.
  4. Safe-Area beachten, siehe Punkt 17.

### [x] 2. „Änderungen verwerfen?"-Schutz im Editor
- **Was:** Bestätigungsdialog bevor der Editor mit unsaved changes geschlossen wird.
- **Warum:** Aktuell schließt Backdrop-Tap/X/Escape sofort, alle Eingaben sind weg – häufige Frustquelle auf Mobile (versehentlicher Tap).
- **Wo:**
  - `scripts/app.js`: `closeEditor(force = false)` (Zeile 1543-1551) – hat schon ein `force`-Flag-Muster (aktuell nur für „saving“ genutzt).
  - Aufrufer: `editorElements.close`/`cancel` Listener (Zeile 2130-2131), `data-editor-close` Backdrop-Handler (Zeile 2177-2181), Escape-Handler (Zeile 2200-2202).
  - `readEditorDraft()` (Zeile 1359) liefert den aktuellen Formularstand zum Vergleich.
- **Wie:**
  1. Beim `openEditor()` (Zeile 1519) den Ausgangs-Draft snapshotten (z. B. `editorState.initialDraftJson = JSON.stringify(draft)`).
  2. In `closeEditor()`: wenn `!force` und `JSON.stringify(readEditorDraft()) !== editorState.initialDraftJson`, statt sofort zu schließen ein kleines Confirm zeigen (bestehendes `confirm-modal`-Pattern aus `index.html` Zeile 357-371 wiederverwenden, ggf. zweiten confirm-State oder generischen „confirm callback“ einführen).
  3. Bei Bestätigung `closeEditor(true)` aufrufen.

### [x] 3. Lade-Zustand (Skeleton) beim App-Start
- **Was:** Platzhalter-Karten statt „Noch nichts da“ bis der erste Firestore-Snapshot da ist.
- **Warum:** Auf Mobilfunk dauert der erste Snapshot 1-3s, aktuell sieht es aus wie „alles leer“.
- **Wo:**
  - `scripts/app.js`: `renderEmptyState()` (Zeile 995-998), `renderHomeList()`/`renderTypeList()` (Zeile 1000-1028) zeigen aktuell direkt den Empty-State.
  - `initData()` (Zeile 2206-2231) – hier startet `subscribeToEvents`, vor dem ersten `onData`-Callback ist `appState.events[type]` noch `[]` (Default in `state.js` Zeile 4-7).
- **Wie:**
  1. In `state.js`/`appState` ein Flag `loaded: { kv: false, mario: false }` ergänzen.
  2. In `initData()` beim ersten `onData`-Callback pro Typ `appState.loaded[type] = true` setzen.
  3. In `renderEmptyState`-Aufrufstellen unterscheiden: wenn `!appState.loaded[type]` → Skeleton-Markup (z. B. 2-3 `<div class="event-row-skeleton">` mit CSS-Shimmer) statt „Noch nichts da“.
  4. Neue CSS-Klasse `.event-row-skeleton` in `app.css` (Pulsieren via `@keyframes` + `opacity`/`background-position`).

### [x] 4. Bild-Upload auch für Mario-Termine
- **Was:** Gleicher Foto-Upload-Mechanismus wie bei KV (Canvas-Resize) auch im Mario-Editor; zusätzlich Vorschaufläche direkt antippbar machen.
- **Warum:** Aktuell hat Mario nur ein Bild-URL-Textfeld – auf dem Handy tippt niemand eine URL.
- **Wo:**
  - `index.html`: KV-Bild-Schritt ist `data-kv-step="0"` (Zeile 154-165), exklusiv für KV (`editor-fBildFile`-Input existiert nur einmal, ist aktuell nicht an `data-editor-only` gebunden, sondern über das separate `data-kv-step="0"`-Panel gesteuert, das für Mario gar nicht im Step-Ablauf vorkommt, siehe `getEditorSteps()`).
  - `scripts/app.js`: `getEditorSteps(type)` (Zeile 435-449) definiert die Schritte pro Typ – Mario hat aktuell keinen Bild-Schritt.
  - `resizeImageToDataUrl()` (Zeile 1401-1420), Listener auf `editorElements.fields.bildFile` (Zeile 2139-2150) ist bereits generisch (nicht KV-spezifisch) – die Logik ist wiederverwendbar.
  - `applyEditorStepVisibility()` (Zeile 1383-1389) nutzt `data-kv-step`/`data-mario-step`.
- **Wie:**
  1. In `getEditorSteps("mario")` einen neuen ersten Schritt „Bild“ ergänzen (Reihenfolge/Indizes für alle `data-mario-step`-Attribute in `index.html` entsprechend verschieben, aktuell 0/1/2 → 1/2/3).
  2. Im Bild-Panel (`data-kv-step="0"`) zusätzlich `data-mario-step="0"` setzen, damit es für beide Typen sichtbar wird (Panel ist bereits typ-neutral aufgebaut).
  3. `editorImgPreview` (Zeile 156-159) klickbar machen: `cursor: pointer` + Klick-Listener der `editorElements.fields.bildFile.click()` auslöst (statt nur das kleine `<input type="file">`-Feld selbst).
  4. `editorLinkHint`/Bild-URL-Feld-Hinweistext (Zeile 311) ggf. für Mario anpassen.

### [x] 5. Status-Chips als Filter + auch bei Mario
- **Was:** KV-Chips (aktiv/bald/abgelaufen/pausiert) antippbar → filtert die Liste; gleiches Chip-System auch im Mario-Tab statt der „X gesamt“-Pille.
- **Warum:** Schnellster Weg, bei wachsender Eventzahl gezielt zu arbeiten; Konsistenz zwischen den Tabs.
- **Wo:**
  - `scripts/app.js`: `renderKvStatusChips()` (Zeile 1045-1067), `renderCounts()` (Zeile 1030-1043), `renderTypeList()` (Zeile 1015-1028) – aktueller Filter fehlt komplett.
  - `index.html`: `#kv-status-chips` (Zeile 96), Mario-Pille `#mario-count` (Zeile 111).
  - `state.js`: `appState` – neuer Filter-State nötig, z. B. `appState.statusFilter = { kv: null, mario: null }`.
- **Wie:**
  1. State-Feld `statusFilter` pro Typ ergänzen + Setter in `state.js`.
  2. Chips in `renderKvStatusChips()` mit `data-action="toggle-status-filter" data-status-type="kv" data-status="live"` versehen, `handleActionClick()` (Zeile 1958ff.) um diesen Case erweitern (toggelt `statusFilter`, ruft `render()`).
  3. `renderTypeList()` filtert zusätzlich nach `statusFilter[type]` (via `getStatus(eventItem).className === filter`), wenn gesetzt.
  4. Aktiven Chip visuell hervorheben (neue CSS-Klasse `.status-chip.is-active` in `app.css`, in der Nähe von `.status-chip` Zeile 351-394).
  5. Gleiche Chip-Zeile + Funktion für Mario in `index.html` (`#mario-count`-Pille durch `<div class="status-chip-row" id="mario-status-chips">` ersetzen, Zeile 110-113) und `renderCounts()`/neue `renderMarioStatusChips()` ergänzen.

---

## Priorität 2 – Bedienfluss & Navigation

### [ ] 6. Nach Karten-Tap sanft zur Vorschau scrollen (Mobile)
- **Wo:** `handleActionClick()`, Case `"select-event"` (Zeile 1961-1973) in `app.js`.
- **Wie:** Analog zum bestehenden `headerAlertButton`-Handler (Zeile 2117-2125, nutzt `inspectorStage?.scrollIntoView({ behavior: "smooth", block: "start" })`) denselben Scroll-Call hinzufügen – aber **nur wenn `appState.activeTab !== "home"`** und nur auf schmalen Viewports (z. B. via `window.matchMedia("(max-width: 1100px)").matches`, passend zum Breakpoint in `mobile.css` Zeile 5).

### [ ] 7. Schwebender „+“-Button (FAB)
- **Wo:** Neues Element in `index.html`, z. B. direkt vor `</main>` oder in `.app-shell`; CSS in `app.css`/`mobile.css`; Klick ruft bestehende `openEditor(type)` (Zeile 1519) über den vorhandenen `data-action="create-event"`-Mechanismus auf (kein neuer JS-Code nötig, nur `data-event-type` dynamisch auf `appState.activeTab` setzen beim Rendern, ähnlich `renderHeaderAlert()`).
- **Wie:** Fixed-position Button unten rechts, nur sichtbar wenn `activeTab` `kv` oder `mario` ist (in `render()`, Zeile 1287ff., hidden-Flag setzen). Safe-Area/Bottom-Tab-Bar (Punkt 1) beim `bottom`-Offset berücksichtigen.

### [ ] 8. Zähler im roten „!“-Button + Sprung zum nächsten offenen Punkt
- **Wo:** `getFirstEventNeedingReview()` (Zeile 394-402), `renderHeaderAlert()` (Zeile 404-407), `headerAlertButton` HTML (Zeile 36 in `index.html`).
- **Wie:**
  1. Neue Funktion `getAllEventsNeedingReview()` (kombiniert `getExpiredKvEventsNeedingCleanup()` + `getPendingKvEvents()` + `getExpiredMarioEventsNeedingReview()`, dedupliziert).
  2. In `renderHeaderAlert()` die Anzahl in ein `<span>` im Button schreiben (Button-Inhalt von statischem `!` auf `<span class="alert-count">3</span>` erweitern, CSS in `app.css` bei `.header-alert-button` Zeile 161-179 ergänzen).
  3. Nach einer Aktion (`archive-event`/`confirm-ticket-removed`/etc.) prüft `render()` ohnehin neu – kein Extra-Code nötig, nur sicherstellen dass der Button-Klick-Handler nach Erledigung erneut zum nächsten Punkt springen kann (bereits der Fall, da `getFirstEventNeedingReview()` bei jedem Klick neu berechnet wird).

### [ ] 9. Archiv sichtbar machen + Wiederherstellen
- **Warum:** `archiveEvent()` (Zeile 1875-1901) setzt `archived: true`, aber `getVisibleEvents()` (state-Filter in `app.js` Zeile 287-289) blendet archivierte Events komplett aus – es gibt aktuell **keine UI**, um sie wiederzusehen.
- **Wo:**
  - `scripts/app.js`: `getVisibleEvents()` (Zeile 287-289), `renderTypeList()` (Zeile 1015-1028).
  - `index.html`: KV-Panel (Zeile 86-100), Mario-Panel (Zeile 102-118) – neuer einklappbarer Bereich am Ende.
- **Wie:**
  1. Neue Funktion `getArchivedEvents(type)` (`appState.events[type].filter(isEventArchived)`).
  2. Neuer `<details>`- oder Toggle-Block „Archiv (N)“ unter der jeweiligen Liste, rendert dieselbe `buildEventRow()`-Funktion (Zeile 909-993) für archivierte Events.
  3. Neue Aktion `data-action="unarchive-event"` → `patchEventDocument(type, eventId, { archived: false })`, Case in `handleActionClick()` ergänzen.
  4. In `buildEventRow()` für archivierte Events die „Löschen/Pausieren“-Buttons ggf. durch „Wiederherstellen“ ersetzen (Parameter `isArchivedView` durchreichen).

---

## Priorität 3 – Editor/Formular (Mobile)

### [x] 10. iOS-Zoom-Falle bei Eingabefeldern beheben
- **Wo:** `styles/app.css`, `.form-field input, .form-field textarea` (Zeile 1443-1453) – `font-size: 0.95rem` (~15.2px).
- **Wie:** In `mobile.css` innerhalb `@media (max-width: 640px)` (Block ab Zeile 128) ergänzen:
  ```css
  .form-field input,
  .form-field textarea {
    font-size: 16px;
  }
  ```
  (iOS Safari zoomt nur bei Fokus auf Felder mit `font-size < 16px`.)

### [x] 11. Passende mobile Tastaturen pro Feldtyp
- **Wo:** `index.html`, Telefon-Feld `editor-fTelefon` (Zeile 257, aktuell `type="text"`), Link-Feld `editor-fLink` (Zeile 301, bereits `type="url"`).
- **Wie:**
  - Telefon-Feld auf `type="tel"` ändern.
  - Link-Feld: `autocapitalize="off" autocorrect="off" spellcheck="false"` ergänzen.
  - Preis-Feld (`editor-fPreis`, Zeile 246) ggf. `inputmode="decimal"` falls primär Zahlen erwartet werden (aktuell auch Freitext wie „Eintritt frei“, also nur `inputmode`, kein `type="number"`).

### [x] 12. Validierungsfehler am Feld statt nur als Toast
- **Wo:** `validateDraft()` (Zeile 1638-1648), `saveCurrentEditor()` (Zeile 1650-1713), `setEditorStep()` (Zeile 470-485) – alle nutzen aktuell nur `showToast(..., "error")`.
- **Wie:**
  1. `validateDraft()`/`getEditorStepValidationMessage()` (Zeile 456-468) so erweitern, dass sie zusätzlich zur Message eine `fieldId` zurückgeben (z. B. `{ message, fieldId }` statt nur String).
  2. Beim Fehlerfall: betroffenes Feld per `document.getElementById(fieldId)` holen, `classList.add("has-error")`, `scrollIntoView({ behavior: "smooth", block: "center" })`, `focus()`.
  3. Neue CSS-Klasse `.form-field input.has-error` (roter Rand) in `app.css` nahe der bestehenden Fokus-Styles (Zeile 1460-1465).
  4. Klasse beim nächsten `input`-Event wieder entfernen (bestehender `editorElements.form?.addEventListener("input", ...)` Zeile 2159-2169).

---

## Priorität 4 – Feedback & Darstellung

### [x] 13. Erfolgs-Toasts automatisch ausblenden
- **Wo:** `showToast()` (Zeile 327-341 in `app.js`), `closeToast()` (Zeile 343-345).
- **Wie:** In `showToast()` bei `kind !== "error"` einen `setTimeout(() => closeToast(), 5000)` setzen; bei erneutem `showToast()`-Aufruf vorherigen Timer clearen (Timer-Referenz z. B. in einer Modul-Variable `toastTimer` speichern). Update-Toast (`showUpdateToast()`, Zeile 347-361) explizit ausnehmen (soll stehen bleiben).

### [ ] 14. Relative Datumsangabe auf Karten
- **Wo:** `buildEventRow()` (Zeile 909-993), nutzt aktuell `formatDate()` (Zeile 212-222 in `app.js`, bzw. `state.js`-Import beachten – Funktion liegt tatsächlich direkt in `app.js`).
- **Wie:** Neue Hilfsfunktion `getRelativeDateLabel(dateString)` (z. B. „Heute“, „Morgen“, „in 6 Tagen“, ab >14 Tage kein Relativ-Label mehr) und in der Kartenzeile zusätzlich zum vorhandenen `formatDate()`-Text anzeigen, z. B. `<span>${relativeLabel} · ${formatDate(...)}</span>`.

### [ ] 15. Lange Titel auf 2 Zeilen begrenzen
- **Wo:** `app.css`, `.event-copy strong` (Zeile 589-591) bzw. `.event-copy-head strong` (Zeile 485-487 sowie mobile Override Zeile 205-207 in `mobile.css`).
- **Wie:** `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;` ergänzen (gleiches Muster wie schon bei `.pw-mario-beschreibung` in `app.css` Zeile 1954-1962 verwendet).

---

## Priorität 5 – Konsistenz & Kleinigkeiten

### [x] 16. Einheitliche Wortwahl bei Zählern
- **Wo:** `renderCounts()` (Zeile 1030-1043) – `countTargets.homeMario.textContent = \`${activeMarioCount} offen\`` (Zeile 1040), `countTargets.mario.textContent = \`${marioEvents.length} gesamt\`` (Zeile 1041).
- **Wie:** Beide auf `"${activeMarioCount} aktiv"` bzw. konsistente Formulierung wie bei KV (Zeile 1037-1039) angleichen.

### [x] 17. Safe-Area fürs iPhone (Voraussetzung für Punkt 1 & 7)
- **Wo:** `index.html` `<meta name="viewport">` (Zeile 5), `app.css`/`mobile.css` für alle fixed-position Elemente (`.toast-host` Zeile 1607-1616 in `app.css`, künftige `.mobile-tabbar`, `.fab-button`).
- **Wie:**
  1. `viewport`-Meta um `viewport-fit=cover` ergänzen: `content="width=device-width, initial-scale=1.0, viewport-fit=cover"`.
  2. Bei allen fixed-bottom-Elementen `padding-bottom: env(safe-area-inset-bottom)` bzw. `bottom: calc(<wert> + env(safe-area-inset-bottom))` ergänzen.

### [ ] 18. Offline-Hinweis
- **Wo:** Neuer Code-Abschnitt in `app.js`, ähnlich `initUpdateCheck()` (Zeile 2255-2265).
- **Wie:** `window.addEventListener("online"/"offline", ...)` → globalen State-Flag setzen, dezenten Banner (neues Element, z. B. `<div class="offline-banner" hidden>` in `index.html` nahe `.topbar`) ein-/ausblenden. Kein Firestore-spezifischer Retry-Code nötig, Firestore SDK cached/synct selbst; der Banner ist reines UI-Feedback.

---

## Reihenfolge-Empfehlung
1. **Paket A (größter Effekt):** Punkt 1, 2, 3
2. **Paket B (schnelle Fixes, ca. 20 Zeilen):** Punkt 10, 11, 13
3. **Paket C:** Punkt 4, 5
4. Rest nach Bedarf/Zeit

## Hinweis für Codex-Fortsetzung
- Keine Build-Pipeline, reines Vanilla JS/CSS/HTML, ES Modules (`type="module"`), kein npm-Install nötig.
- Nach Änderungen: `node --check scripts/app.js` zur Syntaxprüfung nutzen (kein Linter/Test-Setup vorhanden).
- Beim Push: `?v=`-Query-Strings in `index.html` (Zeilen 11-13, 375) UND `version.json` (`{"version": "..."}`) hochzählen, sonst greift der Update-Toast nicht.
- User-Präferenz: **kleine Änderungen zuerst lokal committen, erst auf explizite Anweisung `git push`** (nicht bei jedem einzelnen Schritt pushen).
- User testet selbst im Browser/auf dem Handy – keine eigenständigen Browser-Tests/Screenshots nötig, nur Code liefern.
