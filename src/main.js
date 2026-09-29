/**
 * SAVELYA & SƏBUHİ // CORE APPLICATION ENTRY POINT
 * Initializes 3D Circular Carousel, Quantum Transition Engine, Audio & Magnetic Cursor
 */

import { CircularCarousel } from './components/circularCarousel.js';
import { TransitionEngine } from './components/transitionEngine.js';
import { CyberCursor } from './components/cursor.js';
import { sound } from './components/audioEngine.js';

class SavelyaApp {
  constructor() {
    this.init();
  }

  init() {
    // 1. Initialize Magnetic Cyber Cursor
    this.cursor = new CyberCursor();

    // 2. Initialize Transition Engine placeholder
    this.transitionEngine = null;

    // 3. Initialize 3D Circular Carousel
    this.carousel = new CircularCarousel('carousel-stage-viewport', (item, cardEl) => {
      if (this.transitionEngine) {
        this.transitionEngine.open(item, cardEl);
      }
    });

    // 4. Initialize Transition Engine with carousel reference
    this.transitionEngine = new TransitionEngine(this.carousel);

    // 5. Setup UI & Audio Controls
    this.initUIControls();

    // 6. Smooth Scroll for Nav Links
    this.initSmoothNav();

    // 7. Remove Preloader
    this.hideLoader();
  }

  initUIControls() {
    // Sound Toggle in Navbar
    const soundToggle = document.getElementById('nav-sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        const isEnabled = sound.toggle();
        soundToggle.classList.toggle('active', isEnabled);
        const label = soundToggle.querySelector('.tool-label');
        if (label) {
          label.textContent = isEnabled ? 'SƏS [AÇIQ]' : 'SƏS [BAĞLI]';
        }
      });
    }

    // Fullscreen Toggle
    const fsToggle = document.getElementById('nav-fs-toggle');
    if (fsToggle) {
      fsToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          fsToggle.classList.add('active');
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
          fsToggle.classList.remove('active');
        }
        sound.playHover();
      });
    }
  }

  initSmoothNav() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId && targetId !== '#') {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
            sound.playHover();
          }
        }
      });
    });
  }

  hideLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
        setTimeout(() => {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 500);
      }, 300);
    }
  }
}

// Boot application
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SavelyaApp();
});
