// src/pages/landing/IntroAnimation.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

// ── Intro text sequence ───────────────────────────────────────────
const TEXT_SEQUENCE = [
  { id: 'l1', text: 'Connecting Farmers to the Future', show: 800,  hide: 3200, cls: 'text-2xl md:text-4xl lg:text-5xl text-emerald-300/70' },
  { id: 'l2', text: 'Buy. Sell. Grow.',                 show: 3400, hide: 6200, cls: 'text-5xl md:text-7xl lg:text-8xl font-bold text-emerald-400 tracking-tight' },
  { id: 'l3', text: 'Welcome to AgriCare',              show: 6400, hide: null, cls: 'text-3xl md:text-5xl lg:text-6xl font-semibold text-white' },
  { id: 'l4', text: "Pakistan's Digital Agricultural Marketplace", show: 7200, hide: null, cls: 'text-sm md:text-base tracking-[3px] uppercase text-emerald-300/50 font-normal mt-2' },
];

const INTRO_DURATION = 11000;
const SKIP_AFTER     = 7000;

export default function IntroAnimation({ onComplete }) {
  const canvasRef       = useRef(null);
  const rendererRef     = useRef(null);
  const frameRef        = useRef(null);
  const progressRef     = useRef(null);
  const startTimeRef    = useRef(Date.now());

  const [lineStates,  setLineStates]  = useState({});
  const [progress,    setProgress]    = useState(0);
  const [showSkip,    setShowSkip]    = useState(false);
  const [exiting,     setExiting]     = useState(false);

  // ── Finish intro ──────────────────────────────────────────────
  const finish = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    clearInterval(progressRef.current);
    cancelAnimationFrame(frameRef.current);
    setTimeout(() => onComplete?.(), 850);
  }, [exiting, onComplete]);

  // ── Text sequence ─────────────────────────────────────────────
  useEffect(() => {
    const timers = [];
    TEXT_SEQUENCE.forEach(item => {
      timers.push(setTimeout(() => {
        setLineStates(s => ({ ...s, [item.id]: 'visible' }));
      }, item.show));
      if (item.hide) {
        timers.push(setTimeout(() => {
          setLineStates(s => ({ ...s, [item.id]: 'hidden' }));
        }, item.hide));
      }
    });
    timers.push(setTimeout(() => setShowSkip(true), SKIP_AFTER));
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Progress bar + auto-finish ────────────────────────────────
  useEffect(() => {
    progressRef.current = setInterval(() => {
      const p = Math.min((Date.now() - startTimeRef.current) / INTRO_DURATION, 1);
      setProgress(p);
      if (p >= 1) finish();
    }, 80);
    return () => clearInterval(progressRef.current);
  }, [finish]);

  // ── Three.js scene ────────────────────────────────────────────
  useEffect(() => {
    const canvas   = canvasRef.current;
    if (!canvas) return;
    const isMobile = window.innerWidth < 768;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a1f0d, 1);
    rendererRef.current = renderer;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 12);

    // Lighting
    scene.add(new THREE.AmbientLight(0x1a4a1a, 1.2));
    const dir = new THREE.DirectionalLight(0x3ddc6c, 2.5);
    dir.position.set(5, 10, 5); scene.add(dir);
    const rim = new THREE.DirectionalLight(0xa8f059, 0.8);
    rim.position.set(-8, 3, -5); scene.add(rim);
    const point = new THREE.PointLight(0x5fee8a, 1.5, 20);
    point.position.set(0, 3, 5); scene.add(point);

    // Floating objects
    const floaters = [];
    const fCount   = isMobile ? 14 : 28;

    for (let i = 0; i < fCount; i++) {
      const shapes = [
        new THREE.IcosahedronGeometry(0.18 + Math.random() * 0.22, 1),
        new THREE.OctahedronGeometry(0.15 + Math.random() * 0.18, 0),
        new THREE.TetrahedronGeometry(0.2 + Math.random() * 0.15, 0),
        new THREE.BoxGeometry(0.22, 0.28, 0.22),
        new THREE.CylinderGeometry(0, 0.18, 0.38, 5, 1),
      ];
      const geo = shapes[i % 5];
      const hue = 0.33 + (Math.random() - 0.5) * 0.12;
      const mat = new THREE.MeshStandardMaterial({
        color:             new THREE.Color().setHSL(hue, 0.75, 0.35),
        emissive:          new THREE.Color().setHSL(hue, 0.7, 0.12),
        emissiveIntensity: 0.5,
        roughness:         0.35,
        metalness:         0.3,
        wireframe:         Math.random() > 0.65,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const r = 4 + Math.random() * 5;
      const θ = Math.random() * Math.PI * 2;
      const φ = (Math.random() - 0.5) * Math.PI * 0.7;
      mesh.position.set(r * Math.cos(θ) * Math.cos(φ), r * Math.sin(φ) + (Math.random() - 0.5) * 3, r * Math.sin(θ) * Math.cos(φ));
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.userData = { basePos: mesh.position.clone(), rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012, 0), floatSpeed: 0.4 + Math.random() * 0.6, floatAmp: 0.3 + Math.random() * 0.5, phase: Math.random() * Math.PI * 2 };
      scene.add(mesh);
      floaters.push(mesh);
    }

    // Particles
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array((isMobile ? 400 : 900) * 3);
    for (let i = 0; i < pPos.length; i++) pPos[i] = (Math.random() - 0.5) * 30;
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x5fee8a, size: isMobile ? 0.035 : 0.025, transparent: true, opacity: 0.5, sizeAttenuation: true }));
    scene.add(particles);

    // Central orb
    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2, isMobile ? 2 : 3),
      new THREE.MeshStandardMaterial({ color: 0x1a5e2a, emissive: 0x3ddc6c, emissiveIntensity: 0.25, roughness: 0.2, metalness: 0.6, wireframe: true })
    );
    scene.add(orb);

    // Camera path
    const camPath  = [new THREE.Vector3(0,0,12), new THREE.Vector3(3,1.5,10), new THREE.Vector3(-2,-1,9), new THREE.Vector3(0,0,8)];
    let camFrame   = 0, camStart = Date.now();
    const camDur   = 3000;

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    function tick() {
      frameRef.current = requestAnimationFrame(tick);
      const t = Date.now() * 0.001;

      floaters.forEach(f => {
        const d = f.userData;
        f.rotation.x += d.rotSpeed.x;
        f.rotation.y += d.rotSpeed.y;
        f.position.y  = d.basePos.y + Math.sin(t * d.floatSpeed + d.phase) * d.floatAmp;
      });

      particles.rotation.y += 0.0004;
      particles.rotation.x += 0.0002;
      orb.rotation.y       += 0.003;
      orb.scale.setScalar(1 + Math.sin(t * 1.2) * 0.04);

      // Camera
      const elapsed = Date.now() - camStart;
      const p = Math.min(elapsed / camDur, 1);
      const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      camera.position.lerpVectors(camPath[camFrame], camPath[(camFrame + 1) % camPath.length], ease);
      camera.lookAt(0, 0, 0);
      if (p >= 1) { camFrame = (camFrame + 1) % camPath.length; camStart = Date.now(); }

      point.intensity = 1.2 + Math.sin(t * 2) * 0.4;
      renderer.render(scene, camera);
    }
    tick();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  // ── Line state helpers ────────────────────────────────────────
  const getLineClass = (id) => {
    const state = lineStates[id];
    const base = 'font-display transition-all duration-700 ';
    if (state === 'visible') return base + 'opacity-100 translate-y-0';
    if (state === 'hidden')  return base + 'opacity-0 -translate-y-4';
    return base + 'opacity-0 translate-y-6';
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0a1f0d] flex flex-col items-center justify-center transition-all duration-700 ${exiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'}`}
    >
      {/* Three.js canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,31,13,0.85)_100%)] pointer-events-none" />

      {/* Logo */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5 animate-[fadeDown_0.8s_ease_0.5s_both]">
        <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[10px] flex items-center justify-center text-lg shadow-[0_4px_14px_rgba(61,220,108,0.4)]">🌿</div>
        <div className="font-display text-xl font-bold text-white">Agri<span className="text-emerald-400">Care</span></div>
      </div>

      {/* Text center */}
      <div className="relative z-10 text-center flex flex-col items-center gap-1 px-4">
        {TEXT_SEQUENCE.map(item => (
          <div key={item.id} className={`${item.cls} ${getLineClass(item.id)} select-none`}
            style={{ fontFamily: item.id === 'l2' ? "'Clash Display', sans-serif" : "'Sora', sans-serif" }}>
            {item.text}
          </div>
        ))}
      </div>

      {/* Progress + skip */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
        <div className="w-40 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(61,220,108,0.8)] transition-[width] duration-100 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <button
          onClick={finish}
          className={`px-6 py-2 rounded-full text-xs font-medium tracking-widest uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 backdrop-blur-sm hover:bg-emerald-400/20 transition-all duration-300 ${showSkip ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
          Skip Intro →
        </button>
      </div>
    </div>
  );
}
