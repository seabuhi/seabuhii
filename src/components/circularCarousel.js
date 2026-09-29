/**
 * SAVELYA 3D CIRCULAR CAROUSEL ENGINE
 * Inspired by ReactBits Circular Carousel (with Bendable 3D Ring, Momentum Drag, Snapping & Depth Fade)
 */

import { SAVELYA_ITEMS } from '../data/items.js';
import { sound } from './audioEngine.js';

export class CircularCarousel {
  constructor(containerId, onCardSelect) {
    this.container = document.getElementById(containerId);
    this.ring = this.container ? this.container.querySelector('.carousel-ring') : null;
    this.items = SAVELYA_ITEMS;
    this.cards = [];
    this.onCardSelect = onCardSelect;

    // Carousel Physics & Math State
    this.radius = 520;
    this.currentRotation = 0;
    this.targetRotation = 0;
    this.velocity = 0;
    this.autoSpinSpeed = 0.18; // degrees per frame
    this.isAutoSpinning = true;
    this.isDragging = false;
    this.startX = 0;
    this.dragStartRotation = 0;
    this.lastPointerX = 0;
    this.lastPointerTime = 0;
    this.pointerVelocity = 0;
    this.isPausedForModal = false;
    this.layoutMode = 'cylinder'; // 'cylinder', 'convex', 'coverflow'
    this.bendFactor = 1.0;

    // RAF
    this.rafId = null;
    this.lastFrameTime = performance.now();

    this.init();
  }

  init() {
    if (!this.container || !this.ring) return;

    this.computeDimensions();
    this.renderCards();
    this.bindEvents();
    this.startLoop();
  }

  computeDimensions() {
    const width = window.innerWidth;
    if (width < 480) {
      this.radius = 230;
      this.cardWidth = 195;
      this.cardHeight = 285;
    } else if (width < 640) {
      this.radius = 270;
      this.cardWidth = 215;
      this.cardHeight = 315;
    } else if (width < 1024) {
      this.radius = 380;
      this.cardWidth = 250;
      this.cardHeight = 360;
    } else {
      this.radius = 480;
      this.cardWidth = 280;
      this.cardHeight = 390;
    }

    if (this.ring) {
      this.ring.style.setProperty('--card-w', `${this.cardWidth}px`);
      this.ring.style.setProperty('--card-h', `${this.cardHeight}px`);
      this.ring.style.setProperty('--radius', `${this.radius}px`);
    }
  }

  renderCards() {
    this.ring.innerHTML = '';
    this.cards = [];
    const count = this.items.length;
    const angleStep = 360 / count;

    this.items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'carousel-card';
      card.dataset.index = index;
      card.dataset.id = item.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${item.title} - ${item.category}`);

      card.innerHTML = `
        <div class="card-inner" style="--accent: ${item.accentColor}; --glow: ${item.ambientGlow};">
          <div class="card-media">
            <img src="${item.image}" alt="${item.title}" class="card-image" loading="lazy" />
            <div class="card-media-gradient"></div>
            <div class="card-scanline"></div>
          </div>
          
          <div class="card-frame-brackets">
            <span class="bracket-tl"></span>
            <span class="bracket-tr"></span>
            <span class="bracket-bl"></span>
            <span class="bracket-br"></span>
          </div>

          <div class="card-header-badge">
            <span class="badge-index">${(index + 1).toString().padStart(2, '0')}</span>
            <span class="badge-cat">${item.category}</span>
          </div>

          <div class="card-info">
            <div class="card-code">${item.code} // SAVELYA</div>
            <h3 class="card-title">${item.title}</h3>
            <p class="card-summary">${item.summary}</p>
            <div class="card-action-cue">
              <span class="cue-text">Detallarına bax</span>
              <svg class="cue-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>

          <div class="card-reflection"></div>
        </div>
      `;

      // Event listeners on card
      card.addEventListener('pointerenter', () => {
        sound.playHover();
      });

      card.addEventListener('click', (e) => {
        // Prevent opening if user was actively dragging
        if (Math.abs(this.pointerVelocity) > 0.4) return;
        if (this.onCardSelect) {
          this.onCardSelect(item, card);
        }
      });

      this.ring.appendChild(card);
      this.cards.push(card);
    });

    this.updateCardTransforms();
  }

  bindEvents() {
    // Window Resize
    window.addEventListener('resize', () => {
      this.computeDimensions();
      this.updateCardTransforms();
    });

    // Pointer Dragging (Mouse & Touch)
    const stage = this.container;
    let downX = 0;
    let downY = 0;
    let hasMoved = false;
    let downCard = null;

    stage.addEventListener('pointerdown', (e) => {
      if (this.isPausedForModal) return;
      downX = e.clientX;
      downY = e.clientY;
      hasMoved = false;
      downCard = e.target.closest('.carousel-card');

      this.startX = e.clientX;
      this.lastPointerX = e.clientX;
      this.lastPointerTime = performance.now();
      this.dragStartRotation = this.currentRotation;
      this.velocity = 0;
      this.pointerVelocity = 0;
    });

    stage.addEventListener('pointermove', (e) => {
      if (this.isPausedForModal) return;
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (!this.isDragging && dist > 6) {
        this.isDragging = true;
        hasMoved = true;
        stage.classList.add('is-dragging');
        try {
          stage.setPointerCapture(e.pointerId);
        } catch (_) {}
      }

      if (!this.isDragging) return;

      const now = performance.now();
      const deltaX = e.clientX - this.startX;
      const timeDelta = Math.max(1, now - this.lastPointerTime);

      // Sensitivity factor
      const dragSensitivity = window.innerWidth < 768 ? 0.35 : 0.26;
      this.targetRotation = this.dragStartRotation + deltaX * dragSensitivity;

      // Calculate instantaneous pointer velocity
      const instantDelta = e.clientX - this.lastPointerX;
      this.pointerVelocity = instantDelta / timeDelta;

      this.lastPointerX = e.clientX;
      this.lastPointerTime = now;

      sound.playTick();
    });

    const endDrag = (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        stage.classList.remove('is-dragging');
        try {
          stage.releasePointerCapture(e.pointerId);
        } catch (_) {}
        // Apply release momentum
        this.velocity = this.pointerVelocity * 14;
      } else if (!hasMoved && downCard) {
        // Clean tap/click without drag
        const cardIndex = parseInt(downCard.dataset.index, 10);
        if (!isNaN(cardIndex) && this.items[cardIndex] && this.onCardSelect) {
          this.onCardSelect(this.items[cardIndex], downCard);
        }
      }
      hasMoved = false;
      downCard = null;
    };

    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    // Mouse Wheel Rotation
    stage.addEventListener('wheel', (e) => {
      if (this.isPausedForModal) return;
      e.preventDefault();
      const wheelDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      const sensitivity = 0.08;
      this.velocity += -wheelDelta * sensitivity;
      sound.playTick();
    }, { passive: false });

    // Keyboard Navigation
    window.addEventListener('keydown', (e) => {
      if (this.isPausedForModal) return;
      if (e.key === 'ArrowRight') {
        this.step(-1);
      } else if (e.key === 'ArrowLeft') {
        this.step(1);
      }
    });

    // Auto-spin controls
    const spinToggleBtn = document.getElementById('btn-spin-toggle');
    if (spinToggleBtn) {
      spinToggleBtn.addEventListener('click', () => {
        this.isAutoSpinning = !this.isAutoSpinning;
        spinToggleBtn.classList.toggle('active', this.isAutoSpinning);
        const label = spinToggleBtn.querySelector('.btn-label');
        if (label) label.textContent = this.isAutoSpinning ? 'SPIN: ON' : 'SPIN: OFF';
        sound.playMechanicalClick();
      });
    }

    // Prev / Next HUD Buttons
    const hudPrev = document.getElementById('btn-hud-prev');
    const hudNext = document.getElementById('btn-hud-next');
    if (hudPrev) hudPrev.addEventListener('click', () => { this.step(1); sound.playMechanicalClick(); });
    if (hudNext) hudNext.addEventListener('click', () => { this.step(-1); sound.playMechanicalClick(); });

    // Layout Mode Buttons
    document.querySelectorAll('.layout-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode) {
          this.setLayoutMode(mode);
          document.querySelectorAll('.layout-mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          sound.playMechanicalClick();
        }
      });
    });

    // Responsive Window Resize Listener
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.computeDimensions();
        this.updateCardTransforms();
      }, 100);
    });
  }

  setLayoutMode(mode) {
    this.layoutMode = mode;
    this.updateCardTransforms();
  }

  step(direction) {
    const angleStep = 360 / this.items.length;
    this.targetRotation = Math.round((this.targetRotation + direction * angleStep) / angleStep) * angleStep;
    sound.playHover();
  }

  startLoop() {
    const loop = (now) => {
      const dt = Math.min(32, now - this.lastFrameTime) / 16.666;
      this.lastFrameTime = now;

      if (!this.isPausedForModal) {
        if (this.isDragging) {
          // Smooth spring interpolation while dragging
          this.currentRotation += (this.targetRotation - this.currentRotation) * 0.35 * dt;
        } else {
          // Apply momentum friction
          if (Math.abs(this.velocity) > 0.001) {
            this.currentRotation += this.velocity * dt;
            this.targetRotation = this.currentRotation;
            this.velocity *= Math.pow(0.92, dt); // friction decay
          } else {
            this.velocity = 0;
            // Free subtle auto-spin
            if (this.isAutoSpinning) {
              this.currentRotation += this.autoSpinSpeed * dt;
              this.targetRotation = this.currentRotation;
            }
          }
        }
      }

      this.updateCardTransforms();
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  updateCardTransforms() {
    if (!this.ring || !this.cards.length) return;

    const count = this.items.length;
    const angleStep = 360 / count;
    let closestIndex = 0;
    let minDistance = Infinity;

    this.cards.forEach((card, index) => {
      const baseAngle = index * angleStep;
      // Angle normalized to [-180, 180]
      const totalAngle = (baseAngle + this.currentRotation) % 360;
      const normalizedAngle = ((totalAngle + 540) % 360) - 180;
      const rad = (normalizedAngle * Math.PI) / 180;

      // Distance from camera front
      const absAngle = Math.abs(normalizedAngle);
      if (absAngle < minDistance) {
        minDistance = absAngle;
        closestIndex = index;
      }

      // Depth fade calculations
      const depthFactor = Math.cos(rad); // 1.0 at front, -1.0 at back
      const normDist = absAngle / 180;   // 0.0 at front, 1.0 at back

      // Mode-dependent transforms
      let transformStr = '';
      if (this.layoutMode === 'cylinder') {
        // True 3D cylinder
        transformStr = `rotateY(${baseAngle + this.currentRotation}deg) translateZ(${this.radius}px)`;
      } else if (this.layoutMode === 'convex') {
        // Curved convex arc
        const curveOffset = Math.sin(rad) * 40;
        transformStr = `rotateY(${(baseAngle + this.currentRotation) * 0.75}deg) translateZ(${this.radius * 0.9}px) rotateZ(${curveOffset * 0.1}deg)`;
      } else if (this.layoutMode === 'coverflow') {
        // CoverFlow style
        const sign = normalizedAngle > 0 ? -1 : 1;
        const tilt = Math.min(65, Math.abs(normalizedAngle) * 0.8) * sign;
        const xOffset = Math.sin(rad) * (this.radius * 0.85);
        const zOffset = Math.cos(rad) * this.radius - this.radius;
        transformStr = `translateX(${xOffset}px) translateZ(${zOffset}px) rotateY(${tilt}deg)`;
      }

      card.style.transform = transformStr;

      // Realistic Depth Opacity & Scale
      const opacity = Math.max(0.28, 1 - normDist * 0.75);
      const scale = Math.max(0.76, 1.04 - normDist * 0.32);
      const blur = normDist > 0.45 ? (normDist - 0.45) * 6 : 0;

      card.style.opacity = opacity;
      card.style.filter = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : 'none';
      card.style.zIndex = Math.round((depthFactor + 1) * 100);

      // Active state on closest card
      const isFront = absAngle < (angleStep / 2);
      card.classList.toggle('is-front', isFront);
    });

    // Update active index indicator in HUD
    const indicator = document.getElementById('carousel-counter-val');
    if (indicator) {
      indicator.textContent = `${(closestIndex + 1).toString().padStart(2, '0')} / ${count.toString().padStart(2, '0')}`;
    }
    const titleIndicator = document.getElementById('carousel-active-title');
    if (titleIndicator && this.items[closestIndex]) {
      titleIndicator.textContent = this.items[closestIndex].title;
    }
  }

  rotateToIndex(index) {
    const count = this.items.length;
    const angleStep = 360 / count;
    const targetAngle = -index * angleStep;

    // Shortest angular distance
    const currentNorm = this.currentRotation % 360;
    let diff = (targetAngle - currentNorm) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    this.targetRotation = this.currentRotation + diff;
    this.currentRotation = this.targetRotation;
    this.velocity = 0;
  }

  getAdjacentIndex(currentItem, direction) {
    const currentIndex = this.items.findIndex(it => it.id === currentItem.id);
    const count = this.items.length;
    return (currentIndex + direction + count) % count;
  }

  onModalOpen(item) {
    this.isPausedForModal = true;
    this.velocity = 0;
  }

  onModalClose() {
    this.isPausedForModal = false;
    this.lastFrameTime = performance.now();
  }
}
