/**
 * SAVELYA × LUSION // MAIN APPLICATION CONTROLLER
 * Orchestrates WebGL 3D World, Web Audio Synthesizer, Magnetic Cursor,
 * Interactive Hardware-to-Software Bridge & Billboard Poster Modal
 */

import { LusionWorld } from './lusion-world.js';
import { LusionModelViewer } from './lusion-model-viewer.js';
import Lenis from 'lenis';

/* ─────────────────────────────────────────────────────────────
   1. HIGH-TECH WEB AUDIO SYNTHESIZER (No external audio files)
   ───────────────────────────────────────────────────────────── */
class CyberAudioEngine {
  constructor() {
    this.ctx = null;
    this.isEnabled = false;
    this.ambientGain = null;
    this.ambientOsc = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.initContext();
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) {
      this.startAmbient();
      this.playChime(640, 'triangle', 0.15);
    } else {
      this.stopAmbient();
    }
    return this.isEnabled;
  }

  startAmbient() {
    if (!this.ctx || this.ambientOsc) return;
    try {
      const now = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.015, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);

      this.ambientOsc = this.ctx.createOscillator();
      this.ambientOsc.type = 'sawtooth';
      this.ambientOsc.frequency.setValueAtTime(55, now); // Low A1 note

      this.ambientOsc.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      this.ambientOsc.start();
    } catch (e) {
      console.warn('Ambient audio init failed:', e);
    }
  }

  stopAmbient() {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
      } catch (e) {}
      this.ambientOsc = null;
    }
  }

  playHover() {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  playClick() {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playChime(baseFreq = 520, waveType = 'sine', duration = 0.25) {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = waveType;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + duration);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }
}

/* ─────────────────────────────────────────────────────────────
   2. MAGNETIC INTERACTIVE CURSOR
   ───────────────────────────────────────────────────────────── */
class LusionCursor {
  constructor() {
    this.cursor = document.getElementById('lusion-cursor');
    if (!this.cursor) return;

    this.label = this.cursor.querySelector('.cursor-label');
    this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.mouse = { x: this.pos.x, y: this.pos.y };

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // Detect interactable elements
    document.querySelectorAll('a, button, .lusion-card, .interactive-pin, .hud-mode-btn, .billboard-poster-container').forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor.classList.add('is-hovering');

        if (el.classList.contains('sw-card') || el.dataset.mode === 'software') {
          this.cursor.classList.add('is-software');
        } else {
          this.cursor.classList.remove('is-software');
        }

        const labelText = el.dataset.cursor || 'KƏŞF ET';
        if (this.label) this.label.textContent = labelText;
      });

      el.addEventListener('mouseleave', () => {
        this.cursor.classList.remove('is-hovering', 'is-software');
        if (this.label) this.label.textContent = '';
      });
    });
  }

  render() {
    this.pos.x += (this.mouse.x - this.pos.x) * 0.22;
    this.pos.y += (this.mouse.y - this.pos.y) * 0.22;

    if (this.cursor) {
      this.cursor.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;
    }
    requestAnimationFrame(() => this.render());
  }
}

/* ─────────────────────────────────────────────────────────────
   3. APP CONTROLLER
   ───────────────────────────────────────────────────────────── */
class LusionApp {
  constructor() {
    this.audio = new CyberAudioEngine();
    this.world = null;
    this.cursor = null;
    this.packetCount = 142850;

    this.init();
  }

  init() {
    // 1. Initialize Lenis Smooth Scroll
    try {
      this.lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
      });

      const raf = (time) => {
        this.lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    } catch (e) {
      console.warn('Lenis scroll fallback:', e);
    }

    // 2. Initialize 3D Real-time WebGL World (Living Earth.glb background)
    this.world = new LusionWorld('lusion-canvas-container');

    // 3. Initialize 3D GLB Hardware Model Inspector for Billboard Poster
    this.modelViewer = new LusionModelViewer('poster-3d-viewport');

    // 4. Initialize Magnetic Cursor
    this.cursor = new LusionCursor();

    // 5. Bind UI Controls & Audio
    this.setupUI();

    // 6. Setup Interactive Circuit Pins
    this.setupCircuitPins();

    // 7. Setup Hardware-to-Software Bridge Simulator
    this.setupBridgeSimulator();

    // 8. Setup Modals
    this.setupModals();

    // 9. Setup Smooth Navigation
    this.setupSmoothNav();
  }

  setupUI() {
    // Audio Toggle in Navbar
    const audioBtn = document.getElementById('nav-sound-toggle');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const active = this.audio.toggle();
        audioBtn.classList.toggle('active', active);
        const label = audioBtn.querySelector('.tool-label');
        if (label) {
          label.textContent = active ? 'SƏS [AÇIQ]' : 'SƏS [BAĞLI]';
        }
      });
    }

    // 3D HUD Mode Switcher
    const modeButtons = document.querySelectorAll('.hud-mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (this.world) {
          this.world.setMode(mode);
        }
        this.audio.playChime(mode === 'hardware' ? 580 : mode === 'software' ? 760 : 660);
      });
    });

    // Sound effects on buttons
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => this.audio.playHover());
      el.addEventListener('click', () => this.audio.playClick());
    });
  }

  setupCircuitPins() {
    const pinDetails = {
      processor: {
        title: 'SAV-X1 NEURAL ACCELERATOR // CORE',
        desc: '64-bit çoxnüvəli kənar süni intellekt çipi. 12 TOPS hesablama gücü, aparat səviyyəsində AES-256 şifrələmə.',
      },
      optical: {
        title: 'FIBER-OPTICAL ULTRA-BUS // 40 Gbps',
        desc: 'Sənaye sensorlarından sıfır gecikmə ilə məlumat toplayan diferensial optik magistral kanal.',
      },
      ram: {
        title: 'LPDDR5 HARDENED MEMORY // 32 GB',
        desc: 'Sənaye diapazonunda (-40°C ... +105°C) işləyən yüksək bant genişliyinə malik qorunan yaddaş bankı.',
      },
      power: {
        title: 'DYNAMIC SMART VRM // 99.4% EFFICIENCY',
        desc: 'Avtonom enerji idarəetməsi, 3.3V / 5V / 24V sənaye relsləri və həddindən artıq gərginlikdən qorunma.',
      }
    };

    const hudSpecsBox = document.getElementById('poster-specs-display');

    document.querySelectorAll('.interactive-pin').forEach(pin => {
      pin.addEventListener('click', () => {
        const pinType = pin.dataset.pin;
        const info = pinDetails[pinType];
        if (info && hudSpecsBox) {
          const titleEl = hudSpecsBox.querySelector('.holo-spec-title span:first-child');
          const descEl = hudSpecsBox.querySelector('.holo-spec-desc');
          if (titleEl) titleEl.textContent = info.title;
          if (descEl) descEl.textContent = info.desc;

          hudSpecsBox.style.borderColor = 'var(--hw-orange)';
          this.audio.playChime(820, 'sine', 0.2);
          if (this.world) this.world.triggerShockwave();
        }
      });
    });
  }

  setupBridgeSimulator() {
    const transmitBtn = document.getElementById('btn-transmit-pulse');
    const nodes = [
      document.getElementById('sim-node-hw'),
      document.getElementById('sim-node-fw'),
      document.getElementById('sim-node-edge'),
      document.getElementById('sim-node-cloud'),
    ];
    const arrows = document.querySelectorAll('.sim-arrow-pulse');
    const packetCounter = document.getElementById('telemetry-packet-count');
    const latencyVal = document.getElementById('telemetry-latency-val');

    if (!transmitBtn) return;

    transmitBtn.addEventListener('click', () => {
      transmitBtn.disabled = true;
      this.audio.playChime(440, 'triangle', 0.35);

      // Sequence animation across 4 layers
      let step = 0;
      const interval = setInterval(() => {
        // Reset previous
        nodes.forEach(n => {
          if (n) n.classList.remove('active-pulse', 'active-pulse-sw');
        });
        arrows.forEach(a => a.classList.remove('animating'));

        if (step < nodes.length) {
          const isSoftware = step >= 2;
          if (nodes[step]) {
            nodes[step].classList.add(isSoftware ? 'active-pulse-sw' : 'active-pulse');
          }
          if (step > 0 && arrows[step - 1]) {
            arrows[step - 1].classList.add('animating');
          }
          this.audio.playChime(500 + step * 160, 'sine', 0.15);
          step++;
        } else {
          clearInterval(interval);
          nodes.forEach(n => {
            if (n) n.classList.remove('active-pulse', 'active-pulse-sw');
          });
          arrows.forEach(a => a.classList.remove('animating'));

          // Update telemetry counters
          this.packetCount += Math.floor(Math.random() * 25) + 12;
          if (packetCounter) packetCounter.textContent = this.packetCount.toLocaleString();
          if (latencyVal) {
            const randomLatency = (Math.random() * 0.4 + 0.8).toFixed(2);
            latencyVal.textContent = `${randomLatency} ms`;
          }

          if (this.world) this.world.triggerShockwave();
          this.showToast('Kvant Məlumat Paketi Uğurla Çatdırıldı: HW → CLOUD (0.9ms)');
          transmitBtn.disabled = false;
        }
      }, 350);
    });
  }

  setupModals() {
    // 1. Poster Modal
    const openPosterBtns = document.querySelectorAll('.open-poster-modal');
    const posterModal = document.getElementById('poster-modal-overlay');
    const closePosterBtn = document.getElementById('close-poster-modal');
    const printPosterBtn = document.getElementById('btn-print-poster');

    openPosterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (posterModal) posterModal.classList.add('active');
        this.audio.playChime(620);
      });
    });

    if (closePosterBtn && posterModal) {
      closePosterBtn.addEventListener('click', () => {
        posterModal.classList.remove('active');
      });
    }

    if (printPosterBtn) {
      printPosterBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // 2. Inquiry Modal
    const openInquiryBtns = document.querySelectorAll('.open-inquiry-modal');
    const inquiryModal = document.getElementById('inquiry-modal-overlay');
    const closeInquiryBtn = document.getElementById('close-inquiry-modal');
    const inquiryForm = document.getElementById('inquiry-form');

    openInquiryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (inquiryModal) inquiryModal.classList.add('active');
        this.audio.playChime(680);
      });
    });

    if (closeInquiryBtn && inquiryModal) {
      closeInquiryBtn.addEventListener('click', () => {
        inquiryModal.classList.remove('active');
      });
    }

    if (inquiryForm) {
      inquiryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (inquiryModal) inquiryModal.classList.remove('active');
        this.showToast('Müraciətiniz qeydə alındı! Mühəndislərimiz tezliklə əlaqə saxlayacaq.');
        this.audio.playChime(880, 'sine', 0.4);
        inquiryForm.reset();
      });
    }

    // Close on overlay background click or Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (posterModal) posterModal.classList.remove('active');
        if (inquiryModal) inquiryModal.classList.remove('active');
      }
    });

    [posterModal, inquiryModal].forEach(overlay => {
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            overlay.classList.remove('active');
          }
        });
      }
    });
  }

  setupSmoothNav() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId && targetId !== '#') {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  showToast(message) {
    let toast = document.getElementById('lusion-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'lusion-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
}

// Boot application
window.addEventListener('DOMContentLoaded', () => {
  window.lusionApp = new LusionApp();
});
