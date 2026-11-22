window.App = window.App || {};

App.router = (function () {
  const routes = {
    "#/home": App.pages.home,
    "#/todos": App.pages.todos,
  };
  const DEFAULT_ROUTE = "#/home";
  let currentPage = null;

  function navigate() {
    const hash = routes[window.location.hash] ? window.location.hash : DEFAULT_ROUTE;
    if (window.location.hash !== hash) history.replaceState(null, "", hash);

    if (currentPage && currentPage.destroy) currentPage.destroy();

    const outlet = document.getElementById("app");
    outlet.innerHTML = "";
    const pageEl = document.createElement("div");
    pageEl.className = "page";
    outlet.appendChild(pageEl);

    currentPage = routes[hash];
    currentPage.render(pageEl);

    document.querySelectorAll("[data-route]").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === hash);
    });
  }

  function start() {
    window.addEventListener("hashchange", navigate);
    navigate();
  }

  return { start };
})();
