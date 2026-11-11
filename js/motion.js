/* KURANT — motion layer
   Intro loader (adapted from Osmo's "Willem" loading animation, https://osmo.supply),
   smooth scroll, heading + image reveals, cursor, liquid footer. */
(function () {
  window.__kurantIntro = true;

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const hasGsap = !!gsap;
  if (hasGsap && ST) gsap.registerPlugin(ST);

  /* ---------------------------------------------------------------- Lenis */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    window.kurantLenis = lenis;
    if (hasGsap) {
      if (ST) lenis.on("scroll", ST.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.addEventListener("click", function (event) {
      const link = event.target.closest('a[href^="#"]');
      if (!link || link.classList.contains("skip")) return;
      const hash = link.getAttribute("href");
      if (hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(hash === "#top" ? 0 : target, { offset: hash === "#top" ? 0 : -56, duration: 1.4 });
      history.replaceState(null, "", hash);
    });
  }

  /* ---------------------------------------------------------------- Intro */
  const kh = document.querySelector(".kh");

  function finishIntro() {
    root.classList.remove("intro", "intro-short", "intro-run");
    if (lenis) lenis.start();
    if (ST) ST.refresh();
  }

  function waitFor(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  /* Short entrance for a repeat visit: image settles, type and nav land */
  function playShort() {
    const wrap = kh.querySelector(".kh__grow-wrap");
    const heroLetters = kh.querySelectorAll(".kh__lw");
    const meta = kh.querySelectorAll(".kh__meta li, .hotspot, .kh__aside > *");
    const headerItems = document.querySelectorAll(".header .logo, .header .nav__links a, .header .nav > .btn, .header .nav-toggle");
    gsap.set(heroLetters, { yPercent: 100 });
    gsap.set(meta, { y: 24, opacity: 0 });
    gsap.set(headerItems, { yPercent: -120, opacity: 0 });
    root.classList.add("intro-run");
    gsap.timeline({
      onComplete: function () {
        gsap.set([heroLetters, meta, headerItems], { clearProps: "all" });
        finishIntro();
      }
    })
      .fromTo(wrap, { scale: 1.18 }, { scale: 1, duration: 1.6, ease: "expo.out" }, 0)
      .to(heroLetters, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.03 }, 0.1)
      .to(headerItems, { yPercent: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.04 }, 0.2)
      .to(meta, { y: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.06 }, 0.3);
  }

  function playIntro() {
    try { sessionStorage.setItem("kurant:intro", "1"); } catch (e) { /* private mode */ }
    const q = function (sel) { return kh.querySelectorAll(sel); };
    const letters = q(".kh__l");
    const box = kh.querySelector(".kh__box");
    const grow = kh.querySelector(".kh__grow");
    const wrap = kh.querySelector(".kh__grow-wrap");
    const start = kh.querySelector(".kh__start");
    const end = kh.querySelector(".kh__end");
    const extras = q(".kh__extra");
    const heroLetters = q(".kh__lw");
    const meta = q(".kh__meta li, .hotspot, .kh__aside > *");
    const status = kh.querySelector(".kh__status");
    const count = kh.querySelector(".kh__count");
    const shade = kh.querySelector(".kh__shade");
    const headerItems = document.querySelectorAll(".header .logo, .header .nav__links a, .header .nav > .btn, .header .nav-toggle");

    gsap.set(letters, { yPercent: 100 });
    gsap.set(heroLetters, { yPercent: 100 });
    gsap.set(meta, { y: 24, opacity: 0 });
    gsap.set(headerItems, { yPercent: -120, opacity: 0 });
    root.classList.add("intro-run");

    const counter = { v: 0 };
    const tl = gsap.timeline({
      defaults: { ease: "expo.inOut" },
      onComplete: function () {
        gsap.set([box, grow], { clearProps: "width,height" });
        gsap.set([letters, heroLetters, start, end, meta, headerItems, extras, shade, status], { clearProps: "all" });
        finishIntro();
      }
    });

    /* 1 — letters rise, counter runs */
    tl.to(status, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0);
    tl.to(letters, { yPercent: 0, stagger: 0.025, duration: 1.25 }, 0);
    tl.to(counter, {
      v: 100,
      duration: 3,
      ease: "power2.inOut",
      onUpdate: function () { count.textContent = String(Math.round(counter.v)).padStart(3, "0"); }
    }, 0.1);

    /* 2 — the box opens between "Kur" and "ant" */
    tl.fromTo(box, { width: "0em" }, { width: "1em", duration: 1.25 }, 1.25);
    tl.fromTo(grow, { width: "0%" }, { width: "100%", duration: 1.25 }, 1.25);
    tl.fromTo(start, { x: "0em" }, { x: "-0.05em", duration: 1.25 }, 1.25);
    tl.fromTo(end, { x: "0em" }, { x: "0.05em", duration: 1.25 }, 1.25);

    /* 3 — product frames flick through */
    tl.fromTo(extras, { opacity: 1 }, { opacity: 0, duration: 0.05, ease: "none", stagger: 0.36 }, 2.45);
    tl.to(status, { opacity: 0, duration: 0.5, ease: "power2.out" }, 3.1);

    /* 4 — the last frame takes the screen */
    tl.to(grow, { width: "100vw", height: "100dvh", duration: 2 }, 3.7);
    tl.to(box, { width: "110vw", duration: 2 }, 3.7);
    tl.fromTo(wrap, { scale: 1.3 }, { scale: 1, duration: 2.2 }, 3.7);
    tl.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power2.out" }, 4.6);

    /* 5 — hero type and navigation land */
    tl.to(heroLetters, { yPercent: 0, duration: 1.25, ease: "expo.out", stagger: 0.025 }, 4.9);
    tl.to(headerItems, { yPercent: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.05 }, 4.95);
    tl.to(meta, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.08 }, 5.05);

    tl.timeScale(1.12);

    /* Any input fast-forwards the intro instead of trapping the visitor */
    const hurry = function () {
      tl.timeScale(4);
      ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (type) {
        window.removeEventListener(type, hurry);
      });
    };
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (type) {
      window.addEventListener(type, hurry, { passive: true });
    });
  }

  if (root.classList.contains("intro") && kh) {
    if (!hasGsap) {
      finishIntro();
    } else {
      if (lenis) lenis.stop();
      window.scrollTo(0, 0);
      const imgs = Array.from(kh.querySelectorAll(".kh__grow img"));
      const ready = Promise.all(
        [document.fonts ? document.fonts.ready : Promise.resolve()].concat(
          imgs.map(function (img) { return img.decode ? img.decode().catch(function () {}) : Promise.resolve(); })
        )
      );
      Promise.race([ready, waitFor(1500)]).then(playIntro);
    }
  } else if (root.classList.contains("intro-short") && kh) {
    if (!hasGsap) {
      finishIntro();
    } else {
      if (lenis) lenis.stop();
      window.scrollTo(0, 0);
      playShort();
    }
  } else {
    root.classList.remove("intro", "intro-short");
  }

  if (!hasGsap || reduce) return;

  /* -------------------------------------------------------- Hero parallax */
  if (ST && kh) {
    gsap.to(".kh__grow-wrap", {
      yPercent: 14,
      ease: "none",
      scrollTrigger: { trigger: kh, start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".kh__content", {
      yPercent: -10,
      opacity: 0.2,
      ease: "none",
      scrollTrigger: { trigger: kh, start: "40% top", end: "bottom top", scrub: true }
    });
  }

  /* ------------------------------------------------------- Heading reveal */
  function splitWords(el) {
    const walk = function (node) {
      Array.from(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const outer = document.createElement("span");
            const inner = document.createElement("span");
            outer.className = "w";
            inner.className = "w__i";
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    return el.querySelectorAll(".w__i");
  }

  if (ST) {
    document.querySelectorAll("[data-split]").forEach(function (el) {
      const words = splitWords(el);
      gsap.from(words, {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.04,
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    /* ------------------------------------------------------ Image reveal */
    gsap.utils.toArray(".case__stage > .herofig, .banner--overlap, .dock__media, .mstage").forEach(function (el) {
      const trigger = { trigger: el, start: "top 86%", once: true };
      gsap.fromTo(el,
        { clipPath: "inset(12% 8% 12% 8%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.out", scrollTrigger: trigger, clearProps: "clipPath" }
      );
      if (el.matches(".herofig, .banner--overlap")) {
        gsap.fromTo(el.querySelectorAll("img"),
          { scale: 1.16 },
          { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: trigger, clearProps: "transform" }
        );
      }
    });
  }

  /* ------------------------------------------------- Page colour on scroll */
  const bgEls = Array.from(document.querySelectorAll("[data-bg]"));
  if (bgEls.length) {
    let tops = [];
    let current = "";
    const measure = function () {
      tops = bgEls.map(function (el) { return el.getBoundingClientRect().top + window.scrollY; });
    };
    const pick = function () {
      const line = window.scrollY + window.innerHeight * 0.55;
      let colour = "";
      for (let i = 0; i < bgEls.length; i += 1) {
        if (tops[i] <= line) colour = bgEls[i].getAttribute("data-bg");
      }
      colour = colour || "#f1f0ec";
      if (colour !== current) {
        current = colour;
        document.body.style.backgroundColor = colour;
      }
    };
    measure();
    pick();
    root.classList.add("bgfx");
    if (ST) ST.addEventListener("refresh", function () { measure(); pick(); });
    window.addEventListener("resize", function () { measure(); pick(); });
    window.addEventListener("scroll", pick, { passive: true });
  }

  /* ---------------------------------------- Before/after: a hint of drag */
  if (ST && !window.matchMedia("(max-width: 720px)").matches) {
    document.querySelectorAll("[data-compare]").forEach(function (el) {
      const hint = gsap.to(el, {
        keyframes: [
          { "--pos": "34%", duration: 0.9, ease: "power2.inOut" },
          { "--pos": "62%", duration: 1.2, ease: "expo.out" }
        ],
        scrollTrigger: { trigger: el, start: "top 65%", once: true }
      });
      el.addEventListener("pointerdown", function () { hint.kill(); }, { once: true });
      el.addEventListener("keydown", function () { hint.kill(); }, { once: true });
    });
  }

  /* --------------------------------------------------------------- Cursor */
  const cursor = document.querySelector(".cursor");
  if (cursor && finePointer) {
    const label = cursor.querySelector("span");
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.55, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.55, ease: "power3" });
    const targets = [
      [".compare", "Drag"],
      [".rail__card", "Open"],
      [".dock a, .herofig, .social, .banner--overlap", "View"]
    ];
    let px = -1;
    let py = -1;
    const update = function (el) {
      let text = "";
      if (el && el.closest) {
        for (let i = 0; i < targets.length; i += 1) {
          if (el.closest(targets[i][0]) && !el.closest("button, .btn, .rail__card a")) {
            text = targets[i][1];
            break;
          }
        }
      }
      if (text) label.textContent = text;
      cursor.classList.toggle("is-on", !!text);
    };
    window.addEventListener("pointermove", function (event) {
      px = event.clientX;
      py = event.clientY;
      xTo(px);
      yTo(py);
    }, { passive: true });
    document.addEventListener("pointerover", function (event) { update(event.target); });
    /* Content moves under a still pointer while scrolling: re-check what is there */
    window.addEventListener("scroll", function () {
      if (px >= 0) update(document.elementFromPoint(px, py));
    }, { passive: true });
    document.addEventListener("pointerleave", function () { cursor.classList.remove("is-on"); });
  }

  /* ----------------------------------------------------- Magnetic buttons */
  if (finePointer) {
    document.querySelectorAll(".btn, .cats button, .case__tabs, .kh__scroll").forEach(function (el) {
      const pull = el.classList.contains("case__tabs") ? 0.08 : 0.28;
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      el.addEventListener("pointermove", function (event) {
        const r = el.getBoundingClientRect();
        xTo((event.clientX - r.left - r.width / 2) * pull);
        yTo((event.clientY - r.top - r.height / 2) * pull * 1.3);
      });
      el.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });
  }

  /* --------------------------------------------------------- Liquid pool */
  const pool = document.querySelector(".pool");
  if (pool && "IntersectionObserver" in window) {
    pool.classList.add("is-paused");
    new IntersectionObserver(function (entries) {
      pool.classList.toggle("is-paused", !entries[0].isIntersecting);
    }, { rootMargin: "200px 0px" }).observe(document.querySelector(".footer"));
  }
})();
