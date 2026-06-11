function spawn(className: string, x?: number, y?: number, ttl = 3000) {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.className = className;
  if (x !== undefined) { el.style.left = `${x}px`; el.style.top = `${y}px`; }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ttl);
}
export const fx = {
  sparkleAt: (x: number, y: number) => spawn('sparkle', x, y, 500),
  correctPulse: () => spawn('pulse-warm', undefined, undefined, 800),
  roomTransition: () => spawn('room-transition', undefined, undefined, 1300),
  shardParticles: () => {
    for (let i = 0; i < 24; i++) {
      setTimeout(() => {
        if (typeof document === 'undefined') return;
        const el = document.createElement('div');
        el.className = 'light-particle';
        el.style.left = `${Math.random() * 100}vw`;
        el.style.animationDuration = `${2 + Math.random() * 2}s`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4500);
      }, i * 80);
    }
  },
};
