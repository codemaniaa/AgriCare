// src/pages/landing/ThreeScene.js
// Reusable Three.js scene builder — mobile-optimised, memory-safe
import * as THREE from 'three';

/**
 * createHeroScene(canvas)
 * Mounts an animated 3D scene onto a given <canvas> element.
 * Returns a dispose() function — call it in useEffect cleanup.
 */
export function createHeroScene(canvas) {
  if (!canvas) return { dispose: () => {} };

  const isMobile = window.innerWidth < 768;
  const W = canvas.clientWidth  || window.innerWidth;
  const H = canvas.clientHeight || 500;

  // ── Renderer ───────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias:   !isMobile,
    alpha:       true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);

  // ── Scene / camera ─────────────────────────────────────────────
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
  camera.position.set(0, 0, 7);

  // ── Lighting ───────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x1a4a1a, 1.5));

  const dirLight = new THREE.DirectionalLight(0x3ddc6c, 3.0);
  dirLight.position.set(5, 8, 5);
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0xa8f059, 1.0);
  rimLight.position.set(-6, 2, -4);
  scene.add(rimLight);

  const pointLight = new THREE.PointLight(0x5fee8a, 1.8, 18);
  pointLight.position.set(0, 2, 4);
  scene.add(pointLight);

  // ── Central gem ────────────────────────────────────────────────
  const centerGeo = new THREE.IcosahedronGeometry(1.4, isMobile ? 2 : 3);
  const centerMat = new THREE.MeshStandardMaterial({
    color:             0x1a5e2a,
    emissive:          0x3ddc6c,
    emissiveIntensity: 0.3,
    roughness:         0.18,
    metalness:         0.75,
  });
  const centerMesh = new THREE.Mesh(centerGeo, centerMat);
  scene.add(centerMesh);

  // Inner wireframe shell
  const shellMat = new THREE.MeshBasicMaterial({
    color:     0x3ddc6c,
    wireframe: true,
    opacity:   0.12,
    transparent: true,
  });
  const shellMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.65, isMobile ? 2 : 3),
    shellMat,
  );
  scene.add(shellMesh);

  // ── Orbital rings ──────────────────────────────────────────────
  const makeRing = (radius, tube, color, opacity, rx, ry, rz) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 6, isMobile ? 40 : 80),
      new THREE.MeshBasicMaterial({ color, opacity, transparent: true }),
    );
    m.rotation.set(rx, ry, rz);
    scene.add(m);
    return m;
  };

  const ring1 = makeRing(2.2, 0.04, 0x3ddc6c, 0.30, Math.PI / 2.5, 0, 0);
  const ring2 = makeRing(2.9, 0.02, 0x5fee8a, 0.15, Math.PI / 3,   0, Math.PI / 6);
  const ring3 = makeRing(3.5, 0.015,0xa8f059, 0.08, Math.PI / 5,   Math.PI / 4, 0);

  // ── Orbiting satellites ────────────────────────────────────────
  const ORBITERS = [];
  const orbitCount = isMobile ? 5 : 9;

  for (let i = 0; i < orbitCount; i++) {
    const geos = [
      new THREE.OctahedronGeometry(0.18 + (i % 3) * 0.06, 0),
      new THREE.TetrahedronGeometry(0.20 + (i % 2) * 0.08, 0),
      new THREE.IcosahedronGeometry(0.15 + (i % 4) * 0.04, 1),
      new THREE.BoxGeometry(0.22, 0.22, 0.22),
      new THREE.CylinderGeometry(0, 0.18, 0.35, 5, 1),
    ];
    const geo = geos[i % geos.length];
    const hue = 0.32 + (i / orbitCount) * 0.14;
    const mat = new THREE.MeshStandardMaterial({
      color:             new THREE.Color().setHSL(hue, 0.78, 0.38),
      emissive:          new THREE.Color().setHSL(hue, 0.65, 0.14),
      emissiveIntensity: 0.55,
      roughness:         0.28,
      metalness:         0.45,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const angle  = (i / orbitCount) * Math.PI * 2;
    const layer  = i % 3; // 0=inner 1=mid 2=outer
    const radius = [2.2, 2.7, 3.4][layer];
    mesh.userData = {
      angle,
      speed:   0.005 - layer * 0.001 + (i % 2) * 0.0006,
      radius,
      yBias:   Math.sin(i * 1.3) * 0.6,
      tiltDir: i % 2 === 0 ? 1 : -1,
    };
    scene.add(mesh);
    ORBITERS.push(mesh);
  }

  // ── Particle field ─────────────────────────────────────────────
  const pCount = isMobile ? 250 : 600;
  const pGeo   = new THREE.BufferGeometry();
  const pPos   = new Float32Array(pCount * 3);
  const pSizes = new Float32Array(pCount);

  for (let i = 0; i < pCount; i++) {
    const θ = Math.random() * Math.PI * 2;
    const φ = Math.acos(2 * Math.random() - 1);
    const r = 2 + Math.random() * 6;
    pPos[i * 3]     = r * Math.sin(φ) * Math.cos(θ);
    pPos[i * 3 + 1] = r * Math.cos(φ);
    pPos[i * 3 + 2] = r * Math.sin(φ) * Math.sin(θ);
    pSizes[i] = 0.3 + Math.random() * 0.7;
  }

  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('size',     new THREE.BufferAttribute(pSizes, 1));

  const particleMat = new THREE.PointsMaterial({
    color:           0x5fee8a,
    size:            isMobile ? 0.038 : 0.028,
    transparent:     true,
    opacity:         0.45,
    sizeAttenuation: true,
    depthWrite:      false,
  });
  const particles = new THREE.Points(pGeo, particleMat);
  scene.add(particles);

  // ── Mouse parallax ─────────────────────────────────────────────
  let targetMX = 0, targetMY = 0;
  const onMouseMove = (e) => {
    targetMX = (e.clientX / window.innerWidth  - 0.5) * 0.5;
    targetMY = (e.clientY / window.innerHeight - 0.5) * 0.4;
  };
  window.addEventListener('mousemove', onMouseMove);

  // Touch parallax for mobile
  const onTouch = (e) => {
    const t = e.touches[0];
    targetMX = (t.clientX / window.innerWidth  - 0.5) * 0.3;
    targetMY = (t.clientY / window.innerHeight - 0.5) * 0.25;
  };
  window.addEventListener('touchmove', onTouch, { passive: true });

  // ── Resize handler ─────────────────────────────────────────────
  const resizeObs = new ResizeObserver(() => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  resizeObs.observe(canvas);

  // ── Render loop ────────────────────────────────────────────────
  let frameId;
  let currentMX = 0, currentMY = 0;

  function tick() {
    frameId = requestAnimationFrame(tick);
    const t = Date.now() * 0.001;

    // Center gem
    centerMesh.rotation.y += 0.006;
    centerMesh.rotation.x  = Math.sin(t * 0.4) * 0.12;
    centerMesh.scale.setScalar(1 + Math.sin(t * 1.6) * 0.025);

    shellMesh.rotation.y  -= 0.003;
    shellMesh.rotation.z  += 0.002;

    // Rings
    ring1.rotation.z += 0.005;
    ring2.rotation.y += 0.004;
    ring2.rotation.z += 0.002;
    ring3.rotation.x += 0.002;
    ring3.rotation.y -= 0.003;

    // Satellites
    ORBITERS.forEach(o => {
      o.userData.angle += o.userData.speed;
      const { angle, radius, yBias, tiltDir } = o.userData;
      o.position.set(
        Math.cos(angle) * radius,
        yBias + Math.sin(t * 0.5 + angle) * 0.35 * tiltDir,
        Math.sin(angle) * radius,
      );
      o.rotation.x += 0.012;
      o.rotation.y += 0.016;
    });

    // Particles slow drift
    particles.rotation.y += 0.0003;
    particles.rotation.x  = Math.sin(t * 0.1) * 0.05;

    // Pulse point light
    pointLight.intensity = 1.5 + Math.sin(t * 2.2) * 0.4;

    // Smooth camera parallax
    currentMX += (targetMX - currentMX) * 0.035;
    currentMY += (targetMY - currentMY) * 0.035;
    camera.position.x = currentMX;
    camera.position.y = -currentMY;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  tick();

  // ── Dispose ────────────────────────────────────────────────────
  return {
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObs.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouch);

      // Free GPU memory
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    },
  };
}

/**
 * createIntroScene(canvas)
 * Full-screen intro Three.js scene — heavier, richer environment.
 * Returns { dispose }
 */
export function createIntroScene(canvas) {
  if (!canvas) return { dispose: () => {} };

  const isMobile = window.innerWidth < 768;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0a1f0d, 1);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 12);

  // Fog for depth
  scene.fog = new THREE.FogExp2(0x0a1f0d, 0.04);

  // Lighting
  scene.add(new THREE.AmbientLight(0x1a4a1a, 1.2));
  const dir = new THREE.DirectionalLight(0x3ddc6c, 2.5);
  dir.position.set(5, 10, 5); scene.add(dir);
  const rim = new THREE.DirectionalLight(0xa8f059, 0.8);
  rim.position.set(-8, 3, -5); scene.add(rim);
  const pt  = new THREE.PointLight(0x5fee8a, 1.5, 20);
  pt.position.set(0, 3, 5);  scene.add(pt);

  // Floating geometry field
  const floaters = [];
  const count    = isMobile ? 18 : 36;

  for (let i = 0; i < count; i++) {
    const kind = i % 6;
    const geo  = [
      new THREE.IcosahedronGeometry(0.15 + Math.random() * 0.25, 1),
      new THREE.OctahedronGeometry(0.14 + Math.random() * 0.20, 0),
      new THREE.TetrahedronGeometry(0.18 + Math.random() * 0.16, 0),
      new THREE.BoxGeometry(0.20, 0.26, 0.20),
      new THREE.CylinderGeometry(0, 0.17, 0.36, 5, 1),
      new THREE.TorusGeometry(0.14, 0.05, 6, 12),
    ][kind];

    const hue = 0.30 + Math.random() * 0.18;
    const mat = new THREE.MeshStandardMaterial({
      color:             new THREE.Color().setHSL(hue, 0.72, 0.32),
      emissive:          new THREE.Color().setHSL(hue, 0.65, 0.10),
      emissiveIntensity: 0.45,
      roughness:         0.38,
      metalness:         0.28,
      wireframe:         Math.random() > 0.60,
    });

    const mesh = new THREE.Mesh(geo, mat);
    const r    = 4.5 + Math.random() * 5.5;
    const θ    = Math.random() * Math.PI * 2;
    const φ    = (Math.random() - 0.5) * Math.PI * 0.75;

    mesh.position.set(
      r * Math.cos(θ) * Math.cos(φ),
      r * Math.sin(φ) + (Math.random() - 0.5) * 3.5,
      r * Math.sin(θ) * Math.cos(φ),
    );
    mesh.rotation.set(
      Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI,
    );
    mesh.userData = {
      base:       mesh.position.clone(),
      rot:        new THREE.Vector3((Math.random() - 0.5) * 0.013, (Math.random() - 0.5) * 0.013, 0),
      fSpeed:     0.35 + Math.random() * 0.65,
      fAmp:       0.28 + Math.random() * 0.55,
      phase:      Math.random() * Math.PI * 2,
    };
    scene.add(mesh);
    floaters.push(mesh);
  }

  // Particles
  const pN  = isMobile ? 500 : 1200;
  const pG  = new THREE.BufferGeometry();
  const pP  = new Float32Array(pN * 3);
  for (let i = 0; i < pN * 3; i++) pP[i] = (Math.random() - 0.5) * 32;
  pG.setAttribute('position', new THREE.BufferAttribute(pP, 3));
  const parts = new THREE.Points(pG, new THREE.PointsMaterial({ color: 0x5fee8a, size: isMobile ? 0.038 : 0.022, transparent: true, opacity: 0.48, sizeAttenuation: true, depthWrite: false }));
  scene.add(parts);

  // Orb at center
  const orb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25, isMobile ? 2 : 4),
    new THREE.MeshStandardMaterial({ color: 0x1a5e2a, emissive: 0x3ddc6c, emissiveIntensity: 0.28, roughness: 0.18, metalness: 0.65, wireframe: true }),
  );
  scene.add(orb);

  // Camera keyframe path
  const camKF  = [new THREE.Vector3(0,0,12), new THREE.Vector3(3,1.5,10), new THREE.Vector3(-2,-1,9), new THREE.Vector3(0,0,8)];
  let cfIdx    = 0;
  let cfStart  = Date.now();
  const cfDur  = 3200;

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  let frameId;

  function tick() {
    frameId = requestAnimationFrame(tick);
    const t  = Date.now() * 0.001;
    const el = Date.now() - cfStart;
    const p  = Math.min(el / cfDur, 1);
    const e  = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

    floaters.forEach(f => {
      const d = f.userData;
      f.rotation.x += d.rot.x;
      f.rotation.y += d.rot.y;
      f.position.y  = d.base.y + Math.sin(t * d.fSpeed + d.phase) * d.fAmp;
    });

    parts.rotation.y += 0.0004;
    parts.rotation.x += 0.0002;

    orb.rotation.y   += 0.004;
    orb.rotation.z   += 0.001;
    orb.scale.setScalar(1 + Math.sin(t * 1.3) * 0.04);

    camera.position.lerpVectors(camKF[cfIdx], camKF[(cfIdx + 1) % camKF.length], e);
    camera.lookAt(0, 0, 0);
    if (p >= 1) { cfIdx = (cfIdx + 1) % camKF.length; cfStart = Date.now(); }

    pt.intensity = 1.2 + Math.sin(t * 2.1) * 0.45;
    renderer.render(scene, camera);
  }

  tick();

  return {
    dispose() {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          Array.isArray(obj.material)
            ? obj.material.forEach(m => m.dispose())
            : obj.material.dispose();
        }
      });
      renderer.dispose();
    },
  };
}
