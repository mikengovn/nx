// Shared three.js setup: renderer, isometric camera, bloom, labels, resize and
// a render loop that only runs while the scene is on screen.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export { THREE, CSS2DObject };

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createStage(host, opts = {}) {
  const {
    viewHeight = 14,          // world units visible vertically
    viewWidth = 0,            // world units that must stay visible horizontally
    camPos = [20, 16, 20],
    target = [0, 1, 0],
    bg = 0x05070b,
    bloom = { strength: 0.85, radius: 0.55, threshold: 0.18 },
    labels = false,
  } = opts;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
  const tgt = new THREE.Vector3(...target);
  camera.position.set(...camPos);
  camera.lookAt(tgt);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), bloom.strength, bloom.radius, bloom.threshold);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  let labelRenderer = null;
  if (labels) {
    labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = 'scene-labels';
    host.appendChild(labelRenderer.domElement);
  }

  const root = new THREE.Group();
  scene.add(root);

  // Soft lights shared by every scene.
  scene.add(new THREE.AmbientLight(0x8fa3c8, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(10, 22, 14);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x377de8, 1.1);
  rim.position.set(-14, 8, -10);
  scene.add(rim);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  host.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });

  const ticks = [];
  let t = 0;
  let raf = 0;
  let running = false;
  let visible = false;
  const clock = new THREE.Clock();

  function render() {
    composer.render();
    if (labelRenderer) labelRenderer.render(scene, camera);
  }

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    const aspect = w / h;
    const vh = Math.max(viewHeight, viewWidth ? viewWidth / aspect : 0);
    camera.left = (-vh * aspect) / 2;
    camera.right = (vh * aspect) / 2;
    camera.top = vh / 2;
    camera.bottom = -vh / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    if (labelRenderer) labelRenderer.setSize(w, h);
    host.style.setProperty('--u', (h / vh).toFixed(2) + 'px');
    if (!running) render();
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    for (const f of ticks) f(t, dt, pointer);
    render();
  }

  function start() {
    if (running) return;
    if (reduceMotion) {
      for (const f of ticks) f(6, 0, pointer);
      render();
      return;
    }
    running = true;
    clock.getDelta();
    frame();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) start(); else stop();
  }, { threshold: 0.02 }).observe(host);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (visible) start();
  });

  return {
    scene, camera, renderer, root, host,
    onTick: (f) => ticks.push(f),
    resize,
  };
}

// ---------- shared builders ----------

export function glowColor(hex, boost = 1.8) {
  const c = new THREE.Color(hex);
  return c.multiplyScalar(boost);
}

export function glowMaterial(hex, boost = 1.8, extra = {}) {
  return new THREE.MeshBasicMaterial({ color: glowColor(hex, boost), toneMapped: false, ...extra });
}

export function edgeLines(geometry, hex, boost = 1.6, opacity = 1) {
  const lines = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: glowColor(hex, boost), toneMapped: false, transparent: opacity < 1, opacity }),
  );
  return lines;
}

// A soft additive glow disc laid on the floor.
export function floorGlow(size = 30, hex = '#377de8', strength = 0.55) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, hex);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = strength;
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

// Server racks with blinking LED strips (one InstancedMesh for all LEDs).
export function addRacks(parent, positions, { w = 1.2, h = 2.8, d = 1.1, palette = [0x38bdf8, 0x5eead4, 0x377de8], rows = 9 } = {}) {
  const body = new THREE.MeshStandardMaterial({ color: 0x1a2333, metalness: 0.55, roughness: 0.42 });
  const top = new THREE.MeshStandardMaterial({ color: 0x2e3a50, metalness: 0.4, roughness: 0.5 });
  const geo = new THREE.BoxGeometry(w, h, d);
  const topGeo = new THREE.BoxGeometry(w * 0.98, 0.04, d * 0.98);
  const count = positions.length * rows;
  const leds = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ toneMapped: false }), count);
  const dummy = new THREE.Object3D();
  const base = [];
  let i = 0;
  for (const [x, z] of positions) {
    const m = new THREE.Mesh(geo, body);
    m.position.set(x, h / 2, z);
    parent.add(m);
    const tp = new THREE.Mesh(topGeo, top);
    tp.position.set(x, h + 0.02, z);
    parent.add(tp);
    const hue = palette[Math.floor(Math.random() * palette.length)];
    for (let j = 0; j < rows; j++) {
      const lw = w * (0.25 + Math.random() * 0.5);
      dummy.position.set(x - w / 2 + 0.12 + lw / 2, 0.35 + (j * (h - 0.6)) / (rows - 1), z + d / 2 + 0.008);
      dummy.scale.set(lw, 0.045, 0.01);
      dummy.updateMatrix();
      leds.setMatrixAt(i, dummy.matrix);
      const col = glowColor(hue, 1.6 + Math.random() * 0.8);
      leds.setColorAt(i, col);
      base.push(col.clone());
      i++;
    }
  }
  leds.instanceMatrix.needsUpdate = true;
  parent.add(leds);
  const tmp = new THREE.Color();
  let acc = 0;
  return function flicker(dt) {
    acc += dt;
    if (acc < 0.12) return;
    acc = 0;
    for (let k = 0; k < 6; k++) {
      const n = Math.floor(Math.random() * count);
      const on = Math.random() > 0.25;
      tmp.copy(base[n]).multiplyScalar(on ? 1 : 0.15);
      leds.setColorAt(n, tmp);
    }
    leds.instanceColor.needsUpdate = true;
  };
}

// Glowing dots that travel along curves: the "moving arrows".
export function addPulses(parent, curves, { per = 4, speed = 0.18, radius = 0.1, colors = [0x7dd3fc], boost = 2.4 } = {}) {
  const geo = new THREE.SphereGeometry(radius, 12, 12);
  const items = [];
  curves.forEach((curve, ci) => {
    const hex = colors[ci % colors.length];
    const mat = glowMaterial(hex, boost);
    for (let k = 0; k < per; k++) {
      const s = new THREE.Mesh(geo, mat);
      parent.add(s);
      items.push({ s, curve, off: k / per + Math.random() * 0.05 });
    }
  });
  return function move(t) {
    for (const it of items) {
      const u = (t * speed + it.off) % 1;
      it.s.position.copy(it.curve.getPointAt(u));
      const fade = Math.min(1, u * 8, (1 - u) * 8);
      it.s.scale.setScalar(0.4 + 0.6 * fade);
    }
  };
}

export function addArrowHead(parent, curve, hex, size = 0.22) {
  const cone = new THREE.Mesh(new THREE.ConeGeometry(size * 0.75, size * 1.8, 16), glowMaterial(hex, 1.6));
  const end = curve.getPointAt(1);
  const tan = curve.getTangentAt(1).normalize();
  cone.position.copy(end);
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
  parent.add(cone);
  return cone;
}

export function label(html, className = 'lbl') {
  const el = document.createElement('div');
  el.className = className;
  el.innerHTML = html;
  return new CSS2DObject(el);
}
