
function shouldShowOpening() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation && navigation.type === 'reload') return true;
  if (navigation && navigation.type === 'back_forward') return false;
  return !document.referrer || new URL(document.referrer).origin !== location.origin;
}

class Component extends DCLogic {
  state = { opening: shouldShowOpening(), step: 0, open: -1, joined: false, playing: !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), tick: 0 };
  componentDidMount() { this.startOpening(); if (location.hash === '#lista') requestAnimationFrame(() => window.scrollTo({top: 0, behavior: 'instant'})); if (this.state.playing) this.heroT = setInterval(() => this.setState(s => ({ hero: ((s.hero || 0) + 1) % 6 })), 3500); this.timer = setInterval(this.avanzar, 4000); }
  avanzar = () => { if (this.state.playing) this.setState(s => ({ step: (s.step + 1) % 5, tick: s.tick + 1 })); };
  componentWillUnmount() { this.stopOpening(); clearInterval(this.heroT); clearInterval(this.timer); }
  // Elegir un paso no detiene el recorrido: lo reinicia desde ahí, con sus 4 segundos y la barra desde cero.
  go(i) {
    clearInterval(this.timer);
    this.timer = setInterval(this.avanzar, 4000);
    this.setState({ step: (i + 5) % 5, reinicio: true }, () => requestAnimationFrame(() => requestAnimationFrame(() => this.setState({ reinicio: false }))));
  }

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
    const S = [["Elige dónde comer", "Elige un lugar Vamo’a y disfruta. Cuando quieras pagar, abre su ficha y toca «Pagar la cuenta»."], ["Escribe el número de tu precuenta", "Viene impreso en el papel que te trae el garzón. La app trae el detalle desde la caja del local."], ["Revisa tu cuenta", "Llega desde la caja, plato por plato. ¿Algo no calza? Avísale al garzón antes de pagar."], ["Elige la propina y paga", "La propina parte en 10% sobre el consumo completo. Puedes cambiarla o guardar tus créditos. Confirma el total y elige cómo pagar en Fintoc."], ["Recupera el 20%", "Al pagar recuperas el 20% del consumo que pagaste para tu próxima salida. Marcar qué volverías a pedir es opcional."]];
    const st = this.state.step;
    const steps = S.map((s,i)=>({ n: String(i+1).padStart(2,'0'), title: s[0], body: s[1], bg: i===st ? '#D4DF60' : '#FAF7EF', active: i===st, current: i===st ? 'step' : 'false', fill: i < st || (i === st && !this.state.reinicio) ? '100%' : '0%', trans: i === st && this.state.playing && !this.state.reinicio ? 'width 4s linear' : 'none', pick: () => this.go(i) }));
    const cur = S[st];
    const F = [["¿Ya puedo pagar en restaurantes con Vamo’a?","Estamos hablando con restaurantes y preparando los pilotos en Santiago. Deja tu correo en la lista de espera y te avisamos cuando abramos."],["¿Necesito comprar algo o pagar una membresía?","No. Lo único que pagas es la cuenta que tienes en la mesa: revisas el detalle y el total, confirmas, y recuperas el 20% de ese pago para tu próxima comida."],["¿Cómo se calcula el 20%?","Sobre el consumo que pagas. Si la cuenta es de $100.000 y usas $25.000 que ya tenías recuperados, pagas $75.000 de consumo y recuperas $15.000, el 20% de esos $75.000. Si además dejas $10.000 de propina, el cobro total es $85.000 y lo que recuperas no cambia: la propina queda fuera del cálculo."],["¿Lo que recupero lo puedo retirar o pasarle a alguien?","No. Queda como crédito para tu próxima cuenta en la app. No se retira en dinero, no se transfiere a otra persona y no se compra. Vence a los 90 días, y cada cuenta nueva renueva ese plazo para todo lo que tengas sin usar."],["¿Hay algo por abrir la cuenta?","Sí: $10.000 al confirmar tu correo. Se descuentan en tu primera cuenta desde $20.000. Si tu primera cuenta es menor, el regalo espera a la siguiente. Tienes 60 días para usarlo."],["¿Tengo que usar lo que recuperé?","No. Se acumula, y antes de cada pago eliges si lo usas o lo guardas. Si lo acumulado cubre toda la cuenta, pagas $0 por el consumo y esa vez no recuperas nada nuevo; si dejaste propina, se cobra sólo ella. El crédito nunca paga propina."],["¿La propina también entra en el 20%?","No. La eliges tú, puede ser cero, y va aparte del consumo: el cobro es uno solo y la propina llega íntegra al equipo del local, sin comisión de Vamo’a."],["¿Qué hago si el detalle de la cuenta no coincide?","No confirmes el pago. Pídele al equipo del restaurante que revise la precuenta, porque el detalle sale de su sistema. Si ya pagaste, escríbenos desde el comprobante en la app o desde el formulario de contacto."]];
    // La web agrega esta pregunta desde su código (apps/web/src/app/pregunta-invitacion.ts), sólo con el programa de invitaciones activo. Va fuera de F porque F se importa a la web.
    const FI = ['¿Gano algo por invitar a alguien?', 'Sí: $10.000 en créditos para ti y $10.000 para quien invitas, cuando esa persona paga al menos $25.000 y entre los dos completan $50.000 de consumo, en una o varias visitas. No cuentan el crédito, la bienvenida ni la propina, y cada peso cuenta para una sola invitación. Los bonos vencen a los 60 días. Las condiciones completas están en los términos, «Invitaciones».'];
    const corte = F.findIndex(([q]) => q === '¿Hay algo por abrir la cuenta?') + 1;
    const preguntas = corte ? [...F.slice(0, corte), FI, ...F.slice(corte)] : [...F, FI];
    const faqs = preguntas.map(([q,a],i)=>{ const open = this.state.open===i; return { q, a, open, expanded: open ? 'true' : 'false', icon: open?'remove':'add', iconBg: open?'#D4DF60':'#F2EDDF', toggle: () => this.setState({ open: open ? -1 : i }) }; });
    return { opening: this.state.opening, goWaitlist: e => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); window.scrollTo({top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}); },
      steps, faqs, hero1: (this.state.hero||0)===1 ? '1' : '0', heroS1: (this.state.hero||0)===1 ? '1.06' : '1', hero2: (this.state.hero||0)===2 ? '1' : '0', heroS2: (this.state.hero||0)===2 ? '1.06' : '1', hero3: (this.state.hero||0)===3 ? '1' : '0', heroS3: (this.state.hero||0)===3 ? '1.06' : '1', hero4: (this.state.hero||0)===4 ? '1' : '0', heroS4: (this.state.hero||0)===4 ? '1.06' : '1', hero5: (this.state.hero||0)===5 ? '1' : '0', heroS5: (this.state.hero||0)===5 ? '1.06' : '1',
      stepNum: String(st+1).padStart(2,'0'), stepTitle: cur[0], stepBody: cur[1],
      trackX: (-270*st) + 'px', blobScale: 1, phoneTilt: '0deg',
      joined: this.state.joined, notJoined: !this.state.joined,
      joinError: !!this.state.joinError,
      join: () => { const i = document.getElementById('lista-correo'); const v = ((i && i.value) || '').trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { this.setState({ joinError: true }); if (i) i.focus(); return; } this.setState({ joined: true, joinError: false }); }
    };
  }
}
