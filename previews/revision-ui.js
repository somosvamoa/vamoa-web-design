(async () => {
  const views = await window.VamoaViews.load();
  document.querySelectorAll('[data-review-screen]').forEach(frame => {
    frame.innerHTML = views.find(view => view.id === frame.dataset.reviewScreen).phone;
  });
  function fit() {
    document.querySelectorAll('.phone-canvas').forEach(canvas => {
      const scale = Math.min(360, canvas.parentElement.clientWidth) / 360;
      canvas.style.width = 360 * scale + 'px';
      canvas.style.height = 800 * scale + 'px';
      canvas.firstElementChild.style.transform = `scale(${scale})`;
    });
  }
  const toggle = document.querySelector('[data-review-toggle]');
  toggle.addEventListener('click', () => document.querySelector('[data-map-sheet-handle]').click());
  const panel = document.querySelector('[data-map-sheet]');
  new MutationObserver(() => {
    const open = panel.dataset.sheetState === 'expanded';
    toggle.firstChild.textContent = open ? 'Contraer resultados ' : 'Ampliar resultados ';
    toggle.lastElementChild.textContent = open ? '↓' : '↑';
  }).observe(panel, {attributes: true, attributeFilter: ['data-sheet-state']});
  window.addEventListener('resize', fit);
  fit();
  await document.fonts.ready;
  fit();
})().catch(window.VamoaViews.showError);
