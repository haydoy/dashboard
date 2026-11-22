window.App = window.App || {};

App.config = {
  appName: "My Dashboard",

  defaultLocation: {
    name: "Tarifa, Spain",
    latitude: 36.0139,
    longitude: -5.6044,
  },

  units: {
    temperature: "celsius",
  },

  kitesurf: {
    minWindSpeed: 5,
    maxWindSpeed: null,
  },

  weatherRefreshMinutes: 10,
  homeTopTodoCount: 3,

  importanceLevels: {
    high:   { label: "High",   rank: 3, color: "#dc2626" },
    medium: { label: "Medium", rank: 2, color: "#d97706" },
    low:    { label: "Low",    rank: 1, color: "#16a34a" },
  },
  defaultImportance: "medium",

  statuses: {
    waiting:    { label: "Waiting",     icon: "⏸️", color: "#64748b", rank: 1, done: false },
    inProgress: { label: "In progress", icon: "🔄", color: "#2563eb", rank: 2, done: false },
    done:       { label: "Done",        icon: "✅", color: "#16a34a", rank: 0, done: true },
  },
  defaultStatus: "waiting",
  doneStatus: "done",

  descriptionMaxLength: 1000,
  dueSoonDays: 2,
  autoClearDoneAfterDays: null,

  storageKeys: {
    todos: "dashboard.todos.v1",
    location: "dashboard.location.v1",
  },
};
