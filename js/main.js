(() => {
  "use strict";

  /* Mobile navigation ---------------------------------------------------- */
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.getElementById("site-nav");
  const backdrop = document.querySelector("[data-nav-backdrop]");
  const closeButton = document.querySelector("[data-nav-close]");

  if (toggle && nav && backdrop) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      backdrop.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
      if (open) {
        nav.querySelector("a, button")?.focus();
      }
    };

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    backdrop.addEventListener("click", () => {
      setOpen(false);
      toggle.focus();
    });
    closeButton?.addEventListener("click", () => {
      setOpen(false);
      toggle.focus();
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    nav.addEventListener("keydown", (event) => {
      if (event.key !== "Tab" || !nav.classList.contains("is-open")) return;
      const items = [...nav.querySelectorAll("a[href], button:not([disabled])")].filter(
        (element) => element.offsetParent !== null,
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 820 && nav.classList.contains("is-open")) setOpen(false);
    });
  }

  /* Hero crossfade ------------------------------------------------------- */
  const heroSlides = Array.from(document.querySelectorAll(".hero__bg .hero__slide"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (heroSlides.length > 1 && !reduceMotion.matches) {
    let active = heroSlides.findIndex((slide) => slide.classList.contains("is-active"));
    if (active < 0) active = 0;
    let timer = null;

    const showNext = () => {
      heroSlides[active].classList.remove("is-active");
      active = (active + 1) % heroSlides.length;
      heroSlides[active].classList.add("is-active");
    };

    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const start = () => {
      stop();
      timer = window.setInterval(showNext, 6000);
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    start();
  }

  /* Google Maps consent -------------------------------------------------- */
  document.querySelectorAll("[data-map]").forEach((map) => {
    const button = map.querySelector("[data-map-load]");
    if (!button || !map.dataset.mapSrc) return;

    button.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = map.dataset.mapSrc;
      iframe.title = "Google Maps – Bao Sushi Bistro, Frankfurter Straße 33, Dreieich";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.allowFullscreen = true;
      iframe.tabIndex = 0;
      iframe.addEventListener("load", () => iframe.focus());
      map.querySelector(".map__consent")?.remove();
      map.appendChild(iframe);
    });
  });

  /* Current year in footer ----------------------------------------------- */
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
