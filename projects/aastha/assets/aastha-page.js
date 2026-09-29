/* Aastha redesign mock — shared behaviour (masterplan, reveals, film, enquiry) */
(function(){
const GEO={"items":[{"id":"9","kind":"plot","poly":[[-108.8,-81.9],[-110.5,-70.4],[-115.0,-66.5],[-121.4,-56.0],[-120.6,-51.1],[-82.4,-47.9],[-79.6,-79.8]],"dims":[39.7,32.1]},{"id":"8","kind":"plot","poly":[[-78.5,-79.8],[-81.3,-47.6],[-41.2,-44.4],[-38.7,-76.4]],"dims":[40.2,32.3]},{"id":"7","kind":"plot","poly":[[-14.7,-74.2],[-17.2,-42.3],[22.9,-39.1],[25.4,-70.8]],"dims":[40.2,32.0]},{"id":"6","kind":"plot","poly":[[26.5,-70.6],[23.9,-38.6],[55.0,-36.1],[58.0,-46.1],[66.0,-62.0],[67.2,-66.9]],"dims":[40.9,32.1]},{"id":"5","kind":"plot","poly":[[130.1,-30.9],[118.3,-64.2],[78.2,-56.2],[71.5,-43.4],[122.1,-31.1]],"dims":[59.8,31.2]},{"id":"10","kind":"plot","poly":[[-104.5,-39.3],[-108.1,-11.6],[-88.4,-5.0],[-66.8,-14.2],[-75.5,-36.7]],"dims":[41.0,32.7]},{"id":"4","kind":"plot","poly":[[-63.7,-35.6],[-51.5,-5.2],[-20.6,3.6],[-17.6,-31.8]],"dims":[46.3,35.5]},{"id":"3","kind":"plot","poly":[[-16.4,-31.8],[-19.4,4.0],[11.1,12.6],[14.5,-29.0]],"dims":[41.9,31.1]},{"id":"2","kind":"plot","poly":[[51.6,-26.0],[15.6,-29.0],[12.2,13.0],[26.1,17.1],[41.5,8.1]],"dims":[45.1,36.1]},{"id":"11","kind":"plot","poly":[[-65.9,-12.9],[-89.3,-3.5],[-76.4,31.3],[-52.4,21.4]],"dims":[37.2,26.0]},{"id":"1","kind":"plot","poly":[[42.4,8.8],[26.1,18.8],[58.9,71.1],[74.8,62.3],[75.0,61.3]],"dims":[62.6,19.2]},{"id":"12","kind":"plot","poly":[[-43.8,41.8],[-67.8,51.6],[-52.4,85.5],[-30.7,76.7]],"dims":[37.3,26.0]},{"id":"13","kind":"plot","poly":[[-21.5,74.1],[-51.5,86.6],[-40.4,111.0],[-8.9,98.6],[-19.4,79.7]],"dims":[34.8,27.4]},{"id":"OS1","kind":"green","poly":[[98.8,-118.4],[96.6,-114.3],[93.2,-103.8],[93.2,-101.2],[89.8,-93.5],[78.4,-57.5],[108.6,-63.1],[117.8,-65.7],[116.8,-66.7],[115.5,-73.2]]},{"id":"OS2","kind":"green","poly":[[-37.4,-76.4],[-40.0,-44.0],[-18.5,-42.3],[-15.7,-74.0]]},{"id":"OS3","kind":"green","poly":[[-51.5,22.5],[-76.0,32.5],[-68.7,50.3],[-44.5,40.7]]},{"id":"CFC","kind":"cfc","poly":[[58.9,-3.5],[56.5,5.3],[61.5,13.5],[62.7,14.1],[63.2,16.2],[86.5,53.8],[104.5,32.1],[111.2,20.8],[67.9,8.8],[68.3,3.4]]},{"id":"ROAD0","kind":"road","poly":[[79.7,-65.7],[75.8,-66.3],[75.4,-65.2],[74.1,-65.2],[73.9,-66.5],[68.5,-66.9],[69.0,-63.9],[67.2,-63.3],[66.8,-60.1],[61.9,-51.9],[61.0,-48.3],[60.0,-47.9],[55.5,-35.0],[-119.9,-49.8],[-117.3,-41.4],[-74.7,-37.6],[-67.2,-18.5],[-65.2,-18.3],[-65.2,-15.9],[-63.5,-13.8],[-63.1,-8.4],[-61.0,-7.8],[-61.4,-4.8],[-60.3,-4.5],[-59.9,-2.6],[-58.6,-2.4],[-58.6,-1.1],[-59.9,-0.5],[-46.0,34.0],[-45.1,34.3],[-43.4,40.3],[-41.2,43.5],[-40.8,46.5],[-39.7,47.1],[-39.3,50.1],[-37.6,52.0],[-37.6,54.6],[-35.7,59.8],[-34.2,60.8],[-34.6,63.0],[-33.7,63.4],[-29.9,76.1],[-22.1,72.6],[-24.1,67.5],[-24.9,67.3],[-26.7,61.0],[-28.2,60.2],[-28.2,57.8],[-32.4,58.3],[-32.7,55.5],[-31.2,55.3],[-30.5,53.5],[-31.4,52.5],[-31.4,48.8],[-36.1,38.8],[-37.6,33.2],[-38.5,33.0],[-39.3,28.7],[-47.9,6.8],[-49.4,6.2],[-49.2,3.8],[-54.7,-10.6],[-57.5,-12.3],[-56.9,-15.7],[-59.5,-15.7],[-59.0,-20.8],[-60.7,-21.3],[-61.2,-26.2],[-65.0,-36.7],[-33.1,-34.8],[-28.4,-33.7],[-24.5,-34.4],[-23.2,-33.3],[4.9,-30.9],[8.7,-32.0],[9.8,-30.5],[53.3,-26.6],[43.0,7.0],[57.2,30.4],[58.5,30.6],[58.7,32.5],[60.0,32.8],[59.7,34.7],[61.5,35.8],[61.5,37.3],[63.2,38.8],[65.5,44.1],[68.1,45.0],[68.3,48.4],[69.6,49.0],[70.9,52.7],[72.6,52.9],[72.6,55.3],[75.2,58.7],[76.0,62.6],[70.0,66.0],[69.6,67.3],[66.6,67.9],[66.2,69.0],[62.7,70.1],[57.8,73.5],[-28.2,107.4],[-29.0,108.7],[-39.3,111.9],[-39.7,112.9],[-38.5,115.3],[-2.4,102.6],[1.9,100.3],[5.7,99.6],[7.0,98.1],[8.9,98.1],[9.2,97.1],[12.2,97.3],[66.4,77.3],[77.5,64.9],[79.2,61.7],[81.0,60.8],[83.1,55.9],[85.0,55.0],[80.8,46.7],[77.5,43.3],[77.5,41.5],[75.0,37.3],[72.6,34.9],[72.4,33.2],[70.7,32.5],[70.7,30.6],[69.0,29.3],[68.7,27.2],[62.7,17.3],[60.8,15.8],[60.4,13.5],[56.7,7.5],[53.7,6.0],[53.7,3.6],[55.9,3.0],[59.1,-7.3],[58.7,-9.9],[60.0,-10.1],[66.2,-29.8],[66.0,-33.3],[67.7,-34.6],[70.0,-42.9],[76.5,-55.1]]}],"fence":[[[98.8,-118.4],[81.0,-65.9],[-108.8,-81.9],[-110.5,-70.4],[-115.2,-66.3],[-121.4,-55.6],[-117.3,-41.4],[-104.7,-40.1],[-108.1,-11.6],[-89.3,-5.2],[-69.8,48.0],[-38.5,115.3],[66.4,77.3],[105.4,30.8],[111.2,20.8],[68.3,8.9],[68.3,3.4],[58.7,-3.7],[59.1,-9.7],[70.2,-43.1],[121.7,-31.1],[130.1,-30.9]],[[-51.5,-4.3],[-49.0,-4.5],[25.6,16.9],[58.7,70.7],[58.7,72.8],[-2.9,97.5],[-8.7,98.8],[-22.2,73.9],[-28.2,57.8],[-32.5,57.8],[-32.5,55.7],[-30.5,53.8],[-31.4,48.6],[-36.1,39.0],[-47.5,7.7],[-49.2,6.2]]],"centre":[{"pts":[[77.3,60.2],[78.4,53.8],[50.1,9.4],[49.2,5.7],[57.8,-21.9],[58.7,-29.4]],"w":10.5},{"pts":[[-27.7,70.3],[-30.9,61.0]],"w":7.5},{"pts":[[-27.1,109.3],[60.0,76.3],[73.5,66.2]],"w":5.7},{"pts":[[-117.1,-47.9],[-112.4,-45.1],[-69.5,-40.6]],"w":8.6},{"pts":[[58.9,-29.6],[73.0,-61.1]],"w":11.0},{"pts":[[-69.3,-40.4],[-31.2,60.8]],"w":7.5},{"pts":[[-69.3,-40.6],[10.0,-35.4],[57.4,-30.9],[58.7,-29.6]],"w":8.6}]};
const PLOTS={
 1:{a:1210.54,road:"12 m",corner:false,i:1944.13,st:"Sold"},
 2:{a:1318.87,road:"9 m & 12 m",corner:true,i:2118.11,st:"Sold"},
 3:{a:1205.31,road:"9 m",corner:false,i:1935.73,st:"Sold"},
 4:{a:1238.53,road:"9 m",corner:false,i:1989.08,st:"Available"},
 5:{a:1187.26,road:"12 m",corner:false,i:1906.74,st:"Available"},
 6:{a:1141.09,road:"9 m & 12 m",corner:true,i:1832.59,st:"Available"},
 7:{a:1280.32,road:"9 m",corner:false,i:2056.19,st:"Available"},
 8:{a:1285.76,road:"9 m",corner:false,i:2064.93,st:"Available"},
 9:{a:1082.38,road:"9 m",corner:false,i:1738.30,st:"Available"},
 10:{a:1206.71,road:"9 m",corner:false,i:1937.98,st:"Available"},
 11:{a:967.36,road:"9 m",corner:false,i:1553.58,st:"Available"},
 12:{a:938.13,road:"9 m",corner:false,i:1506.64,st:"Available"},
 13:{a:908.20,road:"9 m",corner:false,i:1458.57,st:"Available"}
};
const OTHER={OS1:["Open space I",1154.25],OS2:["Open space II",709.39],OS3:["Open space III",533.21],CFC:["Amenity plot",1224.59]};
const SQFT=10.7639, WA="918262885023";
const fmt=(n,d=0)=>n.toLocaleString('en-IN',{minimumFractionDigits:d,maximumFractionDigits:d});
const pad=n=>String(n).padStart(2,'0');
window.AASTHA={PLOTS,fmt,pad,SQFT};

/* ---------- Masterplan SVG ---------- */
function centroid(poly){let x=0,y=0,a=0;for(let i=0;i<poly.length;i++){const [x0,y0]=poly[i],[x1,y1]=poly[(i+1)%poly.length];const f=x0*y1-x1*y0;a+=f;x+=(x0+x1)*f;y+=(y0+y1)*f;}a*=.5;return a?[x/(6*a),y/(6*a)]:poly[0];}
const pts=p=>p.map(q=>q.join(',')).join(' ');
function buildPlan(host){
  const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','-132 -126 272 250');
  svg.setAttribute('class','plan-svg');
  svg.setAttribute('role','group');
  svg.setAttribute('aria-label','Masterplan of Aastha showing 13 plots. Select a plot for details.');
  let h='<defs><pattern id="hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" class="hatch-line"/></pattern></defs>';
  GEO.fence.forEach(f=>h+='<polygon class="p-site" points="'+pts(f)+'"/>');
  GEO.items.filter(i=>i.kind==='road').forEach(r=>h+='<polygon class="p-road" points="'+pts(r.poly)+'"/>');
  GEO.centre.forEach(c=>h+='<polyline class="p-centre" points="'+pts(c.pts)+'"/>');
  GEO.items.filter(i=>i.kind==='green').forEach(g=>{const c=centroid(g.poly);h+='<g class="p-other" data-o="'+g.id+'" tabindex="0" role="button" aria-label="'+OTHER[g.id][0]+'"><polygon class="p-green" points="'+pts(g.poly)+'"/><text class="p-olabel" x="'+c[0].toFixed(1)+'" y="'+c[1].toFixed(1)+'">'+(g.id.replace('OS','OS '))+'</text></g>';});
  GEO.items.filter(i=>i.kind==='cfc').forEach(g=>{const c=centroid(g.poly);h+='<g class="p-other" data-o="CFC" tabindex="0" role="button" aria-label="Amenity plot"><polygon class="p-cfc" points="'+pts(g.poly)+'"/><text class="p-olabel" x="'+c[0].toFixed(1)+'" y="'+c[1].toFixed(1)+'">AMENITY</text></g>';});
  GEO.items.filter(i=>i.kind==='plot').forEach(p=>{const d=PLOTS[p.id],c=centroid(p.poly),sold=d.st==='Sold';
    h+='<g class="p-plot'+(sold?' is-sold':'')+'" data-id="'+p.id+'" tabindex="0" role="button" aria-label="Plot '+p.id+', '+fmt(d.a,0)+' square metres, '+d.st+'"><polygon class="p-fill" points="'+pts(p.poly)+'"/>'+(sold?'<polygon class="p-hatch" points="'+pts(p.poly)+'" fill="url(#hatch)"/>':'')+'<text class="p-num" x="'+c[0].toFixed(1)+'" y="'+(c[1]+1.6).toFixed(1)+'">'+pad(p.id)+'</text></g>';});
  // entrance marker (12 m road meets highway)
  h+='<g class="p-gate"><circle cx="75.6" cy="63.5" r="2.2"/><text x="84" y="72">ENTRANCE</text></g>';
  h+='<g class="p-north" transform="translate(118,-104)"><path d="M0-9 3.2 2H-3.2Z"/><text y="12">N</text></g>';
  svg.innerHTML=h;
  host.appendChild(svg);
  return svg;
}
function geoDims(id){const it=GEO.items.find(i=>i.id==String(id));return it&&it.dims;}

function initPlan(){
  const host=document.querySelector('[data-plan]'); if(!host) return;
  const svg=buildPlan(host);
  const card=document.querySelector('[data-plan-card]');
  const list=document.querySelector('[data-plan-list]');
  let current=null;
  function show(id,isOther){
    svg.querySelectorAll('.is-active').forEach(e=>e.classList.remove('is-active'));
    if(list) list.querySelectorAll('.is-active').forEach(e=>e.classList.remove('is-active'));
    if(isOther){
      const o=OTHER[id]; svg.querySelector('[data-o="'+id+'"]').classList.add('is-active');
      card.innerHTML='<p class="pc-k">Common to all owners</p><h3 class="pc-t">'+o[0]+'</h3><dl class="pc-dl"><div><dt>Area</dt><dd>'+fmt(o[1],2)+' m²</dd></div><div><dt>In sq ft</dt><dd>'+fmt(o[1]*SQFT)+'</dd></div></dl><p class="pc-note">'+(id==='CFC'?'Reserved for common facilities within the gated layout.':'Recreational open space, part of 2,397 m² set aside across the layout.')+'</p>';
      card.dataset.state='other'; return;
    }
    const d=PLOTS[id], dims=geoDims(id), sold=d.st==='Sold';
    current=id;
    const g=svg.querySelector('.p-plot[data-id="'+id+'"]'); g.classList.add('is-active'); g.parentNode.appendChild(g);
    if(list){const li=list.querySelector('[data-id="'+id+'"]'); li&&li.classList.add('is-active');}
    card.dataset.state=sold?'sold':'avail';
    card.innerHTML='<p class="pc-k"><span class="pc-dot"></span>'+(sold?'Sold':'Available')+'</p>'+
      '<h3 class="pc-t">Plot <em>'+pad(id)+'</em></h3>'+
      '<dl class="pc-dl">'+
      '<div><dt>Plot area</dt><dd>'+fmt(d.a,2)+' m²</dd></div>'+
      '<div><dt>In sq ft</dt><dd>'+fmt(d.a*SQFT)+'</dd></div>'+
      '<div><dt>Approx. size</dt><dd>'+(dims?dims[0]+' × '+dims[1]+' m':'—')+'</dd></div>'+
      '<div><dt>Front road</dt><dd>'+d.road+(d.corner?' · corner':'')+'</dd></div>'+
      '<div><dt>Permissible built-up*</dt><dd>'+fmt(d.i,0)+' m²</dd></div>'+
      '</dl>'+
      (sold?'<p class="pc-note">This plot has found its owner. Ask us about comparable plots still open.</p>':'<a class="pc-cta" href="#enquire" data-enquire-plot="'+id+'">Reserve a private viewing of Plot '+pad(id)+' <span aria-hidden="true">→</span></a>');
  }
  svg.addEventListener('click',e=>{const g=e.target.closest('.p-plot');if(g)return show(g.dataset.id);const o=e.target.closest('.p-other');if(o)show(o.dataset.o,true);});
  svg.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const g=e.target.closest('.p-plot,.p-other');if(!g)return;e.preventDefault();g.dataset.id?show(g.dataset.id):show(g.dataset.o,true);});
  svg.addEventListener('mouseover',e=>{const g=e.target.closest('.p-plot');if(g&&window.matchMedia('(hover:hover)').matches)show(g.dataset.id);});
  if(list){
    list.innerHTML=Object.keys(PLOTS).map(id=>{const d=PLOTS[id];return '<li><button type="button" data-id="'+id+'" class="'+(d.st==='Sold'?'is-sold':'')+'"><span class="pl-n">'+pad(id)+'</span><span class="pl-a">'+fmt(d.a,0)+' m²</span><span class="pl-s">'+(d.st==='Sold'?'Sold':'Available')+'</span></button></li>';}).join('');
    list.addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(b)show(b.dataset.id);});
    list.addEventListener('mouseover',e=>{const b=e.target.closest('button[data-id]');if(b&&window.matchMedia('(hover:hover)').matches)show(b.dataset.id);});
  }
  document.addEventListener('click',e=>{const a=e.target.closest('[data-enquire-plot]');if(!a)return;const s=document.getElementById('fPlot');if(s)s.value=a.dataset.enquirePlot;});
  show(7);
}

/* ---------- Enquiry → WhatsApp ---------- */
function initForm(){
  const f=document.getElementById('enqForm'); if(!f) return;
  const sel=document.getElementById('fPlot');
  if(sel){Object.keys(PLOTS).forEach(id=>{if(PLOTS[id].st==='Sold')return;const o=document.createElement('option');o.value=id;o.textContent='Plot '+pad(id)+' · '+fmt(PLOTS[id].a,0)+' m²';sel.appendChild(o);});}
  f.addEventListener('submit',e=>{e.preventDefault();
    const n=f.querySelector('[name=name]').value.trim(), p=f.querySelector('[name=phone]').value.trim();
    const out=f.querySelector('[data-out]');
    if(!n||!p){out.textContent='Please share your name and phone number so we can confirm your visit.';return;}
    const plot=sel&&sel.value?'Plot '+pad(sel.value):'Not decided yet';
    const who=f.querySelector('[name=who]').value, when=f.querySelector('[name=when]');
    const msg='Hello, I would like a private viewing at Aastha, Tembhode.\n\nName: '+n+'\nPhone: '+p+'\nInterested in: '+plot+'\nI am: '+who+(when&&when.value?'\nPreferred time: '+when.value:'');
    window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(msg),'_blank','noopener');
    out.textContent='WhatsApp is ready with your request. Send it and our team will confirm a time.';
  });
}

/* ---------- Reveal on scroll, film, header ---------- */
function initMotion(){
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els=document.querySelectorAll('[data-reveal]');
  if(reduce||!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));}
  else{const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}}),{rootMargin:'0px 0px -8% 0px',threshold:.12});els.forEach(e=>io.observe(e));}
  const v=document.querySelector('[data-film]');
  if(v){ if(reduce){v.removeAttribute('autoplay');v.pause();} else {const p=v.play();p&&p.catch(()=>{});} }
  const hdr=document.querySelector('[data-header]');
  const par=document.querySelectorAll('[data-parallax]');
  let ticking=false;
  function onScroll(){ticking=false;const y=window.scrollY;
    if(hdr) hdr.classList.toggle('is-solid',y>window.innerHeight*.75);
    if(!reduce) par.forEach(el=>{const r=el.getBoundingClientRect();const k=parseFloat(el.dataset.parallax)||.08;const c=(r.top+r.height/2-window.innerHeight/2);el.style.setProperty('--py',Math.max(-60,Math.min(60,c*-k)).toFixed(1)+'px');});
  }
  window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
  onScroll();
  document.querySelectorAll('[data-sound]').forEach(b=>b.addEventListener('click',()=>{if(!v)return;v.paused?v.play():v.pause();b.setAttribute('aria-pressed',String(v.paused));b.querySelector('span').textContent=v.paused?'Play film':'Pause film';}));
}
document.addEventListener('DOMContentLoaded',()=>{initPlan();initForm();initMotion();});
})();
