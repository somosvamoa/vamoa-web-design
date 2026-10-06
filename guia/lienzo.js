(()=>{
 'use strict';
 const data=JSON.parse(document.getElementById('canvas-data').textContent);
 const groups=[['acceso','Empezar','Bienvenida, cuenta y primeros pasos.'],['lugares','Elegir dónde comer','Lugares, mapa, ficha, carta y fotos.'],['pago','Pagar la cuenta','Cuenta, detalle, propina, créditos y comprobante.'],['creditos','Volver a salir','Historial y créditos para la próxima.'],['comunidad','Compartir lo que te gustó','Platos, fotos, opiniones, amigos e invitaciones.'],['cuenta','Tu cuenta','Perfil, tarjetas, preferencias, seguridad y ayuda.']];
 const $=id=>document.getElementById(id),viewport=$('canvas-viewport'),world=$('canvas-world');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const norm=s=>s.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const index=new Map(data.map(s=>{const div=document.createElement('div');div.innerHTML=s.phone;return[s.id,{...s,search:norm([s.id,s.title,s.state,s.category,s.context,div.textContent].join(' '))}];}));
 let visible=[],selected=null,camera={x:0,y:0,z:.5},space=false,gesture=null,renderVersion=0,transformFrame=0;
 const pointers=new Map();
 function paint(){world.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.z})`;$('canvas-zoom').value=Math.round(camera.z*100);}
 function schedulePaint(){if(transformFrame)return;transformFrame=requestAnimationFrame(()=>{transformFrame=0;paint();});}
 function clampZoom(z){return Math.min(2,Math.max(.02,z));}
 function zoom(z,anchor={x:viewport.clientWidth/2,y:viewport.clientHeight/2}){const before=camera.z;camera.z=clampZoom(z);const ratio=camera.z/before;camera.x=anchor.x-(anchor.x-camera.x)*ratio;camera.y=anchor.y-(anchor.y-camera.y)*ratio;paint();}
 function fitRow(){const w=world.offsetWidth||2456;camera.z=clampZoom((viewport.clientWidth-64)/w);camera.x=(viewport.clientWidth-w*camera.z)/2;camera.y=24;paint();}
 function overview(){if(!visible.length)return;camera.z=clampZoom(Math.min((viewport.clientWidth-50)/world.offsetWidth,(viewport.clientHeight-50)/world.offsetHeight));camera.x=(viewport.clientWidth-world.offsetWidth*camera.z)/2;camera.y=(viewport.clientHeight-world.offsetHeight*camera.z)/2;paint();}
 function rectInWorld(node){const box=node.getBoundingClientRect(),v=viewport.getBoundingClientRect();return{x:(box.left-v.left-camera.x)/camera.z,y:(box.top-v.top-camera.y)/camera.z,w:box.width/camera.z,h:box.height/camera.z};}
 function frameNode(id){return world.querySelector(`[data-frame="${CSS.escape(id)}"]`);}
 function focusFrame(id){const node=frameNode(id);if(!node)return;const r=rectInWorld(node);camera.z=clampZoom(Math.min(1,(viewport.clientWidth-56)/r.w,(viewport.clientHeight-54)/r.h));camera.x=(viewport.clientWidth-r.w*camera.z)/2-r.x*camera.z;camera.y=(viewport.clientHeight-r.h*camera.z)/2-r.y*camera.z;paint();}
 function selection(){world.querySelectorAll('[data-frame]').forEach(n=>n.dataset.selected=String(n.dataset.frame===selected));$('canvas-index').querySelectorAll('[data-select]').forEach(n=>{if(n.dataset.select===selected)n.setAttribute('aria-current','true');else n.removeAttribute('aria-current');});const s=index.get(selected);$('canvas-guide-link').href='app.html'+(s?'#pantalla-'+s.id:'');$('canvas-selection').innerHTML=s?`<span title="${esc(s.id+' · '+s.title)}">${esc(s.id+' · '+s.title)}</span><a href="pantalla.html?id=${encodeURIComponent(s.id)}">Abrir sola ↗</a><a href="capturas/${esc(s.id)}.png" download>PNG ↓</a><button type="button" data-copy-selected>Copiar enlace</button>`:'<span>Selecciona una pantalla para abrirla o compartirla.</span>';}
 function closeIndex(){$('canvas-sidebar').classList.remove('open');$('canvas-index-toggle').setAttribute('aria-expanded','false');}
 function select(id,{focus=true,hash=true}={}){if(!index.has(id)||!frameNode(id))return;selected=id;selection();if(focus)focusFrame(id);if(hash&&location.hash!=='#pantalla-'+id)history.pushState(null,'','#pantalla-'+id);closeIndex();}
 function render({target=null}={}){
  const q=norm($('canvas-search').value.trim()),scope=$('canvas-scope').value,status=$('canvas-status').value;
  visible=[...index.values()].filter(s=>(q||scope==='todas'||s.primary)&&(status==='todos'||s.status===status)&&(!q||s.search.includes(q)));
  if(!visible.some(s=>s.id===selected))selected=null;
  world.innerHTML=groups.map(([key,title,sub])=>{const screens=visible.filter(s=>s.category===key);if(!screens.length)return'';return`<section class="canvas-chapter" data-category="${key}"><div class="canvas-chapter-head"><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div><span>${screens.length} pantallas</span></div><div class="canvas-row">${screens.map(s=>`<article class="canvas-frame" data-frame="${esc(s.id)}" data-status="${s.status}" aria-label="${esc(s.id+' · '+s.title+' · '+s.availability)}"><div class="canvas-caption"><span class="status ${s.status}">${esc(s.availability)}</span><button type="button" class="canvas-frame-title" data-select="${esc(s.id)}"><span>${esc(s.id)}</span>${esc(s.title)}</button><p>${esc(s.primary?'Recorrido principal':s.state)}</p></div><div class="phone-original">${s.phone}</div><div class="canvas-frame-tools"><a href="pantalla.html?id=${encodeURIComponent(s.id)}">Abrir sola ↗</a><a href="capturas/${esc(s.id)}.png" download>Descargar PNG</a>${s.context?`<details class="canvas-context"><summary>Alcance ⓘ</summary><p>${esc(s.context)}</p></details>`:''}</div></article>`).join('')}</div></section>`;}).join('');
  $('canvas-index').innerHTML=groups.map(([key,title])=>{const screens=visible.filter(s=>s.category===key);if(!screens.length)return'';return`<section class="canvas-index-group"><h2>${esc(title)}<span>${screens.length}</span></h2>${screens.map(s=>`<button type="button" class="canvas-index-item" data-select="${esc(s.id)}" data-status="${s.status}" title="${esc(s.id+' · '+s.availability)}"><span>${s.primary?esc(s.id):'↳'}</span><span>${esc(s.title)}</span><i class="index-dot" aria-hidden="true"></i></button>`).join('')}</section>`;}).join('');
  $('canvas-count').textContent=visible.length+' de '+data.length+' referencias';$('canvas-empty').hidden=visible.length>0;$('canvas-empty-stage').hidden=visible.length>0;selection();
  const version=++renderVersion;requestAnimationFrame(()=>{if(version!==renderVersion)return;if(target)select(target,{hash:false});else if(viewport.clientWidth<570&&visible.length)select(visible[0].id,{hash:false});else fitRow();});
 }
 function readHash(){let id;try{id=decodeURIComponent(location.hash).replace(/^#pantalla-/,'');}catch{return;}if(!index.has(id))return;if(!frameNode(id)){$('canvas-search').value='';$('canvas-scope').value='todas';$('canvas-status').value='todos';render({target:id});}else select(id,{hash:false});}
 $('canvas-search').addEventListener('input',()=>render());
 $('canvas-scope').addEventListener('change',()=>{if($('canvas-scope').value==='principal')$('canvas-status').value='actual';render();});
 $('canvas-status').addEventListener('change',()=>{if($('canvas-status').value!=='actual')$('canvas-scope').value='todas';render();});
 $('canvas-reset').addEventListener('click',()=>{$('canvas-search').value='';$('canvas-scope').value='principal';$('canvas-status').value='actual';selected=null;history.replaceState(null,'',location.pathname+location.search);render();});
 $('canvas-expand').addEventListener('click',()=>{$('canvas-scope').value='todas';$('canvas-status').value='todos';render();});
 document.addEventListener('click',e=>{const button=e.target.closest('[data-select]');if(button)select(button.dataset.select);if(e.target.closest('[data-copy-selected]')&&selected){const url=new URL(location.href);url.hash='pantalla-'+selected;navigator.clipboard.writeText(url.href).then(()=>toast('Enlace copiado.')).catch(()=>toast('Puedes copiar el enlace desde la barra del navegador.'));}});
 function toast(message){const el=$('toast');el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,2800);}
 $('canvas-fit').addEventListener('click',fitRow);$('canvas-overview').addEventListener('click',overview);$('canvas-plus').addEventListener('click',()=>zoom(camera.z*1.2));$('canvas-minus').addEventListener('click',()=>zoom(camera.z/1.2));$('canvas-zoom').addEventListener('change',()=>{const value=Number($('canvas-zoom').value);if(value>0)zoom(value/100);else paint();});
 $('canvas-index-toggle').addEventListener('click',()=>{const open=$('canvas-sidebar').classList.toggle('open');$('canvas-index-toggle').setAttribute('aria-expanded',String(open));});
 function localPoint(e){const r=viewport.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 function scrollContainer(node){let el=node;while(el&&el!==viewport){if(el.scrollHeight>el.clientHeight+2&&['auto','scroll'].includes(getComputedStyle(el).overflowY))return el;el=el.parentElement;}return null;}
 viewport.addEventListener('wheel',e=>{
  if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(camera.z*Math.exp(-e.deltaY*.006),localPoint(e));return;}
  const scroller=scrollContainer(e.target);if(scroller&&!e.shiftKey&&((e.deltaY>0&&scroller.scrollTop+scroller.clientHeight<scroller.scrollHeight-1)||(e.deltaY<0&&scroller.scrollTop>0)))return;
  e.preventDefault();const factor=e.deltaMode===1?16:1;if(e.shiftKey&&!e.deltaX)camera.x-=e.deltaY*factor;else{camera.x-=e.deltaX*factor;camera.y-=e.deltaY*factor;}schedulePaint();
 },{passive:false});
 function startGesture(){const pts=[...pointers.values()];if(pts.length>1){const [a,b]=pts;gesture={kind:'pinch',distance:Math.hypot(a.x-b.x,a.y-b.y),z:camera.z,point:{x:((a.x+b.x)/2-camera.x)/camera.z,y:((a.y+b.y)/2-camera.y)/camera.z}};}else if(pts.length){const p=pts[0];gesture={kind:p.scroller?'scroll':'pan',start:p,scroller:p.scroller,scrollTop:p.scroller?.scrollTop||0,x:camera.x,y:camera.y};}}
 viewport.addEventListener('pointerdown',e=>{
  if(e.target.closest('a,button,summary')&&!space&&e.button!==1)return;
  const isTouch=e.pointerType==='touch';if(!isTouch&&!space&&e.button!==1&&e.target.closest('.canvas-frame'))return;
  e.preventDefault();const p=localPoint(e);p.scroller=isTouch?scrollContainer(e.target):null;pointers.set(e.pointerId,p);viewport.setPointerCapture(e.pointerId);viewport.focus({preventScroll:true});startGesture();if(gesture.kind!=='scroll')viewport.classList.add('is-dragging');
 });
 viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;const p=localPoint(e),prior=pointers.get(e.pointerId);p.scroller=prior.scroller;pointers.set(e.pointerId,p);const pts=[...pointers.values()];
  if(gesture.kind==='pinch'&&pts.length>1){const [a,b]=pts;camera.z=clampZoom(gesture.z*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,gesture.distance));camera.x=(a.x+b.x)/2-gesture.point.x*camera.z;camera.y=(a.y+b.y)/2-gesture.point.y*camera.z;}
  else if(gesture.kind==='scroll')gesture.scroller.scrollTop=gesture.scrollTop-(p.y-gesture.start.y)/camera.z;
  else{camera.x=gesture.x+p.x-gesture.start.x;camera.y=gesture.y+p.y-gesture.start.y;}schedulePaint();
 });
 function endGesture(e){pointers.delete(e.pointerId);if(pointers.size)startGesture();else{gesture=null;viewport.classList.remove('is-dragging');}}
 for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,endGesture);
 document.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;if(e.code==='Space'&&e.target===viewport){e.preventDefault();space=true;viewport.classList.add('space-held');}if(e.key==='Escape'){closeIndex();space=false;viewport.classList.remove('space-held');}if(e.target!==viewport)return;const deltas={ArrowLeft:[72,0],ArrowRight:[-72,0],ArrowUp:[0,72],ArrowDown:[0,-72]};if(deltas[e.key]){e.preventDefault();camera.x+=deltas[e.key][0];camera.y+=deltas[e.key][1];paint();}if(e.key==='+'||e.key==='='){e.preventDefault();zoom(camera.z*1.2);}if(e.key==='-'){e.preventDefault();zoom(camera.z/1.2);}if(e.key==='Home'){e.preventDefault();fitRow();}if(e.key==='1')zoom(1);if(e.key==='0')overview();});
 document.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;viewport.classList.remove('space-held');}});
 window.addEventListener('blur',()=>{space=false;gesture=null;pointers.clear();viewport.classList.remove('space-held','is-dragging');});window.addEventListener('hashchange',readHash);window.addEventListener('popstate',readHash);
 const resize=new ResizeObserver(()=>{if(!visible.length)return;if(selected)focusFrame(selected);else fitRow();});resize.observe(viewport);
 document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();viewport.focus({preventScroll:true});});
 render();document.fonts.ready.then(()=>{if(location.hash)readHash();else if(viewport.clientWidth<570&&visible.length)select(visible[0].id,{hash:false});else fitRow();});
 window.vamoaCanvas={ids:data.map(s=>s.id),visible:()=>visible.map(s=>s.id),selected:()=>selected,camera:()=>({...camera}),focus:id=>select(id),fit:fitRow,overview};
})();
