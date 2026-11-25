(function () {
  const PHONE = "998909933299";
  const header = document.querySelector(".header");
  const burger = document.querySelector(".burger");
  const menu = document.getElementById("menu");
  const form = document.getElementById("book-form");
  const statusEl = document.getElementById("form-status");
  const fallback = document.getElementById("wa-fallback");
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCap = document.getElementById("lb-cap");
  const shots = Array.from(document.querySelectorAll(".shot"));
  let lang = "ru";
  let lbIndex = 0;

  function lookup(key) {
    return key.split(".").reduce(function (obj, part) {
      return obj && obj[part] != null ? obj[part] : null;
    }, window.I18N[lang]);
  }

  function applyLanguage(next) {
    if (!window.I18N[next]) next = "ru";
    lang = next;
    try { localStorage.setItem("humor-lang", lang); } catch (err) { /* private mode */ }
    document.documentElement.lang = lang;
    document.title = lookup("metaTitle");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", lookup("metaDesc"));
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const value = lookup(el.dataset.i18n);
      if (value != null) el.textContent = value;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      const value = lookup(el.dataset.i18nPlaceholder);
      if (value != null) el.setAttribute("placeholder", value);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      const value = lookup(el.dataset.i18nAria);
      if (value != null) el.setAttribute("aria-label", value);
    });
    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      const value = lookup(el.dataset.i18nAlt);
      if (value != null) el.setAttribute("alt", value);
    });
    document.querySelectorAll(".lang").forEach(function (btn) {
      const on = btn.dataset.lang === lang;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    statusEl.textContent = "";
    statusEl.classList.remove("is-error");
    fallback.hidden = true;
    if (menu.hidden) burger.setAttribute("aria-label", lookup("nav.menu"));
  }

  function closeMenu() {
    menu.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", lookup("nav.menu"));
    document.body.classList.remove("menu-open");
  }

  function openMenu() {
    menu.hidden = false;
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", lookup("nav.close"));
    document.body.classList.add("menu-open");
  }

  function openLightbox(index) {
    lbIndex = (index + shots.length) % shots.length;
    const shot = shots[lbIndex];
    lbImg.src = shot.dataset.src;
    lbImg.alt = shot.querySelector("img").alt;
    lbCap.textContent = shot.querySelector("span").textContent;
    lightbox.hidden = false;
    document.body.classList.add("lb-open");
    lightbox.querySelector(".lb-close").focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("lb-open");
    lbImg.removeAttribute("src");
  }

  document.querySelectorAll(".lang").forEach(function (btn) {
    btn.addEventListener("click", function () { applyLanguage(btn.dataset.lang); });
  });

  burger.addEventListener("click", function () {
    if (menu.hidden) openMenu();
    else closeMenu();
  });
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (!lightbox.hidden) closeLightbox();
      if (!menu.hidden) closeMenu();
    }
    if (!lightbox.hidden && event.key === "ArrowRight") openLightbox(lbIndex + 1);
    if (!lightbox.hidden && event.key === "ArrowLeft") openLightbox(lbIndex - 1);
  });

  shots.forEach(function (shot, index) {
    shot.addEventListener("click", function () { openLightbox(index); });
  });
  lightbox.querySelector(".lb-close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lb-prev").addEventListener("click", function () { openLightbox(lbIndex - 1); });
  lightbox.querySelector(".lb-next").addEventListener("click", function () { openLightbox(lbIndex + 1); });
  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) closeLightbox();
  });

  document.querySelectorAll("[data-room]").forEach(function (link) {
    link.addEventListener("click", function () {
      document.getElementById("room-select").value = link.dataset.room;
    });
  });

  const checkin = form.querySelector('[name="checkin"]');
  const checkout = form.querySelector('[name="checkout"]');
  const today = new Date();
  const minDate = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  checkin.min = minDate;
  checkout.min = minDate;
  checkin.addEventListener("change", function () {
    checkout.min = checkin.value || minDate;
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    statusEl.classList.remove("is-error");
    fallback.hidden = true;
    const data = new FormData(form);
    if (!data.get("name").trim() || !data.get("phone").trim() || !data.get("checkin") || !data.get("checkout")) {
      statusEl.textContent = lookup("book.errRequired");
      statusEl.classList.add("is-error");
      return;
    }
    if (data.get("checkout") <= data.get("checkin")) {
      statusEl.textContent = lookup("book.errDates");
      statusEl.classList.add("is-error");
      return;
    }
    const roomLabel = form.querySelector('select[name="room"] option:checked').textContent.trim();
    const guestLabel = form.querySelector('select[name="guests"] option:checked').textContent.trim();
    const lines = [
      lookup("wa.hello"),
      lookup("wa.name") + ": " + data.get("name").trim(),
      lookup("wa.phone") + ": " + data.get("phone").trim(),
      lookup("wa.inn") + ": " + data.get("checkin"),
      lookup("wa.out") + ": " + data.get("checkout"),
      lookup("wa.guests") + ": " + guestLabel,
      lookup("wa.room") + ": " + roomLabel
    ];
    const note = data.get("comment").trim();
    if (note) lines.push(lookup("wa.comment") + ": " + note);
    const message = lines.join("\n");
    const url = "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(message);
    fallback.href = url;
    fallback.hidden = false;
    window.open(url, "_blank", "noopener");
    const finish = function (didCopy) {
      statusEl.textContent = didCopy ? lookup("book.ok") : lookup("book.okNoCopy");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).then(function () { finish(true); }, function () { finish(false); });
    } else finish(false);
  });

  document.getElementById("year").textContent = String(new Date().getFullYear());
  window.addEventListener("scroll", function () {
    header.classList.toggle("is-solid", window.scrollY > 8);
  }, { passive: true });

  let stored = "ru";
  try { stored = localStorage.getItem("humor-lang") || "ru"; } catch (err) { stored = "ru"; }
  applyLanguage(stored);
})();
