(function () {
  const C = window.WEDDING;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 720px)").matches;
  gsap.registerPlugin(ScrollTrigger);

  $$("img").forEach((img) => img.addEventListener("error", () => (img.style.visibility = "hidden"), { once: true }));

  /* ---------------- bind config ---------------- */
  const B = { bride: C.bride.name, groom: C.groom.name, brideParents: C.bride.parents, groomParents: C.groom.parents,
    city: C.city, verseRef: C.verseRef, endNote: C.endNote };
  $$("[data-bind]").forEach((el) => { if (el.dataset.bind in B) el.textContent = B[el.dataset.bind]; });
  $(".verse-text").innerHTML = C.verse.split(" ").map((w) => `<span class="w">${w}</span>`).join(" ");

  /* ---------------- events (physical-card style) ---------------- */
  $("#eventsList").innerHTML = C.events.map((ev) => `
    <article class="paper-card ev-card">
      <div class="pc-back"></div>
      <div class="pc-face">
        <img class="ev-art" src="assets/img/${ev.key === "wedding" ? "venue_wedding" : "venue_reception"}.webp" alt="${ev.venue}" loading="lazy" />
        <h3 class="ev-title">${ev.title}</h3>
        <div class="divider"><span></span><svg class="heart"><use href="#heart"/></svg><span></span></div>
        <p class="ev-date">${ev.dateText}</p>
        <p class="ev-time">${ev.timeText}</p>
        <p class="ev-venue">${ev.venue}</p>
        <p class="ev-addr">${ev.address}</p>
        <a class="solid-btn ev-dir" target="_blank" rel="noopener" href="${ev.mapUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ev.mapQuery)}">
          <svg><use href="#ico-pin"/></svg>Get Directions</a>
      </div>
      <img class="pc-flower tl" src="assets/img/frame_cluster.webp" alt="" loading="lazy" />
    </article>`).join("");
  $$("#eventsList img").forEach((img) => img.addEventListener("error", () => (img.style.display = "none"), { once: true }));


  /* ---------------- save the date ---------------- */
  const z = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const first = C.events[0], last = C.events[C.events.length - 1];
  const details = C.events.map((e) => `${e.title}: ${e.timeText} — ${e.venue}, ${e.address}`).join("\n");
  $("#gcal").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(`${C.bride.name} & ${C.groom.name} — Wedding`)}&dates=${z(first.start)}/${z(last.end)}` +
    `&details=${encodeURIComponent(details)}&location=${encodeURIComponent(first.venue + ", " + first.address)}`;
  $("#ics").addEventListener("click", () => {
    const esc = (s) => s.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//jenisha-jaswanth//wedding//EN", "CALSCALE:GREGORIAN"];
    C.events.forEach((e) => L.push("BEGIN:VEVENT", `UID:${e.key}-20270120@jenisha-jaswanth`, `DTSTAMP:${z(Date.now())}`, `DTSTART:${z(e.start)}`, `DTEND:${z(e.end)}`,
      `SUMMARY:${esc(`${C.bride.name} & ${C.groom.name} — ${e.title}`)}`, `LOCATION:${esc(e.venue + ", " + e.address)}`, "END:VEVENT"));
    L.push("END:VCALENDAR");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([L.join("\r\n")], { type: "text/calendar" })); a.download = "Jenisha-Jaswanth-Wedding.ics"; a.click();
  });

  /* ---------------- music ---------------- */
  // Starts on "Open Invitation" (a user tap, so browsers allow sound); the button mutes / unmutes.
  const song = $("#song"), musicBtn = $("#musicBtn");
  let opened = false, songOk = true;
  song.addEventListener("error", () => { songOk = false; musicBtn.hidden = true; });
  function fadeTo(v, ms) { const f0 = song.volume, t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / ms); song.volume = f0 + (v - f0) * k; if (k < 1) requestAnimationFrame(f); })(t0); }
  function startMusic() {
    if (!songOk) return;
    musicBtn.hidden = false;
    try { if (song.currentTime < .5) song.currentTime = .55; } catch (e) {}
    song.volume = 0;
    song.play().then(() => { musicBtn.classList.add("playing"); fadeTo(.7, 2500); }).catch(() => { musicBtn.classList.add("muted"); });
  }
  function setMuted(m) {
    musicBtn.classList.toggle("muted", m);
    musicBtn.setAttribute("aria-pressed", String(m));
    musicBtn.setAttribute("aria-label", m ? "Unmute music" : "Mute music");
    if (m) { fadeTo(0, 400); setTimeout(() => { if (musicBtn.classList.contains("muted")) song.muted = true; }, 420); }
    else { song.muted = false; if (song.paused) song.play().then(() => musicBtn.classList.add("playing")).catch(() => {}); fadeTo(.7, 800); }
  }
  musicBtn.addEventListener("click", () => setMuted(!musicBtn.classList.contains("muted")));
  document.addEventListener("visibilitychange", () => {
    if (!opened || !songOk) return;
    if (document.hidden) song.pause(); else if (!musicBtn.classList.contains("muted")) song.play().catch(() => {});
  });

  /* ---------------- opening: envelope ---------------- */
  if (!reduce) {
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".fw-left", { xPercent: -8, opacity: 0, duration: 1.2 }, 0)
      .from(".fw-right", { xPercent: 8, opacity: 0, duration: 1.2 }, 0)
      .from(".fw-bottom", { yPercent: 8, opacity: 0, duration: 1.2 }, .1)
      .from(".fw-top", { yPercent: -8, opacity: 0, duration: 1.2 }, .2)
      .from(".env-title > *", { y: 14, opacity: 0, duration: 1, stagger: .15 }, .7)
      .fromTo(".seal", { scale: 0, rotate: -30 }, { scale: 1, rotate: 0, duration: 1, ease: "back.out(1.8)" }, .9)
      .from(".env-hint", { opacity: 0, duration: .8 }, 1.6);
  }
  Petals.setIntensity(1); Petals.setSpeed(1.8, 1); Petals.start();   // quicker (but smooth) on the opening screen
  $("#openBtn").addEventListener("click", openInvitation);

  function openInvitation() {
    if (opened) return; opened = true;
    startMusic();
    const hero = buildHero();
    if (reduce) { $("#cover").remove(); document.body.classList.remove("is-locked"); hero.progress(1); afterOpen(); return; }
    Petals.setSpeed(1, 2500);   // ease back to the gentle site pace
    document.body.classList.remove("is-locked"); scrollTo(0, 0);
    gsap.timeline({ onComplete: () => $("#cover").remove() })
      // the seal lifts and fades
      .to(".seal", { scale: 1.25, rotate: 18, opacity: 0, duration: .55, ease: "back.in(1.6)" })
      .to(".env-hint", { opacity: 0, duration: .3 }, 0)
      .add(() => { Petals.burst(innerWidth / 2, innerHeight * .52, mobile ? 10 : 18); hero.play(0); }, .35)
      // the four flaps fold open in 3D, revealing the hero behind
      .to(".fw-top", { rotateX: 178, duration: 1.4, ease: "power3.inOut" }, .3)
      .to(".fw-bottom", { rotateX: -178, duration: 1.4, ease: "power3.inOut" }, .42)
      .to(".fw-left", { rotateY: -178, duration: 1.4, ease: "power3.inOut" }, .54)
      .to(".fw-right", { rotateY: 178, duration: 1.4, ease: "power3.inOut" }, .54)
      .to(".flapw", { opacity: 0, duration: .6, ease: "power1.in" }, 1.25);
    afterOpen();
  }

  /* ---------------- hero ---------------- */
  function buildHero() {
    return gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .fromTo(".hero-fl.top-l", { y: -220, x: -40, rotate: -8, opacity: 0 }, { y: 0, x: 0, rotate: 0, opacity: 1, duration: 1.9, ease: "back.out(1.1)" }, .1)
      .fromTo(".hero-fl.top-r", { y: -220, x: 40, rotate: 8, opacity: 0 }, { y: 0, x: 0, rotate: 0, opacity: 1, duration: 1.9, ease: "back.out(1.1)" }, .25)
      .fromTo(".hero-fl.bot-l", { y: 160, x: -60, opacity: 0 }, { y: 0, x: 0, opacity: 1, duration: 1.6 }, .5)
      .fromTo(".hero-fl.bot-r", { y: 160, x: 60, opacity: 0 }, { y: 0, x: 0, opacity: 1, duration: 1.6 }, .6)
      .add(() => $$(".fl-sway").forEach((el) => el.classList.add("idle")), 2.2)
      .fromTo(".hero-inner > .label", { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .9 }, .9)
      .fromTo(".nm-b", { clipPath: "inset(-20% 100% -20% 0)", x: -14 }, { clipPath: "inset(-20% 0% -20% 0)", x: 0, duration: 1.3, ease: "power2.inOut" }, 1.1)
      .fromTo(".amp", { scale: .4, opacity: 0 }, { scale: 1, opacity: 1, duration: .8, ease: "back.out(2)" }, 1.7)
      .fromTo(".nm-g", { clipPath: "inset(-20% 0 -20% 100%)", x: 14 }, { clipPath: "inset(-20% 0 -20% 0%)", x: 0, duration: 1.3, ease: "power2.inOut" }, 1.8)
      .fromTo(".db-bar", { scaleY: 0 }, { scaleY: 1, duration: .8, stagger: .1 }, 2.7)
      .fromTo(".db-day", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .9 }, 2.8)
      .fromTo(".db-l", { x: 16, opacity: 0 }, { x: 0, opacity: 1, duration: .9 }, 2.9)
      .fromTo(".db-r", { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: .9 }, 2.9)
      .fromTo(".h-city", { opacity: 0 }, { opacity: 1, duration: .9 }, 3.1)
      .fromTo(".scroll-cue", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .8 }, 3.4);
  }

  /* ---------------- mouse parallax (desktop) ---------------- */
  const depthEls = $$("[data-depth]");
  let tx = 0, ty = 0, cx = 0, cy = 0, pOn = false;
  function loop() { cx += (tx - cx) * .05; cy += (ty - cy) * .05;
    depthEls.forEach((el) => { const d = +el.dataset.depth; el.style.translate = `${(-cx * d).toFixed(2)}px ${(-cy * d).toFixed(2)}px`; });
    requestAnimationFrame(loop); }
  if (!mobile && !reduce) addEventListener("pointermove", (e) => { tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2; if (!pOn) { pOn = true; loop(); } });

  /* ---------------- scroll reveals ---------------- */
  function afterOpen() {
    if (reduce) return;
    const up = (t, trigger, extra = {}) => gsap.from(t, { y: 30, opacity: 0, duration: 1.1, ease: "power3.out", stagger: .12, scrollTrigger: { trigger, start: "top 82%" }, ...extra });
    const sway = (el, deg, dur, origin) => gsap.to(el, { rotate: deg, duration: dur, yoyo: true, repeat: -1, ease: "sine.inOut", transformOrigin: origin });

    const hx = { trigger: "#hero", start: "top top", end: "bottom top", scrub: .6 };
    gsap.to(".hero-inner", { y: -60, opacity: .2, ease: "none", scrollTrigger: { ...hx, start: "30% top" } });
    gsap.to(".hero-fl.top-l", { yPercent: -25, xPercent: -10, ease: "none", scrollTrigger: hx });
    gsap.to(".hero-fl.top-r", { yPercent: -25, xPercent: 10, ease: "none", scrollTrigger: hx });

    $$(".sec-head").forEach((h) => gsap.timeline({ scrollTrigger: { trigger: h, start: "top 84%" } })
      .from(h.querySelector(".label"), { y: 14, opacity: 0, duration: .8, ease: "power3.out" })
      .from(h.querySelector(".sec-title"), { y: 22, opacity: 0, duration: 1, ease: "power3.out" }, "-=.55")
      .from(h.querySelectorAll(".divider span"), { scaleX: 0, duration: .9, ease: "power2.out" }, "-=.6")
      .from(h.querySelector(".heart"), { scale: 0, duration: .6, ease: "back.out(2.4)" }, "-=.7"));

    // photo + verse
    gsap.timeline({ scrollTrigger: { trigger: ".story", start: "top 75%" } })
      .from(".story-env", { y: 70, rotate: -3, opacity: 0, duration: 1.4, ease: "power3.out" })
      .from(".verse .q-mark", { y: -10, opacity: 0, duration: .8 }, .6)
      .from(".verse-text .w", { y: 14, opacity: 0, filter: "blur(4px)", duration: .8, stagger: .08, ease: "power2.out" }, .8)
      .from(".verse .divider span", { scaleX: 0, duration: .8 }, "-=.3")
      .from(".verse .heart", { opacity: 0, y: 8, duration: .7 }, "-=.5");

    // scratch medals + countdown
    up(".scratch .medal-bloom", ".scratch-row", { y: -20, scale: 0, stagger: .15, ease: "back.out(2)" });
    up(".scratch", ".scratch-row", { y: 50, stagger: .15 });
    gsap.timeline({ scrollTrigger: { trigger: ".cd-stage", start: "top 78%" } })
      .from(".cd-stage .pc-back", { scale: .94, opacity: 0, duration: 1, ease: "power3.out" })
      .from(".cd-stage .pc-face", { y: 40, opacity: 0, duration: 1.1, ease: "power3.out" }, "-=.7")
      .from(".cd-stage .pc-flower.tl", { x: -60, y: -50, opacity: 0, duration: 1.2, ease: "power3.out" }, "-=.8")
      .from(".cd-stage .pc-flower.br", { x: 60, y: 50, opacity: 0, duration: 1.2, ease: "power3.out" }, "<.1")
      .from(".cd-stage .label, .cd-title", { y: 16, opacity: 0, duration: .9, stagger: .12 }, "-=.8")
      .from(".cd-arch", { y: 50, opacity: 0, rotateX: -40, transformPerspective: 600, duration: 1, stagger: .12, ease: "back.out(1.6)" }, "-=.5")
      .from(".cd-dot", { scale: 0, duration: .4, stagger: .1 }, "-=.6")
      .from(".journey", { opacity: 0, y: 12, duration: .8 }, "-=.3")
      .add(updateJourney);
    sway(".cd-stage .pc-flower.tl", 1.8, 6, "0 0");

    // couple card — quick, starts as soon as the card enters the screen
    gsap.timeline({ scrollTrigger: { trigger: ".invite", start: "top 92%" }, defaults: { ease: "power3.out" } })
      .from(".invite .pc-back", { scale: .96, opacity: 0, duration: .6 })
      .from(".invite .pc-face", { y: 24, opacity: 0, duration: .6 }, "<.05")
      .from(".invite .pc-bow", { y: -30, rotate: -15, opacity: 0, duration: .7, ease: "back.out(2)" }, "<.15")
      .from(".invite .pc-flower", { opacity: 0, scale: .85, duration: .7 }, "<")
      .from(".card-intro, .pair .person, .pair-amp", { opacity: 0, y: 12, duration: .55, stagger: .08 }, "<.1");
    sway(".invite .pc-flower.tl", 1.8, 6, "0 0");
    sway(".invite .pc-bow", 4, 3, "50% 40%");

    // events
    $$(".ev-card").forEach((card, i) => {
      gsap.timeline({ scrollTrigger: { trigger: card, start: "top 82%" } })
        .from(card, { y: 60, opacity: 0, duration: 1.1, ease: "power3.out", delay: mobile ? 0 : i * .15 })
        .from(card.querySelector(".ev-art"), { scale: 1.12, opacity: 0, duration: 1.4, ease: "power2.out" }, "-=.8")
        .from(card.querySelector(".pc-flower"), { x: -40, y: -30, opacity: 0, duration: 1.1, ease: "power3.out" }, "-=1.1");
      sway(card.querySelector(".pc-flower"), 1.8, 5 + i, "0 0");
    });

    up(".rsvp-card .face.front", ".rsvp-card", { y: 40 });
    gsap.from(".rsvp-flower", { x: 60, y: 60, rotate: 10, opacity: 0, duration: 1.3, ease: "power3.out", scrollTrigger: { trigger: ".rsvp-card", start: "top 75%" } });
    sway(".rsvp-flower", -2, 6, "100% 100%");

    gsap.timeline({ scrollTrigger: { trigger: ".savedate", start: "top 72%" } })
      .from(".sd-sprig.a", { x: -80, y: -60, opacity: 0, duration: 1.4, ease: "power3.out" })
      .from(".sd-sprig.b", { x: 80, y: 60, opacity: 0, duration: 1.4, ease: "power3.out" }, "<.1")
      .from(".savedate .label", { opacity: 0, y: 12, duration: .8 }, "<.2")
      .from(".sd-title", { opacity: 0, y: 30, scale: .96, duration: 1.1, ease: "power3.out" }, "-=.5")
      .from(".sd-date span", { opacity: 0, y: 18, duration: .8, stagger: .14, ease: "power3.out" }, "-=.6")
      .from(".sd-date i", { scale: 0, duration: .5, stagger: .14, ease: "back.out(3)" }, "-=.6")
      .from(".sd-sub, .sd-actions > *", { opacity: 0, y: 12, duration: .8, stagger: .1 }, "-=.4");
    sway(".sd-sprig.a", 1.8, 7, "0 0");
    sway(".sd-sprig.b", -1.8, 8, "100% 100%");

    // closing — arched panel with floral crown
    gsap.timeline({ scrollTrigger: { trigger: ".closing-frame", start: "top 85%" }, defaults: { ease: "power3.out" } })
      .from(".closing-frame .closing-simple", { y: 40, opacity: 0, duration: .9 })
      .from(".cl-crown.l", { x: -60, y: -40, rotate: -8, opacity: 0, duration: 1.1 }, "<.15")
      .from(".cl-crown.r", { x: 60, y: -40, rotate: 8, opacity: 0, duration: 1.1 }, "<.05")
      .from(".cl-base", { opacity: 0, y: 20, duration: .9, stagger: .1 }, "<.2")
      .from(".closing-simple > *", { opacity: 0, y: 12, duration: .6, stagger: .08 }, "<.1")
      .add(() => Petals.setIntensity(1.3));
    sway(".cl-crown.l", 1.6, 6.5, "30% 30%"); sway(".cl-crown.r", -1.6, 7, "70% 30%");
    gsap.from(".gal-title, #gallery .divider", { y: 20, opacity: 0, duration: 1, stagger: .12, ease: "power3.out", scrollTrigger: { trigger: "#gallery", start: "top 80%" } });

    ScrollTrigger.refresh();
  }

  /* ---------------- scratch-to-reveal gold foil ---------------- */
  let revealed = 0;
  $$(".scratch .foil").forEach((cv) => {
    const ctx = cv.getContext("2d");
    let done = false, drawing = false, last = null;
    function paint() {
      const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = r.width, h = r.height;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#9C6B33"); g.addColorStop(.3, "#D6A866"); g.addColorStop(.48, "#F6E2C2"); g.addColorStop(.62, "#BE8A4D"); g.addColorStop(1, "#83562A");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); ctx.fill();
      // foil grain + brushed lines
      for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * .18})`; ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1); }
      ctx.strokeStyle = "rgba(255,246,210,.12)"; ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 8); ctx.stroke(); }
      ctx.fillStyle = "rgba(78,30,20,.75)"; ctx.font = `600 ${Math.max(10, w * .085)}px "Cormorant Garamond", serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("SCRATCH", w / 2, h / 2 - w * .05); ctx.fillText("HERE", w / 2, h / 2 + w * .07);
    }
    document.fonts.ready.then(paint);
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    function scratch(p) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "#000"; ctx.globalAlpha = 1;
      ctx.lineCap = ctx.lineJoin = "round"; ctx.lineWidth = Math.max(26, cv.clientWidth * .2);
      ctx.beginPath(); ctx.moveTo((last || p).x, (last || p).y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p;
    }
    function check() {
      if (done) return;
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let clear = 0, n = 0;
      for (let i = 3; i < d.length; i += 64) { n++; if (d[i] < 40) clear++; }
      // circle covers ~78.5% of the square
      if (clear / n > .5) {
        done = true; cv.classList.add("gone"); revealed++;
        const r = cv.getBoundingClientRect(); Petals.burst(r.left + r.width / 2, r.top + r.height / 2, mobile ? 8 : 12);
        gsap.fromTo(cv.parentElement.querySelector(".medal-val"), { scale: .8 }, { scale: 1, duration: .8, ease: "back.out(2.5)" });
        if (revealed === 3) { $("#scratchHint").style.opacity = 0; }
      }
    }
    cv.addEventListener("pointerdown", (e) => { drawing = true; last = null; cv.setPointerCapture(e.pointerId); scratch(pos(e)); });
    cv.addEventListener("pointermove", (e) => { if (drawing) scratch(pos(e)); });
    const end = () => { if (drawing) { drawing = false; last = null; check(); } };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    addEventListener("resize", () => { if (!done) paint(); });
  });

  /* ---------------- countdown ---------------- */
  const target = new Date(C.weddingDate);
  const journeyStart = new Date(C.journeyStart || "2026-11-24T00:00:00+05:30");
  function updateJourney() {
    const k = Math.max(0, Math.min(1, (Date.now() - journeyStart) / (target - journeyStart)));
    const pct = (Math.max(k, .02) * 100).toFixed(2) + "%";
    $("#jFill").style.width = pct; $("#jHeart").style.left = pct;
  }
  const prev = {};
  function setNum(k, v) {
    const arch = $(`.cd-arch[data-unit="${k}"]`), box = arch.querySelector(".flip-num");
    const s = String(v).padStart(2, "0"); if (prev[k] === s) return;
    const old = box.querySelector("span");
    if (prev[k] === undefined || reduce) { old.textContent = s; prev[k] = s; return; }
    prev[k] = s;
    gsap.timeline()
      .to(old, { rotateX: 90, opacity: 0, duration: .22, ease: "power2.in" })
      .add(() => { old.textContent = s; })
      .fromTo(old, { rotateX: -90, opacity: 0 }, { rotateX: 0, opacity: 1, duration: .32, ease: "back.out(2)" });
    if (k === "seconds") { arch.classList.remove("tick"); void arch.offsetWidth; arch.classList.add("tick"); }
  }
  (function tick() {
    let ms = target - Date.now();
    if (ms <= 0) { $("#cd").hidden = true; $(".journey").hidden = true; $("#cdDone").hidden = false; return; }
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4); ms -= m * 6e4;
    setNum("days", d); setNum("hours", h); setNum("minutes", m); setNum("seconds", Math.floor(ms / 1e3));
    setTimeout(tick, 1000 - (Date.now() % 1000));
  })();
  updateJourney();

  /* ---------------- tap anywhere -> tiny petals ---------------- */
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, a, input, textarea, label, .foil, #cover")) return;
    Petals.sprinkle(e.clientX, e.clientY);
  });

  /* ---------------- photo gallery: 3D coverflow (auto-plays, swipeable) ---------------- */
  (function gallery() {
    const root = $("#coverflow"), dots = $("#cfDots"); if (!root) return;
    const photos = C.gallery && C.gallery.length ? C.gallery : [];
    if (!photos.length) { $("#gallery").remove(); return; }
    const slides = []; while (slides.length < Math.max(5, photos.length)) slides.push(...photos);   // enough cards for a full 3D fan
    slides.forEach((src, i) => { const d = document.createElement("div"); d.className = "cf-card"; d.innerHTML = `<img src="${src}" alt="Jenisha and Jaswanth" loading="lazy" />`; d.addEventListener("click", () => { if (!dragged && i !== cur) go(i, true); }); root.appendChild(d); });
    photos.forEach((_, i) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", `Photo ${i + 1}`); b.addEventListener("click", () => go(closestIndexFor(i), true)); dots.appendChild(b); });
    const cards = $$(".cf-card", root), N = cards.length;
    let cur = 0, timer = null, idleUntil = 0, visible = false, dragged = false;
    const closestIndexFor = (p) => { let best = cur, bd = 1e9; for (let i = 0; i < N; i++) if (i % photos.length === p) { const d = Math.abs(off(i)); if (d < bd) { bd = d; best = i; } } return best; };
    const off = (i) => { let d = i - cur; if (d > N / 2) d -= N; if (d < -N / 2) d += N; return d; };
    function layout() {
      const w = cards[0].offsetWidth, spread = w * (mobile ? .52 : .62);
      cards.forEach((c, i) => {
        const o = off(i), a = Math.abs(o);
        c.style.transform = `translateX(${o * spread}px) translateZ(${-a * 150}px) rotateY(${-Math.sign(o) * Math.min(a, 2) * 32}deg) scale(${1 - Math.min(a, 3) * .1})`;
        c.style.opacity = a > 2 ? 0 : (1 - a * .22).toFixed(2);
        c.style.filter = a ? `brightness(${1 - a * .12}) saturate(${1 - a * .15})` : "none";
        c.style.zIndex = 10 - a; c.style.pointerEvents = a > 2 ? "none" : "auto";
      });
      $$("button", dots).forEach((b, i) => b.classList.toggle("on", i === ((cur % photos.length) + photos.length) % photos.length));
    }
    function go(i, user) { cur = ((i % N) + N) % N; layout(); if (user) idleUntil = Date.now() + 6000; }
    const next = () => go(cur + 1), prev = () => go(cur - 1);
    function tick() { if (visible && Date.now() > idleUntil && !document.hidden) next(); }
    timer = setInterval(tick, 4000);
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: .3 }).observe(root);
    // swipe / drag
    let x0 = null;
    root.addEventListener("pointerdown", (e) => { x0 = e.clientX; dragged = false; idleUntil = Date.now() + 6000; });
    addEventListener("pointerup", (e) => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) { dragged = true; dx < 0 ? go(cur + 1, true) : go(cur - 1, true); setTimeout(() => (dragged = false), 50); } });
    root.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(cur + 1, true); if (e.key === "ArrowLeft") go(cur - 1, true); });
    root.addEventListener("mouseenter", () => (idleUntil = Date.now() + 1e9)); root.addEventListener("mouseleave", () => (idleUntil = Date.now() + 1500));
    addEventListener("resize", layout);
    layout();
  })();

  /* ---------------- RSVP → Google Sheet (Apps Script) ---------------- */
  const form = $("#rsvpForm");
  form.addEventListener("click", (e) => { const b = e.target.closest("[data-step]"); if (!b) return;
    form.guestCount.value = Math.min(10, Math.max(1, (+form.guestCount.value || 1) + +b.dataset.step)); });
  form.addEventListener("change", () => form.querySelector(".yes-only").classList.toggle("off", form.attending.value === "No"));

  async function sendRSVP(payload) {
    const body = JSON.stringify(payload);
    try {
      // Apps Script allows CORS for text/plain POSTs, so we can read its JSON reply
      const r = await fetch(C.rsvp.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body });
      const res = await r.json();
      if (!res.success) throw Object.assign(new Error(res.message || "Could not save RSVP"), { fromServer: true });
      return true;
    } catch (e) {
      if (e.fromServer) throw e;
      // network / CORS hiccup: send anyway without reading the reply
      await fetch(C.rsvp.endpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body });
      return true;
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = form.querySelector(".form-err"); err.textContent = "";
    const fd = new FormData(form);
    const guestName = (fd.get("guestName") || "").trim();
    const attending = fd.get("attending");
    if (!guestName) { err.textContent = "Please tell us your name."; form.guestName.focus(); return; }
    const payload = { guestName, attending, guestCount: attending === "Yes" ? Math.max(1, +fd.get("guestCount") || 1) : 0 };

    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Sending…";
    try {
      if (C.rsvp.endpoint) await sendRSVP(payload);
      const all = JSON.parse(localStorage.getItem("rsvp") || "[]"); all.push({ ...payload, at: new Date().toISOString() }); localStorage.setItem("rsvp", JSON.stringify(all));
      const fn = guestName.split(" ")[0];
      $(".thanks-msg").textContent = attending === "Yes" ? `Dear ${fn}, we can't wait to celebrate with you!` : `Dear ${fn}, we'll miss you — thank you for your blessings.`;
      $(".flip").classList.add("done");
      const r = $(".rsvp-card").getBoundingClientRect(); Petals.burst(r.left + r.width / 2, r.top + r.height / 2, mobile ? 10 : 16);
    } catch (x) { err.textContent = x.fromServer ? x.message : "Something went wrong — please try again."; }
    finally { btn.disabled = false; btn.textContent = "Send RSVP"; }
  });
})();
