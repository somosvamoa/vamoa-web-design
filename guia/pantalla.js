(()=>{
 const data=JSON.parse(document.getElementById('phone-data').textContent),params=new URLSearchParams(location.search);
 const id=params.get('id'),s=data.find(x=>x.id===id||(x.aliases||[]).includes(id))||(!id?data[0]:null);
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 if(!s){document.getElementById('screen-focus').innerHTML='<p>Esta referencia ya no forma parte del diseño vigente. <a href="app-lienzo.html">Abrir el lienzo actual</a></p>';return;}
 const role=params.get('rol'),variant=role&&s.phoneByRole?.[role],file=s.id+(variant?'-'+role:'');
 if(params.get('captura')==='1'){document.body.classList.add('capture-mode');document.querySelector('.top').hidden=true;}
 document.title=s.title+' · Vamo’a';
 document.getElementById('screen-focus').innerHTML=`<article class="phone-card"><div class="phone-caption"><span class="status ${s.status}">${esc(s.availability)}</span><h1 style="font-size:25px">${esc(s.id)} · ${esc(s.title)}</h1><p>${esc(s.presentation||s.state)}</p><p>${esc(s.roleLabels.join(' · '))}${s.platform==='web'?' · Navegador':''}</p>${s.context?`<p class="screen-context">${esc(s.context)}</p>`:''}</div><div class="phone-canvas"><div class="phone-original">${variant||s.phone}</div></div><div class="phone-actions"><a href="capturas/${encodeURIComponent(file)}.png" download>Descargar PNG</a>${s.consumer?`<a href="app.html#pantalla-${encodeURIComponent(s.id)}">Ver en la guía</a>`:''}<a href="app-lienzo.html${role?'?rol='+encodeURIComponent(role):''}#pantalla-${encodeURIComponent(s.id)}">Ver en el lienzo</a></div></article>`;
})();
