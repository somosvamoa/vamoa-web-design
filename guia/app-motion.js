// The clock is a design fixture. It does not query or confirm a real payment.
(()=>{
 'use strict';
 const openedAt=Date.now(),lifetime=6*60*60,format=n=>String(n).padStart(2,'0');
 function update(){
  const capture=document.body.classList.contains('capture-mode');
  const elapsed=capture?0:Math.max(0,Math.floor((Date.now()-openedAt)/1000));
  document.querySelectorAll('[data-live-clock]').forEach(clock=>{
   const receipt=clock.closest('[data-receipt-live]');
   if(!receipt)return;
   receipt.hidden=elapsed+Number(receipt.dataset.receiptAge||18)>=lifetime;
   if(receipt.hidden)return;
   const [h,m,s]=clock.dataset.liveClock.split(':').map(Number),seconds=(h*3600+m*60+s+elapsed)%86400;
   const value=format(Math.floor(seconds/3600))+':'+format(Math.floor(seconds/60)%60)+':'+format(seconds%60);
   if(clock.textContent!==value)clock.textContent=value;
   clock.setAttribute('datetime',value);
  });
 }
 function ready(){
  update();
  const observer=new MutationObserver(mutations=>{
   if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches('[data-live-clock]')||n.querySelector('[data-live-clock]')))))update();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{if(!document.hidden)update();},1000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
