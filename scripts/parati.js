
function shouldShowOpening() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation && navigation.type === 'reload') return true;
  if (navigation && navigation.type === 'back_forward') return false;
  return !document.referrer || new URL(document.referrer).origin !== location.origin;
}

class Component extends DCLogic {
  state = { opening: shouldShowOpening(), joined: false };
  componentDidMount() { this.startOpening(); if (location.hash === '#lista') requestAnimationFrame(() => window.scrollTo({top: 0, behavior: 'instant'})); }
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
    return { opening: this.state.opening, goWaitlist: e => { e.preventDefault(); window.scrollTo({top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}); },
      joined: this.state.joined, notJoined: !this.state.joined,
      joinError: !!this.state.joinError,
      join: () => { const i = document.getElementById('pt-correo'); const v = ((i && i.value) || '').trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { this.setState({ joinError: true }); if (i) i.focus(); return; } this.setState({ joined: true, joinError: false }); }
    };
  }
}
