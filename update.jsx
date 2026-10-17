import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { fetchPrivateWishes } from '../api.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const mergeGeos = BufferGeometryUtils.mergeGeometries;
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { playPopSound, playLetterOpenSound, playTruckHonkSound, playSparkleSound, playSoftTapSound } from '../utils/soundEffects.js';

import {
  Y_AXIS,
  rngFactory,
  smooth,
  noise2,
  normAngle,
  windify,
  taperedTube,
  makeHeartGeometry,
  VAN_PRESETS,
  STATIONS,
  fireflyTexture,
  glowTexture,
  petalTexture,
  cloudTexture,
  signTexture,
  paint,
  petal,
  makeRoseHead,
  makeTulipHead,
  makeDaisyHead,
  makeLavenderHead,
  makeStem,
  makeBlade,
  buildVegetationField
} from '../components/world3d/index.js';

export { STATIONS };

/* ================================================================== */
/*  CINEMATIC COLOR GRADING SHADER — "FILM LOOK"                       */
/*  Split toning + vignette + grain + chromatic aberration             */
/* ================================================================== */
const ColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uStrength: { value: 1.0 },
    uVignette: { value: 0.35 },
    uGrain: { value: 0.018 },
    uAberration: { value: 0.0006 },
    uSaturation: { value: 1.08 },
    uVignetteColor: { value: new THREE.Color(0x0a0510) },
    uShadowTint: { value: new THREE.Color(0.06, 0.08, 0.14) },
    uHighlightTint: { value: new THREE.Color(1.06, 1.0, 0.92) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uStrength;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;
    uniform float uSaturation;
    uniform vec3 uVignetteColor;
    uniform vec3 uShadowTint;
    uniform vec3 uHighlightTint;
    varying vec2 vUv;

    // Pseudo-random hash cho grain
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // Filmic S-curve nhẹ để bổ sung ACES
    vec3 filmicCurve(vec3 x) {
      vec3 a = x * (2.51 * x + 0.03);
      vec3 b = x * (2.43 * x + 0.59) + 0.14;
      return clamp(a / b, 0.0, 1.0);
    }

    void main() {
      vec2 uv = vUv;
      vec2 centered = uv - 0.5;
      float r2 = dot(centered, centered);

      // 1. Chromatic aberration (rìa mạnh hơn tâm)
      float ab = uAberration * r2 * 4.0;
      vec2 dir = normalize(centered + 1e-6);
      vec3 col;
      col.r = texture2D(tDiffuse, uv + dir * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - dir * ab).b;

      // 2. Filmic curve
      col = mix(col, filmicCurve(col), 0.35 * uStrength);

      // 3. Split toning: shadow xanh tím, highlight vàng ấm
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      float shadowMask = 1.0 - smoothstep(0.0, 0.45, luma);
      float highlightMask = smoothstep(0.55, 1.0, luma);
      vec3 shadowShift = uShadowTint * shadowMask * 0.35 * uStrength;
      vec3 highlightShift = (uHighlightTint - vec3(1.0)) * highlightMask * 0.5 * uStrength;
      col += shadowShift + highlightShift;

      // 4. Saturation
      luma = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(luma), col, uSaturation);

      // 5. Vignette
      float vig = smoothstep(0.32, 1.0, length(centered) * 1.35);
      col = mix(col, uVignetteColor, vig * uVignette * uStrength);

      // 6. Film grain
      float grain = (hash(uv + fract(uTime * 0.7)) - 0.5) * uGrain;
      col += grain;

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }
  `
};

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function World3DExperience() {
  const {
    selectedSister,
    updateExperienceMode,
    wishes,
    setActiveModalWish
  } = useApp();

  const sisterName = selectedSister ? selectedSister.name : 'Chị Lan Anh';

  const [activeStationIndex, setActiveStationIndex] = useState(0);
  const [activeVanCamPreset, setActiveVanCamPreset] = useState('chase');
  const [autoRotate, setAutoRotate] = useState(false);
  const autoRotateRef = useRef(false);
  autoRotateRef.current = autoRotate;

  const [shouldPulseNext, setShouldPulseNext] = useState(false);
  const pulseTimerRef = useRef(null);

  useEffect(() => {
    setShouldPulseNext(false);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => {
      setShouldPulseNext(true);
    }, 8500);
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [activeStationIndex]);

  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    return typeof window !== 'undefined' ? (window.innerWidth <= 768 || 'ontouchstart' in window) : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isNightMode, setIsNightMode] = useState(false);
  const nightModeRef = useRef(false);
  nightModeRef.current = isNightMode;

  const [isHudHidden, setIsHudHidden] = useState(false);

  const worldAtmosphereRef = useRef({
    skyMat: null,
    starMat: null,
    sunLight: null,
    hemiLight: null,
    lampMaterials: [],
    lampHalos: [],
    flyMat: null,
    letterMat: null,
    bloom: null,
    colorGrade: null,
    renderer: null,
    ssaoPass: null,
    bokehPass: null
  });

  const [messages, setMessages] = useState([]);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [readingMessage, setReadingMessage] = useState(null);
  const [activeVideoModal, setActiveVideoModal] = useState(false);
  const [activePartyCardModal, setActivePartyCardModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  const containerRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const vanStateRef = useRef({ pos: new THREE.Vector3(), yaw: 0 });
  const transRef = useRef(null);
  const followVanRef = useRef(false);
  const printableCardRef = useRef(null);

  const giftAnimationRef = useRef({
    opened: false,
    lidMesh: null,
    butterflies: [],
    balloons: [],
    openProgress: 0,
    crystalHeart: null,
    heartHalo: null,
    welcomeSign: null
  });

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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const toggleNightMode = () => {
    setIsNightMode((prev) => {
      const next = !prev;
      nightModeRef.current = next;
      const atmo = worldAtmosphereRef.current;
      if (atmo && atmo.skyMat) {
        if (next) {
          atmo.skyMat.uniforms.top.value.setHex(0x070312);
          atmo.skyMat.uniforms.mid.value.setHex(0x1a0924);
          atmo.skyMat.uniforms.hor.value.setHex(0x3e132c);
          if (atmo.starMat) atmo.starMat.opacity = 0.95;
          if (atmo.sunLight) {
            atmo.sunLight.color.setHex(0xbcd4ff);
            atmo.sunLight.intensity = 1.2;
          }
          if (atmo.hemiLight) {
            atmo.hemiLight.color.setHex(0x382255);
            atmo.hemiLight.groundColor.setHex(0x10081c);
            atmo.hemiLight.intensity = 0.65;
          }
          atmo.lampMaterials.forEach((m) => { m.emissiveIntensity = 4.5; });
          atmo.lampHalos.forEach((h) => { h.scale.set(3.8, 3.8, 1); h.material.opacity = 0.95; });
          if (atmo.flyMat) {
            atmo.flyMat.opacity = 0.98;
            atmo.flyMat.size = 4.5;
          }
          if (atmo.letterMat) atmo.letterMat.emissiveIntensity = 0.55;
          if (atmo.bloom) atmo.bloom.strength = 0.55;
          if (atmo.renderer) atmo.renderer.toneMappingExposure = 1.05;
          if (atmo.colorGrade) {
            atmo.colorGrade.uniforms.uVignette.value = 0.5;
            atmo.colorGrade.uniforms.uVignetteColor.value.setHex(0x02000a);
          }
          confetti({ particleCount: 70, spread: 90, origin: { y: 0.6 }, colors: ['#FDE68A', '#FCD34D', '#C084FC', '#FFF'] });
          showToast('🌙 Đã kích hoạt Dạ Tiệc Đêm lung linh ánh đèn!');
        } else {
          atmo.skyMat.uniforms.top.value.setHex(0x2a1650);
          atmo.skyMat.uniforms.mid.value.setHex(0xb85c8a);
          atmo.skyMat.uniforms.hor.value.setHex(0xffb48a);
          if (atmo.starMat) atmo.starMat.opacity = 0;
          if (atmo.sunLight) {
            atmo.sunLight.color.setHex(0xffc890);
            atmo.sunLight.intensity = 2.7;
          }
          if (atmo.hemiLight) {
            atmo.hemiLight.color.setHex(0xffb7c5);
            atmo.hemiLight.groundColor.setHex(0x2a3a22);
            atmo.hemiLight.intensity = 0.95;
          }
          atmo.lampMaterials.forEach((m) => { m.emissiveIntensity = 2.4; });
          atmo.lampHalos.forEach((h) => { h.scale.set(2.8, 2.8, 1); h.material.opacity = 0.8; });
          if (atmo.flyMat) {
            atmo.flyMat.opacity = 0.75;
            atmo.flyMat.size = 3.2;
          }
          if (atmo.letterMat) atmo.letterMat.emissiveIntensity = 0.18;
          if (atmo.bloom) atmo.bloom.strength = 0.42;
          if (atmo.renderer) atmo.renderer.toneMappingExposure = 1.08;
          if (atmo.colorGrade) {
            atmo.colorGrade.uniforms.uVignette.value = 0.35;
            atmo.colorGrade.uniforms.uVignetteColor.value.setHex(0x0a0510);
          }
          showToast('🌅 Đã chuyển về Bầu Trời Hoàng Hôn ấm áp!');
        }
      }
      return next;
    });
  };

  const flyToWorldScenic = () => {
    playSoftTapSound();
    setActiveStationIndex('scenic');
    followVanRef.current = false;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl || !transRef.current) return;

    transRef.current.active = true;
    transRef.current.t0 = performance.now();
    transRef.current.dur = 1600;
    transRef.current.fromCam = cam.position.clone();
    transRef.current.toCam = new THREE.Vector3(0, 36, 68);
    transRef.current.fromTgt = ctrl.target.clone();
    transRef.current.toTgt = new THREE.Vector3(0, 3, 0);
    transRef.current.isVanRelative = false;

    showToast('🌄 Đang chuyển sang Góc Nhìn Toàn Cảnh Vương Quốc Hoa 3D!');
  };

  const flyToStation = (idx) => {
    playSoftTapSound();
    setActiveStationIndex(idx);
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl || !transRef.current) return;

    if (idx === 3) {
      followVanRef.current = false;
      transRef.current.active = true;
      transRef.current.t0 = performance.now();
      transRef.current.dur = 1400;
      transRef.current.fromCam = cam.position.clone();
      transRef.current.fromTgt = ctrl.target.clone();
      transRef.current.preset = VAN_PRESETS[activeVanCamPreset];
      transRef.current.isVanRelative = true;
      showToast('🚐 Đang bay bám theo Chuyến Xe Hoa 20/10!');
      return;
    }

    followVanRef.current = false;
    const stConfig = transRef.current.stationsPos[idx];
    if (!stConfig) {
      // Guard: nếu không có config (ví dụ trạm mới chưa dựng), không crash
      return;
    }

    transRef.current.active = true;
    transRef.current.t0 = performance.now();
    transRef.current.dur = 1500;
    transRef.current.fromCam = cam.position.clone();
    transRef.current.toCam = stConfig.camPos.clone();
    transRef.current.fromTgt = ctrl.target.clone();
    transRef.current.toTgt = stConfig.targetPos.clone();
    transRef.current.isVanRelative = false;

    showToast(`✨ Đang bay đến: ${STATIONS[idx].name}`);
  };

  const setVanCameraPreset = (name) => {
    setActiveVanCamPreset(name);
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl || !transRef.current) return;

    followVanRef.current = false;
    transRef.current.active = true;
    transRef.current.t0 = performance.now();
    transRef.current.dur = 1200;
    transRef.current.fromCam = cam.position.clone();
    transRef.current.fromTgt = ctrl.target.clone();
    transRef.current.preset = VAN_PRESETS[name];
    transRef.current.isVanRelative = true;
  };

  const downloadRetinaCard = async () => {
    if (!printableCardRef.current) return;
    try {
      setIsDownloadingCard(true);
      const canvas = await html2canvas(printableCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF3EA'
      });
      const link = document.createElement('a');
      link.download = `Thiep_Chuc_Mung_2010_${sisterName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      showToast('🎉 Đã tải thiệp kỷ niệm 2x Retina thành công!');
    } catch (err) {
      console.error(err);
      showToast('⚠️ Không thể tải thiệp, xin vui lòng thử lại!');
    } finally {
      setIsDownloadingCard(false);
    }
  };

  /* ================================================================== */
  /*  THREE.JS WORLD LIFECYCLE                                           */
  /* ================================================================== */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lowPower = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    const Q = lowPower ? 0.5 : 1;
    const rand = rngFactory(20102026);
    const timeU = { value: 0 };

    const width = container.clientWidth || window.innerWidth || 1200;
    const height = container.clientHeight || window.innerHeight || 800;

    /* ---------- Renderer / Scene / Camera ---------- */
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowPower,
      powerPreference: 'high-performance',
      stencil: false
    });
    const pr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    worldAtmosphereRef.current.renderer = renderer;

    const scene = new THREE.Scene();
    const FOG_COLOR = 0xe6a08f;
    scene.fog = new THREE.FogExp2(FOG_COLOR, 0.0095);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1500);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.5;
    controls.maxDistance = 140;
    controls.minPolarAngle = Math.PI / 14;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controlsRef.current = controls;

    /* ---------- Sky + reflections ---------- */
    const sunDir = new THREE.Vector3(-0.6, 0.26, -0.75).normalize();
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
      uniforms: {
        top: { value: new THREE.Color(isNightMode ? 0x070312 : 0x2a1650) },
        mid: { value: new THREE.Color(isNightMode ? 0x1a0924 : 0xb85c8a) },
        hor: { value: new THREE.Color(isNightMode ? 0x3e132c : 0xffb48a) },
        sunDir: { value: sunDir }
      },
      vertexShader: `varying vec3 vDir;
        void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 sunDir; varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir); float h = d.y;
          vec3 col = mix(hor, mid, smoothstep(0.0, 0.28, h));
          col = mix(col, top, smoothstep(0.2, 0.85, h));
          col = mix(hor * 0.75, col, smoothstep(-0.2, 0.02, h));
          float s = max(dot(d, sunDir), 0.0);
          col += vec3(1.0, 0.72, 0.45) * pow(s, 8.0) * 0.45;
          col += vec3(1.0, 0.86, 0.62) * pow(s, 220.0) * 3.0;
          gl_FragColor = vec4(col, 1.0);
        }`
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), skyMat);
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    scene.add(sky);
    worldAtmosphereRef.current.skyMat = skyMat;

    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95 + 0.05);
      const rad = 660;
      starPositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = rad * Math.cos(phi);
      starPositions[i * 3 + 2] = rad * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.2,
      transparent: true,
      opacity: isNightMode ? 0.95 : 0,
      fog: false,
      depthWrite: false
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);
    worldAtmosphereRef.current.starMat = starMat;

    const cloudTex = cloudTexture();
    for (let i = 0; i < 14; i++) {
      const sm = new THREE.SpriteMaterial({
        map: cloudTex,
        color: 0xffc6b4,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        depthTest: false,
        fog: false
      });
      const sp = new THREE.Sprite(sm);
      const a = rand() * Math.PI * 2;
      const el = 0.12 + rand() * 0.22;
      sp.position.set(Math.cos(a) * Math.cos(el) * 480, Math.sin(el) * 480, Math.sin(a) * Math.cos(el) * 480);
      sp.scale.set(240 + rand() * 160, 60 + rand() * 40, 1);
      sp.renderOrder = -9;
      sky.add(sp);
    }

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const envSky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMat.clone());
    envScene.add(envSky);
    const envRT = pmrem.fromScene(envScene, 0.02);
    const envTex = envRT.texture;

    /* ---------- Lights ---------- */
    const hemiLight = new THREE.HemisphereLight(
      isNightMode ? 0x382255 : 0xffb7c5,
      isNightMode ? 0x10081c : 0x2a3a22,
      isNightMode ? 0.65 : 0.95
    );
    scene.add(hemiLight);
    worldAtmosphereRef.current.hemiLight = hemiLight;

    // SHADOW CAMERA MỞ RỘNG: 60×60 thay vì 14×14, 4096 map
    const sun = new THREE.DirectionalLight(
      isNightMode ? 0xbcd4ff : 0xffc890,
      isNightMode ? 1.2 : 2.7
    );
    sun.castShadow = true;
    const shadowSize = lowPower ? 2048 : 4096;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 280;
    sun.shadow.bias = -0.0002;
    sun.shadow.normalBias = 0.04;
    scene.add(sun);
    scene.add(sun.target);
    worldAtmosphereRef.current.sunLight = sun;

    const fill = new THREE.DirectionalLight(0x8a6cff, 0.4);
    fill.position.set(40, 20, 50);
    scene.add(fill);

    /* ---------- Scenic Road Curve (CatmullRom) ---------- */
    const loopPts = [];
    const NPTS = 22;
    for (let k = 0; k < NPTS; k++) {
      const a = (k / NPTS) * Math.PI * 2;
      const r = 44 + 6 * Math.sin(3 * a + 1.0) + 3.5 * Math.sin(5 * a + 0.4);
      loopPts.push(new THREE.Vector3(Math.cos(a) * r * 1.2, 0, Math.sin(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(loopPts, true, 'centripetal');
    const curveLen = curve.getLength();
    const SAMPLES = 360;
    const samplePts = curve.getSpacedPoints(SAMPLES);
    const sx = new Float32Array(SAMPLES);
    const sz = new Float32Array(SAMPLES);
    for (let i = 0; i < SAMPLES; i++) {
      sx[i] = samplePts[i].x;
      sz[i] = samplePts[i].z;
    }
    const distToPath = (x, z) => {
      let best = 1e9;
      for (let i = 0; i < SAMPLES; i++) {
        const dx = x - sx[i];
        const dz = z - sz[i];
        const d2 = dx * dx + dz * dz;
        if (d2 < best) best = d2;
      }
      return Math.sqrt(best);
    };
    const heightAt = (x, z, dIn) => {
      const d = dIn === undefined ? distToPath(x, z) : dIn;
      const e = smooth(2.7, 10, d);
      const far = smooth(14, 48, d);
      return e * (0.55 + 0.45 * Math.sin(x * 0.13) * Math.cos(z * 0.11)) * 1.3 + far * 5.5 + 0.28 * noise2(x * 1.7, z * 1.7) * smooth(3.5, 9, d);
    };

    const tmpV = new THREE.Vector3();
    const scatter = (count, latMin, latMax, pw) => {
      const out = [];
      let guard = 0;
      while (out.length < count && guard++ < count * 6) {
        const idx = Math.floor(rand() * SAMPLES);
        const p = samplePts[idx];
        const q = samplePts[idx + 1] || samplePts[0];
        tmpV.set(q.x - p.x, 0, q.z - p.z).normalize();
        const lx = tmpV.z;
        const lz = -tmpV.x;
        const lat = (latMin + Math.pow(rand(), pw) * (latMax - latMin)) * (rand() < 0.5 ? -1 : 1);
        const x = p.x + lx * lat + (rand() - 0.5) * 0.6;
        const z = p.z + lz * lat + (rand() - 0.5) * 0.6;
        const d = distToPath(x, z);
        if (d < latMin * 0.92) continue;
        out.push({ x, z, d, y: heightAt(x, z, d) });
      }
      return out;
    };

    const scatterLandscape = (count, minDistFromRoad = 2.4, maxExtent = 115) => {
      const out = [];
      let guard = 0;
      while (out.length < count && guard++ < count * 8) {
        const x = (rand() - 0.5) * 2 * maxExtent;
        const z = (rand() - 0.5) * 2 * maxExtent;
        const d = distToPath(x, z);
        if (d < minDistFromRoad) continue;
        out.push({ x, z, d, y: heightAt(x, z, d) });
      }
      return out;
    };

    /* ---------- Ground Mesh ---------- */
    const groundGeo = new THREE.PlaneGeometry(240, 240, lowPower ? 110 : 180, lowPower ? 110 : 180);
    groundGeo.rotateX(-Math.PI / 2);
    {
      const pos = groundGeo.attributes.position;
      const cols = new Float32Array(pos.count * 3);
      const cA = new THREE.Color(0x1f4a24);
      const cB = new THREE.Color(0x4b8a34);
      const cC = new THREE.Color(0x86a23d);
      const c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const d = distToPath(x, z);
        pos.setY(i, heightAt(x, z, d));
        const n = noise2(x * 0.5, z * 0.5) * 0.33 + 0.5;
        c.copy(cA).lerp(cB, Math.min(1, Math.max(0, n)));
        c.lerp(cC, smooth(0.75, 1.1, noise2(x * 0.13 + 4, z * 0.13)) * 0.45);
        cols[i * 3] = c.r;
        cols[i * 3 + 1] = c.g;
        cols[i * 3 + 2] = c.b;
      }
      groundGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      groundGeo.computeVertexNormals();
    }
    const groundMesh = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    /* ---------- Two-track Road with Ruts ---------- */
    {
      const RS = 700;
      const HW = 2.2;
      const LAT = 13;
      const positions = [];
      const colors = [];
      const idxs = [];
      const cGrass = new THREE.Color(0x58953a);
      const cGrass2 = new THREE.Color(0x4a8532);
      const cRut = new THREE.Color(0x77633f);
      const cEdge = new THREE.Color(0x2f5f26);
      const c = new THREE.Color();
      for (let i = 0; i <= RS; i++) {
        const u = (i % RS) / RS;
        const p = curve.getPointAt(u);
        const T = curve.getTangentAt(u);
        const lx = T.z;
        const lz = -T.x;
        const ln = Math.hypot(lx, lz);
        for (let k = 0; k < LAT; k++) {
          const w = -HW + (k / (LAT - 1)) * HW * 2;
          const aw = Math.abs(w);
          positions.push(p.x + (lx / ln) * w, 0.035 + 0.01 * Math.sin(i * 0.7 + k), p.z + (lz / ln) * w);
          c.copy(cGrass).lerp(cGrass2, 0.5 + 0.5 * Math.sin(i * 0.21 + k * 1.7));
          const rut = Math.exp(-Math.pow((aw - 0.85) / 0.22, 2));
          c.lerp(cRut, rut * 0.55);
          c.lerp(cEdge, smooth(1.5, HW, aw));
          colors.push(c.r, c.g, c.b);
        }
      }
      for (let i = 0; i < RS; i++) {
        for (let k = 0; k < LAT - 1; k++) {
          const a = i * LAT + k;
          const b = a + 1;
          const c1 = a + LAT;
          const d = c1 + 1;
          idxs.push(a, c1, b, b, c1, d);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      g.setIndex(idxs);
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
      m.receiveShadow = true;
      scene.add(m);
    }

    /* ---------- Vegetation ---------- */
    buildVegetationField({ scene, scatter, scatterLandscape, timeU, rand, Q });

    /* ---------- Cherry Blossom Trees ---------- */
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    const treeGroup = new THREE.Group();
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x4b2f23, roughness: 1 });
    const blossomGeo = new THREE.IcosahedronGeometry(1, 1);
    const blossomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, emissive: 0x4a1230, emissiveIntensity: 0.35 });
    const blossomPal = [0xf9a8d4, 0xfbcfe8, 0xf472b6, 0xfce7f3, 0xfdf2f8, 0xf0abfc].map((h) => new THREE.Color(h));
    const treeSpots = [];
    {
      const cand = scatter(80, 8, 36, 1.0);
      for (const c of cand) {
        if (treeSpots.length >= 16) break;
        if (treeSpots.every((t) => Math.hypot(t.x - c.x, t.z - c.z) > 8)) treeSpots.push(c);
      }
    }
    treeSpots.forEach((spot) => {
      const tree = new THREE.Group();
      const trunkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.2, 0),
        new THREE.Vector3(0.15, 1.2, 0.05),
        new THREE.Vector3(-0.12, 2.4, 0.1),
        new THREE.Vector3(0.2, 3.4, -0.05)
      ]);
      tree.add(new THREE.Mesh(taperedTube(trunkCurve, 20, 0.42, 0.14, 7), barkMat));
      const centers = [new THREE.Vector3(0.2, 3.9, -0.05)];
      for (let b = 0; b < 6; b++) {
        const u = 0.5 + (b / 6) * 0.45;
        const st = trunkCurve.getPointAt(u);
        const a = b * 1.05 + rand();
        const len = 1.7 + rand() * 1.0;
        const end = new THREE.Vector3(st.x + Math.cos(a) * len, st.y + 0.9 + rand() * 0.8, st.z + Math.sin(a) * len);
        const mid = st.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.35, 0));
        const bc = new THREE.CatmullRomCurve3([st, mid, end]);
        tree.add(new THREE.Mesh(taperedTube(bc, 10, 0.15, 0.04, 5), barkMat));
        centers.push(end.clone().add(new THREE.Vector3(0, 0.5, 0)));
      }
      const NB = Math.floor(450 * Q);
      const canopy = new THREE.InstancedMesh(blossomGeo, blossomMat, NB);
      for (let i = 0; i < NB; i++) {
        const ctr = centers[Math.floor(rand() * centers.length)];
        const rr = 1.5 * Math.cbrt(rand());
        const th = rand() * Math.PI * 2;
        const ph = Math.acos(2 * rand() - 1);
        dummy.position.set(ctr.x + rr * Math.sin(ph) * Math.cos(th), ctr.y + rr * Math.cos(ph) * 0.8, ctr.z + rr * Math.sin(ph) * Math.sin(th));
        dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
        dummy.scale.setScalar(0.35 + rand() * 0.4);
        dummy.updateMatrix();
        canopy.setMatrixAt(i, dummy.matrix);
        canopy.setColorAt(i, blossomPal[Math.floor(rand() * blossomPal.length)]);
      }
      tree.add(canopy);
      const s = 1.6 + rand() * 0.7;
      tree.scale.setScalar(s);
      tree.rotation.y = rand() * Math.PI * 2;
      tree.position.set(spot.x, spot.y, spot.z);
      treeGroup.add(tree);
    });
    scene.add(treeGroup);

    /* ---------- Vintage Fence ---------- */
    {
      const postGeo = mergeGeos([
        paint(new THREE.CylinderGeometry(0.055, 0.07, 1.05, 6).translate(0, 0.52, 0), 0xffffff, 1),
        paint(new THREE.ConeGeometry(0.07, 0.12, 6).translate(0, 1.11, 0), 0xffffff, 1)
      ]);
      const railGeo = new THREE.BoxGeometry(1, 0.06, 0.05);
      const woodMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
      const FS = 2.6;
      const nF = Math.floor(curveLen / FS);
      const sides = [-1, 1];
      const postsBySide = sides.map(() => []);
      sides.forEach((side, si) => {
        for (let i = 0; i < nF; i++) {
          const gap = (i + si * 9) % 22 < 2;
          const u = i / nF;
          const p = curve.getPointAt(u);
          const T = curve.getTangentAt(u);
          const x = p.x + T.z * side * 3.7;
          const z = p.z - T.x * side * 3.7;
          postsBySide[si].push(gap ? null : new THREE.Vector3(x, heightAt(x, z) - 0.03, z));
        }
      });
      const allPosts = postsBySide.flat().filter(Boolean);
      const posts = new THREE.InstancedMesh(postGeo, woodMat, allPosts.length);
      allPosts.forEach((p, i) => {
        dummy.position.copy(p);
        dummy.rotation.set((rand() - 0.5) * 0.06, rand() * 3, (rand() - 0.5) * 0.06);
        dummy.scale.set(1, 0.92 + rand() * 0.18, 1);
        dummy.updateMatrix();
        posts.setMatrixAt(i, dummy.matrix);
        tint.setRGB(0.45 + rand() * 0.12, 0.33 + rand() * 0.08, 0.22 + rand() * 0.06);
        posts.setColorAt(i, tint);
      });
      scene.add(posts);

      const railList = [];
      postsBySide.forEach((arr) => {
        for (let i = 0; i < arr.length; i++) {
          const a = arr[i];
          const b = arr[(i + 1) % arr.length];
          if (!a || !b) continue;
          [0.4, 0.8].forEach((hh) => {
            const A = a.clone().add(new THREE.Vector3(0, hh, 0));
            const B = b.clone().add(new THREE.Vector3(0, hh, 0));
            railList.push([A, B]);
          });
        }
      });
      const rails = new THREE.InstancedMesh(railGeo, new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.9 }), railList.length);
      const qq = new THREE.Quaternion();
      railList.forEach(([A, B], i) => {
        const dir = B.clone().sub(A);
        const len = dir.length();
        qq.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());
        dummy.position.copy(A).add(B).multiplyScalar(0.5);
        dummy.quaternion.copy(qq);
        dummy.scale.set(len * 1.02, 1, 1);
        dummy.updateMatrix();
        rails.setMatrixAt(i, dummy.matrix);
        dummy.quaternion.identity();
      });
      scene.add(rails);
    }

    /* ---------- Street Lamps ---------- */
    const glowTex = glowTexture('rgba(255,236,190,1)', 'rgba(255,190,110,0.35)');
    const lampGlassMat = new THREE.MeshStandardMaterial({
      color: 0xffe4b0,
      emissive: 0xffb45a,
      emissiveIntensity: isNightMode ? 4.5 : 2.4,
      roughness: 0.3
    });
    worldAtmosphereRef.current.lampMaterials = [lampGlassMat];
    worldAtmosphereRef.current.lampHalos = [];

    {
      const postProfile = [
        [0.2, 0],
        [0.2, 0.12],
        [0.11, 0.28],
        [0.065, 0.55],
        [0.052, 2.6],
        [0.1, 2.72],
        [0.06, 2.84]
      ].map(([x, y]) => new THREE.Vector2(x, y));
      const postGeo = new THREE.LatheGeometry(postProfile, 12);
      const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, metalness: 0.8, roughness: 0.35, envMap: envTex, envMapIntensity: 0.8 });
      const lampGlassGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.5, 6);
      const capGeo = new THREE.ConeGeometry(0.3, 0.26, 6);

      const spawnLamp = (x, z) => {
        const y = heightAt(x, z);
        const lamp = new THREE.Group();
        lamp.add(new THREE.Mesh(postGeo, ironMat));
        const glass = new THREE.Mesh(lampGlassGeo, lampGlassMat);
        glass.position.y = 3.1;
        lamp.add(glass);
        const cap = new THREE.Mesh(capGeo, ironMat);
        cap.position.y = 3.5;
        lamp.add(cap);
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTex,
          color: 0xffc27a,
          transparent: true,
          opacity: isNightMode ? 0.95 : 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        }));
        halo.scale.set(isNightMode ? 3.8 : 2.8, isNightMode ? 3.8 : 2.8, 1);
        halo.position.y = 3.1;
        lamp.add(halo);
        lamp.position.set(x, y, z);
        scene.add(lamp);
        worldAtmosphereRef.current.lampHalos.push(halo);
      };

      const NL = 18;
      for (let i = 0; i < NL; i++) {
        const u = (i + 0.3) / NL;
        const p = curve.getPointAt(u);
        const T = curve.getTangentAt(u);
        const side = i % 2 === 0 ? 1 : -1;
        const x = p.x + T.z * side * 3.15;
        const z = p.z - T.x * side * 3.15;
        spawnLamp(x, z);
      }

      spawnLamp(-4.2, 5.0);
      spawnLamp(4.2, 5.0);
      spawnLamp(14.5, -3.8);
      spawnLamp(18.5, 4.2);
      spawnLamp(-18.0, 16.5);
      spawnLamp(-12.5, 23.5);
      spawnLamp(-24.5, -12.0);
      spawnLamp(-15.5, -21.0);
    }

    /* ---------- Fireflies ---------- */
    const flyCount = 320;
    const flyGeo = new THREE.BufferGeometry();
    const flyPositions = new Float32Array(flyCount * 3);
    const flyData = [];
    for (let i = 0; i < flyCount; i++) {
      const u = Math.random();
      const p = curve.getPointAt(u);
      const offsetR = 3.5 + Math.random() * 30;
      const offsetA = Math.random() * Math.PI * 2;
      const fx = p.x + Math.cos(offsetA) * offsetR;
      const fz = p.z + Math.sin(offsetA) * offsetR;
      const fy = heightAt(fx, fz) + 0.8 + Math.random() * 2.8;
      flyPositions[i * 3] = fx;
      flyPositions[i * 3 + 1] = fy;
      flyPositions[i * 3 + 2] = fz;
      flyData.push({
        baseX: fx,
        baseY: fy,
        baseZ: fz,
        radiusX: 1.2 + Math.random() * 2.8,
        radiusZ: 1.2 + Math.random() * 2.8,
        speed: 0.35 + Math.random() * 0.75,
        freqY: 0.5 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2
      });
    }
    flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPositions, 3));
    const fireflyTex = fireflyTexture();
    const flyMat = new THREE.PointsMaterial({
      map: fireflyTex,
      color: 0xffffff,
      size: isNightMode ? 4.5 : 3.2,
      transparent: true,
      opacity: isNightMode ? 0.98 : 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const firefliesMesh = new THREE.Points(flyGeo, flyMat);
    scene.add(firefliesMesh);
    worldAtmosphereRef.current.flyMat = flyMat;

    /* ================================================================== */
    /*  FLORAL DELIVERY TRUCK                                              */
    /* ================================================================== */
    const vanRoot = new THREE.Group();
    vanRoot.userData.isCart = true;
    const bodyGroup = new THREE.Group();
    vanRoot.add(bodyGroup);

    const creamMat = new THREE.MeshPhysicalMaterial({ color: 0xf7ecdc, roughness: 0.38, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.2, envMap: envTex, envMapIntensity: 0.9 });
    const wineMat = new THREE.MeshPhysicalMaterial({ color: 0x9b2c4d, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.2, envMap: envTex, envMapIntensity: 0.9, side: THREE.DoubleSide });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f5, metalness: 1, roughness: 0.15, envMap: envTex, envMapIntensity: 1.4 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9ad5f, metalness: 0.9, roughness: 0.28, envMap: envTex, envMapIntensity: 1.2 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x1b2742, roughness: 0.06, metalness: 0.3, clearcoat: 1, envMap: envTex, envMapIntensity: 1.6, side: THREE.DoubleSide });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x171316, roughness: 0.92 });

    const prof = new THREE.Shape();
    prof.moveTo(-2.0, 0.62);
    prof.lineTo(1.95, 0.62);
    prof.quadraticCurveTo(2.08, 0.62, 2.08, 0.78);
    prof.lineTo(2.08, 0.98);
    prof.quadraticCurveTo(2.08, 1.12, 1.92, 1.16);
    prof.lineTo(1.25, 1.24);
    prof.quadraticCurveTo(1.05, 1.27, 0.98, 1.45);
    prof.lineTo(0.72, 1.93);
    prof.quadraticCurveTo(0.66, 2.04, 0.5, 2.04);
    prof.lineTo(-1.7, 2.04);
    prof.quadraticCurveTo(-2.06, 2.04, -2.06, 1.7);
    prof.lineTo(-2.06, 0.78);
    prof.quadraticCurveTo(-2.06, 0.62, -2.0, 0.62);
    const BODY_D = 1.7;
    const bodyGeo = new THREE.ExtrudeGeometry(prof, {
      depth: BODY_D,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.1,
      bevelSegments: 5,
      curveSegments: 14
    });
    bodyGeo.rotateY(-Math.PI / 2);
    bodyGeo.translate(BODY_D / 2, 0, 0);
    bodyGroup.add(new THREE.Mesh(bodyGeo, creamMat));

    const skirt = new THREE.Mesh(new RoundedBoxGeometry(2.03, 0.42, 4.5, 4, 0.12), wineMat);
    skirt.position.set(0, 0.8, 0.03);
    bodyGroup.add(skirt);

    const signTexMesh = signTexture('Bưu Điện Hoa · 20/10');
    const signMat = new THREE.MeshStandardMaterial({ map: signTexMesh, roughness: 0.5, transparent: true });
    [-1, 1].forEach((side) => {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.425), signMat);
      sign.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      sign.position.set(side * 0.985, 1.45, -0.85);
      bodyGroup.add(sign);

      const wp = [[0.12, 1.5], [0.88, 1.5], [0.74, 1.9], [0.12, 1.9]];
      const sh = new THREE.Shape();
      wp.forEach(([u, v], i) => {
        const uu = side > 0 ? -u : u;
        if (i === 0) sh.moveTo(uu, v);
        else sh.lineTo(uu, v);
      });
      const wg = new THREE.ShapeGeometry(sh);
      wg.rotateY(side > 0 ? Math.PI / 2 : -Math.PI / 2);
      wg.translate(side * 0.985, 0, 0);
      bodyGroup.add(new THREE.Mesh(wg, glassMat));

      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.012, 1.25, 0.014), new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.8 }));
      seam.position.set(side * 0.985, 1.35, 0.06);
      bodyGroup.add(seam);
      const handle = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.05, 0.2, 2, 0.015), chromeMat);
      handle.position.set(side * 1.0, 1.3, 0.22);
      bodyGroup.add(handle);
    });

    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.58), glassMat);
    ws.rotation.x = -0.4636;
    ws.position.set(0, 1.77, 0.96);
    bodyGroup.add(ws);
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.42), glassMat);
    rw.rotation.y = Math.PI;
    rw.position.set(0, 1.75, -2.17);
    bodyGroup.add(rw);

    [2.28, -2.27].forEach((zz) => {
      const bump = new THREE.Mesh(new RoundedBoxGeometry(2.1, 0.12, 0.14, 3, 0.05), chromeMat);
      bump.position.set(0, 0.64, zz);
      bodyGroup.add(bump);
    });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffd27a, emissiveIntensity: 2.4, roughness: 0.2 });
    [-0.62, 0.62].forEach((hx) => {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), headMat);
      lamp.scale.set(1, 1, 0.65);
      lamp.position.set(hx, 0.98, 2.2);
      bodyGroup.add(lamp);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.028, 8, 28), chromeMat);
      ring.position.set(hx, 0.98, 2.2);
      bodyGroup.add(ring);
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff3b4a, emissive: 0xd0102a, emissiveIntensity: 1.6 }));
      tail.position.set(hx * 1.25, 1.0, -2.22);
      bodyGroup.add(tail);
    });
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.3, 0.04), new THREE.MeshStandardMaterial({ color: 0x15121a, roughness: 0.5 }));
    grille.position.set(0, 0.88, 2.2);
    bodyGroup.add(grille);
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.016, 0.03), chromeMat);
      bar.position.set(0, 0.78 + i * 0.075, 2.225);
      bodyGroup.add(bar);
    }

    const fenderGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.34, 28, 1, true, 0, Math.PI);
    fenderGeo.rotateZ(Math.PI / 2);
    const wheelDefs = [
      { x: -1.06, z: 1.38, front: true, side: -1 },
      { x: 1.06, z: 1.38, front: true, side: 1 },
      { x: -1.06, z: -1.25, front: false, side: -1 },
      { x: 1.06, z: -1.25, front: false, side: 1 }
    ];
    const steerPivots = [];
    const spinGroups = [];
    wheelDefs.forEach((wd) => {
      const pivot = new THREE.Group();
      pivot.position.set(wd.x, 0.48, wd.z);
      const spin = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.14, 14, 32), tireMat);
      tire.rotation.y = Math.PI / 2;
      spin.add(tire);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 28).rotateZ(Math.PI / 2), creamMat);
      spin.add(disc);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 8, 28), chromeMat);
      rim.rotation.y = Math.PI / 2;
      rim.position.x = wd.side * 0.1;
      spin.add(rim);
      const hub = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-Math.PI / 2 * wd.side), chromeMat);
      hub.position.x = wd.side * 0.1;
      spin.add(hub);
      for (let k = 0; k < 3; k++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.6, 0.035), goldMat);
        bar.position.x = wd.side * 0.102;
        bar.rotation.x = (k * Math.PI) / 3;
        spin.add(bar);
      }
      pivot.add(spin);
      bodyGroup.add(pivot);
      steerPivots.push(wd.front ? pivot : null);
      spinGroups.push(spin);
      const fender = new THREE.Mesh(fenderGeo, wineMat);
      fender.position.set(wd.x, 0.48, wd.z);
      bodyGroup.add(fender);
    });

    const rackBar = (x, y, z, w, h, d) => {
      const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.4), goldMat);
      m.position.set(x, y, z);
      bodyGroup.add(m);
    };
    const RX = 0.78;
    const RZ0 = -1.78;
    const RZ1 = 0.32;
    const RY0 = 2.17;
    const RY1 = 2.52;
    [
      [-RX, RZ0], [RX, RZ0], [-RX, RZ1], [RX, RZ1]
    ].forEach(([x, z]) => rackBar(x, (RY0 + RY1) / 2, z, 0.04, RY1 - RY0, 0.04));
    rackBar(0, RY1, RZ0, RX * 2, 0.04, 0.04);
    rackBar(0, RY1, RZ1, RX * 2, 0.04, 0.04);
    rackBar(-RX, RY1, (RZ0 + RZ1) / 2, 0.04, 0.04, RZ1 - RZ0);
    rackBar(RX, RY1, (RZ0 + RZ1) / 2, 0.04, 0.04, RZ1 - RZ0);
    rackBar(-RX, (RY0 + RY1) / 2, (RZ0 + RZ1) / 2, 0.03, 0.03, RZ1 - RZ0);
    rackBar(RX, (RY0 + RY1) / 2, (RZ0 + RZ1) / 2, 0.03, 0.03, RZ1 - RZ0);

    {
      const nR = 120;
      const roofRoses = new THREE.InstancedMesh(makeRoseHead(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide }), nR);
      const palRoof = [0xe11d48, 0xfb7185, 0xfda4af, 0xfff1f2, 0xf43f5e, 0xfcd34d].map((h) => new THREE.Color(h));
      for (let i = 0; i < nR; i++) {
        const px = (rand() * 2 - 1) * (RX - 0.1);
        const pz = RZ0 + 0.1 + rand() * (RZ1 - RZ0 - 0.2);
        const nx = px / RX;
        const nz = (pz - (RZ0 + RZ1) / 2) / ((RZ1 - RZ0) / 2);
        const dome = Math.max(0, 1 - nx * nx * 0.7 - nz * nz * 0.5);
        dummy.position.set(px, RY0 + 0.08 + dome * 0.38 + rand() * 0.08, pz);
        dummy.rotation.set((rand() - 0.5) * 0.7, rand() * 6, (rand() - 0.5) * 0.7);
        dummy.scale.setScalar(0.9 + rand() * 0.7);
        dummy.updateMatrix();
        roofRoses.setMatrixAt(i, dummy.matrix);
        roofRoses.setColorAt(i, palRoof[Math.floor(rand() * palRoof.length)]);
      }
      bodyGroup.add(roofRoses);
    }

    {
      const sack = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 6, 14), new THREE.MeshStandardMaterial({ color: 0x8a4a22, roughness: 0.75 }));
      sack.rotation.z = Math.PI / 2 - 0.2;
      sack.rotation.y = 0.3;
      sack.position.set(0.28, RY0 + 0.3, 0.05);
      bodyGroup.add(sack);
      const cord = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 6, 20), goldMat);
      cord.rotation.y = Math.PI / 2;
      cord.position.set(0.08, RY0 + 0.32, 0.12);
      bodyGroup.add(cord);
      const paper = new THREE.MeshStandardMaterial({ color: 0xfff7ea, roughness: 0.6 });
      const sealMat = new THREE.MeshStandardMaterial({ color: 0xc81e43, roughness: 0.4 });
      const sealGeo = makeHeartGeometry(0.05, 0.02).scale(0.08, 0.08, 0.08);
      for (let i = 0; i < 6; i++) {
        const env = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.24), paper);
        env.position.set(-0.45, RY0 + 0.12 + i * 0.024, -0.2);
        env.rotation.y = (i - 3) * 0.12;
        bodyGroup.add(env);
      }
      const topSeal = new THREE.Mesh(sealGeo, sealMat);
      topSeal.rotation.x = -Math.PI / 2;
      topSeal.position.set(-0.45, RY0 + 0.28, -0.2);
      bodyGroup.add(topSeal);
    }

    const fairyOrbs = [];
    {
      const orbGeo = new THREE.SphereGeometry(0.035, 8, 6);
      const loop = [[-RX, RZ0], [RX, RZ0], [RX, RZ1], [-RX, RZ1]];
      let idx = 0;
      for (let e = 0; e < 4; e++) {
        const [ax, az] = loop[e];
        const [bx, bz] = loop[(e + 1) % 4];
        for (let k = 0; k < 8; k++) {
          const t = k / 8;
          const orb = new THREE.Mesh(
            orbGeo,
            new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: idx % 2 ? 0xffb85a : 0xff8fb0, emissiveIntensity: 3, roughness: 0.3 })
          );
          orb.position.set(ax + (bx - ax) * t, RY1 - 0.04 - Math.sin(t * Math.PI) * 0.06, az + (bz - az) * t);
          bodyGroup.add(orb);
          fairyOrbs.push({ orb, off: idx++ });
        }
      }
    }

    const heartGeoItem = makeHeartGeometry(0.2, 0.07);
    const heartMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      roughness: 0.15,
      clearcoat: 1,
      emissive: 0x7f1230,
      emissiveIntensity: 0.7,
      envMap: envTex,
      envMapIntensity: 1.3
    });
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xfff8ee, roughness: 0.5 });
    const flapMat = new THREE.MeshStandardMaterial({ color: 0xf3e3cf, roughness: 0.6, side: THREE.DoubleSide });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, emissive: 0xffffff, emissiveIntensity: 0.22, side: THREE.DoubleSide });
    const sealHeartGeo = makeHeartGeometry(0.06, 0.025).scale(0.1, 0.1, 0.1);
    const sealItemMat = new THREE.MeshStandardMaterial({ color: 0xc81e43, roughness: 0.35 });

    const featherShape = new THREE.Shape();
    featherShape.moveTo(0, 0);
    featherShape.bezierCurveTo(0.12, 0.075, 0.34, 0.07, 1, 0);
    featherShape.bezierCurveTo(0.34, -0.05, 0.12, -0.045, 0, 0);
    const featherGeo = new THREE.ShapeGeometry(featherShape, 8);

    const escort = new THREE.Group();
    vanRoot.add(escort);

    const makeGlowSprite = (color, scale) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.scale.set(scale, scale, 1);
      return s;
    };

    function makeWingedLetter(idx) {
      const group = new THREE.Group();
      group.userData = { isFloatingItem: true, index: idx };
      group.add(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.38, 0.03), paperMat));
      const flapShape = new THREE.Shape();
      flapShape.moveTo(-0.28, 0.19);
      flapShape.lineTo(0.28, 0.19);
      flapShape.lineTo(0, -0.04);
      const flap = new THREE.Mesh(new THREE.ShapeGeometry(flapShape), flapMat);
      flap.position.z = 0.017;
      group.add(flap);
      const seal = new THREE.Mesh(sealHeartGeo, sealItemMat);
      seal.position.set(0, -0.03, 0.03);
      group.add(seal);

      const mkWing = (dir) => {
        const w = new THREE.Group();
        for (let i = 0; i < 7; i++) {
          const f = new THREE.Mesh(featherGeo, wingMat);
          f.scale.set(0.58 - i * 0.045, 1.0 + (6 - i) * 0.05, 1);
          f.rotation.z = -0.4 + i * 0.17;
          f.position.z = -0.002 * i;
          w.add(f);
        }
        w.position.set(dir * 0.27, 0.03, 0);
        w.scale.x = dir;
        return w;
      };
      const wingL = mkWing(-1);
      const wingR = mkWing(1);
      group.add(wingL, wingR);
      group.add(makeGlowSprite(0xffd9a0, 1.6));
      return { group, wingL, wingR };
    }

    function makeCrystalHeart(idx) {
      const group = new THREE.Group();
      group.userData = { isFloatingItem: true, index: idx };
      const h = new THREE.Mesh(heartGeoItem, heartMat);
      group.add(h);
      group.add(makeGlowSprite(0xff6b8f, 1.9));
      return { group };
    }

    const floatingItems = [];
    const itemDefs = [
      { type: 'wing', base: [-1.3, 3.7, -3.0], speed: 2.0, scale: 1.7 },
      { type: 'heart', base: [1.9, 3.5, -1.8], speed: 2.4, scale: 1.5 },
      { type: 'wing', base: [0.2, 4.6, 0.4], speed: 1.8, scale: 1.7 },
      { type: 'heart', base: [-2.1, 3.4, 1.0], speed: 2.1, scale: 1.4 },
      { type: 'wing', base: [1.7, 4.2, 2.4], speed: 2.2, scale: 1.7 }
    ];
    itemDefs.forEach((def, idx) => {
      const it = def.type === 'wing' ? makeWingedLetter(idx) : makeCrystalHeart(idx);
      it.group.scale.setScalar(def.scale);
      it.group.position.set(...def.base);
      escort.add(it.group);
      floatingItems.push({ ...it, ...def, baseV: new THREE.Vector3(...def.base) });
    });

    const vanSignTex = signTexture('Chạm Mở Hòm Thư Mật 💌');
    const vanSignSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: vanSignTex, transparent: true }));
    vanSignSprite.position.set(0, 3.8, -0.6);
    vanSignSprite.scale.set(4.4, 1.1, 1);
    vanRoot.add(vanSignSprite);

    scene.add(vanRoot);

    /* ---------- Gazebo ---------- */
    {
      const gazeboPt = curve.getPointAt(0.52);
      const gazT = curve.getTangentAt(0.52);
      const gazNorm = new THREE.Vector3(gazT.z, 0, -gazT.x).normalize();
      const gazPos = gazeboPt.clone().add(gazNorm.clone().multiplyScalar(8.2));
      const gazeboGroup = new THREE.Group();
      gazeboGroup.position.set(gazPos.x, heightAt(gazPos.x, gazPos.z), gazPos.z);

      const gazBase = new THREE.Mesh(
        new THREE.CylinderGeometry(5.2, 5.8, 0.5, 24),
        new THREE.MeshStandardMaterial({ color: 0xFFFDF9, roughness: 0.5 })
      );
      gazeboGroup.add(gazBase);

      const colMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 });
      for (let c = 0; c < 8; c++) {
        const a = (c / 8) * Math.PI * 2;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.8, 12), colMat);
        col.position.set(Math.cos(a) * 4.2, 2.1, Math.sin(a) * 4.2);
        gazeboGroup.add(col);
      }
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0xC9A66B,
        metalness: 0.85,
        roughness: 0.25,
        envMap: envTex
      });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(4.4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
      dome.position.y = 4.0;
      gazeboGroup.add(dome);
      scene.add(gazeboGroup);
    }

    /* ---------- Petals & Trail ---------- */
    const petalTex = petalTexture();
    const dotTex = glowTexture();
    const PETALS = Math.floor(260 * Q);
    const petalGeo = new THREE.BufferGeometry();
    const petalPos = new Float32Array(PETALS * 3);
    petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
    const petalPts = new THREE.Points(
      petalGeo,
      new THREE.PointsMaterial({ map: petalTex, size: 0.26, transparent: true, depthWrite: false, alphaTest: 0.02, color: 0xffd0e0 })
    );
    petalPts.frustumCulled = false;
    scene.add(petalPts);

    const TRAIL = 220;
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(TRAIL * 3).fill(-999);
    const trailCol = new Float32Array(TRAIL * 3);
    const trailVel = new Float32Array(TRAIL * 3);
    const trailLife = new Float32Array(TRAIL);
    const trailBase = new Float32Array(TRAIL * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));
    const trailPts = new THREE.Points(
      trailGeo,
      new THREE.PointsMaterial({ map: dotTex, size: 0.28, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true })
    );
    trailPts.frustumCulled = false;
    scene.add(trailPts);
    let trailHead = 0;
    const trailPalette = [new THREE.Color(0xffb3c9), new THREE.Color(0xffe29a), new THREE.Color(0xffffff), new THREE.Color(0xf9a8d4)];

    /* ================================================================== */
    /*  STATIONS                                                           */
    /* ================================================================== */
    const interactiveMeshes = [];
    const stationCameraPositions = {};

    let chestAura1 = null, chestAura2 = null, cakeAura = null;

    /* ================= FIREWORKS ================= */
    const FW = { max: 7000, parts: [], rockets: [], lights: [], li: 0 };

    const fwTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.25, 'rgba(255,255,255,0.85)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();

    const fwGeo = new THREE.BufferGeometry();
    const fwPos = new Float32Array(FW.max * 3);
    const fwCol = new Float32Array(FW.max * 3);
    fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPos, 3));
    fwGeo.setAttribute('color', new THREE.BufferAttribute(fwCol, 3));
    fwGeo.setDrawRange(0, 0);
    const fwPoints = new THREE.Points(fwGeo, new THREE.PointsMaterial({
      size: 1.15, map: fwTex, vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    }));
    fwPoints.frustumCulled = false;
    scene.add(fwPoints);

    for (let i = 0; i < 4; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 160, 1.5);
      scene.add(l); FW.lights.push(l);
    }
    const fwFlash = (pos, color) => {
      const l = FW.lights[FW.li++ % FW.lights.length];
      l.position.copy(pos); l.color.copy(color); l.intensity = 14;
    };

    let fwAC = null, fwNoise = null, lastCrackle = 0;
    const getAC = () => {
      if (!fwAC) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          fwAC = new AudioContextClass();
          const len = fwAC.sampleRate * 2;
          fwNoise = fwAC.createBuffer(1, len, fwAC.sampleRate);
          const d = fwNoise.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        }
      }
      if (fwAC && fwAC.state === 'suspended') {
        fwAC.resume().catch(() => {});
      }
      return fwAC;
    };
    const noiseSrc = (ac) => { const s = ac.createBufferSource(); s.buffer = fwNoise; return s; };

    const soundLaunch = () => {
      const ac = getAC(); if (!ac) return;
      const t = ac.currentTime;
      try {
        const s = noiseSrc(ac), f = ac.createBiquadFilter(), g = ac.createGain();
        f.type = 'bandpass'; f.Q.value = 2;
        f.frequency.setValueAtTime(500, t);
        f.frequency.exponentialRampToValueAtTime(2500, t + 1.0);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.1);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        s.connect(f).connect(g).connect(ac.destination);
        s.start(t); s.stop(t + 1.2);
      } catch (e) {}
    };
    const soundBoom = (delay = 0.05, vol = 0.7) => {
      const ac = getAC(); if (!ac) return;
      const t = ac.currentTime + delay;
      try {
        const s = noiseSrc(ac), f = ac.createBiquadFilter(), g = ac.createGain();
        f.type = 'lowpass'; f.frequency.setValueAtTime(900, t);
        f.frequency.exponentialRampToValueAtTime(80, t + 1.2);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        s.connect(f).connect(g).connect(ac.destination);
        s.start(t); s.stop(t + 1.5);
        const o = ac.createOscillator(), og = ac.createGain();
        o.frequency.setValueAtTime(110, t);
        o.frequency.exponentialRampToValueAtTime(28, t + 0.6);
        og.gain.setValueAtTime(vol * 0.9, t);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        o.connect(og).connect(ac.destination); o.start(t); o.stop(t + 0.8);
      } catch (e) {}
    };
    const soundCrackle = () => {
      const now = performance.now();
      if (now - lastCrackle < 120) return; lastCrackle = now;
      const ac = getAC(); if (!ac) return;
      const t0 = ac.currentTime;
      try {
        for (let i = 0; i < 8; i++) {
          const t = t0 + Math.random() * 0.6;
          const s = noiseSrc(ac), f = ac.createBiquadFilter(), g = ac.createGain();
          f.type = 'highpass'; f.frequency.value = 2500;
          g.gain.setValueAtTime(0.25, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
          s.connect(f).connect(g).connect(ac.destination);
          s.start(t, Math.random()); s.stop(t + 0.05);
        }
      } catch (e) {}
    };

    const soundClink = () => {
      const ac = getAC(); if (!ac) return;
      const t = ac.currentTime;
      try {
        const o1 = ac.createOscillator(), g1 = ac.createGain();
        o1.type = 'sine';
        o1.frequency.setValueAtTime(2800, t);
        o1.frequency.exponentialRampToValueAtTime(2200, t + 0.9);
        g1.gain.setValueAtTime(0.35, t);
        g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o1.connect(g1).connect(ac.destination);
        o1.start(t); o1.stop(t + 0.95);

        const o2 = ac.createOscillator(), g2 = ac.createGain();
        o2.type = 'sine';
        o2.frequency.setValueAtTime(3600, t + 0.04);
        o2.frequency.exponentialRampToValueAtTime(2900, t + 0.85);
        g2.gain.setValueAtTime(0.2, t + 0.04);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
        o2.connect(g2).connect(ac.destination);
        o2.start(t + 0.04); o2.stop(t + 0.9);
      } catch (e) {}
    };

    const addPart = (pos, vel, color, life, decay, drag, grav, flicker = false, crackle = false) => {
      if (FW.parts.length >= FW.max) return;
      FW.parts.push({ pos: pos.clone(), vel, color, life, decay, drag, grav, flicker, crackle });
    };

    const PALETTES = [
      [0xF43F5E, 0xFDE68A], [0x38BDF8, 0xFFFFFF], [0xC084FC, 0xFDE047],
      [0x34D399, 0xFEF08A], [0xFB923C, 0xFDE68A], [0xFF4D8D, 0x60A5FA], [0xFFD700, 0xFFFFFF]
    ];
    const pickPal = () => PALETTES[Math.floor(rand() * PALETTES.length)].map(c => new THREE.Color(c));

    const randDir = () => {
      const th = rand() * Math.PI * 2, ph = Math.acos(2 * rand() - 1);
      return new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
    };

    const explode = (pos, type) => {
      const pal = pickPal();
      fwFlash(pos, pal[0]);
      addPart(pos, new THREE.Vector3(), new THREE.Color(0xffffff), 1, 6, 0, 0);
      soundBoom(0.08 + rand() * 0.1);

      if (type === 'sphere') {
        for (let i = 0; i < 160; i++)
          addPart(pos, randDir().multiplyScalar(13 + rand() * 4), pal[i % pal.length].clone(), 1, 0.45 + rand() * 0.3, 1.3, 7, true);
      } else if (type === 'double') {
        for (let i = 0; i < 120; i++)
          addPart(pos, randDir().multiplyScalar(15), pal[0].clone(), 1, 0.5, 1.3, 7, true);
        for (let i = 0; i < 80; i++)
          addPart(pos, randDir().multiplyScalar(7), pal[1].clone(), 1, 0.6, 1.3, 7, true);
      } else if (type === 'ring') {
        const axis = randDir(), u = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0.3)).normalize(), v = new THREE.Vector3().crossVectors(axis, u);
        for (let i = 0; i < 90; i++) {
          const a = (i / 90) * Math.PI * 2;
          const d = u.clone().multiplyScalar(Math.cos(a)).add(v.clone().multiplyScalar(Math.sin(a)));
          addPart(pos, d.multiplyScalar(14), pal[0].clone(), 1, 0.5, 1.2, 5, true);
        }
      } else if (type === 'willow') {
        const gold = new THREE.Color(0xFFB938);
        for (let i = 0; i < 130; i++)
          addPart(pos, randDir().multiplyScalar(8 + rand() * 4), gold.clone(), 1, 0.22 + rand() * 0.1, 1.6, 10, true);
      } else if (type === 'crackle') {
        for (let i = 0; i < 100; i++)
          addPart(pos, randDir().multiplyScalar(12 + rand() * 4), pal[i % 2].clone(), 1, 0.6 + rand() * 0.3, 1.3, 7, true, true);
      }
    };

    const launchRocket = (x, z, targetY) => {
      const baseH = heightAt(x, z);
      const types = ['sphere', 'sphere', 'double', 'ring', 'willow', 'crackle'];
      FW.rockets.push({
        pos: new THREE.Vector3(x, baseH + 18, z),
        vel: new THREE.Vector3((rand() - 0.5) * 4, 32 + rand() * 8, (rand() - 0.5) * 4),
        fuse: 1.1 + rand() * 0.5,
        type: types[Math.floor(rand() * types.length)],
        y: targetY
      });
      soundLaunch();
    };

    const updateFireworks = (dt) => {
      dt = Math.min(dt, 0.05);

      for (let i = FW.rockets.length - 1; i >= 0; i--) {
        const r = FW.rockets[i];
        r.pos.addScaledVector(r.vel, dt);
        r.vel.y -= 6 * dt;
        r.fuse -= dt;
        for (let k = 0; k < 3; k++)
          addPart(r.pos, new THREE.Vector3((rand() - 0.5) * 2, -2 - rand() * 3, (rand() - 0.5) * 2),
            new THREE.Color(0xFFC857), 0.8, 2.5 + rand(), 1, 2, true);
        if (r.fuse <= 0) { explode(r.pos, r.type); FW.rockets.splice(i, 1); }
      }

      for (let i = FW.parts.length - 1; i >= 0; i--) {
        const p = FW.parts[i];
        p.vel.multiplyScalar(Math.max(0, 1 - p.drag * dt));
        p.vel.y -= p.grav * dt;
        p.pos.addScaledVector(p.vel, dt);
        p.life -= p.decay * dt;
        if (p.life <= 0) {
          if (p.crackle) {
            soundCrackle();
            for (let k = 0; k < 3; k++)
              addPart(p.pos, randDir().multiplyScalar(5), new THREE.Color(0xffffff), 0.5, 3, 1, 4, true);
          }
          FW.parts[i] = FW.parts[FW.parts.length - 1]; FW.parts.pop();
        }
      }

      const n = FW.parts.length;
      for (let i = 0; i < n; i++) {
        const p = FW.parts[i];
        const f = p.life * (p.flicker ? (0.4 + Math.random() * 0.8) : 1);
        fwPos[i * 3] = p.pos.x; fwPos[i * 3 + 1] = p.pos.y; fwPos[i * 3 + 2] = p.pos.z;
        fwCol[i * 3] = p.color.r * f; fwCol[i * 3 + 1] = p.color.g * f; fwCol[i * 3 + 2] = p.color.b * f;
      }
      fwGeo.setDrawRange(0, n);
      fwGeo.attributes.position.needsUpdate = true;
      fwGeo.attributes.color.needsUpdate = true;

      FW.lights.forEach(l => { l.intensity *= Math.pow(0.02, dt); });
    };

    let triggerCastleFireworks = () => {};

    /* ------------------------------------------------------------------ */
    /*  STATION 0: GIFT BOX                                                */
    /* ------------------------------------------------------------------ */
    {
      const pt = curve.getPointAt(STATIONS[0].u);
      const T = curve.getTangentAt(STATIONS[0].u);
      const norm = new THREE.Vector3(T.z, 0, -T.x).normalize();
      const st0Center = pt.clone().add(norm.clone().multiplyScalar(6.5));
      const st0Group = new THREE.Group();
      st0Group.position.set(st0Center.x, heightAt(st0Center.x, st0Center.z), st0Center.z);

      const pl = new THREE.Mesh(
        new THREE.CylinderGeometry(5.2, 5.6, 0.4, 32),
        new THREE.MeshStandardMaterial({ color: 0xFFFAF3, roughness: 0.6 })
      );
      st0Group.add(pl);

      const giftBodyMat = new THREE.MeshStandardMaterial({ color: 0xFB7185, roughness: 0.35, metalness: 0.2, envMap: envTex });
      const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xE5C388, metalness: 0.85, roughness: 0.25, envMap: envTex });
      const bodyBox = new THREE.Mesh(new RoundedBoxGeometry(2.4, 2.0, 2.4, 5, 0.12), giftBodyMat);
      bodyBox.position.y = 1.2;
      bodyBox.castShadow = true;
      st0Group.add(bodyBox);

      const rH = new THREE.Mesh(new THREE.BoxGeometry(2.46, 2.02, 0.45), ribbonMat);
      rH.position.y = 1.2;
      st0Group.add(rH);
      const rV = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.02, 2.46), ribbonMat);
      rV.position.y = 1.2;
      st0Group.add(rV);

      const lidGroup = new THREE.Group();
      lidGroup.position.set(0, 2.25, 0);
      const lidBox = new THREE.Mesh(new RoundedBoxGeometry(2.55, 0.45, 2.55, 4, 0.08), giftBodyMat);
      lidGroup.add(lidBox);
      const lidRH = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.47, 0.46), ribbonMat);
      lidGroup.add(lidRH);
      const lidRV = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.47, 2.58), ribbonMat);
      lidGroup.add(lidRV);

      const bowL = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.14, 8, 20), ribbonMat);
      bowL.rotation.z = Math.PI / 4;
      bowL.rotation.y = 0.4;
      bowL.position.set(-0.35, 0.5, 0);
      lidGroup.add(bowL);
      const bowR = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.14, 8, 20), ribbonMat);
      bowR.rotation.z = -Math.PI / 4;
      bowR.rotation.y = -0.4;
      bowR.position.set(0.35, 0.5, 0);
      lidGroup.add(bowR);
      st0Group.add(lidGroup);
      giftAnimationRef.current.lidMesh = lidGroup;

      const butterflyGroup = new THREE.Group();
      const bPal = [0xf43f5e, 0xfbbf24, 0x60a5fa, 0x34d399, 0xa78bfa, 0xf472b6];
      const butterflyObjs = [];
      for (let b = 0; b < 10; b++) {
        const bGroup = new THREE.Group();
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.bezierCurveTo(0.1, 0.25, 0.35, 0.3, 0.5, 0.1);
        wingShape.bezierCurveTo(0.35, -0.15, 0.1, -0.05, 0, 0);
        const wMat = new THREE.MeshStandardMaterial({
          color: bPal[b % bPal.length],
          side: THREE.DoubleSide,
          emissive: bPal[b % bPal.length],
          emissiveIntensity: 0.3
        });
        const wGeo = new THREE.ShapeGeometry(wingShape, 6);
        const wingLeft = new THREE.Mesh(wGeo, wMat);
        const wingRight = new THREE.Mesh(wGeo, wMat);
        wingRight.scale.x = -1;
        bGroup.add(wingLeft, wingRight);
        bGroup.position.set((rand() - 0.5) * 1.2, 1.2, (rand() - 0.5) * 1.2);
        bGroup.scale.setScalar(0.7 + rand() * 0.5);
        bGroup.visible = false;
        butterflyGroup.add(bGroup);
        butterflyObjs.push({
          group: bGroup,
          wingLeft,
          wingRight,
          initialPos: bGroup.position.clone(),
          targetOffset: new THREE.Vector3((rand() - 0.5) * 6, 4 + rand() * 5, (rand() - 0.5) * 6),
          speed: 1.5 + rand() * 1.5
        });
      }
      st0Group.add(butterflyGroup);
      giftAnimationRef.current.butterflies = butterflyObjs;

      const balloonObjs = [];
      const miniBMat = [0xf43f5e, 0xfb7185, 0xfbbf24, 0xc084fc, 0x38bdf8];
      for (let m = 0; m < 8; m++) {
        const spMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 16, 16).scale(1, 1.2, 1),
          new THREE.MeshStandardMaterial({ color: miniBMat[m % miniBMat.length], roughness: 0.3, metalness: 0.3, envMap: envTex })
        );
        spMesh.position.set((rand() - 0.5) * 0.8, 1.3, (rand() - 0.5) * 0.8);
        spMesh.visible = false;
        st0Group.add(spMesh);
        balloonObjs.push({
          mesh: spMesh,
          initialPos: spMesh.position.clone(),
          targetOffset: new THREE.Vector3((rand() - 0.5) * 4, 5 + rand() * 6, (rand() - 0.5) * 4),
          speed: 1.2 + rand() * 1.0
        });
      }
      giftAnimationRef.current.balloons = balloonObjs;

      const crystalHeartGeo = makeHeartGeometry(0.55, 0.2);
      const crystalHeartMat = new THREE.MeshPhysicalMaterial({
        color: 0xFF2A55,
        roughness: 0.12,
        metalness: 0.2,
        transmission: 0.75,
        thickness: 0.6,
        emissive: 0xBE123C,
        emissiveIntensity: 1.4,
        envMap: envTex
      });
      const crystalHeart = new THREE.Mesh(crystalHeartGeo, crystalHeartMat);
      crystalHeart.position.set(0, 1.2, 0);
      crystalHeart.visible = false;
      st0Group.add(crystalHeart);
      giftAnimationRef.current.crystalHeart = crystalHeart;

      const heartHalo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xFDE68A,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      }));
      heartHalo.scale.set(3.4, 3.4, 1);
      heartHalo.position.set(0, 1.2, 0);
      heartHalo.visible = false;
      st0Group.add(heartHalo);
      giftAnimationRef.current.heartHalo = heartHalo;

      const welcomeSignTex = signTexture(`Chào Mừng ${sisterName} • Hành Trình 20/10 ✨`);
      const welcomeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: welcomeSignTex, transparent: true }));
      welcomeSprite.position.set(0, 1.2, 0);
      welcomeSprite.scale.set(5.6, 1.4, 1);
      welcomeSprite.visible = false;
      st0Group.add(welcomeSprite);
      giftAnimationRef.current.welcomeSign = welcomeSprite;

      const giftSignTex = signTexture('Mở Hộp Quà 20/10');
      const giftSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: giftSignTex, transparent: true }));
      giftSprite.position.set(0, 4.4, 0);
      giftSprite.scale.set(4.2, 1.05, 1);
      st0Group.add(giftSprite);

      scene.add(st0Group);

      const onGiftClick = () => {
        playSparkleSound();
        giftAnimationRef.current.opened = true;
        confetti({
          particleCount: 140,
          spread: 110,
          origin: { y: 0.55 },
          colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#E11D48']
        });
        showToast(`🎁 Điều kỳ diệu đã xuất hiện! Dành tặng riêng đóa hoa ${sisterName}...`);
        setTimeout(() => {
          flyToStation(1);
        }, 3400);
      };

      interactiveMeshes.push({ mesh: bodyBox, onClick: onGiftClick });
      interactiveMeshes.push({ mesh: lidBox, onClick: onGiftClick });
      interactiveMeshes.push({ mesh: giftSprite, onClick: onGiftClick });
      interactiveMeshes.push({ mesh: crystalHeart, onClick: onGiftClick });

      stationCameraPositions[0] = {
        targetPos: st0Center.clone().add(new THREE.Vector3(0, 1.6, 0)),
        camPos: st0Center.clone().add(norm.clone().multiplyScalar(10.5)).add(new THREE.Vector3(0, 4.2, 0))
      };
    }

    /* ------------------------------------------------------------------ */
    /*  STATION 1: LETTER                                                  */
    /* ------------------------------------------------------------------ */
    {
      const pt = curve.getPointAt(STATIONS[1].u);
      const T = curve.getTangentAt(STATIONS[1].u);
      const norm = new THREE.Vector3(T.z, 0, -T.x).normalize();
      const st1Center = pt.clone().add(norm.clone().multiplyScalar(7.2));
      const st1Group = new THREE.Group();
      st1Group.position.set(st1Center.x, heightAt(st1Center.x, st1Center.z), st1Center.z);
      st1Group.rotation.set(0, Math.atan2(norm.x, norm.z), 0);

      const pl = new THREE.Mesh(
        new THREE.CylinderGeometry(7.2, 7.8, 0.45, 32),
        new THREE.MeshStandardMaterial({ color: 0xFFFAF3, roughness: 0.6 })
      );
      st1Group.add(pl);

      const bifoldRoot = new THREE.Group();
      bifoldRoot.position.set(0, 2.4, 0);

      const cardMat = new THREE.MeshStandardMaterial({ color: 0xFAF3EA, roughness: 0.8, metalness: 0.05 });
      const goldFrameMat = new THREE.MeshStandardMaterial({ color: 0xE5C388, metalness: 0.85, roughness: 0.25, envMap: envTex });

      const leftWing = new THREE.Mesh(new RoundedBoxGeometry(3.4, 4.4, 0.14, 4, 0.04), cardMat);
      leftWing.position.set(-1.75, 0, 0.35);
      leftWing.rotation.y = 0.22;
      bifoldRoot.add(leftWing);

      const photoFrame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.5, 0.04), goldFrameMat);
      photoFrame.position.set(0, 0.2, 0.05);
      leftWing.add(photoFrame);

      const texLoader = new THREE.TextureLoader();
      texLoader.load('/images.jpg', (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const photoMat = new THREE.MeshBasicMaterial({ map: tex });
        photoMat.polygonOffset = true;
        photoMat.polygonOffsetFactor = -1;
        const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3.3), photoMat);
        photoMesh.position.set(0, 0.2, 0.10);
        leftWing.add(photoMesh);
      });

      const namePlate = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.45, 0.03), goldFrameMat);
      namePlate.position.set(0, -1.7, 0.08);
      leftWing.add(namePlate);

      const rightWing = new THREE.Mesh(new RoundedBoxGeometry(3.4, 4.4, 0.14, 4, 0.04), cardMat);
      rightWing.position.set(1.75, 0, 0.35);
      rightWing.rotation.y = -0.22;
      bifoldRoot.add(rightWing);

      const letterCanvas = document.createElement('canvas');
      letterCanvas.width = 640;
      letterCanvas.height = 840;
      const lG = letterCanvas.getContext('2d');
      lG.fillStyle = '#FAF3EA';
      lG.fillRect(0, 0, 640, 840);
      lG.strokeStyle = '#C9A66B';
      lG.lineWidth = 6;
      lG.strokeRect(20, 20, 600, 800);
      lG.strokeStyle = 'rgba(201, 166, 107, 0.4)';
      lG.lineWidth = 2;
      lG.strokeRect(30, 30, 580, 780);

      lG.fillStyle = '#8C2F4B';
      lG.font = 'italic bold 32px "Playfair Display", Georgia, serif';
      lG.fillText('Thân Gửi Phái Đẹp TechCorp,', 45, 95);

      lG.fillStyle = '#2D1B28';
      lG.font = '500 22px "Be Vietnam Pro", sans-serif';
      const lines = [
        'Nhân ngày Phụ Nữ Việt Nam 20.10,',
        'Toàn thể anh em xin gửi ngàn đóa hoa',
        'và những lời chúc tốt đẹp nhất tới chị em.',
        'Cảm ơn sự rạng rỡ, năng lượng tích cực',
        'và những đóng góp tuyệt vời của chị em',
        'trên mỗi chặng đường phát triển công ty.',
        'Chúc chị em luôn luôn hạnh phúc,',
        'tươi trẻ, yêu đời và mãi tỏa sáng!'
      ];
      lines.forEach((l, idx) => {
        lG.fillText(l, 45, 170 + idx * 46);
      });

      lG.beginPath();
      lG.arc(320, 660, 54, 0, Math.PI * 2);
      lG.fillStyle = '#BE123C';
      lG.fill();
      lG.strokeStyle = '#FDE68A';
      lG.lineWidth = 4;
      lG.stroke();
      lG.fillStyle = '#FFF';
      lG.font = 'bold 28px serif';
      lG.textAlign = 'center';
      lG.fillText('20.10', 320, 670);

      const letterTex = new THREE.CanvasTexture(letterCanvas);
      letterTex.colorSpace = THREE.SRGBColorSpace;
      const letterMat = new THREE.MeshStandardMaterial({
        map: letterTex,
        emissiveMap: letterTex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: isNightMode ? 0.55 : 0.18,
        roughness: 0.82,
        metalness: 0.02
      });
      letterMat.polygonOffset = true;
      letterMat.polygonOffsetFactor = -1;
      const letterMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 4.0), letterMat);
      letterMesh.position.set(0, 0, 0.10);
      rightWing.add(letterMesh);
      worldAtmosphereRef.current.letterMat = letterMat;

      const letterLight = new THREE.PointLight(0xffecd0, 1.8, 8.5);
      letterLight.position.set(1.75, 2.2, 1.8);
      st1Group.add(letterLight);

      st1Group.add(bifoldRoot);
      scene.add(st1Group);

      interactiveMeshes.push({
        mesh: leftWing,
        onClick: () => {
          playLetterOpenSound();
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
          showToast(`🌸 Vinh danh đóa hoa rạng rỡ: ${sisterName}!`);
        }
      });
      interactiveMeshes.push({
        mesh: rightWing,
        onClick: () => {
          playLetterOpenSound();
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
          showToast('💌 Thư ngỏ chân tình từ toàn thể anh em công ty gửi tặng chị em!');
        }
      });

      stationCameraPositions[1] = {
        targetPos: st1Center.clone().add(new THREE.Vector3(0, 2.2, 0)),
        camPos: st1Center.clone().add(norm.clone().multiplyScalar(14)).add(new THREE.Vector3(0, 3.8, 0))
      };
    }

    /* ------------------------------------------------------------------ */
    /*  STATION 2: BALLOONS                                                */
    /* ------------------------------------------------------------------ */
    {
      const pt = curve.getPointAt(STATIONS[2].u);
      const T = curve.getTangentAt(STATIONS[2].u);
      const norm = new THREE.Vector3(T.z, 0, -T.x).normalize();
      const st2Center = pt.clone().add(norm.clone().multiplyScalar(6.5));
      const st2Group = new THREE.Group();
      st2Group.position.set(st2Center.x, heightAt(st2Center.x, st2Center.z), st2Center.z);

      const heartGeo = makeHeartGeometry(0.35, 0.12);
      const sphereGeo = new THREE.SphereGeometry(0.72, 20, 16);
      sphereGeo.scale(1.0, 1.25, 1.0);

      const bColors = [0xF43F5E, 0xFB7185, 0xFBBF24, 0xC084FC, 0xFDA4AF, 0xE11D48, 0xFFE4E6, 0x38BDF8];
      const stringGeo = new THREE.CylinderGeometry(0.006, 0.006, 2.2, 4);
      stringGeo.translate(0, -1.1, 0);
      const stringMat = new THREE.MeshBasicMaterial({ color: 0xFFFBEB });

      const balloonMeshes = [];
      for (let i = 0; i < 14; i++) {
        const isH = i % 2 === 0;
        const col = bColors[i % bColors.length];
        const bMat = new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.25,
          metalness: 0.35,
          envMap: envTex
        });
        const bMesh = new THREE.Mesh(isH ? heartGeo : sphereGeo, bMat);

        const angle = -1.2 + (i / 13) * 2.4;
        const rad = 2.8 + (i % 3) * 0.4;
        const bY = 1.3 + (i % 4) * 0.5 + Math.sin(i * 1.2) * 0.3;
        bMesh.position.set(Math.sin(angle) * rad, bY, Math.cos(angle) * rad * 0.5);
        bMesh.rotation.y = (rand() - 0.5) * 0.6;

        const strMesh = new THREE.Mesh(stringGeo, stringMat);
        bMesh.add(strMesh);
        st2Group.add(bMesh);

        const wishData = (wishes && wishes.length > 0)
          ? wishes[i % wishes.length]
          : {
            id: `wish_${i}`,
            name: 'Đồng Nghiệp IT',
            dept: 'Engineering Team',
            text: 'Chúc bạn ngày 20/10 rạng rỡ, xinh đẹp và luôn đón nhận niềm vui bất ngờ trong cuộc sống!'
          };

        interactiveMeshes.push({
          mesh: bMesh,
          onClick: () => {
            bMesh.visible = false;
            playPopSound();
            confetti({
              particleCount: 80,
              spread: 90,
              origin: { y: 0.5 },
              colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF']
            });
            showToast('🎈 Bóng bay nổ bung! Một lời chúc ngọt ngào đã hiện ra!');
            setActiveModalWish(wishData);
          }
        });
        balloonMeshes.push(bMesh);
      }

      scene.add(st2Group);

      stationCameraPositions[2] = {
        targetPos: st2Center.clone().add(new THREE.Vector3(0, 2.6, 0)),
        camPos: st2Center.clone().add(norm.clone().multiplyScalar(14.5)).add(new THREE.Vector3(0, 5.5, 0))
      };
    }

    /* ------------------------------------------------------------------ */
    /*  STATION 4: CINEMA                                                  */
    /* ------------------------------------------------------------------ */
    {
      const pt = curve.getPointAt(STATIONS[4].u);
      const T = curve.getTangentAt(STATIONS[4].u);
      const norm = new THREE.Vector3(T.z, 0, -T.x).normalize();
      const st4Center = pt.clone().add(norm.clone().multiplyScalar(7.5));
      const st4Group = new THREE.Group();
      st4Group.position.set(st4Center.x, heightAt(st4Center.x, st4Center.z), st4Center.z);
      st4Group.rotation.set(0, Math.atan2(norm.x, norm.z), 0);

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.85 });
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(8.0, 8.5, 0.4, 32), woodMat);
      st4Group.add(deck);

      const screenFrameMat = new THREE.MeshStandardMaterial({ color: 0x2A0B18, roughness: 0.6 });
      const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.8, 0.2), screenFrameMat);
      screenFrame.position.set(0, 2.6, 0);

      const scCanvas = document.createElement('canvas');
      scCanvas.width = 640;
      scCanvas.height = 360;
      const scG = scCanvas.getContext('2d');
      scG.fillStyle = '#1A0814';
      scG.fillRect(0, 0, 640, 360);
      scG.strokeStyle = '#C9A66B';
      scG.lineWidth = 6;
      scG.strokeRect(12, 12, 616, 336);

      scG.fillStyle = '#FDA4AF';
      scG.font = 'bold 22px monospace';
      scG.textAlign = 'center';
      scG.fillText('🎬 TECHCORP CINEMA • 20/10 SPECIAL', 320, 80);

      scG.fillStyle = '#FFF';
      scG.font = 'italic bold 36px "Playfair Display", Georgia, serif';
      scG.fillText('Thước Phim Tri Ân Phái Đẹp', 320, 160);

      scG.fillStyle = '#FDE68A';
      scG.font = '600 24px "Be Vietnam Pro", sans-serif';
      scG.fillText('▶ Chạm vào màn hình để thưởng thức phim', 320, 240);

      const scTex = new THREE.CanvasTexture(scCanvas);
      scTex.colorSpace = THREE.SRGBColorSpace;
      const screenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(6.2, 3.6),
        new THREE.MeshBasicMaterial({ map: scTex })
      );
      screenMesh.position.set(0, 0, 0.12);
      screenFrame.add(screenMesh);
      st4Group.add(screenFrame);

      for (let f = 0; f < 12; f++) {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xFDE68A }));
        const bx = -3.2 + (f / 11) * 6.4;
        bulb.position.set(bx, 4.6 + Math.sin((f / 11) * Math.PI) * 0.4, 0.2);
        st4Group.add(bulb);
      }

      scene.add(st4Group);

      interactiveMeshes.push({
        mesh: screenMesh,
        onClick: () => {
          setActiveVideoModal(true);
          showToast('🎬 Mở phòng chiếu video tri ân 20/10!');
        }
      });

      stationCameraPositions[4] = {
        targetPos: st4Center.clone().add(new THREE.Vector3(0, 2.5, 0)),
        camPos: st4Center.clone().add(norm.clone().multiplyScalar(12.8)).add(new THREE.Vector3(0, 4.8, 0))
      };
    }

    /* ------------------------------------------------------------------ */
    /*  STATION 5: CASTLE PARTY                                            */
    /* ------------------------------------------------------------------ */
    {
      const pt = curve.getPointAt(STATIONS[5].u);
      const T = curve.getTangentAt(STATIONS[5].u);
      const norm = new THREE.Vector3(T.z, 0, -T.x).normalize();
      const st5Center = pt.clone().add(norm.clone().multiplyScalar(9.5));
      const st5Group = new THREE.Group();
      st5Group.position.set(st5Center.x, heightAt(st5Center.x, st5Center.z), st5Center.z);
      st5Group.rotation.set(0, Math.atan2(norm.x, norm.z), 0);

      const marbleMat = new THREE.MeshStandardMaterial({ color: 0xFFFDF9, roughness: 0.35, metalness: 0.08, envMap: envTex });
      const palaceWallMat = new THREE.MeshStandardMaterial({ color: 0xFAF3EA, roughness: 0.65, metalness: 0.05, envMap: envTex });
      const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.9, roughness: 0.2, envMap: envTex });
      const roofSpireMat = new THREE.MeshStandardMaterial({ color: 0x8C2F4B, roughness: 0.35, metalness: 0.3, envMap: envTex });
      const stainedGlassMat = new THREE.MeshStandardMaterial({ color: 0xFDE68A, emissive: 0xF59E0B, emissiveIntensity: 2.2, roughness: 0.2 });

      const basePlatform1 = new THREE.Mesh(new THREE.CylinderGeometry(15.0, 16.2, 1.2, 40), marbleMat);
      basePlatform1.position.y = 0.6;
      basePlatform1.receiveShadow = true;
      st5Group.add(basePlatform1);

      const basePlatform2 = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 13.5, 0.8, 36), marbleMat);
      basePlatform2.position.y = 1.6;
      basePlatform2.receiveShadow = true;
      st5Group.add(basePlatform2);

      for (let b = 0; b < 28; b++) {
        const ang = (b / 28) * Math.PI * 2;
        if (Math.abs(ang - Math.PI / 2) > 0.35) {
          const bal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.9, 8), marbleMat);
          bal.position.set(Math.cos(ang) * 12.2, 2.45, Math.sin(ang) * 12.2);
          st5Group.add(bal);
        }
      }
      const railTop = new THREE.Mesh(new THREE.TorusGeometry(12.2, 0.12, 8, 48), goldTrimMat);
      railTop.rotation.x = Math.PI / 2;
      railTop.position.y = 2.95;
      st5Group.add(railTop);

      const royalRedCarpet = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.06, 12.0),
        new THREE.MeshStandardMaterial({ color: 0x8C1D40, roughness: 0.75 })
      );
      royalRedCarpet.position.set(0, 2.04, 5.0);
      st5Group.add(royalRedCarpet);

      [
        [-9.5, 9.5], [9.5, 9.5], [-9.5, -9.5], [9.5, -9.5]
      ].forEach(([bx, bz]) => {
        const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.4, 8), goldTrimMat);
        brazier.position.set(bx, 2.7, bz);
        st5Group.add(brazier);
        const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFDE68A, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }));
        flame.scale.set(1.8, 1.8, 1);
        flame.position.set(bx, 3.6, bz);
        st5Group.add(flame);
      });

      const mainKeep = new THREE.Mesh(new RoundedBoxGeometry(15.0, 9.5, 8.5, 4, 0.3), palaceWallMat);
      mainKeep.position.set(0, 6.75, -2.5);
      mainKeep.castShadow = true;
      mainKeep.receiveShadow = true;
      st5Group.add(mainKeep);

      const archPortal = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.45, 12, 28, Math.PI), goldTrimMat);
      archPortal.position.set(0, 5.2, 1.8);
      st5Group.add(archPortal);

      [-2.6, 2.6].forEach(px => {
        const pCol = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 4.2, 16), goldTrimMat);
        pCol.position.set(px, 3.1, 1.8);
        st5Group.add(pCol);
      });

      const woodenDoors = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, 4.8, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x4A2E1B, roughness: 0.85 })
      );
      woodenDoors.position.set(0, 3.4, 1.7);
      st5Group.add(woodenDoors);

      const winGeo = new THREE.PlaneGeometry(1.2, 2.4);
      [-4.8, 4.8].forEach(wx => {
        [4.2, 8.0].forEach(wy => {
          const winL = new THREE.Mesh(winGeo, stainedGlassMat);
          winL.position.set(wx, wy, 1.78);
          st5Group.add(winL);
          const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.55, 0.08), goldTrimMat);
          winFrame.position.set(wx, wy, 1.76);
          st5Group.add(winFrame);
        });
      });

      const royalBalcony = new THREE.Mesh(new RoundedBoxGeometry(6.4, 0.6, 1.8, 3, 0.08), marbleMat);
      royalBalcony.position.set(0, 6.8, 2.4);
      st5Group.add(royalBalcony);

      [
        [-7.6, 1.6], [7.6, 1.6], [-7.6, -6.6], [7.6, -6.6]
      ].forEach(([tx, tz]) => {
        const towerShaft = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 13.5, 20), palaceWallMat);
        towerShaft.position.set(tx, 8.75, tz);
        towerShaft.castShadow = true;
        towerShaft.receiveShadow = true;
        st5Group.add(towerShaft);

        const crenel = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.7, 0.8, 16), goldTrimMat);
        crenel.position.set(tx, 15.6, tz);
        st5Group.add(crenel);

        const spire = new THREE.Mesh(new THREE.ConeGeometry(2.1, 6.5, 20), roofSpireMat);
        spire.position.set(tx, 19.2, tz);
        spire.castShadow = true;
        st5Group.add(spire);

        const spireTip = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), goldTrimMat);
        spireTip.position.set(tx, 22.6, tz);
        st5Group.add(spireTip);
      });

      const centralKeep = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 18.0, 8), palaceWallMat);
      centralKeep.position.set(0, 11.0, -2.5);
      centralKeep.castShadow = true;
      centralKeep.receiveShadow = true;
      st5Group.add(centralKeep);

      const midRing = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 2.7, 1.0, 8), goldTrimMat);
      midRing.position.set(0, 20.2, -2.5);
      st5Group.add(midRing);

      const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.2, 24), goldTrimMat);
      clockFace.rotation.x = Math.PI / 2;
      clockFace.position.set(0, 16.5, 0.6);
      st5Group.add(clockFace);

      const grandSpire = new THREE.Mesh(new THREE.ConeGeometry(3.0, 8.5, 16), goldTrimMat);
      grandSpire.position.set(0, 24.8, -2.5);
      grandSpire.castShadow = true;
      st5Group.add(grandSpire);

      const grandFlagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), chromeMat);
      grandFlagPole.position.set(0, 29.8, -2.5);
      st5Group.add(grandFlagPole);

      const grandFlag = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xBE123C, side: THREE.DoubleSide })
      );
      grandFlag.position.set(1.2, 30.2, -2.5);
      st5Group.add(grandFlag);

      const banquetTable = new THREE.Mesh(
        new RoundedBoxGeometry(8.6, 0.9, 2.8, 4, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xFFFDF8, roughness: 0.55 })
      );
      banquetTable.position.set(0, 2.45, 3.0);
      banquetTable.castShadow = true;
      banquetTable.receiveShadow = true;
      st5Group.add(banquetTable);

      const tableRunner = new THREE.Mesh(
        new RoundedBoxGeometry(8.62, 0.04, 1.35, 4, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x8C2F4B, roughness: 0.5 })
      );
      tableRunner.position.set(0, 2.92, 3.0);
      st5Group.add(tableRunner);

      [-0.68, 0.68].forEach(rz => {
        const goldLace = new THREE.Mesh(new THREE.BoxGeometry(8.62, 0.02, 0.04), goldTrimMat);
        goldLace.position.set(0, 2.95, 3.0 + rz);
        st5Group.add(goldLace);
      });

      // ===== CAKE =====
      const cakeGroup = new THREE.Group();
      cakeGroup.position.set(-2.5, 2.92, 3.0);

      const cakeStand = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.62, 0.16, 32), goldTrimMat);
      cakeStand.position.y = 0.08;
      cakeGroup.add(cakeStand);

      const cakeColors = [0xFFFDF7, 0x9E1B32, 0xFAF3EA, 0xFFE4E6];
      const cakeTiersData = [
        { r: 1.25, h: 0.44, y: 0.38 },
        { r: 0.94, h: 0.40, y: 0.80 },
        { r: 0.68, h: 0.36, y: 1.18 },
        { r: 0.44, h: 0.30, y: 1.51 }
      ];

      cakeTiersData.forEach((t, ti) => {
        const tierMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(t.r, t.r, t.h, 32),
          new THREE.MeshStandardMaterial({ color: cakeColors[ti], roughness: 0.32, metalness: 0.04 })
        );
        tierMesh.position.y = t.y;
        tierMesh.castShadow = true;
        cakeGroup.add(tierMesh);

        const pearlRing = new THREE.Mesh(
          new THREE.TorusGeometry(t.r + 0.015, 0.032, 12, 36),
          ti === 1 ? goldTrimMat : new THREE.MeshStandardMaterial({ color: 0xFFFAF0, roughness: 0.25 })
        );
        pearlRing.rotation.x = Math.PI / 2;
        pearlRing.position.y = t.y - t.h * 0.48;
        cakeGroup.add(pearlRing);
      });

      const cakeRoseColors = [0xFFFAF0, 0xFDA4AF, 0xBE123C, 0xFED7AA].map(c => new THREE.Color(c));
      for (let cr = 0; cr < 10; cr++) {
        const rHead = new THREE.Mesh(makeRoseHead(), new THREE.MeshStandardMaterial({
          color: cakeRoseColors[cr % cakeRoseColors.length],
          roughness: 0.35,
          side: THREE.DoubleSide
        }));
        const t = cr / 9;
        const cy = 0.35 + t * 1.25;
        const cradius = 1.25 - t * 0.85 + 0.08;
        const cangle = t * Math.PI * 2.8 + 0.2;
        rHead.position.set(Math.sin(cangle) * cradius, cy, Math.cos(cangle) * cradius);
        rHead.rotation.set(-0.2 + (rand() - 0.5) * 0.3, cangle, 0.3);
        rHead.scale.setScalar(1.2 + (cr % 3) * 0.2);
        cakeGroup.add(rHead);
      }

      const topperCrown = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 12, 24), goldTrimMat);
      topperCrown.rotation.x = Math.PI / 2;
      topperCrown.position.y = 1.72;
      cakeGroup.add(topperCrown);

      const topperStar = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), goldTrimMat);
      topperStar.position.y = 1.84;
      cakeGroup.add(topperStar);

      for (let cn = 0; cn < 6; cn++) {
        const ca = (cn / 6) * Math.PI * 2;
        const cRad = cn < 4 ? 0.82 : 0.56;
        const cBaseY = cn < 4 ? 1.0 : 1.36;

        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.045, 0.03, 10), goldTrimMat);
        cup.position.set(Math.sin(ca) * cRad, cBaseY, Math.cos(ca) * cRad);
        cakeGroup.add(cup);

        const wax = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.026, 0.36, 10),
          new THREE.MeshStandardMaterial({ color: 0xFFFBF2, roughness: 0.35 })
        );
        wax.position.set(Math.sin(ca) * cRad, cBaseY + 0.18, Math.cos(ca) * cRad);
        cakeGroup.add(wax);

        const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.04, 6), new THREE.MeshBasicMaterial({ color: 0x1F2937 }));
        wick.position.set(Math.sin(ca) * cRad, cBaseY + 0.38, Math.cos(ca) * cRad);
        cakeGroup.add(wick);

        const cFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFDE68A, transparent: true, blending: THREE.AdditiveBlending }));
        cFlame.scale.set(0.65, 0.65, 1);
        cFlame.position.set(Math.sin(ca) * cRad, cBaseY + 0.44, Math.cos(ca) * cRad);
        cakeGroup.add(cFlame);
      }

      const topFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFDE68A, transparent: true, blending: THREE.AdditiveBlending }));
      topFlame.scale.set(0.95, 0.95, 1);
      topFlame.position.y = 1.96;
      cakeGroup.add(topFlame);

      cakeAura = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFBBF24, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
      cakeAura.scale.set(4.2, 4.2, 1);
      cakeAura.position.y = 1.85;
      cakeGroup.add(cakeAura);

      const cakeRubyAura = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xEF4444, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }));
      cakeRubyAura.scale.set(3.2, 3.2, 1);
      cakeRubyAura.position.y = 1.85;
      cakeGroup.add(cakeRubyAura);

      st5Group.add(cakeGroup);

      // ===== CHAMPAGNE TOWER =====
      const champagneGroup = new THREE.Group();
      champagneGroup.position.set(2.5, 2.92, 3.0);

      const standRiser = new THREE.Mesh(new RoundedBoxGeometry(1.68, 0.12, 1.68, 4, 0.03), marbleMat);
      standRiser.position.y = 0.06;
      champagneGroup.add(standRiser);

      const standGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.03, 1.7), goldTrimMat);
      standGoldTrim.position.y = 0.11;
      champagneGroup.add(standGoldTrim);

      const crystalMat = new THREE.MeshPhysicalMaterial({
        color: 0xFFFFFF,
        transmission: 0.94,
        opacity: 1,
        transparent: true,
        roughness: 0.06,
        ior: 1.52,
        thickness: 0.2
      });

      const champagneLiquidMat = new THREE.MeshPhysicalMaterial({
        color: 0xF59E0B,
        transmission: 0.85,
        roughness: 0.12,
        ior: 1.45,
        thickness: 0.3
      });

      const createFlute = () => {
        const flute = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.012, 12), crystalMat);
        base.position.y = 0.006;
        flute.add(base);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.12, 8), crystalMat);
        stem.position.y = 0.07;
        flute.add(stem);
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.02, 0.12, 12), crystalMat);
        cup.position.y = 0.18;
        flute.add(cup);
        const wine = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.022, 0.09, 10), champagneLiquidMat);
        wine.position.y = 0.17;
        flute.add(wine);
        return flute;
      };

      const SPAN = 0.23;
      const FLUTE_H = 0.245;
      const pyramidTiers = [
        { count: 4, y: 0.12 },
        { count: 3, y: 0.12 + FLUTE_H },
        { count: 2, y: 0.12 + FLUTE_H * 2 },
        { count: 1, y: 0.12 + FLUTE_H * 3 }
      ];

      pyramidTiers.forEach((tier) => {
        const offset = ((tier.count - 1) * SPAN) / 2;
        for (let gx = 0; gx < tier.count; gx++) {
          for (let gz = 0; gz < tier.count; gz++) {
            const flute = createFlute();
            flute.position.set(gx * SPAN - offset, tier.y, gz * SPAN - offset);
            champagneGroup.add(flute);
          }
        }
      });

      const champBubbles = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFDE68A, transparent: true, blending: THREE.AdditiveBlending }));
      champBubbles.scale.set(1.4, 1.4, 1);
      champBubbles.position.y = 0.12 + FLUTE_H * 4.1;
      champagneGroup.add(champBubbles);

      st5Group.add(champagneGroup);

      [-3.8, 3.8].forEach(fx => {
        const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.32, 0.52, 16), goldTrimMat);
        basket.position.set(fx, 3.18, 3.0);
        st5Group.add(basket);
        const bouquet = new THREE.Mesh(
          new THREE.SphereGeometry(0.58, 14, 12),
          new THREE.MeshStandardMaterial({ color: 0xBE123C, roughness: 0.45 })
        );
        bouquet.position.set(fx, 3.55, 3.0);
        st5Group.add(bouquet);
      });

      [-1.3, 1.3].forEach(nx => {
        [-0.85, 0.85].forEach(nz => {
          const cand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.55, 8), goldTrimMat);
          cand.position.set(nx, 3.18, 3.0 + nz);
          st5Group.add(cand);
          const cF = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFDE68A, transparent: true, blending: THREE.AdditiveBlending }));
          cF.scale.set(0.7, 0.7, 1);
          cF.position.set(nx, 3.55, 3.0 + nz);
          st5Group.add(cF);
        });
      });

      const chestStand = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.22, 1.4, 4, 0.04), goldTrimMat);
      chestStand.position.set(0, 3.03, 3.0);
      st5Group.add(chestStand);

      const chestMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.92, roughness: 0.2, envMap: envTex });
      const royalChest = new THREE.Mesh(new RoundedBoxGeometry(1.85, 1.2, 1.2, 4, 0.12), chestMat);
      royalChest.position.set(0, 3.74, 3.0);
      royalChest.castShadow = true;
      royalChest.receiveShadow = true;
      st5Group.add(royalChest);

      const chestBandMat = new THREE.MeshStandardMaterial({ color: 0xBE123C, roughness: 0.3, metalness: 0.5 });
      const chestBand1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.24, 1.24), chestBandMat);
      chestBand1.position.set(-0.52, 3.74, 3.0);
      st5Group.add(chestBand1);
      const chestBand2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.24, 1.24), chestBandMat);
      chestBand2.position.set(0.52, 3.74, 3.0);
      st5Group.add(chestBand2);

      chestAura1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xF59E0B, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }));
      chestAura1.scale.set(5.2, 5.2, 1);
      chestAura1.position.set(0, 3.85, 3.0);
      st5Group.add(chestAura1);

      chestAura2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xEF4444, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }));
      chestAura2.scale.set(4.2, 4.2, 1);
      chestAura2.position.set(0, 3.85, 3.0);
      st5Group.add(chestAura2);

      const partySignTex = signTexture('✨ CHẠM RƯƠNG BÁU • MỞ ĐẠI TIỆC 20/10 ✨');
      const partySignSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: partySignTex, transparent: true }));
      partySignSprite.position.set(0, 5.85, 3.0);
      partySignSprite.scale.set(5.2, 1.3, 1);
      st5Group.add(partySignSprite);

      // ===== EASEL =====
      const easelGroup = new THREE.Group();
      easelGroup.position.set(-4.5, 2.0, 5.2);
      easelGroup.rotation.y = 0.28;

      const easelWoodMat = new THREE.MeshStandardMaterial({
        color: 0x8C5E3C,
        roughness: 0.65,
        metalness: 0.05
      });

      const legGeo = new THREE.BoxGeometry(0.065, 3.8, 0.065);
      const leftLeg = new THREE.Mesh(legGeo, easelWoodMat);
      leftLeg.position.set(-0.68, 1.85, 0.12);
      leftLeg.rotation.z = -0.15;
      leftLeg.rotation.x = -0.08;
      easelGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, easelWoodMat);
      rightLeg.position.set(0.68, 1.85, 0.12);
      rightLeg.rotation.z = 0.15;
      rightLeg.rotation.x = -0.08;
      easelGroup.add(rightLeg);

      const backLeg = new THREE.Mesh(new THREE.BoxGeometry(0.065, 3.6, 0.065), easelWoodMat);
      backLeg.position.set(0, 1.75, -0.75);
      backLeg.rotation.x = 0.28;
      easelGroup.add(backLeg);

      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.07, 0.14), easelWoodMat);
      shelf.position.set(0, 1.45, 0.22);
      easelGroup.add(shelf);

      const centerMast = new THREE.Mesh(new THREE.BoxGeometry(0.065, 4.0, 0.065), easelWoodMat);
      centerMast.position.set(0, 1.95, -0.02);
      centerMast.rotation.x = -0.08;
      easelGroup.add(centerMast);

      const topClamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.12), easelWoodMat);
      topClamp.position.set(0, 3.42, 0.08);
      easelGroup.add(topClamp);

      const boardMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.85 });
      const artBoard = new THREE.Mesh(new RoundedBoxGeometry(1.85, 2.55, 0.05, 3, 0.02), boardMat);
      artBoard.position.set(0, 2.45, 0.16);
      artBoard.rotation.x = -0.08;
      easelGroup.add(artBoard);

      const canvasLoader = new THREE.TextureLoader();
      canvasLoader.load('/images.jpg', (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const pMat = new THREE.MeshBasicMaterial({ map: tex });
        pMat.polygonOffset = true;
        pMat.polygonOffsetFactor = -1;
        const pMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 2.05), pMat);
        pMesh.position.set(0, 0.15, 0.035);
        artBoard.add(pMesh);
      });

      const captionCanvas = document.createElement('canvas');
      captionCanvas.width = 512;
      captionCanvas.height = 128;
      const cG = captionCanvas.getContext('2d');
      cG.fillStyle = '#FFFFFF';
      cG.fillRect(0, 0, 512, 128);
      cG.fillStyle = '#8C2F4B';
      cG.font = 'italic bold 26px "Playfair Display", Georgia, serif';
      cG.textAlign = 'center';
      cG.fillText(`Đóa Hoa Rực Rỡ • ${sisterName}`, 256, 52);
      cG.fillStyle = '#6B4226';
      cG.font = '600 16px "Be Vietnam Pro", sans-serif';
      cG.fillText('TECHCORP GALA TRIBUTE 20.10', 256, 88);

      const captionTex = new THREE.CanvasTexture(captionCanvas);
      captionTex.colorSpace = THREE.SRGBColorSpace;
      const capMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 0.42), new THREE.MeshBasicMaterial({ map: captionTex }));
      capMesh.position.set(0, -1.02, 0.035);
      artBoard.add(capMesh);

      const baseFlowerGroup = new THREE.Group();
      baseFlowerGroup.position.set(0, 0.15, 0.25);

      const easelRosePal = [0xFFE4E6, 0xFDA4AF, 0xFFFAF0, 0xFBCFE8].map(h => new THREE.Color(h));
      for (let r = 0; r < 14; r++) {
        const rMesh = new THREE.Mesh(makeRoseHead(), new THREE.MeshStandardMaterial({
          color: easelRosePal[r % easelRosePal.length],
          roughness: 0.4,
          side: THREE.DoubleSide
        }));
        const ra = -0.8 + (r / 13) * 1.6;
        const rr = 0.4 + (r % 3) * 0.18;
        rMesh.position.set(Math.sin(ra) * rr, 0.12 + (r % 4) * 0.15, Math.cos(ra) * rr * 0.6);
        rMesh.rotation.set(-0.2 + (rand() - 0.5) * 0.4, rand() * Math.PI, 0.1);
        rMesh.scale.setScalar(1.6 + (r % 3) * 0.3);
        baseFlowerGroup.add(rMesh);
      }

      for (let l = 0; l < 6; l++) {
        const lily = new THREE.Group();
        const petalLily = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.42, 16, 1, true),
          new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3, side: THREE.DoubleSide })
        );
        petalLily.rotation.x = Math.PI + 0.3;
        lily.add(petalLily);
        const pistil = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.35, 8), new THREE.MeshBasicMaterial({ color: 0xFDE047 }));
        pistil.position.y = 0.05;
        lily.add(pistil);
        const la = -0.6 + (l / 5) * 1.2;
        lily.position.set(Math.sin(la) * 0.65, 0.35 + (l % 3) * 0.2, Math.cos(la) * 0.4);
        lily.rotation.set(-0.35, la, 0.2);
        baseFlowerGroup.add(lily);
      }

      const leafMat = new THREE.MeshStandardMaterial({ color: 0x2A6228, roughness: 0.6 });
      for (let f = 0; f < 10; f++) {
        const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.55), leafMat);
        leaf.position.set((f - 4.5) * 0.15, 0.2 + (f % 3) * 0.08, 0.1 + (f % 2) * 0.2);
        leaf.rotation.set(-0.4, (f - 4.5) * 0.3, 0.2);
        baseFlowerGroup.add(leaf);
      }
      easelGroup.add(baseFlowerGroup);
      st5Group.add(easelGroup);

      // ===== SEAL PEDESTAL =====
      const sealGroup = new THREE.Group();
      sealGroup.position.set(4.5, 2.0, 5.2);
      sealGroup.rotation.y = -0.28;

      const pedestalMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.35, 20), marbleMat);
      pedestalMesh.position.y = 0.68;
      sealGroup.add(pedestalMesh);

      const scrollMesh = new THREE.Mesh(
        new RoundedBoxGeometry(1.6, 0.08, 1.2, 4, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xFFFDF5, roughness: 0.75 })
      );
      scrollMesh.position.set(0, 1.4, 0);
      sealGroup.add(scrollMesh);

      const sealWaxMat = new THREE.MeshStandardMaterial({ color: 0xBE123C, roughness: 0.35, metalness: 0.15 });
      const waxSealMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.08, 24), sealWaxMat);
      waxSealMesh.position.set(0, 1.48, 0.2);
      sealGroup.add(waxSealMesh);

      const sealGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFDE68A, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }));
      sealGlow.scale.set(1.4, 1.4, 1);
      sealGlow.position.set(0, 1.55, 0.2);
      sealGroup.add(sealGlow);

      st5Group.add(sealGroup);

      triggerCastleFireworks = () => {
        getAC();
        const cx = st5Center.x, cz = st5Center.z;
        const volley = (count) => {
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              launchRocket(cx + (rand() - 0.5) * 32, cz - 6 + (rand() - 0.5) * 14, 38 + rand() * 12);
            }, i * (120 + rand() * 180));
          }
        };
        for (let w = 0; w < 12; w++) {
          setTimeout(() => volley(1 + Math.floor(rand() * 3)), w * 800);
        }
        setTimeout(() => volley(10), 11000);
      };

      scene.add(st5Group);

      const onPartyClick = () => {
        playSparkleSound();
        triggerCastleFireworks();
        setActivePartyCardModal(true);
        confetti({
          particleCount: 160,
          spread: 130,
          origin: { y: 0.5 },
          colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#BE123C']
        });
        showToast('💐 Đang mở rương báu & xuất thiệp chúc mừng Retina 2x!');
      };

      const onCakeClick = () => {
        soundClink();
        triggerCastleFireworks();
        confetti({
          particleCount: 130,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#FDE68A', '#FDA4AF', '#BE123C', '#FFF1F2']
        });
        showToast('🎂 Đã cắt bánh đại tiệc 20/10! Chúc chị em mãi trẻ trung, rạng ngời và ngập tràn hạnh phúc!');
      };

      const onChampagneClick = () => {
        soundClink();
        triggerCastleFireworks();
        confetti({
          particleCount: 140,
          spread: 110,
          origin: { y: 0.52 },
          colors: ['#F59E0B', '#FDE68A', '#FFFFFF', '#BE123C']
        });
        showToast('🥂 Nâng ly Champagne hảo hạng chúc mừng phái đẹp TechCorp ngày 20/10!');
      };

      const onEaselClick = () => {
        playSparkleSound();
        triggerCastleFireworks();
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.55 },
          colors: ['#FDE68A', '#FDA4AF', '#FFFFFF', '#BE123C']
        });
        showToast(`👑 Bức họa vinh danh: Đóa hoa ngát hương ${sisterName}!`);
      };

      const onWaxSealClick = () => {
        playLetterOpenSound();
        triggerCastleFireworks();
        confetti({
          particleCount: 110,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#BE123C', '#F43F5E', '#FDE68A', '#FFFFFF']
        });
        showToast('💌 Con dấu sáp đỏ 20.10 đã mở! Triệu đóa hồng gửi trao phái đẹp!');
      };

      interactiveMeshes.push({ mesh: royalChest, onClick: onPartyClick });
      interactiveMeshes.push({ mesh: banquetTable, onClick: onPartyClick });
      interactiveMeshes.push({ mesh: cakeStand, onClick: onCakeClick });
      interactiveMeshes.push({ mesh: standRiser, onClick: onChampagneClick });
      interactiveMeshes.push({ mesh: partySignSprite, onClick: onPartyClick });
      interactiveMeshes.push({ mesh: artBoard, onClick: onEaselClick });
      interactiveMeshes.push({ mesh: waxSealMesh, onClick: onWaxSealClick });

      const camLocal = new THREE.Vector3(0, 3.8, 8.4);
      const tgtLocal = new THREE.Vector3(0, 3.3, 3.0);
      stationCameraPositions[5] = {
        targetPos: tgtLocal.applyEuler(st5Group.rotation).add(st5Group.position),
        camPos: camLocal.applyEuler(st5Group.rotation).add(st5Group.position)
      };
    }

    /* ---------- Camera transitions ---------- */
    transRef.current = {
      active: false,
      t0: 0,
      dur: 1400,
      fromCam: new THREE.Vector3(),
      toCam: new THREE.Vector3(),
      fromTgt: new THREE.Vector3(),
      toTgt: new THREE.Vector3(),
      stationsPos: stationCameraPositions,
      isVanRelative: true,
      preset: VAN_PRESETS.chase
    };

    /* ================================================================== */
    /*  CINEMATIC POST-PROCESSING PIPELINE                                 */
    /*  Render → Bloom → SSAO → Bokeh → ColorGrade → SMAA → Output        */
    /* ================================================================== */
    const rt = new THREE.WebGLRenderTarget(width * pr, height * pr, {
      type: THREE.HalfFloatType,
      samples: lowPower ? 0 : 4
    });
    const composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(pr);
    composer.setSize(width, height);

    composer.addPass(new RenderPass(scene, camera));

    // Bloom tinh chỉnh: threshold cao → chỉ vật phát sáng thật mới glow
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      isNightMode ? 0.55 : 0.42,  // strength
      0.55,                        // radius
      1.0                          // threshold (cao hơn cũ 0.88)
    );
    composer.addPass(bloom);
    worldAtmosphereRef.current.bloom = bloom;

    // SSAO: ambient occlusion — contact shadow thật
    let ssaoPass = null;
    if (!lowPower) {
      ssaoPass = new SSAOPass(scene, camera, width, height);
      ssaoPass.kernelRadius = 8;
      ssaoPass.minDistance = 0.005;
      ssaoPass.maxDistance = 0.12;
      ssaoPass.output = SSAOPass.OUTPUT.Default;
      composer.addPass(ssaoPass);
      worldAtmosphereRef.current.ssaoPass = ssaoPass;
    }

    // Bokeh: Depth of Field — chỉ desktop
    let bokehPass = null;
    if (!lowPower) {
      bokehPass = new BokehPass(scene, camera, {
        focus: 12.0,
        aperture: 0.00035,
        maxblur: 0.008
      });
      composer.addPass(bokehPass);
      worldAtmosphereRef.current.bokehPass = bokehPass;
    }

    // Color grading Film Look
    const colorGrade = new ShaderPass(ColorGradeShader);
    colorGrade.uniforms.uStrength.value = 1.0;
    colorGrade.uniforms.uVignette.value = 0.35;
    colorGrade.uniforms.uGrain.value = 0.018;
    colorGrade.uniforms.uAberration.value = 0.0006;
    colorGrade.uniforms.uSaturation.value = 1.08;
    colorGrade.uniforms.uTime.value = 0;
    composer.addPass(colorGrade);
    worldAtmosphereRef.current.colorGrade = colorGrade;

    // SMAA: khử răng cưa chất lượng cao
    const smaaPass = new SMAAPass(width * pr, height * pr);
    composer.addPass(smaaPass);

    // Output: tone mapping + color space
    composer.addPass(new OutputPass());

    /* ---------- Pointer Interactions (fixed raycast recursion) ---------- */
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isPointerDown = false;
    let downPos = { x: 0, y: 0 };

    const onPointerDown = (e) => {
      if (e.target.closest('button, .hud-camera-toolbar, .modal-overlay, .fairy-mailbox-overlay, .cart-floating-indicator')) return;
      isPointerDown = true;
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (dist < 10) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const hitsVan = raycaster.intersectObjects([vanRoot], true);
        if (hitsVan.length > 0) {
          playTruckHonkSound();
          confetti({ particleCount: 75, spread: 85, origin: { y: 0.55 } });
          setTimeout(() => {
            playLetterOpenSound();
            setIsMailboxOpen(true);
          }, 350);
          return;
        }

        const allTargets = interactiveMeshes.map(im => im.mesh);
        const hits = raycaster.intersectObjects(allTargets, true);
        if (hits.length > 0) {
          const hit = hits[0];
          // Raycast đệ quy: đi lên parent chain để tìm mesh khớp
          let obj = hit.object;
          let matched = null;
          while (obj) {
            matched = interactiveMeshes.find(im => im.mesh === obj);
            if (matched) break;
            obj = obj.parent;
          }
          if (matched && matched.onClick) {
            matched.onClick(hit);
          }
        }
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    /* ---------- Main Loop ---------- */
    let animId;
    let prevT = performance.now();
    const startT = prevT;
    let vanU = 0.52;
    const vanPos = new THREE.Vector3();
    const lastVan = new THREE.Vector3();
    let yaw = 0;
    let lastYaw = 0;
    let yawRateS = 0;
    let wheelAngle = 0;
    const SPEED = 3.6;

    const placeVan = () => {
      const p = curve.getPointAt(vanU);
      const T = curve.getTangentAt(vanU);
      vanPos.set(p.x, 0.035, p.z);
      yaw = Math.atan2(T.x, T.z);
      vanRoot.position.copy(vanPos);
      vanRoot.rotation.y = yaw;
      vanStateRef.current.pos.copy(vanPos);
      vanStateRef.current.yaw = yaw;
    };
    placeVan();
    lastVan.copy(vanPos);
    lastYaw = yaw;

    if (stationCameraPositions[0]) {
      camera.position.copy(stationCameraPositions[0].camPos);
      controls.target.copy(stationCameraPositions[0].targetPos);
    } else {
      camera.position.set(0, 4.5, 12);
      controls.target.set(0, 1.5, 0);
    }
    controls.update();

    let spawnAcc = 0;
    const camTmpA = new THREE.Vector3();
    const camTmpB = new THREE.Vector3();
    const camDestA = new THREE.Vector3();
    const camDestB = new THREE.Vector3();

    function renderLoop() {
      const now = performance.now();
      const dt = Math.min(0.05, (now - prevT) / 1000);
      prevT = now;
      const elapsed = (now - startT) * 0.001;
      timeU.value = elapsed;

      // Cập nhật shader time
      if (colorGrade) colorGrade.uniforms.uTime.value = elapsed;

      /* --- 1. Xe hoa --- */
      vanU = (vanU + (SPEED * dt) / curveLen) % 1;
      const prevYaw = yaw;
      placeVan();
      const yr = dt > 0 ? normAngle(yaw - prevYaw) / dt : 0;
      yawRateS += (yr - yawRateS) * Math.min(1, dt * 4);

      wheelAngle += (SPEED * dt) / 0.48;
      spinGroups.forEach((s) => (s.rotation.x = wheelAngle));
      const steer = Math.max(-0.4, Math.min(0.4, (yawRateS / SPEED) * 2.6));
      steerPivots.forEach((p) => p && (p.rotation.y = steer));

      bodyGroup.position.y = Math.sin(elapsed * 9) * 0.007 + Math.sin(elapsed * 3.1) * 0.012;
      bodyGroup.rotation.z = yawRateS * 0.35 + Math.sin(elapsed * 2.1) * 0.004;
      bodyGroup.rotation.x = Math.sin(elapsed * 2.4) * 0.006;

      fairyOrbs.forEach((f) => f.orb.scale.setScalar(0.8 + Math.sin(elapsed * 3.4 + f.off * 0.9) * 0.35));

      /* --- Đom đóm --- */
      if (firefliesMesh) {
        const fPos = firefliesMesh.geometry.attributes.position.array;
        for (let i = 0; i < flyCount; i++) {
          const d = flyData[i];
          const t = elapsed * d.speed + d.phase;
          fPos[i * 3] = d.baseX + Math.sin(t) * d.radiusX + Math.cos(t * 0.45) * 1.2;
          fPos[i * 3 + 1] = d.baseY + Math.sin(t * d.freqY) * 0.85 + Math.sin(elapsed * 2.2 + i * 0.3) * 0.4;
          fPos[i * 3 + 2] = d.baseZ + Math.cos(t) * d.radiusZ + Math.sin(t * 0.55) * 1.2;
        }
        firefliesMesh.geometry.attributes.position.needsUpdate = true;
        const nightPulse = Math.sin(elapsed * 3.2) * 0.18 + 0.82;
        flyMat.size = (isNightMode ? 4.5 : 3.2) * nightPulse;
      }

      /* --- 2. Floating items --- */
      floatingItems.forEach((item, idx) => {
        const ph = elapsed * item.speed * 0.5 + idx * 1.7;
        item.group.position.set(
          item.baseV.x + Math.cos(ph * 0.6) * 0.45,
          item.baseV.y + Math.sin(ph) * 0.28,
          item.baseV.z + Math.sin(ph * 0.5) * 0.5
        );
        item.group.rotation.y = Math.PI + Math.sin(elapsed * 1.1 + idx) * 0.4;
        if (item.type === 'wing') {
          const flap = Math.sin(elapsed * 9 + idx) * 0.5;
          item.wingR.rotation.z = flap;
          item.wingL.rotation.z = -flap;
        } else {
          item.group.scale.setScalar(item.scale * (1 + Math.pow(Math.max(0, Math.sin(elapsed * 4.2)), 6) * 0.14));
        }
      });

      /* --- 3. Gift animation --- */
      const giftAnim = giftAnimationRef.current;
      if (giftAnim.opened && giftAnim.openProgress < 1.0) {
        giftAnim.openProgress = Math.min(1.0, giftAnim.openProgress + dt * 0.9);
        const prog = giftAnim.openProgress;
        const easeProg = 1 - Math.pow(1 - prog, 3);

        if (giftAnim.lidMesh) {
          giftAnim.lidMesh.position.y = 2.25 + easeProg * 2.8;
          giftAnim.lidMesh.rotation.x = -easeProg * 1.1;
          giftAnim.lidMesh.rotation.z = easeProg * 0.35;
        }
        if (giftAnim.crystalHeart) {
          giftAnim.crystalHeart.visible = true;
          giftAnim.crystalHeart.position.y = 1.2 + easeProg * 3.4;
          giftAnim.crystalHeart.rotation.y = elapsed * 2.5;
          const beat = 1.0 + Math.sin(elapsed * 6) * 0.12;
          giftAnim.crystalHeart.scale.setScalar(beat);
        }
        if (giftAnim.heartHalo) {
          giftAnim.heartHalo.visible = true;
          giftAnim.heartHalo.position.y = 1.2 + easeProg * 3.4;
          giftAnim.heartHalo.scale.setScalar(3.2 + Math.sin(elapsed * 4) * 0.5);
        }
        if (giftAnim.welcomeSign) {
          giftAnim.welcomeSign.visible = true;
          giftAnim.welcomeSign.position.y = 1.2 + easeProg * 4.9;
        }
        giftAnim.butterflies.forEach((b) => {
          b.group.visible = true;
          b.group.position.lerpVectors(b.initialPos, b.targetOffset, easeProg);
          const flap = Math.sin(elapsed * 18 + b.speed) * 0.7;
          b.wingLeft.rotation.y = flap;
          b.wingRight.rotation.y = -flap;
        });
        giftAnim.balloons.forEach((bm) => {
          bm.mesh.visible = true;
          bm.mesh.position.lerpVectors(bm.initialPos, bm.targetOffset, easeProg);
        });
      } else if (giftAnim.opened) {
        if (giftAnim.crystalHeart) {
          giftAnim.crystalHeart.rotation.y = elapsed * 2.5;
          const beat = 1.0 + Math.sin(elapsed * 6) * 0.1;
          giftAnim.crystalHeart.scale.setScalar(beat);
        }
      }

      /* --- 4. Sparkle trail --- */
      spawnAcc += dt * 60;
      while (spawnAcc >= 1) {
        spawnAcc -= 1;
        const i = trailHead;
        trailHead = (trailHead + 1) % TRAIL;
        tmpV.set((rand() - 0.5) * 1.6, 0.25 + rand() * 0.4, -2.4 - rand() * 0.3).applyAxisAngle(Y_AXIS, yaw).add(vanPos);
        trailPos[i * 3] = tmpV.x;
        trailPos[i * 3 + 1] = tmpV.y;
        trailPos[i * 3 + 2] = tmpV.z;
        trailVel[i * 3] = (rand() - 0.5) * 0.5;
        trailVel[i * 3 + 1] = 0.3 + rand() * 0.6;
        trailVel[i * 3 + 2] = (rand() - 0.5) * 0.5;
        trailLife[i] = 1;
        const c = trailPalette[Math.floor(rand() * trailPalette.length)];
        trailBase[i * 3] = c.r;
        trailBase[i * 3 + 1] = c.g;
        trailBase[i * 3 + 2] = c.b;
      }
      for (let i = 0; i < TRAIL; i++) {
        if (trailLife[i] > 0) {
          trailLife[i] -= dt * 0.7;
          trailPos[i * 3] += trailVel[i * 3] * dt;
          trailPos[i * 3 + 1] += trailVel[i * 3 + 1] * dt;
          trailPos[i * 3 + 2] += trailVel[i * 3 + 2] * dt;
          const f = Math.max(0, trailLife[i]);
          trailCol[i * 3] = trailBase[i * 3] * f;
          trailCol[i * 3 + 1] = trailBase[i * 3 + 1] * f;
          trailCol[i * 3 + 2] = trailBase[i * 3 + 2] * f;
        } else {
          trailCol[i * 3] = trailCol[i * 3 + 1] = trailCol[i * 3 + 2] = 0;
        }
      }
      trailGeo.attributes.position.needsUpdate = true;
      trailGeo.attributes.color.needsUpdate = true;

      /* --- 5. Sun follow controls.target (đổ bóng đúng mọi trạm) --- */
      sun.position.copy(controls.target).addScaledVector(sunDir, 100);
      sun.target.position.copy(controls.target);

      /* --- 6. Camera transitions --- */
      const tr = transRef.current;
      if (tr && tr.active) {
        const k = Math.min(1, (now - tr.t0) / tr.dur);
        const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

        if (tr.isVanRelative) {
          if (tr.preset.rel) {
            camDestA.set(...tr.preset.cam).applyAxisAngle(Y_AXIS, yaw).add(vanPos);
            camDestB.set(...tr.preset.tgt).applyAxisAngle(Y_AXIS, yaw).add(vanPos);
          } else {
            camDestA.set(...tr.preset.cam);
            camDestB.set(...tr.preset.tgt);
          }
          camera.position.lerpVectors(tr.fromCam, camDestA, ease);
          controls.target.lerpVectors(tr.fromTgt, camDestB, ease);
        } else {
          camera.position.lerpVectors(tr.fromCam, tr.toCam, ease);
          controls.target.lerpVectors(tr.fromTgt, tr.toTgt, ease);
        }

        if (k >= 1) {
          tr.active = false;
          followVanRef.current = tr.isVanRelative && tr.preset.rel;
        }
      } else if (followVanRef.current) {
        const dyaw = normAngle(yaw - lastYaw);
        camTmpA.copy(camera.position).sub(lastVan).applyAxisAngle(Y_AXIS, dyaw);
        camTmpB.copy(controls.target).sub(lastVan).applyAxisAngle(Y_AXIS, dyaw);

        if (vanU >= 0.78 && vanU <= 0.94) {
          const prox = Math.sin(((vanU - 0.78) / 0.16) * Math.PI);
          camTmpA.y += prox * 5.2;
          camTmpA.x = THREE.MathUtils.lerp(camTmpA.x, -6.2, prox * 0.7);
        }

        camera.position.copy(vanPos).add(camTmpA);
        controls.target.copy(vanPos).add(camTmpB);
      }
      lastVan.copy(vanPos);
      lastYaw = yaw;

      /* --- 7. Fireworks --- */
      updateFireworks(dt);

      /* --- 8. Aura pulses --- */
      if (chestAura1 && chestAura2) {
        const p1 = Math.sin(elapsed * 5.2);
        const p2 = Math.cos(elapsed * 4.4);
        chestAura1.scale.setScalar(5.0 + p1 * 1.2);
        chestAura1.material.opacity = 0.75 + p1 * 0.25;
        chestAura2.scale.setScalar(4.0 + p2 * 1.0);
        chestAura2.material.opacity = 0.85 + p2 * 0.15;
      }
      if (cakeAura) {
        const cp = Math.sin(elapsed * 5.8);
        cakeAura.scale.setScalar(4.2 + cp * 0.9);
        cakeAura.material.opacity = 0.75 + cp * 0.25;
      }

      controls.autoRotate = autoRotateRef.current;
      controls.autoRotateSpeed = 1.2;
      controls.update();
      sky.position.copy(camera.position);

      // Update Bokeh focus theo khoảng cách camera-target
      if (bokehPass) {
        const dist = camera.position.distanceTo(controls.target);
        bokehPass.uniforms.focus.value += (dist - bokehPass.uniforms.focus.value) * Math.min(1, dt * 3);
      }

      composer.render();
      animId = requestAnimationFrame(renderLoop);
    }
    renderLoop();

    const handleResize = () => {
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      if (nw > 0 && nh > 0) {
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
        composer.setSize(nw, nh);
        bloom.setSize(nw, nh);
        if (ssaoPass) ssaoPass.setSize(nw, nh);
        if (bokehPass) bokehPass.setSize(nw, nh);
        if (smaaPass) smaaPass.setSize(nw * pr, nh * pr);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      pmrem.dispose();
      envRT.dispose();
      if (composer && composer.dispose) composer.dispose();
      if (rt) rt.dispose();
      if (container && renderer.domElement) {
        try { container.removeChild(renderer.domElement); } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="page-garden-3d" id="world-3d-sanctuary">
      <div ref={containerRef} className="garden-3d-viewport" />

      <div className="garden-game-hud">
        {isHudHidden && (
          <div className="hud-cinema-reopen-bar">
            <button
              className="btn-hud-cinema-reopen"
              onClick={() => setIsHudHidden(false)}
              title="Mở lại bảng điều khiển và danh sách các trạm"
            >
              <span>👁️ Hiện Bảng Điều Khiển</span>
            </button>
            <button
              className={`btn-hud-cinema-reopen ${isNightMode ? 'night-active' : ''}`}
              onClick={toggleNightMode}
              title="Chuyển đổi Bầu Trời: Dạ Tiệc Đêm / Hoàng Hôn"
            >
              <span>{isNightMode ? '🌙 Đêm' : '🌅 Hoàng Hôn'}</span>
            </button>
            <button
              className={`btn-hud-cinema-reopen ${activeStationIndex === 'scenic' ? 'active' : ''}`}
              onClick={flyToWorldScenic}
              title="Góc nhìn toàn cảnh thế giới từ trên cao"
            >
              <span>🌄 Toàn Cảnh</span>
            </button>
          </div>
        )}

        {!isHudHidden && (
          <div className="hud-top-console-wrapper">
            <div className="hud-top-console">
              <div className="hud-console-header">
                <span className="hud-console-badge">🌸 20.10 WORLD 3D</span>
                <span className="hud-console-title">
                  Vương Quốc Hoa Tri Ân • Dành Riêng Cho <strong>{sisterName}</strong> ✨
                </span>
              </div>

              <div className="hud-camera-toolbar">
                {STATIONS.map((st, idx) => {
                  const isActive = activeStationIndex === idx;
                  return (
                    <button
                      key={st.id}
                      className={`btn-cam-preset ${isActive ? 'active' : ''}`}
                      onClick={() => flyToStation(idx)}
                      title={st.subtitle}
                    >
                      <span>{st.icon} {st.name}</span>
                    </button>
                  );
                })}

                <button
                  className={`btn-cam-preset ${autoRotate ? 'autorotate-active' : ''}`}
                  onClick={() => setAutoRotate(!autoRotate)}
                  title="Tự động quay góc nhìn 360°"
                >
                  🎥 {autoRotate ? 'Dừng 360°' : 'Quay 360°'}
                </button>

                <button
                  className={`btn-cam-preset ${activeStationIndex === 'scenic' ? 'active' : ''}`}
                  onClick={flyToWorldScenic}
                  title="Góc nhìn bao quát toàn bộ Vương Quốc Hoa 3D từ trên cao"
                >
                  <span>🌄 Toàn Cảnh</span>
                </button>

                <button
                  className={`btn-cam-preset ${isNightMode ? 'night-mode-active' : ''}`}
                  onClick={toggleNightMode}
                  title="Chuyển đổi giữa Hoàng Hôn và Dạ Tiệc Đêm lung linh ánh đèn"
                  style={{
                    background: isNightMode ? 'linear-gradient(135deg, #3b1154, #8c2f4b)' : undefined,
                    borderColor: isNightMode ? '#FDE68A' : undefined,
                    color: isNightMode ? '#FDE68A' : undefined,
                    boxShadow: isNightMode ? '0 0 16px rgba(253, 230, 138, 0.4)' : undefined
                  }}
                >
                  <span>{isNightMode ? '🌙 Dạ Tiệc Đêm (Bật)' : '🌅 Trời Hoàng Hôn'}</span>
                </button>

                <button
                  className="btn-cam-preset btn-cam-cinema"
                  onClick={() => {
                    setIsHudHidden(true);
                    showToast('✨ Đã bật Chế độ Điện Ảnh! Toàn bộ cảnh sắc 3D mở rộng 100%.');
                  }}
                  title="Ẩn thanh điều khiển để thưởng thức trọn vẹn cảnh sắc 3D"
                  style={{
                    border: '1px solid rgba(253, 230, 138, 0.45)',
                    color: '#FDE68A'
                  }}
                >
                  <span>👁️ Ẩn HUD</span>
                </button>

                <button
                  className="btn-cam-preset btn-cam-switch-2d"
                  onClick={() => updateExperienceMode('2d')}
                  title="Chuyển sang bản Tạp chí 2D Cổ Tích"
                >
                  🌸 Bản 2D Cổ Tích
                </button>
              </div>

              {activeStationIndex === 3 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(229, 195, 136, 0.25)',
                    flexWrap: 'wrap'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--champagne-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    🎥 Góc Nhìn Xe Hoa:
                  </span>
                  <button className={`btn-cam-preset ${activeVanCamPreset === 'chase' ? 'active' : ''}`} onClick={() => setVanCameraPreset('chase')}>
                    🚐 Theo Xe
                  </button>
                  <button className={`btn-cam-preset ${activeVanCamPreset === 'close' ? 'active' : ''}`} onClick={() => setVanCameraPreset('close')}>
                    🔍 Cận Cảnh
                  </button>
                  <button className={`btn-cam-preset ${activeVanCamPreset === 'side' ? 'active' : ''}`} onClick={() => setVanCameraPreset('side')}>
                    🌼 Bên Hông
                  </button>
                  <button className={`btn-cam-preset ${activeVanCamPreset === 'top' ? 'active' : ''}`} onClick={() => setVanCameraPreset('top')}>
                    🕊️ Từ Trên Cao
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {toastMessage && (
          <div style={{ textAlign: 'center' }}>
            <span className="hud-interaction-hint" style={{ background: 'rgba(140, 47, 75, 0.92)', color: '#FFF' }}>
              {toastMessage}
            </span>
          </div>
        )}

        {!isHudHidden && (
          <div className="hud-interaction-guide-group">
            {activeStationIndex === 3 && (
              <div
                className="hud-van-guide-banner"
                onClick={() => {
                  playLetterOpenSound();
                  setIsMailboxOpen(true);
                }}
                title="Bấm để mở hòm thư và đọc lời chúc từ anh em!"
              >
                <span className="van-guide-icon">💌</span>
                <span className="van-guide-text">
                  <strong>Bạn đang du hành cùng Cỗ Xe Hoa 20/10!</strong>
                  <br />
                  Chạm trực tiếp vào <em>Hòm Thư Bưu Điện</em> hoặc <em>Trái Tim trên xe</em> để mở phong thư bí mật!
                </span>
                <span className="van-guide-btn">Mở Thư Ngay ➔</span>
              </div>
            )}

            <div
              className="cart-floating-indicator"
              style={{ cursor: 'default', userSelect: 'none' }}
            >
              <span>✨ Chạm trực tiếp vào các vật thể tại từng trạm hoặc xe hoa để tương tác! 💌</span>
            </div>

            <div>
              <span className="hud-interaction-hint">
                {isMobileScreen
                  ? '📱 1 ngón tay xoay 360° • 2 ngón tay thu/phóng • Chạm vật thể để mở quà'
                  : '🖱️ Giữ chuột trái để xoay 360° • Cuộn chuột để phóng to/thu nhỏ • Chạm vật thể 3D để tương tác'}
              </span>
            </div>

            {isMobileScreen && (
              <div style={{ marginTop: '2px' }}>
                <span
                  className="hud-interaction-hint"
                  style={{
                    background: 'rgba(140, 47, 75, 0.92)',
                    color: '#FDE68A',
                    border: '1px solid rgba(253, 230, 138, 0.45)',
                    fontSize: '0.72rem',
                    lineHeight: '1.4',
                    display: 'inline-block',
                    maxWidth: '92vw'
                  }}
                >
                  💡 Mẹo: Xoay ngang màn hình hoặc xem trên máy tính để chiêm ngưỡng thế giới 3D lộng lẫy nhất!
                </span>
              </div>
            )}
          </div>
        )}

        <div className="hud-bottom-bar">
          <button className="btn-hud-mailbox" onClick={() => { playLetterOpenSound(); setIsMailboxOpen(true); }}>
            <span>🕊️ Hòm Thư Bưu Điện</span>
            <span className="mailbox-badge">{messages.length} Món Quà</span>
          </button>

          <button
            onClick={() => {
              const nextIndex = typeof activeStationIndex === 'number'
                ? (activeStationIndex + 1) % STATIONS.length
                : 0;
              flyToStation(nextIndex);
            }}
            className={`btn-rose ${shouldPulseNext ? 'pulse-guide-attention' : ''}`}
            style={{ fontSize: '0.98rem', padding: '12px 26px' }}
          >
            {shouldPulseNext && (
              <span className="pulse-guide-tag">✨ Tiếp tục theo kịch bản!</span>
            )}
            <span>
              {typeof activeStationIndex === 'number' && STATIONS[(activeStationIndex + 1) % STATIONS.length]
                ? `Trạm Tiếp Theo: ${STATIONS[(activeStationIndex + 1) % STATIONS.length].name} ➔`
                : 'Khám Phá Các Trạm: Hộp Quà ➔'}
            </span>
          </button>
        </div>
      </div>

      {isMailboxOpen && !readingMessage && (
        <div className="parcel-chest-overlay" onClick={() => setIsMailboxOpen(false)}>
          <div className="parcel-chest-box" onClick={(e) => e.stopPropagation()}>
            <div className="parcel-chest-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '2.4rem' }}>🚚</span>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: 'var(--rose-900)', margin: 0, fontWeight: '700' }}>
                    Kho Bưu Kiện Chuyến Xe Hoa 20/10
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--rose-600)' }}>
                    Chuyến xe bưu điện đã dừng trạm • Dành riêng gửi tặng <strong>{sisterName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsMailboxOpen(false)}
                className="royal-btn-close"
                style={{ position: 'static' }}
                title="Đóng hòm thư"
              >
                ✕
              </button>
            </div>

            <div className="parcel-chest-body">
              {messages.map((msg, idx) => {
                const isHeart = msg.type === 'heart';
                return (
                  <div
                    key={msg.id || idx}
                    onClick={() => {
                      playLetterOpenSound();
                      setReadingMessage(msg);
                    }}
                    className="winged-card"
                  >
                    <svg className="mini-wing left" viewBox="0 0 100 100" width="34" height="34" fill="#fda4af">
                      <path d="M90,70 C70,20 20,20 10,60 C20,50 40,60 50,70 C30,70 20,80 15,90 C35,85 60,85 90,70 Z" />
                    </svg>
                    <svg className="mini-wing right" viewBox="0 0 100 100" width="34" height="34" fill="#fda4af">
                      <path d="M90,70 C70,20 20,20 10,60 C20,50 40,60 50,70 C30,70 20,80 15,90 C35,85 60,85 90,70 Z" />
                    </svg>

                    <div className="winged-card-content">
                      <div className={`card-icon-slot ${isHeart ? 'purple-grad' : 'rose-grad'}`}>
                        <span className="heart-card-icon">{isHeart ? '💖' : '🕊️'}</span>
                      </div>
                      <span className="winged-card-badge">
                        {msg.badge || (isHeart ? '💖 Trái Tim Tri Ân' : '🕊️ Cánh Thư May Mắn')}
                      </span>
                      <h4 className="winged-card-title">{msg.title || 'Món Quà Tinh Thần'}</h4>
                      <span className="winged-card-sender">Từ: {msg.from_name || 'Đồng nghiệp'}</span>
                      <p className="winged-card-snippet">“{msg.text}”</p>
                      <div className="winged-card-action">
                        <span>Chạm để đọc thư</span>
                        <span className="action-arrow">→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="parcel-chest-footer">
              <span style={{ fontSize: '0.85rem', color: 'var(--rose-700)' }}>
                💡 Chọn từng phong thư để mở con dấu sáp và đọc trọn vẹn lời chúc
              </span>
              <button onClick={() => setIsMailboxOpen(false)} className="btn-rose" style={{ padding: '8px 22px' }}>
                <span>🌿 Quay lại ngắm Vương Quốc Hoa 3D</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {readingMessage && (
        <div className="modal-overlay open" onClick={() => setReadingMessage(null)}>
          <div className="royal-parchment-box" onClick={(e) => e.stopPropagation()}>
            <div className="parchment-wax-seal">20.10</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <span style={{ fontSize: '2.5rem' }}>{readingMessage.type === 'heart' ? '💖' : '🕊️'}</span>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--rose-600)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '700' }}>
                  {readingMessage.badge || 'Lời Nhắn Gửi Chân Tình'}
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: 'var(--rose-900)', fontWeight: '700', margin: 0 }}>
                  Thư Gửi Riêng {sisterName}
                </h3>
              </div>
            </div>

            <div style={{ background: 'rgba(244, 63, 94, 0.06)', borderLeft: '4px solid var(--rose-500)', borderRadius: '16px', padding: '22px 24px', margin: '20px 0' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', lineHeight: '1.85', color: '#1E293B', fontStyle: 'italic', margin: 0 }}>
                “{readingMessage.text}”
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Người gửi:</span>
                <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--rose-900)' }}>
                  {readingMessage.from_name || 'Một người đồng nghiệp giấu tên'}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setReadingMessage(null);
                    setIsMailboxOpen(true);
                  }}
                  className="btn-rose"
                  style={{ padding: '10px 18px', fontSize: '0.88rem', background: '#FFF', color: 'var(--rose-700)', border: '1.5px solid var(--rose-300)' }}
                >
                  <span>← Chọn thư khác</span>
                </button>
                <button onClick={() => setReadingMessage(null)} className="btn-rose" style={{ padding: '10px 22px', fontSize: '0.88rem' }}>
                  <span>Gấp thư lại 🕊️</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeVideoModal && (
        <div className="modal-overlay open" onClick={() => setActiveVideoModal(false)}>
          <div className="cinema-stage-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '860px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: 'var(--rose-900)', margin: 0 }}>
                🎬 Phim Tri Ân 20/10 • Phái Đẹp TechCorp
              </h3>
              <button onClick={() => setActiveVideoModal(false)} className="royal-btn-close" style={{ position: 'static' }}>
                ✕
              </button>
            </div>
            <div className="cinema-screen-viewport" style={{ aspectRatio: '16/9', width: '100%', borderRadius: '20px', overflow: 'hidden', background: '#000' }}>
              <video
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                controls
                autoPlay
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      )}

      {activePartyCardModal && (
        <div className="modal-overlay open" onClick={() => setActivePartyCardModal(false)}>
          <div className="party-honor-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '100%', padding: '36px 32px' }}>
            <div
              ref={printableCardRef}
              style={{
                background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF3EA 100%)',
                border: '3px solid #C9A66B',
                borderRadius: '24px',
                padding: '32px 28px',
                boxShadow: '0 20px 50px rgba(140, 47, 75, 0.15)',
                position: 'relative'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '2.8rem' }}>💐</span>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    color: 'var(--rose-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontWeight: '700',
                    margin: '6px 0'
                  }}
                >
                  TechCorp Celebration • 20.10 Invitation
                </span>

                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--rose-900)',
                    fontSize: 'clamp(1.6rem, 3.5vw, 2.1rem)',
                    margin: '6px 0 14px',
                    fontStyle: 'italic'
                  }}
                >
                  Tiệc Mừng 20/10 & Trao Quà Tri Ân
                </h2>

                <div
                  style={{
                    background: 'rgba(244, 63, 94, 0.05)',
                    border: '1.5px dashed var(--rose-300)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    margin: '18px 0',
                    textAlign: 'left'
                  }}
                >
                  <p style={{ margin: '0 0 8px', fontSize: '1.02rem', color: '#1E293B', lineHeight: '1.7' }}>
                    Thân gửi <strong>{sisterName}</strong>,
                  </p>
                  <p style={{ margin: 0, fontSize: '0.94rem', color: '#475569', lineHeight: '1.7' }}>
                    📍 <strong>Địa điểm nhận quà:</strong> Khu Vực Pantry Tầng 8 - Trụ sở TechCorp<br />
                    ⏰ <strong>Thời gian:</strong> 15:30 Ngày 20/10/2026<br />
                    🎁 <strong>Phần quà:</strong> Hoa tươi, set quà chăm sóc đặc quyền & tiệc trà trà bánh hoàng gia!
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5C388', paddingTop: '14px', marginTop: '16px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Trao tặng từ:</span>
                    <strong style={{ display: 'block', fontFamily: 'var(--font-serif)', color: 'var(--rose-900)', fontSize: '0.98rem' }}>
                      Toàn Thể Anh Em TechCorp ❤️
                    </strong>
                  </div>
                  <div
                    style={{
                      background: '#BE123C',
                      color: '#FFF',
                      padding: '4px 14px',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      border: '1px solid #FDE68A'
                    }}
                  >
                    CHỨNG NHẬN 20.10
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={downloadRetinaCard}
                disabled={isDownloadingCard}
                className="btn-rose"
                style={{
                  padding: '12px 26px',
                  background: 'linear-gradient(135deg, #BE123C 0%, #8C2F4B 100%)',
                  boxShadow: '0 8px 24px rgba(190, 18, 60, 0.35)'
                }}
              >
                <span>{isDownloadingCard ? '⏳ Đang xuất thiệp 2x...' : '📥 Tải Thiệp Kỷ Niệm 2x Retina'}</span>
              </button>

              <button
                onClick={() => setActivePartyCardModal(false)}
                className="btn-rose"
                style={{ padding: '12px 24px', background: '#FFF', color: 'var(--rose-800)', border: '1.5px solid var(--rose-300)' }}
              >
                <span>🌿 Đóng & Tiếp Tục Thưởng Thức</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}