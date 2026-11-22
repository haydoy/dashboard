window.App = window.App || {};
App.pages = App.pages || {};

App.pages.home = (function () {
  const { escapeHtml, formatTime } = App.utils;
  let root = null;
  let unsubscribers = [];

  function render(el) {
    root = el;
    el.innerHTML = `
      <section class="page-header">
        <h2>${greeting()}</h2>
        <p class="muted">${new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
      </section>

      <article class="card kite-card" id="kite-card"></article>

      <div class="grid">
        <article class="card" id="todos-card"></article>
        <article class="card" id="weather-card"></article>
      </div>`;

    renderTodos();
    renderWeather();

    unsubscribers = [
      App.todos.onChange(renderTodos),
      App.weather.onChange(renderWeather),
    ];
    el.addEventListener("click", handleClick);
  }

  function destroy() {
    unsubscribers.forEach((unsub) => unsub());
    unsubscribers = [];
    root = null;
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning ☀️";
    if (h < 18) return "Good afternoon 👋";
    return "Good evening 🌙";
  }

  function renderTodos() {
    if (!root) return;
    const count = App.config.homeTopTodoCount;
    const top = App.todos.getTop(count);
    const remaining = App.todos.getSorted("active").length;

    root.querySelector("#todos-card").innerHTML = `
      <div class="card-header">
        <h3>Top ${count} priorities</h3>
        <a href="#/todos" class="link">View all (${remaining}) →</a>
      </div>
      ${top.length
        ? `<ul class="todo-list home-todos">${top.map((t) => App.components.todoItem(t, { variant: "compact" })).join("")}</ul>`
        : `<p class="empty">Nothing to do 🎉<br /><a href="#/todos" class="link">Add a task</a></p>`}`;
  }

  function renderWeather() {
    if (!root) return;
    const state = App.weather.getState();
    renderWeatherCard(root.querySelector("#weather-card"), state);
    renderKiteCard(root.querySelector("#kite-card"), state);
  }

  function renderWeatherCard(el, { data, error, loading, lastUpdated }) {
    const location = App.location.get();

    const header = `
      <div class="card-header">
        <h3>Weather</h3>
        <button class="icon-btn" data-action="refresh-weather" title="Refresh" ${loading ? "disabled" : ""}>🔄</button>
      </div>
      <p class="muted small">📍 ${escapeHtml(location.name)}</p>`;

    const footer = `
      <div class="card-footer">
        <span class="muted small">${loading ? "Updating…" : lastUpdated ? "Updated " + formatTime(lastUpdated) : ""}</span>
        <span class="btn-group">
          ${App.location.isCustom() ? `<button class="btn btn-ghost btn-small" data-action="reset-location">Reset</button>` : ""}
          <button class="btn btn-ghost btn-small" data-action="use-location">📍 Use my location</button>
        </span>
      </div>`;

    if (!data) {
      el.innerHTML = header +
        (error ? `<p class="error">⚠️ ${escapeHtml(error)}</p>` : `<p class="muted">Loading weather…</p>`) +
        footer;
      return;
    }

    const dir = App.weather.compassDirection(data.windDirection);
    el.innerHTML = `
      ${header}
      <div class="weather-main">
        <span class="weather-icon">${data.icon}</span>
        <div>
          <div class="temp">${Math.round(data.temperature)}${data.tempUnit}</div>
          <div>${data.description}</div>
        </div>
      </div>
      <dl class="stats">
        <div><dt>Feels like</dt><dd>${Math.round(data.feelsLike)}${data.tempUnit}</dd></div>
        <div><dt>Humidity</dt><dd>${data.humidity}%</dd></div>
        <div><dt>Wind</dt><dd>${data.windSpeed.toFixed(1)} m/s ${dir}</dd></div>
        <div><dt>Gusts</dt><dd>${data.windGusts.toFixed(1)} m/s</dd></div>
      </dl>
      ${error ? `<p class="error small">⚠️ Last update failed: ${escapeHtml(error)}</p>` : ""}
      ${footer}`;
  }

  function renderKiteCard(el, { data, error }) {
    if (!data) {
      el.className = "card kite-card";
      el.innerHTML = `
        <div class="kite-icon">🪁</div>
        <div class="kite-text">
          <h3>Kitesurf check</h3>
          <p class="muted">${error ? "Wind data unavailable." : "Checking the wind…"}</p>
        </div>`;
    } else {
      const { minWindSpeed, maxWindSpeed } = App.config.kitesurf;
      const wind = `${data.windSpeed.toFixed(1)} m/s ${App.weather.compassDirection(data.windDirection)}`;
      const gusts = `${data.windGusts.toFixed(1)} m/s`;

      const variants = {
        "go": {
          cls: "kite-go",
          title: "Kite time! 🌊",
          text: `Wind is <strong>${wind}</strong> (gusts ${gusts}), above your ${minWindSpeed} m/s minimum.`,
        },
        "too-light": {
          cls: "",
          title: "Not kiteable right now",
          text: `Wind is <strong>${wind}</strong>. It needs to be over ${minWindSpeed} m/s.`,
        },
        "too-strong": {
          cls: "kite-warn",
          title: "Too windy to kite safely ⚠️",
          text: `Wind is <strong>${wind}</strong> (gusts ${gusts}), above your ${maxWindSpeed} m/s maximum.`,
        },
      };
      const v = variants[App.weather.kiteStatus(data.windSpeed)];

      el.className = `card kite-card ${v.cls}`;
      el.innerHTML = `
        <div class="kite-icon">🪁</div>
        <div class="kite-text">
          <h3>${v.title}</h3>
          <p>${v.text}</p>
        </div>
        ${alertControl()}`;
    }
  }

  function alertControl() {
    const n = App.notifications;
    if (!n.isSupported()) return "";
    if (n.permission() === "granted") return `<span class="muted small">🔔 Alerts on</span>`;
    if (n.permission() === "default") {
      return `<button class="btn btn-ghost btn-small" data-action="enable-alerts">🔔 Enable alerts</button>`;
    }
    return "";
  }

  async function handleClick(e) {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const id = actionEl.closest("[data-id]")?.dataset.id;

    switch (actionEl.dataset.action) {
      case "toggle":
        App.todos.toggle(id);
        break;
      case "refresh-weather":
        App.weather.refresh();
        break;
      case "use-location":
        actionEl.disabled = true;
        actionEl.textContent = "Locating…";
        try {
          await App.location.useDeviceLocation();
          App.weather.refresh();
        } catch (err) {
          alert("Could not get your location: " + err.message);
          renderWeather();
        }
        break;
      case "reset-location":
        App.location.reset();
        App.weather.refresh();
        break;
      case "enable-alerts":
        await App.notifications.requestPermission();
        renderWeather();
        break;
    }
  }

  return { render, destroy };
})();
