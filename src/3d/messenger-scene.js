/**
 * OFFLINE MESSENGER 3D Scene — Mesh network visualization
 * Central phone + orbiting devices + P2P connections + signal waves
 */
import * as THREE from 'three';
import { createRenderer, createLighting, createEnvMap, lerp, prefersReducedMotion } from './utils.js';

export class MessengerScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.container = canvas.parentElement;
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.isReduced = prefersReducedMotion();
    this.disposed = false;
    this.devices = [];
    this.connections = [];
    this.waves = [];
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.container.clientWidth / this.container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 3, 7);
    this.camera.lookAt(0, 0, 0);

    this.renderer = createRenderer(this.canvas);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    this.envMap = createEnvMap(this.renderer);
    createLighting(this.scene, { accent: 0x4a9eff });
    this.buildScene();
    this.bindEvents();
    this.animate();
  }

  createDevice(size = 1) {
    const group = new THREE.Group();

    // Phone body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x222222, metalness: 0.9, roughness: 0.15, envMap: this.envMap, envMapIntensity: 1.2,
    });
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5 * size, 0.85 * size, 0.04 * size),
      bodyMat
    );
    group.add(body);

    // Screen glow
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0a1525, emissive: 0x1a3a5a, emissiveIntensity: 0.4,
    });
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42 * size, 0.75 * size),
      screenMat
    );
    screen.position.z = 0.021 * size;
    group.add(screen);

    // Notification dot
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.03 * size, 16),
      new THREE.MeshBasicMaterial({ color: 0x4ae85a })
    );
    dot.position.set(0.15 * size, 0.3 * size, 0.022 * size);
    group.add(dot);

    return group;
  }

  buildScene() {
    this.group = new THREE.Group();

    // === CENTRAL DEVICE ===
    this.centralDevice = this.createDevice(1.3);
    this.centralDevice.rotation.x = -0.3;
    this.group.add(this.centralDevice);

    // === ORBITING DEVICES ===
    const devicePositions = [
      { angle: 0, radius: 2.5, y: 0.5, size: 0.8 },
      { angle: Math.PI * 0.55, radius: 2.8, y: -0.3, size: 0.7 },
      { angle: Math.PI, radius: 2.3, y: 0.8, size: 0.9 },
      { angle: Math.PI * 1.4, radius: 3.0, y: -0.1, size: 0.6 },
      { angle: Math.PI * 1.75, radius: 2.6, y: 0.3, size: 0.75 },
    ];

    devicePositions.forEach(dp => {
      const device = this.createDevice(dp.size);
      device.position.set(
        Math.cos(dp.angle) * dp.radius,
        dp.y,
        Math.sin(dp.angle) * dp.radius
      );
      device.lookAt(0, 0, 0);
      device.userData = { ...dp, baseAngle: dp.angle };
      this.devices.push(device);
      this.group.add(device);
    });

    // === CONNECTION LINES ===
    const connMat = new THREE.LineBasicMaterial({
      color: 0x4a9eff, transparent: true, opacity: 0.3,
    });

    // Connect each device to central
    this.devices.forEach(device => {
      const points = [new THREE.Vector3(0, 0, 0), device.position.clone()];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, connMat.clone());
      this.connections.push({ line, device });
      this.group.add(line);
    });

    // Connect devices to each other (partial mesh)
    for (let i = 0; i < this.devices.length; i++) {
      const j = (i + 1) % this.devices.length;
      const points = [this.devices[i].position.clone(), this.devices[j].position.clone()];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const meshLine = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: 0x4a9eff, transparent: true, opacity: 0.12,
      }));
      this.group.add(meshLine);
    }

    // === SIGNAL WAVES (expanding rings) ===
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(0.5 + i * 0.8, 0.52 + i * 0.8, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x4a9eff, transparent: true, opacity: 0.15 - i * 0.04, side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI * 0.5;
      ring.position.y = -0.5;
      ring.userData = { baseScale: 1 + i * 0.5, phaseOffset: i * 0.7 };
      this.waves.push(ring);
      this.group.add(ring);
    }

    // === DATA PACKETS (small traveling spheres) ===
    this.packets = [];
    for (let i = 0; i < 8; i++) {
      const packetGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const packetMat = new THREE.MeshBasicMaterial({
        color: 0x4ae85a, transparent: true, opacity: 0.8,
      });
      const packet = new THREE.Mesh(packetGeo, packetMat);
      packet.userData = {
        fromDevice: Math.floor(Math.random() * this.devices.length),
        progress: Math.random(),
        speed: 0.3 + Math.random() * 0.5,
        toCenter: Math.random() > 0.5,
      };
      this.packets.push(packet);
      this.group.add(packet);
    }

    this.scene.add(this.group);
  }

  bindEvents() {
    this._onMouseMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.ty = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    this._onResize = () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    this.container.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('resize', this._onResize);
  }

  animate() {
    if (this.disposed) return;
    const time = performance.now() * 0.001;
    const speed = this.isReduced ? 0.1 : 1;

    this.mouse.x = lerp(this.mouse.x, this.mouse.tx, 0.05);
    this.mouse.y = lerp(this.mouse.y, this.mouse.ty, 0.05);

    // Slow orbit of device group
    this.group.rotation.y = time * 0.08 * speed + this.mouse.x * 0.2;
    this.group.rotation.x = this.mouse.y * 0.1;

    // Central device float
    this.centralDevice.position.y = Math.sin(time * 0.5) * 0.1;

    // Orbiting devices subtle float
    this.devices.forEach((d, i) => {
      d.position.y = d.userData.y + Math.sin(time * 0.3 + i) * 0.15;
    });

    // Signal waves pulse
    this.waves.forEach(w => {
      const phase = time * 0.5 * speed + w.userData.phaseOffset;
      const s = w.userData.baseScale + Math.sin(phase) * 0.3;
      w.scale.setScalar(s);
      w.material.opacity = 0.12 * (1 - Math.abs(Math.sin(phase)) * 0.5);
    });

    // Data packets travel
    this.packets.forEach(p => {
      const d = p.userData;
      d.progress += d.speed * 0.01 * speed;
      if (d.progress > 1) {
        d.progress = 0;
        d.fromDevice = Math.floor(Math.random() * this.devices.length);
        d.toCenter = !d.toCenter;
      }

      const devicePos = this.devices[d.fromDevice].position;
      const center = new THREE.Vector3(0, 0, 0);
      const from = d.toCenter ? devicePos : center;
      const to = d.toCenter ? center : devicePos;
      p.position.lerpVectors(from, to, d.progress);
    });

    // Update connection lines opacity based on activity
    this.connections.forEach((c, i) => {
      c.line.material.opacity = 0.2 + Math.sin(time + i) * 0.15;
    });

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(() => this.animate());
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.container.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    this.scene.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
  }
}
