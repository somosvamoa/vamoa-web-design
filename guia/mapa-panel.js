// A draggable mockup panel; no map API, geolocation or product data is queried.
(() => {
  'use strict';
  const collapsed = 324, expanded = 560;
  const initialized = new WeakSet();

  function initialize(sheet) {
    if (initialized.has(sheet)) return;
    initialized.add(sheet);
    const handle = sheet.querySelector('[data-map-sheet-handle]');
    let drag, suppressClick = false;

    function settle(open) {
      sheet.classList.remove('is-dragging');
      sheet.style.removeProperty('--map-sheet-height');
      sheet.dataset.sheetState = open ? 'expanded' : 'collapsed';
      handle.setAttribute('aria-expanded', String(open));
      handle.setAttribute('aria-label', (open ? 'Contraer' : 'Ampliar') + ' resultados de esta zona');
      handle.querySelector('.material-symbols-rounded').textContent = open ? 'keyboard_arrow_down' : 'keyboard_arrow_up';
    }

    handle.addEventListener('click', () => {
      if (suppressClick) { suppressClick = false; return; }
      settle(sheet.dataset.sheetState !== 'expanded');
    });
    handle.addEventListener('keydown', event => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        settle(event.key === 'ArrowUp');
      }
    });
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary) return;
      suppressClick = false;
      const scale = sheet.getBoundingClientRect().width / sheet.offsetWidth;
      drag = {id: event.pointerId, y: event.clientY, height: sheet.offsetHeight, scale, moved: false};
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const delta = (drag.y - event.clientY) / drag.scale;
      if (!drag.moved && Math.abs(delta) < 6) return;
      drag.moved = true;
      sheet.classList.add('is-dragging');
      sheet.style.setProperty('--map-sheet-height', Math.max(collapsed, Math.min(expanded, drag.height + delta)) + 'px');
    });
    function finish(event) {
      if (!drag || event.pointerId !== drag.id) return;
      const last = drag;
      drag = undefined;
      if (last.moved) {
        suppressClick = true;
        const delta = (last.y - event.clientY) / last.scale;
        settle(Math.abs(delta) > 45 ? delta > 0 : sheet.offsetHeight > (collapsed + expanded) / 2);
      }
    }
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', () => {
      if (!drag) return;
      drag = undefined;
      settle(sheet.dataset.sheetState === 'expanded');
    });
    settle(sheet.dataset.sheetState === 'expanded');
  }

  function scan() { document.querySelectorAll('[data-map-sheet]').forEach(initialize); }
  function ready() {
    scan();
    new MutationObserver(mutations => {
      if (mutations.some(mutation => [...mutation.addedNodes].some(node => node.nodeType === 1))) scan();
    }).observe(document.body, {childList: true, subtree: true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once: true});
  else ready();
})();
