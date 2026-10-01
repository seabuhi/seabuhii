/**
 * SAVELYA × LUSION // MASTER 3D LIVING EARTH WORLD
 * Completely replaces abstract particles with real 3D earth.glb as the full-page background.
 * Features:
 * - Real-time continuous axial rotation (23.5° tilt)
 * - Atmospheric sunlight, cyan rim lighting & space glow
 * - Baku, Azerbaijan HQ telemetry beacon (40.4093° N, 49.8671° E)
 * - Orbital data streams and pulsing satellites
 * - Interactive 360° mouse drag spin & smooth scroll parallax
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class LusionWorld {
  constructor(containerId = 'lusion-canvas-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0.0016 };
    this.clock = new THREE.Clock();
    this.loader = new GLTFLoader();
    this.mixer = null;
    this.droneMixer = null;
    this.dronePivot = null;

    this.earthGroup = new THREE.Group();
    this.orbitGroup = new THREE.Group();
    this.satellites = [];

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.2);

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

    this.renderer.domElement.id = 'lusion-three-canvas';
    this.container.appendChild(this.renderer.domElement);

    // 4. Cosmic Lighting Rig
    this.setupLighting();

    // 5. Add Groups to Scene
    this.scene.add(this.earthGroup);
    this.scene.add(this.orbitGroup);

    // 6. Orbital Telemetry Streams
    this.createOrbitalStreams();

    // 7. Load earth.glb
    this.loadEarth();

    // 8. Load 3D Drone into Orbit around Earth
    this.loadDroneOrbit();

    // 9. Bind Mouse & Touch Events
    this.bindEvents();

    // 10. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Deep cosmic ambient light
    const ambient = new THREE.AmbientLight(0x0e1424, 1.8);
    this.scene.add(ambient);

    // Directional Sunlight (Bright warm sunlight hitting the Earth)
    this.sunLight = new THREE.DirectionalLight(0xfff6ea, 4.2);
    this.sunLight.position.set(6, 3, 5);
    this.scene.add(this.sunLight);

    // Cyan Atmospheric Rim Light (Cybernetic aura of the planet)
    this.rimLight = new THREE.DirectionalLight(0x00e1ff, 3.2);
    this.rimLight.position.set(-6, -2, -4);
    this.scene.add(this.rimLight);

    // Hardware Amber Accent Light
    this.amberLight = new THREE.PointLight(0xff5e1a, 3.0, 18);
    this.amberLight.position.set(2, -4, 3);
    this.scene.add(this.amberLight);
  }

  createOrbitalStreams() {
    // Equatorial Cyan Orbit Ring
    const ringGeo1 = new THREE.RingGeometry(3.1, 3.12, 128);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    this.ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.ring1.rotation.x = Math.PI / 2.2;
    this.orbitGroup.add(this.ring1);

    // Tilted Amber Orbit Ring
    const ringGeo2 = new THREE.RingGeometry(3.35, 3.37, 128);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff5e1a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    this.ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    this.ring2.rotation.x = -Math.PI / 3;
    this.ring2.rotation.y = Math.PI / 5;
    this.orbitGroup.add(this.ring2);

    // Satellites orbiting around the Earth
    const count = 28;
    const satGeo = new THREE.SphereGeometry(0.03, 12, 12);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < count; i++) {
      const sat = new THREE.Mesh(satGeo, satMat);
      const angle = (i / count) * Math.PI * 2;
      const r = i % 2 === 0 ? 3.11 : 3.36;
      sat.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      sat.userData = { angle, radius: r, speed: 0.007 + (i % 3) * 0.003 };
      this.orbitGroup.add(sat);
      this.satellites.push(sat);
    }
  }

  loadEarth() {
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
        // Scale Earth to radius ~ 2.5 units
        const scale = 5.0 / maxDim;
        root.scale.set(scale, scale, scale);

        // Position Earth slightly offset so editorial titles have space
        this.earthGroup.position.set(0.6, 0, 0);

        // Natural axial tilt of 23.5°
        this.earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5);

        // Check animations in gltf
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(root);
          gltf.animations.forEach((clip) => {
            this.mixer.clipAction(clip).play();
          });
        }

        this.earthMesh = root;
        this.earthGroup.add(root);

        // Add Baku HQ Beacon
        this.addBakuBeacon(2.52);

        // Hide preloader if any
        this.hideEarthLoader();
      },
      (xhr) => {
        if (xhr.lengthComputable && xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          this.updateEarthLoader(percent);
        } else if (xhr.loaded) {
          const percent = Math.min(99, Math.round((xhr.loaded / 64273192) * 100));
          this.updateEarthLoader(percent);
        }
      },
      (err) => {
        console.error('Failed to load earth.glb:', err);
        this.hideEarthLoader();
      }
    );
  }

  loadDroneOrbit() {
    this.loader.load(
      '/models/drone_design.glb',
      (gltf) => {
        const drone = gltf.scene;

        const box = new THREE.Box3().setFromObject(drone);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        drone.position.x -= center.x;
        drone.position.y -= center.y;
        drone.position.z -= center.z;

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        // Scale to a prominent size visible in space near Earth
        const scale = 0.95 / maxDim;
        drone.scale.set(scale, scale, scale);

        drone.traverse((node) => {
          if (node.isMesh && node.material) {
            node.material.roughness = 0.28;
            node.material.metalness = 0.85;
          }
        });

        if (gltf.animations && gltf.animations.length > 0) {
          this.droneMixer = new THREE.AnimationMixer(drone);
          gltf.animations.forEach((clip) => {
            this.droneMixer.clipAction(clip).play();
          });
        }

        // Orbit pivot
        this.dronePivot = new THREE.Group();
        drone.position.set(3.6, 0.5, 0.3);
        drone.rotation.y = Math.PI / 1.7;
        drone.rotation.z = -0.15;

        // Telemetry beam connecting Drone to Baku / Earth
        const beamGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(3.6, 0.5, 0.3),
          new THREE.Vector3(2.52, 0.3, 0)
        ]);
        const beamMat = new THREE.LineBasicMaterial({
          color: 0x00f0ff,
          transparent: true,
          opacity: 0.5
        });
        const beam = new THREE.Line(beamGeo, beamMat);

        this.dronePivot.add(drone);
        this.dronePivot.add(beam);
        this.scene.add(this.dronePivot);
      },
      undefined,
      (err) => console.warn('Drone orbit background load note:', err)
    );
  }

  addBakuBeacon(radius = 2.52) {
    // Geographic coords for Baku, Azerbaijan: 40.4093° N, 49.8671° E
    const lat = 40.4093;
    const lon = 49.8671;

    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    // Glowing Pin
    const pinGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xff5e1a });
    this.bakuPin = new THREE.Mesh(pinGeo, pinMat);
    this.bakuPin.position.set(x, y, z);

    // Pulsing Telemetry Ring
    const ringGeo = new THREE.RingGeometry(0.07, 0.11, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff5e1a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.bakuRing = new THREE.Mesh(ringGeo, ringMat);
    this.bakuRing.position.set(x * 1.01, y * 1.01, z * 1.01);
    this.bakuRing.lookAt(0, 0, 0);

    this.earthGroup.add(this.bakuPin);
    this.earthGroup.add(this.bakuRing);
  }

  hideEarthLoader() {
    const loader = document.getElementById('global-earth-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
      setTimeout(() => loader.remove(), 400);
    }
  }

  updateEarthLoader(percent) {
    const text = document.getElementById('global-earth-loader-text');
    const bar = document.getElementById('global-earth-loader-bar');
    if (text) text.textContent = `3D YER KÜRƏSİ YÜKLƏNİR: ${percent}%`;
    if (bar) bar.style.width = `${percent}%`;
  }

  setMode(mode) {
    // Smooth camera or lighting adjustments based on mode
    if (mode === 'hardware') {
      this.sunLight.color.setHex(0xffecd2);
      this.amberLight.intensity = 5.0;
      this.rimLight.intensity = 1.5;
    } else if (mode === 'software') {
      this.sunLight.color.setHex(0xe6f7ff);
      this.amberLight.intensity = 1.5;
      this.rimLight.intensity = 4.5;
    } else {
      this.sunLight.color.setHex(0xfff6ea);
      this.amberLight.intensity = 3.0;
      this.rimLight.intensity = 3.2;
    }
  }

  triggerShockwave() {
    // Pulse light briefly
    const orig = this.sunLight.intensity;
    this.sunLight.intensity = 6.0;
    setTimeout(() => {
      this.sunLight.intensity = orig;
    }, 250);
  }

  bindEvents() {
    // Parallax tracking
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

    // Drag anywhere to spin Earth
    window.addEventListener('mousedown', (e) => {
      // Don't drag if clicking buttons, inputs, links
      if (e.target.closest('button, a, input, select, textarea, .poster-3d-viewport')) return;
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch support for drag
    window.addEventListener('touchstart', (e) => {
      if (e.target.closest('button, a, input, select, textarea, .poster-3d-viewport')) return;
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

    // Scroll Parallax (Move camera position subtly with page scroll)
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollY / docHeight : 0;

      // Smoothly shift camera Y and position slightly during scroll
      this.camera.position.y = -progress * 1.2;
    }, { passive: true });

    // Resize
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // 1. Mixer update (if any)
    if (this.mixer) {
      this.mixer.update(delta);
    }
    if (this.droneMixer) {
      this.droneMixer.update(delta);
    }
    if (this.dronePivot) {
      this.dronePivot.rotation.y += 0.0035;
    }

    // 2. Smooth Mouse Parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.camera.position.x = this.mouse.x * 0.5;

    // 3. Earth Rotation Physics & Natural Spin
    if (!this.isDragging) {
      this.rotationVelocity.y *= 0.95;
      this.rotationVelocity.x *= 0.95;
      this.earthGroup.rotation.y += 0.0016 + this.rotationVelocity.y;
      this.earthGroup.rotation.x += this.rotationVelocity.x;
    } else {
      this.earthGroup.rotation.y += this.rotationVelocity.y;
      this.earthGroup.rotation.x += this.rotationVelocity.x;
    }

    // 4. Pulse Baku Telemetry Beacon
    if (this.bakuRing) {
      const scale = 1 + Math.sin(elapsed * 4) * 0.4;
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
    if (this.ring1) this.ring1.rotation.z += 0.0006;
    if (this.ring2) this.ring2.rotation.z -= 0.0008;

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
}
