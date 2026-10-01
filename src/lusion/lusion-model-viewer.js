/**
 * SAVELYA × LUSION // 3D GLB HARDWARE MODEL VIEWER
 * Real-time 3D Model Inspector for Advertising Billboard Poster
 * Loads and displays custom GLB models (desktop_computer.glb, drone_design.glb, personal_computer.glb)
 * Features: Orbit controls, auto-turntable, wireframe toggle, dynamic lighting & interactive hotspots
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const HARDWARE_MODELS = {
  desktop: {
    id: 'desktop',
    name: 'SAVELYA SƏNAYE KOMPÜTERİ (DESKTOP)',
    tag: 'HARDWARE // HESABLAMA NÜVƏSİ',
    path: '/models/desktop_computer.glb',
    scaleMultiplier: 2.8,
    cameraDist: 4.8,
    desc: 'Möhkəmləndirilmiş sənaye səviyyəli korpus, passiv və aktiv istilik paylanması, yerli dizayn edilmiş çoxlaylı ana plata və fasiləsiz 24/7 işləmə zəmanəti.',
    specs: [
      { label: 'KORPUS', val: 'CNC Alüminium / Polad' },
      { label: 'SOYUTMA', val: 'İkili İstilik Borusu' },
      { label: 'İŞ TEMPERATURU', val: '-20°C ... +70°C' },
      { label: 'SƏNAYE PORTLARI', val: 'CAN, RS-485, GbE' },
    ],
    hotspots: [
      { title: 'ŞASSİ & KORPUS', desc: 'EMC/EMI qoruyucu ekranlaşdırılmış xüsusi alüminium gövdə.' },
      { title: 'ANA LÖVHƏ', desc: 'Milli mühəndislərimiz tərəfindən layihələndirilmiş çoxlaylı dövrə lövhəsi.' },
      { title: 'SƏNAYE PORTLARI', desc: 'Qorunan sənaye konnektorları və diferensial siqnal xətləri.' }
    ]
  },
  drone: {
    id: 'drone',
    name: 'SAVELYA AERO-X PİLOTSUZ DRON SİSTEMİ',
    tag: 'HARDWARE // AVTONOM HAVA PLATFORMASI',
    path: '/models/drone_design.glb',
    scaleMultiplier: 2.2,
    cameraDist: 5.5,
    desc: 'Yüksək aerodinamik dayanıqlı karbon lifli gövdə, 1000 Hz tezlikli daxili uçuş kontrolleri, kənar AI obyekt aşkarlama və 45 km uzaqlıqlı LoRa telemetriyası.',
    specs: [
      { label: 'UÇUŞ MÜDDƏTİ', val: '45+ dəqiqə' },
      { label: 'KONTROLLER', val: '1000 Hz Dual-IMU' },
      { label: 'TELEMETRİYA', val: '45 km LoRa / 5G' },
      { label: 'KORPUS', val: '3K Karbon Kompozit' },
    ],
    hotspots: [
      { title: 'ROTOR & MOTORLAR', desc: 'Fırçasız yüksək fırlanma anına malik sənaye mühərrikləri.' },
      { title: 'AVİONİKA BLOKU', desc: '1000 Hz daxili uçuş kontrolleri və kənar AI prosessoru.' },
      { title: 'TELEMETRİYA ANTENNASI', desc: 'Uzaq məsafəli şifrələnmiş LoRa və peyk rabitə modulu.' }
    ]
  },
  personal: {
    id: 'personal',
    name: 'SAVELYA APARAT İŞ STANSİYASI (WORKSTATION)',
    tag: 'HARDWARE // MÜHƏNDİSLİK STANSİYASI',
    path: '/models/personal_computer.glb',
    scaleMultiplier: 2.6,
    cameraDist: 5.0,
    desc: 'FPGA simulyasiyası, neyron şəbəkə təlimi və mikrokontroller proqramlaşdırması üçün xüsusi yığılmış yüksək hesablama gücünə malik mühəndislik iş stansiyası.',
    specs: [
      { label: 'ARXİTEKTURA', val: '64-bit Çoxnüvəli' },
      { label: 'YADDAŞ', val: '64 GB ECC DDR5' },
      { label: 'İNTERFEYSLƏR', val: 'JTAG, SWD, UART, USB4' },
      { label: 'GÜC İDARƏETMƏSİ', val: 'Titanium 94% Effektivlik' },
    ],
    hotspots: [
      { title: 'HESABLAMA NÜVƏSİ', desc: 'Real-vaxt aparat emalı və simulyasiya üçün optimallaşdırılmış CPU/GPU bloku.' },
      { title: 'QORUNAN YADDAŞ', desc: 'Səhvləri avtomatik düzəldən sənaye dərəcəli ECC yaddaş bankı.' },
      { title: 'GÜC SİSTEMİ', desc: 'Stabil gərginlik paylayıcı və ani yüklənmələrdən qoruma dövrəsi.' }
    ]
  }
};

export class LusionModelViewer {
  constructor(canvasContainerId = 'poster-3d-viewport') {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.currentModelId = 'desktop';
    this.autoRotate = true;
    this.isWireframe = false;
    this.modelsCache = {};
    this.currentLoadedGroup = null;
    this.loader = new GLTFLoader();

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 480;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 1.2, 5.0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.className = 'poster-3d-canvas-el';
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.15; // Don't look too far from below
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 9.0;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.4;

    // 5. Studio Lighting Rig
    this.setupLighting();

    // 6. Cybernetic Floor Grid & Ambient Particle Ring
    this.setupStage();

    // 7. Load Default Model
    this.loadModel('desktop');

    // 8. Event Listeners
    this.bindEvents();

    // 9. Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Ambient Light
    const ambient = new THREE.AmbientLight(0xffffff, 1.6);
    this.scene.add(ambient);

    // Main Key Light (Warm Amber Hardware Glow)
    this.keyLight = new THREE.DirectionalLight(0xffecd2, 3.2);
    this.keyLight.position.set(4, 5, 4);
    this.keyLight.castShadow = true;
    this.scene.add(this.keyLight);

    // Cyan Rim Light (Software / Cyber Edge)
    this.rimLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    this.rimLight.position.set(-4, 3, -4);
    this.scene.add(this.rimLight);

    // Hardware Orange Accent Spotlight
    this.orangeLight = new THREE.PointLight(0xff5e1a, 4.0, 12);
    this.orangeLight.position.set(0, -1, 3);
    this.scene.add(this.orangeLight);
  }

  setupStage() {
    // Circular Ground Hologram Plate
    const circleGeo = new THREE.RingGeometry(2.4, 2.45, 64);
    const circleMat = new THREE.MeshBasicMaterial({
      color: 0xff5e1a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    this.groundRing = new THREE.Mesh(circleGeo, circleMat);
    this.groundRing.rotation.x = Math.PI / 2;
    this.groundRing.position.y = -1.35;
    this.scene.add(this.groundRing);

    // Subtle Radial Floor Shadow Disc
    const shadowGeo = new THREE.CircleGeometry(2.2, 48);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.36;
    this.scene.add(shadowMesh);
  }

  loadModel(modelKey) {
    const config = HARDWARE_MODELS[modelKey];
    if (!config) return;

    this.currentModelId = modelKey;
    this.showLoading(true, `3D MODEL YÜKLƏNİR: ${config.name}`);

    // If already cached, switch instantly
    if (this.modelsCache[modelKey]) {
      this.displayModel(this.modelsCache[modelKey], config);
      this.showLoading(false);
      this.updateUI(config);
      return;
    }

    this.loader.load(
      config.path,
      (gltf) => {
        const root = gltf.scene;

        // Auto-center and normalize size
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        root.position.x -= center.x;
        root.position.y -= center.y;
        root.position.z -= center.z;

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetScale = config.scaleMultiplier / maxDim;
        root.scale.set(targetScale, targetScale, targetScale);

        // Enhance metallic materials
        root.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            if (node.material) {
              node.material.roughness = Math.min(node.material.roughness || 0.4, 0.6);
              node.material.metalness = Math.max(node.material.metalness || 0.3, 0.4);
            }
          }
        });

        // Store in cache
        this.modelsCache[modelKey] = root;
        this.displayModel(root, config);
        this.showLoading(false);
        this.updateUI(config);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          this.updateProgress(percent);
        }
      },
      (error) => {
        console.error('Error loading GLB model:', error);
        this.showLoading(true, 'Model yüklənməsində xəta baş verdi');
      }
    );
  }

  displayModel(group, config) {
    if (this.currentLoadedGroup) {
      this.scene.remove(this.currentLoadedGroup);
    }
    this.currentLoadedGroup = group;
    this.scene.add(group);

    // Apply wireframe if active
    this.applyWireframe(this.isWireframe);

    // Reset camera nicely
    this.camera.position.set(0, 1.2, config.cameraDist || 5.0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    this.controls.autoRotate = this.autoRotate;
    return this.autoRotate;
  }

  toggleWireframe() {
    this.isWireframe = !this.isWireframe;
    this.applyWireframe(this.isWireframe);
    return this.isWireframe;
  }

  applyWireframe(wireframeState) {
    if (!this.currentLoadedGroup) return;
    this.currentLoadedGroup.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.wireframe = wireframeState);
        } else {
          child.material.wireframe = wireframeState;
        }
      }
    });
  }

  resetCamera() {
    const config = HARDWARE_MODELS[this.currentModelId];
    if (config) {
      this.camera.position.set(0, 1.2, config.cameraDist || 5.0);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  updateUI(config) {
    // 1. Update text badge and title in poster details
    const titleEl = document.getElementById('poster-3d-model-name');
    const tagEl = document.getElementById('poster-3d-model-tag');
    const descEl = document.getElementById('poster-3d-model-desc');
    const specsList = document.getElementById('poster-3d-specs-list');

    if (titleEl) titleEl.textContent = config.name;
    if (tagEl) tagEl.textContent = config.tag;
    if (descEl) descEl.textContent = config.desc;

    if (specsList && config.specs) {
      specsList.innerHTML = config.specs.map(s => `
        <div class="model-spec-row">
          <span class="m-spec-lbl">${s.label}:</span>
          <span class="m-spec-val">${s.val}</span>
        </div>
      `).join('');
    }

    // 2. Update active tab pill in UI
    document.querySelectorAll('.model-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.model === config.id);
    });
  }

  showLoading(show, message = '3D MODEL YÜKLƏNİR...') {
    const loaderEl = document.getElementById('poster-3d-loader');
    const textEl = document.getElementById('poster-3d-loader-text');
    if (!loaderEl) return;

    if (show) {
      loaderEl.style.opacity = '1';
      loaderEl.style.pointerEvents = 'auto';
      if (textEl) textEl.textContent = message;
    } else {
      loaderEl.style.opacity = '0';
      loaderEl.style.pointerEvents = 'none';
    }
  }

  updateProgress(percent) {
    const barEl = document.getElementById('poster-3d-progress-bar');
    const textEl = document.getElementById('poster-3d-loader-text');
    if (barEl) barEl.style.width = `${percent}%`;
    if (textEl) textEl.textContent = `3D MODEL YÜKLƏNİR: ${percent}%`;
  }

  bindEvents() {
    // Resize Listener
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w && h) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      }
    });

    // Model Selector Tabs
    document.querySelectorAll('.model-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modelKey = btn.dataset.model;
        if (modelKey && modelKey !== this.currentModelId) {
          this.loadModel(modelKey);
        }
      });
    });

    // Auto-Rotate Button
    const autoRotBtn = document.getElementById('btn-3d-autorotate');
    if (autoRotBtn) {
      autoRotBtn.addEventListener('click', () => {
        const active = this.toggleAutoRotate();
        autoRotBtn.classList.toggle('active', active);
      });
    }

    // Wireframe Button
    const wireBtn = document.getElementById('btn-3d-wireframe');
    if (wireBtn) {
      wireBtn.addEventListener('click', () => {
        const active = this.toggleWireframe();
        wireBtn.classList.toggle('active', active);
      });
    }

    // Reset View Button
    const resetBtn = document.getElementById('btn-3d-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetCamera();
      });
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.controls.update();

    // Pulse ground ring
    if (this.groundRing) {
      this.groundRing.rotation.z += 0.003;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
