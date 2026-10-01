/**
 * SAVELYA × LUSION // 3D LIVING EARTH BILLBOARD BACKGROUND
 * Loads and renders earth.glb with real-time axial rotation, atmospheric lighting,
 * orbital data streams, Baku HQ telemetry beacon, and interactive mouse drag
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class LusionEarthScene {
  constructor(containerId = 'poster-earth-bg') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.earthGroup = new THREE.Group();
    this.hardwareOverlayGroup = new THREE.Group();
    this.loader = new GLTFLoader();
    this.mixer = null;
    this.clock = new THREE.Clock();

    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0.0018 };
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    this.activeHardwareModel = null;
    this.hardwareCache = {};

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 700;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 0.4, 4.8);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;

    this.renderer.domElement.className = 'earth-canvas-element';
    this.container.appendChild(this.renderer.domElement);

    // 4. Studio Space Lighting Rig
    this.setupLighting();

    // 5. Add Groups
    this.scene.add(this.earthGroup);
    this.scene.add(this.hardwareOverlayGroup);

    // 6. Orbital Rings & Telemetry Constellation
    this.createOrbitalDataStreams();

    // 7. Load earth.glb
    this.loadEarthModel();

    // 8. Event Listeners
    this.bindEvents();

    // 9. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Soft deep cosmic ambient
    const ambient = new THREE.AmbientLight(0x0e1422, 1.8);
    this.scene.add(ambient);

    // Sun Key Light (Directional Sunlight)
    this.sunLight = new THREE.DirectionalLight(0xfff5ea, 3.8);
    this.sunLight.position.set(5, 3, 4);
    this.scene.add(this.sunLight);

    // Atmospheric Blue/Cyan Rim Light (Cybernetic Earth Aura)
    this.rimLight = new THREE.DirectionalLight(0x00d4ff, 3.2);
    this.rimLight.position.set(-6, -2, -3);
    this.scene.add(this.rimLight);

    // Hardware Amber Ground Light
    this.amberLight = new THREE.PointLight(0xff5e1a, 2.5, 15);
    this.amberLight.position.set(2, -3, 2);
    this.scene.add(this.amberLight);
  }

  createOrbitalDataStreams() {
    this.orbitGroup = new THREE.Group();

    // Orbit Ring 1 (Equatorial Cyan Data Highway)
    const ringGeo1 = new THREE.RingGeometry(2.35, 2.37, 128);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    this.ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.ring1.rotation.x = Math.PI / 2.2;
    this.orbitGroup.add(this.ring1);

    // Orbit Ring 2 (Tilted Amber Hardware Telemetry)
    const ringGeo2 = new THREE.RingGeometry(2.55, 2.57, 128);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff5e1a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    this.ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    this.ring2.rotation.x = -Math.PI / 3;
    this.ring2.rotation.y = Math.PI / 5;
    this.orbitGroup.add(this.ring2);

    // Floating Data Packets (Glowing Satellites) along the orbits
    const packetCount = 24;
    const packetGeo = new THREE.SphereGeometry(0.025, 12, 12);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.satellites = [];
    for (let i = 0; i < packetCount; i++) {
      const sat = new THREE.Mesh(packetGeo, packetMat);
      const angle = (i / packetCount) * Math.PI * 2;
      const r = i % 2 === 0 ? 2.36 : 2.56;
      sat.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      sat.userData = { angle, radius: r, speed: 0.008 + (i % 3) * 0.004, isRing1: i % 2 === 0 };
      this.orbitGroup.add(sat);
      this.satellites.push(sat);
    }

    this.scene.add(this.orbitGroup);
  }

  loadEarthModel() {
    this.showLoader(true, '3D YER KÜRƏSİ YÜKLƏNİR (EARTH.GLB)...');

    this.loader.load(
      '/models/earth.glb',
      (gltf) => {
        const root = gltf.scene;

        // Auto-center and fit to scale
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        root.position.x -= center.x;
        root.position.y -= center.y;
        root.position.z -= center.z;

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetScale = 3.8 / maxDim; // Earth radius ~ 1.9 units
        root.scale.set(targetScale, targetScale, targetScale);

        // Axial Tilt of 23.5°
        this.earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5);

        // Check for animations in gltf
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(root);
          gltf.animations.forEach((clip) => {
            this.mixer.clipAction(clip).play();
          });
        }

        // Add to Earth Group
        this.earthMesh = root;
        this.earthGroup.add(root);

        // Add Baku HQ Telemetry Beacon Marker
        this.addBakuBeacon(1.92);

        this.showLoader(false);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          this.updateProgress(percent);
        }
      },
      (error) => {
        console.error('Error loading earth.glb:', error);
        this.showLoader(true, 'Yer kürəsi yüklənməsində xəta');
      }
    );
  }

  addBakuBeacon(radius = 1.92) {
    // Baku geographic coordinates: 40.4093° N, 49.8671° E
    const lat = 40.4093;
    const lon = 49.8671;

    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    // Beacon Pin Mesh
    const pinGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({
      color: 0xff5e1a,
      wireframe: false,
    });
    this.bakuPin = new THREE.Mesh(pinGeo, pinMat);
    this.bakuPin.position.set(x, y, z);

    // Pulsing Ring around Baku
    const ringGeo = new THREE.RingGeometry(0.05, 0.08, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff5e1a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.bakuRing = new THREE.Mesh(ringGeo, ringMat);
    this.bakuRing.position.set(x * 1.01, y * 1.01, z * 1.01);
    this.bakuRing.lookAt(0, 0, 0);

    this.earthGroup.add(this.bakuPin);
    this.earthGroup.add(this.bakuRing);
  }

  showLoader(show, text = '') {
    const loader = document.getElementById('earth-loader-overlay');
    const label = document.getElementById('earth-loader-label');
    if (!loader) return;

    if (show) {
      loader.style.opacity = '1';
      loader.style.pointerEvents = 'auto';
      if (label && text) label.textContent = text;
    } else {
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
    }
  }

  updateProgress(percent) {
    const bar = document.getElementById('earth-loader-bar');
    const label = document.getElementById('earth-loader-label');
    if (bar) bar.style.width = `${percent}%`;
    if (label) label.textContent = `3D QLOBUS YÜKLƏNİR: ${percent}%`;
  }

  loadHardwareOverlay(modelKey) {
    const paths = {
      drone: '/models/drone_design.glb',
      desktop: '/models/desktop_computer.glb',
      personal: '/models/personal_computer.glb',
    };

    if (!paths[modelKey]) {
      // Clear overlay
      if (this.activeHardwareModel) {
        this.hardwareOverlayGroup.remove(this.activeHardwareModel);
        this.activeHardwareModel = null;
      }
      return;
    }

    if (this.hardwareCache[modelKey]) {
      this.displayHardware(this.hardwareCache[modelKey]);
      return;
    }

    this.loader.load(paths[modelKey], (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      model.position.x -= center.x;
      model.position.y -= center.y;
      model.position.z -= center.z;

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 1.3 / maxDim;
      model.scale.set(scale, scale, scale);

      // Position in front of the Earth
      model.position.set(0.9, -0.1, 1.8);

      this.hardwareCache[modelKey] = model;
      this.displayHardware(model);
    });
  }

  displayHardware(model) {
    if (this.activeHardwareModel) {
      this.hardwareOverlayGroup.remove(this.activeHardwareModel);
    }
    this.activeHardwareModel = model;
    this.hardwareOverlayGroup.add(model);
  }

  bindEvents() {
    // Mouse Move for Parallax
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.rotationVelocity.y = deltaX * 0.004;
        this.rotationVelocity.x = deltaY * 0.003;

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    // Drag to spin Earth
    this.container.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch support for drag
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

        this.rotationVelocity.y = deltaX * 0.004;
        this.rotationVelocity.x = deltaY * 0.003;

        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    // Resize
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

    // Hardware switcher tabs in poster
    document.querySelectorAll('.earth-hw-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.earth-hw-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const model = btn.dataset.model;
        this.loadHardwareOverlay(model);
      });
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // 1. Mixer update
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // 2. Smooth Mouse Parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.camera.position.x = this.mouse.x * 0.4;
    this.camera.position.y = 0.4 + this.mouse.y * 0.3;
    this.camera.lookAt(0, 0, 0);

    // 3. Earth Rotation Physics & Natural Spin
    if (!this.isDragging) {
      this.rotationVelocity.y *= 0.96;
      this.rotationVelocity.x *= 0.96;
      this.earthGroup.rotation.y += 0.0016 + this.rotationVelocity.y;
      this.earthGroup.rotation.x += this.rotationVelocity.x;
    } else {
      this.earthGroup.rotation.y += this.rotationVelocity.y;
      this.earthGroup.rotation.x += this.rotationVelocity.x;
    }

    // 4. Pulse Baku Telemetry Beacon
    if (this.bakuRing) {
      const scale = 1 + Math.sin(elapsed * 4) * 0.35;
      this.bakuRing.scale.set(scale, scale, scale);
      this.bakuRing.material.opacity = 0.5 + Math.sin(elapsed * 4) * 0.4;
    }

    // 5. Animate Satellites along orbit
    if (this.satellites) {
      this.satellites.forEach(sat => {
        sat.userData.angle += sat.userData.speed;
        const r = sat.userData.radius;
        sat.position.x = Math.cos(sat.userData.angle) * r;
        sat.position.z = Math.sin(sat.userData.angle) * r;
      });
    }

    // 6. Rotate Orbital Rings
    if (this.ring1) this.ring1.rotation.z += 0.0008;
    if (this.ring2) this.ring2.rotation.z -= 0.001;

    // 7. Float Hardware Model in Orbit
    if (this.activeHardwareModel) {
      this.activeHardwareModel.rotation.y += 0.008;
      this.activeHardwareModel.position.y = -0.1 + Math.sin(elapsed * 1.8) * 0.06;
    }

    // 8. Render
    this.renderer.render(this.scene, this.camera);
  }
}
