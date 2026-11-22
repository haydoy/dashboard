window.App = window.App || {};

App.storage = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn(`Could not read "${key}" from storage`, err);
      return fallback;
    }
  },

  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Could not save "${key}" to storage`, err);
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },
};
