(function () {
  const { config } = App;

  document.title = config.appName;
  document.getElementById("app-title").textContent = config.appName;

  let lastKiteStatus = null;
  App.weather.onChange((state) => {
    if (state.loading || !state.data) return;
    const status = App.weather.kiteStatus(state.data.windSpeed);
    if (status === "go" && lastKiteStatus !== "go") {
      App.notifications.send(
        "🪁 Kite time!",
        `Wind is ${state.data.windSpeed.toFixed(1)} m/s at ${App.location.get().name}.`
      );
    }
    lastKiteStatus = status;
  });

  App.router.start();
  App.weather.refresh();
  setInterval(App.weather.refresh, config.weatherRefreshMinutes * 60 * 1000);
})();
