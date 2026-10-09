(()=>{
 'use strict';
 const data=JSON.parse(document.getElementById('canvas-data').textContent);
 const groups=[['acceso','Empezar','Bienvenida, cuenta y primeros pasos.'],['lugares','Elegir dónde comer','Lugares, mapa, ficha, carta y fotos.'],['pago','Pagar la cuenta','3 pasos: número → revisar cuenta → propina, créditos y tarjeta. La animación, el resultado y las variantes no agregan formularios.'],['dividir','Dividir la cuenta','Crear o unirse → confirmar la parte → resultado. Variantes y operación del local. Implementado; sujeto a habilitación por servidor y certificación PSP.'],['creditos','Volver a salir','Historial y créditos para la próxima.'],['comunidad','Compartir lo que te gustó','Platos, fotos, opiniones, amigos e invitaciones.'],['cuenta','Tu cuenta','Perfil, tarjetas, preferencias, seguridad y ayuda.'],['seguridad-equipo','Entrar al equipo','Acceso, segundo factor, desbloqueo y selección de restaurante.'],['restaurante','El restaurante desde la app','Dueño, encargado y cajero: vistas compartidas y menús según sus permisos.'],['verificacion','Verificar un pago · navegador','QR del comprobante → cámara → estado vigente, sin instalar apps ni ingresar a un turno. La verificación consulta el estado actual de la API.'],['restaurante-web','Portal del dueño · web','Referencia responsive. Los paneles completos de computador se abren en Portales.']];
 const $=id=>document.getElementById(id),viewport=$('canvas-viewport'),world=$('canvas-world');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const norm=s=>s.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const roleNotes={todos:'Todos los puntos de vista. Cada lámina representa una vista o un estado; no son pasos consecutivos.',comensal:'App del comensal. Pago: número → detalle → propina, créditos y tarjeta. Los errores y esperas son alternativas.',dueño:'Dueño: negocio, crédito, exportaciones, equipo y operación.',encargado:'Encargado: operación, historial, reseñas e incidencias.',cajero:'Gestión opcional: pagos de hoy. El QR también se verifica sin iniciar sesión.',mesero:'Garzón: escanea el comprobante con la cámara y verifica la cuenta en el navegador. No requiere usuario ni turno.',caja:'Caja: verificación por QR; el restaurante decide cómo registrar y cerrar en su propio POS.',admin:'Administración continúa en la web. La app muestra cómo abrir el panel.'};
 const portalLinks={todos:['documento/indice','Ver paneles de computador'],dueño:['dueno/resumen','Abrir portal del dueño'],encargado:['encargado/hoy','Abrir portal del encargado'],cajero:['cajero/hoy','Abrir portal del cajero'],caja:['caja/hoy','Abrir caja en computador'],admin:['admin/panel','Abrir administración completa']};
 function rolePhone(s){return s.phoneByRole?.[$('canvas-role').value]||s.phone;}
 function roleParam(s){const r=$('canvas-role').value;return s.roles.includes(r)?'&rol='+encodeURIComponent(r):'';}
 function captureFile(s){const r=$('canvas-role').value;return s.id+(s.phoneByRole?.[r]?'-'+r:'');}
 function roleCaption(s){return s.roleLabels.join(' · ')+(s.platform==='web'?' · Navegador':'');}
 const index=new Map(data.map(s=>{const div=document.createElement('div');div.innerHTML=s.phone;return[s.id,{...s,search:norm([s.id,s.title,s.state,s.category,s.context,div.textContent].join(' '))}];}));
 let visible=[],selected=null,camera={x:0,y:0,z:.5},space=false,gesture=null,renderVersion=0,transformFrame=0;
 const aliases=new Map(data.flatMap(s=>(s.aliases||[]).map(id=>[id,s.id])));
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
 function selection(){world.querySelectorAll('[data-frame]').forEach(n=>n.dataset.selected=String(n.dataset.frame===selected));$('canvas-index').querySelectorAll('[data-select]').forEach(n=>{if(n.dataset.select===selected)n.setAttribute('aria-current','true');else n.removeAttribute('aria-current');});const s=index.get(selected);$('canvas-guide-link').href='app.html'+(s?.consumer?'#pantalla-'+s.id:'');$('canvas-selection').innerHTML=s?`<span title="${esc(s.id+' · '+s.title)}">${esc(s.id+' · '+s.title)}</span><a href="pantalla.html?id=${encodeURIComponent(s.id)}${roleParam(s)}">Abrir sola ↗</a><a href="capturas/${encodeURIComponent(captureFile(s))}.png" download>PNG ↓</a><button type="button" data-copy-selected>Copiar enlace</button>`:'<span>Selecciona una pantalla para abrirla o compartirla.</span>';}
 function closeIndex(){$('canvas-sidebar').classList.remove('open');$('canvas-index-toggle').setAttribute('aria-expanded','false');}
 function select(id,{focus=true,hash=true}={}){if(!index.has(id)||!frameNode(id))return;selected=id;selection();if(focus)focusFrame(id);if(hash&&location.hash!=='#pantalla-'+id)history.pushState(null,'','#pantalla-'+id);closeIndex();}
 function render({target=null}={}){
  const q=norm($('canvas-search').value.trim()),scope=$('canvas-scope').value,status=$('canvas-status').value,role=$('canvas-role').value;
  visible=[...index.values()].filter(s=>(role==='todos'||s.roles.includes(role))&&(q||scope==='todas'||s.primary)&&(status==='todos'||(status==='dividir'&&s.category==='dividir')||s.status===status||(status==='vigente'&&['actual','adoptado'].includes(s.status)))&&(!q||s.search.includes(q)));
  if(!visible.some(s=>s.id===selected))selected=null;
  world.innerHTML=groups.map(([key,title,sub])=>{const screens=visible.filter(s=>s.category===key);if(!screens.length)return'';return`<section class="canvas-chapter" data-category="${key}"><div class="canvas-chapter-head"><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div><span>${screens.length} pantallas</span></div><div class="canvas-row">${screens.map(s=>`<article class="canvas-frame" data-frame="${esc(s.id)}" data-status="${s.status}" aria-label="${esc(s.id+' · '+s.title+' · '+s.availability)}"><div class="canvas-caption"><span class="status ${s.status}">${esc(s.availability)}</span><button type="button" class="canvas-frame-title" data-select="${esc(s.id)}"><span>${esc(s.id)}</span>${esc(s.title)}</button><p class="canvas-role-caption">${esc(role==='todos'?roleCaption(s):$('canvas-role').selectedOptions[0].textContent)}</p><p>${esc(s.presentation||s.state)}</p></div><div class="phone-original">${rolePhone(s)}</div><div class="canvas-frame-tools"><a href="pantalla.html?id=${encodeURIComponent(s.id)}${roleParam(s)}">Abrir sola ↗</a><a href="capturas/${encodeURIComponent(captureFile(s))}.png" download>Descargar PNG</a>${s.context?`<details class="canvas-context"><summary>Alcance ⓘ</summary><p>${esc(s.context)}</p></details>`:''}</div></article>`).join('')}</div></section>`;}).join('');
  $('canvas-index').innerHTML=groups.map(([key,title])=>{const screens=visible.filter(s=>s.category===key);if(!screens.length)return'';return`<section class="canvas-index-group"><h2>${esc(title)}<span>${screens.length}</span></h2>${screens.map(s=>`<button type="button" class="canvas-index-item" data-select="${esc(s.id)}" data-status="${s.status}" title="${esc(s.id+' · '+s.availability)}"><span>${s.primary?esc(s.id):'↳'}</span><span>${esc(s.title)}</span><i class="index-dot" aria-hidden="true"></i></button>`).join('')}</section>`;}).join('');
  const roleTotal=[...index.values()].filter(s=>role==='todos'||s.roles.includes(role)).length;
  $('canvas-role-note').innerHTML=`<span>${esc(status==='dividir'?'División implementada, sujeta a habilitación. Cada pago cubre una parte; el local gestiona su caja.':roleNotes[role])}</span>${portalLinks[role]?`<a href="../portales.html#${portalLinks[role][0]}">${portalLinks[role][1]} ↗</a>`:''}`;
  $('canvas-count').textContent=visible.length+' de '+roleTotal+' vistas y estados';$('canvas-empty').hidden=visible.length>0;$('canvas-empty-stage').hidden=visible.length>0;selection();
  const version=++renderVersion;requestAnimationFrame(()=>{if(version!==renderVersion)return;if(target)select(target,{hash:false});else if(viewport.clientWidth<570&&visible.length)select(visible[0].id,{hash:false});else fitRow();});
 }
 function readHash(){
  let id;try{id=decodeURIComponent(location.hash).replace(/^#pantalla-/,'');}catch{return;}
  id=aliases.get(id)||id;if(!index.has(id))return;
  const url=new URL(location.href),requested=url.searchParams.get('rol')||'todos';
  let role=[...$('canvas-role').options].some(o=>o.value===requested)?requested:'todos';
  if(role!=='todos'&&!index.get(id).roles.includes(role)){role=index.get(id).roles[0];url.searchParams.set('rol',role);history.replaceState(null,'',url.pathname+url.search+url.hash);}
  const changed=$('canvas-role').value!==role;$('canvas-role').value=role;
  if(changed||!frameNode(id)){$('canvas-search').value='';$('canvas-scope').value='todas';$('canvas-status').value=id.startsWith('dividir.')?'dividir':'todos';render({target:id});}else select(id,{hash:false});
 }
 function roleUrl(){const url=new URL(location.href);if($('canvas-role').value==='todos')url.searchParams.delete('rol');else url.searchParams.set('rol',$('canvas-role').value);url.hash='';history.replaceState(null,'',url.pathname+url.search);}
 $('canvas-role').addEventListener('change',()=>{selected=null;roleUrl();render();});
 $('canvas-search').addEventListener('input',()=>render());
 $('canvas-scope').addEventListener('change',()=>{if($('canvas-scope').value==='principal')$('canvas-status').value='vigente';render();});
 $('canvas-status').addEventListener('change',()=>{if($('canvas-status').value!=='vigente')$('canvas-scope').value='todas';render();});
 $('canvas-reset').addEventListener('click',()=>{$('canvas-search').value='';$('canvas-role').value='todos';$('canvas-scope').value='principal';$('canvas-status').value='vigente';selected=null;roleUrl();render();});
 $('canvas-expand').addEventListener('click',()=>{$('canvas-role').value='todos';$('canvas-scope').value='todas';$('canvas-status').value='todos';render();});
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
 const initialRole=new URLSearchParams(location.search).get('rol');if([...$('canvas-role').options].some(o=>o.value===initialRole))$('canvas-role').value=initialRole;
 render();document.fonts.ready.then(()=>{if(location.hash)readHash();else if(viewport.clientWidth<570&&visible.length)select(visible[0].id,{hash:false});else fitRow();});
 window.vamoaCanvas={ids:data.map(s=>s.id),visible:()=>visible.map(s=>s.id),selected:()=>selected,camera:()=>({...camera}),focus:id=>select(id),fit:fitRow,overview};
})();
