/* Interacciones de presentación: no modifica credenciales, API ni registros. */
(() => {
  "use strict";
  const login = document.getElementById("loginOverlay");
  const modal = document.getElementById("modalResponder");
  const app = [
    ...document.querySelectorAll(
      ".admin-rail,.admin-nav,.admin-container,.admin-pie",
    ),
  ];
  let returnFocus,
    modalOpen = false;
  function lock(locked) {
    document.body.classList.toggle("admin-locked", locked);
    app.forEach((element) => {
      element.inert = locked || !modal.hidden;
    });
    if (locked)
      requestAnimationFrame(() =>
        document.getElementById("loginUsuario").focus({ preventScroll: true }),
      );
  }
  lock(true);
  window.addEventListener("vitara:admin-ready", () => {
    lock(false);
    document.getElementById("admin-main").focus({ preventScroll: true });
  });
  window.addEventListener("vitara:admin-logout", () => {
    lock(true);
    document.getElementById("admin-stream-status").textContent =
      "Sesión cerrada";
    document
      .querySelector(".concurrencia-banner")
      .classList.remove("is-connected");
    document.getElementById("lbl-concurrencia-num").textContent = "0";
    document.getElementById("barra-concurrencia").style.width = "0%";
    document.getElementById("admin-search").value = "";
  });
  new MutationObserver(() => {
    const open = !modal.hidden;
    if (open === modalOpen) return;
    modalOpen = open;
    app.forEach((element) => {
      element.inert = open || login.style.display !== "none";
    });
    if (open) {
      returnFocus = document.activeElement;
      document.getElementById("modalRespEstado").focus();
    } else if (returnFocus?.isConnected && login.style.display === "none")
      returnFocus.focus({ preventScroll: true });
  }).observe(modal, { attributes: true, attributeFilter: ["hidden"] });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.hidden = true;
  });
  document.addEventListener("keydown", (event) => {
    const dialog = !modal.hidden
      ? modal
      : login.style.display !== "none"
        ? login
        : null;
    if (!dialog) return;
    if (event.key === "Escape" && dialog === modal) {
      event.preventDefault();
      modal.hidden = true;
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [
      ...dialog.querySelectorAll(
        'a[href],button,input,textarea,select,summary,[tabindex="0"]',
      ),
    ].filter((element) => !element.disabled && element.checkVisibility());
    const first = controls[0],
      last = controls.at(-1);
    if (!first) return;
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        !dialog.contains(document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        !dialog.contains(document.activeElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  });
  const links = [...document.querySelectorAll(".admin-rail nav a")];
  function select(id) {
    for (const link of links) {
      const selected = link.hash === "#" + id;
      link.classList.toggle("is-current", selected);
      if (selected) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }
  links.forEach((link) =>
    link.addEventListener("click", () => select(link.hash.slice(1))),
  );
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) select(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -45% 0px", threshold: 0 },
    );
    links.forEach((link) => {
      const section = document.getElementById(link.hash.slice(1));
      if (section) observer.observe(section);
    });
  }
})();
