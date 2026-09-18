/* VELVET Salon & Spa — WebGL hero (Three.js) with graceful degrade */
(function(){
  "use strict";
  const canvas = document.getElementById('hero-canvas');
  if(!canvas || typeof THREE === 'undefined') return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const isMobile = window.innerWidth < 780;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, isMobile ? 9 : 7.5);

  /* Central rotating gem — icosahedron wireframe, gold */
  const gemGeo = new THREE.IcosahedronGeometry(isMobile ? 1.7 : 2.1, 1);
  const gemMat = new THREE.MeshBasicMaterial({ color: 0xc9a15a, wireframe:true, transparent:true, opacity:.55 });
  const gem = new THREE.Mesh(gemGeo, gemMat);
  gem.position.set(isMobile ? 0 : 2.4, isMobile ? 1.6 : 0.3, 0);
  scene.add(gem);

  const gemGeo2 = new THREE.IcosahedronGeometry(isMobile ? 1.1 : 1.35, 0);
  const gemMat2 = new THREE.MeshBasicMaterial({ color: 0xe8cf9e, wireframe:true, transparent:true, opacity:.35 });
  const gem2 = new THREE.Mesh(gemGeo2, gemMat2);
  gem2.position.copy(gem.position);
  scene.add(gem2);

  /* Particle field */
  const particleCount = isMobile ? 260 : 700;
  const positions = new Float32Array(particleCount * 3);
  for(let i=0;i<particleCount;i++){
    positions[i*3]   = (Math.random()-0.5) * 22;
    positions[i*3+1] = (Math.random()-0.5) * 14;
    positions[i*3+2] = (Math.random()-0.5) * 14;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({ color:0xe8cf9e, size:0.035, transparent:true, opacity:.75 });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* soft ring */
  const ringGeo = new THREE.TorusGeometry(isMobile ? 2.6 : 3.3, 0.006, 8, 120);
  const ringMat = new THREE.MeshBasicMaterial({ color:0xc9a15a, transparent:true, opacity:.4 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(gem.position);
  ring.rotation.x = Math.PI/2.4;
  scene.add(ring);

  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  window.addEventListener('mousemove', (e)=>{
    mouseX = (e.clientX/window.innerWidth - 0.5);
    mouseY = (e.clientY/window.innerHeight - 0.5);
  });

  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let raf;
  const clock = new THREE.Clock();
  function animate(){
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    gem.rotation.y = t * 0.18;
    gem.rotation.x = t * 0.09;
    gem2.rotation.y = -t * 0.14;
    gem2.rotation.x = t * 0.11;
    ring.rotation.z = t * 0.06;
    particles.rotation.y = t * 0.02;

    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;
    camera.position.x = targetX * 1.4;
    camera.position.y = -targetY * 1.0;
    camera.lookAt(gem.position.x * 0.3, gem.position.y * 0.3, 0);

    renderer.render(scene, camera);
  }
  animate();

  /* Pause rendering when hero is off-screen to save battery */
  const heroEl = canvas.closest('.hero');
  if(heroEl && 'IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){ if(!raf) animate(); }
        else { cancelAnimationFrame(raf); raf = null; }
      });
    }, {threshold:0});
    io.observe(heroEl);
  }
})();
