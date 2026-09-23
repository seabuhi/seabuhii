/**
 * SAVELYA 3D Scene — Marketplace transaction flow
 * Smartphone + package + delivery path animation
 */
import * as THREE from 'three';
import { createRenderer, createLighting, createEnvMap, lerp, prefersReducedMotion } from './utils.js';

export class SavelyaScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.container = canvas.parentElement;
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.isReduced = prefersReducedMotion();
    this.disposed = false;
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.container.clientWidth / this.container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 2, 7);
    this.camera.lookAt(0, 0, 0);

    this.renderer = createRenderer(this.canvas);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    this.envMap = createEnvMap(this.renderer);
    createLighting(this.scene);
    this.buildScene();
    this.bindEvents();
    this.animate();
  }

  buildScene() {
    this.group = new THREE.Group();

    // === SMARTPHONE ===
    const phoneMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, metalness: 0.9, roughness: 0.1, envMap: this.envMap, envMapIntensity: 1.5,
    });
    const phoneBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.6, 0.08, 2, 2, 1),
      phoneMat
    );
    // Screen
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a, metalness: 0.1, roughness: 0.8,
      emissive: 0x1a2a3a, emissiveIntensity: 0.3,
    });
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 1.45),
      screenMat
    );
    screen.position.z = 0.041;
    phoneBody.add(screen);

    // UI elements on screen
    const uiBarMat = new THREE.MeshBasicMaterial({ color: 0xe8a838 });
    const uiBar = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.04), uiBarMat);
    uiBar.position.set(0, 0.4, 0.042);
    phoneBody.add(uiBar);

    for (let i = 0; i < 3; i++) {
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.015), lineMat);
      line.position.set(0, 0.1 - i * 0.15, 0.042);
      phoneBody.add(line);
    }

    phoneBody.position.set(-1.5, 0, 0);
    phoneBody.rotation.y = 0.2;
    this.phone = phoneBody;
    this.group.add(phoneBody);

    // === PACKAGE ===
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x8B7355, metalness: 0.1, roughness: 0.8, envMap: this.envMap,
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5, 1, 1, 1), boxMat);

    // Tape
    const tapeMat = new THREE.MeshStandardMaterial({ color: 0xCBB98A, metalness: 0.1, roughness: 0.6 });
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.52), tapeMat);
    tape.position.y = 0.251;
    box.add(tape);

    // Label
    const labelMat = new THREE.MeshBasicMaterial({ color: 0xf5f0eb });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), labelMat);
    label.position.set(0, 0, 0.251);
    box.add(label);

    this.package = box;
    this.group.add(box);

    // === DELIVERY PATH (curve with particles) ===
    const pathPoints = [
      new THREE.Vector3(-1.5, -0.5, 0),
      new THREE.Vector3(-0.5, 0.3, 0.5),
      new THREE.Vector3(0.5, 0.5, -0.3),
      new THREE.Vector3(1.5, -0.3, 0),
    ];
    this.pathCurve = new THREE.CatmullRomCurve3(pathPoints);
    const pathGeo = new THREE.TubeGeometry(this.pathCurve, 60, 0.01, 8, false);
    const pathMat = new THREE.MeshBasicMaterial({ color: 0xe8a838, transparent: true, opacity: 0.4 });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    this.group.add(pathMesh);

    // Delivery dot
    const dotGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xe8a838, emissive: 0xe8a838, emissiveIntensity: 0.6,
    });
    this.deliveryDot = new THREE.Mesh(dotGeo, dotMat);
    this.group.add(this.deliveryDot);

    // === BUYER ICON (right side) ===
    const buyerGroup = new THREE.Group();
    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.5, envMap: this.envMap })
    );
    head.position.y = 0.3;
    buyerGroup.add(head);
    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.15, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.5, envMap: this.envMap })
    );
    buyerGroup.add(body);
    buyerGroup.position.set(2, 0, 0);
    buyerGroup.scale.setScalar(0.8);
    this.group.add(buyerGroup);

    // === FLOW LABELS (floating text-like indicators) ===
    const indicatorMat = new THREE.MeshBasicMaterial({ color: 0xe8a838, transparent: true, opacity: 0.6 });
    const positions = [
      { x: -1.5, y: 1.2 },
      { x: 0, y: 1.0 },
      { x: 1.5, y: 1.2 },
    ];
    positions.forEach(pos => {
      const indicator = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.04), indicatorMat);
      indicator.position.set(pos.x, pos.y, 0);
      this.group.add(indicator);
    });

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

    // Package moves along path
    const t = ((Math.sin(time * 0.4 * speed) + 1) / 2);
    const point = this.pathCurve.getPointAt(t);
    this.package.position.copy(point);
    this.package.rotation.z = Math.sin(time * 0.5) * 0.1;

    // Delivery dot follows ahead
    const dotT = Math.min(t + 0.05, 1);
    const dotPoint = this.pathCurve.getPointAt(dotT);
    this.deliveryDot.position.copy(dotPoint);

    // Mouse reaction
    this.group.rotation.y = this.mouse.x * 0.15;
    this.group.rotation.x = this.mouse.y * 0.1;

    // Phone float
    this.phone.position.y = Math.sin(time * 0.8) * 0.05;

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
