import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BODY_CONFIG = {
  bat: {
    bodyColor: 0x00ff88, helmetColor: 0x004422, shirtColor: 0x003311, accent: 0xffd700,
    scale: 1.0,
  },
  bowl: {
    bodyColor: 0xff6b35, helmetColor: 0x4a1a00, shirtColor: 0x3a1400, accent: 0xffffff,
    scale: 1.05,
  },
  keeper: {
    bodyColor: 0xffd700, helmetColor: 0x4a3800, shirtColor: 0x3a2a00, accent: 0xff6b35,
    scale: 0.95,
  },
  allrounder: {
    bodyColor: 0xe040fb, helmetColor: 0x3a0040, shirtColor: 0x2a0030, accent: 0x40c4ff,
    scale: 1.0,
  },
  captain: {
    bodyColor: 0x40c4ff, helmetColor: 0x002244, shirtColor: 0x001a33, accent: 0xffd700,
    scale: 1.08,
  },
  fielder: {
    bodyColor: 0xff4081, helmetColor: 0x400020, shirtColor: 0x300018, accent: 0x00ff88,
    scale: 0.98,
  },
};

function buildCharacter(config) {
  const group = new THREE.Group();
  const mat = (color, emissive = 0) => new THREE.MeshStandardMaterial({
    color,
    emissive: emissive || color,
    emissiveIntensity: emissive ? 0.2 : 0.05,
    roughness: 0.4,
    metalness: 0.1,
  });

  const s = config.scale ?? 1;

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.07 * s, 0.06 * s, 0.45 * s, 8);
  const legMat = mat(0xcccccc);
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.1 * s, -0.42 * s, 0);
  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.set(0.1 * s, -0.42 * s, 0);
  group.add(legL, legR);

  // Shoes
  const shoeGeo = new THREE.BoxGeometry(0.15 * s, 0.07 * s, 0.18 * s);
  const shoeMat = mat(0x222222);
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(-0.1 * s, -0.65 * s, 0.02 * s);
  const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
  shoeR.position.set(0.1 * s, -0.65 * s, 0.02 * s);
  group.add(shoeL, shoeR);

  // Body (shirt)
  const bodyGeo = new THREE.CapsuleGeometry(0.18 * s, 0.35 * s, 8, 12);
  const bodyMesh = new THREE.Mesh(bodyGeo, mat(config.bodyColor));
  bodyMesh.position.y = 0;
  group.add(bodyMesh);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.055 * s, 0.05 * s, 0.38 * s, 8);
  const armMat = mat(config.bodyColor);
  const armL = new THREE.Mesh(armGeo, armMat);
  armL.position.set(-0.27 * s, 0.02 * s, 0);
  armL.rotation.z = 0.3;
  const armR = new THREE.Mesh(armGeo, armMat);
  armR.position.set(0.27 * s, 0.02 * s, 0);
  armR.rotation.z = -0.3;
  group.add(armL, armR);

  // Hands
  const handGeo = new THREE.SphereGeometry(0.06 * s, 8, 8);
  const handMat = mat(0xf5cba7);
  const handL = new THREE.Mesh(handGeo, handMat);
  handL.position.set(-0.32 * s, -0.17 * s, 0);
  const handR = new THREE.Mesh(handGeo, handMat);
  handR.position.set(0.32 * s, -0.17 * s, 0);
  group.add(handL, handR);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.07 * s, 0.08 * s, 0.1 * s, 8);
  const neckMesh = new THREE.Mesh(neckGeo, mat(0xf5cba7));
  neckMesh.position.y = 0.3 * s;
  group.add(neckMesh);

  // Head
  const headGeo = new THREE.SphereGeometry(0.17 * s, 12, 12);
  const headMesh = new THREE.Mesh(headGeo, mat(0xf5cba7));
  headMesh.position.y = 0.53 * s;
  group.add(headMesh);

  // Helmet
  const helmetGeo = new THREE.SphereGeometry(0.185 * s, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const helmetMesh = new THREE.Mesh(helmetGeo, mat(config.helmetColor));
  helmetMesh.position.y = 0.53 * s;
  group.add(helmetMesh);

  // Helmet visor
  const visorGeo = new THREE.BoxGeometry(0.25 * s, 0.04 * s, 0.15 * s);
  const visorMesh = new THREE.Mesh(visorGeo, mat(config.accent));
  visorMesh.position.set(0, 0.48 * s, 0.13 * s);
  group.add(visorMesh);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.025 * s, 6, 6);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffffff, emissiveIntensity: 0.3 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.065 * s, 0.54 * s, 0.14 * s);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.065 * s, 0.54 * s, 0.14 * s);
  group.add(eyeL, eyeR);

  // Bat (for batsman) or ball glow for bowler
  if (config === BODY_CONFIG.bat || config === BODY_CONFIG.captain) {
    const batGeo = new THREE.BoxGeometry(0.05 * s, 0.45 * s, 0.12 * s);
    const batMat = new THREE.MeshStandardMaterial({ color: 0xd4a855, roughness: 0.7 });
    const batMesh = new THREE.Mesh(batGeo, batMat);
    batMesh.position.set(0.38 * s, -0.12 * s, 0);
    batMesh.rotation.z = -0.5;
    group.add(batMesh);
  }

  return group;
}

export default function Avatar3D({ avatarId, size = 200, rotating = true, selected = false }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const config = BODY_CONFIG[avatarId] || BODY_CONFIG.bat;
    const w = size;
    const h = size;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0.2, 2.5);
    camera.lookAt(0, 0.1, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: mountRef.current,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 4, 3);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const neonLight = new THREE.PointLight(config.bodyColor, 2, 4);
    neonLight.position.set(-1, 1, 1);
    scene.add(neonLight);

    const rimLight = new THREE.PointLight(0x40c4ff, 0.8, 5);
    rimLight.position.set(1, -1, -2);
    scene.add(rimLight);

    // Character
    const character = buildCharacter(config);
    character.position.y = -0.3;
    scene.add(character);

    sceneRef.current = { scene, camera, renderer, character };

    // Animation loop
    let angle = 0;
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (rotating) {
        angle += 0.015;
        character.rotation.y = angle;
      }
      // Gentle bob
      character.position.y = -0.3 + Math.sin(Date.now() * 0.001) * 0.04;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
    };
  }, [avatarId, size, rotating]);

  return (
    <canvas
      ref={mountRef}
      width={size}
      height={size}
      className={`rounded-xl transition-all duration-300 ${
        selected ? 'ring-4 ring-pitch-400 shadow-[0_0_25px_rgba(0,255,136,0.5)]' : ''
      }`}
      style={{ display: 'block' }}
    />
  );
}
