# 🪁 My Dashboard

A lightweight personal dashboard: to‑do list + live weather + kitesurf alerts.  
Built with plain HTML/CSS/JavaScript – no build step, no dependencies, no API keys.

## Features

- **Home page**
  - Shows your **top priority to‑dos** (sorted by importance and deadline)
  - Current **weather** from [Open‑Meteo](https://open-meteo.com) (no API key)
  - **Kitesurf alert** when wind speed is over your configured threshold (default 5 m/s)

- **To‑Do page**
  - Each task has:
    - Title
    - Paragraph‑length description
    - Importance (Low / Medium / High)
    - Status: **Waiting**, **In progress**, or **Done**
    - Optional **start date** and **deadline**
  - Filter by Active, each status, or All
  - Edit / delete tasks
  - **Clear done** to remove all finished tasks
  - Tasks are stored locally in your browser (localStorage)

  TEKOÄLYN KÄYTTÖ
  Käytin projectissa GPT 5.1 mallia ongelmanratkonnassa, sekä claude opus 5.5 koodin tekemisessä.

## Project structure

```text
dashboard/
├── index.html             # App shell & script loading order
├── README.md
├── .gitignore
├── css/
│   └── styles.css         # All styling (change theme in :root variables)
└── js/
    ├── config.js          # ⚙️ Global configuration (location, thresholds, statuses, etc.)
    ├── utils.js           # Small helpers (dates, formatting, HTML escaping)
    ├── storage.js         # Thin wrapper around localStorage
    ├── router.js          # Hash‑based navigation between pages
    ├── app.js             # App entry point
    ├── services/
    │   ├── todos.js       # To‑do model: CRUD + sorting + validation
    │   ├── location.js    # Default/device location handling
    │   ├── weather.js     # Open‑Meteo integration + kitesurf logic
    │   └── notifications.js # Browser notification wrapper
    ├── components/
    │   └── todoItem.js    # Shared to‑do list item renderer
    └── pages/
        ├── home.js        # Home page: top to‑dos, weather, kitesurf card
        └── todos.js       # To‑Do page: form, list, filters


