(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  const header = document.querySelector(".header");
  const progress = document.querySelector(".progress");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  const hero = document.querySelector(".kh");
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? y / max : 0;
    if (progress) progress.style.transform = "scaleX(" + p + ")";
    if (header) {
      const overHero = hero ? y < hero.offsetHeight - header.offsetHeight : false;
      header.classList.toggle("is-over-hero", overHero);
      document.body.classList.toggle("at-hero", overHero);
      header.classList.toggle("is-stuck", !overHero && y > 10);
      const navOpen = document.body.classList.contains("nav-open");
      const hide = !navOpen && !overHero && y > lastY + 2 && y > 400;
      const show = y < lastY - 2 || overHero || navOpen;
      if (hide) header.classList.add("is-hidden");
      else if (show) header.classList.remove("is-hidden");
      document.body.classList.toggle("header-hidden", header.classList.contains("is-hidden"));
    }
    lastY = y;
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
    if (window.kurantLenis) {
      if (open) window.kurantLenis.stop();
      else window.kurantLenis.start();
    }
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
      if (window.matchMedia("(max-width: 980px)").matches) {
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

  /* Listing / product page toggle inside each case study */
  const caseTabs = document.querySelectorAll(".case__tabs");
  function placeTabIndicator(tabs) {
    const ind = tabs.querySelector(".case__tabs-ind");
    const on = tabs.querySelector('[aria-selected="true"]');
    if (!ind || !on) return;
    ind.style.width = on.offsetWidth + "px";
    ind.style.transform = "translateX(" + on.offsetLeft + "px)";
  }
  caseTabs.forEach(function (tabs) {
    const buttons = Array.from(tabs.querySelectorAll("button"));
    const split = tabs.nextElementSibling;
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        const view = button.getAttribute("data-view");
        buttons.forEach(function (b) { b.setAttribute("aria-selected", b === button ? "true" : "false"); });
        split.querySelectorAll(".case__view").forEach(function (panel) {
          const on = panel.getAttribute("data-view") === view;
          panel.classList.toggle("is-on", on);
          panel.toggleAttribute("inert", !on);
          panel.setAttribute("aria-hidden", on ? "false" : "true");
        });
        placeTabIndicator(tabs);
      });
    });
    tabs.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const at = buttons.findIndex(function (b) { return b.getAttribute("aria-selected") === "true"; });
      const next = buttons[(at + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length];
      next.focus();
      next.click();
    });
    placeTabIndicator(tabs);
  });
  function placeAllTabs() { caseTabs.forEach(placeTabIndicator); }
  window.addEventListener("resize", placeAllTabs);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeAllTabs);

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
    if (/add to bag/i.test(concept.textContent) && !concept.classList.contains("is-added")) {
      const original = concept.innerHTML;
      concept.classList.add("is-added");
      concept.innerHTML = 'Added <span aria-hidden="true">✓</span>';
      window.setTimeout(function () {
        concept.classList.remove("is-added");
        concept.innerHTML = original;
      }, 1600);
    }
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

  document.querySelectorAll(".rail__card").forEach(function (card) {
    const button = card.querySelector("button");
    if (!button) return;
    button.addEventListener("click", function () {
      document.querySelectorAll(".rail__card").forEach(function (other) {
        const on = other === card;
        other.classList.toggle("is-on", on);
        const otherButton = other.querySelector("button");
        if (otherButton) otherButton.setAttribute("aria-expanded", on ? "true" : "false");
      });
    });
  });

  const shade = document.getElementById("shade");
  const shadeImg = document.getElementById("shade-img");
  const shadeTitle = document.getElementById("shade-title");
  const shadeDesc = document.getElementById("shade-desc");
  const shadePrice = document.getElementById("shade-price");
  const shadeLooks = [
    {
      src: "assets/volt-packshot.jpg",
      alt: "Arc Headphones, matte black packshot",
      title: "Arc Headphones",
      desc: "Matte black. Built for long listening.",
      price: "€189",
      bg: "#12110f",
      light: false
    },
    {
      src: "assets/volt-campaign.jpg",
      alt: "Arc Headphones photographed on a yellow field",
      title: "Arc Headphones",
      desc: "Signal yellow. The same object, louder.",
      price: "€189",
      bg: "#d8ff3e",
      light: true
    }
  ];
  document.querySelectorAll("[data-shade]").forEach(function (button) {
    button.addEventListener("click", function () {
      const look = shadeLooks[Number(button.getAttribute("data-shade"))];
      if (!look || !shade) return;
      document.querySelectorAll("[data-shade]").forEach(function (dot) {
        dot.setAttribute("aria-selected", dot === button ? "true" : "false");
      });
      shade.style.background = look.bg;
      shade.classList.toggle("is-light", look.light);
      if (shadeImg) {
        shadeImg.src = look.src;
        shadeImg.alt = look.alt;
      }
      if (shadeTitle) shadeTitle.textContent = look.title;
      if (shadeDesc) shadeDesc.textContent = look.desc;
      if (shadePrice) shadePrice.textContent = look.price;
    });
  });

  document.querySelectorAll(".spinline").forEach(function (line, n) {
    const list = line.querySelector(".spinline__list");
    const words = Array.from(list.children).map(function (w) { return w.textContent; });
    const label = line.querySelector(".spinline__label");
    const read = document.createElement("span");
    read.className = "sr-only";
    read.textContent = (label ? label.textContent + " " : "") + words.join(", ") + ".";
    line.querySelector(".spinline__window").setAttribute("aria-hidden", "true");
    if (label) label.setAttribute("aria-hidden", "true");
    line.appendChild(read);
    if (reduce || words.length < 2) return;

    list.appendChild(list.firstElementChild.cloneNode(true));
    let at = 0;
    let timer = null;
    let delay = null;
    const step = function () {
      if (at >= words.length) {
        at = 0;
        list.classList.add("is-reset");
        list.style.transform = "translateY(0)";
        void list.offsetHeight;
        list.classList.remove("is-reset");
      }
      at += 1;
      list.style.transform = "translateY(" + (-at * 1.15) + "em)";
    };
    const start = function () {
      if (!timer) timer = setInterval(step, 2400);
    };
    const stop = function () {
      clearTimeout(delay);
      clearInterval(timer);
      timer = null;
    };

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) delay = setTimeout(start, (n % 3) * 400);
        else stop();
      }).observe(line);
    } else {
      start();
    }
  });

  const tabbar = document.querySelector(".tabbar");
  const tabBlob = document.querySelector(".tabbar__blob");
  const tabItems = document.querySelectorAll(".tabbar__item");
  function placeBlob(item) {
    if (!tabbar || !tabBlob || !item) return;
    const itemBox = item.getBoundingClientRect();
    const barBox = tabbar.getBoundingClientRect();
    const left = itemBox.left - barBox.left + (itemBox.width - tabBlob.offsetWidth) / 2;
    tabBlob.style.transform = "translate3d(" + left + "px, 0, 0)";
  }
  function setTab(item) {
    tabItems.forEach(function (link) {
      link.classList.toggle("is-on", link === item);
    });
    placeBlob(item);
  }
  tabItems.forEach(function (item) {
    item.addEventListener("click", function () { setTab(item); });
  });
  const tabMap = {};
  tabItems.forEach(function (item) {
    tabMap[item.getAttribute("href")] = item;
  });
  if ("IntersectionObserver" in window) {
    const tabSpy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const link = tabMap["#" + entry.target.id];
        if (link) setTab(link);
      });
    }, { rootMargin: "-42% 0px -48% 0px" });
    Object.keys(tabMap).forEach(function (hash) {
      const section = document.querySelector(hash);
      if (section) tabSpy.observe(section);
    });
  }
  placeBlob(document.querySelector(".tabbar__item.is-on"));
  window.addEventListener("resize", function () {
    placeBlob(document.querySelector(".tabbar__item.is-on"));
  });
  window.addEventListener("load", function () {
    placeBlob(document.querySelector(".tabbar__item.is-on"));
  });
})();
