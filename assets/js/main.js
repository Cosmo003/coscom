(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointerFine = window.matchMedia("(pointer: fine)").matches;

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle, with a smooth fade/slide instead of an instant swap
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("main-nav");
  var navCloseTimer = null;

  function openNav() {
    clearTimeout(navCloseTimer);
    nav.classList.add("is-open");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        nav.classList.add("is-visible");
      });
    });
  }

  function closeNav() {
    nav.classList.remove("is-visible");
    clearTimeout(navCloseTimer);
    navCloseTimer = setTimeout(function () {
      nav.classList.remove("is-open");
    }, 220);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Menü öffnen" : "Menü schließen");
      if (isOpen) closeNav(); else openNav();
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Menü öffnen");
        closeNav();
      });
    });
  }

  // Scroll-reveal: classes are added here at runtime only, so without JS
  // (or if anything below fails) every element keeps its normal, visible
  // CSS state. A hard timeout guarantees nothing can stay hidden forever.
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    var revealTargets = document.querySelectorAll(
      ".card, .value-item, .price-row, .kontakt-form, .kontakt-info"
    );

    revealTargets.forEach(function (el, i) {
      el.classList.add("pre-reveal");
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );

    revealTargets.forEach(function (el) { observer.observe(el); });

    // Safety net: force-reveal anything still hidden after 2.5s (e.g. an
    // anchor-link jump that skipped over a section without scrolling
    // through it), so content can never be stuck invisible.
    setTimeout(function () {
      document.querySelectorAll(".pre-reveal:not(.revealed)").forEach(function (el) {
        el.classList.add("revealed");
      });
    }, 2500);
  }

  // Subtle cursor-follow parallax on the hero spotlight (desktop only)
  var hero = document.querySelector(".hero");
  var parallax = document.getElementById("spotlight-parallax");
  if (hero && parallax && pointerFine && !prefersReducedMotion) {
    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      var offsetX = (e.clientX - rect.left) / rect.width - 0.5;
      parallax.style.transform = "translateX(" + (offsetX * 24).toFixed(1) + "px)";
    });
    hero.addEventListener("mouseleave", function () {
      parallax.style.transform = "translateX(0)";
    });
  }

  // Gentle 3D tilt on cards, following the cursor (desktop only)
  if (pointerFine && !prefersReducedMotion) {
    document.querySelectorAll(".card, .value-item").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        var rx = (-py * 6).toFixed(2);
        var ry = (px * 6).toFixed(2);
        card.style.transform =
          "perspective(700px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-2px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }
})();
