// Ostwal Imperial — scroll-driven walkaround.
// Builds the same procedural site as the 3D explorer (model.js), merges it by
// material into a handful of draw calls, and flies a camera along a spline as
// the visitor scrolls. Day → dusk → night happens on the way.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildProject, GARDEN } from '../explore/model.js';

const canvas = document.getElementById('scene');
const tour = document.querySelector('.tour');
const stage = document.querySelector('.stage');
const fallback = document.querySelector('.stage-fallback');
const bar = document.querySelector('.tour-progress i');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 820px)').matches || (navigator.hardwareConcurrency || 8) <= 4;

// Chapter cards fade in/out as they pass through the viewport.
const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.target.classList.toggle('in', e.isIntersecting)),
  { threshold: 0.35 }
);
document.querySelectorAll('.chapter').forEach((c) => io.observe(c));

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch { return false; }
}

if (!webglOK()) {
  canvas.hidden = true; fallback.hidden = false;
} else {
  try { init(); }
  catch (err) { console.error('Walkaround failed, showing still image instead.', err); canvas.hidden = true; fallback.hidden = false; }
}

function init() {
  // ── renderer / scene / camera ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xdfe7ee, 160, 420);
  const camera = new THREE.PerspectiveCamera(42, 1, 1, 1400);

  const hemi = new THREE.HemisphereLight(0xe6f3ff, 0x695e51, 2.25); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe2ba, 3.1);
  sun.position.set(-65, 95, 70); sun.castShadow = !small;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 120, bottom: -100, near: 1, far: 320 });
  sun.shadow.normalBias = 0.12; sun.shadow.bias = -0.0002; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xb4d2ec, 0.75); fill.position.set(60, 35, -80); scene.add(fill);

  // ── the site, merged by material ──
  const built = buildProject();
  built.root.updateMatrixWorld(true);
  const buckets = new Map();
  const tmp = new THREE.Matrix4();
  const prep = (g) => {
    g = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    return g;
  };
  built.root.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || !o.geometry?.attributes?.position) return;
    const list = buckets.get(o.material) || buckets.set(o.material, []).get(o.material);
    if (o.isInstancedMesh) {
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, tmp);
        list.push(prep(o.geometry.clone()).applyMatrix4(tmp).applyMatrix4(o.matrixWorld));
      }
    } else {
      list.push(prep(o.geometry.clone()).applyMatrix4(o.matrixWorld));
    }
  });
  let drawCalls = 0;
  for (const [mat, list] of buckets) {
    const merged = mergeGeometries(list, false);
    if (!merged) continue;
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = !small && mat.name !== 'lawn' && mat.name !== 'road' && mat.name !== 'paving';
    mesh.receiveShadow = !small;
    scene.add(mesh); drawCalls++;
    list.forEach((g) => g.dispose());
  }
  console.info(`Ostwal walkaround: ${drawCalls} merged meshes`);

  // ground that runs to the horizon, so the site doesn't float
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ color: 0x4f5a3f, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.32; ground.receiveShadow = !small; scene.add(ground);

  // ── landmarks for the camera path (world space) ──
  const v = new THREE.Vector3();
  const b1 = built.root.getObjectByName('B1').getWorldPosition(new THREE.Vector3());
  const b2 = built.root.getObjectByName('B2').getWorldPosition(new THREE.Vector3());
  const g = new THREE.Vector3(GARDEN.x, 0, GARDEN.z).add(built.root.position);
  const mid = b1.clone().add(b2).multiplyScalar(0.5);
  const H = built.PODIUM_H + 16 * built.FLOOR_H; // ≈ 54.6 m to the crown
  const P = (x, y, z) => new THREE.Vector3(x, y, z);

  // Where the camera is, and what it looks at, at each stop of the walk.
  const keys = [
    { pos: P(mid.x - 20, 175, mid.z + 240), look: P(mid.x, 18, mid.z) },              // 01 arrival — high and far
    { pos: P(mid.x + 150, 105, mid.z + 150), look: P(mid.x, 24, mid.z) },             // sweeping round
    { pos: P(b2.x + 78, 52, b2.z + 66), look: P(b2.x, H * 0.5, b2.z) },               // 02 towers — Building 2 close
    { pos: P(b1.x + 54, 38, b1.z + 62), look: P(b1.x, H * 0.5, b1.z) },               // 03 homes — Building 1 façade
    { pos: P(g.x - 44, 7, g.z - 46), look: P(g.x + 4, 16, g.z + 2) },                 // 04 garden — eye level, from the SW corner
    { pos: P(b1.x - 70, 26, b1.z - 76), look: P(mid.x, 22, mid.z) },                  // climbing out the back
    { pos: P(mid.x - 40, 118, mid.z - 200), look: P(mid.x, 20, mid.z) },              // 05 night — pulling away
    { pos: P(mid.x, 160, mid.z - 250), look: P(mid.x, 18, mid.z) },
  ];
  const posCurve = new THREE.CatmullRomCurve3(keys.map((k) => k.pos), false, 'centripetal', 0.5);
  const lookCurve = new THREE.CatmullRomCurve3(keys.map((k) => k.look), false, 'centripetal', 0.5);

  // ── lighting presets, blended along the walk ──
  const presets = {
    day:   { bg: 0xdfe7ee, sky: 0xe6f3ff, ground: 0x695e51, sunc: 0xffe2ba, hemi: 2.25, sun: 3.1, fill: 0.75, exposure: 1.0, glow: 0.0, fogNear: 170, fogFar: 430 },
    dusk:  { bg: 0x50425a, sky: 0xf2b58a, ground: 0x4a3a35, sunc: 0xffb47a, hemi: 1.25, sun: 1.5, fill: 0.5, exposure: 1.05, glow: 0.85, fogNear: 160, fogFar: 400 },
    night: { bg: 0x182c46, sky: 0x90b1db, ground: 0x332b28, sunc: 0xffc18c, hemi: 0.75, sun: 0.65, fill: 0.4, exposure: 1.1, glow: 1.5, fogNear: 150, fogFar: 380 },
  };
  const glass = built.materials.glass, trim = built.materials.trim;
  const glassDay = glass.color.clone();
  glass.emissive.setHex(0xffb363); trim.emissive.setHex(0xffc695);
  const cA = new THREE.Color(), cB = new THREE.Color();
  const mixHex = (a, b, t, into) => into.setHex(a).lerp(cB.setHex(b), t);
  function applyLight(p) {
    // 0–.5 day, .5–.7 → dusk, .7–.92 → night
    let a = presets.day, b = presets.dusk, t = 0;
    if (p > 0.7) { a = presets.dusk; b = presets.night; t = THREE.MathUtils.smoothstep(p, 0.7, 0.92); }
    else if (p > 0.5) { t = THREE.MathUtils.smoothstep(p, 0.5, 0.7); }
    const L = (k) => THREE.MathUtils.lerp(a[k], b[k], t);
    scene.background = mixHex(a.bg, b.bg, t, cA).clone();
    scene.fog.color.copy(scene.background);
    scene.fog.near = L('fogNear'); scene.fog.far = L('fogFar');
    mixHex(a.sky, b.sky, t, hemi.color); mixHex(a.ground, b.ground, t, hemi.groundColor);
    mixHex(a.sunc, b.sunc, t, sun.color);
    hemi.intensity = L('hemi'); sun.intensity = L('sun'); fill.intensity = L('fill');
    renderer.toneMappingExposure = L('exposure');
    const glow = L('glow');
    glass.color.copy(glassDay); glass.emissiveIntensity = glow; trim.emissiveIntensity = glow * 0.085;
    stage.style.background = '#' + scene.background.getHexString();
  }

  // ── scroll → progress ──
  function scrollProgress() {
    const r = tour.getBoundingClientRect();
    const total = tour.offsetHeight - innerHeight;
    return THREE.MathUtils.clamp(-r.top / Math.max(1, total), 0, 1);
  }
  let target = scrollProgress(), cur = target, last = performance.now(), visible = true, idle = 0;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(stage);

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    // phones are tall: open the lens a touch so both towers stay in frame
    camera.fov = camera.aspect < 0.8 ? 58 : 42; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage); resize();

  const look = new THREE.Vector3();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    target = scrollProgress();
    cur += (target - cur) * (reduced ? 1 : 1 - Math.exp(-dt * 5.5));
    bar.style.width = (cur * 100).toFixed(2) + '%';
    if (!visible) return;
    idle += dt;
    posCurve.getPoint(cur, camera.position);
    lookCurve.getPoint(cur, look);
    if (!reduced) { // a breath of hand-held drift so the frame never freezes
      camera.position.x += Math.sin(idle * 0.37) * 0.9;
      camera.position.y += Math.sin(idle * 0.29) * 0.5;
    }
    camera.lookAt(look);
    applyLight(cur);
    renderer.render(scene, camera);
  }
  applyLight(cur);
  requestAnimationFrame(frame);
}
