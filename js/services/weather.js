window.App = window.App || {};

App.weather = (function () {
  const API_URL = "https://api.open-meteo.com/v1/forecast";

  const WEATHER_CODES = {
    0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"], 48: ["Rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Dense drizzle", "🌧️"],
    56: ["Freezing drizzle", "🌧️"], 57: ["Dense freezing drizzle", "🌧️"],
    61: ["Light rain", "🌦️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
    66: ["Freezing rain", "🌧️"], 67: ["Heavy freezing rain", "🌧️"],
    71: ["Light snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "❄️"], 77: ["Snow grains", "🌨️"],
    80: ["Rain showers", "🌦️"], 81: ["Heavy showers", "🌧️"], 82: ["Violent showers", "⛈️"],
    85: ["Snow showers", "🌨️"], 86: ["Heavy snow showers", "❄️"],
    95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm with hail", "⛈️"], 99: ["Severe thunderstorm", "⛈️"],
  };

  const state = { data: null, error: null, loading: false, lastUpdated: null };
  const listeners = new Set();

  function emit() { listeners.forEach((fn) => fn(state)); }

  function describeCode(code) {
    const [description, icon] = WEATHER_CODES[code] || ["Unknown", "❔"];
    return { description, icon };
  }

  function compassDirection(degrees) {
    const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return dirs[Math.round(degrees / 22.5) % 16];
  }

  function kiteStatus(windSpeed) {
    const { minWindSpeed, maxWindSpeed } = App.config.kitesurf;
    if (windSpeed <= minWindSpeed) return "too-light";
    if (maxWindSpeed !== null && windSpeed > maxWindSpeed) return "too-strong";
    return "go";
  }

  async function fetchCurrent(latitude, longitude) {
    const params = new URLSearchParams({
      latitude,
      longitude,
      current: [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "weather_code",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
      ].join(","),
      wind_speed_unit: "ms",
      temperature_unit: App.config.units.temperature,
      timezone: "auto",
    });

    const res = await fetch(`${API_URL}?${params}`);
    if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
    const json = await res.json();
    const c = json.current;

    return {
      temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      windSpeed: c.wind_speed_10m,
      windGusts: c.wind_gusts_10m,
      windDirection: c.wind_direction_10m,
      tempUnit: json.current_units.temperature_2m,
      ...describeCode(c.weather_code),
    };
  }

  async function refresh() {
    const { latitude, longitude } = App.location.get();
    state.loading = true;
    emit();
    try {
      state.data = await fetchCurrent(latitude, longitude);
      state.error = null;
      state.lastUpdated = new Date();
    } catch (err) {
      console.error(err);
      state.error = err.message || "Could not load weather.";
    } finally {
      state.loading = false;
      emit();
    }
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return {
    refresh,
    onChange,
    getState: () => state,
    kiteStatus,
    compassDirection,
  };
})();
