(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  const header = document.querySelector(".header");
  const progress = document.querySelector(".progress");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.transform = "scaleX(" + p + ")";
    if (header) header.classList.toggle("is-stuck", window.scrollY > 10);
  }

  let ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });
  onScroll();

  function setNav(open) {
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "Close" : "Menu";
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(!nav.classList.contains("is-open"));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setNav(false); });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setNav(false);
    });
  }

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      io.unobserve(entry.target);
    });
  }, { threshold: 0.16 });
  document.querySelectorAll("[data-reveal]").forEach(function (el) { io.observe(el); });

  const tabs = document.querySelectorAll(".svc");
  const scenes = document.querySelectorAll(".scene");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const id = tab.getAttribute("data-scene");
      tabs.forEach(function (item) {
        item.setAttribute("aria-selected", item === tab ? "true" : "false");
      });
      scenes.forEach(function (scene) {
        scene.classList.toggle("is-on", scene.getAttribute("data-scene") === id);
      });
      if (window.matchMedia("(max-width: 900px)").matches) {
        const stage = document.querySelector(".svc-stage");
        if (stage) stage.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
      }
    });
  });

  document.querySelectorAll("[data-compare]").forEach(function (root) {
    const set = function (clientX) {
      const rect = root.getBoundingClientRect();
      let value = (clientX - rect.left) / rect.width;
      value = Math.min(0.96, Math.max(0.04, value));
      const pct = (value * 100).toFixed(2) + "%";
      root.style.setProperty("--pos", pct);
      root.setAttribute("aria-valuenow", String(Math.round(value * 100)));
    };
    let dragging = false;
    let locked = false;
    let startX = 0;
    let startY = 0;
    root.addEventListener("pointerdown", function (event) {
      dragging = true;
      locked = false;
      startX = event.clientX;
      startY = event.clientY;
    });
    root.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      const dx = Math.abs(event.clientX - startX);
      const dy = Math.abs(event.clientY - startY);
      if (!locked) {
        if (dx < 8 && dy < 8) return;
        if (dy > dx) {
          dragging = false;
          return;
        }
        locked = true;
        root.setPointerCapture(event.pointerId);
      }
      set(event.clientX);
    });
    function stop() { dragging = false; locked = false; }
    root.addEventListener("pointerup", stop);
    root.addEventListener("pointercancel", stop);
    root.addEventListener("keydown", function (event) {
      const current = Number(root.getAttribute("aria-valuenow") || "62");
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const next = Math.max(4, current - 5);
        root.style.setProperty("--pos", next + "%");
        root.setAttribute("aria-valuenow", String(next));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        const next = Math.min(96, current + 5);
        root.style.setProperty("--pos", next + "%");
        root.setAttribute("aria-valuenow", String(next));
      }
    });
  });

  const cats = {
    lunen: {
      kicker: "Skincare · Concept",
      title: "Lunen",
      copy: "Glass, dew, and hard light. The bottle is the whole advertisement.",
      img: "assets/lunen-serum.jpg",
      alt: "Unlabeled amber dropper bottle in sunlight, used as the Lunen concept serum",
      card1: "assets/lunen-bottle.jpg",
      card2: "assets/lunen-portrait.jpg",
      bg: "#e6d2b4",
      dark: false
    },
    volt: {
      kicker: "Tech · Concept",
      title: "Voltline",
      copy: "One object, two crops. Yellow does the shouting. Black does the spec.",
      img: "assets/volt-campaign.jpg",
      alt: "Black over-ear headphones on a yellow field, the Voltline concept campaign crop",
      card1: "assets/volt-packshot.jpg",
      card2: "assets/volt-campaign.jpg",
      bg: "#11110f",
      dark: true
    },
    kilo: {
      kicker: "Streetwear · Concept",
      title: "Kilo District",
      copy: "A night drop. The garment is shot like a poster, not a catalogue tile.",
      img: "assets/kilo-editorial.jpg",
      alt: "Editorial portrait in a yellow tracksuit, the Kilo District concept campaign",
      card1: "assets/kilo-runner.jpg",
      card2: "assets/kilo-street.jpg",
      bg: "#1a120e",
      dark: true
    },
    field: {
      kicker: "Food · Concept",
      title: "Fieldpost",
      copy: "The ingredient is the hero. Labels stay small enough to taste past.",
      img: "assets/field-oil.jpg",
      alt: "Glass cruet of olive oil with loose olives, the Fieldpost concept hero",
      card1: "assets/field-honey.jpg",
      card2: "assets/field-fruit.jpg",
      bg: "#efe2c8",
      dark: false
    },
    north: {
      kicker: "Home · Concept",
      title: "Northroom",
      copy: "Objects held like sculpture. The empty space is part of the price.",
      img: "assets/north-chair.jpg",
      alt: "Yellow lounge chair in a quiet interior, the Northroom concept hero",
      card1: "assets/north-clay.jpg",
      card2: "assets/north-lamp.jpg",
      bg: "#e4e1db",
      dark: false
    }
  };

  const stage = document.getElementById("mstage");
  const mimg = document.getElementById("mimg");
  const mcard1 = document.getElementById("mcard1");
  const mcard2 = document.getElementById("mcard2");
  const mkicker = document.getElementById("mkicker");
  const mtitle = document.getElementById("mtitle");
  const mcopy = document.getElementById("mcopy");
  const catButtons = document.querySelectorAll("[data-cat]");

  function showCat(id) {
    const cat = cats[id];
    if (!cat || !stage) return;
    catButtons.forEach(function (button) {
      button.setAttribute("aria-selected", button.getAttribute("data-cat") === id ? "true" : "false");
    });
    stage.style.background = cat.bg;
    stage.classList.toggle("tone-dark", cat.dark);
    if (mimg) {
      mimg.src = cat.img;
      mimg.alt = cat.alt;
    }
    if (mcard1) mcard1.src = cat.card1;
    if (mcard2) mcard2.src = cat.card2;
    if (mkicker) mkicker.textContent = cat.kicker;
    if (mtitle) mtitle.textContent = cat.title;
    if (mcopy) mcopy.textContent = cat.copy;
    stage.classList.remove("is-swap");
    void stage.offsetWidth;
    stage.classList.add("is-swap");
  }

  catButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      showCat(button.getAttribute("data-cat"));
    });
  });

  const cycle = document.getElementById("cycle");
  const words = ["unmissable", "tactile", "shoppable", "clear", "desirable"];
  let wordIndex = 0;
  if (cycle && !reduce) {
    window.setInterval(function () {
      cycle.classList.add("is-out");
      window.setTimeout(function () {
        wordIndex = (wordIndex + 1) % words.length;
        cycle.textContent = words[wordIndex];
        cycle.classList.remove("is-out");
      }, 220);
    }, 1900);
  }

  const cases = document.querySelectorAll(".case");
  const reelLinks = document.querySelectorAll(".reel a");
  const spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      reelLinks.forEach(function (link) {
        link.classList.toggle("is-current", link.getAttribute("href") === "#" + entry.target.id);
      });
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  cases.forEach(function (item) { spy.observe(item); });

  const toast = document.getElementById("toast");
  let toastTimer = 0;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  document.body.addEventListener("click", function (event) {
    const concept = event.target.closest("[data-concept]");
    if (!concept) return;
    event.preventDefault();
    showToast("Concept layout — nothing here is for sale.");
  });

  const form = document.getElementById("enquiry");
  const mail = document.getElementById("mail");
  if (form && mail) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = new FormData(form);
      const address = mail.getAttribute("href").replace("mailto:", "");
      const subject = encodeURIComponent("Project enquiry — " + data.get("name"));
      const body = encodeURIComponent(
        "Name: " + data.get("name") +
        "\nEmail: " + data.get("email") +
        "\nProduct: " + data.get("about") +
        "\n\n" + (data.get("note") || "")
      );
      window.location.href = "mailto:" + address + "?subject=" + subject + "&body=" + body;
      showToast("Opening your email app.");
    });
  }
})();
