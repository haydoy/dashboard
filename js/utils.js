window.App = window.App || {};

App.utils = {
  escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  },

  parseLocalDate(isoDate) {
    if (!isoDate) return null;
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  },

  daysUntil(isoDate) {
    const date = App.utils.parseLocalDate(isoDate);
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((date - today) / 86400000);
  },

  formatShortDate(isoDate) {
    const date = App.utils.parseLocalDate(isoDate);
    return date ? date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : "";
  },

  formatDeadline(isoDate) {
    const days = App.utils.daysUntil(isoDate);
    if (days === null) return "No deadline";
    if (days < 0) return `Overdue by ${-days} day${days === -1 ? "" : "s"}`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    if (days < 7) return `Due in ${days} days`;
    return "Due " + App.utils.formatShortDate(isoDate);
  },

  formatStart(isoDate) {
    const days = App.utils.daysUntil(isoDate);
    if (days === null) return "";
    if (days === 0) return "Starts today";
    if (days === 1) return "Starts tomorrow";
    if (days > 1 && days < 7) return `Starts in ${days} days`;
    if (days > 0) return "Starts " + App.utils.formatShortDate(isoDate);
    return "Started " + App.utils.formatShortDate(isoDate);
  },

  deadlineStatus(isoDate) {
    const days = App.utils.daysUntil(isoDate);
    if (days === null) return "none";
    if (days < 0) return "overdue";
    if (days <= App.config.dueSoonDays) return "soon";
    return "normal";
  },

  formatTime(date) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  },
};
