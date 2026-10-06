(()=>{
 const toast=message=>{const box=document.getElementById('toast');if(!box)return;box.textContent=message;box.hidden=false;setTimeout(()=>box.hidden=true,3000);};
 async function copy(text){try{await navigator.clipboard.writeText(text);toast('Copiado.');}catch{toast('No se pudo copiar automáticamente. Selecciona el texto y cópialo.');}}
 function fit(){document.querySelectorAll('.phone-canvas').forEach(c=>{const width=Math.min(360,c.parentElement.clientWidth),s=width/360;c.style.width=width+'px';c.style.height=800*s+'px';c.firstElementChild.style.transform=`scale(${s})`;});}
 function filter(){const q=(document.getElementById('screen-search')?.value||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(),scope=document.getElementById('screen-scope')?.value||'principal',status=document.getElementById('screen-status')?.value||'actual';let visible=0;document.querySelectorAll('.phone-card[data-screen]').forEach(c=>{const matchesScope=q||scope==='todas'||c.dataset.primary==='true',matchesStatus=status==='todos'||c.dataset.status===status;c.hidden=!(matchesScope&&matchesStatus&&(!q||c.dataset.search.includes(q)));if(!c.hidden)visible++;});document.querySelectorAll('.phone-section').forEach(s=>s.hidden=![...s.querySelectorAll('.phone-card')].some(c=>!c.hidden));const count=document.getElementById('screen-count');if(count)count.textContent=visible+' de '+document.querySelectorAll('.phone-card[data-screen]').length+' pantallas visibles';const empty=document.getElementById('screen-empty');if(empty)empty.hidden=visible>0;document.querySelectorAll("[data-category-link]").forEach(a=>{const section=document.getElementById(a.dataset.categoryLink),n=[...section.querySelectorAll(".phone-card")].filter(c=>!c.hidden).length;a.querySelector(".category-count").textContent=n;a.setAttribute("aria-label",a.firstElementChild.textContent+" · "+n+" pantallas");});fit();updateChapter();}
 function measureHeader(){const header=document.querySelector('.top');document.documentElement.style.setProperty('--anchor-offset',Math.ceil(header?.getBoundingClientRect().height||0)+16+'px');}
 // Lazy phone images have fixed boxes and may stay unloaded while filtered out.
 // Waiting for them would prevent every anchor from completing its navigation.
 const layoutReady=Promise.all([document.fonts.ready,...[...document.images].filter(img=>img.loading!=='lazy').map(img=>img.decode().catch(()=>{}))]);
 let navigation=0;
 function revealTarget(el){
  if(!document.getElementById('screen-search'))return;
  if(el.matches('.phone-card[data-screen]')){
   if(!el.hidden&&!el.closest('.phone-section')?.hidden)return;
   document.getElementById('screen-search').value='';document.getElementById('screen-scope').value='todas';document.getElementById('screen-status').value='todos';filter();
  }else if(el.matches('.phone-section')&&el.hidden){
   document.getElementById('screen-search').value='';document.getElementById('screen-scope').value='todas';filter();
   if(el.hidden){document.getElementById('screen-status').value='actual';filter();}
  }
 }
 async function navigateHash(hash,{smooth=false}={}){
  let id;try{id=decodeURIComponent(hash.slice(1));}catch{return;}
  const el=document.getElementById(id);if(!el)return;
  document.querySelectorAll("[data-app-format]").forEach(a=>{a.href="app-lienzo.html"+(hash.startsWith("#pantalla-")?hash:"");});
  const request=++navigation;await layoutReady;if(request!==navigation)return;
  revealTarget(el);fit();measureHeader();await new Promise(requestAnimationFrame);if(request!==navigation)return;
  el.scrollIntoView({block:'start',behavior:smooth&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant'});
 }
 document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target.closest('a[href]');if(!a||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return;
  const url=new URL(a.href,location.href);
  if(url.origin!==location.origin||url.pathname!==location.pathname||url.search!==location.search||!url.hash)return;
  let id;try{id=decodeURIComponent(url.hash.slice(1));}catch{return;}
  if(!document.getElementById(id))return;
  e.preventDefault();if(a.classList.contains('skip')){const target=document.getElementById(id);target.tabIndex=-1;target.focus({preventScroll:true});}if(location.hash!==url.hash)history.pushState(null,'',url.hash);navigateHash(url.hash,{smooth:true});
 });
 document.addEventListener('click',e=>{const copyButton=e.target.closest('[data-copy]');if(copyButton)copy(copyButton.dataset.copy);const link=e.target.closest('[data-screen-link]');if(link){const url=new URL(location.href);url.hash='pantalla-'+link.dataset.screenLink;copy(url.href);}const brief=e.target.closest('[data-copy-brief]');if(brief){const text=document.getElementById('brief-'+brief.dataset.copyBrief).textContent;copy(text);}});
 document.getElementById('screen-search')?.addEventListener('input',filter);document.getElementById('screen-scope')?.addEventListener('change',()=>{if(document.getElementById('screen-scope').value==='principal')document.getElementById('screen-status').value='actual';filter();});document.getElementById('screen-status')?.addEventListener('change',()=>{if(document.getElementById('screen-status').value!=='actual')document.getElementById('screen-scope').value='todas';filter();});
 document.getElementById('screen-reset')?.addEventListener('click',()=>{document.getElementById('screen-search').value='';document.getElementById('screen-scope').value='principal';document.getElementById('screen-status').value='actual';filter();});
 document.getElementById('screen-expand')?.addEventListener('click',()=>{document.getElementById('screen-scope').value='todas';document.getElementById('screen-status').value='todos';filter();});
 function updateChapter(){let current='';const offset=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0;document.querySelectorAll('.phone-section:not([hidden])').forEach(section=>{if(section.getBoundingClientRect().top<=offset+35)current=section.id;});document.querySelectorAll('[data-category-link]').forEach(a=>{const active=a.dataset.categoryLink===current;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
 let scrollScheduled=false;window.addEventListener('scroll',()=>{if(scrollScheduled)return;scrollScheduled=true;requestAnimationFrame(()=>{scrollScheduled=false;updateChapter();});},{passive:true});
 window.addEventListener('resize',()=>{fit();measureHeader();});window.addEventListener('hashchange',()=>navigateHash(location.hash));
 const header=document.querySelector('.top');if(header)new ResizeObserver(measureHeader).observe(header);
 if(document.getElementById('screen-search'))filter();else fit();measureHeader();
 layoutReady.then(()=>{fit();measureHeader();});if(location.hash)navigateHash(location.hash);
})();
