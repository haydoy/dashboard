window.App = window.App || {};

App.location = (function () {
  const KEY = App.config.storageKeys.location;

  function get() {
    return App.storage.load(KEY, null) || App.config.defaultLocation;
  }

  function isCustom() {
    return App.storage.load(KEY, null) !== null;
  }

  function set(location) {
    App.storage.save(KEY, location);
  }

  function reset() {
    App.storage.remove(KEY);
  }

  function useDeviceLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation is not supported by this browser."));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location = {
            name: "My location",
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
          };
          set(location);
          resolve(location);
        },
        (err) => reject(new Error(err.message)),
        { timeout: 10000 }
      );
    });
  }

  return { get, isCustom, set, reset, useDeviceLocation };
})();

