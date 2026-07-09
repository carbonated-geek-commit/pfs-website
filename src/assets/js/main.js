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

  /* ---- Mailchimp (classic JSONP endpoint; GitHub Pages has no backend) --- */
  function mcSubscribe(fields, onResult) {
    var cb = "mc_cb_" + Date.now();
    var script = document.createElement("script");
    window[cb] = function (data) { delete window[cb]; script.remove(); onResult(data); };
    script.onerror = function () { delete window[cb]; script.remove(); onResult({ result: "error", msg: "Network error — please try again." }); };
    var params = new URLSearchParams({
      u: "25ebde4055cd3c9d70aca9f9b",
      id: "fe171e755e",
      EMAIL: fields.email,
      FNAME: fields.fname,
      LNAME: fields.lname,
      tags: "10535816",
      b_25ebde4055cd3c9d70aca9f9b_fe171e755e: "",
      c: cb
    });
    script.src = "https://club.us12.list-manage.com/subscribe/post-json?" + params.toString();
    document.body.appendChild(script);
  }

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
    var fnameInput = welcome.querySelector("#pop-fname");
    var lnameInput = welcome.querySelector("#pop-lname");
    var emailInput = welcome.querySelector('.welcome__input[type="email"]');
    var success = welcome.querySelector(".welcome__success");
    var errorEl = welcome.querySelector(".welcome__error");
    var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

    function showWelcomeError(msg) {
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.hidden = !msg;
    }

    if (form && fnameInput && lnameInput && emailInput && success) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var fname = fnameInput.value.trim();
        var lname = lnameInput.value.trim();
        var email = emailInput.value.trim();
        if (!fname || !lname) { showWelcomeError("Please add your first and last name."); return; }
        if (!/.+@.+\..+/.test(email)) { showWelcomeError("Please enter a valid email address."); return; }
        showWelcomeError("");
        if (submitBtn) submitBtn.disabled = true;
        mcSubscribe({ email: email, fname: fname, lname: lname }, function (data) {
          if (submitBtn) submitBtn.disabled = false;
          // Mailchimp double opt-in: success means a confirmation email was sent
          if (data.result === "success" || /already subscribed/i.test(data.msg || "")) {
            track("newsletter_signup", {});
            form.hidden = true;
            success.hidden = false;
            try { localStorage.setItem(WELCOME_KEY, "1"); } catch (err) {}
            setTimeout(dismissWelcome, 1400);
          } else {
            showWelcomeError(String(data.msg || "").replace(/<[^>]*>/g, "") || "Something went wrong — please try again.");
          }
        });
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
