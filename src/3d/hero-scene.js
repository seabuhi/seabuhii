/**
 * Hero 3D Scene — Precision-engineered "Digital Core" object
 * A gyroscopic architectural device with rotating ring structures
 */
import * as THREE from 'three';
import { createRenderer, createLighting, createEnvMap, lerp, prefersReducedMotion } from './utils.js';

export class HeroScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.container = canvas.parentElement;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scroll = 0;
    this.isReduced = prefersReducedMotion();
    this.disposed = false;

    this.init();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(35, this.container.clientWidth / this.container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 0, 8);

    // Renderer
    this.renderer = createRenderer(this.canvas);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    // Environment map
    this.envMap = createEnvMap(this.renderer);

    // Lighting
    this.lights = createLighting(this.scene);

    // Build the core object
    this.buildCore();

    // Events
    this.bindEvents();

    // Start
    this.animate();
  }

  buildCore() {
    this.coreGroup = new THREE.Group();

    // === CENTRAL BODY — chamfered octagonal prism ===
    const bodyGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 8, 1);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.15,
      envMap: this.envMap,
      envMapIntensity: 1.5,
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.coreGroup.add(this.body);

    // === INNER GLOWING CORE ===
    const coreInnerGeo = new THREE.IcosahedronGeometry(0.4, 2);
    const coreInnerMat = new THREE.MeshStandardMaterial({
      color: 0xe8a838,
      metalness: 0.3,
      roughness: 0.4,
      emissive: 0xe8a838,
      emissiveIntensity: 0.3,
      envMap: this.envMap,
    });
    this.coreInner = new THREE.Mesh(coreInnerGeo, coreInnerMat);
    this.coreGroup.add(this.coreInner);

    // === OUTER RING 1 — large gyroscope ring ===
    const ring1Geo = new THREE.TorusGeometry(1.8, 0.03, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.95,
      roughness: 0.1,
      envMap: this.envMap,
      envMapIntensity: 2.0,
    });
    this.ring1 = new THREE.Mesh(ring1Geo, ringMat);
    this.ring1.rotation.x = Math.PI * 0.5;
    this.coreGroup.add(this.ring1);

    // === OUTER RING 2 — tilted ===
    const ring2Geo = new THREE.TorusGeometry(2.1, 0.02, 16, 120);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.15,
      envMap: this.envMap,
      envMapIntensity: 1.8,
    });
    this.ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    this.ring2.rotation.x = Math.PI * 0.35;
    this.ring2.rotation.z = Math.PI * 0.15;
    this.coreGroup.add(this.ring2);

    // === OUTER RING 3 — opposite tilt ===
    const ring3Geo = new THREE.TorusGeometry(2.4, 0.015, 16, 140);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.85,
      roughness: 0.2,
      envMap: this.envMap,
      envMapIntensity: 1.5,
    });
    this.ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    this.ring3.rotation.x = Math.PI * 0.7;
    this.ring3.rotation.y = Math.PI * 0.25;
    this.coreGroup.add(this.ring3);

    // === FLOATING MEASUREMENT NODES ===
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xe8a838,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0xe8a838,
      emissiveIntensity: 0.15,
    });

    for (let i = 0; i < 6; i++) {
      const nodeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (i / 6) * Math.PI * 2;
      const radius = 2.6 + Math.random() * 0.5;
      node.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 1.5,
        Math.sin(angle) * radius
      );
      node.userData = { angle, radius, speed: 0.2 + Math.random() * 0.3, offset: Math.random() * Math.PI * 2 };
      this.coreGroup.add(node);
    }

    // === THIN TECHNICAL LINES ===
    const lineMat = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.4 });
    for (let i = 0; i < 8; i++) {
      const points = [];
      const angle = (i / 8) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * 1.3, 0, Math.sin(angle) * 1.3));
      points.push(new THREE.Vector3(Math.cos(angle) * 3.0, (Math.random() - 0.5) * 0.5, Math.sin(angle) * 3.0));
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeo, lineMat);
      this.coreGroup.add(line);
    }

    this.scene.add(this.coreGroup);
  }

  bindEvents() {
    this._onMouseMove = (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    this._onTouchMove = (e) => {
      if (e.touches.length > 0) {
        this.mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        this.mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    };

    this._onScroll = () => {
      this.scroll = window.scrollY / window.innerHeight;
    };

    this._onResize = () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('touchmove', this._onTouchMove, { passive: true });
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onResize);
  }

  animate() {
    if (this.disposed) return;

    const time = performance.now() * 0.001;
    const speed = this.isReduced ? 0.05 : 1;

    // Smooth mouse following
    this.mouse.x = lerp(this.mouse.x, this.mouse.targetX, 0.05);
    this.mouse.y = lerp(this.mouse.y, this.mouse.targetY, 0.05);

    // Core rotation
    this.coreGroup.rotation.y = time * 0.1 * speed + this.mouse.x * 0.3;
    this.coreGroup.rotation.x = Math.sin(time * 0.15) * 0.1 * speed + this.mouse.y * 0.2;

    // Ring rotations
    this.ring1.rotation.z = time * 0.3 * speed;
    this.ring2.rotation.y = time * 0.2 * speed;
    this.ring3.rotation.z = -time * 0.15 * speed;

    // Inner core pulse
    const pulse = 1 + Math.sin(time * 2) * 0.05;
    this.coreInner.scale.setScalar(pulse);
    this.coreInner.rotation.y = time * 0.5;
    this.coreInner.rotation.x = time * 0.3;

    // Floating nodes
    this.coreGroup.children.forEach(child => {
      if (child.userData && child.userData.speed) {
        const d = child.userData;
        child.position.y = Math.sin(time * d.speed + d.offset) * 0.8;
      }
    });

    // Scroll-based camera shift
    this.camera.position.z = 8 - this.scroll * 2;
    this.camera.position.y = this.scroll * 0.5;

    // Render
    this.renderer.render(this.scene, this.camera);

    this.rafId = requestAnimationFrame(() => this.animate());
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('touchmove', this._onTouchMove);
    window.removeEventListener('scroll', this._onScroll);
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
