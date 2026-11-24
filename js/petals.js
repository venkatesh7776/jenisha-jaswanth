/* Falling petals — single canvas, sprite petals cut from the generated art.
   The screen starts pre-seeded at a steady density (no slow build-up), and the
   number of ambient petals never exceeds the target, so it never gets heavy.
   API: Petals.start(), setIntensity(0..2), setSpeed(x), burst(x,y,n), sprinkle(x,y,n), releaseFrom(el,n) */
(function () {
  const canvas = document.getElementById("petals");
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 720px)").matches;
  const BASE = mobile ? 7 : 16;            // ambient petals on screen
  const sprites = [];
  let W = 0, H = 0, dpr = 1, running = false, intensity = 1, speed = 1, last = 0, spawnAcc = 0, seeded = false;
  const parts = [];

  let loaded = 0;
  for (let i = 1; i <= 16; i++) {
    const img = new Image();
    img.src = `assets/img/petals/petal_${String(i).padStart(2, "0")}.webp`;
    img.onload = () => { sprites.push(img); if (++loaded === 4) seed(); };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize); resize();

  const rand = (a, b) => a + Math.random() * (b - a);
  const AVG_VY = 19 * (mobile ? .8 : 1);

  function make(x, y, opts = {}) {
    const depth = opts.depth ?? Math.random();           // 0 = far, 1 = near
    const size = (mobile ? 12 : 14) + depth * (mobile ? 10 : 14);
    return {
      img: sprites[(Math.random() * sprites.length) | 0],
      x, y, size, depth, ambient: !!opts.ambient,
      vx: opts.vx ?? rand(-6, 8),
      vy: opts.vy ?? rand(14, 24) * (0.7 + depth * 0.5) * (mobile ? .8 : 1),
      rot: rand(0, Math.PI * 2), vr: rand(-.45, .45),
      swayA: rand(10, 22), swayF: rand(0.35, 0.7), swayP: rand(0, 6.28),
      flipF: rand(0.6, 1.2), flipP: rand(0, 6.28),
      alpha: 0, life: 0, gravity: opts.gravity ?? 0,
      drag: opts.drag ?? 0,
    };
  }
  const ambientCount = () => parts.reduce((n, p) => n + (p.ambient ? 1 : 0), 0);

  // fill the whole screen at once so petals are there from the first second
  function seed() {
    if (seeded || reduce || !started) return;
    seeded = true;
    const n = Math.round(BASE * intensity);
    for (let i = 0; i < n; i++) { const p = make(rand(0, W), rand(-20, H * .95), { ambient: true }); p.life = rand(0, 3); parts.push(p); }
  }
  function spawnTop() {
    if (!sprites.length) return;
    parts.push(make(rand(-0.05, 1.05) * W, rand(-50, -15), { ambient: true }));
  }

  function step(t) {
    if (!running) return;
    const dt = Math.min((t - last) / 1000 || 0.016, 0.05); last = t;
    const target = Math.round(BASE * intensity);
    // spawn exactly as fast as petals leave the screen -> constant density
    spawnAcc += dt * target * (AVG_VY * speed) / (H + 70);
    while (spawnAcc > 1) { spawnAcc--; if (ambientCount() < target) spawnTop(); }

    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy += (p.gravity - p.vy * p.drag) * dt; }
      const k = p.ambient ? speed : 1;
      p.x += (p.vx + Math.cos(p.life * p.swayF + p.swayP) * p.swayA) * dt;
      p.y += p.vy * k * dt;
      p.rot += p.vr * dt;
      p.alpha = Math.min(1, p.life * 0.8);
      if (p.ttl) { p.ttl -= dt; if (p.ttl <= 0) { parts.splice(i, 1); continue; } }
      if (p.y > H + 60 || p.x < -80 || p.x > W + 80) { parts.splice(i, 1); continue; }
      const flip = Math.cos(p.life * p.flipF + p.flipP);           // 3D flutter
      ctx.save();
      ctx.globalAlpha = p.alpha * (0.5 + p.depth * 0.35) * (p.ttl !== undefined ? Math.min(1, p.ttl / .6) : 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(0.35 + Math.abs(flip) * 0.65, 1);
      const s = p.size, r = p.img.width / p.img.height;
      ctx.drawImage(p.img, -s * r / 2, -s / 2, s * r, s);
      ctx.restore();
    }
    requestAnimationFrame(step);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) running = false;
    else if (started && !reduce) { running = true; last = performance.now(); requestAnimationFrame(step); }
  });

  let started = false;
  window.Petals = {
    start() {
      if (reduce || started) return;
      started = running = true; last = performance.now();
      if (loaded >= 4) seed();
      requestAnimationFrame(step);
    },
    setIntensity(v) { intensity = v; },
    // smoothly ease the fall speed (e.g. quicker on the opening screen, gentle afterwards)
    setSpeed(v, ms = 1500) {
      const from = speed, t0 = performance.now();
      (function f(t) { const k = Math.min(1, (t - t0) / ms); speed = from + (v - from) * (k * k * (3 - 2 * k)); if (k < 1) requestAnimationFrame(f); })(t0);
    },
    burst(x, y, n = 24) {
      if (reduce || !sprites.length) return;
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(80, 220);
        parts.push(make(x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, gravity: 60, drag: 1.8, depth: rand(.4, 1) }));
      }
    },
    sprinkle(x, y, n = 7) {
      if (reduce || !sprites.length) return;
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(40, 110);
        const q = make(x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, gravity: 40, drag: 2.2, depth: rand(.1, .5) });
        q.size *= .55; q.ttl = rand(1.4, 2.2); q.life = .6; parts.push(q);
      }
    },
    releaseFrom(el, n = 6) {
      if (reduce || !el) return;
      const r = el.getBoundingClientRect();
      for (let i = 0; i < n; i++) {
        setTimeout(() => sprites.length && parts.push(make(rand(r.left, r.right), rand(r.top + r.height * .2, r.bottom * .8), { vy: rand(20, 40), depth: rand(.3, 1) })), i * 140);
      }
    },
  };
})();
