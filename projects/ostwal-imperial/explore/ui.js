(() => {
  const $=id=>document.getElementById(id);
  let toastTimer;
  window.toast=message=>{const el=$('toast');el.textContent=message;el.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.display='none',4500);};
  window.viewerFailure=message=>{const el=$('loading');el.hidden=false;el.replaceChildren();const title=document.createElement('strong');title.textContent='3D view unavailable';const p=document.createElement('p');p.textContent=message;el.append(title,p);};
  const refs=[['aerial-dusk','Aerial · Dusk'],['aerial-day','Aerial · Day'],['tower-night','Tower · Night'],['garden','Garden']];
  for(const b of [1,2])for(const t of [1,2,3])refs.push(['plan-b'+b+'-'+t+'bhk','B'+b+' · '+t+' BHK']);
  window.showReference=(key='aerial-dusk')=>{
    const item=refs.find(x=>x[0]===key)||refs[0];
    $('gallery-image').src='./assets/'+item[0]+'.jpeg';$('gallery-image').alt=item[1]+' — architectural render';
    $('gallery-title').textContent=item[1];
    document.querySelectorAll('[data-ref]').forEach(b=>{b.classList.toggle('active',b.dataset.ref===item[0]);b.setAttribute('aria-pressed',String(b.dataset.ref===item[0]));});
    if(!$('gallery').open)$('gallery').showModal();
  };
  refs.forEach(([key,label])=>{const b=document.createElement('button');b.textContent=label;b.dataset.ref=key;b.onclick=()=>window.showReference(key);$('gallery-tabs').append(b);});
  $('references').onclick=()=>window.showReference();
  $('reference-card').onclick=()=>window.showReference();
  $('close-gallery').onclick=()=>$('gallery').close();
  window.viewerWatchdog=setTimeout(()=>{if(!$('loading').hidden)window.viewerFailure('Loading is taking longer than expected. The viewer needs an internet connection to load Three.js. Original renders remain available.');},25000);
})();
