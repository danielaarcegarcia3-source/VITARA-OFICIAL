import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Same release for runtime, addons and decoders. Local by default for LAN use.
const draco = new DRACOLoader();
draco.setDecoderPath(new URL('../vendor/draco/', document.currentScript?.src || new URL('vendor/vitara-three.js', document.baseURI)).href);
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
window.THREE = THREE;

function fitToHeight(model, size = 8, options = {}) {
  const group = new THREE.Group();
  group.add(model);
  if (options.orientar !== false) {
    const dimensions = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    if (dimensions.x >= dimensions.y && dimensions.x >= dimensions.z) model.rotation.z += Math.PI / 2;
    else if (dimensions.z >= dimensions.y && dimensions.z >= dimensions.x) model.rotation.x -= Math.PI / 2;
  }
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const dimensions = box.getSize(new THREE.Vector3());
  const max = Math.max(dimensions.x, dimensions.y, dimensions.z);
  if (!Number.isFinite(max) || max <= 0) throw new Error('El modelo no contiene geometría visible.');
  model.position.sub(box.getCenter(new THREE.Vector3()));
  group.scale.setScalar(size / max);
  group.updateMatrixWorld(true);
  return group;
}

function orbit(object, canvas, options = {}) {
  const camera = options.camera;
  const original = camera.position.clone();
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = original.length() * 0.5;
  controls.maxDistance = original.length() * 2.5;
  controls.autoRotateSpeed = 0.6;
  controls.autoRotate = options.autoRotate !== false;
  camera.lookAt(0, 0, 0);
  controls.saveState();
  canvas.tabIndex = 0;
  const keyboard = (event) => {
    if (['+', '=', '-'].includes(event.key)) { event.preventDefault(); zoom(event.key === '-' ? 0.9 : 1.1); }
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      if (event.key === 'ArrowLeft') spherical.theta -= 0.12;
      if (event.key === 'ArrowRight') spherical.theta += 0.12;
      if (event.key === 'ArrowUp') spherical.phi -= 0.12;
      if (event.key === 'ArrowDown') spherical.phi += 0.12;
      spherical.makeSafe();
      camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
      controls.update();
    }
  };
  canvas.addEventListener('keydown', keyboard);
  function zoom(factor) {
    const offset = camera.position.clone().sub(controls.target);
    offset.multiplyScalar(1 / factor).clampLength(controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let autoRotate = controls.autoRotate;
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  let visible = true;
  observer.observe(canvas);
  let frame;
  function tick() {
    frame = requestAnimationFrame(tick);
    controls.autoRotate = autoRotate && !reduced.matches && document.documentElement.dataset.movimiento !== 'reducido';
    if (visible && !document.hidden && !document.body.classList.contains('access-locked')) controls.update();
  }
  tick();
  return {
    controls,
    estado: { zoom: 1 },
    despertar() { controls.update(); },
    zoom,
    reencuadrar() { controls.reset(); },
    setAutoRotate(value) { autoRotate = !!value; },
    dispose() { cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); canvas.removeEventListener('keydown', keyboard); }
  };
}

function dispose(object) {
  object.traverse((node) => {
    node.geometry?.dispose();
    for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
      if (!material) continue;
      for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
      material.dispose();
    }
  });
}

window.VitaraGLB = {
  async load(url, onProgress) {
    const gltf = await loader.loadAsync(url, onProgress);
    return { group: gltf.scene, animations: gltf.animations };
  },
  fitToHeight, orbit, dispose,
  lighting(scene) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    scene.add(new THREE.HemisphereLight(0xf1ffff, 0x315462, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(5, 8, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0x5eead4, 1.8);
    rim.position.set(-5, 3, -5); scene.add(rim);
  }
};
