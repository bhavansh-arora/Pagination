/* CROWN & BLADE Barber Co. — WebGL hero: a spinning 3D barber pole */
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
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, isMobile ? 9 : 7.5);

  const poleGroup = new THREE.Group();
  poleGroup.position.set(isMobile ? 0 : 2.6, isMobile ? 0.6 : -0.2, 0);
  scene.add(poleGroup);

  /* candy-stripe texture, generated on a canvas — classic red / cream / brass diagonal stripes */
  function makeStripeTexture(){
    const c = document.createElement('canvas');
    c.width = 128; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f5ece0';
    ctx.fillRect(0,0,c.width,c.height);
    const stripeW = 32;
    ctx.save();
    ctx.translate(c.width/2, c.height/2);
    ctx.rotate(Math.PI/4);
    ctx.translate(-c.width, -c.height);
    for(let i=0; i<c.width*4/stripeW; i++){
      ctx.fillStyle = i % 2 === 0 ? '#9c2b2b' : '#b8863f';
      if(i % 3 === 2) continue;
      ctx.fillRect(i*stripeW, 0, stripeW*0.62, c.height*2);
    }
    ctx.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2.4);
    return tex;
  }
  const stripeTex = makeStripeTexture();

  const poleHeight = isMobile ? 4.4 : 5.4;
  const poleRadius = isMobile ? 0.62 : 0.75;
  const bodyGeo = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 48, 1, true);
  const bodyMat = new THREE.MeshBasicMaterial({ map: stripeTex });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  poleGroup.add(body);

  const capMat = new THREE.MeshBasicMaterial({ color: 0xb8863f });
  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(poleRadius*1.12, poleRadius*1.12, poleHeight*0.05, 32), capMat);
  topCap.position.y = poleHeight/2 + poleHeight*0.025;
  poleGroup.add(topCap);
  const topKnob = new THREE.Mesh(new THREE.SphereGeometry(poleRadius*0.55, 24, 24), capMat);
  topKnob.position.y = poleHeight/2 + poleHeight*0.09;
  poleGroup.add(topKnob);
  const botCap = new THREE.Mesh(new THREE.CylinderGeometry(poleRadius*1.12, poleRadius*1.12, poleHeight*0.05, 32), capMat);
  botCap.position.y = -poleHeight/2 - poleHeight*0.025;
  poleGroup.add(botCap);

  /* soft glass housing so it reads as a barber-pole light, not a bare cylinder */
  const glassGeo = new THREE.CylinderGeometry(poleRadius*1.18, poleRadius*1.18, poleHeight*0.96, 48, 1, true);
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent:true, opacity:.06, side: THREE.DoubleSide });
  poleGroup.add(new THREE.Mesh(glassGeo, glassMat));

  /* warm floating dust particles */
  const particleCount = isMobile ? 180 : 480;
  const positions = new Float32Array(particleCount * 3);
  for(let i=0;i<particleCount;i++){
    positions[i*3]   = (Math.random()-0.5) * 20;
    positions[i*3+1] = (Math.random()-0.5) * 13;
    positions[i*3+2] = (Math.random()-0.5) * 12;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({ color:0xe2b76e, size:0.032, transparent:true, opacity:.55 });
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

    stripeTex.offset.y = -t * 0.5;
    poleGroup.rotation.y = Math.sin(t * 0.25) * 0.15;
    particles.rotation.y = t * 0.015;

    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;
    camera.position.x = targetX * 1.3;
    camera.position.y = -targetY * 0.9;
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
