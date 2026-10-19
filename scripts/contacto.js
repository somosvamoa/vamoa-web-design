
function shouldShowOpening() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation && navigation.type === 'reload') return true;
  if (navigation && navigation.type === 'back_forward') return false;
  return !document.referrer || new URL(document.referrer).origin !== location.origin;
}

class Component extends DCLogic {
  state = { opening: shouldShowOpening(), topic: 0, sent: false };
  componentDidMount() { this.startOpening(); }
  componentWillUnmount() { this.stopOpening(); }

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
    const T = ['Un pago', 'Mi cuenta', 'Mi bono o crédito', 'Soy restaurante', 'Otra cosa'];
    return { opening: this.state.opening,
      topics: T.map((label, i) => ({ label, bg: i === this.state.topic ? '#18332C' : '#F2EDDF', fg: i === this.state.topic ? '#FAF7EF' : '#18332C', pressed: i === this.state.topic ? 'true' : 'false', pick: () => this.setState({ topic: i }) })),
      sent: this.state.sent, notSent: !this.state.sent,
      ctError: !!this.state.ctError,
      send: () => { const v = id => ((document.getElementById(id) || {}).value || '').trim(); if (!v('ct-nombre') || !v('ct-msg') || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('ct-correo'))) { this.setState({ ctError: true }); return; } this.setState({ sent: true, ctError: false }); }
    };
  }
}
