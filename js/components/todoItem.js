window.App = window.App || {};
App.components = App.components || {};

App.components.todoItem = function (todo, { variant = "compact" } = {}) {
  const { escapeHtml, formatDeadline, formatStart, deadlineStatus } = App.utils;
  const { importanceLevels, statuses } = App.config;

  const full = variant === "full";
  const done = App.todos.isDone(todo);
  const level = importanceLevels[todo.importance] || { label: todo.importance, color: "#888" };
  const status = statuses[todo.status] || { label: todo.status, icon: "", color: "#888" };

  const deadlineText = done && todo.completedAt
    ? "Finished " + new Date(todo.completedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : formatDeadline(todo.deadline);
  const deadlineClass = done ? "none" : deadlineStatus(todo.deadline);

  const checkbox = full ? "" : `
    <input type="checkbox" class="todo-check" data-action="toggle"
           ${done ? "checked" : ""} aria-label="Mark as done" />`;

  const statusSwitch = !full ? "" : `
    <div class="status-switch" role="group" aria-label="Status">
      ${Object.entries(statuses).map(([key, s]) => `
        <button type="button" class="status-btn ${key === todo.status ? "active" : ""}"
                style="--status-color:${s.color}" data-action="set-status" data-status="${key}"
                aria-pressed="${key === todo.status}">${s.icon} ${escapeHtml(s.label)}</button>`).join("")}
    </div>`;

  const actions = !full ? "" : `
    <div class="todo-actions">
      <button class="icon-btn" data-action="edit" title="Edit">✏️</button>
      <button class="icon-btn" data-action="delete" title="Delete">🗑️</button>
    </div>`;

  return `
    <li class="todo-item todo-${variant} ${done ? "completed" : ""}"
        data-id="${todo.id}" style="--status-color:${status.color}">
      ${checkbox}
      <div class="todo-body">
        <span class="todo-title">${escapeHtml(todo.title)}</span>
        ${todo.description ? `
          <p class="todo-desc" ${full ? `data-action="expand" title="Click to expand/collapse"` : ""}>${escapeHtml(todo.description)}</p>` : ""}
        <div class="todo-meta">
          <span class="badge" style="--badge-color:${level.color}">${escapeHtml(level.label)}</span>
          ${full ? "" : `<span class="status-pill">${status.icon} ${escapeHtml(status.label)}</span>`}
          ${todo.startDate ? `<span class="start-date">🗓️ ${formatStart(todo.startDate)}</span>` : ""}
          <span class="deadline deadline-${deadlineClass}">⏰ ${deadlineText}</span>
        </div>
        ${statusSwitch}
      </div>
      ${actions}
    </li>`;
};
