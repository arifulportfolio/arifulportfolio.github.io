// Scroll-reveal for cards and timeline items
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach(function (e) { io.observe(e); });
})();

// Hero background: tracer particles advected through potential flow past a
// cylinder with a pair of trailing vortices (a nod to PIV seeding particles).
(function () {
  var c = document.getElementById("flow");
  if (!c) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = c.getContext("2d"), W, H, dpr, parts = [], N, t = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = c.clientWidth; H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    N = Math.round(Math.min(900, W * H / 900));
    parts = [];
    for (var i = 0; i < N; i++) parts.push(spawn(true));
    ctx.fillStyle = "#0a1a2f"; ctx.fillRect(0, 0, W, H);
  }
  // turbo colormap (Google AI, 2019) sampled at 9 stops
  var TURBO = [[48,18,59],[70,98,215],[54,170,249],[26,228,182],[114,254,94],[200,239,52],[250,186,57],[246,107,25],[202,42,4]];
  function turbo(x) {
    x = Math.max(0, Math.min(1, x)) * (TURBO.length - 1);
    var i = Math.floor(x), f = x - i, a = TURBO[i], b = TURBO[Math.min(i + 1, TURBO.length - 1)];
    return "rgba(" + Math.round(a[0] + (b[0] - a[0]) * f) + "," + Math.round(a[1] + (b[1] - a[1]) * f) + "," + Math.round(a[2] + (b[2] - a[2]) * f) + ",0.9)";
  }
  function spawn(anywhere) {
    return { x: anywhere ? Math.random() * W : -10, y: Math.random() * H, age: Math.random() * 200 };
  }
  // velocity field in pixel units
  function vel(x, y) {
    var cx = W * 0.72, cy = H * 0.45, R = Math.min(W, H) * 0.12, U = 1.2;
    var dx = (x - cx) / R, dy = (y - cy) / R, r2 = dx * dx + dy * dy;
    if (r2 < 1) return [U, 0];
    // uniform flow + doublet (cylinder)
    var u = U * (1 - (dx * dx - dy * dy) / (r2 * r2));
    var v = -U * (2 * dx * dy) / (r2 * r2);
    // two counter-rotating wake vortices that oscillate (vortex-street feel)
    var s = Math.sin(t * 0.01);
    var vs = [[1.9, 0.55 + 0.25 * s, 1.1], [1.9, -0.55 + 0.25 * s, -1.1], [3.4, 0.5 - 0.25 * s, -0.8], [3.4, -0.5 - 0.25 * s, 0.8]];
    for (var k = 0; k < vs.length; k++) {
      var ex = dx - vs[k][0], ey = dy - vs[k][1], e2 = ex * ex + ey * ey + 0.15;
      u += -vs[k][2] * ey / e2; v += vs[k][2] * ex / e2;
    }
    return [u, v];
  }
  function frame() {
    t++;
    ctx.fillStyle = "rgba(10, 26, 47, 0.09)";
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], a = vel(p.x, p.y);
      var sp = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
      var nx = p.x + a[0] * 1.6, ny = p.y + a[1] * 1.6;
      ctx.strokeStyle = turbo(0.12 + sp / 2.3); // colour by |U|/U_inf, 0..2
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
      p.x = nx; p.y = ny; p.age++;
      if (p.x > W + 10 || p.y < -10 || p.y > H + 10 || p.age > 600 || !isFinite(p.x)) parts[i] = spawn(false);
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  window.addEventListener("resize", resize);
  resize();
  if (reduce) { for (var k = 0; k < 120; k++) frame(); } else requestAnimationFrame(frame);
})();
