/* =========================================================
   VELMORA — Hero 3D showpiece (Three.js)
   A stylised low-poly armchair, auto-rotating, drag-to-spin,
   with a soft contact shadow and warm studio lighting.
   ========================================================= */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("heroCanvas");
if (canvas) {
  const stage = canvas.parentElement;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(3.4, 2.1, 5.2);
  camera.lookAt(0, 0.6, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);
  new ResizeObserver(resize).observe(stage);

  /* ---------- Lights ---------- */
  scene.add(new THREE.AmbientLight(0xfff3e6, 0.55));

  const key = new THREE.DirectionalLight(0xfff0dd, 1.4);
  key.position.set(4, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  scene.add(key);

  const rim = new THREE.PointLight(0xc98a3e, 6, 12);
  rim.position.set(-3, 2.4, -3);
  scene.add(rim);

  const fill = new THREE.PointLight(0xffffff, 1.2, 10);
  fill.position.set(-2, 1, 3);
  scene.add(fill);

  /* ---------- Contact shadow (soft radial texture) ---------- */
  function makeShadowTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(20,15,10,0.45)");
    g.addColorStop(1, "rgba(20,15,10,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }
  const shadowMat = new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false });
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.001;
  scene.add(shadowPlane);

  const groundReceiver = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.ShadowMaterial({ opacity: 0.18 })
  );
  groundReceiver.rotation.x = -Math.PI / 2;
  groundReceiver.position.y = -1;
  groundReceiver.receiveShadow = true;
  scene.add(groundReceiver);

  /* ---------- Build a stylised armchair ---------- */
  const chair = new THREE.Group();

  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4326, roughness: 0.55, metalness: 0.08 });
  const upholstery = new THREE.MeshStandardMaterial({ color: 0xc98a3e, roughness: 0.75, metalness: 0.02 });
  const cushion = new THREE.MeshStandardMaterial({ color: 0xf4e3c8, roughness: 0.8, metalness: 0.02 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x3c4a3a, roughness: 0.6, metalness: 0.1 });

  function addMesh(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    chair.add(m);
    return m;
  }

  // Seat base
  addMesh(new THREE.BoxGeometry(1.7, 0.28, 1.5), upholstery, 0, -0.15, 0);
  // Seat cushion
  addMesh(new THREE.BoxGeometry(1.56, 0.22, 1.36), cushion, 0, 0.03, 0.02);
  // Backrest frame
  addMesh(new THREE.BoxGeometry(1.7, 1.3, 0.26), upholstery, 0, 0.75, -0.68, -0.06);
  // Backrest cushion
  addMesh(new THREE.BoxGeometry(1.5, 1.1, 0.16), cushion, 0, 0.78, -0.56, -0.06);
  // Armrests
  addMesh(new THREE.BoxGeometry(0.26, 0.55, 1.5), wood, -0.86, 0.18, 0);
  addMesh(new THREE.BoxGeometry(0.26, 0.55, 1.5), wood, 0.86, 0.18, 0);
  addMesh(new THREE.BoxGeometry(0.3, 0.08, 1.54), accent, -0.86, 0.47, 0);
  addMesh(new THREE.BoxGeometry(0.3, 0.08, 1.54), accent, 0.86, 0.47, 0);
  // Legs
  const legGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.62, 12);
  addMesh(legGeo, wood, -0.72, -0.6, 0.62, 0, 0, 0.05);
  addMesh(legGeo, wood, 0.72, -0.6, 0.62, 0, 0, -0.05);
  addMesh(legGeo, wood, -0.72, -0.6, -0.62, 0, 0, 0.05);
  addMesh(legGeo, wood, 0.72, -0.6, -0.62, 0, 0, -0.05);
  // Throw pillow accent
  const pillow = addMesh(new THREE.BoxGeometry(0.42, 0.42, 0.16), accent, -0.35, 0.42, 0.2, 0.1, 0.5, 0.05);
  pillow.geometry = new THREE.BoxGeometry(0.42, 0.42, 0.16);

  chair.position.y = -0.15;
  chair.rotation.y = 0.5;
  scene.add(chair);

  /* ---------- Interaction: drag to spin, else gentle auto-rotate ---------- */
  let dragging = false;
  let lastX = 0;
  let velocity = 0.004;
  let targetVelocity = 0.004;

  const startDrag = (x) => {
    dragging = true;
    lastX = x;
    targetVelocity = 0;
  };
  const moveDrag = (x) => {
    if (!dragging) return;
    const dx = x - lastX;
    chair.rotation.y += dx * 0.01;
    lastX = x;
  };
  const endDrag = () => {
    dragging = false;
    targetVelocity = 0.004;
  };

  canvas.addEventListener("pointerdown", (e) => startDrag(e.clientX));
  window.addEventListener("pointermove", (e) => moveDrag(e.clientX));
  window.addEventListener("pointerup", endDrag);
  canvas.addEventListener(
    "touchstart",
    (e) => startDrag(e.touches[0].clientX),
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => moveDrag(e.touches[0].clientX),
    { passive: true }
  );
  canvas.addEventListener("touchend", endDrag);

  /* ---------- Mouse-follow subtle camera parallax ---------- */
  let mouseX = 0,
    mouseY = 0;
  window.addEventListener("pointermove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ---------- Render loop ---------- */
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    velocity += (targetVelocity - velocity) * 0.05;
    if (!dragging) chair.rotation.y += velocity;
    chair.position.y = -0.15 + Math.sin(t * 1.1) * 0.045;

    camera.position.x += ((3.4 + mouseX * 0.6) - camera.position.x) * 0.04;
    camera.position.y += ((2.1 - mouseY * 0.4) - camera.position.y) * 0.04;
    camera.lookAt(0, 0.55, 0);

    renderer.render(scene, camera);
  }
  animate();
}
