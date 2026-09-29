import * as THREE from 'three';
import{initSales}from'./sales.js?v=1790702796';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {buildProject,BUILDINGS,summary} from './model.js?v=1790702796';
import {buildFlat,focusRoom,stepFocus,playIn} from './flat-model.js?v=1790702796';

const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=$('canvas'),stage=$('stage');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.localClippingEnabled=true;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(40,1,0.1,900);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.075;
controls.minDistance=7;controls.maxDistance=360;controls.maxPolarAngle=Math.PI*.485;
controls.autoRotateSpeed=.55;
const hemi=new THREE.HemisphereLight(0xe6f3ff,0x695e51,2.25);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe2ba,3.1);sun.position.set(-65,95,70);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-100,right:100,top:110,bottom:-90,near:1,far:300});sun.shadow.normalBias=.12;sun.shadow.bias=-.0002;scene.add(sun);
const fill=new THREE.DirectionalLight(0xb4d2ec,.75);fill.position.set(60,35,-80);scene.add(fill);
const built=buildProject();scene.add(built.root);
const units=built.units, totals=summary(units);
if(totals.total!==342 || totals.byType['1 BHK']!==184 || totals.byType['2 BHK']!==110 || totals.byType['3 BHK']!==48)throw Error('Inventory differs from the confirmed 342-home configuration');
const bldGroups=BUILDINGS.map(b=>built.root.getObjectByName(b.id));
const unitMeshes=new Map();
built.pickable.forEach(m=>{if(!unitMeshes.has(m.userData.unit.id))unitMeshes.set(m.userData.unit.id,m);});
const selectionBox=new THREE.Box3Helper(new THREE.Box3(),0xffd496);scene.add(selectionBox);selectionBox.visible=false;
selectionBox.material.depthTest=false;selectionBox.renderOrder=12;
const state={building:'all',floor:0,type:'all',selected:null,mode:'site',lighting:'day',view:'aerial',cut:false};
let flat=null,flight=null,lastTime=performance.now(),dirty=true;
let clipTarget=1000,clipReady=false,dimT=1,dimTarget=1,flatT=1;
const clip=new THREE.Plane(new THREE.Vector3(0,-1,0),1000);
const allMaterials=new Set();
built.root.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>allMaterials.add(m));});
for(const d of built.dimmable)if(d.dim)allMaterials.add(d.dim);
for(const m of allMaterials){m.clippingPlanes=[];m.clipShadows=true;}
const daylightColor=built.materials.glass.color.clone();
// One tween fades every shared dim material between "lit" and "receded", so a
// floor change reads as the rest of the mass stepping back rather than snapping.
const dimPairs=(()=>{
  const seen=new Set(),out=[];
  for(const d of built.dimmable){
    if(!d.dim||seen.has(d.dim))continue;seen.add(d.dim);
    const base=Array.isArray(d.base)?d.base[0]:d.base;
    out.push({m:d.dim,from:base.color.clone(),to:d.dim.color.clone(),toOpacity:d.dim.opacity});
  }
  return out;
})();
function applyDim(){
  for(const p of dimPairs){
    p.m.color.copy(p.from).lerp(p.to,dimT);
    p.m.opacity=1+(p.toOpacity-1)*dimT;
  }
}
const floorY=f=>built.PODIUM_H+(f-1)*built.FLOOR_H+built.root.position.y;

function resized(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();dirty=true;}
new ResizeObserver(resized).observe(stage);resized();
function fly(target,position,instant=false){
  if(reduced||instant){controls.target.copy(target);camera.position.copy(position);controls.update();dirty=true;return;}
  flight={start:performance.now(),fromT:controls.target.clone(),fromP:camera.position.clone(),toT:target.clone(),toP:position.clone()};
}
function targetPoint(){
  if(state.mode==='flat')return new THREE.Vector3(0,.6,0);
  if(state.building==='all')return new THREE.Vector3(2,state.floor?floorY(state.floor)+1.4:23,2);
  const b=BUILDINGS.find(b=>b.id===state.building);
  return new THREE.Vector3(b.site.x+built.root.position.x,state.floor?floorY(state.floor)+1.4:28,b.site.z+built.root.position.z);
}
function setView(view,instant=false){
  state.view=view;
  const t=targetPoint();
  const dist=state.mode==='flat'?flat.span*2.2:state.floor?(state.building==='all'?122:96):(state.building==='all'?155:112);
  let offset;
  if(view==='top')offset=new THREE.Vector3(.01,dist,0.01);
  else if(view==='front')offset=new THREE.Vector3(dist*.12,dist*.1,dist);
  else offset=new THREE.Vector3(dist*.68,dist*.58,dist*.84);
  controls.minDistance=state.mode==='flat'?5:35;
  controls.maxDistance=state.mode==='flat'?65:360;
  fly(t,t.clone().add(offset),instant);
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
}
function matching(){return units.filter(u=>(state.building==='all'||u.bldg===state.building)&&(!state.floor||u.floor===state.floor)&&(state.type==='all'||u.type===state.type));}
function updateList(){
  const list=matching();const select=$('unit-list');select.replaceChildren();
  const placeholder=new Option(list.length?'Select an apartment…':'No homes match these filters','');select.add(placeholder);
  list.forEach(u=>select.add(new Option(u.id+' · '+u.type+' · '+u.rera+' sq ft',u.id)));
  select.value=state.selected?.id||'';
  $('unit-count').textContent=list.length+' homes';
}
function updateInfo(){
  const u=state.selected;
  $('open-flat').disabled=!u;
  if(!u){$('unit-info').innerHTML='<p class="hint">Click a home on the model or select one above.</p>';return;}
  $('unit-info').innerHTML='<div class="unit-head"><h3>'+u.id+'</h3><span>'+u.type+'</span></div><dl><dt>Building / wing</dt><dd>'+u.bldg.slice(1)+' / '+u.wing+'</dd><dt>Floor</dt><dd>'+u.floor+'</dd><dt>Carpet area*</dt><dd>'+u.rera+' sq ft</dd><dt>Sanctioned area*</dt><dd>'+u.sanc+' sq ft</dd></dl><p class="small-note">*Carpet area as per the approved plan. Verify in the MahaRERA agreement before purchase.</p>';
}
function apply(){
  const isSite=state.mode==='site';
  built.root.visible=isSite;if(flat)flat.root.visible=!isSite;
  bldGroups.forEach(g=>g.visible=state.building==='all'||g.name===state.building);
  const clipped=isSite&&state.cut&&state.floor>0;
  clipTarget=floorY(state.floor)+2.97;
  if(!clipReady||reduced){clip.constant=clipTarget;clipReady=true;}
  for(const m of allMaterials){const was=m.clippingPlanes.length>0;m.clippingPlanes=clipped?[clip]:[];if(was!==clipped)m.needsUpdate=true;}
  dimTarget=(state.floor||state.type!=='all')?1:0;
  if(reduced)dimT=dimTarget;
  for(const d of built.dimmable){
    const u=d.mesh.userData.unit;
    const match=(!state.floor||d.floor===state.floor)&&(!u||state.type==='all'||u.type===state.type);
    d.mesh.material=match?d.base:d.dim||d.base;
    // Hide above-floor meshes as well as clipping fixed cores and crowns.
    d.mesh.visible=!(clipped&&d.floor>state.floor);
  }
  selectionBox.visible=isSite&&!!state.selected;
  if(state.selected){
    const m=unitMeshes.get(state.selected.id);
    if(m){m.updateWorldMatrix(true,false);selectionBox.box.setFromObject(m);}
  }
  document.querySelectorAll('[data-building]').forEach(b=>{const on=b.dataset.building===state.building;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  $('floor-value').value=state.floor?'Floor '+String(state.floor).padStart(2,'0'):'All floors';
  syncFloorChips();syncTypeChips();
  $('cut').disabled=!state.floor||!isSite;$('cut').checked=state.cut;
  $('floor-note').textContent=state.floor&&[8,13].includes(state.floor)?'Refuge floor \u2014 the end flat of each wing is given over to refuge area.':state.floor===1&&state.building!=='B2'?'Building 1: the two end positions on this floor are not residential.':state.floor?'Typical residential plate \u2014 '+(state.building==='all'?'both towers':'this tower')+'.':'Ground floor: retail frontage and parking.';
  $('view-caption').textContent=isSite?(state.building==='all'?'Both buildings':'Building '+state.building.slice(1))+' · '+(state.floor?'Floor '+state.floor:'All floors'):state.selected.id+' · '+state.selected.type+' \u00b7 Indicative interior';
  $('scene-kicker').textContent=isSite?'INTERACTIVE SITE MODEL':'INSIDE THE HOME';
  $('scene-title').textContent=isSite?(state.floor?'Floor '+String(state.floor).padStart(2,'0'):state.building==='all'?'The complete picture.':'Building '+state.building.slice(1)):state.selected.type+' · '+state.selected.id;
  $('scene-sub').textContent=isSite?'Select a tower, floor or home to explore.':'Orbit the furnished model or select a room.';
  $('site-mode').classList.toggle('active',isSite);$('site-mode').setAttribute('aria-pressed',String(isSite));
  $('flat-mode').classList.toggle('active',!isSite);$('flat-mode').setAttribute('aria-pressed',String(!isSite));
  $('rooms').hidden=isSite;
  dirty=true;
}
function disposeFlat(){
  if(!flat)return;scene.remove(flat.root);
  const materials=new Set(),geometries=new Set(),textures=new Set();
  flat.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{materials.add(m);if(m.map)textures.add(m.map);});});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());flat=null;
}
function loadFlat(){
  if(!state.selected)return;
  disposeFlat();flat=buildFlat(state.selected);scene.add(flat.root);
  flatT=reduced?1:0;playIn(flat,flatT);
  const holder=$('room-buttons');holder.replaceChildren();
  const all=document.createElement('button');all.textContent='All rooms';all.className='active';
  const roomPick=name=>{focusRoom(flat,name);holder.querySelectorAll('button').forEach(b=>{const on=b.dataset.room===(name||'');b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});dirty=true;};
  all.dataset.room='';all.onclick=()=>roomPick(null);holder.append(all);
  flat.rooms.forEach(r=>{r.label.visible=$('room-labels').checked;const b=document.createElement('button');b.textContent=r.name;b.dataset.room=r.name;b.onclick=()=>roomPick(r.name);holder.append(b);});
}
function maskSwap(run){
  if(reduced){run();dirty=true;return;}
  stage.classList.add('swapping');
  setTimeout(()=>{run();dirty=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>stage.classList.remove('swapping')));
  },170);
}
function revealStage(){
  // The mode buttons sit low in the sidebar on a laptop; without this the model
  // changes while the stage is off-screen and the visitor sees nothing happen.
  const r=stage.getBoundingClientRect();
  if(r.top<0||r.bottom>innerHeight)stage.scrollIntoView({block:'nearest',behavior:reduced?'auto':'smooth'});
}
function setMode(mode){
  if(mode==='flat'&&!state.selected){
    const first=matching()[0];if(!first){window.toast('Choose filters with at least one apartment.');return;}state.selected=first;updateList();updateInfo();
  }
  revealStage();
  maskSwap(()=>{state.mode=mode;if(mode==='flat')loadFlat();
    apply();setLighting(state.lighting);setView('aerial');});
}
function selectUnit(u){
  if(!u)return;state.selected=u;
  if(state.floor&&state.floor!==u.floor)state.floor=u.floor;
  if(state.mode==='flat')loadFlat();
  updateList();updateInfo();apply();
  if(state.mode==='flat')setView('aerial');
}
const REFUGE=[8,13];
function buildFloorChips(){
  const wrap=$('floor-chips');wrap.replaceChildren();
  const mk=(value,label,title,cls)=>{
    const b=document.createElement('button');
    b.dataset.floor=String(value);b.textContent=label;b.className=cls||'';
    if(title)b.title=title;
    b.setAttribute('aria-pressed',String(state.floor===value));
    b.onclick=()=>setFilter('floor',value);
    wrap.append(b);return b;
  };
  mk(0,'All','Show every floor','wide');
  for(let f=16;f>=1;f--)mk(f,String(f),REFUGE.includes(f)?'Floor '+f+' — refuge floor':'Floor '+f,REFUGE.includes(f)?'refuge':'');
  syncFloorChips();
}
function syncFloorChips(){
  $('floor-chips').querySelectorAll('button').forEach(b=>{
    const on=Number(b.dataset.floor)===state.floor;
    b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));
  });
}
function syncTypeChips(){
  $('type').querySelectorAll('button').forEach(b=>{
    const on=b.dataset.type===state.type;
    b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));
  });
}
function setFilter(name,value){
  state[name]=value;
  if(state.selected&&!matching().some(u=>u.id===state.selected.id))state.selected=null;
  if(state.mode==='flat'){
    state.selected=state.selected||matching()[0]||null;
    if(state.selected)loadFlat();else state.mode='site';
  }
  updateList();updateInfo();apply();setLighting(state.lighting);setView(state.view);
}
function setLighting(mode){
  state.lighting=mode;
  const flatView=state.mode==='flat';
  const presets={
    day:{bg:0xd8d1c3,sky:0xf4efe3,ground:0x766452,hemi:2.25,sun:3.1,fill:.75,exposure:1.05,glow:0},
    dusk:{bg:0x4c4038,sky:0xc9ac89,ground:0x574137,hemi:1.3,sun:1.8,fill:.65,exposure:1.05,glow:.8},
    night:{bg:0x182c46,sky:0x90b1db,ground:0x332b28,hemi:.75,sun:.65,fill:.4,exposure:1.1,glow:1.5}
  };
  const p=presets[mode];
  scene.background=new THREE.Color(flatView?0xcdc6b8:p.bg);
  stage.classList.toggle('night',!flatView&&mode!=='day');
  hemi.color.setHex(p.sky);hemi.groundColor.setHex(p.ground);hemi.intensity=flatView?2.6:p.hemi;
  sun.intensity=flatView?2.7:p.sun;sun.color.setHex(mode==='day'?0xffe2ba:0xffc18c);fill.intensity=p.fill;
  renderer.toneMappingExposure=p.exposure;
  built.materials.glass.color.copy(daylightColor);built.materials.glass.emissive.setHex(0xffb363);built.materials.glass.emissiveIntensity=p.glow;
  built.materials.trim.emissive.setHex(0xffc695);built.materials.trim.emissiveIntensity=p.glow*.085;
  document.querySelectorAll('[data-light]').forEach(b=>{const on=b.dataset.light===mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  dirty=true;
}
document.querySelectorAll('[data-building]').forEach(b=>b.onclick=()=>setFilter('building',b.dataset.building));
document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>setLighting(b.dataset.light));
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
$('type').onclick=e=>{const b=e.target.closest('button[data-type]');if(b)setFilter('type',b.dataset.type);};
$('cut').onchange=e=>{state.cut=e.target.checked;apply();};
$('unit-list').onchange=e=>{if(!e.target.value){state.selected=null;if(state.mode==='flat')state.mode='site';updateInfo();apply();setLighting(state.lighting);setView('aerial');return;}selectUnit(units.find(u=>u.id===e.target.value));};
$('flat-mode').onclick=$('open-flat').onclick=()=>setMode('flat');
$('site-mode').onclick=()=>setMode('site');
$('room-labels').onchange=e=>{if(flat)flat.rooms.forEach(r=>r.label.visible=e.target.checked);dirty=true;};
$('plan-reference').onclick=()=>{if(state.selected)window.showReference('plan-'+state.selected.bldg.toLowerCase()+'-'+state.selected.type[0]+'bhk');};
$('rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('rotate').setAttribute('aria-pressed',String(controls.autoRotate));dirty=true;};
$('reset').onclick=()=>{
  Object.assign(state,{building:'all',floor:0,type:'all',selected:null,mode:'site',cut:false});
  syncTypeChips();controls.autoRotate=false;$('rotate').setAttribute('aria-pressed','false');
  updateList();updateInfo();apply();setLighting('day');setView('aerial');
};
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
function hit(e){
  if(state.mode!=='site')return null;
  const rect=canvas.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);
  const candidates=built.pickable.filter(m=>m.visible&&(state.building==='all'||m.userData.unit.bldg===state.building)&&(!state.floor||m.userData.unit.floor===state.floor)&&(state.type==='all'||m.userData.unit.type===state.type));
  return raycaster.intersectObjects(candidates,false)[0]?.object.userData.unit||null;
}
let down=null,dragging=false;
canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};dragging=true;flight=null;});
canvas.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5){selectUnit(hit(e));}down=null;dragging=false;dirty=true;});
canvas.addEventListener('pointercancel',()=>{down=null;dragging=false;});
canvas.addEventListener('pointerleave',()=>{$('hover-tip').hidden=true;});
let lastHover=0;
canvas.addEventListener('pointermove',e=>{
  if(dragging||e.pointerType==='touch'||performance.now()-lastHover<60)return;lastHover=performance.now();
  const u=hit(e),tip=$('hover-tip');tip.hidden=!u;
  canvas.style.cursor=u?'pointer':'grab';
  if(u){const r=stage.getBoundingClientRect();tip.textContent=u.id+' · '+u.type;tip.style.left=Math.min(e.clientX-r.left+14,stage.clientWidth-160)+'px';tip.style.top=Math.max(10,e.clientY-r.top-35)+'px';}
});
controls.addEventListener('start',()=>{flight=null;});
controls.addEventListener('change',()=>dirty=true);
canvas.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;
  e.preventDefault();flight=null;
  const offset=camera.position.clone().sub(controls.target);
  if(e.key==='+'||e.key==='-')offset.multiplyScalar(e.key==='+'?.9:1.1);
  else{const s=new THREE.Spherical().setFromVector3(offset);s.theta+=e.key==='ArrowLeft'?.1:e.key==='ArrowRight'?-.1:0;s.phi=THREE.MathUtils.clamp(s.phi+(e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0),.02,Math.PI*.48);offset.setFromSpherical(s);}
  offset.clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset);controls.update();dirty=true;
});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();window.viewerFailure('Your browser paused 3D graphics. Reload the page to restore the model.');});
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('snapshot').onclick=()=>{renderer.render(scene,camera);canvas.toBlob(blob=>{if(blob)download(blob,'ostwal-imperial-'+state.mode+'.png');else window.toast('Image export failed. Please try again.');},'image/png');};
$('export').onclick=async()=>{
  const b=$('export');b.disabled=true;b.textContent='Preparing…';
  try{
    const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');
    const object=state.mode==='flat'?flat.root:built.root;
    // Cutaway planes are renderer state; export the complete visible building(s).
    const hidden=[];object.traverse(o=>{if(o.userData.floor&&!o.visible){hidden.push(o);o.visible=true;}});
    let data;try{data=await new GLTFExporter().parseAsync(object,{binary:true,onlyVisible:true});}finally{hidden.forEach(o=>o.visible=false);}
    download(new Blob([data],{type:'model/gltf-binary'}),'ostwal-imperial-'+state.mode+'.glb');
    window.toast(state.mode==='site'?'3D model saved. Export includes complete selected building(s), without the cutaway.':'Apartment model saved.');
  }catch(e){console.error(e);window.toast('3D export could not finish. Please check the connection and try again.');}
  finally{b.disabled=false;b.textContent='Download 3D';}
};
const context=document.modelContext;
if(context?.registerTool){
  try{Promise.resolve(context.registerTool({
    name:'configure_imperial_view',description:'Set the tower, floor and apartment configuration filters in the 3D explorer.',
    inputSchema:{type:'object',properties:{building:{type:'string',enum:['all','B1','B2']},floor:{type:'integer',minimum:0,maximum:16},type:{type:'string',enum:['all','1 BHK','2 BHK','3 BHK']}},additionalProperties:false},
    annotations:{readOnlyHint:false},execute(input){
      if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['building','floor','type'].includes(k)))throw Error('Invalid view configuration');
      if(input.building!==undefined&&!['all','B1','B2'].includes(input.building))throw Error('Invalid building');
      if(input.floor!==undefined&&(!Number.isInteger(input.floor)||input.floor<0||input.floor>16))throw Error('Invalid floor');
      if(input.type!==undefined&&!['all','1 BHK','2 BHK','3 BHK'].includes(input.type))throw Error('Invalid type');
      for(const [k,v]of Object.entries(input))setFilter(k,v);
      syncTypeChips();
      return {building:state.building,floor:state.floor,type:state.type,matchingHomes:matching().length};
    }
  })).catch(()=>{});}catch{}
}
buildFloorChips();
updateList();updateInfo();apply();setLighting('day');setView('aerial',true);
clearTimeout(window.viewerWatchdog);$('loading').hidden=true;
function animate(now){
  requestAnimationFrame(animate);if(document.hidden){lastTime=now;return;}
  const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;
  if(flight){const f=flight,k=Math.min(1,(now-f.start)/720),t=1-Math.pow(1-k,3);controls.target.lerpVectors(f.fromT,f.toT,t);camera.position.lerpVectors(f.fromP,f.toP,t);if(k===1)flight=null;dirty=true;}
  // Damped, retargetable: changing your mind mid-move never restarts from zero.
  if(Math.abs(dimT-dimTarget)>0.002){dimT+=(dimTarget-dimT)*Math.min(1,dt*7);applyDim();dirty=true;}
  if(clipReady&&Math.abs(clip.constant-clipTarget)>0.01){clip.constant+=(clipTarget-clip.constant)*Math.min(1,dt*8);dirty=true;}
  if(flatT<1&&flat&&state.mode==='flat'){flatT=Math.min(1,flatT+dt*1.05);playIn(flat,flatT);dirty=true;}
  if(flat&&state.mode==='flat'){stepFocus(flat,dt);dirty=true;}
  controls.update(dt);
  if(dirty||controls.autoRotate||dragging){renderer.render(scene,camera);dirty=false;}
}
requestAnimationFrame(animate);

initSales(()=>state.selected);
