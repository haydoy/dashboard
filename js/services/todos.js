window.App = window.App || {};

App.todos = (function () {
  const KEY = App.config.storageKeys.todos;
  const listeners = new Set();
  let todos = load();
  autoClearOldDone();

  function load() {
    return App.storage.load(KEY, []).map(normalize);
  }

  function normalize(t) {
    const { completed, ...rest } = t;
    const status = App.config.statuses[t.status]
      ? t.status
      : completed ? App.config.doneStatus : App.config.defaultStatus;

    return {
      ...rest,
      title: t.title || "",
      description: t.description || "",
      importance: t.importance || App.config.defaultImportance,
      status,
      startDate: t.startDate || null,
      deadline: t.deadline || null,
      createdAt: t.createdAt || Date.now(),
      updatedAt: t.updatedAt || t.createdAt || Date.now(),
      completedAt: t.completedAt || null,
    };
  }

  function autoClearOldDone() {
    const days = App.config.autoClearDoneAfterDays;
    if (!days) return;
    const cutoff = Date.now() - days * 86400000;
    const before = todos.length;
    todos = todos.filter((t) => !(isDone(t) && t.completedAt && t.completedAt < cutoff));
    if (todos.length !== before) App.storage.save(KEY, todos);
  }

  function notify() {
    listeners.forEach((fn) => fn());
  }

  function persist() {
    App.storage.save(KEY, todos);
    notify();
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function isDone(todo) {
    return !!App.config.statuses[todo.status]?.done;
  }

  function importanceRank(importance) {
    return App.config.importanceLevels[importance]?.rank || 0;
  }

  function statusRank(status) {
    return App.config.statuses[status]?.rank || 0;
  }

  function deadlineValue(deadline) {
    const date = App.utils.parseLocalDate(deadline);
    return date ? date.getTime() : Infinity;
  }

  function compare(a, b) {
    const aDone = isDone(a);
    const bDone = isDone(b);
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (aDone && bDone) return (b.completedAt || 0) - (a.completedAt || 0);

    const byImportance = importanceRank(b.importance) - importanceRank(a.importance);
    if (byImportance !== 0) return byImportance;

    const da = deadlineValue(a.deadline);
    const db = deadlineValue(b.deadline);
    if (da !== db) return da < db ? -1 : 1;

    const byStatus = statusRank(b.status) - statusRank(a.status);
    if (byStatus !== 0) return byStatus;

    return a.createdAt - b.createdAt;
  }

  function getSorted(filter = "all") {
    let list = [...todos];
    if (filter === "active") list = list.filter((t) => !isDone(t));
    else if (filter !== "all") list = list.filter((t) => t.status === filter);
    return list.sort(compare);
  }

  function getTop(count) {
    return getSorted("active").slice(0, count);
  }

  function getById(id) {
    return todos.find((t) => t.id === id) || null;
  }

  function validate({ title, startDate, deadline }) {
    if (!title || !title.trim()) return "Please enter a title.";
    if (startDate && deadline && deadline < startDate) {
      return "The deadline can't be before the start date.";
    }
    return null;
  }

  function add({ title, description, importance, status, startDate, deadline }) {
    const now = Date.now();
    const todo = {
      id: newId(),
      title: title.trim(),
      description: (description || "").trim(),
      importance: importance || App.config.defaultImportance,
      status: status || App.config.defaultStatus,
      startDate: startDate || null,
      deadline: deadline || null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    if (isDone(todo)) todo.completedAt = now;
    todos.push(todo);
    persist();
    return todo;
  }

  function update(id, changes) {
    todos = todos.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t, ...changes, updatedAt: Date.now() };
      if (typeof next.title === "string") next.title = next.title.trim();
      if (typeof next.description === "string") next.description = next.description.trim();
      if (isDone(next) && !isDone(t)) next.completedAt = Date.now();
      if (!isDone(next)) next.completedAt = null;
      return next;
    });
    persist();
  }

  function setStatus(id, status) {
    if (!App.config.statuses[status]) return;
    update(id, { status });
  }

  function toggle(id) {
    const todo = getById(id);
    if (!todo) return;
    setStatus(id, isDone(todo) ? App.config.defaultStatus : App.config.doneStatus);
  }

  function remove(id) {
    todos = todos.filter((t) => t.id !== id);
    persist();
  }

  function clearDone() {
    const before = todos.length;
    todos = todos.filter((t) => !isDone(t));
    persist();
    return before - todos.length;
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      todos = load();
      notify();
    }
  });

  return {
    getSorted, getTop, getById, isDone, validate,
    add, update, setStatus, toggle, remove, clearDone,
    clearCompleted: clearDone,
    onChange,
  };
})();
