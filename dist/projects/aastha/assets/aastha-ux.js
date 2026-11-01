/* Aastha site model: guided tour, walk mode, plot finder and a simpler control dock.
   Runs on top of aastha-explorer.js and uses its scene, camera, controls, tween, PLOTS, GEO and helpers. */
(function () {
  if (window.noWebGL || typeof camera === "undefined") return;
  const $ = s => document.querySelector(s);
  const stage = $("#stage"), cv = $("#cv");
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const sqft = m2 => Math.round(m2 * 10.7639);
  const avail = () => Object.keys(PLOTS).filter(k => PLOTS[k].st !== "Sold");
  stage.classList.add("ux");
  // street-light pools: soft radial falloff instead of hard-edged discs (reads right at eye level and from above)
  try { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.4, "rgba(255,255,255,.6)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    M.pool.map = new THREE.CanvasTexture(c); M.pool.needsUpdate = true; } catch (e) {}

  /* ---------------- shared ---------------- */
  let mode = null;                 // null | "tour" | "walk"
  const restore = {};
  function ensureLive() { if (!active) activate(false); }
  function closeSheet() { $("#uxPlots").hidden = true; press("plots", false); }
  function press(k, on) { const b = document.querySelector(`[data-ux="${k}"]`); if (b) b.setAttribute("aria-pressed", on ? "true" : "false"); }
  function inner() { const [gx, gz] = gatePos, [dx, dz] = gateDir; const s = (dx * (0 - gx) + dz * (0 - gz)) > 0 ? 1 : -1; return [dx * s, dz * s]; }

  /* ---------------- filters (plot finder) ---------------- */
  const F = { avail: false, r12: false, corner: false, big: false, small: false };
  let sortBy = "no";
  match = function (id) {
    const p = PLOTS[id]; if (!p) return true;
    if (F.avail && p.st === "Sold") return false;
    if (F.r12 && !p.r12) return false;
    if (F.corner && !p.corner) return false;
    if (F.big && !(p.a > 1200)) return false;
    if (F.small && !(p.a < 1000)) return false;
    return true;
  };
  function renderList() {
    const ids = Object.keys(PLOTS).filter(match);
    if (sortBy === "size") ids.sort((a, b) => PLOTS[b].a - PLOTS[a].a); else ids.sort((a, b) => a - b);
    $("#uxCount").textContent = ids.length === 13 ? "All 13 plots" : `${ids.length} of 13 plots`;
    $("#uxList").innerHTML = ids.length ? ids.map(id => {
      const p = PLOTS[id], sold = p.st === "Sold";
      return `<li><button type="button" data-id="${id}" class="${sold ? "sold" : ""}${String(selected) === id ? " on" : ""}">
        <b>${pad2(id)}</b><span class="m"><span class="a">${fmt(p.a)} m² <i>· ${fmt(sqft(p.a))} sq ft</i></span>
        <span class="r">${p.road} road${p.corner ? " · corner" : ""}</span></span><span class="st">${sold ? "Sold" : "Available"}</span></button></li>`;
    }).join("") : `<li class="none">No plot matches all of these. Clear a filter to see more.</li>`;
    repaintAll();
  }
  function openPlots() {
    if (mode === "tour") endTour(false);
    ensureLive();
    const sh = $("#uxPlots"); const open = sh.hidden; sh.hidden = !open; press("plots", open);
    if (open) renderList();
  }
  $("#uxPlots").addEventListener("click", e => {
    const f = e.target.closest("[data-uf]");
    if (f) { const k = f.dataset.uf; F[k] = !F[k]; if (k === "big" && F.big) F.small = false; if (k === "small" && F.small) F.big = false;
      document.querySelectorAll("[data-uf]").forEach(b => b.setAttribute("aria-pressed", F[b.dataset.uf] ? "true" : "false")); renderList(); return; }
    const s = e.target.closest("[data-us]");
    if (s) { sortBy = s.dataset.us; document.querySelectorAll("[data-us]").forEach(b => b.setAttribute("aria-pressed", b === s ? "true" : "false")); renderList(); return; }
    const b = e.target.closest("button[data-id]");
    if (b) {
      if (mode === "walk") { showPlotInWalk(b.dataset.id); }
      else { select(b.dataset.id); }
      if (isPhone()) closeSheet(); else renderList();
      return;
    }
    if (e.target.closest("[data-close]")) closeSheet();
  });

  /* ---------------- guided tour ---------------- */
  let T = null;
  function stops() {
    const ph = isPhone(), [gx, gz] = gatePos, [ox, oz] = gateDir, [ix, iz] = inner();
    const cen = id => { const it = GEO.items.find(i => i.id === id); return it ? centroid(it.poly) : [0, 0]; };
    const r12 = GEO.centre.filter(c => c.W >= 12), r9 = GEO.centre.filter(c => c.W === 9);
    const road = r12.slice().sort((a, b) => b.pts.length - a.pts.length)[0];
    const near = (pts, p) => pts.reduce((m, q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(m[0] - p[0], m[1] - p[1]) ? q : m, pts[0]);
    const far = (pts, p) => pts.reduce((m, q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > Math.hypot(m[0] - p[0], m[1] - p[1]) ? q : m, pts[0]);
    const rEnd = road ? far(road.pts, gatePos) : [0, 0];
    const longest9 = r9.slice().sort((a, b) => b.pts.length - a.pts.length)[0];
    const j9 = longest9 ? near(longest9.pts, rEnd) : rEnd, j9far = longest9 ? far(longest9.pts, rEnd) : [0, 0];
    const os = cen("OS2"), cfc = cen("CFC"), k = ph ? 1.25 : 1;
    const nAvail = avail().length;
    return [
      { k: "The enclave", h: "Thirteen plots. <em>One private address.</em>", p: "2.35 hectares at Tembhode, walled and gated, beside the Manor–Mahim State Highway.",
        pos: V3(130 * k, 290 * k, 320 * k), tgt: V3(0, 0, 8), dur: 2.6 },
      { k: "Location", h: "Beside the <em>State Highway.</em>", p: "The public road along Aastha's boundary leads straight to the gate, by the Manor–Mahim State Highway.",
        pos: V3(gx + ox * 150 + iz * 40, 70 * k, gz + oz * 150 - ix * 40), tgt: V3(gx + ix * 25, 0, gz + iz * 25), dur: 3.2 },
      { k: "Arrival", h: "One gate. <em>One way in.</em>", p: "A single, controlled entrance at the end of the 12 m main road, with the compound wall around the whole enclave.",
        pos: V3(gx + ox * 26, 2.4, gz + oz * 26), tgt: V3(gx + ix * 40, 3.2, gz + iz * 40), dur: 3.4 },
      { k: "Main road", h: "The 12 m road <em>leads you in.</em>", p: "RCC roads with gutters on both sides, and street lights along every road. Every plot has its own frontage.",
        pos: V3(gx + ix * 4, 24, gz + iz * 4), tgt: V3(rEnd[0], 0, rEnd[1]), dur: 3.2 },
      { k: "Roads", h: "9 m and 12 m roads, <em>lit after dark.</em>", p: "4,552 m² of internal RCC roads with street lighting.", mood: "night",
        pos: V3(j9[0] + (j9[0] - j9far[0]) * .3, 52, j9[1] + (j9[1] - j9far[1]) * .3), tgt: V3(j9far[0] * .55 + j9[0] * .45, 0, j9far[1] * .55 + j9[1] * .45), dur: 3.2 },
      { k: "Open space", h: "Three gardens, <em>held in common.</em>", p: "2,397 m² of landscaped open space, shared by the owners.",
        pos: V3(os[0] + 14 * k, 62 * k, os[1] + 64 * k), tgt: V3(os[0], 0, os[1] - 4), dur: 3.2 },
      { k: "Amenity", h: "An amenity plot <em>for everyone.</em>", p: "A 1,225 m² amenity plot for common use.",
        pos: V3(cfc[0] - 46 * k, 64 * k, cfc[1] + 58 * k), tgt: V3(cfc[0], 0, cfc[1]), dur: 3.0 },
      { k: "The plots", h: `908 to 1,319 m². <em>${nAvail === 10 ? "Ten" : nAvail} still available.</em>`, p: "Each plot suits a G+5 to G+7 building. The plots still available are lit up.", avail: true,
        pos: V3(-120 * k, 270 * k, 250 * k), tgt: V3(0, 0, -4), dur: 3.2 },
    ];
  }
  function startTour() {
    if (mode === "walk") exitWalk(false);
    ensureLive(); deselect(); closeSheet();
    mode = "tour"; press("tour", true); stage.classList.add("touring");
    T = { i: -1, S: stops(), playing: true, until: 0, mood0: mood, f0: { ...F } };
    $("#uxTour").hidden = false; $("#uxTourEnd").hidden = true; $("#uxTourCard").hidden = false;
    $("#uxDots").innerHTML = T.S.map((s, i) => `<button type="button" data-ti="${i}" aria-label="${s.k}"><i></i></button>`).join("");
    goStop(0);
  }
  function goStop(i) {
    const s = T.S[i]; T.i = i;
    const want = s.mood || T.mood0; if (mood !== want) setTime(want);
    F.avail = !!s.avail; repaintAll();
    go(s.pos, s.tgt, reduce ? 0 : s.dur);
    T.until = performance.now() + (s.dur + 6.2) * 1000;
    $("#uxTk").textContent = `${String(i + 1).padStart(2, "0")} / ${String(T.S.length).padStart(2, "0")} · ${s.k}`;
    $("#uxTh").innerHTML = s.h; $("#uxTp").textContent = s.p;
    document.querySelectorAll("#uxDots button").forEach((b, j) => b.classList.toggle("on", j <= i));
    const card = $("#uxTourCard"); if (card.animate && !reduce) card.animate([{ opacity: .2, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,.7,.1,1)" });
    setPlay(true);
  }
  function setPlay(on) { if (!T) return; T.playing = on; const b = $("#uxPlay"); b.setAttribute("aria-label", on ? "Pause tour" : "Play tour"); b.classList.toggle("paused", !on);
    if (on) T.until = Math.max(T.until, performance.now() + 4000); }
  function nextStop() { if (!T) return; if (T.i < T.S.length - 1) goStop(T.i + 1); else finishTour(); }
  function prevStop() { if (T && T.i > 0) goStop(T.i - 1); }
  function finishTour() {
    T.playing = false; $("#uxTourCard").hidden = true; $("#uxTourEnd").hidden = false;
    F.avail = false; repaintAll();
  }
  function endTour(back = true) {
    if (!T) return; const m0 = T.mood0; Object.assign(F, T.f0); T = null; mode = null;
    $("#uxTour").hidden = true; press("tour", false); stage.classList.remove("touring");
    if (mood !== m0) setTime(m0); repaintAll();
    if (back) views.over();
  }
  $("#uxPlay").addEventListener("click", () => setPlay(!T.playing));
  $("#uxNext").addEventListener("click", nextStop);
  $("#uxPrev").addEventListener("click", prevStop);
  $("#uxTourX").addEventListener("click", () => endTour(true));
  $("#uxDots").addEventListener("click", e => { const b = e.target.closest("[data-ti]"); if (b) goStop(+b.dataset.ti); });
  $("#uxTourEnd").addEventListener("click", e => {
    const a = e.target.closest("[data-then]"); if (!a) return; const t = a.dataset.then;
    endTour(t === "close"); if (t === "plots") { F.avail = true; document.querySelector('[data-uf="avail"]').setAttribute("aria-pressed", "true"); views.over(); openPlots(); } if (t === "walk") startWalk();
  });

  /* ---------------- walk mode ---------------- */
  const EYE = 1.75, SPEED = 4.2;
  const W = { on: false, ready: false, yaw: 0, pitch: -0.04, x: 0, z: 0, keys: {}, goal: null, joy: { x: 0, y: 0 }, look: null, near: null, tNear: 0, lastT: 0 };
  function allowed(x, z) {
    const ring = GEO.fence[0], hole = GEO.fence[1];
    if (inside([x, z], ring) && !(hole && inside([x, z], hole))) return true;
    // the gate mouth and a stretch of the road in front of it
    const [gx, gz] = gatePos, [ox, oz] = gateDir, rx = x - gx, rz = z - gz;
    const along = rx * ox + rz * oz, across = Math.abs(-rx * oz + rz * ox);
    return along > -2 && along < 32 && across < 13;
  }
  function startWalk() {
    if (mode === "tour") endTour(false);
    ensureLive(); deselect(); closeSheet();
    mode = "walk"; press("walk", true); stage.classList.add("walking");
    Object.assign(restore, { minD: controls.minDistance, maxP: controls.maxPolarAngle, damp: controls.enableDamping, en: controls.enabled });
    controls.enabled = false; controls.enableDamping = false; controls.minDistance = .01; controls.maxPolarAngle = Math.PI;
    const [gx, gz] = gatePos, [ox, oz] = gateDir;
    W.x = gx + ox * 22; W.z = gz + oz * 22; W.yaw = Math.atan2(-ox, -oz); W.pitch = -0.04; W.goal = null; W.ready = false;
    const f = fwd(); go(V3(W.x, EYE, W.z), V3(W.x + f.x * 20, EYE + f.y * 20, W.z + f.z * 20), reduce ? 0 : 2.4);
    W.on = true; $("#uxWalk").hidden = false; drawMapBase(); hint();
    W.mood0 = mood; if (mood === "gallery") setTime("daylight");
  }
  function exitWalk(back = true) {
    if (!W.on) return; W.on = false; W.ready = false; W.goal = null; mode = null;
    controls.minDistance = restore.minD; controls.maxPolarAngle = restore.maxP; controls.enableDamping = restore.damp; controls.enabled = true;
    $("#uxWalk").hidden = true; press("walk", false); stage.classList.remove("walking"); $("#uxNear").hidden = true;
    if (W.mood0 && mood !== W.mood0) setTime(W.mood0);
    if (back) { deselect(); views.over(); }
  }
  function fwd() { const c = Math.cos(W.pitch); return { x: Math.sin(W.yaw) * c, y: Math.sin(W.pitch), z: Math.cos(W.yaw) * c }; }
  function hint() {
    const h = $("#uxHint"); h.textContent = isPhone() ? "Drag to look around · use the pad to walk · tap the ground to go there" : "Drag to look around · W A S D or arrow keys to walk · click the ground to go there";
    h.classList.remove("off"); clearTimeout(hint.t); hint.t = setTimeout(() => h.classList.add("off"), 6500);
  }
  const _update = controls.update.bind(controls);
  controls.update = function () { walkTick(); tourTick(); return _update(); };
  function walkTick() {
    if (!W.on) return;
    const now = performance.now(), dt = Math.min(.05, (now - (W.lastT || now)) / 1000); W.lastT = now;
    if (!W.ready) { if (!tween) W.ready = true; else return; }
    const k = W.keys, run = k.Shift ? 2.2 : 1;
    let f = (k.w || k.ArrowUp ? 1 : 0) - (k.s || k.ArrowDown ? 1 : 0) + W.joy.y;
    let s = (k.d || k.ArrowRight ? 1 : 0) - (k.a || k.ArrowLeft ? 1 : 0) + W.joy.x;
    if (k.q) W.yaw += 1.6 * dt; if (k.e) W.yaw -= 1.6 * dt;
    let mx = 0, mz = 0;
    if (f || s) { W.goal = null; const fx = Math.sin(W.yaw), fz = Math.cos(W.yaw); mx = (fx * f - fz * s); mz = (fz * f + fx * s); }
    else if (W.goal) {
      const dx = W.goal[0] - W.x, dz = W.goal[1] - W.z, d = Math.hypot(dx, dz);
      if (d < .4) W.goal = null; else { mx = dx / d; mz = dz / d; const want = Math.atan2(dx, dz); let dy = want - W.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); W.yaw += dy * Math.min(1, dt * 3.2); run === 1 && d < 3 && (mx *= d / 3, mz *= d / 3); }
    }
    const len = Math.hypot(mx, mz); if (len > 1) { mx /= len; mz /= len; }
    const step = SPEED * run * dt, nx = W.x + mx * step, nz = W.z + mz * step;
    if (allowed(nx, nz)) { W.x = nx; W.z = nz; }
    else if (allowed(nx, W.z)) W.x = nx;
    else if (allowed(W.x, nz)) W.z = nz;
    else W.goal = null;
    const bob = (f || s || W.goal) && !reduce ? Math.sin(now * .011) * .025 : 0;
    camera.position.set(W.x, EYE + bob, W.z);
    const v = fwd(); controls.target.set(W.x + v.x * 20, EYE + bob + v.y * 20, W.z + v.z * 20);
    if (now - W.tNear > 300) { W.tNear = now; nearPlot(); drawMap(); }
  }
  function nearPlot() {
    let best = null;
    for (const id in plotState) { const st = plotState[id]; if (inside([W.x, W.z], st.poly)) { best = id; break; }
      const d = Math.hypot(st.c[0] - W.x, st.c[1] - W.z); if (d < 34 && (!best || d < Math.hypot(plotState[best].c[0] - W.x, plotState[best].c[1] - W.z))) best = id; }
    const el = $("#uxNear");
    if (!best || !PLOTS[best]) { el.hidden = true; W.near = null; return; }
    if (best !== W.near) { W.near = best; const p = PLOTS[best];
      el.innerHTML = `<span><b>Plot ${pad2(best)}</b> · ${fmt(p.a)} m² · ${p.road} road · <i class="${p.st === "Sold" ? "s" : "a"}">${p.st}</i></span><button type="button" data-near="${best}">Details</button>`; }
    el.hidden = false;
  }
  $("#uxNear").addEventListener("click", e => { const b = e.target.closest("[data-near]"); if (b) showPlotInWalk(b.dataset.near); });
  function showPlotInWalk(id) {
    select(id, false); if (plotState[id]) plotState[id].target = 0;
    const st = plotState[id]; if (st && W.on) { const d = Math.hypot(st.c[0] - W.x, st.c[1] - W.z); if (d > 40) { W.goal = nearestAllowedToward(st.c); } else W.yaw = Math.atan2(st.c[0] - W.x, st.c[1] - W.z); }
  }
  function nearestAllowedToward(c) {   // walk along the straight line towards a point as far as the ground allows
    let gx = W.x, gz = W.z; const dx = c[0] - W.x, dz = c[1] - W.z, d = Math.hypot(dx, dz);
    for (let t = 2; t < d; t += 2) { const x = W.x + dx / d * t, z = W.z + dz / d * t; if (!allowed(x, z)) break; gx = x; gz = z; }
    return [gx, gz];
  }
  // look by dragging; tap the ground to walk there
  let pd = null;
  stage.addEventListener("pointerdown", e => {
    if (mode === "tour" && e.target === cv) setPlay(false);
    if (!W.on || e.target !== cv) return;
    e.stopPropagation(); pd = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; cv.setPointerCapture(e.pointerId);
  }, true);
  stage.addEventListener("pointermove", e => {
    if (!W.on || !pd || e.pointerId !== pd.id) return; e.stopPropagation();
    const dx = e.clientX - (pd.lx ?? pd.x), dy = e.clientY - (pd.ly ?? pd.y); pd.lx = e.clientX; pd.ly = e.clientY;
    const k = isPhone() ? .0062 : .0042; W.yaw += dx * k; W.pitch = Math.max(-1.05, Math.min(.75, W.pitch + dy * k));
    if (Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 6) pd.moved = true;
  }, true);
  stage.addEventListener("pointerup", e => {
    if (!W.on || !pd || e.pointerId !== pd.id) { pd = null; return; } e.stopPropagation();
    if (!pd.moved && performance.now() - pd.t < 450) {
      const r = cv.getBoundingClientRect(), v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
      const rc = new THREE.Raycaster(); rc.setFromCamera(v, camera);
      const hit = rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.15), new THREE.Vector3());
      if (hit && Math.hypot(hit.x - W.x, hit.z - W.z) < 160) { const g = allowed(hit.x, hit.z) ? [hit.x, hit.z] : nearestAllowedToward([hit.x, hit.z]); W.goal = g; ping(e.clientX - r.left, e.clientY - r.top); }
    }
    pd = null;
  }, true);
  stage.addEventListener("wheel", e => { if (!W.on) return; e.preventDefault(); e.stopPropagation(); const f = fwd(), st = -Math.sign(e.deltaY) * 2.2, nx = W.x + Math.sin(W.yaw) * st, nz = W.z + Math.cos(W.yaw) * st; if (allowed(nx, nz)) { W.x = nx; W.z = nz; } }, { passive: false, capture: true });
  function ping(x, y) { const p = document.createElement("i"); p.className = "ux-ping"; p.style.left = x + "px"; p.style.top = y + "px"; stage.appendChild(p); setTimeout(() => p.remove(), 900); }
  document.addEventListener("keydown", e => {
    if (!W.on) return;
    if (e.key === "Escape") { if (!selected) { e.stopPropagation(); exitWalk(true); } return; }
    if (e.target.closest && e.target.closest("input,textarea,select")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (["w", "a", "s", "d", "q", "e", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Shift"].includes(k)) { W.keys[k] = true; e.preventDefault(); }
  }, true);
  document.addEventListener("keyup", e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; W.keys[k] = false; }, true);
  addEventListener("blur", () => { W.keys = {}; });
  // on-screen pad (touch)
  (function () {
    const pad = $("#uxPad"), knob = pad.querySelector("i"); let pid = null, c = null;
    pad.addEventListener("pointerdown", e => { e.stopPropagation(); e.preventDefault(); pid = e.pointerId; pad.setPointerCapture(pid); const r = pad.getBoundingClientRect(); c = [r.left + r.width / 2, r.top + r.height / 2, r.width / 2 - 14]; move(e); });
    pad.addEventListener("pointermove", e => { if (e.pointerId === pid) { e.stopPropagation(); move(e); } });
    const end = e => { if (e.pointerId !== pid) return; pid = null; W.joy.x = W.joy.y = 0; knob.style.transform = ""; };
    pad.addEventListener("pointerup", end); pad.addEventListener("pointercancel", end);
    function move(e) { let dx = e.clientX - c[0], dy = e.clientY - c[1]; const d = Math.hypot(dx, dy); if (d > c[2]) { dx *= c[2] / d; dy *= c[2] / d; }
      knob.style.transform = `translate(${dx}px,${dy}px)`; W.joy.x = dx / c[2]; W.joy.y = -dy / c[2]; W.goal = null; }
  })();
  // mini map
  const map = $("#uxMap"), mctx = map.getContext("2d"); let base = null, MT = null;
  function drawMapBase() {
    const dpr = Math.min(2, devicePixelRatio || 1), S = map.clientWidth || 150; map.width = map.height = Math.round(S * dpr);
    const ring = GEO.fence[0]; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; ring.forEach(([x, z]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); });
    const [gx, gz] = gatePos, [ox, oz] = gateDir; [[gx + ox * 30, gz + oz * 30]].forEach(([x, z]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); });
    const pad = 10 * dpr, sc = Math.min((map.width - 2 * pad) / (x1 - x0), (map.height - 2 * pad) / (z1 - z0));
    MT = { sc, ox: pad + ((map.width - 2 * pad) - (x1 - x0) * sc) / 2 - x0 * sc, oz: pad + ((map.height - 2 * pad) - (z1 - z0) * sc) / 2 - z0 * sc, dpr };
    const P = (x, z) => [MT.ox + x * sc, MT.oz + z * sc];
    base = document.createElement("canvas"); base.width = map.width; base.height = map.height; const c = base.getContext("2d");
    const poly = (pts, fill, stroke, lw) => { c.beginPath(); pts.forEach((p, i) => { const [a, b] = P(p[0], p[1]); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw * dpr; c.stroke(); } };
    poly(ring, "rgba(200,169,110,.10)", "rgba(200,169,110,.55)", 1);
    if (GEO.fence[1]) poly(GEO.fence[1], "rgba(10,9,7,.55)", null, 0);
    GEO.items.forEach(it => { if (it.kind === "plot") { const sold = PLOTS[it.id] && PLOTS[it.id].st === "Sold"; poly(it.poly, sold ? "rgba(120,114,104,.35)" : "rgba(226,215,192,.22)", "rgba(226,215,192,.35)", .6); }
      else if (it.kind === "green") poly(it.poly, "rgba(93,122,69,.55)", null, 0); else if (it.kind === "cfc") poly(it.poly, "rgba(161,158,130,.35)", null, 0); });
    c.lineCap = "round"; GEO.centre.forEach(r => { if (r.ext) return; c.beginPath(); r.pts.forEach((p, i) => { const [a, b] = P(p[0], p[1]); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.strokeStyle = "rgba(239,231,214,.55)"; c.lineWidth = Math.max(1.5, r.W * sc * .8); c.stroke(); });
    GEO.items.forEach(it => { if (it.kind !== "plot") return; const [cx, cz] = centroid(it.poly); const [a, b] = P(cx, cz); c.fillStyle = "rgba(239,231,214,.75)"; c.font = `${9 * dpr}px Jost, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(it.id, a, b); });
    const [ga, gb] = P(gx, gz); c.fillStyle = "#C8A96E"; c.fillRect(ga - 3 * dpr, gb - 3 * dpr, 6 * dpr, 6 * dpr);
    drawMap();
  }
  function drawMap() {
    if (!base || !MT) return; mctx.clearRect(0, 0, map.width, map.height); mctx.drawImage(base, 0, 0);
    const d = MT.dpr, x = MT.ox + W.x * MT.sc, z = MT.oz + W.z * MT.sc, a = Math.atan2(Math.cos(W.yaw), Math.sin(W.yaw));
    mctx.save(); mctx.translate(x, z); mctx.rotate(a);
    const g = mctx.createRadialGradient(0, 0, 0, 0, 0, 26 * d); g.addColorStop(0, "rgba(230,207,151,.55)"); g.addColorStop(1, "rgba(230,207,151,0)");
    mctx.fillStyle = g; mctx.beginPath(); mctx.moveTo(0, 0); mctx.arc(0, 0, 26 * d, -.55, .55); mctx.closePath(); mctx.fill(); mctx.restore();
    mctx.fillStyle = "#E6CF97"; mctx.strokeStyle = "#0A0907"; mctx.lineWidth = 2 * d; mctx.beginPath(); mctx.arc(x, z, 4.5 * d, 0, 7); mctx.fill(); mctx.stroke();
    if (W.goal) { mctx.strokeStyle = "rgba(230,207,151,.9)"; mctx.lineWidth = 1.2 * d; mctx.beginPath(); mctx.arc(MT.ox + W.goal[0] * MT.sc, MT.oz + W.goal[1] * MT.sc, 3.5 * d, 0, 7); mctx.stroke(); }
  }
  map.addEventListener("pointerdown", e => { e.stopPropagation(); });
  map.addEventListener("click", e => {
    if (!MT) return; const r = map.getBoundingClientRect(), d = MT.dpr; const x = ((e.clientX - r.left) * d - MT.ox) / MT.sc, z = ((e.clientY - r.top) * d - MT.oz) / MT.sc;
    W.goal = allowed(x, z) ? [x, z] : nearestAllowedToward([x, z]);
  });
  $("#uxWalkX").addEventListener("click", () => exitWalk(true));

  let tvo = 0;
  function tourTick() {
    // keep the subject clear of the caption card: shift the picture right while the tour runs (desktop)
    const want = mode === "tour" && !isPhone() ? Math.min(240, stage.clientWidth * .17) : 0;
    tvo += (want - tvo) * (reduce ? 1 : .08);
    if (Math.abs(tvo) > .5) { const w = stage.clientWidth, h = stage.clientHeight; camera.setViewOffset(w, h, -tvo, 0, w, h); }
    if (mode !== "tour" || !T || !T.playing) return;
    const now = performance.now(), s = T.S[T.i]; const left = Math.max(0, T.until - now), total = (s.dur + 6.2) * 1000;
    $("#uxBar").style.transform = `scaleX(${1 - left / total})`;
    if (now >= T.until) nextStop();
  }

  /* ---------------- dock ---------------- */
  const TIMES = ["gallery", "daylight", "night"], TL = { gallery: "Model", daylight: "Day", night: "Night" };
  function syncDock() { $("#uxTimeL").textContent = TL[mood] || "Model"; $("#uxDock").dataset.time = mood; $("#uxViewL").textContent = curView === "top" ? "Aerial" : "Plan"; }
  let curView = "over";
  $("#uxDock").addEventListener("click", e => {
    const b = e.target.closest("[data-ux]"); if (!b) return; const k = b.dataset.ux;
    if (k === "tour") { mode === "tour" ? endTour(true) : startTour(); }
    else if (k === "walk") { mode === "walk" ? exitWalk(true) : startWalk(); }
    else if (k === "plots") openPlots();
    else if (k === "view") { if (mode === "walk") exitWalk(false); if (mode === "tour") endTour(false); curView = curView === "top" ? "over" : "top"; setView(curView); }
    else if (k === "time") { const n = TIMES[(TIMES.indexOf(mood) + 1) % TIMES.length]; setTime(n); }
    syncDock();
  });
  const _setTime = setTime; setTime = function (k) { _setTime(k); try { syncDock(); } catch (e) {} };
  document.querySelectorAll("[data-ux-start]").forEach(b => b.addEventListener("click", () => { const k = b.dataset.uxStart; setTimeout(() => { if (k === "tour") startTour(); else if (k === "walk") startWalk(); else { ensureLive(); openPlots(); } }, 30); }));
  const _deact = deactivate; deactivate = function () { if (mode === "walk") exitWalk(false); if (mode === "tour") endTour(false); closeSheet(); return _deact(); };
  $("#exit").addEventListener("click", () => { if (mode === "walk") exitWalk(false); if (mode === "tour") endTour(false); closeSheet(); }, true);
  addEventListener("resize", () => { if (W.on) drawMapBase(); });
  syncDock();
  window.AASTHA_UX = { startTour, startWalk, openPlots, exitWalk, endTour, _W: W };
})();
