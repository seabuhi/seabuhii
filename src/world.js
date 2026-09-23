/**
 * SƏBUHİ KHAZIMZADA — Creative Developer 3D Experience
 * Interactive 3D NFC Smart Card (Draggable), Fluid Particle Field, Kinetic Project Worlds,
 * Real-time Holographic Shimmer, and Web Audio Haptics.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ═══════════════════════════════════════════════════════
// HOLOGRAPHIC RAINBOW SHIMMER SHADER (For Physical NFC Card)
// ═══════════════════════════════════════════════════════
const HolographicShimmerShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uTilt: { value: new THREE.Vector2(0, 0) },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uTilt;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    vec3 spectral(float t) {
      return 0.5 + 0.5 * cos(6.28318 * (vec3(1.0, 1.0, 1.0) * t + vec3(0.0, 0.33, 0.67)));
    }
    
    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // Fresnel edge glow
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
      
      // Rainbow shimmer based on view angle and mouse tilt
      float angle = dot(normal, viewDir) * 2.5 + (vUv.x + vUv.y) * 1.5 + uTilt.x * 2.0 + uTime * 0.25;
      vec3 rainbow = spectral(angle) * 0.45;
      
      // Specular glare glint
      vec3 lightDir = normalize(vec3(uTilt.x * 2.0 + 0.5, uTilt.y * 2.0 + 1.0, 1.2));
      vec3 halfDir = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfDir), 0.0), 40.0);
      
      vec3 color = tex.rgb + rainbow * (fresnel + 0.1) + vec3(1.0, 0.95, 0.85) * spec * 0.7;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

// ═══════════════════════════════════════════════════════
// POST-PROCESSING CHROMATIC LENS SHADER
// ═══════════════════════════════════════════════════════
const CinematicLensShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    
    void main() {
      gl_FragColor = texture2D(tDiffuse, vUv);
    }
  `,
};

// ═══════════════════════════════════════════════════════
// HELPER: PROCEDURAL 2K FRONT TEXTURE FOR PHYSICAL NFC CARD
// ═══════════════════════════════════════════════════════
function generateNfcCardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1294; // ISO-7810 ID-1 standard aspect ratio
  const ctx = canvas.getContext('2d');

  // Deep matte black titanium gradient
  const grad = ctx.createLinearGradient(0, 0, 2048, 1294);
  grad.addColorStop(0, '#101217');
  grad.addColorStop(0.5, '#181b22');
  grad.addColorStop(1, '#0b0c10');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 1294);

  // Subtle brushed metal horizontal lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.028)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 1294; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(2048, y);
    ctx.stroke();
  }

  // Gold Laser-Etched Outer Hairline Border
  ctx.strokeStyle = 'rgba(255, 210, 105, 0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 50, 1948, 1194);

  // Gold EMV Smart Microchip
  const chipX = 220, chipY = 460, chipW = 300, chipH = 240;
  const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
  chipGrad.addColorStop(0, '#e5b85a');
  chipGrad.addColorStop(0.5, '#fff0a8');
  chipGrad.addColorStop(1, '#ab7c25');
  ctx.fillStyle = chipGrad;
  ctx.beginPath();
  ctx.roundRect(chipX, chipY, chipW, chipH, 24);
  ctx.fill();

  ctx.strokeStyle = '#3a2404';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(chipX + chipW * 0.5, chipY);
  ctx.lineTo(chipX + chipW * 0.5, chipY + chipH);
  ctx.moveTo(chipX, chipY + chipH * 0.5);
  ctx.lineTo(chipX + chipW, chipY + chipH * 0.5);
  ctx.stroke();

  // Contactless RFID Wave Rings
  ctx.strokeStyle = '#ffd269';
  ctx.lineWidth = 6;
  for (let r = 1; r <= 3; r++) {
    ctx.beginPath();
    ctx.arc(620, 580, r * 32, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();
  }

  // Name Typography (Laser Gold Embossed in Inter)
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 86px "Inter", sans-serif';
  ctx.fillText('SƏBUHI KHAZIMZADA', 220, 930);

  ctx.fillStyle = '#ffd269';
  ctx.font = '600 36px "JetBrains Mono", monospace';
  ctx.fillText('FOUNDER · CREATIVE ENGINEER · ARCHITECT', 220, 1000);

  // Micro Labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 32px "JetBrains Mono", monospace';
  ctx.fillText('NFC SMART KEYCARD // ID: 8842-AZ', 220, 180);

  ctx.textAlign = 'right';
  ctx.fillText('13.56 MHz RFID · HARDWARE SECURE', 1848, 180);
  ctx.fillStyle = 'rgba(255, 210, 105, 0.95)';
  ctx.fillText('SEABUHI.COM · TAP TO EXPLORE', 1848, 1140);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

// ═══════════════════════════════════════════════════════
// HELPER: PROCEDURAL 2K BACK TEXTURE FOR PHYSICAL NFC CARD
// ═══════════════════════════════════════════════════════
function generateNfcCardBackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1294;
  const ctx = canvas.getContext('2d');

  // Deep matte black titanium base
  const grad = ctx.createLinearGradient(0, 0, 2048, 1294);
  grad.addColorStop(0, '#0e1015');
  grad.addColorStop(0.5, '#15181f');
  grad.addColorStop(1, '#090a0d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 1294);

  // Brushed hairline texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 1294; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(2048, y);
    ctx.stroke();
  }

  // Obsidian Magnetic Stripe
  ctx.fillStyle = '#050608';
  ctx.fillRect(0, 150, 2048, 220);

  // Magnetic stripe gloss lines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.fillRect(0, 150, 2048, 30);
  ctx.fillRect(0, 340, 2048, 30);

  // Signature White/Silver Strip
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(180, 480, 1250, 130);
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(180, 480, 1250, 130);

  // Cursive Laser Signature
  ctx.fillStyle = '#0f172a';
  ctx.font = 'italic 500 52px "Inter", sans-serif';
  ctx.fillText('S. Khazimzada', 240, 565);

  // CVC Security Code Box
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(1450, 480, 260, 130);
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 46px "JetBrains Mono", monospace';
  ctx.fillText('842', 1510, 565);

  // Hologram Security Stamp (Circular Diffractive Seal)
  const holoX = 320, holoY = 880, holoR = 120;
  const holoGrad = ctx.createRadialGradient(holoX, holoY, 10, holoX, holoY, holoR);
  holoGrad.addColorStop(0, '#ffd269');
  holoGrad.addColorStop(0.3, '#38bdf8');
  holoGrad.addColorStop(0.6, '#ec4899');
  holoGrad.addColorStop(1, '#a855f7');
  ctx.fillStyle = holoGrad;
  ctx.beginPath();
  ctx.arc(holoX, holoY, holoR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 24px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SECURE', holoX, holoY - 10);
  ctx.fillText('NFC RFID', holoX, holoY + 22);

  // QR Protocol Simulation Box
  const qrX = 1580, qrY = 760, qrSize = 240;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX, qrY, qrSize, qrSize);
  ctx.fillStyle = '#0f172a';
  // Procedural QR pattern blocks
  const cell = 15;
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      if ((r + c * 3) % 2 === 0 || (r < 4 && c < 4) || (r > 11 && c < 4) || (r < 4 && c > 11)) {
        ctx.fillRect(qrX + c * cell, qrY + r * cell, cell, cell);
      }
    }
  }

  // Micro Legal and Technical Spec Lines
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 28px "JetBrains Mono", monospace';
  ctx.fillText('TYPE: ISO/IEC 14443-A · NTAG216 CRYPTO ENGINE', 500, 780);
  ctx.fillText('SERIAL: 2026-AZ-8842-SEABUHI // BAKU, AZERBAIJAN', 500, 840);
  ctx.fillText('ALL RIGHTS RESERVED · AUTHORIZED KEYCARD ONLY', 500, 900);

  ctx.fillStyle = 'rgba(255, 210, 105, 0.8)';
  ctx.fillText('HTTPS://SEABUHI.COM // TAP TO CONNECT', 500, 960);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

// ═══════════════════════════════════════════════════════
// IGLOO-GRADE 3D SCROLL CHOREOGRAPHY KEYFRAMES
// ═══════════════════════════════════════════════════════
const CARD_KEYFRAMES = [
  // 0: HERO (p: 0.0)
  // Stationed proudly on the right side of hero headline
  {
    p: 0.0,
    pos: [3.1, 0.15, 0.0],
    rot: [0.22, -0.42, 0.08],
    scale: 1.0,
  },
  // 1: TRANSITION HERO -> SAVELYA (p: 0.14)
  // Dips down, swooping across center with smooth aerodynamic bank
  {
    p: 0.14,
    pos: [0.5, -0.6, -0.6],
    rot: [0.35, -0.15, -0.22],
    scale: 0.95,
  },
  // 2: SAVELYA (Escrow Logistics, p: 0.28)
  // Text left, Mockup right -> Card swoops to left/behind, tilted showing gold escrow chip
  {
    p: 0.28,
    pos: [-3.3, -0.2, -0.8],
    rot: [-0.15, 0.75, -0.14],
    scale: 0.92,
  },
  // 3: TRANSITION SAVELYA -> MESSENGER (p: 0.40)
  // Flips smoothly across center, banking 3D in mid-flight
  {
    p: 0.40,
    pos: [0.0, 0.5, -0.4],
    rot: [0.25, 0.0, 0.3],
    scale: 0.90,
  },
  // 4: OFFLINE MESSENGER (P2P BLE Mesh, p: 0.50)
  // Mockup left, Text right -> Card banks to right, pitched upward like an RF transponder
  {
    p: 0.50,
    pos: [3.4, 0.2, -0.6],
    rot: [0.38, -0.68, 0.22],
    scale: 0.92,
  },
  // 5: TRANSITION MESSENGER -> FSF AVIATION (p: 0.60)
  // High-speed aerodynamic bank dive
  {
    p: 0.60,
    pos: [0.4, -0.4, -0.5],
    rot: [-0.3, 0.1, -0.38],
    scale: 0.90,
  },
  // 6: FSF AVIATION (Supersonic Delta Flight, p: 0.68)
  // Text left, Mockup right -> Card banks sharply to left like a delta jet wing
  {
    p: 0.68,
    pos: [-3.4, 0.1, -0.6],
    rot: [-0.32, 0.65, -0.36],
    scale: 0.94,
  },
  // 7: AZINET ADNSU (Campus Hub, p: 0.80)
  // Mockup left, Text right -> Card glides to right, poised and balanced
  {
    p: 0.80,
    pos: [3.2, 0.05, -0.7],
    rot: [0.16, -0.42, 0.1],
    scale: 0.92,
  },
  // 8: NFC INTERACTIVE STUDIO (Center stage! p: 0.90)
  // Front and center, enlarged, ready for 360 inspection & tap haptic
  {
    p: 0.90,
    pos: [0.0, 0.25, 2.2],
    rot: [0.04, -0.05, 0.0],
    scale: 1.34,
  },
  // 9: ABOUT & CONTACT (Closing executive stance, p: 1.0)
  {
    p: 1.0,
    pos: [3.0, -0.4, -0.9],
    rot: [0.18, -0.32, 0.06],
    scale: 0.88,
  },
];

function getCardKeyframeState(p) {
  const clamped = Math.max(0, Math.min(1, p));
  let i = 0;
  while (i < CARD_KEYFRAMES.length - 1 && CARD_KEYFRAMES[i + 1].p < clamped) {
    i++;
  }
  const k0 = CARD_KEYFRAMES[i];
  const k1 = CARD_KEYFRAMES[Math.min(i + 1, CARD_KEYFRAMES.length - 1)];

  if (k0 === k1 || k1.p === k0.p) {
    return {
      pos: [...k0.pos],
      rot: [...k0.rot],
      scale: k0.scale,
    };
  }

  // Smooth Hermite cubic interpolation
  const linearT = (clamped - k0.p) / (k1.p - k0.p);
  const t = linearT * linearT * (3 - 2 * linearT);

  return {
    pos: [
      k0.pos[0] + (k1.pos[0] - k0.pos[0]) * t,
      k0.pos[1] + (k1.pos[1] - k0.pos[1]) * t,
      k0.pos[2] + (k1.pos[2] - k0.pos[2]) * t,
    ],
    rot: [
      k0.rot[0] + (k1.rot[0] - k0.rot[0]) * t,
      k0.rot[1] + (k1.rot[1] - k0.rot[1]) * t,
      k0.rot[2] + (k1.rot[2] - k0.rot[2]) * t,
    ],
    scale: k0.scale + (k1.scale - k0.scale) * t,
  };
}

// ═══════════════════════════════════════════════════════
// MAIN APPLICATION UNIVERSE
// ═══════════════════════════════════════════════════════
export class Universe {
  constructor() {
    this.canvas = document.getElementById('webgl');
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, isDragging: false, dragStart: { x: 0, y: 0 }, rot: { x: 0, y: 0 } };
    this.scrollProgress = 0;
    this.smoothScroll = 0;
    this.velocity = 0;
    this.smoothVelocity = 0;
    this.time = 0;
    this.disposed = false;

    this.init();
  }

  init() {
    // 1. WebGL Renderer with Transparent Canvas
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0); // 100% transparent background
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 2. Scene
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = null;

    // 3. Camera (Cinematic FOV: 38deg desktop, 52deg mobile)
    const isMobile = window.innerWidth < 768;
    this.camera = new THREE.PerspectiveCamera(isMobile ? 52 : 38, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.set(0, 0, isMobile ? 15.5 : 14);

    // 4. Studio Lighting
    this.buildLighting();

    // 5. Interactive Fluid Particle Field
    this.buildFluidParticleField();

    // 6. Interactive 3D Physical NFC Smart Card (Persistent 3D Hero Artifact)
    this.buildInteractiveNfcCard();

    // 7. Bind Events
    this.bindEvents();

    // 8. Start Master Animation Loop
    this.animate();
  }

  // ─── PROFESSIONAL STUDIO LIGHTING ───
  buildLighting() {
    // Natural daylight ambient fill
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    // Directional Studio Key Light
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.keyLight.position.set(10, 16, 12);
    this.scene.add(this.keyLight);

    // Subtle Cool Rim Light
    this.rimLight = new THREE.DirectionalLight(0xdce5f0, 0.6);
    this.rimLight.position.set(-12, 8, -6);
    this.scene.add(this.rimLight);

    // Warm Gold Bounce Light
    this.bottomLight = new THREE.DirectionalLight(0xb47814, 0.4);
    this.bottomLight.position.set(0, -10, -8);
    this.scene.add(this.bottomLight);

    // Dynamic Cursor Follow Light
    this.cursorLight = new THREE.PointLight(0xfff5e6, 0.6, 12);
    this.cursorLight.position.set(0, 0, 6);
    this.scene.add(this.cursorLight);
  }

  // ─── ELEGANT AMBIENT DUST PARTICLES ───
  buildFluidParticleField() {
    const count = 350;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    const palette = [
      new THREE.Color(0xb47814), // Muted Gold
      new THREE.Color(0x94a3b8), // Platinum Slate
      new THREE.Color(0x64748b), // Deep Slate
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      velocities[i * 3] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    this.particleVelocities = velocities;
    this.scene.add(this.particles);
  }

  // ─── PERSISTENT 3D PHYSICAL NFC SMART CARD ───
  buildInteractiveNfcCard() {
    this.cardContainer = new THREE.Group();
    this.cardContainer.position.set(3.1, 0.15, 0);

    const cardGeo = new THREE.BoxGeometry(4.28, 2.7, 0.09);
    const frontTex = generateNfcCardTexture();
    const backTex = generateNfcCardBackTexture();

    // Front Holographic Shimmer Material
    this.frontMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: frontTex },
        uTime: { value: 0 },
        uTilt: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: HolographicShimmerShader.vertexShader,
      fragmentShader: HolographicShimmerShader.fragmentShader,
    });

    // Back Holographic Shimmer Material
    this.backMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: backTex },
        uTime: { value: 0 },
        uTilt: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: HolographicShimmerShader.vertexShader,
      fragmentShader: HolographicShimmerShader.fragmentShader,
    });

    // Golden Laser Edge Bevel Material
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0xffd269,
      metalness: 0.98,
      roughness: 0.12,
      emissive: 0xd4a04a,
      emissiveIntensity: 0.35,
    });

    // Materials order: +X, -X, +Y, -Y, +Z (Front), -Z (Back)
    const mats = [edgeMat, edgeMat, edgeMat, edgeMat, this.frontMaterial, this.backMaterial];

    this.nfcCardMesh = new THREE.Mesh(cardGeo, mats);
    this.nfcCardMesh.castShadow = true;
    this.nfcCardMesh.rotation.y = -Math.PI * 0.12;
    this.nfcCardMesh.rotation.x = Math.PI * 0.08;
    this.cardContainer.add(this.nfcCardMesh);

    // Expanding Tap Simulation Golden Ring
    this.tapRipple = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.65, 64),
      new THREE.MeshBasicMaterial({ color: 0xffd269, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    this.tapRipple.position.z = 0.12;
    this.cardContainer.add(this.tapRipple);

    this.scene.add(this.cardContainer);
  }

  // ─── INTERACTION: NFC TAP SIMULATION ───
  triggerNfcTapSimulation() {
    if (!this.cardContainer) return;

    // 1. Audio Haptic Beep
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // Chirp up
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (_) {}

    // 2. Visual Golden Wave Ripple
    this.tapRipple.scale.set(1, 1, 1);
    this.tapRipple.material.opacity = 1;
    let t = 0;
    const anim = () => {
      t += 0.045;
      this.tapRipple.scale.setScalar(1 + t * 4.5);
      this.tapRipple.material.opacity = Math.max(0, 1 - t);
      if (t < 1) requestAnimationFrame(anim);
    };
    anim();
  }

  // ─── EVENT HANDLERS (Drag to rotate card & cursor tracking) ───
  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;

      // Handle card dragging rotation
      if (this.mouse.isDragging) {
        const deltaX = e.clientX - this.mouse.dragStart.x;
        const deltaY = e.clientY - this.mouse.dragStart.y;
        this.mouse.rot.y += deltaX * 0.0055;
        this.mouse.rot.x += deltaY * 0.0055;
        this.mouse.dragStart.x = e.clientX;
        this.mouse.dragStart.y = e.clientY;
      }
    });

    window.addEventListener('mousedown', (e) => {
      // Allow card rotation drag in Hero or NFC Showcase section, or when close
      if (this.scrollProgress < 0.22 || Math.abs(this.scrollProgress - 0.90) < 0.14) {
        this.mouse.isDragging = true;
        this.mouse.dragStart.x = e.clientX;
        this.mouse.dragStart.y = e.clientY;
        const cursor = document.getElementById('cursor');
        if (cursor) cursor.classList.add('drag');
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDragging = false;
      const cursor = document.getElementById('cursor');
      if (cursor) cursor.classList.remove('drag');
    });

    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      const isMobile = w < 768;
      this.camera.aspect = w / h;
      this.camera.fov = isMobile ? 52 : 38;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  // Update scroll from Lenis smooth scroll instance with velocity
  setScrollProgress(p, vel = 0) {
    this.scrollProgress = p;
    this.velocity = vel;
  }

  // ─── MASTER ANIMATION LOOP (Igloo Inc. Choreography) ───
  animate() {
    if (this.disposed) return;

    this.time = performance.now() * 0.001;
    const t = this.time;
    const isMobile = window.innerWidth < 768;

    // Smooth scroll and velocity damping
    this.smoothScroll += (this.scrollProgress - this.smoothScroll) * 0.085;
    this.smoothVelocity += (this.velocity - this.smoothVelocity) * 0.12;
    const p = this.smoothScroll;

    // Smooth mouse lerp
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

    // Dynamic cursor spotlight
    if (this.cursorLight) {
      this.cursorLight.position.x = this.mouse.x * 6;
      this.cursorLight.position.y = this.mouse.y * 4;
    }

    // ─── IGLOO-GRADE 3D CARD CHOREOGRAPHY ───
    if (this.cardContainer && this.nfcCardMesh) {
      // 1. Interpolate keyframe state from scroll progress
      const kf = getCardKeyframeState(p);

      // 2. Aerodynamic scroll velocity banking & pitch (inertia)
      const velPitch = Math.max(-0.4, Math.min(0.4, this.smoothVelocity * 0.007));
      const velRoll = Math.max(-0.35, Math.min(0.35, this.smoothVelocity * 0.004));

      // 3. Natural organic levitation breathing
      const idleY = Math.sin(t * 1.5) * 0.06;
      const idleRotX = Math.cos(t * 1.1) * 0.025;
      const idleRotY = Math.sin(t * 0.8) * 0.035;

      // 4. Cursor hover response
      const hoverRotY = this.mouse.x * 0.28;
      const hoverRotX = -this.mouse.y * 0.20;

      // Damp drag rotation when not actively dragging
      if (!this.mouse.isDragging) {
        this.mouse.rot.x *= 0.94;
        this.mouse.rot.y *= 0.94;
      }

      // Card is prominent in Hero (p < 0.12) and NFC section (0.78 - 0.96), clean during project transitions
      let cardVisibility = 0;
      if (p <= 0.12) {
        cardVisibility = Math.max(0, 1 - p * 7.0);
      } else if (p >= 0.78 && p <= 0.96) {
        const nfcDist = Math.abs(p - 0.88);
        cardVisibility = Math.max(0, 1 - nfcDist * 10);
      }

      // Responsive mobile card placement (center aligned on mobile)
      const posX = isMobile ? 0 : kf.pos[0];
      const posY = isMobile ? (p <= 0.12 ? -1.05 : kf.pos[1]) : kf.pos[1];
      const cardScale = isMobile ? kf.scale * 0.65 : kf.scale;

      this.cardContainer.position.x += (posX - this.cardContainer.position.x) * 0.085;
      this.cardContainer.position.y += ((posY + idleY) - this.cardContainer.position.y) * 0.085;
      this.cardContainer.position.z += (kf.pos[2] - this.cardContainer.position.z) * 0.085;
      this.cardContainer.scale.setScalar(cardScale * cardVisibility);
      this.cardContainer.visible = cardVisibility > 0.01;

      // Smooth rotational banking
      const targetRotX = kf.rot[0] + idleRotX + hoverRotX + this.mouse.rot.x + velPitch;
      const targetRotY = kf.rot[1] + idleRotY + hoverRotY + this.mouse.rot.y;
      const targetRotZ = kf.rot[2] + velRoll;

      this.nfcCardMesh.rotation.x += (targetRotX - this.nfcCardMesh.rotation.x) * 0.09;
      this.nfcCardMesh.rotation.y += (targetRotY - this.nfcCardMesh.rotation.y) * 0.09;
      this.nfcCardMesh.rotation.z += (targetRotZ - this.nfcCardMesh.rotation.z) * 0.09;

      // Real-time Holographic Glint Shimmer Updates
      if (this.frontMaterial && this.backMaterial) {
        this.frontMaterial.uniforms.uTime.value = t;
        this.frontMaterial.uniforms.uTilt.value.set(this.mouse.x + this.smoothVelocity * 0.02, this.mouse.y);

        this.backMaterial.uniforms.uTime.value = t;
        this.backMaterial.uniforms.uTilt.value.set(-this.mouse.x, this.mouse.y);
      }
    }

    // ─── CINEMATIC CAMERA TRACKING (ADAPTIVE MOBILE DEPTH) ───
    const baseCamZ = isMobile ? 15.5 : 14.0;
    const targetCamZ = baseCamZ - Math.sin(p * Math.PI) * 0.8;
    const targetCamX = this.mouse.x * (isMobile ? 0.2 : 0.55);
    const targetCamY = this.mouse.y * (isMobile ? 0.15 : 0.35) - p * 0.35;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.06;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.06;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.06;

    // ─── AMBIENT PARTICLES SPEED STREAM ───
    if (this.particles) {
      this.particles.rotation.y = t * 0.012 + p * 0.4;
      const pos = this.particles.geometry.attributes.position;
      const v = this.particleVelocities;
      const velStream = this.smoothVelocity * 0.01;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i) + v[i * 3];
        let y = pos.getY(i) + v[i * 3 + 1];
        let z = pos.getZ(i) + v[i * 3 + 2] + velStream;

        // Wrap around boundaries
        if (x > 25) x = -25; if (x < -25) x = 25;
        if (y > 18) y = -18; if (y < -18) y = 18;
        if (z > 40) z = -80; if (z < -80) z = 40;

        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // Direct crystal-clear 3D render
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(() => this.animate());
  }

  dispose() {
    this.disposed = true;
  }
}

