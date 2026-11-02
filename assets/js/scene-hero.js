// Hero: an isometric modular AI data center with glowing racks, cooling pipes
// and data pulses running along the pipes.
import { THREE, createStage, addRacks, addPulses, glowMaterial, edgeLines, floorGlow } from './stage.js';

export default function init(host) {
  const stage = createStage(host, {
    viewHeight: 13.5,
    viewWidth: 17,
    camPos: [20, 15.5, 20],
    target: [0, 1.4, 0],
    bloom: { strength: 0.7, radius: 0.5, threshold: 0.42 },
  });
  const { root } = stage;

  // Floor glow and platform.
  const glow = floorGlow(26, '#377de8', 0.45);
  glow.position.y = -0.32;
  root.add(glow);

  const platGeo = new THREE.BoxGeometry(11, 0.3, 11);
  const plat = new THREE.Mesh(platGeo, new THREE.MeshStandardMaterial({ color: 0x121925, metalness: 0.3, roughness: 0.7 }));
  plat.position.y = -0.15;
  root.add(plat);
  const platEdges = edgeLines(platGeo, 0x377de8, 1.8);
  platEdges.position.copy(plat.position);
  root.add(platEdges);
  const grid = new THREE.GridHelper(11, 11, 0x26385a, 0x1c2a42);
  grid.position.y = 0.005;
  root.add(grid);

  // Three rows of racks.
  const rows = [-3.5, 0, 3.5];
  const xs = [-3.75, -2.25, -0.75, 0.75, 2.25, 3.75];
  const positions = [];
  for (const z of rows) for (const x of xs) positions.push([x, z]);
  const flicker = addRacks(root, positions, { w: 1.3, h: 2.8, d: 1.1 });

  // Status lights on top of every other rack.
  const dotGeo = new THREE.SphereGeometry(0.06, 10, 10);
  positions.forEach(([x, z], i) => {
    const dot = new THREE.Mesh(dotGeo, glowMaterial(i % 5 === 0 ? 0xfbbf24 : 0x34d399, 2));
    dot.position.set(x + 0.5, 2.55, z + 0.56);
    root.add(dot);
  });

  // Overhead cooling pipes and drops into the racks.
  const pipeY = 3.6;
  const pipeGeoX = new THREE.CylinderGeometry(0.07, 0.07, 9.6, 12);
  pipeGeoX.rotateZ(Math.PI / 2);
  const pipeGeoZ = new THREE.CylinderGeometry(0.07, 0.07, 9.6, 12);
  pipeGeoZ.rotateX(Math.PI / 2);
  const curves = [];
  rows.forEach((z, i) => {
    for (const off of [-0.22, 0.22]) {
      const p = new THREE.Mesh(pipeGeoX, glowMaterial(off < 0 ? 0x5eead4 : 0x38bdf8, 0.85));
      p.position.set(0, pipeY, z + off);
      root.add(p);
      curves.push(new THREE.LineCurve3(new THREE.Vector3(-4.8 * (i % 2 ? -1 : 1), pipeY, z + off), new THREE.Vector3(4.8 * (i % 2 ? -1 : 1), pipeY, z + off)));
    }
  });
  for (const x of [-4.8, 0, 4.8]) {
    const p = new THREE.Mesh(pipeGeoZ, glowMaterial(0x377de8, 1.0));
    p.position.set(x, pipeY + 0.12, 0);
    root.add(p);
    curves.push(new THREE.LineCurve3(new THREE.Vector3(x, pipeY + 0.12, -4.8), new THREE.Vector3(x, pipeY + 0.12, 4.8)));
  }
  const dropGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
  const dropMat = glowMaterial(0x38bdf8, 1.2);
  for (const z of rows) for (const x of [-3.75, -0.75, 2.25]) {
    const dr = new THREE.Mesh(dropGeo, dropMat);
    dr.position.set(x, pipeY - 0.4, z);
    root.add(dr);
  }
  const jointGeo = new THREE.SphereGeometry(0.14, 14, 14);
  for (const x of [-4.8, 0, 4.8]) for (const z of rows) {
    const j = new THREE.Mesh(jointGeo, glowMaterial(0xbae6fd, 1.1));
    j.position.set(x, pipeY + 0.06, z);
    root.add(j);
  }
  const pulses = addPulses(root, curves, { per: 3, speed: 0.16, radius: 0.13, colors: [0xe0f2fe, 0xa5f3fc], boost: 1.9 });

  // Floating data particles.
  const N = 260;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 1] = 3.8 + Math.random() * 4;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: 0x7dd3fc, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.55 }));
  root.add(points);

  root.rotation.y = 0;
  stage.onTick((t, dt, p) => {
    flicker(dt);
    pulses(t);
    const arr = pgeo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] += dt * 0.35;
      if (arr[i * 3 + 1] > 8) arr[i * 3 + 1] = 3.8;
    }
    pgeo.attributes.position.needsUpdate = true;
    root.rotation.y = Math.sin(t * 0.12) * 0.18 + p.x * 0.22;
    root.rotation.x = p.y * 0.04;
  });
  stage.resize();
  return stage;
}
