import * as THREE from 'three';

const SQFT = 10.7639;
const WALL = 1.42;      // cut-wall height, the 3D-floor-plan convention
const T = 0.1;          // wall thickness

/** Room rectangles in metres, laid out from the flat's near-left corner. */
const LAYOUTS = {
  '1 BHK': {
    env: [8.2, 5.0],
    rooms: [
      { name: 'Balcony', kind: 'balcony', r: [0, 0, 3.2, 1.3] },
      { name: 'Living / Dining', kind: 'living', r: [0, 1.3, 3.2, 3.7] },
      { name: 'Kitchen', kind: 'kitchen', r: [3.2, 0, 2.2, 2.2] },
      { name: 'Bath', kind: 'bath', r: [3.2, 2.2, 2.2, 1.5] },
      { name: 'Entry', kind: 'passage', r: [3.2, 3.7, 2.2, 1.3] },
      { name: 'Bedroom', kind: 'bed', r: [5.4, 0, 2.8, 3.4] },
      { name: 'Passage', kind: 'passage', r: [5.4, 3.4, 2.8, 1.6] },
    ],
  },
  '2 BHK': {
    env: [11.0, 5.6],
    rooms: [
      { name: 'Balcony', kind: 'balcony', r: [0, 0, 3.2, 1.3] },
      { name: 'Living / Dining', kind: 'living', r: [0, 1.3, 3.2, 4.3] },
      { name: 'Kitchen', kind: 'kitchen', r: [3.2, 0, 2.4, 2.5] },
      { name: 'Bath 1', kind: 'bath', r: [3.2, 2.5, 2.4, 1.5] },
      { name: 'Entry', kind: 'passage', r: [3.2, 4.0, 2.4, 1.6] },
      { name: 'Bedroom 1', kind: 'bed', r: [5.6, 0, 2.8, 3.3] },
      { name: 'Balcony 2', kind: 'balcony', r: [8.4, 0, 2.6, 1.3] },
      { name: 'Bath 2', kind: 'bath', r: [8.4, 1.3, 2.6, 2.0] },
      { name: 'Bedroom 2', kind: 'bed', r: [5.6, 3.3, 5.4, 2.3] },
    ],
  },
  '3 BHK': {
    env: [13.0, 6.6],
    rooms: [
      { name: 'Balcony', kind: 'balcony', r: [0, 0, 3.6, 1.4] },
      { name: 'Living / Dining', kind: 'living', r: [0, 1.4, 3.6, 5.2] },
      { name: 'Kitchen', kind: 'kitchen', r: [3.6, 0, 2.8, 2.8] },
      { name: 'Bath 1', kind: 'bath', r: [3.6, 2.8, 2.8, 1.6] },
      { name: 'Entry', kind: 'passage', r: [3.6, 4.4, 2.8, 2.2] },
      { name: 'Bedroom 1', kind: 'bed', r: [6.4, 0, 3.2, 3.4] },
      { name: 'Bath 2', kind: 'bath', r: [9.6, 0, 3.4, 1.7] },
      { name: 'Bedroom 2', kind: 'bed', r: [9.6, 1.7, 3.4, 3.3] },
      { name: 'Bedroom 3', kind: 'bed', r: [6.4, 3.4, 3.2, 3.2] },
      { name: 'Balcony 2', kind: 'balcony', r: [9.6, 5.0, 3.4, 1.6] },
    ],
  },
};

export const ROOM_COLOR = {
  living: '#d8c7a8', bed: '#8a5f36', kitchen: '#e2dccd',
  bath: '#8ea4b0', balcony: '#6d675e', passage: '#c0b39a',
};

/** A room name-plate that always faces the camera. Drawn to a canvas so it
 *  carries the page's own gold-on-charcoal styling rather than raw 3D text. */
function labelSprite(title, sub, worldWidth) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const F1 = '500 46px Jost, system-ui, sans-serif';
  const F2 = '400 34px Jost, system-ui, sans-serif';
  g.font = F1; const w1 = g.measureText(title).width;
  g.font = F2; const w2 = g.measureText(sub).width;
  const w = Math.ceil(Math.max(w1, w2)) + 56, h = sub ? 136 : 92;
  c.width = w; c.height = h;
  const r = 26, x = 2, y = 2, ww = w - 4, hh = h - 4;
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, ww, hh, r);
  else g.rect(x, y, ww, hh);
  g.fillStyle = 'rgba(14,16,18,.86)'; g.fill();
  g.strokeStyle = 'rgba(203,161,53,.6)'; g.lineWidth = 3; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = sub ? '#f2ece1' : '#cba135'; g.font = F1; g.fillText(title, w / 2, sub ? 50 : h / 2);
  if (sub) { g.fillStyle = '#cba135'; g.font = F2; g.fillText(sub, w / 2, 96); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.92,
  }));
  sp.renderOrder = 20;
  sp.scale.set(worldWidth, worldWidth * h / w, 1);
  return sp;
}

/** Lift one room clear of the others and fade the rest of the name-plates.
 *  Pass null to return to the resting state. */
export function focusRoom(model, name) {
  model.focus = name || null;
  for (const r of model.rooms) {
    const on = name && r.name === name;
    r.targetY = on ? 0.42 : 0;
    r.targetO = !name ? 0.9 : (on ? 1 : 0.1);
  }
}

/** Damped step toward the focus state. Called from the render loop so a
 *  change of mind mid-move retargets instead of restarting. */
export function stepFocus(model, dt) {
  if (!model || !model.rooms) return;
  for (const r of model.rooms) {
    const t = r.targetY || 0, y = r.group.position.y;
    if (Math.abs(y - t) > 0.0005) r.group.position.y = y + (t - y) * Math.min(1, dt * 10);
    if (r.label) {
      const o = r.label.material.opacity, to = r.targetO ?? 0.9;
      if (Math.abs(o - to) > 0.002) r.label.material.opacity = o + (to - o) * Math.min(1, dt * 10);
    }
  }
}

/** Map a raycast hit back to the room record that owns it. */
export function roomAt(model, intersects) {
  for (const hit of intersects) {
    let o = hit.object;
    while (o) {
      const found = model.rooms.find((r) => r.group === o);
      if (found) return found;
      o = o.parent;
    }
  }
  return null;
}

function materials() {
  const std = (name, color, o = {}) => new THREE.MeshStandardMaterial({ name, color, roughness: 0.85, ...o });
  return {
    living: std('floor_tile', 0xd8c7a8),
    bed: std('floor_wood', 0x8a5f36, { roughness: 0.7 }),
    kitchen: std('floor_kitchen', 0xe2dccd),
    bath: std('floor_bath', 0x8ea4b0, { roughness: 0.4 }),
    balcony: std('deck', 0x6d675e, { roughness: 1 }),
    passage: std('floor_passage', 0xc0b39a),
    wall: std('wall', 0xf1ece2, { roughness: 0.95 }),
    wallTop: std('wall_top', 0xcbc3b5, { roughness: 0.95 }),
    rail: std('railing', 0x2f2a24, { roughness: 0.5, metalness: 0.3 }),
    soft: std('upholstery', 0x3f4b4f, { roughness: 0.95 }),
    wood: std('joinery', 0x5c4230, { roughness: 0.7 }),
    stoneTop: std('counter', 0x24262a, { roughness: 0.3 }),
    linen: std('linen', 0xe4dccd, { roughness: 1 }),
    metal: std('brass', 0xc9a24a, { roughness: 0.4, metalness: 0.35 }),
    plant: std('planting', 0x4c6138, { roughness: 1 }),
  };
}

const box = (name, w, h, d, x, y, z, mat) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.name = name; m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};

/** Walls along a room's edges, deduped, each split to leave a doorway. */
function edgeWalls(g, room, env, M, seen) {
  const [x, z, w, d] = room.r;
  const edges = [
    ['h', x, x + w, z],          // near
    ['h', x, x + w, z + d],      // far
    ['v', z, z + d, x],          // left
    ['v', z, z + d, x + w],      // right
  ];
  for (const [dir, a, b, c] of edges) {
    const key = `${dir}:${a.toFixed(2)}:${b.toFixed(2)}:${c.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const onEdge = dir === 'h' ? (c < 0.01 || c > env[1] - 0.01) : (c < 0.01 || c > env[0] - 0.01);
    if (room.kind === 'balcony') {
      // balconies get a railing, never a wall
      const h = 1.0, len = b - a;
      const nm = `railing_${room.name.replace(/\W+/g, '_')}_${dir}${c.toFixed(1)}`;
      if (dir === 'h') {
        g.add(box(nm, len, 0.08, T, (a + b) / 2, h, c, M.rail));
        g.add(box(`${nm}_top`, len, 0.07, 0.16, (a + b) / 2, h + 0.04, c, M.metal));
        for (let i = 0; i < Math.floor(len / 0.22); i++) g.add(box(`${nm}_bar_${i}`, 0.035, h, 0.035, a + 0.11 + i * 0.22, h / 2, c, M.rail));
      } else {
        g.add(box(nm, T, 0.08, len, c, h, (a + b) / 2, M.rail));
        g.add(box(`${nm}_top`, 0.16, 0.07, len, c, h + 0.04, (a + b) / 2, M.metal));
        for (let i = 0; i < Math.floor(len / 0.22); i++) g.add(box(`${nm}_bar_${i}`, 0.035, h, 0.035, c, h / 2, a + 0.11 + i * 0.22, M.rail));
      }
      continue;
    }
    const len = b - a;
    const door = onEdge ? 0 : Math.min(0.95, len * 0.42);
    const segs = door > 0.2
      ? [[a, a + (len - door) / 2], [b - (len - door) / 2, b]]
      : [[a, b]];
    segs.forEach(([s0, s1], i) => {
      const l = s1 - s0;
      if (l < 0.05) return;
      const nm = `wall_${room.name.replace(/\W+/g, '_')}_${dir}${c.toFixed(1)}_${i}`;
      if (dir === 'h') {
        g.add(box(nm, l, WALL, T, (s0 + s1) / 2, WALL / 2, c, M.wall));
        g.add(box(`${nm}_cap`, l, 0.03, T + 0.01, (s0 + s1) / 2, WALL, c, M.wallTop));
      } else {
        g.add(box(nm, T, WALL, l, c, WALL / 2, (s0 + s1) / 2, M.wall));
        g.add(box(`${nm}_cap`, T + 0.01, 0.03, l, c, WALL, (s0 + s1) / 2, M.wallTop));
      }
    });
  }
}

function furnish(g, room, M) {
  const [x, z, w, d] = room.r;
  const cx = x + w / 2, cz = z + d / 2;
  const n = room.name.replace(/\W+/g, '_');
  switch (room.kind) {
    case 'living': {
      const sw = Math.min(2.3, w - 0.7);
      g.add(box(`sofa_${n}`, sw, 0.42, 0.88, cx, 0.21, z + d - 1.0, M.soft));
      g.add(box(`sofa_back_${n}`, sw, 0.5, 0.22, cx, 0.46, z + d - 0.55, M.soft));
      g.add(box(`sofa_cushion_${n}`, sw - 0.3, 0.14, 0.7, cx, 0.49, z + d - 1.05, M.linen));
      g.add(box(`coffee_${n}`, sw * 0.55, 0.1, 0.55, cx, 0.33, z + d - 2.0, M.wood));
      g.add(box(`tv_unit_${n}`, sw, 0.42, 0.4, cx, 0.21, z + 0.5, M.wood));
      g.add(box(`tv_${n}`, sw * 0.8, 0.6, 0.06, cx, 0.95, z + 0.36, M.stoneTop));
      g.add(box(`rug_${n}`, sw + 0.5, 0.02, Math.min(2.4, d - 1.2), cx, 0.02, cz, M.linen));
      break;
    }
    case 'bed': {
      const bw = w > d ? Math.min(2.0, d - 0.6) : Math.min(1.62, w - 0.7);
      const bl = w > d ? Math.min(1.62, w - 0.9) : Math.min(2.0, d - 0.6);
      g.add(box(`bed_${n}`, w > d ? bl : bw, 0.34, w > d ? bw : bl, cx, 0.17, cz + 0.15, M.wood));
      g.add(box(`mattress_${n}`, (w > d ? bl : bw) - 0.1, 0.22, (w > d ? bw : bl) - 0.1, cx, 0.44, cz + 0.15, M.linen));
      g.add(box(`headboard_${n}`, w > d ? 0.12 : bw + 0.2, 0.8, w > d ? bw + 0.2 : 0.12, w > d ? cx - bl / 2 : cx, 0.4, w > d ? cz + 0.15 : cz + 0.15 - bl / 2, M.soft));
      g.add(box(`wardrobe_${n}`, Math.min(1.9, w - 0.5), 1.3, 0.55, cx, 0.65, z + d - 0.32, M.wood));
      g.add(box(`wardrobe_line_${n}`, Math.min(1.9, w - 0.5), 1.3, 0.02, cx, 0.65, z + d - 0.03, M.metal));
      break;
    }
    case 'kitchen': {
      g.add(box(`counter_${n}`, w - 0.2, 0.82, 0.6, cx, 0.41, z + 0.32, M.wood));
      g.add(box(`counter_top_${n}`, w - 0.2, 0.05, 0.64, cx, 0.85, z + 0.32, M.stoneTop));
      g.add(box(`counter_b_${n}`, 0.6, 0.82, d - 1.0, x + 0.32, 0.41, cz + 0.3, M.wood));
      g.add(box(`counter_b_top_${n}`, 0.64, 0.05, d - 1.0, x + 0.32, 0.85, cz + 0.3, M.stoneTop));
      g.add(box(`overhead_${n}`, w - 0.6, 0.55, 0.36, cx, 1.18, z + 0.2, M.wood));
      g.add(box(`fridge_${n}`, 0.68, 1.38, 0.66, x + w - 0.42, 0.69, z + d - 0.42, M.wallTop));
      break;
    }
    case 'bath': {
      g.add(box(`vanity_${n}`, Math.min(1.0, w - 0.4), 0.78, 0.48, x + Math.min(1.0, w - 0.4) / 2 + 0.15, 0.39, z + 0.3, M.wood));
      g.add(box(`basin_${n}`, Math.min(0.9, w - 0.5), 0.09, 0.42, x + Math.min(1.0, w - 0.4) / 2 + 0.15, 0.82, z + 0.3, M.linen));
      g.add(box(`wc_${n}`, 0.4, 0.42, 0.62, x + w - 0.35, 0.21, z + d - 0.45, M.linen));
      g.add(box(`shower_${n}`, 0.9, 0.03, 0.9, x + 0.6, 0.03, z + d - 0.55, M.bath));
      break;
    }
    case 'balcony': {
      g.add(box(`planter_a_${n}`, 0.42, 0.34, 0.42, x + 0.32, 0.17, z + d / 2, M.stoneTop));
      g.add(box(`plant_a_${n}`, 0.5, 0.42, 0.5, x + 0.32, 0.52, z + d / 2, M.plant));
      g.add(box(`planter_b_${n}`, 0.42, 0.34, 0.42, x + w - 0.32, 0.17, z + d / 2, M.stoneTop));
      g.add(box(`plant_b_${n}`, 0.5, 0.42, 0.5, x + w - 0.32, 0.52, z + d / 2, M.plant));
      break;
    }
    case 'passage': {
      g.add(box(`door_${n}`, Math.min(0.9, w - 0.3), 1.3, 0.06, cx, 0.65, z + 0.06, M.wood));
      g.add(box(`handle_${n}`, 0.1, 0.1, 0.1, cx + Math.min(0.9, w - 0.3) / 2 - 0.16, 0.72, z + 0.13, M.metal));
      break;
    }
  }
}

/**
 * A doll's-house model of one flat, scaled so its floor area matches the unit's
 * RERA carpet. Each room is its own named group, so the viewer can stagger them in.
 */
export function buildFlat(unit) {
  const L = LAYOUTS[unit.type] || LAYOUTS['2 BHK'];
  const baseArea = L.env[0] * L.env[1];
  const s = Math.sqrt((unit.rera / SQFT) / baseArea);
  const M = materials();
  const root = new THREE.Group();
  root.name = `flat_${unit.id}`;
  const seen = new Set();
  const rooms = [];

  for (const room of L.rooms) {
    const g = new THREE.Group();
    g.name = `room_${room.name.replace(/\W+/g, '_')}`;
    const [x, z, w, d] = room.r;
    g.add(box(`floor_${g.name}`, w, 0.12, d, x + w / 2, -0.06, z + d / 2, M[room.kind]));
    edgeWalls(g, room, L.env, M, seen);
    furnish(g, room, M);
    root.add(g);
    const sqft = Math.round(w * d * s * s * SQFT);
    const label = labelSprite(room.name, '', Math.min(2.3, Math.max(w, d) * 0.78) / s);
    label.position.set(x + w / 2, WALL + 0.95, z + d / 2);
    g.add(label);
    rooms.push({
      name: room.name, kind: room.kind, group: g, label, targetY: 0,
      w: w * s, d: d * s,
      sqft,
      color: ROOM_COLOR[room.kind],
    });
  }

  root.scale.setScalar(s);
  root.position.set(-L.env[0] * s / 2, 0, -L.env[1] * s / 2);
  const holder = new THREE.Group();
  holder.name = `flat_holder_${unit.id}`;
  holder.add(root);

  // Layouts put the balcony on the low-z edge, so the flat's own outward
  // direction is local -z. Turn the flat so that edge points along the unit's
  // real bearing, in the same +x north / +z east frame the site model uses.
  const b = unit.bearing || { x: 0, z: -1 };
  holder.rotation.y = Math.atan2(-b.x, -b.z);

  const span = Math.max(L.env[0], L.env[1]) * s;
  const scene = new THREE.Group();
  scene.name = `flat_scene_${unit.id}`;
  scene.add(holder);
  // Survey compass omitted: not established by drawings.
  return { root: scene, rooms, span, envelope: [L.env[0] * s, L.env[1] * s] };
}

/** Compass rose on the ground plus an arrow out of the balcony edge, so the
 *  visitor can see which way the home opens and what it opens onto. */
function compass(span, b, facing) {
  const g = new THREE.Group();
  g.name = 'compass';
  const R = span * 0.78;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(R - 0.05, R, 96),
    new THREE.MeshBasicMaterial({ color: 0xcba135, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = -0.09; ring.name = 'compass_ring';
  g.add(ring);
  const pts = [['N', R, 0, true], ['E', 0, R, false], ['S', -R, 0, false], ['W', 0, -R, false]];
  for (const [t, x, z, major] of pts) {
    const sp = labelSprite(t, '', 0.9);
    sp.material.opacity = major ? 1 : 0.55;
    sp.position.set(x, 0.12, z);
    g.add(sp);
  }
  // arrow from the balcony edge outward along the bearing
  const len = span * 0.34;
  const ang = Math.atan2(b.x, b.z);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, len), new THREE.MeshBasicMaterial({ color: 0xe8c266 }));
  shaft.position.set(b.x * (span * 0.5 + len / 2), 0.03, b.z * (span * 0.5 + len / 2));
  shaft.rotation.y = ang; shaft.name = 'facing_arrow';
  g.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 12), new THREE.MeshBasicMaterial({ color: 0xe8c266 }));
  head.position.set(b.x * (span * 0.5 + len + 0.2), 0.03, b.z * (span * 0.5 + len + 0.2));
  head.rotation.set(Math.PI / 2, 0, 0); head.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), ang); head.name = 'facing_head';
  g.add(head);
  if (facing) {
    const lab = labelSprite('Balcony faces', facing, Math.min(4.2, span * 0.9));
    lab.position.set(b.x * (span * 0.5 + len + 0.9), 0.9, b.z * (span * 0.5 + len + 0.9));
    g.add(lab);
  }
  return g;
}

/** t 0→1: rooms drop into place one after another. */
export function playIn(model, t) {
  const n = model.rooms.length;
  model.rooms.forEach((r, i) => {
    const start = (i / n) * 0.55;
    const k = Math.max(0, Math.min(1, (t - start) / 0.45));
    const e = 1 - Math.pow(1 - k, 3);
    r.group.position.y = (1 - e) * 2.6;
    r.group.visible = k > 0.001;
    r.group.traverse((o) => { if (o.isMesh) o.renderOrder = 0; });
    r.group.scale.setScalar(0.9 + 0.1 * e);
  });
}
