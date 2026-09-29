/**
 * ULTRA-HIGH-END 3D QUANTUM DETACH & HOLOGRAPHIC TRANSITION ENGINE
 * Custom FLIP 3D Matrix, Particle Shockwave, Chromatic Aberration & Kinetic Unscrambler.
 * Designed specifically for Savelya & Seabuhi.
 */

import gsap from 'gsap';
import { sound } from './audioEngine.js';

export class TransitionEngine {
  constructor(carouselInstance) {
    this.carousel = carouselInstance;
    this.modal = document.getElementById('savelya-modal');
    this.modalBackdrop = document.querySelector('.modal-backdrop');
    this.modalContainer = document.querySelector('.modal-container');
    this.modalImageWrap = document.querySelector('.modal-hero-image-wrap');
    this.modalImg = document.querySelector('.modal-hero-img');
    this.modalContent = document.querySelector('.modal-dossier-content');
    this.canvas = document.getElementById('transition-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    this.isOpen = false;
    this.isAnimating = false;
    this.activeItem = null;
    this.activeCardEl = null;
    this.cloneEl = null;

    this.particles = [];
    this.shockwaves = [];
    this.rafId = null;

    this.initEvents();
    this.initCanvasResize();
  }

  initCanvasResize() {
    if (!this.canvas) return;
    const resize = () => {
      this.canvas.width = window.innerWidth * window.devicePixelRatio;
      this.canvas.height = window.innerHeight * window.devicePixelRatio;
      if (this.ctx) {
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };
    resize();
    window.addEventListener('resize', resize);
  }

  initEvents() {
    // Close button
    const closeBtn = document.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Backdrop click
    if (this.modalBackdrop) {
      this.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === this.modalBackdrop) {
          this.close();
        }
      });
    }

    // Keyboard ESC & Arrows
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowRight') {
        this.navigate(1);
      } else if (e.key === 'ArrowLeft') {
        this.navigate(-1);
      }
    });

    // In-modal prev / next buttons
    const prevBtn = document.querySelector('.modal-nav-prev');
    const nextBtn = document.querySelector('.modal-nav-next');
    if (prevBtn) prevBtn.addEventListener('click', () => this.navigate(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.navigate(1));
  }

  /**
   * OPEN / DETACH TRANSITION
   */
  open(item, cardEl) {
    if (this.isOpen || this.isAnimating) return;
    this.isOpen = true;
    this.isAnimating = true;
    this.activeItem = item;
    this.activeCardEl = cardEl;

    // Trigger Sound
    sound.playWarp();

    // 1. Pause carousel auto-rotation and notify carousel
    if (this.carousel) {
      this.carousel.onModalOpen(item);
    }

    // 2. Measure source card rect
    const sourceRect = cardEl.getBoundingClientRect();
    const sourceImg = cardEl.querySelector('.card-image');
    const imgSrc = sourceImg ? sourceImg.src : item.image;

    // 3. Trigger Particle & Shockwave burst on canvas
    this.triggerQuantumBurst(sourceRect.left + sourceRect.width / 2, sourceRect.top + sourceRect.height / 2, item.accentColor);

    // 4. Populate modal static data
    this.populateModal(item);

    // 5. Create Holographic 3D FLIP Flying Clone
    this.createFlyingClone(sourceRect, imgSrc, item);

    // 6. Dim background carousel with cinematic depth pushback
    gsap.to('.carousel-stage', {
      scale: 0.82,
      filter: 'blur(8px) brightness(0.25)',
      duration: 0.9,
      ease: 'power3.out'
    });

    // 7. Show modal shell
    this.modal.classList.add('active');
    document.body.classList.add('modal-open');

    // 8. Measure destination target inside modal
    this.modalImageWrap.style.visibility = 'hidden';
    this.modalContent.style.opacity = '0';
    this.modalContent.style.transform = 'translateY(40px)';

    requestAnimationFrame(() => {
      let destRect = this.modalImageWrap.getBoundingClientRect();
      if (!destRect.width || destRect.width === 0) {
        destRect = {
          top: window.innerHeight * 0.15,
          left: window.innerWidth > 992 ? window.innerWidth * 0.12 : window.innerWidth * 0.05,
          width: window.innerWidth > 992 ? Math.min(540, window.innerWidth * 0.45) : window.innerWidth * 0.9,
          height: window.innerWidth > 992 ? 480 : 320
        };
      }

      // Animate clone from sourceRect to destRect with 3D unwrap
      gsap.to(this.cloneEl, {
        top: destRect.top,
        left: destRect.left,
        width: destRect.width,
        height: destRect.height,
        borderRadius: '24px',
        boxShadow: `0 0 60px ${item.ambientGlow}, 0 25px 50px rgba(0,0,0,0.85)`,
        transform: 'perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1)',
        duration: 0.95,
        ease: 'power4.out',
        onComplete: () => {
          // Clone reached destination: swap with real modal elements
          this.modalImageWrap.style.visibility = 'visible';
          if (this.cloneEl && this.cloneEl.parentNode) {
            this.cloneEl.parentNode.removeChild(this.cloneEl);
            this.cloneEl = null;
          }

          // Unfold Dossier Content with kinetic stagger
          this.revealDossierContent(item);
          this.isAnimating = false;
        }
      });

      // Animate laser scanline on clone
      const laser = this.cloneEl.querySelector('.clone-laser');
      if (laser) {
        gsap.fromTo(laser, { top: '-10%', opacity: 1 }, { top: '110%', duration: 0.85, ease: 'power2.inOut' });
      }
    });
  }

  /**
   * REVEAL DOSSIER CONTENT WITH MATRIX SCRAMBLER & COUNTERS
   */
  revealDossierContent(item) {
    // 1. Animate content container
    gsap.to(this.modalContent, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out'
    });

    // 2. Cyber Scramble Title Effect
    const titleEl = document.querySelector('.dossier-title');
    if (titleEl) {
      this.scrambleText(titleEl, item.title);
    }

    // 3. Staggered reveal for badges, specs, stats, tags
    gsap.fromTo('.dossier-badge, .dossier-lead, .dossier-desc, .dossier-stat-card, .dossier-tag, .dossier-action-btn', 
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, stagger: 0.04, duration: 0.6, ease: 'power2.out', delay: 0.1 }
    );

    // 4. Animate counter numbers in stats
    document.querySelectorAll('.stat-val').forEach(el => {
      const rawText = el.getAttribute('data-val') || el.textContent;
      const numMatch = rawText.match(/[\d.]+/);
      if (numMatch) {
        const targetNum = parseFloat(numMatch[0]);
        const prefix = rawText.slice(0, numMatch.index);
        const suffix = rawText.slice(numMatch.index + numMatch[0].length);
        const isDecimal = rawText.includes('.');

        gsap.fromTo({ val: 0 }, { val: targetNum }, {
          duration: 1.2,
          ease: 'power3.out',
          onUpdate: function() {
            const current = isDecimal ? this.targets()[0].val.toFixed(2) : Math.floor(this.targets()[0].val);
            el.textContent = `${prefix}${current}${suffix}`;
          }
        });
      }
    });
  }

  /**
   * MATRIX GLITCH / TEXT UNSCRAMBLER
   */
  scrambleText(element, targetText) {
    const chars = '01#$@%&*!?<>ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const duration = 650;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const lockedLength = Math.floor(progress * targetText.length);

      let result = '';
      for (let i = 0; i < targetText.length; i++) {
        if (i < lockedLength) {
          result += targetText[i];
        } else if (targetText[i] === ' ') {
          result += ' ';
        } else {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      element.textContent = result;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = targetText;
      }
    };

    requestAnimationFrame(update);
  }

  /**
   * QUANTUM CANVAS PARTICLE & SHOCKWAVE BURST
   */
  triggerQuantumBurst(x, y, color) {
    if (!this.ctx) return;
    this.particles = [];
    this.shockwaves = [];

    // Create 70 particles
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 3;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        alpha: 1,
        color: color || '#00f5d4',
        life: 1,
        decay: Math.random() * 0.025 + 0.015
      });
    }

    // Create 2 shockwaves
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 10,
      maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.7,
      alpha: 0.9,
      color: color || '#00f5d4',
      speed: 16
    });

    if (!this.rafId) {
      this.renderBurst();
    }
  }

  renderBurst() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeCount = 0;

    // Render shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha *= 0.93;

      if (sw.alpha > 0.01 && sw.radius < sw.maxRadius) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = sw.color;
        this.ctx.lineWidth = Math.max(1, 4 * sw.alpha);
        this.ctx.globalAlpha = sw.alpha;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = sw.color;
        this.ctx.stroke();
        this.ctx.restore();
        activeCount++;
      } else {
        this.shockwaves.splice(i, 1);
      }
    }

    // Render particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.alpha -= p.decay;

      if (p.alpha > 0.01) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius * p.alpha, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.shadowBlur = 14;
        this.ctx.shadowColor = p.color;
        this.ctx.fill();
        this.ctx.restore();
        activeCount++;
      } else {
        this.particles.splice(i, 1);
      }
    }

    if (activeCount > 0) {
      this.rafId = requestAnimationFrame(() => this.renderBurst());
    } else {
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      this.rafId = null;
    }
  }

  /**
   * CREATE HOLOGRAPHIC 3D FLYING CLONE
   */
  createFlyingClone(rect, imgSrc, item) {
    if (this.cloneEl && this.cloneEl.parentNode) {
      this.cloneEl.parentNode.removeChild(this.cloneEl);
    }

    const clone = document.createElement('div');
    clone.className = 'quantum-flying-clone';
    clone.style.position = 'fixed';
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.zIndex = '99999';
    clone.style.pointerEvents = 'none';
    clone.style.borderRadius = '18px';
    clone.style.overflow = 'hidden';
    clone.style.boxShadow = `0 0 40px ${item.ambientGlow}`;
    clone.style.border = `1.5px solid ${item.accentColor}`;
    clone.style.transformOrigin = 'center center';
    clone.style.transform = 'perspective(1200px) rotateY(15deg) scale(1.02)';

    clone.innerHTML = `
      <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;" alt="${item.title}" />
      <div class="clone-laser" style="position: absolute; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, #fff, ${item.accentColor}, transparent); box-shadow: 0 0 15px ${item.accentColor}; opacity: 0;"></div>
      <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(0,0,0,0.6) 100%);"></div>
    `;

    document.body.appendChild(clone);
    this.cloneEl = clone;
  }

  /**
   * POPULATE MODAL HTML
   */
  populateModal(item) {
    if (this.modalImg) {
      this.modalImg.src = item.image;
      this.modalImg.alt = item.title;
    }

    const badgeEl = document.querySelector('.dossier-badge');
    if (badgeEl) {
      badgeEl.innerHTML = `<span class="badge-dot" style="background:${item.accentColor}; box-shadow: 0 0 10px ${item.accentColor}"></span> ${item.category} // ${item.code}`;
      badgeEl.style.borderColor = `${item.accentColor}55`;
    }

    const titleEl = document.querySelector('.dossier-title');
    if (titleEl) titleEl.textContent = item.title;

    const leadEl = document.querySelector('.dossier-lead');
    if (leadEl) leadEl.textContent = item.subtitle;

    const descEl = document.querySelector('.dossier-desc');
    if (descEl) descEl.textContent = item.description;

    const architectEl = document.querySelector('.dossier-architect-val');
    if (architectEl) architectEl.textContent = item.architect;

    const companyEl = document.querySelector('.dossier-company-val');
    if (companyEl) companyEl.textContent = item.company;

    // Stats Grid
    const statsContainer = document.querySelector('.dossier-stats-grid');
    if (statsContainer) {
      statsContainer.innerHTML = item.stats.map(s => `
        <div class="dossier-stat-card" style="border-left: 2px solid ${item.accentColor}">
          <div class="stat-val" data-val="${s.value}">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      `).join('');
    }

    // Tags
    const tagsContainer = document.querySelector('.dossier-tags-wrap');
    if (tagsContainer) {
      tagsContainer.innerHTML = item.tags.map(t => `
        <span class="dossier-tag">${t}</span>
      `).join('');
    }

    // Dynamic accent glow on hero image container
    if (this.modalImageWrap) {
      this.modalImageWrap.style.boxShadow = `0 0 50px ${item.ambientGlow}, 0 20px 40px rgba(0,0,0,0.8)`;
      this.modalImageWrap.style.borderColor = `${item.accentColor}66`;
    }

    // Action button labels
    const contactBtn = document.querySelector('.dossier-contact-btn');
    if (contactBtn) {
      contactBtn.textContent = item.contactText || 'Səbuhi ilə Əlaqə';
    }
  }

  /**
   * IN-MODAL CAROUSEL NAVIGATION (PREV / NEXT)
   */
  navigate(direction) {
    if (!this.isOpen || this.isAnimating || !this.carousel) return;
    this.isAnimating = true;
    sound.playHover();

    const nextIndex = this.carousel.getAdjacentIndex(this.activeItem, direction);
    const nextItem = this.carousel.items[nextIndex];
    const nextCardEl = this.carousel.cards[nextIndex];

    // Holographic horizontal swipe animation
    gsap.to([this.modalImageWrap, this.modalContent], {
      x: direction * -50,
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        this.activeItem = nextItem;
        this.activeCardEl = nextCardEl;
        this.populateModal(nextItem);

        // Sync background 3D carousel
        this.carousel.rotateToIndex(nextIndex);

        gsap.fromTo([this.modalImageWrap, this.modalContent], 
          { x: direction * 50, opacity: 0 },
          { 
            x: 0, 
            opacity: 1, 
            duration: 0.45, 
            ease: 'power2.out',
            onComplete: () => {
              this.revealDossierContent(nextItem);
              this.isAnimating = false;
            }
          }
        );
      }
    });
  }

  /**
   * CLOSE / REVERSE SPATIAL COLLAPSE
   */
  close() {
    if (!this.isOpen || this.isAnimating) return;
    this.isAnimating = true;
    sound.playClose();

    // 1. Fade out dossier content
    gsap.to(this.modalContent, {
      opacity: 0,
      y: 30,
      duration: 0.35,
      ease: 'power2.in'
    });

    // 2. Hide modal image and create reverse flying clone
    const currentImgRect = this.modalImageWrap.getBoundingClientRect();
    const targetRect = this.activeCardEl ? this.activeCardEl.getBoundingClientRect() : {
      top: window.innerHeight / 2 - 150,
      left: window.innerWidth / 2 - 120,
      width: 240,
      height: 320
    };

    this.modalImageWrap.style.visibility = 'hidden';
    this.createFlyingClone(currentImgRect, this.activeItem.image, this.activeItem);

    // 3. Animate clone back to source card position in 3D carousel
    gsap.to(this.cloneEl, {
      top: targetRect.top,
      left: targetRect.left,
      width: targetRect.width,
      height: targetRect.height,
      borderRadius: '16px',
      transform: 'perspective(1200px) rotateY(15deg) scale(1)',
      opacity: 0.9,
      duration: 0.65,
      ease: 'power3.inOut',
      onComplete: () => {
        if (this.cloneEl && this.cloneEl.parentNode) {
          this.cloneEl.parentNode.removeChild(this.cloneEl);
          this.cloneEl = null;
        }

        // Restore carousel brightness and state
        this.modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        this.modalImageWrap.style.visibility = 'visible';

        gsap.to('.carousel-stage', {
          scale: 1,
          filter: 'none',
          duration: 0.7,
          ease: 'power2.out'
        });

        if (this.carousel) {
          this.carousel.onModalClose();
        }

        this.isOpen = false;
        this.isAnimating = false;
      }
    });
  }
}
