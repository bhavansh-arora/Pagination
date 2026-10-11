/* =========================================================
   AURELIA — WebGL hero: a living galaxy of light
   Requires three.js (loaded before this file)
   ========================================================= */
(function () {
  "use strict";
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.innerWidth < 760;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return; } // no WebGL — CSS glow remains as fallback

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07060b, 0.035);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 2.2, mobile ? 13 : 10);

  // soft round sprite
  const spr = document.createElement("canvas");
  spr.width = spr.height = 64;
  const g = spr.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,.8)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(spr);

  /* ---- Galaxy ---- */
  const COUNT = mobile ? 4500 : 11000;
  const BRANCHES = 4, RADIUS = 9, SPIN = 1.1, RAND = 0.55, POW = 3;
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const inside = new THREE.Color("#f8e2ad");
  const mid = new THREE.Color("#ff5d95");
  const outside = new THREE.Color("#7c4dff");
  for (let i = 0; i < COUNT; i++) {
    const r = Math.pow(Math.random(), 1.6) * RADIUS;
    const branch = ((i % BRANCHES) / BRANCHES) * Math.PI * 2;
    const spin = r * SPIN;
    const rx = Math.pow(Math.random(), POW) * (Math.random() < 0.5 ? 1 : -1) * RAND * r;
    const ry = Math.pow(Math.random(), POW) * (Math.random() < 0.5 ? 1 : -1) * RAND * r * 0.5;
    const rz = Math.pow(Math.random(), POW) * (Math.random() < 0.5 ? 1 : -1) * RAND * r;
    pos[i * 3] = Math.cos(branch + spin) * r + rx;
    pos[i * 3 + 1] = ry;
    pos[i * 3 + 2] = Math.sin(branch + spin) * r + rz;
    const t = r / RADIUS;
    const c = t < 0.45 ? inside.clone().lerp(mid, t / 0.45) : mid.clone().lerp(outside, (t - 0.45) / 0.55);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: mobile ? 0.09 : 0.075, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const galaxy = new THREE.Points(geo, mat);
  galaxy.rotation.x = 0.35;
  scene.add(galaxy);

  /* ---- Distant star dust ---- */
  const DUST = mobile ? 600 : 1500;
  const dpos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dpos[i * 3] = (Math.random() - 0.5) * 60;
    dpos[i * 3 + 1] = (Math.random() - 0.5) * 40;
    dpos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;
  }
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ size: 0.08, map: sprite, color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* ---- Glowing core + orbit rings ---- */
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.9, 1),
    new THREE.MeshBasicMaterial({ color: 0xf8e2ad, wireframe: true, transparent: true, opacity: 0.55 })
  );
  galaxy.add(core);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: 0xffc97a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.set(5, 5, 1);
  galaxy.add(halo);

  const rings = [];
  [[2.4, 0xe8c27a, 0.5], [3.4, 0xff5d95, 0.3], [4.6, 0x8b5cf6, 0.25]].forEach(([r, c, o], i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.012, 8, 160),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending })
    );
    ring.rotation.x = Math.PI / 2 + (i - 1) * 0.35;
    ring.rotation.y = i * 0.4;
    galaxy.add(ring);
    rings.push(ring);
  });

  /* ---- Resize ---- */
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // shift galaxy right on wide screens so text stays readable
    galaxy.position.x = w > 1080 ? 3.2 : 0;
    galaxy.position.y = w > 1080 ? 0 : -1.6;
    mat.opacity = w > 1080 ? 1 : 0.7;
  };
  resize();
  window.addEventListener("resize", resize);

  /* ---- Interaction ---- */
  let mx = 0, my = 0, tx = 0, ty = 0, scrollK = 0;
  window.addEventListener("pointermove", (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 30));
    ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  }, { passive: true });
  window.addEventListener("scroll", () => { scrollK = Math.min(window.scrollY / window.innerHeight, 1.5); }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  const baseZ = camera.position.z;
  const loop = () => {
    requestAnimationFrame(loop);
    if (!visible) return;
    const t = clock.getElapsedTime();
    const speed = reduced ? 0 : 1;
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
    galaxy.rotation.y = t * 0.06 * speed + mx * 0.3;
    galaxy.rotation.x = 0.35 + my * 0.15 + scrollK * 0.4;
    core.rotation.x = t * 0.4 * speed; core.rotation.y = t * 0.3 * speed;
    halo.material.opacity = 0.75 + Math.sin(t * 2) * 0.15;
    rings.forEach((r, i) => { r.rotation.z = t * (0.15 + i * 0.07) * speed * (i % 2 ? -1 : 1); });
    dust.rotation.y = t * 0.01 * speed;
    camera.position.x = mx * 0.8;
    camera.position.y = 2.2 - my * 0.6;
    camera.position.z = baseZ - scrollK * 3.5;
    camera.lookAt(galaxy.position.x * 0.4, 0, 0);
    renderer.render(scene, camera);
  };
  loop();
})();
