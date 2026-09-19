/* CROWN & BLADE Barber Co. — WebGL hero: a refined 3D barber pole */
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
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, isMobile ? 10 : 8.5);

  /* on narrow screens there's no clear space beside the copy for a solid object
     without colliding with it, so the pole is desktop-only; mobile keeps just
     the ambient glow + particles below for a lighter, text-forward hero */
  const showPole = !isMobile;
  const poleGroup = new THREE.Group();
  poleGroup.position.set(3.1, -0.15, 0);
  if(showPole) scene.add(poleGroup);

  /* refined diagonal stripe texture — deep wine, warm ivory, aged brass, with a soft
     vertical shading gradient baked in so the flat cylinder reads as rounded glass */
  function makeStripeTexture(){
    const c = document.createElement('canvas');
    c.width = 160; c.height = 320;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#e6d9be';
    ctx.fillRect(0,0,c.width,c.height);

    const stripeW = 22;
    ctx.save();
    ctx.translate(c.width/2, c.height/2);
    ctx.rotate(Math.PI/4);
    ctx.translate(-c.width, -c.height*1.1);
    const colors = ['#5c1c22', '#a9803f'];
    for(let i=0, ci=0; i<c.width*4.5/stripeW; i++){
      if(i % 3 === 2) continue;
      ctx.fillStyle = colors[ci % colors.length];
      ctx.fillRect(i*stripeW, 0, stripeW*0.56, c.height*2.4);
      ci++;
    }
    ctx.restore();

    /* fake cylindrical shading: darker at the seams, a soft highlight left-of-center */
    const shade = ctx.createLinearGradient(0, 0, c.width, 0);
    shade.addColorStop(0, 'rgba(0,0,0,.55)');
    shade.addColorStop(0.32, 'rgba(255,240,210,.18)');
    shade.addColorStop(0.55, 'rgba(0,0,0,0)');
    shade.addColorStop(0.85, 'rgba(0,0,0,.35)');
    shade.addColorStop(1, 'rgba(0,0,0,.6)');
    ctx.fillStyle = shade;
    ctx.fillRect(0,0,c.width,c.height);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2.6);
    tex.anisotropy = 4;
    return tex;
  }
  const stripeTex = makeStripeTexture();

  const poleHeight = isMobile ? 3.0 : 3.7;
  const poleRadius = isMobile ? 0.34 : 0.42;
  const bodyGeo = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 48, 1, true);
  const bodyMat = new THREE.MeshBasicMaterial({ map: stripeTex });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  poleGroup.add(body);

  const capMat = new THREE.MeshBasicMaterial({ color: 0xa9803f });
  const capH = poleHeight * 0.045;
  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(poleRadius*1.16, poleRadius*1.05, capH, 32), capMat);
  topCap.position.y = poleHeight/2 + capH/2;
  poleGroup.add(topCap);
  const topKnob = new THREE.Mesh(new THREE.SphereGeometry(poleRadius*0.62, 24, 24), capMat);
  topKnob.position.y = poleHeight/2 + capH + poleRadius*0.5;
  poleGroup.add(topKnob);
  const botCap = new THREE.Mesh(new THREE.CylinderGeometry(poleRadius*1.05, poleRadius*1.16, capH, 32), capMat);
  botCap.position.y = -poleHeight/2 - capH/2;
  poleGroup.add(botCap);

  /* soft glass sheen so it reads as an illuminated fixture, not solid plastic */
  const glassGeo = new THREE.CylinderGeometry(poleRadius*1.1, poleRadius*1.1, poleHeight*0.98, 48, 1, true);
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xfff6e8, transparent:true, opacity:.08, side: THREE.DoubleSide });
  poleGroup.add(new THREE.Mesh(glassGeo, glassMat));

  /* warm ambient glow behind the pole */
  function makeGlowTexture(){
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128,128,0,128,128,128);
    g.addColorStop(0, 'rgba(214,180,118,.55)');
    g.addColorStop(0.5, 'rgba(169,128,63,.18)');
    g.addColorStop(1, 'rgba(169,128,63,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,256,256);
    return new THREE.CanvasTexture(c);
  }
  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), transparent:true, depthWrite:false }));
  glowSprite.scale.set(poleHeight*2.2, poleHeight*2.2, 1);
  glowSprite.position.set(0, -0.4, 0);
  if(showPole){ glowSprite.position.copy(poleGroup.position); scene.add(glowSprite); }
  else { glowSprite.scale.set(6, 6, 1); scene.add(glowSprite); }

  /* fine floating dust particles, warm brass tone */
  const particleCount = isMobile ? 140 : 360;
  const positions = new Float32Array(particleCount * 3);
  for(let i=0;i<particleCount;i++){
    positions[i*3]   = (Math.random()-0.5) * 20;
    positions[i*3+1] = (Math.random()-0.5) * 13;
    positions[i*3+2] = (Math.random()-0.5) * 12;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({ color:0xd6b476, size:0.026, transparent:true, opacity:.45 });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

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

    stripeTex.offset.y = -t * 0.32;
    poleGroup.rotation.y = Math.sin(t * 0.2) * 0.1;
    particles.rotation.y = t * 0.012;

    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;
    camera.position.x = targetX * 1.1;
    camera.position.y = -targetY * 0.7;
    camera.lookAt(poleGroup.position.x * 0.3, poleGroup.position.y * 0.3, 0);

    renderer.render(scene, camera);
  }
  animate();

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
