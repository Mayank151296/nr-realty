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
    refuge: [8, 13],
    site: { x: 24, z: -12 }, rot: -Math.PI / 2,
    planName: (f) => ([8, 13].includes(f) ? 'Refuge floor plate' : 'Typical plan · 1–16'),
    note: (f) => ([8, 13].includes(f) ? 'Refuge floor — the end flat of each wing is given over to refuge area.' : ''),
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
    stone: new THREE.MeshStandardMaterial({ name: 'stone', color: 0xdac5b7, roughness: 0.9 }),
    trim: new THREE.MeshStandardMaterial({ name: 'trim', color: 0xf7eadc, roughness: 0.75 }),
    shade: new THREE.MeshStandardMaterial({ name: 'shade', color: 0xaf8e7b, roughness: 0.95 }),
    glass: new THREE.MeshStandardMaterial({ name: 'glass', color: 0x2b3841, roughness: 0.16, metalness: 0.35 }),
    iron: new THREE.MeshStandardMaterial({ name: 'iron', color: 0x312a23, roughness: 0.6, metalness: 0.3 }),
    podium: new THREE.MeshStandardMaterial({ name: 'podium', color: 0x59514b, roughness: 0.85 }),
    paving: new THREE.MeshStandardMaterial({ name: 'paving', color: 0x9c968b, roughness: 1 }),
    road: new THREE.MeshStandardMaterial({ name: 'road', color: 0x4a4a48, roughness: 1 }),
    lawn: new THREE.MeshStandardMaterial({ name: 'lawn', color: 0x54683f, roughness: 1 }),
    foliage: new THREE.MeshStandardMaterial({ name: 'foliage', color: 0x415530, roughness: 1 }),
    gold: new THREE.MeshStandardMaterial({ name: 'gold_highlight', color: 0xcba135, emissive: 0x6a4f10, roughness: 0.4, metalness: 0.3 }),
    select: new THREE.MeshStandardMaterial({ name: 'gold_selected', color: 0xe8c266, emissive: 0x8a6714, roughness: 0.35, metalness: 0.3 }),
  };
  m.dim = {};
  for (const k of ['stone', 'trim', 'shade', 'glass', 'iron']) {
    m.dim[k] = m[k].clone();
    m.dim[k].name = `${k}_dim`;
    m.dim[k].color.setHex(0x4a4238);
    m.dim[k].emissive.setHex(0x000000);
    m.dim[k].roughness = 1;
    m.dim[k].metalness = 0;
    m.dim[k].transparent = true;
    m.dim[k].opacity = 0.5;
  }
  return m;
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
    mesh.userData.floor=floor; mesh.userData.bldg=bldg;
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
      g.add(box(`${bld.id}_endwall_${s > 0 ? 'r' : 'l'}`, 4.8, H + 4.5, 14, x, PODIUM_H + (H + 4.5) / 2, 0, M.stone));
      for (let i = 0; i < 4; i++) {
        const fy = PODIUM_H + (H + 4.5) * (0.17 + i * 0.22);
        g.add(box(`${bld.id}_endpanel_${s > 0 ? 'r' : 'l'}_${i}`, 0.22, 6.2, 9.5, x + s * 2.45, fy, 0, M.trim));
        g.add(box(`${bld.id}_endinset_${s > 0 ? 'r' : 'l'}_${i}`, 0.22, 5.0, 8.0, x + s * 2.52, fy, 0, M.shade));
      }
      cornice(g, `${bld.id}_endcrown_${s > 0 ? 'r' : 'l'}`, 4.8, 14, x, PODIUM_H + H + 4.5, 0, M);
      pediment(g, `${bld.id}_endped_${s > 0 ? 'r' : 'l'}`, 5.6, x, PODIUM_H + H + 6.1, 4.0, M);
    }

    // floor plates
    for (let f = 1; f <= PROJECT.topFloor; f++) {
      const y = PODIUM_H + (f - 1) * FLOOR_H;
      g.add(track(box(`${bld.id}_plate_${f}`, total + 1.0, 0.3, plateD + 1.0, 0, y + 0.15, 0, M.trim), 'trim', f, bld.id));
    }


    // Modeled recessed glazing and balcony rails.
    for (const u of mine) {
      const y=PODIUM_H+(u.floor-1)*FLOOR_H;
      const face=u.z*(2.25+DEPTH);
      function part(n,w,h,d,x,yy,z,key) {
        const m=box(n+'_'+u.id,w,h,d,x,yy,z,M[key]);
        m.userData.unit=u;g.add(track(m,key,u.floor,bld.id));return m;
      }
      const shell=part('flat',u.w-0.14,2.66,DEPTH-1.25,u.x,y+1.63,u.z*(2.25+(DEPTH-1.25)/2),'stone');
      pickable.push(shell);
      const glass=part('window',u.w-0.9,2.15,0.08,u.x,y+1.43,face-u.z*1.2,'glass');
      pickable.push(glass);
      part('balcony',u.w-0.12,0.18,1.55,u.x,y+0.32,face-u.z*0.48,'trim');
      part('mullion',0.09,2.2,0.14,u.x,y+1.43,face-u.z*1.12,'iron');
      part('column',0.38,2.72,0.65,u.x-u.w/2+0.14,y+1.65,face-u.z*0.1,'trim');
      part('rail_top',u.w-0.52,0.07,0.09,u.x,y+1.4,face+u.z*0.19,'iron').castShadow=false;
      part('rail_bottom',u.w-0.52,0.05,0.09,u.x,y+0.57,face+u.z*0.19,'iron').castShadow=false;
      const n=Math.max(5,Math.floor((u.w-0.6)/0.28));
      const bars=new THREE.InstancedMesh(new THREE.BoxGeometry(0.035,0.83,0.035),M.iron,n);
      const matrix=new THREE.Matrix4();
      for(let i=0;i<n;i++) {
        matrix.makeTranslation(u.x-u.w/2+0.36+i*(u.w-0.72)/(n-1),y+0.985,face+u.z*0.19);
        bars.setMatrixAt(i,matrix);
      }
      bars.name='balusters_'+u.id;g.add(track(bars,'iron',u.floor,bld.id));
    }
    // crown
    const topY = PODIUM_H + H;
    cornice(g, `${bld.id}_crown`, total, plateD, 0, topY, 0, M);
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


  for(let x=-70;x<65;x+=9) root.add(box('lane_mark',4,0.03,0.16,x,0.25,46,M.trim));
  for(let z=-72;z<58;z+=9) root.add(box('lane_mark',0.16,0.03,4,52,0.25,z,M.trim));
  const carMats=[0x283a4d,0xa24b39,0xe1ddd5,0x303436].map(color=>new THREE.MeshStandardMaterial({color,roughness:0.3}));
  for(let i=0;i<11;i++) {
    const x=-46+i*4.3,z=35;
    root.add(box('parking_line',0.08,0.025,4.5,x-1.7,0.24,z,M.trim));
    root.add(box('car_body',1.75,0.75,3.8,x,0.75,z,carMats[i%4]));
    root.add(box('car_cabin',1.5,0.62,2.0,x,1.35,z-0.2,M.glass));
  }
  const leaves=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,2),M.foliage,72);
  const dummy=new THREE.Object3D();
  for(let i=0;i<72;i++) {
    const side=i%4,k=Math.floor(i/4),t=-70+k*8;
    const x=side<2?t:(side===2?-70:70),z=side<2?(side===0?-66:66):t;
    const h=5+(i%5)*0.5;
    root.add(box('tree_trunk',0.35,h,0.35,x,h/2,z,M.podium));
    dummy.position.set(x,h,z);dummy.scale.set(3+(i%3)*0.3,3.9,3);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
  }
  leaves.castShadow=true;root.add(leaves);
  const bb = new THREE.Box3().setFromObject(root);

  const c = bb.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -bb.min.y, -c.z);

  return { root, units, pickable, dimmable, materials: M, FLOOR_H, PODIUM_H, DEPTH };
}
