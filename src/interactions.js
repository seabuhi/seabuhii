/**
 * Interactions — Scroll reveal, progress bar, magnetic buttons, parallax
 */
export class Interactions {
  constructor() {
    this.scrollProgress = document.querySelector('.scroll-progress__bar');
    this.reveals = document.querySelectorAll('.reveal-up');
    this.magneticBtns = document.querySelectorAll('.magnetic-btn');

    this.init();
  }

  init() {
    this.setupScrollReveal();
    this.setupScrollProgress();
    this.setupMagneticButtons();
  }

  setupScrollReveal() {
    // Use IntersectionObserver for reveal animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseFloat(entry.target.getAttribute('data-delay') || 0);
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay * 1000);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    });

    this.reveals.forEach(el => observer.observe(el));
  }

  setupScrollProgress() {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      this.scrollProgress.style.transform = `scaleX(${progress})`;
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  setupMagneticButtons() {
    // Only on desktop
    if (window.matchMedia('(hover: none)').matches) return;

    this.magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => {
          btn.style.transition = '';
        }, 400);
      });
    });
  }
}
