import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { fetchPrivateWishes } from '../api.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import confetti from 'canvas-confetti';

export default function PrivateHeartPage() {
  const { selectedSister, navigateWithFlowerTransition } = useApp();
  const sisterName = selectedSister ? selectedSister.name : 'Chị Lan Anh';

  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const autoRotateRef = useRef(false);
  autoRotateRef.current = autoRotate;

  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);
  messagesRef.current = messages;

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'winged_letter' | 'heart'
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [readingMessage, setReadingMessage] = useState(null);
  const [hasClickedCart, setHasClickedCart] = useState(false);
  const [activeCamPreset, setActiveCamPreset] = useState('scenic');

  // 1. Tải danh sách thư riêng cá nhân hóa
  useEffect(() => {
    async function loadPrivate() {
      const sisterId = selectedSister ? selectedSister.id : 'lan_anh';
      const res = await fetchPrivateWishes(sisterId, '2010');
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
      }
    }
    loadPrivate();
  }, [selectedSister]);

  // 2. Chuyển đổi góc nhìn Camera (Cinematic Presets)
  const setCameraPreset = (preset) => {
    setActiveCamPreset(preset);
    if (!cameraRef.current || !controlsRef.current) return;

    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    let targetCamPos = new THREE.Vector3(0, 4.2, 11);
    let targetLookAt = new THREE.Vector3(0, 1.2, -0.5);

    if (preset === 'cart') {
      targetCamPos = new THREE.Vector3(3.2, 2.2, 4.2);
      targetLookAt = new THREE.Vector3(0, 1.5, -0.5);
    } else if (preset === 'letters') {
      targetCamPos = new THREE.Vector3(-2.6, 3.4, 3.8);
      targetLookAt = new THREE.Vector3(-0.8, 2.8, 0.2);
    } else if (preset === 'top') {
      targetCamPos = new THREE.Vector3(0, 10.5, 5.5);
      targetLookAt = new THREE.Vector3(0, 0.5, 0);
    }

    // Smooth transition
    const startCamPos = cam.position.clone();
    const startLookAt = ctrl.target.clone();
    let progress = 0;

    function animCam() {
      progress += 0.04;
      cam.position.lerpVectors(startCamPos, targetCamPos, progress);
      ctrl.target.lerpVectors(startLookAt, targetLookAt, progress);
      ctrl.update();

      if (progress < 1) {
        requestAnimationFrame(animCam);
      }
    }
    animCam();
  };

  // 3. Khởi tạo Thế Giới 3D Vườn Hoa & Xe Chở Thư (Three.js + OrbitControls)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth || 1200;
    const height = container.clientHeight || window.innerHeight || 800;

    // --- Scene & Atmospheric Fog ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#180918');
    scene.fog = new THREE.FogExp2('#180918', 0.02);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 11);
    cameraRef.current = camera;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // --- OrbitControls (Cho phép kéo chuột xoay 360 độ, cuộn phóng to thu nhỏ) ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.2, -0.5);
    controls.minDistance = 3.2;
    controls.maxDistance = 24.0;
    controls.minPolarAngle = Math.PI / 12; // Không nhìn thẳng từ trên xuống quá đà
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Không chui xuống dưới lòng đất
    controlsRef.current = controls;

    // --- Lighting Architecture (Cinematic Lighting) ---
    const ambientLight = new THREE.AmbientLight(0xffe4e6, 1.15);
    scene.add(ambientLight);

    // Key sunlight/moonlight
    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    keyLight.position.set(8, 16, 10);
    scene.add(keyLight);

    // Back rim light (Tạo viền sáng thơ mộng trên hoa và thành xe)
    const rimLight = new THREE.DirectionalLight(0xc084fc, 1.1);
    rimLight.position.set(-10, 8, -12);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xffd1dc, 0x1f1124, 0.7);
    scene.add(hemiLight);

    // --- 1. Sculpted Rolling Grassy Meadow ---
    const groundGeo = new THREE.PlaneGeometry(55, 55, 48, 48);
    groundGeo.rotateX(-Math.PI / 2);
    const groundPos = groundGeo.attributes.position;

    for (let i = 0; i < groundPos.count; i++) {
      const x = groundPos.getX(i);
      const z = groundPos.getZ(i);
      // Central valley where the road winds
      const roadCurve = -Math.sin(z * 0.16) * 1.8;
      const distFromRoad = Math.abs(x - roadCurve);
      let y = 0;
      if (distFromRoad > 2.6) {
        y = (distFromRoad - 2.6) * 0.24 + Math.sin(x * 0.28) * Math.cos(z * 0.28) * 0.45;
      }
      groundPos.setY(i, y);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1d3623, // Emerald velvet mossy grass
      roughness: 0.85,
      metalness: 0.05
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    scene.add(groundMesh);

    // --- 2. Curved Cobblestone Pathway (65 Pavers with Heart Engravings) ---
    const roadGroup = new THREE.Group();
    const stoneGeo = new THREE.BoxGeometry(1.65, 0.12, 1.15);
    const stoneColors = [0xded4c5, 0xc9b095, 0x937c68, 0xbfa385, 0xa58970];

    for (let z = -20; z <= 14; z += 0.8) {
      const curveX = -Math.sin(z * 0.16) * 1.8;
      const stoneMat = new THREE.MeshStandardMaterial({
        color: stoneColors[Math.floor(Math.random() * stoneColors.length)],
        roughness: 0.72
      });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(
        curveX + (Math.random() - 0.5) * 0.45,
        0.06 + Math.random() * 0.03,
        z + (Math.random() - 0.5) * 0.25
      );
      stone.rotation.y = (Math.random() - 0.5) * 0.28;
      roadGroup.add(stone);

      // Thỉnh thoảng có 1 viên đá phát sáng hình trái tim 20/10
      if (Math.abs(z) % 4 === 0) {
        const heartGlow = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.05, 8),
          new THREE.MeshStandardMaterial({ color: 0xfda4af, emissive: 0xf43f5e, roughness: 0.3 })
        );
        heartGlow.position.set(stone.position.x, 0.13, stone.position.z);
        roadGroup.add(heartGlow);
      }
    }
    scene.add(roadGroup);

    // --- 3. Split-Rail Wooden Fences with Climbing Roses along Road ---
    const fenceGroup = new THREE.Group();
    const postGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.3, 6);
    const railGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.8, 6);
    railGeo.rotateZ(Math.PI / 2);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.85 });

    for (let z = -16; z <= 12; z += 3.2) {
      const curveX = -Math.sin(z * 0.16) * 1.8;
      const fenceX = curveX - 2.8;

      const p1 = new THREE.Mesh(postGeo, woodMat);
      p1.position.set(fenceX, 0.65, z);
      fenceGroup.add(p1);

      const r1 = new THREE.Mesh(railGeo, woodMat);
      r1.position.set(fenceX, 0.85, z + 1.4);
      fenceGroup.add(r1);

      const r2 = new THREE.Mesh(railGeo, woodMat);
      r2.position.set(fenceX, 0.45, z + 1.4);
      fenceGroup.add(r2);
    }
    scene.add(fenceGroup);

    // --- 4. Handcrafted 3D Flower Garden (200+ Swaying Flowers of 5 Species) ---
    const flowersGroup = new THREE.Group();
    const stemGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.8, 5);
    stemGeo.translate(0, 0.4, 0);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x245520, roughness: 0.8 });

    // Species Geometries
    const rosePetalGeo = new THREE.SphereGeometry(0.18, 7, 7);
    const lilyTrumpetGeo = new THREE.ConeGeometry(0.2, 0.38, 7);
    lilyTrumpetGeo.rotateX(Math.PI);
    const bellGeo = new THREE.SphereGeometry(0.12, 6, 6);

    const flowerPalettes = [
      { color: 0xe11d48, emissive: 0x4c0519 }, // Deep Velvet Rose
      { color: 0xf43f5e, emissive: 0x50071c }, // Romantic Pink Rose
      { color: 0xfda4af, emissive: 0x3d0a1b }, // Blush Blossom
      { color: 0xfcd34d, emissive: 0x572202 }, // Golden Champagne Lily
      { color: 0xc084fc, emissive: 0x3b0764 }  // Lilac Fairy Bell
    ];

    const flowersList = [];
    const numFlowers = 180;

    for (let i = 0; i < numFlowers; i++) {
      const flGroup = new THREE.Group();

      // Stem
      const stem = new THREE.Mesh(stemGeo, stemMat);
      flGroup.add(stem);

      // Head
      const pal = flowerPalettes[Math.floor(Math.random() * flowerPalettes.length)];
      const headMat = new THREE.MeshStandardMaterial({
        color: pal.color,
        emissive: pal.emissive,
        roughness: 0.55
      });

      const flowerType = i % 3;
      if (flowerType === 0) {
        // Multi-layered Rose
        const cHead = new THREE.Mesh(rosePetalGeo, headMat);
        cHead.position.y = 0.8;
        flGroup.add(cHead);
        // Outer petals
        for (let p = 0; p < 4; p++) {
          const petal = new THREE.Mesh(rosePetalGeo, headMat);
          petal.scale.set(0.6, 0.6, 0.3);
          petal.position.set(Math.cos(p * 1.57) * 0.12, 0.78, Math.sin(p * 1.57) * 0.12);
          flGroup.add(petal);
        }
      } else if (flowerType === 1) {
        // Golden Lily
        const lHead = new THREE.Mesh(lilyTrumpetGeo, headMat);
        lHead.position.y = 0.82;
        flGroup.add(lHead);
      } else {
        // Fairy Bell Spikes
        for (let b = 0; b < 3; b++) {
          const bell = new THREE.Mesh(bellGeo, headMat);
          bell.position.set(0, 0.55 + b * 0.16, 0.08);
          flGroup.add(bell);
        }
      }

      // Positioning
      const side = Math.random() > 0.5 ? 1 : -1;
      const zPos = (Math.random() - 0.5) * 36;
      const roadCenter = -Math.sin(zPos * 0.16) * 1.8;
      const distFromRoad = 1.4 + Math.random() * 9.5;
      const xPos = roadCenter + side * distFromRoad;

      const dist = Math.abs(xPos + Math.sin(zPos * 0.16) * 1.8);
      const yPos = dist > 2.6 ? (dist - 2.6) * 0.24 : 0;

      flGroup.position.set(xPos, yPos, zPos);
      flGroup.rotation.y = Math.random() * Math.PI * 2;
      flowersGroup.add(flGroup);

      flowersList.push({
        group: flGroup,
        speed: 1.8 + Math.random() * 1.5,
        offset: Math.random() * Math.PI * 2
      });
    }
    scene.add(flowersGroup);

    // --- 5. Gnarled Fairy Cherry Blossom Trees (6 Trees) ---
    const treeGroup = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.32, 0.55, 3.6, 6);
    trunkGeo.translate(0, 1.8, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x482816, roughness: 0.92 });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0x831843,
      roughness: 0.7
    });

    const treePositions = [
      { x: -12, z: -10 },
      { x: 13, z: -14 },
      { x: -14, z: 8 },
      { x: 12, z: 6 },
      { x: -8, z: 16 },
      { x: 9, z: -4 }
    ];

    treePositions.forEach(tPos => {
      const tree = new THREE.Group();
      tree.add(new THREE.Mesh(trunkGeo, trunkMat));

      // 4 Overlapping spheres for fluffy canopy
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.8, 7, 7), canopyMat);
      c1.position.set(0, 4.2, 0);
      tree.add(c1);

      const c2 = new THREE.Mesh(new THREE.SphereGeometry(1.3, 6, 6), canopyMat);
      c2.position.set(1.1, 3.6, 0.5);
      tree.add(c2);

      const c3 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 6), canopyMat);
      c3.position.set(-1.0, 3.8, -0.6);
      tree.add(c3);

      const c4 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 6), canopyMat);
      c4.position.set(0.3, 4.8, -0.4);
      tree.add(c4);

      tree.position.set(tPos.x, 1.2, tPos.z);
      treeGroup.add(tree);
    });
    scene.add(treeGroup);

    // --- 6. Roadside Fairy Stone & Iron Lanterns with Warm PointLights ---
    const lanternsList = [];
    const lampPositions = [
      { x: -2.8, z: -5 },
      { x: 2.8, z: 3 },
      { x: -3.2, z: 10 }
    ];
    lampPositions.forEach((lp, idx) => {
      const lamp = new THREE.Group();
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 3.4, 6),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
      );
      post.position.y = 1.7;
      lamp.add(post);

      const lGlass = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.48, 0.38),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, roughness: 0.2 })
      );
      lGlass.position.y = 3.3;
      lamp.add(lGlass);

      const pLight = new THREE.PointLight(0xfbbf24, 2.2, 9);
      pLight.position.y = 3.3;
      lamp.add(pLight);

      lamp.position.set(lp.x, 0, lp.z);
      scene.add(lamp);
      lanternsList.push({ pLight, offset: idx });
    });

    // --- 7. The Elaborate Animated Victorian Carriage (Xe Hoa Động & Cực Kỳ Tinh Xảo) ---
    const cartRoot = new THREE.Group();
    cartRoot.position.set(0, 0.28, -0.5);
    cartRoot.rotation.y = 0.28;

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfaf3ea, roughness: 0.35 });
    const wineMat = new THREE.MeshStandardMaterial({ color: 0x8c2f4b, roughness: 0.45 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a66b, metalness: 0.75, roughness: 0.28 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c3822, roughness: 0.85 });

    // Chassis Coach Box
    const coachBody = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.8, 2.3), bodyMat);
    coachBody.position.y = 1.25;
    cartRoot.add(coachBody);

    // Decorative Burgundy Lower Panels & Gold Trim
    const sidePanelL = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.95, 0.08), wineMat);
    sidePanelL.position.set(0, 1.25, 1.17);
    cartRoot.add(sidePanelL);

    const sidePanelR = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.95, 0.08), wineMat);
    sidePanelR.position.set(0, 1.25, -1.17);
    cartRoot.add(sidePanelR);

    // Gold filigree moldings
    const moldingTopL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 0.1), goldMat);
    moldingTopL.position.set(0, 1.74, 1.18);
    cartRoot.add(moldingTopL);

    const moldingTopR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 0.1), goldMat);
    moldingTopR.position.set(0, 1.74, -1.18);
    cartRoot.add(moldingTopR);

    // Driver Tufted Bench (Crimson Velvet)
    const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.8), wineMat);
    seatBase.position.set(2.1, 1.4, 0);
    cartRoot.add(seatBase);

    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 1.8), wineMat);
    seatBack.position.set(1.7, 1.9, 0);
    cartRoot.add(seatBack);

    // Brass Dashboard & Bell
    const dashPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), goldMat);
    dashPost.position.set(2.4, 1.85, 0.4);
    cartRoot.add(dashPost);

    const bellMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 8), goldMat);
    bellMesh.position.set(2.4, 2.32, 0.4);
    cartRoot.add(bellMesh);

    // Canopy Awning (Arched fabric with striped cream & rose, scalloped valance fringe)
    const canopyRoof = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.35, 4.0, 20, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xfff1f2, roughness: 0.5 })
    );
    canopyRoof.rotation.z = Math.PI / 2;
    canopyRoof.position.set(0, 2.9, 0);
    cartRoot.add(canopyRoof);

    // Canopy Valance Fringe (Scalloped edge around canopy)
    const valanceL = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.25, 0.06), wineMat);
    valanceL.position.set(0, 2.82, 1.35);
    cartRoot.add(valanceL);

    const valanceR = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.25, 0.06), wineMat);
    valanceR.position.set(0, 2.82, -1.35);
    cartRoot.add(valanceR);

    // 4 Fluted Golden Columns wrapped with Twisting Ivy Vines
    const poleGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.25, 8);
    const polePositions = [
      { x: -1.7, z: 1.05 },
      { x: 1.7, z: 1.05 },
      { x: -1.7, z: -1.05 },
      { x: 1.7, z: -1.05 }
    ];
    polePositions.forEach(pp => {
      const pole = new THREE.Mesh(poleGeo, goldMat);
      pole.position.set(pp.x, 2.45, pp.z);
      cartRoot.add(pole);
    });

    // Twinkling Fairy Light Garland (16 Glowing Mini Orbs along the canopy)
    const fairyLightsList = [];
    const fairyOrbGeo = new THREE.SphereGeometry(0.06, 6, 6);
    for (let f = 0; f < 16; f++) {
      const fMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        roughness: 0.2
      });
      const orb = new THREE.Mesh(fairyOrbGeo, fMat);
      const orbX = -1.8 + (f / 15) * 3.6;
      const orbZ = (f % 2 === 0 ? 1 : -1) * 1.36;
      orb.position.set(orbX, 2.78 + Math.sin(f * 0.8) * 0.06, orbZ);
      cartRoot.add(orb);
      fairyLightsList.push({ orb, offset: f });
    }

    // 4 Victorian Carriage Spoke Wheels with Working Leaf Springs
    const animatedWheels = [];
    const wheelRimGeo = new THREE.TorusGeometry(0.78, 0.065, 8, 24);
    const wheelHubGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.22, 10);
    wheelHubGeo.rotateX(Math.PI / 2);
    const spokeGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.5, 4);

    const wheelPos = [
      { x: -1.35, z: 1.25 },
      { x: 1.35, z: 1.25 },
      { x: -1.35, z: -1.25 },
      { x: 1.35, z: -1.25 }
    ];

    wheelPos.forEach(wp => {
      const wheelGroup = new THREE.Group();
      wheelGroup.add(new THREE.Mesh(wheelRimGeo, goldMat));
      wheelGroup.add(new THREE.Mesh(wheelHubGeo, wineMat));

      // 6 Crossed Spokes (12 spokes total)
      for (let s = 0; s < 6; s++) {
        const spoke = new THREE.Mesh(spokeGeo, goldMat);
        spoke.rotation.z = (s * Math.PI) / 6;
        wheelGroup.add(spoke);
      }

      // Wheel Mount with Leaf Spring
      const wheelAssembly = new THREE.Group();
      wheelAssembly.position.set(wp.x, 0.78, wp.z);
      wheelAssembly.add(wheelGroup);

      // Curved steel leaf spring above axle
      const leafSpring = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.15), darkWoodMat);
      leafSpring.position.set(0, 0.65, 0);
      wheelAssembly.add(leafSpring);

      cartRoot.add(wheelAssembly);
      animatedWheels.push(wheelGroup);
    });

    // Overflowing Cargo: Flower Baskets, Wooden Crates & Roses
    const basketGeo = new THREE.BoxGeometry(1.0, 0.55, 0.8);
    const basketMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });

    const b1 = new THREE.Mesh(basketGeo, basketMat);
    b1.position.set(-1.1, 2.3, 0.55);
    cartRoot.add(b1);

    const b2 = new THREE.Mesh(basketGeo, basketMat);
    b2.position.set(1.0, 2.3, -0.45);
    cartRoot.add(b2);

    // Heaping 3D Roses in the baskets
    const miniRoseGeo = new THREE.SphereGeometry(0.18, 6, 6);
    const miniRoseMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0x4c0519 });
    const miniPinkMat = new THREE.MeshStandardMaterial({ color: 0xfda4af });
    const miniGoldMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, emissive: 0x572202 });

    for (let r = 0; r < 20; r++) {
      const curMat = r % 3 === 0 ? miniRoseMat : r % 3 === 1 ? miniPinkMat : miniGoldMat;
      const mRose1 = new THREE.Mesh(miniRoseGeo, curMat);
      mRose1.position.set(-1.45 + Math.random() * 0.8, 2.52 + Math.random() * 0.25, 0.25 + Math.random() * 0.65);
      cartRoot.add(mRose1);

      const mRose2 = new THREE.Mesh(miniRoseGeo, curMat);
      mRose2.position.set(0.75 + Math.random() * 0.8, 2.52 + Math.random() * 0.25, -0.75 + Math.random() * 0.65);
      cartRoot.add(mRose2);
    }

    // Postal Leather Bags with Stamped Love Letters
    const mailbag = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.5, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
    );
    mailbag.position.set(-1.5, 1.9, -0.6);
    cartRoot.add(mailbag);

    // 2 Ornate Carriage Lanterns with Real Dynamic PointLights (Swaying with physics)
    const carriageLanterns = [];
    const lanternPositions = [
      { x: 2.05, z: 1.05 },
      { x: 2.05, z: -1.05 }
    ];

    lanternPositions.forEach(lp => {
      const lHinge = new THREE.Group();
      lHinge.position.set(lp.x, 2.0, lp.z);

      // Curved arm
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), goldMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.x = -0.15;
      lHinge.add(arm);

      // Hanging lantern body
      const lBody = new THREE.Group();
      lBody.position.set(0, -0.1, 0);

      const lGlass = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.38, 0.26),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, roughness: 0.15 })
      );
      lBody.add(lGlass);

      const lRoof = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.2, 4), goldMat);
      lRoof.position.y = 0.28;
      lBody.add(lRoof);

      const cLight = new THREE.PointLight(0xfbbf24, 2.8, 11);
      lBody.add(cLight);

      lHinge.add(lBody);
      cartRoot.add(lHinge);
      carriageLanterns.push(lHinge);
    });

    // Special 3D Signboard on Side
    const signBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.35, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xfffdfa, roughness: 0.4 })
    );
    signBox.position.set(0, 1.45, 1.22);
    cartRoot.add(signBox);

    // Invisible Hit-Box for Raycasting Cart
    const cartHitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 3.5, 3.2),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    cartHitMesh.position.y = 1.7;
    cartHitMesh.userData = { isCart: true };
    cartRoot.add(cartHitMesh);

    scene.add(cartRoot);

    // --- 8. In-Scene 3D Floating Winged Letters & Crystal Hearts (5 Interactive Objects) ---
    const floatingItemsGroup = new THREE.Group();

    // Helper: 3D Winged Letter with Flapping Feathers
    function create3DWingedLetter(idx) {
      const group = new THREE.Group();

      // Envelope body with crease flap
      const env = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.46, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xfffdfa, roughness: 0.3 })
      );
      group.add(env);

      // Red Wax Seal 20.10
      const seal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.04, 10),
        new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.35 })
      );
      seal.rotation.x = Math.PI / 2;
      seal.position.z = 0.05;
      group.add(seal);

      // Left & Right Wings (Double-jointed Feather Wings)
      const wingGeo = new THREE.PlaneGeometry(0.6, 0.38);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        roughness: 0.2,
        emissive: 0x444444
      });

      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.set(-0.48, 0.05, 0);
      group.add(wingL);

      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.position.set(0.48, 0.05, 0);
      wingR.scale.set(-1, 1, 1);
      group.add(wingR);

      // Hover halo ring
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.02, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xfcd34d, emissive: 0xf59e0b, transparent: true, opacity: 0.6 })
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = -0.3;
      group.add(halo);

      // Hit area
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 6, 6),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hit.userData = { isFloatingItem: true, index: idx };
      group.add(hit);

      return { group, wingL, wingR, halo };
    }

    // Helper: 3D Faceted Crystal Heart
    function create3DCrystalHeart(idx) {
      const group = new THREE.Group();
      const heartMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0x9f1239,
        roughness: 0.25,
        metalness: 0.3
      });

      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), heartMat);
      s1.position.set(-0.18, 0.18, 0);
      group.add(s1);

      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), heartMat);
      s2.position.set(0.18, 0.18, 0);
      group.add(s2);

      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.62, 8), heartMat);
      cone.rotation.z = Math.PI;
      cone.position.set(0, -0.16, 0);
      group.add(cone);

      // Gold ribbon wrap
      const ribbon = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.03, 6, 18),
        new THREE.MeshStandardMaterial({ color: 0xfcd34d, metalness: 0.8, roughness: 0.2 })
      );
      ribbon.rotation.x = Math.PI / 3;
      group.add(ribbon);

      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 6, 6),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hit.userData = { isFloatingItem: true, index: idx };
      group.add(hit);

      return { group };
    }

    const floatingItems = [];

    // Item 1: Winged Letter (Left front)
    const w1 = create3DWingedLetter(0);
    w1.group.position.set(-2.2, 3.2, 0.6);
    floatingItemsGroup.add(w1.group);
    floatingItems.push({ ...w1, type: 'wing', basePos: new THREE.Vector3(-2.2, 3.2, 0.6), speed: 2.2 });

    // Item 2: Crystal Heart (Right front)
    const h1 = create3DCrystalHeart(1);
    h1.group.position.set(2.2, 3.5, 0.4);
    floatingItemsGroup.add(h1.group);
    floatingItems.push({ ...h1, type: 'heart', basePos: new THREE.Vector3(2.2, 3.5, 0.4), speed: 2.5 });

    // Item 3: Winged Letter (Top center above cart)
    const w2 = create3DWingedLetter(2);
    w2.group.position.set(0.3, 4.2, -0.6);
    floatingItemsGroup.add(w2.group);
    floatingItems.push({ ...w2, type: 'wing', basePos: new THREE.Vector3(0.3, 4.2, -0.6), speed: 1.9 });

    // Item 4: Crystal Heart (Left rear)
    const h2 = create3DCrystalHeart(3);
    h2.group.position.set(-1.6, 2.9, -1.8);
    floatingItemsGroup.add(h2.group);
    floatingItems.push({ ...h2, type: 'heart', basePos: new THREE.Vector3(-1.6, 2.9, -1.8), speed: 2.1 });

    // Item 5: Winged Letter (Right rear)
    const w3 = create3DWingedLetter(4);
    w3.group.position.set(1.8, 3.1, -1.9);
    floatingItemsGroup.add(w3.group);
    floatingItems.push({ ...w3, type: 'wing', basePos: new THREE.Vector3(1.8, 3.1, -1.9), speed: 2.3 });

    scene.add(floatingItemsGroup);

    // --- 9. Atmospheric Stardust & Fireflies (180 Points) ---
    const starCount = 180;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starInitialY = new Float32Array(starCount);

    const sColors = [
      new THREE.Color('#FDA4AF'),
      new THREE.Color('#FCD34D'),
      new THREE.Color('#F43F5E'),
      new THREE.Color('#FFFFFF')
    ];

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 40;
      const initY = 0.5 + Math.random() * 8.5;
      starPos[i * 3 + 1] = initY;
      starInitialY[i] = initY;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 40;

      const c = sColors[Math.floor(Math.random() * sColors.length)];
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // --- Interactive Mouse & Touch Raycasting ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isPointerDown = false;
    let downPos = { x: 0, y: 0 };
    let cartHopProgress = 0;

    const interactiveTargets = [cartHitMesh];
    floatingItems.forEach(item => {
      interactiveTargets.push(item.group);
    });

    const onPointerDown = (e) => {
      isPointerDown = true;
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveTargets, true);
      if (hits.length > 0) {
        container.style.cursor = 'pointer';
      } else {
        container.style.cursor = 'default';
      }
    };

    const triggerCartAction = (hit) => {
      setHasClickedCart(true);
      cartHopProgress = 1;

      // Confetti burst
      confetti({
        particleCount: 85,
        spread: 95,
        origin: { y: 0.55 },
        colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#FECDD3']
      });

      let targetObj = hit ? hit.object : null;
      while (targetObj && !targetObj.userData?.isFloatingItem && !targetObj.userData?.isCart && targetObj.parent) {
        targetObj = targetObj.parent;
      }

      if (targetObj && targetObj.userData && targetObj.userData.isFloatingItem) {
        const itemIdx = targetObj.userData.index;
        const curMessages = messagesRef.current;
        if (curMessages[itemIdx]) {
          setReadingMessage(curMessages[itemIdx]);
          return;
        }
      }

      setIsMailboxOpen(true);
    };

    const onPointerUp = (e) => {
      if (isPointerDown) {
        const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
        // Nếu nhấc chuột gần vị trí ban đầu (click thật, không phải đang drag xoay)
        if (dist < 10) {
          raycaster.setFromCamera(mouse, camera);
          const hits = raycaster.intersectObjects(interactiveTargets, true);
          if (hits.length > 0) {
            triggerCartAction(hits[0]);
          }
        }
      }
      isPointerDown = false;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // --- Render Loop (Smooth 60fps Animation) ---
    let animId;
    const startTime = performance.now();

    function renderLoop() {
      const elapsed = (performance.now() - startTime) * 0.001;

      // 1. OrbitControls update & auto-rotate
      controls.autoRotate = autoRotateRef.current;
      controls.autoRotateSpeed = 1.0;
      controls.update();

      // 2. Flowers gentle natural swaying in wind
      flowersList.forEach(fl => {
        fl.group.rotation.z = Math.sin(elapsed * fl.speed + fl.offset) * 0.14;
        fl.group.rotation.x = Math.cos(elapsed * (fl.speed * 0.8) + fl.offset) * 0.09;
      });

      // 3. Animated Cart Physics (Suspension breathing, rocking, wheel rotation)
      animatedWheels.forEach(w => {
        w.rotation.z += 0.015; // Slow rhythmic cruising roll
      });

      if (cartHopProgress > 0) {
        cartHopProgress -= 0.04;
        const hop = Math.sin((1 - cartHopProgress) * Math.PI);
        cartRoot.position.y = 0.28 + hop * 0.55;
        cartRoot.scale.set(1 + hop * 0.14, 1 - hop * 0.12, 1 + hop * 0.14);
      } else {
        // Dual harmonics realistic suspension idle
        cartRoot.position.y = 0.28 + Math.sin(elapsed * 2.8) * 0.04 + Math.sin(elapsed * 1.4) * 0.02;
        cartRoot.rotation.z = Math.sin(elapsed * 1.8) * 0.015; // gentle roll
        cartRoot.rotation.x = Math.cos(elapsed * 1.5) * 0.01;  // gentle pitch
        cartRoot.scale.set(1, 1, 1);
      }

      // Carriage Lanterns swinging with pendulum physics
      carriageLanterns.forEach(lh => {
        lh.rotation.z = Math.sin(elapsed * 2.6) * 0.22;
      });

      // Twinkling fairy lights on carriage
      fairyLightsList.forEach(fl => {
        const pulse = 0.8 + Math.sin(elapsed * 3.5 + fl.offset) * 0.35;
        fl.orb.scale.setScalar(pulse);
      });

      // 4. Floating Winged Letters & Crystal Hearts Animation
      floatingItems.forEach((item, idx) => {
        const bob = Math.sin(elapsed * item.speed + idx) * 0.25;
        item.group.position.y = item.basePos.y + bob;
        item.group.rotation.y = Math.sin(elapsed * 1.2 + idx) * 0.35;

        if (item.type === 'wing' && item.wingL && item.wingR) {
          // Bird-like flapping wings
          const flap = Math.sin(elapsed * 9.5 + idx) * 0.6;
          item.wingL.rotation.y = flap;
          item.wingR.rotation.y = -flap;
        } else if (item.type === 'heart') {
          // Heartbeat pulse rhythm
          const pulse = 1 + Math.sin(elapsed * 5.5) * 0.14;
          item.group.scale.setScalar(pulse);
        }
      });

      // 5. Fireflies drifting and bobbing
      const posArr = starGeo.attributes.position.array;
      for (let i = 0; i < starCount; i++) {
        posArr[i * 3 + 1] = starInitialY[i] + Math.sin(elapsed * 1.6 + i) * 0.45;
      }
      starGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    }

    renderLoop();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      if (nw > 0 && nh > 0) {
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
    };
  }, []);

  // Lọc thư theo tab (Tất cả, Thư có cánh, Trái tim)
  const filteredMessages = messages.filter(msg => {
    if (activeFilter === 'all') return true;
    return msg.type === activeFilter;
  });

  return (
    <div className="page-garden-3d" id="page-garden-private">
      {/* Three.js 3D Viewport Canvas */}
      <div ref={containerRef} className="garden-3d-viewport" />

      {/* In-Game HUD Overlays */}
      <div className="garden-game-hud">
        {/* Top Header Bar & Camera Presets Toolbar */}
        <div className="hud-top-bar">
          <div className="hud-title">
            🌸 Vườn Hoa Tri Ân 20/10 • Khung Cảnh 3D Thơ Mộng
          </div>
          <div className="hud-subtitle">
            <span>Chuyến xe hoa chở thư tay đang dừng chân dành riêng cho <strong>{sisterName}</strong> ✨</span>
          </div>

          {/* 3D Camera Controls & View Presets */}
          <div className="hud-camera-toolbar">
            <button
              className={`btn-cam-preset ${activeCamPreset === 'scenic' ? 'active' : ''}`}
              onClick={() => setCameraPreset('scenic')}
              title="Góc nhìn toàn cảnh thung lũng hoa"
            >
              🔍 Toàn Cảnh
            </button>
            <button
              className={`btn-cam-preset ${activeCamPreset === 'cart' ? 'active' : ''}`}
              onClick={() => setCameraPreset('cart')}
              title="Góc nhìn cận cảnh xe hoa vintage"
            >
              🛞 Xe Hoa
            </button>
            <button
              className={`btn-cam-preset ${activeCamPreset === 'letters' ? 'active' : ''}`}
              onClick={() => setCameraPreset('letters')}
              title="Góc nhìn những cánh thư bay lượn"
            >
              💌 Cánh Thư
            </button>
            <button
              className={`btn-cam-preset ${activeCamPreset === 'top' ? 'active' : ''}`}
              onClick={() => setCameraPreset('top')}
              title="Góc nhìn từ trên cao xuống"
            >
              🕊️ Từ Trên Cao
            </button>
            <button
              className={`btn-cam-preset ${autoRotate ? 'autorotate-active' : ''}`}
              onClick={() => setAutoRotate(!autoRotate)}
              title="Tự động quay 360 độ như trailer phim"
            >
              🎥 {autoRotate ? 'Dừng Quay 360°' : 'Quay 360°'}
            </button>
          </div>
        </div>

        {/* Floating Prompt directly on the 3D Cart (Chỉ dẫn trực quan) */}
        {!hasClickedCart && (
          <div
            className="cart-floating-indicator"
            onClick={() => setIsMailboxOpen(true)}
            title="Chạm vào xe hoa để mở hòm thư!"
          >
            <span>✨ Chạm vào xe hoa hoặc cánh thư để nhận quà! 🛞💌</span>
          </div>
        )}

        {/* Mouse / Touch Guide Hint */}
        <div style={{ textAlign: 'center' }}>
          <span className="hud-interaction-hint">
            🖱️ Giữ chuột trái để xoay 360° • Cuộn để phóng to • Chạm xe hoa để mở thư
          </span>
        </div>

        {/* Bottom Action Bar */}
        <div className="hud-bottom-bar">
          <button
            className="btn-hud-mailbox"
            onClick={() => setIsMailboxOpen(true)}
          >
            <span>🕊️ Hòm Thư Xe Hoa</span>
            <span className="mailbox-badge">{messages.length} Món Quà</span>
          </button>

          <button
            onClick={() => navigateWithFlowerTransition('/video')}
            className="btn-rose"
            style={{ fontSize: '0.98rem', padding: '12px 26px' }}
          >
            <span>Bước Tiếp Theo: Rạp Chiếu Phim Tri Ân 🎬</span>
          </button>
        </div>
      </div>

      {/* FAIRY MAILBOX MODAL (DANH SÁCH TRÁI TIM & THƯ CÓ CÁNH) */}
      {isMailboxOpen && (
        <div className="fairy-mailbox-overlay" onClick={() => setIsMailboxOpen(false)}>
          <div className="fairy-mailbox-window" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="fairy-mailbox-header">
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--rose-400)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '700' }}>
                  Special Delivery • 20.10 Collection
                </span>
                <h2 className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.85rem)', color: 'var(--champagne-light)', fontStyle: 'italic', margin: '4px 0 6px' }}>
                  Hòm Thư Tri Ân Gửi Tặng {sisterName} 🌸
                </h2>
                <p style={{ fontSize: '0.86rem', color: '#CBD5E1', margin: 0 }}>
                  Chạm vào từng cánh thư hoặc trái tim để đón nhận những lời chúc chân thành từ anh em nhé!
                </p>
              </div>

              <button
                onClick={() => setIsMailboxOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}
                title="Đóng hòm thư"
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="fairy-filter-tabs">
              <button
                className={`fairy-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                ✨ Tất cả ({messages.length})
              </button>
              <button
                className={`fairy-tab-btn ${activeFilter === 'winged_letter' ? 'active' : ''}`}
                onClick={() => setActiveFilter('winged_letter')}
              >
                🕊️ Thư có cánh ({messages.filter(m => m.type === 'winged_letter').length})
              </button>
              <button
                className={`fairy-tab-btn ${activeFilter === 'heart' ? 'active' : ''}`}
                onClick={() => setActiveFilter('heart')}
              >
                💖 Trái tim bí mật ({messages.filter(m => m.type === 'heart').length})
              </button>
            </div>

            {/* Body: List of Winged Letters & Glowing Hearts */}
            <div className="fairy-mailbox-body">
              {filteredMessages.map((msg, idx) => {
                const isHeart = msg.type === 'heart';

                return (
                  <div
                    key={msg.id || idx}
                    className="fairy-gift-card"
                    onClick={() => setReadingMessage(msg)}
                  >
                    {/* Visual Slot */}
                    <div className="card-visual-slot">
                      {isHeart ? (
                        <div className="beating-heart-box">
                          <span className="gem-heart-emoji">💖</span>
                        </div>
                      ) : (
                        <div className="winged-visual-box">
                          <svg className="feather-wing left" viewBox="0 0 40 40">
                            <path d="M40 20 C25 5 10 10 0 25 C10 28 20 25 25 32 C30 25 35 22 40 20 Z" />
                          </svg>
                          <span className="letter-envelope-emoji">💌</span>
                          <svg className="feather-wing right" viewBox="0 0 40 40">
                            <path d="M0 20 C15 5 30 10 40 25 C30 28 20 25 15 32 C10 25 5 22 0 20 Z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="card-badge">
                        {msg.badge || (isHeart ? '💖 Trái Tim Tri Ân' : '🕊️ Cánh Thư May Mắn')}
                      </div>
                      <div className="card-sender">
                        {msg.from_name}
                      </div>
                      <p className="card-snippet">
                        “{msg.text}”
                      </p>
                    </div>

                    <div className="card-action-hint">
                      <span>{isHeart ? 'Chạm để mở trái tim' : 'Mở bức thư có cánh'}</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ROYAL PARCHMENT LETTER MODAL (KHI ĐỌC 1 THƯ CỤ THỂ) */}
      {readingMessage && (
        <div className="modal-overlay open" onClick={() => setReadingMessage(null)}>
          <div className="royal-parchment-box" onClick={(e) => e.stopPropagation()}>
            <div className="parchment-seal">20.10</div>

            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--rose-600)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700' }}>
              Special Tribute • Royal Delivery
            </span>

            <h2 className="font-serif" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', color: 'var(--rose-700)', fontStyle: 'italic', margin: '8px 0 16px' }}>
              Thân Gửi Chị {sisterName} Quý Mến,
            </h2>

            <div style={{ background: 'rgba(244, 63, 94, 0.06)', borderLeft: '4px solid var(--rose-500)', borderRadius: '16px', padding: '22px 24px', margin: '20px 0' }}>
              <p style={{ fontSize: '1.12rem', lineHeight: '1.9', color: '#334155', fontStyle: 'italic' }}>
                “{readingMessage.text}”
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px dashed var(--rose-200)', paddingTop: '18px', marginTop: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--rose-700)', fontWeight: '700' }}>
                  — {readingMessage.from_name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#94A3B8' }}>
                  With all our sincere gratitude ❤️
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setReadingMessage(null);
                    setIsMailboxOpen(true);
                  }}
                  className="btn-rose"
                  style={{ padding: '10px 20px', fontSize: '0.88rem', background: '#FFF', color: 'var(--rose-700)', border: '1.5px solid var(--rose-300)' }}
                >
                  <span>← Chọn thư khác</span>
                </button>

                <button
                  onClick={() => setReadingMessage(null)}
                  className="btn-rose"
                  style={{ padding: '10px 22px', fontSize: '0.88rem' }}
                >
                  <span>Gấp thư lại 🕊️</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
