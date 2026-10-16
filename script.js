/* Concept 01: navigation enhancement. Cards are labelled design wireframes.
   All essential page content and native FAQ disclosures work without JS. */
(() => {
  "use strict";

  const header = document.querySelector("[data-site-header]");
  const toggle = header?.querySelector(".menu-toggle");
  const navigation = document.getElementById("primary-navigation");
  const tools = header?.querySelector(".tools-menu");
  const mobile = window.matchMedia("(max-width: 900px)");

  if (header && toggle && navigation) {
    function setMenu(open, returnFocus = false) {
      header.classList.toggle("is-menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      if (!open && tools) tools.open = false;
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", () => {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (header.classList.contains("is-menu-open")) {
        setMenu(false, true);
      } else if (tools?.open) {
        tools.open = false;
        tools.querySelector("summary")?.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) {
        const focusWillBeHidden = navigation.contains(document.activeElement);
        setMenu(false, mobile.matches && focusWillBeHidden);
      }
    });

    // Close the mobile menu after focus leaves the header, not between links.
    header.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        if (!header.contains(document.activeElement)) setMenu(false);
      });
    });

    function resetAtBreakpoint() {
      const focusWillBeHidden = mobile.matches && navigation.contains(document.activeElement);
      setMenu(false, focusWillBeHidden);
    }
    if (mobile.addEventListener) mobile.addEventListener("change", resetAtBreakpoint);
    else mobile.addListener(resetAtBreakpoint);

    // Only collapse navigation once all its event handlers are installed.
    toggle.hidden = false;
    header.classList.add("js-nav");
  }

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
})();

/* Optional desktop cursor and micro-interactions. Never required for navigation. */
(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktopPointer = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 901px)");
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  const label = document.querySelector(".cursor-label");
  let disposePointer = null;

  function configurePointer() {
    disposePointer?.();
    disposePointer = null;
    if (!dot || !ring || !label || reduceMotion.matches || !desktopPointer.matches) return;

    const controller = new AbortController();
    const { signal } = controller;
    const body = document.body;
    let x = 0, y = 0, followX = 0, followY = 0, frame = 0;
    let visible = false;

    function hide() {
      body.classList.remove("cursor-enabled", "cursor-over-target", "cursor-pressed");
      visible = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }

    function paint() {
      frame = 0;
      if (!visible) return;
      followX += (x - followX) * 0.2;
      followY += (y - followY) * 0.2;
      ring.style.transform = `translate3d(${followX}px, ${followY}px, 0)`;
      if (Math.abs(x - followX) + Math.abs(y - followY) > 0.15) {
        frame = requestAnimationFrame(paint);
      }
    }

    function setTarget(target) {
      const interactive = target.closest("a, button:not(:disabled), summary");
      const wireframe = target.closest("[data-cursor-label]");
      body.classList.toggle("cursor-over-target", Boolean(interactive || wireframe));
      const text = interactive ? (interactive.matches("summary") ? "Open" : "Explore") : (wireframe?.dataset.cursorLabel || "Explore");
      if (label.textContent !== text) label.textContent = text;
    }

    document.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") { hide(); return; }
      x = event.clientX;
      y = event.clientY;
      if (!visible) {
        followX = x;
        followY = y;
        visible = true;
        body.classList.add("cursor-enabled");
      }
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      setTarget(event.target);
      const labelX = Math.max(8, Math.min(x + 17, innerWidth - label.offsetWidth - 10));
      const labelY = Math.max(8, Math.min(y + 17, innerHeight - label.offsetHeight - 10));
      label.style.transform = `translate3d(${labelX}px, ${labelY}px, 0)`;
      if (!frame) frame = requestAnimationFrame(paint);
    }, { signal, passive: true });

    document.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && visible) body.classList.add("cursor-pressed");
    }, { signal, passive: true });
    document.addEventListener("pointerup", () => body.classList.remove("cursor-pressed"), { signal, passive: true });
    document.documentElement.addEventListener("pointerleave", hide, { signal });
    window.addEventListener("blur", hide, { signal });
    window.addEventListener("scroll", hide, { signal, passive: true });
    document.addEventListener("keydown", hide, { signal });
    document.addEventListener("visibilitychange", () => { if (document.hidden) hide(); }, { signal });
    disposePointer = () => { controller.abort(); hide(); };
  }

  // Respect live preference changes and tablet/desktop resizing.
  [reduceMotion, desktopPointer].forEach((query) => {
    if (query.addEventListener) query.addEventListener("change", configurePointer);
    else query.addListener(configurePointer);
  });
  configurePointer();

  // Real CTA links only. Wireframe CTA markers are deliberately non-interactive.
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".btn");
    if (!button || reduceMotion.matches) return;
    const bounds = button.getBoundingClientRect();
    const diameter = Math.max(bounds.width, bounds.height) * 2;
    const x = event.detail ? event.clientX - bounds.left : bounds.width / 2;
    const y = event.detail ? event.clientY - bounds.top : bounds.height / 2;
    button.querySelectorAll(".button-ripple").forEach((item) => item.remove());
    const ripple = document.createElement("span");
    ripple.className = "button-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${x - diameter / 2}px`;
    ripple.style.top = `${y - diameter / 2}px`;
    button.append(ripple);
    const cleanup = () => ripple.remove();
    ripple.addEventListener("animationend", cleanup, { once: true });
    setTimeout(cleanup, 800);
  });
})();
