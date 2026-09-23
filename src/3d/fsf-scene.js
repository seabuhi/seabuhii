/**
 * FSF GROUP 3D Scene — Travel connectivity
 * Aircraft + globe wireframe + route arcs + destination markers
 */
import * as THREE from 'three';
import { createRenderer, createLighting, createEnvMap, lerp, prefersReducedMotion } from './utils.js';

export class FSFScene {
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
    createLighting(this.scene, { accent: 0x38b4e8 });
    this.buildScene();
    this.bindEvents();
    this.animate();
  }

  buildScene() {
    this.group = new THREE.Group();

    // === GLOBE WIREFRAME ===
    const globeGeo = new THREE.IcosahedronGeometry(2, 3);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.3,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
      envMap: this.envMap,
    });
    this.globe = new THREE.Mesh(globeGeo, globeMat);
    this.group.add(this.globe);

    // Solid inner globe (subtle)
    const innerGlobeMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a, metalness: 0.5, roughness: 0.8, transparent: true, opacity: 0.5,
    });
    const innerGlobe = new THREE.Mesh(new THREE.SphereGeometry(1.95, 32, 32), innerGlobeMat);
    this.group.add(innerGlobe);

    // === DESTINATION MARKERS ===
    // Approximate lat/lon to sphere coords
    const destinations = [
      { name: 'Baku', lat: 40.4, lon: 49.8 },
      { name: 'Istanbul', lat: 41.0, lon: 28.9 },
      { name: 'Dubai', lat: 25.2, lon: 55.2 },
      { name: 'London', lat: 51.5, lon: -0.1 },
      { name: 'Moscow', lat: 55.7, lon: 37.6 },
    ];

    this.markers = [];
    destinations.forEach(dest => {
      const phi = (90 - dest.lat) * (Math.PI / 180);
      const theta = (dest.lon + 180) * (Math.PI / 180);
      const x = -(2) * Math.sin(phi) * Math.cos(theta);
      const y = (2) * Math.cos(phi);
      const z = (2) * Math.sin(phi) * Math.sin(theta);

      // Marker dot
      const markerGeo = new THREE.SphereGeometry(0.05, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xe8a838 });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(x, y, z);
      this.markers.push(marker);
      this.group.add(marker);

      // Marker ring
      const ringGeo = new THREE.RingGeometry(0.08, 0.1, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xe8a838, transparent: true, opacity: 0.4, side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(marker.position);
      ring.lookAt(0, 0, 0);
      this.group.add(ring);
    });

    // === ROUTE ARCS ===
    this.routes = [];
    const routePairs = [[0, 1], [0, 2], [0, 3], [1, 4]]; // Baku to others
    const routeMat = new THREE.LineBasicMaterial({ color: 0x38b4e8, transparent: true, opacity: 0.5 });

    routePairs.forEach(([fromIdx, toIdx]) => {
      const from = this.markers[fromIdx].position;
      const to = this.markers[toIdx].position;

      // Create arc
      const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(3.0); // Push outward for arc

      const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
      const points = curve.getPoints(50);
      const routeGeo = new THREE.BufferGeometry().setFromPoints(points);
      const routeLine = new THREE.Line(routeGeo, routeMat.clone());
      this.routes.push({ line: routeLine, curve });
      this.group.add(routeLine);
    });

    // === AIRCRAFT ===
    this.aircraft = new THREE.Group();

    // Fuselage
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, metalness: 0.9, roughness: 0.15, envMap: this.envMap, envMapIntensity: 1.5,
    });
    const fuselage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.02, 0.5, 8),
      fuselageMat
    );
    fuselage.rotation.z = Math.PI * 0.5;
    this.aircraft.add(fuselage);

    // Wings
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xbbbbbb, metalness: 0.8, roughness: 0.2, envMap: this.envMap,
    });
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.005, 0.35),
      wingMat
    );
    this.aircraft.add(wing);

    // Tail
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 0.005),
      wingMat
    );
    tail.position.set(-0.2, 0.04, 0);
    this.aircraft.add(tail);

    this.aircraft.scale.setScalar(0.8);
    this.group.add(this.aircraft);

    // === LATITUDE / LONGITUDE LINES ===
    const gridMat = new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.15 });

    // Equator
    const eqPoints = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      eqPoints.push(new THREE.Vector3(Math.cos(angle) * 2.01, 0, Math.sin(angle) * 2.01));
    }
    const eqGeo = new THREE.BufferGeometry().setFromPoints(eqPoints);
    this.group.add(new THREE.Line(eqGeo, gridMat));

    // Prime meridian
    const pmPoints = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pmPoints.push(new THREE.Vector3(0, Math.cos(angle) * 2.01, Math.sin(angle) * 2.01));
    }
    const pmGeo = new THREE.BufferGeometry().setFromPoints(pmPoints);
    this.group.add(new THREE.Line(pmGeo, gridMat));

    this.scene.add(this.group);
    this.aircraftT = 0;
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

    // Globe rotation
    this.globe.rotation.y = time * 0.08 * speed + this.mouse.x * 0.3;
    this.group.rotation.x = this.mouse.y * 0.15;

    // Markers pulse
    this.markers.forEach((m, i) => {
      const s = 1 + Math.sin(time * 2 + i) * 0.3;
      m.scale.setScalar(s);
    });

    // Aircraft follows first route
    if (this.routes.length > 0) {
      this.aircraftT += 0.002 * speed;
      if (this.aircraftT > 1) this.aircraftT = 0;

      const routeIdx = Math.floor(time * 0.1) % this.routes.length;
      const route = this.routes[routeIdx];
      const pos = route.curve.getPointAt(this.aircraftT);
      const lookAhead = route.curve.getPointAt(Math.min(this.aircraftT + 0.02, 1));

      this.aircraft.position.copy(pos);
      this.aircraft.lookAt(lookAhead);
    }

    // Route glow animation
    this.routes.forEach((r, i) => {
      r.line.material.opacity = 0.3 + Math.sin(time + i * 0.5) * 0.2;
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
