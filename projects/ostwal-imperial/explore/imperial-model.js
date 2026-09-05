import * as THREE from 'three';

export const PROJECT = {
  name: 'Ostwal Imperial',
  address: 'Near Terapanth Bhavan, Devisha Road, Palghar (West) 401404',
  rera: 'P99000049283',
  topFloor: 16,
};

const B1_WING = [
  { type: '3 BHK', rera: 1050, sanc: 987 },
  { type: '2 BHK', rera: 704, sanc: 661 },
  { type: '2 BHK', rera: 688, sanc: 648 },
  { type: '1 BHK', rera: 432, sanc: 407 },
  { type: '1 BHK', rera: 432, sanc: 407 },
];
const B2_WING_A = [
  { type: '3 BHK', rera: 777, sanc: 737 },
  { type: '2 BHK', rera: 607, sanc: 579 },
  { type: '1 BHK', rera: 433, sanc: 419 },
  { type: '1 BHK', rera: 433, sanc: 419 },
  { type: '1 BHK', rera: 433, sanc: 419 },
];
const B2_WING_B = [
  { type: '2 BHK', rera: 607, sanc: 579 },
  { type: '1 BHK', rera: 433, sanc: 419 },
  { type: '1 BHK', rera: 433, sanc: 419 },
  { type: '1 BHK', rera: 433, sanc: 419 },
  { type: '1 BHK', rera: 433, sanc: 419 },
  { type: '1 BHK', rera: 433, sanc: 419 },
  { type: '2 BHK', rera: 607, sanc: 579 },
];

export const BUILDINGS = [
  {
    id: 'B1', label: 'Building 01', wingLabel: 'Wings A & B',
    wings: { A: B1_WING, B: B1_WING },
    refuge: [8, 13],
    site: { x: -22, z: 20 }, rot: 0,
    planName: (f) => (f === 1 ? '1st floor plan' : f === 2 ? '2nd floor plan' : 'Typical plan · 3–16'),
    note: (f) => (f === 1 ? 'Distinct 1st-floor plate — society office at the Wing A end.'
      : f === 2 ? 'Distinct 2nd-floor plate.'
      : [8, 13].includes(f) ? 'Refuge floor — the end flat of each wing is given over to refuge area.'
      : ''),
  },
  {
    id: 'B2', label: 'Building 02', wingLabel: 'Wing A · 5 + Wing B · 7',
    wings: { A: B2_WING_A, B: B2_WING_B },
    refuge: [],
    site: { x: 24, z: -12 }, rot: -Math.PI / 2,
    planName: () => 'Typical plan · 1–16',
    note: () => '',
  },
];

const FLOOR_H = 3.0;
const DEPTH = 9.5;
const PODIUM_H = 6.6;
const SQFT_PER_M2 = 10.7639;

const widthOf = (u) => Math.max(3.6, (u.rera / SQFT_PER_M2) / DEPTH);

/** Centre of the landscaped strip, in site coordinates — the model and the aspect labels share it. */
export const GARDEN = { x: 1, z: -12 };

/**
 * Aspect derived from geometry, not from the wing letter: the wing's outward normal
 * (+z for A, -z for B) is rotated by the building's own rotation, then read as a
 * compass bearing and tested against the direction of the garden. Turn or move a
 * tower and the labels follow.
 */
/** Outward normal of a wing in site coordinates (+x north, +z east). */
function outward(bld, wing) {
  const nz = wing === 'A' ? 1 : -1;
  const r = bld.rot || 0;
  return { x: nz * Math.sin(r), z: nz * Math.cos(r) };
}

function aspect(bld, wing) {
  const { x: dx, z: dz } = outward(bld, wing);
  const compass = Math.abs(dx) > Math.abs(dz)
    ? (dx > 0 ? 'North' : 'South')
    : (dz > 0 ? 'East' : 'West');
  const gx = GARDEN.x - bld.site.x, gz = GARDEN.z - bld.site.z;
  const onto = (dx * gx + dz * gz) > 0 ? 'garden facing' : 'road facing';
  return `${compass} — ${onto}`;
}

function wingUnits(bld, floor, wing) {
  let list = bld.wings[wing];
  if (bld.refuge.includes(floor) || (bld.id === 'B1' && floor === 1)) list = list.slice(0, -1);
  return list;
}

/** Full inventory, with each unit's local x offset and width so the 2D plate can be drawn from the same numbers. */
export function inventory() {
  const out = [];
  for (const bld of BUILDINGS) {
    const spans = {};
    for (const wing of ['A', 'B']) spans[wing] = bld.wings[wing].reduce((s, u) => s + widthOf(u), 0);
    const total = Math.max(spans.A, spans.B);
    for (let floor = 1; floor <= PROJECT.topFloor; floor++) {
      for (const wing of ['A', 'B']) {
        const list = wingUnits(bld, floor, wing);
        let x = -total / 2;
        list.forEach((u, i) => {
          const w = widthOf(u);
          const corner = i === 0 || i === list.length - 1;
          out.push({
            id: `${bld.id === 'B1' ? '' : 'II-'}${wing}-${floor}${String(i + 1).padStart(2, '0')}`,
            bldg: bld.id, bldgLabel: bld.label, wing, floor,
            type: u.type, rera: u.rera, sanc: u.sanc,
            balconies: u.type === '1 BHK' ? 1 : 2,
            facing: aspect(bld, wing) + (corner ? ' · corner, two-side open' : ''),
            bearing: outward(bld, wing),
            planName: bld.planName(floor),
            note: bld.note(floor),
            x: x + w / 2, w, z: wing === 'A' ? 1 : -1,
            plateWidth: total,
          });
          x += w;
        });
      }
    }
  }
  return out;
}

export const summary = (units) => {
  const byType = {};
  units.forEach((u) => { byType[u.type] = (byType[u.type] || 0) + 1; });
  return { total: units.length, byType };
};

// ────────────────────────────── geometry ──────────────────────────────

function mats() {
  const m = {
    stone: new THREE.MeshStandardMaterial({ name: 'stone', color: 0xd6c3a6, roughness: 0.9 }),
    trim: new THREE.MeshStandardMaterial({ name: 'trim', color: 0xe6d6bf, emissive: 0xffc98a, emissiveIntensity: 0.05, roughness: 0.8 }),
    slab: new THREE.MeshStandardMaterial({ name: 'slab', color: 0xb8a48a, roughness: 0.9 }),
    shade: new THREE.MeshStandardMaterial({ name: 'shade', color: 0x8f7860, emissive: 0xff9740, emissiveIntensity: 0.42, roughness: 0.95 }),
    glass: new THREE.MeshStandardMaterial({ name: 'glass', color: 0x10161c, emissive: 0xffc07a, emissiveIntensity: 1.7, roughness: 0.16, metalness: 0.35 }),
    iron: new THREE.MeshStandardMaterial({ name: 'iron', color: 0x312a23, roughness: 0.6, metalness: 0.3 }),
    podium: new THREE.MeshStandardMaterial({ name: 'podium', color: 0x4d3a2c, roughness: 0.85 }),
    paving: new THREE.MeshStandardMaterial({ name: 'paving', color: 0x9c968b, roughness: 1 }),
    road: new THREE.MeshStandardMaterial({ name: 'road', color: 0x4a4a48, roughness: 1 }),
    lawn: new THREE.MeshStandardMaterial({ name: 'lawn', color: 0x3f5233, roughness: 1 }),
    foliage: new THREE.MeshStandardMaterial({ name: 'foliage', color: 0x415530, roughness: 1 }),
    gold: new THREE.MeshStandardMaterial({ name: 'gold_highlight', color: 0xcba135, emissive: 0x6a4f10, roughness: 0.4, metalness: 0.3 }),
    select: new THREE.MeshStandardMaterial({ name: 'gold_selected', color: 0xe8c266, emissive: 0x8a6714, roughness: 0.35, metalness: 0.3 }),
  };
  m.dim = {};
  for (const k of ['stone', 'trim', 'shade', 'glass', 'iron', 'slab']) {
    m.dim[k] = m[k].clone();
    m.dim[k].name = `${k}_dim`;
    m.dim[k].color.setHex(0x39404a);
    m.dim[k].emissive.setHex(0x000000);
    m.dim[k].roughness = 1;
    m.dim[k].metalness = 0;
    m.dim[k].transparent = true;
    m.dim[k].opacity = 0.5;
  }

  // Facade skins: perspective-rectified crops of the brochure's night render.
  // The same image drives colour and emissive, so the windows that are lit in
  // the render are the windows that glow in the model.
  const loader = new THREE.TextureLoader();
  const tex = (url) => {
    const t = loader.load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  const facadeTex = tex('assets/tex-facade.jpeg');
  const crownTex = tex('assets/tex-crown.jpeg');
  const endTex = tex('assets/tex-endwall.jpeg');
  const skin = (name, t, o = {}) => new THREE.MeshStandardMaterial({
    name, map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 1.45, roughness: 0.9, metalness: 0, ...o,
  });
  m.facade = skin('facade', facadeTex);
  m.crownSkin = skin('crown_skin', crownTex);
  m.endSkin = skin('endwall_skin', endTex, { emissiveIntensity: 0.5 });
  m.facadeA = [m.stone, m.stone, m.stone, m.stone, m.facade, m.stone];   // outward face is +z
  m.facadeB = [m.stone, m.stone, m.stone, m.stone, m.stone, m.facade];   // outward face is -z
  // Dimmed floors keep their facade, just unlit and pushed back.
  const dimSkin = skin('facade_dim', facadeTex, { color: 0x9da3ad, emissive: 0xffffff, emissiveIntensity: 0.28, transparent: true, opacity: 0.95 });
  m.dim.facadeA = [m.dim.stone, m.dim.stone, m.dim.stone, m.dim.stone, dimSkin, m.dim.stone];
  m.dim.facadeB = [m.dim.stone, m.dim.stone, m.dim.stone, m.dim.stone, m.dim.stone, dimSkin];
  // Selection and hover keep the facade but tint it gold, rather than swapping to a flat gold block.
  m.select = skin('facade_selected', facadeTex, { color: 0xffd98a, emissive: 0xffc35c, emissiveIntensity: 1.35 });
  m.hover = skin('facade_hover', facadeTex, { color: 0xffe6b8, emissive: 0xffd27a, emissiveIntensity: 1.0 });
  return m;
}

/** Width in metres covered by one repeat of the facade tile (four bays), and
 *  the number of storeys in it. Shared by every skinned box so the pattern is
 *  continuous across flat boundaries and from floor to floor. */
const TILE_W = 18.4;
const TILE_FLOORS = 2;

/**
 * A box with one face carrying a slice of a texture. `face` is the BoxGeometry
 * face index (0 +x, 1 -x, 4 +z, 5 -z); the UV window is given in texture repeats.
 */
function skinBox(name, w, h, d, x, y, z, mats, face, u0, u1, v0, v1) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  for (let i = 0; i < 4; i++) {
    const k = face * 4 + i;
    uv.setXY(k, uv.getX(k) > 0.5 ? u1 : u0, uv.getY(k) > 0.5 ? v1 : v0);
  }
  uv.needsUpdate = true;
  const mesh = new THREE.Mesh(geo, mats);
  mesh.name = name; mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

const box = (name, w, h, d, x, y, z, mat) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.name = name; mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
};

function cornice(g, name, w, d, x, y, z, M) {
  g.add(box(`${name}_a`, w + 0.7, 0.5, d + 0.7, x, y + 0.25, z, M.trim));
  g.add(box(`${name}_b`, w + 1.7, 0.7, d + 1.7, x, y + 0.85, z, M.trim));
  g.add(box(`${name}_c`, w + 1.0, 0.45, d + 1.0, x, y + 1.4, z, M.shade));
}

function pediment(g, name, w, x, y, z, M) {
  const grp = new THREE.Group();
  grp.name = name; grp.position.set(x, y, z);
  grp.add(box(`${name}_attic`, w, 3.4, 5.2, 0, 1.7, 0, M.trim));
  grp.add(box(`${name}_win`, w - 2.2, 2.0, 0.2, 0, 1.9, 2.65, M.glass));
  const s = new THREE.Shape();
  s.moveTo(-w / 2 - 0.7, 0); s.lineTo(w / 2 + 0.7, 0); s.lineTo(0, w * 0.26); s.closePath();
  const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 1.1, bevelEnabled: false }), M.trim);
  tri.name = `${name}_gable`; tri.position.set(0, 3.4, 2.1);
  tri.castShadow = true;
  grp.add(tri);
  grp.add(box(`${name}_gableback`, w + 1.4, w * 0.14, 4.2, 0, 3.4 + w * 0.07, 0, M.shade));
  g.add(grp);
}

function palm(name, x, z, h, M) {
  const g = new THREE.Group(); g.name = name;
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.26, h, 10), M.podium);
  t.name = `${name}_trunk`; t.position.y = h / 2; t.castShadow = true;
  g.add(t);
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), M.foliage);
    f.name = `${name}_frond_${i}`;
    f.scale.set(1.7, 0.2, 0.5);
    const a = i * 1.047;
    f.position.set(Math.cos(a) * 1.5, h + 0.3 - (i % 2) * 0.35, Math.sin(a) * 1.5);
    f.rotation.set(0, -a, -0.42 + (i % 2) * 0.18);
    f.castShadow = true;
    g.add(f);
  }
  g.position.set(x, 0, z);
  return g;
}

/**
 * Builds the two-tower site. Every flat is its own named, pickable mesh carrying its
 * inventory record in userData, so the page can raycast straight to a unit.
 */
export function buildProject() {
  const M = mats();
  const root = new THREE.Group();
  root.name = 'ostwal_imperial';
  const units = inventory();
  const pickable = [];
  const dimmable = [];   // { mesh, base, dim, floor, bldg }

  const track = (mesh, key, floor, bldg) => {
    mesh.userData.baseMat = M[key];
    dimmable.push({ mesh, base: M[key], dim: M.dim[key], floor, bldg });
    return mesh;
  };

  for (const bld of BUILDINGS) {
    const g = new THREE.Group();
    g.name = bld.id;
    g.position.set(bld.site.x, 0, bld.site.z);
    g.rotation.y = bld.rot || 0;
    const mine = units.filter((u) => u.bldg === bld.id);
    const total = mine[0].plateWidth;
    const plateD = (2.25 + DEPTH) * 2;
    const H = PROJECT.topFloor * FLOOR_H;

    // podium: retail + parking
    g.add(box(`${bld.id}_podium`, total + 7, PODIUM_H, plateD + 6, 0, PODIUM_H / 2, 0, M.podium));
    g.add(box(`${bld.id}_shopfront_a`, total + 5, 3.8, 0.4, 0, 2.6, (plateD + 6) / 2 - 0.1, M.glass));
    g.add(box(`${bld.id}_shopfront_b`, total + 5, 3.8, 0.4, 0, 2.6, -(plateD + 6) / 2 + 0.1, M.glass));
    cornice(g, `${bld.id}_podium_cornice`, total + 7, plateD + 6, 0, PODIUM_H - 0.8, 0, M);
    g.add(box(`${bld.id}_entry`, 12, 5.8, 3.4, 0, 2.9, (plateD + 6) / 2 + 1.6, M.trim));
    g.add(box(`${bld.id}_entry_glass`, 8, 4.4, 3.6, 0, 2.3, (plateD + 6) / 2 + 1.6, M.glass));

    // service core spine + the tall blank end walls from the renders
    g.add(box(`${bld.id}_core`, total, H, 4.5, 0, PODIUM_H + H / 2, 0, M.stone));
    for (const s of [-1, 1]) {
      const x = s * (total / 2 + 2.4);
      const endMats = [M.stone, M.stone, M.stone, M.stone, M.stone, M.stone];
      endMats[s > 0 ? 0 : 1] = M.endSkin;
      g.add(skinBox(`${bld.id}_endwall_${s > 0 ? 'r' : 'l'}`, 4.8, H + 4.5, 14, x, PODIUM_H + (H + 4.5) / 2, 0,
        endMats, s > 0 ? 0 : 1, 0, 1, 0, 1));
      cornice(g, `${bld.id}_endcrown_${s > 0 ? 'r' : 'l'}`, 4.8, 14, x, PODIUM_H + H + 4.5, 0, M);
      pediment(g, `${bld.id}_endped_${s > 0 ? 'r' : 'l'}`, 5.6, x, PODIUM_H + H + 6.1, 4.0, M);
    }

    // floor plates
    for (let f = 1; f <= PROJECT.topFloor; f++) {
      const y = PODIUM_H + (f - 1) * FLOOR_H;
      g.add(track(box(`${bld.id}_plate_${f}`, total + 0.4, 0.22, plateD + 0.5, 0, y + 0.11, 0, M.slab), 'slab', f, bld.id));
    }

    // flats
    for (const u of mine) {
      const y = PODIUM_H + (u.floor - 1) * FLOOR_H;
      const zc = u.z * (2.25 + DEPTH / 2);
      const face = u.z * (2.25 + DEPTH);
      const x0 = u.x - u.w / 2 + total / 2;                     // metres from the left end of the elevation
      const v0 = ((u.floor - 1) % TILE_FLOORS) / TILE_FLOORS;
      const key = u.z > 0 ? 'facadeA' : 'facadeB';
      const shell = skinBox(`${bld.id}_flat_${u.id}`, u.w - 0.14, FLOOR_H - 0.34, DEPTH, u.x, y + 0.3 + (FLOOR_H - 0.34) / 2, zc,
        M[key], u.z > 0 ? 4 : 5, x0 / TILE_W, (x0 + u.w) / TILE_W, v0, v0 + 1 / TILE_FLOORS);
      shell.userData.unit = u;
      g.add(track(shell, key, u.floor, bld.id));
      pickable.push(shell);
    }

    // crown
    const topY = PODIUM_H + H;
    cornice(g, `${bld.id}_crown`, total, plateD, 0, topY, 0, M);
    for (const side of [1, -1]) {
      const cm = [M.stone, M.stone, M.stone, M.stone, M.stone, M.stone];
      cm[side > 0 ? 4 : 5] = M.crownSkin;
      g.add(skinBox(`${bld.id}_crownband_${side > 0 ? 'f' : 'b'}`, total, 2.4, 1.2, 0, topY + 1.2, side * (plateD / 2 - 0.5),
        cm, side > 0 ? 4 : 5, 0, total / TILE_W, 0, 1));
    }
    g.add(box(`${bld.id}_roof`, total - 1, 0.3, plateD - 1, 0, topY + 1.75, 0, M.paving));
    pediment(g, `${bld.id}_ped_front`, 13, 0, topY + 1.9, plateD / 2 - 3.4, M);
    const pedBack = new THREE.Group();
    pedBack.rotation.y = Math.PI;
    pediment(pedBack, `${bld.id}_ped_back`, 13, 0, topY + 1.9, plateD / 2 - 3.4, M);
    g.add(pedBack);
    g.add(box(`${bld.id}_liftroom`, 8, 4.4, 6, -total / 4, topY + 3.9, -2, M.trim));
    cornice(g, `${bld.id}_liftroom_cornice`, 8, 6, -total / 4, topY + 5.9, -2, M);
    g.add(box(`${bld.id}_tankroom`, 6, 3.4, 5, total / 4, topY + 3.4, -2.5, M.trim));
    cornice(g, `${bld.id}_tankroom_cornice`, 6, 5, total / 4, topY + 4.9, -2.5, M);

    root.add(g);
  }

  // ── site ──
  root.add(box('ground', 168, 0.4, 158, -2, -0.25, -8, M.lawn));
  root.add(box('plaza_b1', 56, 0.4, 40, -22, -0.02, 20, M.paving));
  root.add(box('plaza_b2', 40, 0.4, 56, 24, -0.02, -12, M.paving));
  root.add(box('road_front', 160, 0.44, 14, -2, 0.0, 46, M.road));
  root.add(box('road_side', 14, 0.44, 150, 52, 0.0, -14, M.road));
  root.add(box('road_entry', 160, 0.44, 13, -2, 0.0, -44, M.road));
  root.add(box('garden', 16, 0.5, 36, GARDEN.x, 0.05, GARDEN.z, M.lawn));
  for (let i = 0; i < 3; i++) {
    const cz = GARDEN.z - 14 + i * 14;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 0.25, 32), M.paving);
    ring.name = `garden_ring_${i}`; ring.position.set(GARDEN.x, 0.22, cz); ring.receiveShadow = true;
    root.add(ring);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.3, 0.3, 32), M.lawn);
    inner.name = `garden_lawn_${i}`; inner.position.set(GARDEN.x, 0.3, cz);
    root.add(inner);
  }
  for (let i = 0; i < 9; i++) root.add(box(`wall_front_${i}`, 1.1, 2.2, 1.1, -54 + i * 11, 1.1, 38, M.shade));
  for (let i = 0; i < 8; i++) root.add(box(`wall_side_${i}`, 1.1, 2.2, 1.1, 44, 1.1, 24 - i * 11, M.shade));
  [[-50, 38], [-26, 38], [-4, 38], [12, 34], [38, 24], [38, 2], [38, -22], [38, -38], [-8, -36], [-32, -36], [-50, -12], [-50, 8]]
    .forEach(([x, z], i) => root.add(palm(`palm_${i}`, x, z, 6.5 + (i % 3) * 1.5, M)));

  const bb = new THREE.Box3().setFromObject(root);
  const c = bb.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -bb.min.y, -c.z);

  return { root, units, pickable, dimmable, materials: M, FLOOR_H, PODIUM_H, DEPTH };
}
