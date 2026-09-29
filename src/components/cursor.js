/**
 * SAVELYA CYBERNETIC MAGNETIC CURSOR
 * Smooth Lerp, State Badge & Dynamic Aura
 */

export class CyberCursor {
  constructor() {
    this.cursor = document.getElementById('cyber-cursor');
    this.dot = this.cursor ? this.cursor.querySelector('.cursor-core') : null;
    this.ring = this.cursor ? this.cursor.querySelector('.cursor-aura') : null;
    this.label = this.cursor ? this.cursor.querySelector('.cursor-label') : null;

    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.pos = { x: this.mouse.x, y: this.mouse.y };
    this.activeState = 'default';
    this.isVisible = false;

    // Check touch device
    if (window.matchMedia('(pointer: coarse)').matches) {
      if (this.cursor) this.cursor.style.display = 'none';
      return;
    }

    this.init();
  }

  init() {
    if (!this.cursor) return;

    window.addEventListener('pointermove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      if (!this.isVisible) {
        this.isVisible = true;
        this.cursor.classList.add('visible');
      }
    });

    window.addEventListener('pointerdown', () => {
      this.cursor.classList.add('pressed');
    });

    window.addEventListener('pointerup', () => {
      this.cursor.classList.remove('pressed');
    });

    document.addEventListener('mouseleave', () => {
      this.cursor.classList.remove('visible');
      this.isVisible = false;
    });

    // Delegate hover states
    document.addEventListener('pointerover', (e) => {
      const card = e.target.closest('.carousel-card');
      const interactive = e.target.closest('button, a, .interactive');
      const closeBtn = e.target.closest('.modal-close-btn');

      if (closeBtn) {
        this.setState('close', 'BAĞLA');
      } else if (card) {
        this.setState('expand', 'İNCƏLƏ');
      } else if (e.target.closest('.carousel-stage')) {
        this.setState('drag', 'FIRLAT');
      } else if (interactive) {
        this.setState('hover', 'SEÇ');
      } else {
        this.setState('default', '');
      }
    });

    this.loop();
  }

  setState(state, text) {
    if (this.activeState === state) return;
    this.activeState = state;
    this.cursor.setAttribute('data-state', state);
    if (this.label) {
      this.label.textContent = text;
    }
  }

  loop() {
    // Lerp follow
    const ease = 0.18;
    this.pos.x += (this.mouse.x - this.pos.x) * ease;
    this.pos.y += (this.mouse.y - this.pos.y) * ease;

    if (this.cursor) {
      this.cursor.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;
    }

    requestAnimationFrame(() => this.loop());
  }
}
