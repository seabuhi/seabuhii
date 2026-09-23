/**
 * Loader — Branded loading sequence
 * S / 01 → progress → SƏBUHİ → reveal
 */
export class Loader {
  constructor(onComplete) {
    this.el = document.getElementById('loader');
    this.progress = this.el.querySelector('.loader__progress');
    this.name = this.el.querySelector('.loader__name');
    this.line = this.el.querySelector('.loader__line');
    this.onComplete = onComplete;
    this.value = 0;
  }

  start() {
    // Animate progress from 0 to 100
    const duration = 1800;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - t, 4);
      this.value = Math.floor(eased * 100);
      this.progress.textContent = this.value;

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        // Show name
        setTimeout(() => {
          this.name.classList.add('visible');
          this.line.classList.add('animate');
        }, 200);

        // Hide loader
        setTimeout(() => {
          this.el.classList.add('hidden');
          if (this.onComplete) this.onComplete();
        }, 1200);
      }
    };

    requestAnimationFrame(tick);
  }
}
