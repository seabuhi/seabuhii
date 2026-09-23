/**
 * SƏBUHİ KHAZIMZADA — Main Application Entry Point
 * Lenis Smooth Scroll + Three.js 3D Universe + Magnetic Cursor + Audio Engine + Interactions
 */
import Lenis from 'lenis';
import { Universe } from './world.js';

class App {
  constructor() {
    this.init();
  }

  init() {
    // 1. Initialize Preloader
    this.runLoader(() => {
      document.body.classList.remove('loading');

      // 2. Initialize Three.js 3D Universe
      this.universe = new Universe();

      // 3. Initialize Lenis Smooth Momentum Scroll
      this.initSmoothScroll();

      // 4. Custom Magnetic Cursor
      this.initMagneticCursor();

      // 5. Interactive UI Features (NFC tap simulation, reactions, sound toggle)
      this.initInteractions();
    });
  }

  // ─── HIGH-PRECISION PRELOADER ───
  runLoader(onComplete) {
    const bar = document.getElementById('loader-bar');
    const val = document.getElementById('loader-val');
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 14) + 6;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        if (bar) bar.style.width = '100%';
        if (val) val.textContent = '100%';
        setTimeout(onComplete, 400);
      } else {
        if (bar) bar.style.width = `${progress}%`;
        if (val) val.textContent = `${progress}%`;
      }
    }, 60);
  }

  // ─── LENIS SMOOTH MOMENTUM SCROLL ───
  initSmoothScroll() {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.0,
    });

    const raf = (time) => {
      this.lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Sync scroll progress with 3D camera, animations and chapter navigator
    this.lenis.on('scroll', (e) => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? e.scroll / maxScroll : 0;
      if (this.universe) {
        this.universe.setScrollProgress(progress, e.velocity || 0);
      }
      this.updateChapterNav();
      this.updateSectionTransitions();
      this.updateScrollProgressLine(progress);
    });

    // Anchor smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId && targetId !== '#') {
          e.preventDefault();
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            this.lenis.scrollTo(targetEl, { offset: -60, duration: 1.4 });
          }
        }
      });
    });

    this.initShowcaseTilt();
    this.updateSectionTransitions();
  }

  // ─── HIGH-PRECISION SCROLL PROGRESS INDICATOR ───
  updateScrollProgressLine(progress) {
    const bar = document.getElementById('scroll-progress-line');
    if (bar) {
      bar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
    }
  }

  // ─── SCROLLSPY FOR CHAPTER NAVIGATOR ───
  updateChapterNav() {
    const sections = ['hero', 'work', 'messenger', 'fsf', 'azinet', 'nfc', 'about', 'contact'];
    const scrollY = window.scrollY + window.innerHeight * 0.4;
    let activeId = 'hero';

    for (const id of sections) {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) {
        activeId = id;
      }
    }

    document.querySelectorAll('.chapter-dot').forEach((dot) => {
      const href = dot.getAttribute('href');
      if (href === `#${activeId}`) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // ─── DYNAMIC 3D ZOOM-IN / ZOOM-OUT SECTION TRANSITIONS ("İçinə girmək" & "Çölə çıxmaq") ───
  updateSectionTransitions() {
    const vh = window.innerHeight;
    const isMobile = window.innerWidth < 768;
    const depthMul = isMobile ? 0.45 : 1.0;
    const scaleMul = isMobile ? 0.65 : 1.0;

    const projectSections = document.querySelectorAll('.project-section, .nfc-section, .about-section');

    projectSections.forEach((section, idx) => {
      const rect = section.getBoundingClientRect();
      const centerDist = rect.top + rect.height / 2 - vh / 2;
      // Normalized distance across viewport: -1.3 (passed to top) to +1.3 (approaching from bottom)
      const normDist = Math.max(-1.3, Math.min(1.3, centerDist / (vh * 0.75)));
      const absNorm = Math.abs(normDist);

      const grid = section.querySelector('.project-grid, .nfc-container, .about-container');
      const showcaseWindow = section.querySelector('.showcase-window');
      const showcaseImg = section.querySelector('.showcase-img');
      const bgFx = section.querySelector('.section-bg-fx');
      const tagWrap = section.querySelector('.project-tag-wrap');
      const chips = section.querySelectorAll('.bg-card-chip');

      if (!grid) return;

      // Pass click events cleanly to whichever section is currently focal
      section.style.pointerEvents = absNorm < 0.65 ? 'auto' : 'none';

      // ═══════════════════════════════════════════════════════════════
      // ALTERNATING 3D SECTION TRANSITIONS:
      // Even (0: Savelya, 2: FSF)  -> "İÇİNƏ GİRMƏK" (Deep Zoom-In Dive Through)
      // Odd  (1: Messenger, 3: AziNet) -> "ÇÖLƏ ÇIXMAQ" (Zoom-Out / Emerge from Core)
      // 4: NFC Showcase, 5: About
      // ═══════════════════════════════════════════════════════════════
      if (idx === 0 || idx === 2) {
        // ─── TYPE A: "İÇİNƏ GİRMƏK" (ZOOM-IN DIVE THROUGH) ───
        let scale, translateZ, translateY, rotX, opacity;

        if (normDist >= 0) {
          scale = 1 - normDist * (0.38 * scaleMul);
          translateZ = -normDist * (420 * depthMul);
          translateY = normDist * (isMobile ? 35 : 70);
          rotX = normDist * (isMobile ? 3 : 6);
          opacity = Math.max(0, 1 - Math.pow(normDist, 1.4) * 0.95);
        } else {
          // Diving right INTO the screen ("sanki içinə girirmiş kimi")
          scale = 1 + absNorm * (0.48 * scaleMul);
          translateZ = absNorm * (440 * depthMul);
          translateY = normDist * (isMobile ? 40 : 80);
          rotX = -absNorm * (isMobile ? 3 : 7);
          opacity = Math.max(0, 1 - Math.pow(absNorm, 1.3) * 1.1);
        }

        grid.style.transform = `perspective(1200px) translate3d(0, ${translateY}px, ${translateZ}px) scale3d(${scale}, ${scale}, 1) rotateX(${rotX}deg)`;
        grid.style.opacity = opacity;

        // Background visual expansion (warp speed portal effect)
        if (bgFx) {
          const bgScale = normDist < 0 ? 1 + absNorm * (0.35 * scaleMul) : 1 - normDist * (0.15 * scaleMul);
          bgFx.style.transform = `scale(${bgScale})`;
          bgFx.style.opacity = Math.max(0, 1 - absNorm * 0.9);
        }

        // Showcase window subtle forward tilt
        if (showcaseWindow && !isMobile) {
          const tiltX = normDist < 0 ? absNorm * -5 : normDist * 4;
          showcaseWindow.style.transform = `perspective(1000px) rotateX(${tiltX}deg)`;
        }

      } else if (idx === 1 || idx === 3) {
        // ─── TYPE B: "ÇÖLƏ ÇIXMAQ" (ZOOM-OUT / EMERGE FROM CORE) ───
        let scale, translateZ, translateY, rotY, opacity;

        if (normDist >= 0) {
          scale = 1 + normDist * (0.42 * scaleMul);
          translateZ = normDist * (380 * depthMul);
          translateY = normDist * (isMobile ? 40 : 80);
          rotY = normDist * (isMobile ? -4 : -8);
          opacity = Math.max(0, 1 - Math.pow(normDist, 1.4) * 0.95);
        } else {
          // Receding to exterior background
          scale = 1 - absNorm * (0.38 * scaleMul);
          translateZ = -absNorm * (420 * depthMul);
          translateY = normDist * (isMobile ? 35 : 70);
          rotY = absNorm * (isMobile ? 4 : 8);
          opacity = Math.max(0, 1 - Math.pow(absNorm, 1.3) * 1.1);
        }

        grid.style.transform = `perspective(1200px) translate3d(0, ${translateY}px, ${translateZ}px) scale3d(${scale}, ${scale}, 1) rotateY(${rotY}deg)`;
        grid.style.opacity = opacity;

        // Background contraction
        if (bgFx) {
          const bgScale = normDist < 0 ? 1 - absNorm * (0.25 * scaleMul) : 1 + normDist * (0.25 * scaleMul);
          bgFx.style.transform = `scale(${bgScale})`;
          bgFx.style.opacity = Math.max(0, 1 - absNorm * 0.9);
        }

        if (showcaseWindow && !isMobile) {
          const tiltY = normDist < 0 ? absNorm * 6 : normDist * -6;
          showcaseWindow.style.transform = `perspective(1000px) rotateY(${tiltY}deg)`;
        }

      } else if (idx === 4) {
        // ─── NFC SECTION: 3D VAULT EXPANSION ───
        const scale = 1 - normDist * (0.30 * scaleMul);
        const translateY = normDist * (isMobile ? 30 : 60);
        const translateZ = -normDist * (320 * depthMul);
        const opacity = Math.max(0, 1 - Math.pow(absNorm, 1.4) * 0.95);

        grid.style.transform = `perspective(1200px) translate3d(0, ${translateY}px, ${translateZ}px) scale3d(${scale}, ${scale}, 1)`;
        grid.style.opacity = opacity;

      } else {
        // ─── ABOUT / CONTACT: ELEVATION DOCK ───
        const scale = 1 - Math.min(0.2, absNorm * 0.15);
        const translateY = normDist * (isMobile ? 25 : 50);
        const opacity = Math.max(0, 1 - Math.pow(absNorm, 1.4) * 0.95);

        grid.style.transform = `perspective(1200px) translate3d(0, ${translateY}px, 0) scale3d(${scale}, ${scale}, 1)`;
        grid.style.opacity = opacity;
      }

      // ─── OPTICAL INNER IMAGE PARALLAX (Subtle counter-drift) ───
      if (showcaseImg) {
        const imgShiftY = normDist * (isMobile ? -18 : -34);
        showcaseImg.style.transform = `translate3d(0, ${imgShiftY}px, 0) scale(1.06)`;
      }

      // ─── KINETIC TAGLINE & TELEMETRY CHIPS DRIFT ───
      if (tagWrap && !isMobile) {
        tagWrap.style.transform = `translate3d(0, ${normDist * 16}px, 0)`;
      }
      if (!isMobile) {
        chips.forEach((chip, cIdx) => {
          const factor = (cIdx % 2 === 0 ? 1 : -1) * 22;
          chip.style.transform = `translate3d(0, ${normDist * factor}px, 0)`;
        });
      }
    });
  }

  // ─── 3D PERSPECTIVE TILT ON SHOWCASE WINDOWS ───
  initShowcaseTilt() {
    if (window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.showcase-window').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotX = -(y / (rect.height / 2)) * 6;
        const rotY = (x / (rect.width / 2)) * 6;
        card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ─── MAGNETIC INTERACTION CURSOR ───
  initMagneticCursor() {
    const cursor = document.getElementById('cursor');
    if (!cursor || window.matchMedia('(hover: none)').matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    const renderCursor = () => {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    // Magnetic buttons effect
    document.querySelectorAll('.magnetic').forEach((elem) => {
      const strength = parseFloat(elem.dataset.strength) || 20;

      elem.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
      });

      elem.addEventListener('mousemove', (e) => {
        const rect = elem.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) / (rect.width / 2);
        const deltaY = (e.clientY - centerY) / (rect.height / 2);

        elem.style.transform = `translate3d(${deltaX * strength}px, ${deltaY * strength}px, 0)`;
      });

      elem.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
        elem.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  // ─── INTERACTIVE EXPERIENCES & AUDIO ───
  initInteractions() {
    // 1. NFC Tap Simulation Button
    const tapBtn = document.getElementById('tap-simulate-btn');
    if (tapBtn) {
      tapBtn.addEventListener('click', () => {
        if (this.universe) {
          this.universe.triggerNfcTapSimulation();
        }
      });
    }

    // 2. Campus Reaction Hearts Counter
    const reactBtn = document.querySelector('.reaction-btn');
    if (reactBtn) {
      reactBtn.addEventListener('click', () => {
        let count = parseInt(reactBtn.dataset.count, 10);
        count++;
        reactBtn.dataset.count = count;
        reactBtn.querySelector('span').textContent = count;
        reactBtn.style.transform = 'scale(1.2)';
        setTimeout(() => { reactBtn.style.transform = 'scale(1)'; }, 150);
      });
    }

    // 3. Audio Ambient Drone Toggle (Generative Web Audio)
    const soundBtn = document.getElementById('sound-btn');
    const soundLabel = document.getElementById('sound-label');
    let audioCtx = null;
    let isPlaying = false;
    let gainNode = null;

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        if (!audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AudioContext();

          // Sub drone oscillator
          const osc1 = audioCtx.createOscillator();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(65.41, audioCtx.currentTime); // C2

          // Shimmer harmonic oscillator
          const osc2 = audioCtx.createOscillator();
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(130.81, audioCtx.currentTime); // C3

          gainNode = audioCtx.createGain();
          gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);

          const filter = audioCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, audioCtx.currentTime);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          osc1.start();
          osc2.start();
        }

        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        isPlaying = !isPlaying;
        if (isPlaying) {
          gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 1.2);
          soundBtn.classList.add('playing');
          if (soundLabel) soundLabel.textContent = 'SOUND [ON]';
        } else {
          gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
          soundBtn.classList.remove('playing');
          if (soundLabel) soundLabel.textContent = 'SOUND [OFF]';
        }
      });
    }
  }
}

new App();
