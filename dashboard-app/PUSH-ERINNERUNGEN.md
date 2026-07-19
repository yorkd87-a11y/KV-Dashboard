# Push-Erinnerungen

Die App-Erweiterung ist vorbereitet. Sie erinnert aktivierte Geräte höchstens alle vier Tage, solange im Kulturverein oder bei Mario offene Aufgaben vorhanden sind.

## Einmalig im Firebase-Konto einrichten

1. Im Firebase-Projekt `kulturverein-ec831` unter **Cloud Messaging** einen Web-Push-Schlüssel (VAPID-Schlüssel) erzeugen.
2. Den öffentlichen VAPID-Schlüssel in `push-config.js` bei `vapidKey` eintragen. Dieser Schlüssel ist absichtlich öffentlich und kein Passwort.
3. Im Firebase-Projekt `mario-schlagerseite` ein Service-Konto mit ausschließlichem Lesezugriff auf Firestore anlegen und dessen JSON-Datei sicher aufbewahren.
4. Firebase CLI anmelden und im Ordner `dashboard-app` die Abhängigkeiten für den Hintergrunddienst installieren:

```powershell
cd functions
npm install
cd ..
```

5. Das Mario-Service-Konto als Firebase-Secret hinterlegen. Den JSON-Inhalt dabei nur in die sichere Eingabe der Firebase CLI einfügen, niemals in Git oder in eine Projektdatei:

```powershell
firebase functions:secrets:set MARIO_SERVICE_ACCOUNT_JSON --project kulturverein-ec831
```

6. Den Hintergrunddienst bereitstellen:

```powershell
firebase deploy --only functions --project kulturverein-ec831
```

## Verhalten

- Die Einstellung erscheint in der Startansicht erst, nachdem der VAPID-Schlüssel eingetragen wurde.
- Auf iPhones muss die App zum Homescreen hinzugefügt sein. Der Nutzer aktiviert Erinnerungen selbst über den Button.
- Der Dienst prüft um 9 Uhr Berliner Zeit beide Event-Bereiche.
- Bei offenen Aufgaben geht pro aktiviertem Gerät frühestens nach vier Tagen wieder eine Erinnerung raus.
- Die Nachricht nennt nur die Anzahl offener Aufgaben. Ein Tipp darauf oeffnet das Dashboard.
- Nicht mehr gültige Geräte-Zugänge entfernt der Dienst automatisch.

## Zusätzliche Ablauf-Erinnerung

- Der Dienst prüft täglich um 9 Uhr Berliner Zeit, damit der Folgetag eines Events zuverlässig erkannt wird.
- Einen Tag nach einem beendeten Event erhalten aktivierte Geräte einmalig eine priorisierte Erinnerung zu den offenen Nacharbeiten.
- Diese Ablauf-Erinnerung setzt den allgemeinen Vier-Tage-Abstand zurück. Dadurch folgt nicht am selben oder direkt am nächsten Tag eine zweite allgemeine Erinnerung.

## Test

1. Dashboard nach dem Deployment auf dem Homescreen oeffnen.
2. **Erinnerungen aktivieren** waehlen und die Systemfreigabe bestaetigen.
3. Zum Testen in Firebase Cloud Messaging eine Testnachricht an den registrierten Zugang senden oder den geplanten Dienst in Firebase Functions manuell ausführen.
4. Anschliessend in der App **Erinnerungen deaktivieren** pruefen.
