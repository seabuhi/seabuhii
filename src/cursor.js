/**
 * Custom Cursor — Dot + ring with magnetic hover effects
 */
export class Cursor {
  constructor() {
    this.el = document.getElementById('cursor');
    if (!this.el || window.matchMedia('(hover: none)').matches) return;

    this.dot = this.el.querySelector('.cursor__dot');
    this.ring = this.el.querySelector('.cursor__ring');
    this.label = this.el.querySelector('.cursor__label');

    this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.target = { x: this.pos.x, y: this.pos.y };
    this.ringPos = { x: this.pos.x, y: this.pos.y };
    this.visible = false;

    this.init();
  }

  init() {
    // Hide default cursor
    document.body.style.cursor = 'none';

    // Track mouse
    document.addEventListener('mousemove', (e) => {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
      if (!this.visible) {
        this.visible = true;
        this.el.style.opacity = '1';
      }
    });

    document.addEventListener('mouseleave', () => {
      this.el.style.opacity = '0';
      this.visible = false;
    });

    // Hover states
    const hoverables = document.querySelectorAll('a, button, .magnetic-btn, .project, .tech-domain, .build-log__entry');
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.el.classList.add('hovering');
        const cursorLabel = el.getAttribute('data-cursor');
        if (cursorLabel) {
          this.label.textContent = cursorLabel;
          this.el.classList.add('has-label');
        }
      });
      el.addEventListener('mouseleave', () => {
        this.el.classList.remove('hovering', 'has-label');
        this.label.textContent = '';
      });
    });

    this.animate();
  }

  animate() {
    // Dot follows instantly
    this.pos.x += (this.target.x - this.pos.x) * 0.15;
    this.pos.y += (this.target.y - this.pos.y) * 0.15;

    // Ring follows with delay
    this.ringPos.x += (this.target.x - this.ringPos.x) * 0.08;
    this.ringPos.y += (this.target.y - this.ringPos.y) * 0.08;

    this.dot.style.transform = `translate(${this.pos.x - 3}px, ${this.pos.y - 3}px)`;
    this.ring.style.transform = `translate(${this.ringPos.x - 20}px, ${this.ringPos.y - 20}px)`;

    requestAnimationFrame(() => this.animate());
  }
}
