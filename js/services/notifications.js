window.App = window.App || {};

App.notifications = {
  isSupported() {
    return "Notification" in window;
  },

  permission() {
    return App.notifications.isSupported() ? Notification.permission : "denied";
  },

  async requestPermission() {
    if (!App.notifications.isSupported()) return "denied";
    return Notification.requestPermission();
  },

  send(title, body) {
    if (App.notifications.permission() !== "granted") return;
    try {
      new Notification(title, { body });
    } catch (err) {
      console.warn("Notification failed:", err);
    }
  },
};
