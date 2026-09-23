/**
 * 3D Utilities — Shared helpers for Three.js scenes
 */
import * as THREE from 'three';

/**
 * Create a standard PBR material
 */
export function createMaterial(options = {}) {
  const defaults = {
    color: 0xf5f0eb,
    metalness: 0.8,
    roughness: 0.3,
    envMapIntensity: 1.0,
  };
  return new THREE.MeshStandardMaterial({ ...defaults, ...options });
}

/**
 * Create standard lighting setup
 */
export function createLighting(scene, options = {}) {
  const { intensity = 1, accent = 0xe8a838 } = options;

  // Ambient
  const ambient = new THREE.AmbientLight(0xffffff, 0.15 * intensity);
  scene.add(ambient);

  // Main directional
  const main = new THREE.DirectionalLight(0xf5f0eb, 0.8 * intensity);
  main.position.set(5, 8, 5);
  main.castShadow = true;
  scene.add(main);

  // Fill
  const fill = new THREE.DirectionalLight(0x8a8580, 0.3 * intensity);
  fill.position.set(-3, 2, -5);
  scene.add(fill);

  // Accent
  const accentLight = new THREE.PointLight(accent, 0.4 * intensity, 20);
  accentLight.position.set(2, -3, 3);
  scene.add(accentLight);

  return { ambient, main, fill, accentLight };
}

/**
 * Create renderer with optimal settings
 */
export function createRenderer(canvas, options = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    ...options,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

/**
 * Handle resize for a scene
 */
export function handleResize(container, camera, renderer) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

/**
 * Smooth lerp
 */
export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

/**
 * Map value from one range to another
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Detect WebGL support
 */
export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

/**
 * Check for reduced motion preference
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Create a rounded box geometry (chamfered)
 */
export function createRoundedBox(width, height, depth, radius, segments) {
  const shape = new THREE.Shape();
  const w = width / 2 - radius;
  const h = height / 2 - radius;

  shape.moveTo(-w, -height / 2);
  shape.lineTo(w, -height / 2);
  shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -h);
  shape.lineTo(width / 2, h);
  shape.quadraticCurveTo(width / 2, height / 2, w, height / 2);
  shape.lineTo(-w, height / 2);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, h);
  shape.lineTo(-width / 2, -h);
  shape.quadraticCurveTo(-width / 2, -height / 2, -w, -height / 2);

  const extrudeSettings = {
    depth: depth,
    bevelEnabled: true,
    bevelSize: radius * 0.5,
    bevelThickness: radius * 0.5,
    bevelSegments: segments || 3,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  return geometry;
}

/**
 * Create environment map from colors
 */
export function createEnvMap(renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene();

  // Simple gradient environment
  scene.background = new THREE.Color(0x111111);

  const envLight1 = new THREE.DirectionalLight(0xf5f0eb, 0.5);
  envLight1.position.set(1, 1, 1);
  scene.add(envLight1);

  const envLight2 = new THREE.DirectionalLight(0xe8a838, 0.2);
  envLight2.position.set(-1, -1, -1);
  scene.add(envLight2);

  const envMap = pmremGenerator.fromScene(scene, 0.04).texture;
  pmremGenerator.dispose();

  return envMap;
}
