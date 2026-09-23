/**
 * AZINET 3D Scene — University social media ecosystem
 * Central phone with AziNet UI + orbiting profile nodes + connections
 */
import * as THREE from 'three';
import { createRenderer, createLighting, createEnvMap, lerp, prefersReducedMotion } from './utils.js';

export class AziNetScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.container = canvas.parentElement;
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.isReduced = prefersReducedMotion();
    this.disposed = false;
    this.nodes = [];
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.container.clientWidth / this.container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 1.5, 7);
    this.camera.lookAt(0, 0, 0);

    this.renderer = createRenderer(this.canvas);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    this.envMap = createEnvMap(this.renderer);
    createLighting(this.scene, { accent: 0xa855f7 });
    this.buildScene();
    this.bindEvents();
    this.animate();
  }

  buildScene() {
    this.group = new THREE.Group();

    // === CENTRAL SMARTPHONE ===
    const phoneMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, metalness: 0.9, roughness: 0.1, envMap: this.envMap, envMapIntensity: 1.5,
    });
    this.phone = new THREE.Group();
    const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 0.08), phoneMat);
    this.phone.add(phoneBody);

    // Screen
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a12, emissive: 0x150a25, emissiveIntensity: 0.3,
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 1.85), screenMat);
    screen.position.z = 0.041;
    this.phone.add(screen);

    // === AziNet UI Elements ===
    // Header bar
    const headerMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const header = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.08), headerMat);
    header.position.set(0, 0.8, 0.042);
    this.phone.add(header);

    // "AZINET" text placeholder (thin bars)
    const logoBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.03),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    logoBar.position.set(-0.2, 0.8, 0.043);
    this.phone.add(logoBar);

    // Profile avatar circle
    const avatarGeo = new THREE.CircleGeometry(0.1, 32);
    const avatarMat = new THREE.MeshBasicMaterial({ color: 0x333355 });
    const avatar = new THREE.Mesh(avatarGeo, avatarMat);
    avatar.position.set(-0.3, 0.5, 0.042);
    this.phone.add(avatar);

    // Post blocks
    for (let i = 0; i < 3; i++) {
      // Post card
      const cardMat = new THREE.MeshBasicMaterial({ color: 0x15152a });
      const card = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.35), cardMat);
      card.position.set(0, 0.3 - i * 0.45, 0.042);
      this.phone.add(card);

      // User name line
      const nameLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x555577 })
      );
      nameLine.position.set(-0.2, 0.42 - i * 0.45, 0.043);
      this.phone.add(nameLine);

      // Content lines
      for (let j = 0; j < 2; j++) {
        const contentLine = new THREE.Mesh(
          new THREE.PlaneGeometry(0.7 - j * 0.15, 0.015),
          new THREE.MeshBasicMaterial({ color: 0x333344 })
        );
        contentLine.position.set(0, 0.33 - i * 0.45 - j * 0.06, 0.043);
        this.phone.add(contentLine);
      }

      // Reaction indicators
      const reactionDots = [0xa855f7, 0xf74a4a, 0x4af7a8];
      reactionDots.forEach((color, ri) => {
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.015, 12),
          new THREE.MeshBasicMaterial({ color })
        );
        dot.position.set(-0.3 + ri * 0.06, 0.17 - i * 0.45, 0.043);
        this.phone.add(dot);
      });
    }

    this.phone.rotation.y = 0.15;
    this.phone.rotation.x = -0.05;
    this.group.add(this.phone);

    // === ORBITING PROFILE NODES ===
    const nodeCount = 12;
    for (let i = 0; i < nodeCount; i++) {
      const nodeGroup = new THREE.Group();
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2.5 + Math.random() * 1.5;
      const y = (Math.random() - 0.5) * 3;

      // Avatar sphere
      const colors = [0xa855f7, 0x7c3aed, 0x6d28d9, 0x8b5cf6, 0xc084fc];
      const avatarSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1 + Math.random() * 0.08, 16, 16),
        new THREE.MeshStandardMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          metalness: 0.5, roughness: 0.4,
          emissive: colors[Math.floor(Math.random() * colors.length)],
          emissiveIntensity: 0.15,
        })
      );
      nodeGroup.add(avatarSphere);

      // Avatar ring
      const avatarRing = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.17, 32),
        new THREE.MeshBasicMaterial({
          color: 0xa855f7, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
        })
      );
      nodeGroup.add(avatarRing);

      nodeGroup.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );

      nodeGroup.userData = { angle, radius, y, speed: 0.1 + Math.random() * 0.2 };
      this.nodes.push(nodeGroup);
      this.group.add(nodeGroup);
    }

    // === COMMUNITY CONNECTION WEB ===
    const webMat = new THREE.LineBasicMaterial({
      color: 0xa855f7, transparent: true, opacity: 0.08,
    });

    for (let i = 0; i < this.nodes.length; i++) {
      // Connect to 2-3 nearby nodes
      const connectCount = 2 + Math.floor(Math.random() * 2);
      for (let c = 0; c < connectCount; c++) {
        const j = (i + 1 + c) % this.nodes.length;
        const points = [this.nodes[i].position.clone(), this.nodes[j].position.clone()];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        this.group.add(new THREE.Line(geo, webMat));
      }
    }

    // === FLOATING REACTION PARTICLES ===
    this.particles = [];
    const particleColors = [0xa855f7, 0xf74a4a, 0x4af7a8, 0xf7d94a];
    for (let i = 0; i < 15; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 8),
        new THREE.MeshBasicMaterial({
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
          transparent: true, opacity: 0.6,
        })
      );
      p.position.set(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      );
      p.userData = { speed: 0.2 + Math.random() * 0.5, offset: Math.random() * Math.PI * 2 };
      this.particles.push(p);
      this.group.add(p);
    }

    // === UNIVERSITY BUILDING SILHOUETTE (subtle) ===
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2a, metalness: 0.3, roughness: 0.8, transparent: true, opacity: 0.3,
    });
    const building = new THREE.Group();
    // Main block
    building.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.3), buildingMat));
    // Tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.3), buildingMat);
    tower.position.set(0, 1, 0);
    building.add(tower);
    // Columns
    for (let i = 0; i < 5; i++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), buildingMat);
      col.position.set(-0.8 + i * 0.4, 0, 0.16);
      building.add(col);
    }
    building.position.set(0, -2, -3);
    building.scale.setScalar(0.8);
    this.group.add(building);

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

    // Mouse reaction
    this.group.rotation.y = this.mouse.x * 0.15;
    this.group.rotation.x = this.mouse.y * 0.08;

    // Phone float
    this.phone.position.y = Math.sin(time * 0.4) * 0.08;
    this.phone.rotation.y = 0.15 + Math.sin(time * 0.2) * 0.05;

    // Nodes orbit
    this.nodes.forEach(node => {
      const d = node.userData;
      const newAngle = d.angle + time * d.speed * 0.05 * speed;
      node.position.x = Math.cos(newAngle) * d.radius;
      node.position.z = Math.sin(newAngle) * d.radius;
      node.position.y = d.y + Math.sin(time * d.speed + d.angle) * 0.3;

      // Face camera
      node.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'RingGeometry') {
          child.lookAt(this.camera.position);
        }
      });
    });

    // Floating particles
    this.particles.forEach(p => {
      const d = p.userData;
      p.position.y += Math.sin(time * d.speed + d.offset) * 0.003;
      p.position.x += Math.cos(time * d.speed * 0.5 + d.offset) * 0.002;
      p.material.opacity = 0.3 + Math.sin(time * 2 + d.offset) * 0.3;
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
