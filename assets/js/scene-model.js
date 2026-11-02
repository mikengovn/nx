// Business model: five partner groups flow into the BD / project role, into an
// operating AI data center, and out to five revenue streams. Glowing pulses
// travel along every link.
import { THREE, createStage, addRacks, addPulses, addArrowHead, glowMaterial, edgeLines, label, floorGlow } from './stage.js';

const INPUTS = [
  { text: 'Landowners &amp; Industrial Parks', color: 0x34d399 },
  { text: 'Power, Water &amp; Fiber', color: 0xfbbf24 },
  { text: 'Capital &amp; Investors', color: 0xa78bfa },
  { text: 'GPU &amp; Equipment Suppliers', color: 0x38bdf8 },
  { text: 'AI Cloud &amp; Enterprises', color: 0xf472b6 },
];
const OUTPUTS = [
  'MDC Project Revenue',
  'GPU Cloud / Rental Revenue',
  'Colocation Revenue',
  'DCIM / Managed Service',
  'Token-based Revenue',
];
const YS = [6, 3, 0, -3, -6];
const BLUE = 0x377de8;

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

export default function init(host) {
  const stage = createStage(host, {
    viewHeight: 17.5,
    viewWidth: 31,
    camPos: [0, 7, 30],
    target: [0, -0.4, 0],
    bloom: { strength: 0.6, radius: 0.45, threshold: 0.55 },
    labels: true,
  });
  const { root } = stage;

  const glow = floorGlow(36, '#1d4f9a', 0.35);
  glow.rotation.x = 0;
  glow.position.set(0, 0, -3);
  root.add(glow);

  // Inputs (left).
  const spinners = [];
  const cube = new THREE.BoxGeometry(1.35, 1.35, 1.35);
  INPUTS.forEach((it, i) => {
    const m = new THREE.Mesh(cube, new THREE.MeshStandardMaterial({ color: it.color, emissive: it.color, emissiveIntensity: 0.18, metalness: 0.35, roughness: 0.4 }));
    m.position.set(-12, YS[i], 0);
    m.rotation.set(0.5, 0.7, 0);
    m.add(edgeLines(cube, it.color, 1.8));
    root.add(m);
    spinners.push(m);
    const l = label(`<span class="dot" style="background:${hex(it.color)}"></span>${it.text}`, 'lbl lbl-node');
    l.position.set(-12, YS[i] - 1.3, 0);
    root.add(l);
  });

  // The role (hub).
  const hubGeo = new THREE.BoxGeometry(3, 5.6, 1.2);
  const hub = new THREE.Mesh(hubGeo, new THREE.MeshStandardMaterial({ color: 0x16233a, emissive: BLUE, emissiveIntensity: 0.22, metalness: 0.4, roughness: 0.3, transparent: true, opacity: 0.92 }));
  hub.position.set(-4.2, 0, 0);
  hub.add(edgeLines(hubGeo, BLUE, 2.2));
  root.add(hub);
  // Five task slots glowing inside the hub.
  const slot = new THREE.BoxGeometry(2.2, 0.42, 0.1);
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(slot, glowMaterial(BLUE, 0.75 + i * 0.08));
    s.position.set(0, 1.9 - i * 0.95, 0.62);
    hub.add(s);
    const n = label(`${i + 1}`, 'lbl lbl-slot');
    n.position.set(-4.2, 1.9 - i * 0.95, 0.7);
    root.add(n);
  }
  const hubTitle = label('<span class="pill">This role</span><strong>Business &amp; Project Development Manager</strong>', 'lbl lbl-hub');
  hubTitle.position.set(-4.2, 4.15, 0);
  root.add(hubTitle);

  // Operating data center (mini isometric cluster).
  const dc = new THREE.Group();
  dc.position.set(4.6, -0.9, 0);
  dc.rotation.set(0.42, -0.78, 0);
  const padGeo = new THREE.BoxGeometry(4.2, 0.18, 4.2);
  const pad = new THREE.Mesh(padGeo, new THREE.MeshStandardMaterial({ color: 0x121925, roughness: 0.7 }));
  pad.add(edgeLines(padGeo, BLUE, 2));
  dc.add(pad);
  const rackPos = [];
  for (const x of [-1.2, 0, 1.2]) for (const z of [-1.2, 0, 1.2]) rackPos.push([x, z]);
  const rackGroup = new THREE.Group();
  rackGroup.position.y = 0.09;
  dc.add(rackGroup);
  const flicker = addRacks(rackGroup, rackPos, { w: 0.8, h: 1.9, d: 0.7, rows: 6 });
  root.add(dc);
  const dcLabel = label('<strong>Operational AI Data Center</strong>', 'lbl lbl-dc');
  dcLabel.position.set(4.6, -3.7, 0);
  root.add(dcLabel);

  // Outputs (right).
  const revGeo = new THREE.BoxGeometry(1.25, 1.25, 1.25);
  OUTPUTS.forEach((text, i) => {
    const m = new THREE.Mesh(revGeo, new THREE.MeshStandardMaterial({ color: 0x1c3766, emissive: BLUE, emissiveIntensity: 0.25, metalness: 0.4, roughness: 0.35 }));
    m.position.set(12, YS[i], 0);
    m.rotation.set(0.5, -0.7, 0);
    m.add(edgeLines(revGeo, 0x6fa6ff, 1.8));
    root.add(m);
    spinners.push(m);
    const l = label(text, 'lbl lbl-node');
    l.position.set(12, YS[i] - 1.25, 0);
    root.add(l);
  });

  // Links.
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const curves = [];
  const colors = [];
  INPUTS.forEach((it, i) => {
    curves.push(new THREE.CubicBezierCurve3(V(-11.1, YS[i]), V(-8.6, YS[i]), V(-8, YS[i] * 0.42), V(-5.95, YS[i] * 0.42)));
    colors.push(it.color);
  });
  curves.push(new THREE.LineCurve3(V(-2.6, 0), V(1.7, 0)));
  colors.push(BLUE);
  YS.forEach((y) => {
    curves.push(new THREE.CubicBezierCurve3(V(7.2, 0), V(9.2, 0), V(9.3, y), V(11.05, y)));
    colors.push(0x6fa6ff);
  });
  curves.forEach((c, i) => {
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(c, 64, 0.045, 8, false),
      new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: 0.32 }),
    );
    root.add(tube);
    addArrowHead(root, c, colors[i], 0.24);
  });
  const pulses = addPulses(root, curves, { per: 3, speed: 0.22, radius: 0.13, colors, boost: 2.2 });

  stage.onTick((t, dt, p) => {
    pulses(t);
    flicker(dt);
    spinners.forEach((m, i) => { m.rotation.y += dt * (0.35 + i * 0.02); });
    dc.rotation.y = -0.78 + Math.sin(t * 0.3) * 0.12;
    root.rotation.y = p.x * 0.1;
    root.rotation.x = p.y * 0.05;
  });
  stage.resize();
  return stage;
}
