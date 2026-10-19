
function shouldShowOpening() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation && navigation.type === 'reload') return true;
  if (navigation && navigation.type === 'back_forward') return false;
  return !document.referrer || new URL(document.referrer).origin !== location.origin;
}

class Component extends DCLogic {
  state = { opening: shouldShowOpening(), sent: false, tick: 0 };
  componentDidMount() { this.startOpening(); if (location.hash === '#sumate') setTimeout(() => this.scrollToId('sumate'), 300); this.t = setInterval(() => this.setState(s => ({ tick: s.tick + 1 })), 2600); }
  componentWillUnmount() { this.stopOpening(); clearInterval(this.t); }
  scrollToId(id) { const el = document.getElementById(id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }

  startOpening() {
    if (!this.state.opening) return;
    this.finishOpening = () => { this.stopOpening(); this.setState({ opening: false }); };
    this.openingTimer = window.setTimeout(this.finishOpening, 1650);
    window.addEventListener('wheel', this.finishOpening, { once: true, passive: true });
    window.addEventListener('pointerdown', this.finishOpening, { once: true });
    window.addEventListener('keydown', this.finishOpening, { once: true });
  }
  stopOpening() {
    window.clearTimeout(this.openingTimer);
    if (!this.finishOpening) return;
    window.removeEventListener('wheel', this.finishOpening);
    window.removeEventListener('pointerdown', this.finishOpening);
    window.removeEventListener('keydown', this.finishOpening);
  }

  renderVals() {
    return { opening: this.state.opening,
      perks: [["payments","Caja hoy","Te compramos consumo por adelantado."],["volunteer_activism","Propina íntegra","Llega íntegra al equipo del local."],["point_of_sale","Conectado a tu caja","La cuenta sale de tu POS. Sin montos a mano."],["replay","Clientes que vuelven","El 20% sólo se usa volviendo a comer."],["qr_code_2","Tu equipo, sin cuenta","Escanean el QR y verifican cada mesa pagada."],["monitoring","Portal en vivo","Consumo, clientes y crédito, cuando quieras."]].map(([i, t, d]) => ({ i, t, d, bg: '#285247', fg: '#FAF7EF', sub: '#A9B4AC', ibg: '#D4DF60', ifg: '#18332C' })),
      steps: [
        { n: '01', t: 'Acordamos y te pagamos', d: 'Fijamos monto, precio y vigencia por contrato. Vamo’a transfiere el precio antes del primer consumo.', bg: '#F2EDDF' },
        { n: '02', t: 'Conectamos tu caja', d: 'Leemos la precuenta desde tu POS y probamos todo en marcha blanca antes de la primera mesa.', bg: '#F2EDDF' },
        { n: '03', t: 'El cliente paga', d: 'Escribe el número de su precuenta, ve la cuenta completa, elige la propina y paga.', bg: '#F2EDDF' },
        { n: '04', t: 'Cierras la cuenta', d: 'Tu equipo verifica el QR del pago. El local registra y cierra la cuenta, y se rebaja el consumo contratado.', bg: '#D4DF60' }
      ],
      ...this.feedVals(),
      goSumate: e => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); this.scrollToId('sumate'); },
      goComo: e => { e.preventDefault(); this.scrollToId('como'); },
      sent: this.state.sent, notSent: !this.state.sent,
      rsError: !!this.state.rsError,
      send: () => { const v = id => ((document.getElementById(id) || {}).value || '').trim(); if (!v('rs-local') || !v('rs-nombre') || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('rs-correo'))) { this.setState({ rsError: true }); return; } this.setState({ sent: true, rsError: false }); }
    };
  }
  feedVals() {
    const D = [['8','4827',59070,1],['3','1930',38400,0],['12','7712',21900,1],['5','2208',44000,0],['9','5561',16500,0],['2','3390',27800,1],['14','6104',33200,0]];
    const N = D.length, t = this.state.tick;
    const fmt = n => '$' + n.toLocaleString('es-CL').replace(/,/g, '.');
    const hm = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    const feed = D.map((x, i) => {
      const p = (i + t) % N;
      const top = p === 0, out = p === 5, pre = p === 6;
      const arrival = t - p;
      return { mesa: x[0], amt: fmt(x[2]), meta: hm(20 * 60 + 40 + arrival * 3) + ' · N° ' + x[1] + (x[3] ? ' · primera vez' : ''),
        bg: top ? '#D4DF60' : '#285247', fg: top ? '#18332C' : '#FAF7EF', cbg: top ? '#18332C' : '#2E5248', cfg: top ? '#D4DF60' : '#FAF7EF', sub: top ? '#18332C' : '#A9B4AC',
        tf: pre ? 'translate(0,-96px) scale(.96)' : out ? 'translate(70px,440px)' : 'translate(' + (p * 14) + 'px,' + (p * 88) + 'px)',
        op: pre || out ? '0' : String(1 - p * 0.17),
        tr: pre ? 'none' : 'transform .7s cubic-bezier(.34,1.3,.64,1), opacity .5s, background .4s, color .4s' };
    });
    return { feed, pulse: t % 2 ? '10px' : '4px' };
  }
}
