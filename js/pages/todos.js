window.App = window.App || {};
App.pages = App.pages || {};

App.pages.todos = (function () {
  const { escapeHtml } = App.utils;
  const { statuses, importanceLevels, defaultImportance, defaultStatus, descriptionMaxLength } = App.config;

  const FILTERS = {
    active: { label: "Active", empty: "No active tasks. Enjoy your day! 🎉" },
    ...Object.fromEntries(Object.entries(statuses).map(([key, s]) => [
      key, { label: `${s.icon} ${s.label}`, empty: `No tasks marked "${s.label}".` },
    ])),
    all: { label: "All", empty: "No tasks yet. Add one above!" },
  };

  let root = null;
  let unsubscribe = null;
  let filter = "active";
  let editingId = null;
  const expanded = new Set();

  const $ = (selector) => root.querySelector(selector);

  function render(el) {
    root = el;
    editingId = null;

    el.innerHTML = `
      <section class="page-header">
        <h2>To-Do List</h2>
        <p class="muted">Sorted by importance, then deadline.</p>
      </section>

      <form class="card todo-form" id="todo-form" autocomplete="off" novalidate>
        <h3 id="form-title">➕ New task</h3>

        <label class="field field-full">
          <span>Title</span>
          <input id="todo-title" type="text" placeholder="What needs doing?" maxlength="200" />
        </label>

        <label class="field field-full">
          <span>Description <em class="optional">(optional)</em></span>
          <textarea id="todo-description" rows="3" maxlength="${descriptionMaxLength}"
                    placeholder="Details, steps, links, notes…"></textarea>
          <small class="char-count" id="desc-count">0 / ${descriptionMaxLength}</small>
        </label>

        <label class="field">
          <span>Importance</span>
          <select id="todo-importance">${importanceOptions()}</select>
        </label>

        <label class="field">
          <span>Status</span>
          <select id="todo-status">${statusOptions()}</select>
        </label>

        <label class="field">
          <span>Start date</span>
          <input id="todo-start" type="date" />
        </label>

        <label class="field">
          <span>Deadline</span>
          <input id="todo-deadline" type="date" />
        </label>

        <p class="error small field-full hidden" id="form-error"></p>

        <div class="form-actions field-full">
          <button type="button" class="btn btn-ghost hidden" id="todo-cancel" data-action="cancel-edit">Cancel</button>
          <button type="submit" class="btn btn-primary" id="todo-submit">Add task</button>
        </div>
      </form>

      <div class="toolbar">
        <div class="filters">
          ${Object.keys(FILTERS).map((f) => `<button class="chip" data-action="filter" data-filter="${f}"></button>`).join("")}
        </div>
        <button class="btn btn-ghost btn-small" id="clear-done" data-action="clear-done">🧹 Clear done</button>
      </div>

      <ul class="todo-list" id="todo-list"></ul>`;

    $("#todo-form").addEventListener("submit", handleSubmit);
    $("#todo-description").addEventListener("input", updateCharCount);
    $("#todo-start").addEventListener("change", syncDeadlineMin);
    el.addEventListener("click", handleClick);

    renderList();
    unsubscribe = App.todos.onChange(renderList);
  }

  function destroy() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    root = null;
  }

  function importanceOptions() {
    return Object.entries(importanceLevels)
      .sort((a, b) => b[1].rank - a[1].rank)
      .map(([key, level]) =>
        `<option value="${key}" ${key === defaultImportance ? "selected" : ""}>${escapeHtml(level.label)}</option>`)
      .join("");
  }

  function statusOptions() {
    return Object.entries(statuses)
      .map(([key, s]) =>
        `<option value="${key}" ${key === defaultStatus ? "selected" : ""}>${s.icon} ${escapeHtml(s.label)}</option>`)
      .join("");
  }

  function renderList() {
    if (!root) return;
    root.querySelectorAll("[data-filter]").forEach((btn) => {
      const f = btn.dataset.filter;
      btn.textContent = `${FILTERS[f].label} (${App.todos.getSorted(f).length})`;
      btn.classList.toggle("active", f === filter);
    });

    const doneCount = App.todos.getSorted("all").filter(App.todos.isDone).length;
    const clearBtn = $("#clear-done");
    clearBtn.textContent = `🧹 Clear done (${doneCount})`;
    clearBtn.disabled = doneCount === 0;

    const list = App.todos.getSorted(filter);
    $("#todo-list").innerHTML = list.length
      ? list.map((t) => App.components.todoItem(t, { variant: "full" })).join("")
      : `<li class="empty">${FILTERS[filter].empty}</li>`;

    expanded.forEach((id) => {
      root.querySelector(`[data-id="${id}"] .todo-desc`)?.classList.add("expanded");
    });
  }

  function readForm() {
    return {
      title: $("#todo-title").value.trim(),
      description: $("#todo-description").value.trim(),
      importance: $("#todo-importance").value,
      status: $("#todo-status").value,
      startDate: $("#todo-start").value || null,
      deadline: $("#todo-deadline").value || null,
    };
  }

  function handleSubmit(e) {
    e.preventDefault();
    const data = readForm();
    const error = App.todos.validate(data);
    showError(error);
    if (error) return;

    if (editingId) {
      App.todos.update(editingId, data);
    } else {
      const todo = App.todos.add(data);
      ensureVisible(todo);
    }
    resetForm();
  }

  function ensureVisible(todo) {
    const visible = App.todos.getSorted(filter).some((t) => t.id === todo.id);
    if (!visible) {
      filter = "all";
      renderList();
    }
  }

  function showError(message) {
    const el = $("#form-error");
    el.textContent = message ? "⚠️ " + message : "";
    el.classList.toggle("hidden", !message);
  }

  function updateCharCount() {
    $("#desc-count").textContent = `${$("#todo-description").value.length} / ${descriptionMaxLength}`;
  }

  function syncDeadlineMin() {
    $("#todo-deadline").min = $("#todo-start").value || "";
  }

  function startEdit(id) {
    const todo = App.todos.getById(id);
    if (!todo) return;
    editingId = id;

    $("#todo-title").value = todo.title;
    $("#todo-description").value = todo.description;
    $("#todo-importance").value = todo.importance;
    $("#todo-status").value = todo.status;
    $("#todo-start").value = todo.startDate || "";
    $("#todo-deadline").value = todo.deadline || "";
    syncDeadlineMin();
    updateCharCount();
    showError(null);

    $("#form-title").textContent = "✏️ Edit task";
    $("#todo-submit").textContent = "Save changes";
    $("#todo-cancel").classList.remove("hidden");
    $("#todo-form").classList.add("editing");
    $("#todo-title").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    editingId = null;
    $("#todo-form").reset();
    $("#todo-importance").value = defaultImportance;
    $("#todo-status").value = defaultStatus;
    syncDeadlineMin();
    updateCharCount();
    showError(null);

    $("#form-title").textContent = "➕ New task";
    $("#todo-submit").textContent = "Add task";
    $("#todo-cancel").classList.add("hidden");
    $("#todo-form").classList.remove("editing");
  }

  function handleClick(e) {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const id = actionEl.closest("[data-id]")?.dataset.id;

    switch (actionEl.dataset.action) {
      case "set-status":
        App.todos.setStatus(id, actionEl.dataset.status);
        break;
      case "toggle":
        App.todos.toggle(id);
        break;
      case "expand":
        actionEl.classList.toggle("expanded");
        expanded.has(id) ? expanded.delete(id) : expanded.add(id);
        break;
      case "edit":
        startEdit(id);
        break;
      case "delete": {
        const todo = App.todos.getById(id);
        if (todo && confirm(`Delete "${todo.title}"?`)) {
          if (editingId === id) resetForm();
          expanded.delete(id);
          App.todos.remove(id);
        }
        break;
      }
      case "cancel-edit":
        resetForm();
        break;
      case "filter":
        filter = actionEl.dataset.filter;
        renderList();
        break;
      case "clear-done":
        if (confirm("Permanently remove all finished tasks?")) {
          if (editingId && App.todos.isDone(App.todos.getById(editingId) || {})) resetForm();
          App.todos.clearDone();
        }
        break;
    }
  }

  return { render, destroy };
})();
