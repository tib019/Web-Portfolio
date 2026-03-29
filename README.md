# Web-Portfolio

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

Persönliche Portfolio-Website mit Video-Hintergrund, Lebenslauf-Sektionen und einem eingebetteten Jump-and-Run-Spiel. Erstellt während der Umschulung zum Fachinformatiker für Anwendungsentwicklung.

---

## Inhalt

Die Website präsentiert:

- Ausbildung und beruflicher Werdegang
- Technische Fähigkeiten (Python, Java, Django, MariaDB, Cybersecurity, KI)
- Praktika und Berufserfahrung
- Verlinkungen zu GitHub, Instagram und WhatsApp
- Interaktives Jump-and-Run-Spiel (`game.html`)
- Kursübersicht der GFN-Ausbildung (`GfnKurse.html`)

---

## Tech Stack

| Kategorie | Technologie |
|-----------|-------------|
| Markup | HTML5 |
| Styling | CSS3 |
| Interaktivität | Vanilla JavaScript |
| Backend | Node.js (lokaler Entwicklungsserver) |
| Medien | MP4-Video-Hintergrund |

---

## Projektstruktur

```
Web-Portfolio/
  index.html          # Hauptseite mit Lebenslauf und Verlinkungen
  indexbl.html        # Alternative Startseite
  GfnKurse.html       # Kursübersicht
  game.html           # Jump-and-Run-Spiel
  style.css           # Globales Styling
  game.css            # Spielstile
  script.js           # Hauptinteraktivität
  game.js             # Spiellogik
  server.js           # Node.js Entwicklungsserver
  green-vid.mp4       # Video-Hintergrund (Startseite)
  it-vid.mp4          # Video-Hintergrund (alternativ)
  bitmoji.png         # Profilbild
  tests/              # Testdateien
```

---

## Installation & Verwendung

Die Website kann direkt als statische Seite im Browser geöffnet werden:

```bash
git clone https://github.com/tib019/Web-Portfolio.git
cd Web-Portfolio
```

`index.html` im Browser öffnen, oder den mitgelieferten Node.js-Server verwenden:

```bash
npm install
node server.js
```

---

## Tests

```bash
npm test
```

---

## Autor

**Tobias Buss**
- GitHub: [@tib019](https://github.com/tib019)
- Hamburg, Deutschland
