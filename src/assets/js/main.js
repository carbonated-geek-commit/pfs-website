(function () {
  "use strict";

  /* ---- Mobile menu ------------------------------------------------------ */
  var burger = document.querySelector(".burger");
  var menu = document.getElementById("mobile-menu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = burger.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
    });
  }

  /* ---- Library accordion (mobile only; headers are inert on desktop) ---- */
  var collections = Array.prototype.slice.call(document.querySelectorAll(".collection"));
  collections.forEach(function (col) {
    var header = col.querySelector(".collection__header");
    if (!header) return;
    header.addEventListener("click", function () {
      var wasOpen = col.classList.contains("is-open");
      collections.forEach(function (other) {
        other.classList.remove("is-open");
        var h = other.querySelector(".collection__header");
        if (h) h.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        col.classList.add("is-open");
        header.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---- Welcome popover --------------------------------------------------- */
  var WELCOME_KEY = "pfs-welcome-dismissed";
  var welcome = document.getElementById("welcome-popover");

  function welcomeDismissed() {
    try { return localStorage.getItem(WELCOME_KEY) === "1"; } catch (e) { return true; }
  }
  function dismissWelcome() {
    try { localStorage.setItem(WELCOME_KEY, "1"); } catch (e) {}
    if (welcome) welcome.hidden = true;
  }

  if (welcome && !welcomeDismissed()) {
    setTimeout(function () {
      if (!welcomeDismissed()) welcome.hidden = false;
    }, 900);

    welcome.addEventListener("click", function (e) {
      if (e.target.closest("[data-welcome-dismiss]")) dismissWelcome();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !welcome.hidden) dismissWelcome();
    });

    var form = welcome.querySelector(".welcome__form");
    var input = welcome.querySelector(".welcome__input");
    var success = welcome.querySelector(".welcome__success");
    if (form && input && success) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!/.+@.+\..+/.test(input.value)) {
          input.focus();
          return;
        }
        // TODO: post to the club's newsletter backend (Mailchimp/Buttondown)
        // before relying on this form — right now it only confirms locally.
        track("newsletter_signup", {});
        form.hidden = true;
        success.hidden = false;
        setTimeout(dismissWelcome, 1400);
      });
    }
  }

  /* ---- Analytics: delegated data-analytics click handler ------------------ */
  function track(name, params) {
    if (typeof window.gtag !== "function") return;
    params.page = location.pathname;
    window.gtag("event", name, params);
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-analytics]");
    if (!el) return;
    var name = el.dataset.analytics;
    if (name === "newsletter_signup") return; // fired on successful submit instead
    var params = {};
    Object.keys(el.dataset).forEach(function (key) {
      if (key === "analytics" || key === "welcomeDismiss") return;
      var snake = key.replace(/[A-Z]/g, function (c) { return "_" + c.toLowerCase(); });
      params[snake] = el.dataset[key];
    });
    if (el.href && /^https?:/.test(el.href) && el.host !== location.host) {
      params.link_url = el.href;
    }
    track(name, params);
  });
})();
