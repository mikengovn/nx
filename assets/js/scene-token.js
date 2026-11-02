// NEXUS Token 工廠: energy flows into a glass factory, through GPUs and AI
// models, onto a conveyor that turns compute into tokens, which fly out to
// AI applications.
import { THREE, createStage, addRacks, addPulses, addArrowHead, glowMaterial, edgeLines, label, floorGlow } from './stage.js';

const MODELS = [
  { name: 'DeepSeek', color: 0x60a5fa },
  { name: 'Qwen', color: 0x8b5cf6 },
  { name: 'Kimi', color: 0x22d3ee },
  { name: 'GLM', color: 0x34d399 },
  { name: 'MiniMax', color: 0xf472b6 },
];
const APPS = ['Chat assistants', 'Code generation', 'Data analysis', 'Content creation', 'AI agents'];
const BLUE = 0x377de8;

export default function init(host, { logoSrc = 'assets/img/nexus-logo.png' } = {}) {
  const stage = createStage(host, {
    viewHeight: 13.5,
    viewWidth: 29,
    camPos: [7, 9.5, 24],
    target: [0.4, 1.7, 0],
    bloom: { strength: 0.6, radius: 0.45, threshold: 0.55 },
    labels: true,
  });
  const { root } = stage;
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

  const glow = floorGlow(34, '#377de8', 0.45);
  glow.position.y = -0.31;
  root.add(glow);

  // Ground plate under the factory.
  const baseGeo = new THREE.BoxGeometry(18.5, 0.3, 8.4);
  const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0x111824, roughness: 0.8 }));
  base.position.y = -0.15;
  base.add(edgeLines(baseGeo, BLUE, 1.6));
  root.add(base);

  // Glass building.
  const glassGeo = new THREE.BoxGeometry(17, 5.2, 7.4);
  const glass = new THREE.Mesh(glassGeo, new THREE.MeshStandardMaterial({ color: 0x5b8ff0, transparent: true, opacity: 0.07, depthWrite: false, metalness: 0.2, roughness: 0.05 }));
  glass.position.set(0, 2.6, 0);
  glass.add(edgeLines(glassGeo, 0x6fa6ff, 1.4, 0.9));
  root.add(glass);
  // Mullions on the front face.
  const mull = new THREE.BoxGeometry(0.05, 5.2, 0.05);
  for (let x = -8.5; x <= 8.5; x += 2.125) {
    const m = new THREE.Mesh(mull, new THREE.MeshBasicMaterial({ color: 0x2b4a7a, transparent: true, opacity: 0.6 }));
    m.position.set(x, 2.6, 3.7);
    root.add(m);
  }

  // GPU cluster.
  const gpus = new THREE.Group();
  gpus.position.set(-5.4, 0, 0);
  root.add(gpus);
  const rackPos = [];
  for (const x of [-1.15, 0, 1.15]) for (const z of [-1.3, 0.9]) rackPos.push([x, z]);
  const flicker = addRacks(gpus, rackPos, { w: 0.95, h: 2.7, d: 0.9, rows: 8 });

  // Model weights: floating colored layers.
  const tiles = [];
  const tileGeo = new THREE.BoxGeometry(2.6, 0.28, 1.9);
  MODELS.forEach((m, i) => {
    const tile = new THREE.Mesh(tileGeo, new THREE.MeshStandardMaterial({ color: m.color, emissive: m.color, emissiveIntensity: 0.22, metalness: 0.35, roughness: 0.35 }));
    tile.position.set(-0.9, 0.8 + i * 0.82, 0);
    tile.add(edgeLines(tileGeo, m.color, 1.7));
    root.add(tile);
    tiles.push(tile);
    const l = label(m.name, 'lbl lbl-chip');
    l.position.set(0.95, 0.8 + i * 0.82, 0.9);
    root.add(l);
  });

  // Conveyor belt rising to the right.
  const beltStart = V(2.4, 0.75, 0);
  const beltEnd = V(7.3, 3.1, 0);
  const dir = beltEnd.clone().sub(beltStart);
  const L = dir.length();
  dir.normalize();
  const angle = Math.atan2(dir.y, dir.x);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(L, 0.18, 1.5), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.35 }));
  belt.position.copy(beltStart.clone().add(beltEnd).multiplyScalar(0.5));
  belt.rotation.z = angle;
  root.add(belt);
  const rail = new THREE.BoxGeometry(L, 0.08, 0.06);
  for (const z of [-0.78, 0.78]) {
    const r = new THREE.Mesh(rail, glowMaterial(0x38bdf8, 1.4));
    r.position.copy(belt.position).add(V(0, 0.12, z));
    r.rotation.z = angle;
    root.add(r);
  }
  const roller = new THREE.CylinderGeometry(0.2, 0.2, 1.6, 20);
  roller.rotateX(Math.PI / 2);
  for (const p of [beltStart, beltEnd]) {
    const r = new THREE.Mesh(roller, new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 }));
    r.position.copy(p);
    root.add(r);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, p.y, 0.12), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    leg.position.set(p.x, p.y / 2, 0.6);
    root.add(leg);
  }

  // Token coins riding the belt.
  const coinGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.1, 36);
  coinGeo.rotateX(Math.PI / 2);
  const ringGeo = new THREE.TorusGeometry(0.36, 0.04, 10, 36);
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xdbe8ff, metalness: 0.7, roughness: 0.25, emissive: BLUE, emissiveIntensity: 0.55 });
  const ringMat = glowMaterial(0x9cc3ff, 2);
  const normal = V(-dir.y, dir.x, 0);
  const coins = [];
  for (let k = 0; k < 7; k++) {
    const c = new THREE.Mesh(coinGeo, coinMat);
    c.add(new THREE.Mesh(ringGeo, ringMat));
    const tMark = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.02), glowMaterial(0xffffff, 1.6));
    tMark.position.set(0, 0.1, 0.06);
    const tStem = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.02), glowMaterial(0xffffff, 1.6));
    tStem.position.set(0, -0.03, 0.06);
    c.add(tMark, tStem);
    root.add(c);
    coins.push({ c, off: k / 7 });
  }

  // AI applications: floating holographic panels outside the factory.
  const panelGeo = new THREE.PlaneGeometry(2.9, 0.78);
  const appYs = [];
  APPS.forEach((name, i) => {
    const y = 0.9 + i * 1.0;
    appYs.push(y);
    const p = new THREE.Mesh(panelGeo, new THREE.MeshBasicMaterial({ color: 0x1b2740, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    p.position.set(11.6, y, 0);
    p.add(edgeLines(panelGeo, 0xa78bfa, 1.8));
    root.add(p);
    const l = label(name, 'lbl lbl-app');
    l.position.set(11.6, y, 0.05);
    root.add(l);
  });

  // Energy source with a glowing bolt.
  const pedGeo = new THREE.BoxGeometry(2.2, 1.1, 2.2);
  const ped = new THREE.Mesh(pedGeo, new THREE.MeshStandardMaterial({ color: 0x141b27, roughness: 0.6 }));
  ped.position.set(-11.6, 0.55, 0);
  ped.add(edgeLines(pedGeo, 0xfbbf24, 1.8));
  root.add(ped);
  const bolt = new THREE.Shape();
  bolt.moveTo(0.15, 1.1); bolt.lineTo(-0.55, -0.05); bolt.lineTo(-0.05, -0.05);
  bolt.lineTo(-0.3, -1.1); bolt.lineTo(0.55, 0.2); bolt.lineTo(0.05, 0.2); bolt.lineTo(0.15, 1.1);
  const boltGeo = new THREE.ExtrudeGeometry(bolt, { depth: 0.25, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  boltGeo.center();
  const boltMesh = new THREE.Mesh(boltGeo, glowMaterial(0xfbbf24, 1.9));
  boltMesh.position.set(-11.6, 2.6, 0);
  root.add(boltMesh);

  // Flows: energy → GPUs → models → belt, then belt → apps.
  const flows = [
    new THREE.CatmullRomCurve3([V(-10.5, 0.6, 0.6), V(-9.2, 0.35, 1.4), V(-7.6, 0.4, 1.4), V(-6.9, 1.2, 1.2)]),
    new THREE.CatmullRomCurve3([V(-10.5, 0.8, -0.6), V(-9.2, 0.5, -1.2), V(-7.6, 0.6, -1.4), V(-6.9, 1.6, -1.2)]),
    new THREE.CubicBezierCurve3(V(-4.1, 2.2, 0.4), V(-3.2, 2.6, 0.4), V(-2.9, 2.4, 0.2), V(-2.3, 2.4, 0)),
    new THREE.CubicBezierCurve3(V(0.45, 2.4, 0), V(1.4, 2.4, 0), V(1.6, 1.0, 0), V(2.4, 1.0, 0)),
  ];
  const flowColors = [0xfbbf24, 0x34d399, 0x38bdf8, 0xa78bfa];
  flows.forEach((c, i) => {
    root.add(new THREE.Mesh(new THREE.TubeGeometry(c, 48, 0.07, 8, false), new THREE.MeshBasicMaterial({ color: flowColors[i], transparent: true, opacity: 0.4 })));
  });
  const outFlows = appYs.map((y) => new THREE.CubicBezierCurve3(V(7.6, 3.4, 0), V(8.8, 4.6, 0), V(9.2, y, 0), V(10.05, y, 0)));
  outFlows.forEach((c) => {
    root.add(new THREE.Mesh(new THREE.TubeGeometry(c, 48, 0.035, 8, false), new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.3 })));
    addArrowHead(root, c, 0xa78bfa, 0.18);
  });
  const pulseIn = addPulses(root, flows, { per: 4, speed: 0.3, radius: 0.12, colors: flowColors, boost: 2.4 });
  const pulseOut = addPulses(root, outFlows, { per: 2, speed: 0.24, radius: 0.1, colors: [0xc4b5fd], boost: 2.6 });

  // HTML labels.
  const sign = label(`<img src="${logoSrc}" alt="Nexus Compute"><span>Token 工廠</span>`, 'lbl lbl-sign');
  sign.position.set(0, 5.7, 0);
  root.add(sign);
  const stations = [
    [-11.6, -1.0, 'Energy', '能源'],
    [-5.4, -1.0, 'GPU cluster', '算力叢集'],
    [-0.9, -1.0, 'AI models', '模型權重'],
    [4.85, -1.0, 'Token line', 'Token 產線'],
    [11.6, -1.0, 'AI apps', 'AI 應用'],
  ];
  for (const [x, y, en, zh] of stations) {
    const l = label(`<strong>${en}</strong><span>${zh}</span>`, 'lbl lbl-station');
    l.position.set(x, y, 4.6);
    root.add(l);
  }

  stage.onTick((t, dt, p) => {
    flicker(dt);
    pulseIn(t);
    pulseOut(t);
    tiles.forEach((tile, i) => { tile.position.y = 0.8 + i * 0.82 + Math.sin(t * 1.4 + i) * 0.05; });
    boltMesh.rotation.y = t * 0.8;
    for (const it of coins) {
      const u = (t * 0.11 + it.off) % 1;
      it.c.position.copy(beltStart).addScaledVector(dir, u * L).addScaledVector(normal, 0.48);
      it.c.rotation.z = angle;
      it.c.scale.setScalar(Math.min(1, u * 10, (1 - u) * 10));
    }
    root.rotation.y = Math.sin(t * 0.1) * 0.05 + p.x * 0.08;
    root.rotation.x = p.y * 0.03;
  });
  stage.resize();
  return stage;
}
