import * as THREE from "./vendor/three.module.min.js";
import { OrbitControls } from "./vendor/OrbitControls.js";

const container = document.getElementById("car3d");
if (container) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(5.2, 3, 5.6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.75, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.4;
  controls.minDistance = 4;
  controls.maxDistance = 10;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.35;
  controls.enablePan = false;
  controls.update();

  controls.addEventListener("start", () => (controls.autoRotate = false));

  scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x0a0a0c, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x45b8e8, 0.7);
  rim.position.set(-5, 3, -4);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(6, 48),
    new THREE.MeshStandardMaterial({ color: 0x0b0d11, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  const ringGeo = new THREE.RingGeometry(2.15, 2.35, 64);
  const ring = new THREE.Mesh(
    ringGeo,
    new THREE.MeshBasicMaterial({ color: 0x45b8e8, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  scene.add(ring);

  const car = new THREE.Group();
  scene.add(car);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc9cfd6, metalness: 0.55, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b1e24, metalness: 0.3, roughness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2530, metalness: 0.6, roughness: 0.15 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0e0f12, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x9aa5b5, metalness: 0.8, roughness: 0.3 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe28a, emissiveIntensity: 1.1 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff6b5c, emissive: 0xb02418, emissiveIntensity: 0.8 });

  function box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    return m;
  }

  const lowerBody = box(4.3, 0.75, 1.85, bodyMat, 0, 0.72, 0);
  lowerBody.geometry.translate(0, 0, 0);
  car.add(lowerBody);

  const cabin = box(2.35, 0.72, 1.7, bodyMat, -0.15, 1.38, 0);
  car.add(cabin);

  const hoodBump = box(1.1, 0.14, 1.7, bodyMat, 1.55, 1.14, 0);
  car.add(hoodBump);

  const bumperF = box(0.28, 0.5, 1.9, darkMat, 2.12, 0.55, 0);
  car.add(bumperF);
  const bumperR = box(0.28, 0.5, 1.9, darkMat, -2.12, 0.55, 0);
  car.add(bumperR);

  const grille = box(0.06, 0.3, 1.2, darkMat, 2.27, 0.62, 0);
  car.add(grille);

  const windshieldF = box(0.08, 0.62, 1.55, glassMat, 0.98, 1.42, 0);
  windshieldF.rotation.z = -0.32;
  car.add(windshieldF);

  const windshieldR = box(0.08, 0.6, 1.55, glassMat, -1.28, 1.4, 0);
  windshieldR.rotation.z = 0.28;
  car.add(windshieldR);

  const sideGlassL = box(1.55, 0.5, 0.04, glassMat, -0.15, 1.42, 0.87);
  car.add(sideGlassL);
  const sideGlassR = box(1.55, 0.5, 0.04, glassMat, -0.15, 1.42, -0.87);
  car.add(sideGlassR);

  const roofRail = box(2.2, 0.08, 1.78, darkMat, -0.15, 1.76, 0);
  car.add(roofRail);

  const mirrorL = box(0.12, 0.12, 0.28, darkMat, 0.75, 1.35, 1.0);
  car.add(mirrorL);
  const mirrorR = box(0.12, 0.12, 0.28, darkMat, 0.75, 1.35, -1.0);
  car.add(mirrorR);

  [
    [2.05, 0.72, 0.72],
    [2.05, 0.72, -0.72],
  ].forEach(([x, y, z]) => car.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), lightMat).translateX(x).translateY(y).translateZ(z)));

  [
    [-2.05, 0.72, 0.72],
    [-2.05, 0.72, -0.72],
  ].forEach(([x, y, z]) => car.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), tailMat).translateX(x).translateY(y).translateZ(z)));

  const wheelPositions = [
    [1.42, 0.46, 1.0],
    [1.42, 0.46, -1.0],
    [-1.42, 0.46, 1.0],
    [-1.42, 0.46, -1.0],
  ];
  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24), tireMat);
    tire.rotation.x = Math.PI / 2;
    wheel.add(tire);
    const rimMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.34, 16), rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    wheel.add(rimMesh);
    wheel.position.set(x, y, z);
    car.add(wheel);
  });

  car.position.y = 0;

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  new ResizeObserver(resize).observe(container);
  resize();

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}
