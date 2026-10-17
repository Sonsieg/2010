import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { fetchPrivateWishes } from '../api.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { playPopSound, playLetterOpenSound, playTruckHonkSound, playSparkleSound, playSoftTapSound } from '../utils/soundEffects.js';

/* ================================================================== */
/*  HELPERS & PROCEDURAL PROCEDURES                                    */
/* ================================================================== */
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const mergeGeos = BufferGeometryUtils.mergeGeometries;

const rngFactory = (seed) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const noise2 = (x, z) =>
  Math.sin(x * 0.21 + 1.3) * Math.cos(z * 0.19 - 0.7) +
  0.5 * Math.sin((x + z) * 0.11 + 2.0);

const normAngle = (a) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

// Camera presets cho xe hoa khi bám theo xe (chỉ giữ các góc bám xe)
const VAN_PRESETS = {
  chase: { rel: true, cam: [4.6, 2.9, -9.5], tgt: [0, 1.5, 2.5] },
  close: { rel: true, cam: [3.8, 1.6, -4.8], tgt: [0, 1.3, 0.2] },
  side: { rel: true, cam: [8.8, 2.1, 0.6], tgt: [0, 1.3, 0.2] },
  top: { rel: true, cam: [0, 16, -6], tgt: [0, 0, 1.5] }
};

// Texture đom đóm hình tròn phát quang mềm mại có lõi sáng dịu (không bị hình vuông)
function fireflyTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gr.addColorStop(0.22, 'rgba(254, 240, 138, 0.95)');
  gr.addColorStop(0.5, 'rgba(234, 179, 8, 0.4)');
  gr.addColorStop(1, 'rgba(234, 179, 8, 0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(32, 32, 32, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,0.35)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner);
  gr.addColorStop(0.35, mid);
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function petalTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  g.translate(32, 32);
  g.rotate(-0.6);
  const gr = g.createRadialGradient(0, 0, 2, 0, 0, 26);
  gr.addColorStop(0, '#fff1f5');
  gr.addColorStop(0.6, '#f9a8c4');
  gr.addColorStop(1, 'rgba(249,168,196,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.ellipse(0, 0, 24, 13, 0, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const g = c.getContext('2d');
  const rnd = rngFactory(77);
  for (let i = 0; i < 16; i++) {
    const x = 30 + rnd() * 196;
    const y = 30 + rnd() * 36;
    const r = 22 + rnd() * 30;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 96);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function signTexture(text) {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = '#7a1f3d';
  g.beginPath();
  g.roundRect ? g.roundRect(6, 6, 628, 148, 28) : g.rect(6, 6, 628, 148);
  g.fill();
  g.strokeStyle = '#e8c27a';
  g.lineWidth = 6;
  g.stroke();
  g.strokeStyle = 'rgba(232,194,122,0.55)';
  g.lineWidth = 2;
  g.strokeRect(22, 22, 596, 116);
  g.fillStyle = '#f4d58d';
  g.font = 'italic 600 56px Georgia, "Times New Roman", serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 320, 84);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function paint(geo, color, shade = 1) {
  const c = new THREE.Color(color);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r * shade;
    arr[i * 3 + 1] = c.g * shade;
    arr[i * 3 + 2] = c.b * shade;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

function petal({ sx, sy, sz, tilt, yaw, r, y, color, shade }) {
  const g = new THREE.SphereGeometry(1, 6, 4);
  g.scale(sx, sy, sz);
  g.translate(0, sy * 0.9, 0);
  g.rotateX(tilt);
  g.translate(0, 0, r);
  g.rotateY(yaw);
  g.translate(0, y, 0);
  return paint(g, color, shade);
}

function makeRoseHead() {
  const parts = [];
  const rings = [
    [4, 0.018, 0.1, 0.034, 0.06, 0.0, 0.6],
    [5, 0.04, 0.32, 0.05, 0.07, -0.004, 0.75],
    [6, 0.068, 0.58, 0.062, 0.074, -0.014, 0.88],
    [7, 0.096, 0.88, 0.066, 0.07, -0.03, 1.0]
  ];
  rings.forEach(([n, r, tilt, sx, sy, y, sh], ri) => {
    for (let i = 0; i < n; i++) {
      parts.push(
        petal({
          sx,
          sy,
          sz: 0.016,
          tilt,
          yaw: (i / n) * Math.PI * 2 + ri * 0.45,
          r,
          y,
          color: 0xffffff,
          shade: sh
        })
      );
    }
  });
  const bud = new THREE.SphereGeometry(0.03, 6, 4);
  bud.translate(0, 0.03, 0);
  parts.push(paint(bud, 0xffffff, 0.5));
  return mergeGeos(parts);
}

function makeTulipHead() {
  const parts = [];
  for (let i = 0; i < 3; i++) {
    parts.push(
      petal({
        sx: 0.036,
        sy: 0.085,
        sz: 0.017,
        tilt: 0.2,
        yaw: (i / 3) * Math.PI * 2,
        r: 0.024,
        y: 0,
        color: 0xffffff,
        shade: 0.95
      })
    );
    parts.push(
      petal({
        sx: 0.034,
        sy: 0.078,
        sz: 0.016,
        tilt: 0.1,
        yaw: (i / 3) * Math.PI * 2 + Math.PI / 3,
        r: 0.018,
        y: 0.005,
        color: 0xffffff,
        shade: 0.8
      })
    );
  }
  return mergeGeos(parts);
}

function makeDaisyHead() {
  const parts = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const g = new THREE.SphereGeometry(1, 5, 3);
    g.scale(0.017, 0.0035, 0.075);
    g.translate(0, 0, 0.085);
    g.rotateX(-0.14);
    g.rotateY((i / n) * Math.PI * 2);
    parts.push(paint(g, 0xffffff, 0.98));
  }
  const center = new THREE.SphereGeometry(0.036, 7, 5);
  center.scale(1, 0.55, 1);
  center.translate(0, 0.008, 0);
  parts.push(paint(center, 0xf4b400, 1));
  return mergeGeos(parts);
}

function makeLavenderHead() {
  const parts = [];
  const n = 22;
  const a = new THREE.Color(0x7c3aed);
  const b = new THREE.Color(0xc4b5fd);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const rad = 0.05 * (1 - t * 0.75);
    const ang = i * 2.4;
    const g = new THREE.SphereGeometry(0.022 * (1 - t * 0.4), 5, 4);
    g.translate(Math.cos(ang) * rad, 0.02 + t * 0.26, Math.sin(ang) * rad);
    parts.push(paint(g, a.clone().lerp(b, t), 1));
  }
  return mergeGeos(parts);
}

function makeStem(h, leaves = true) {
  const parts = [];
  const s = new THREE.CylinderGeometry(0.007, 0.011, h, 5);
  s.translate(0, h / 2, 0);
  parts.push(paint(s, 0x2f6d2b, 1));
  const cal = new THREE.ConeGeometry(0.02, 0.05, 6);
  cal.translate(0, h - 0.01, 0);
  parts.push(paint(cal, 0x3b7d33, 1));
  if (leaves) {
    for (let i = 0; i < 3; i++) {
      parts.push(
        petal({
          sx: 0.03,
          sy: 0.15,
          sz: 0.007,
          tilt: 0.9 + i * 0.1,
          yaw: i * 2.1 + 0.5,
          r: 0.0,
          y: h * (0.18 + i * 0.16),
          color: 0x3f8a36,
          shade: 0.9
        })
      );
    }
  }
  return mergeGeos(parts);
}

function makeBlade() {
  const g = new THREE.PlaneGeometry(1, 1, 1, 3);
  const p = g.attributes.position;
  const cols = new Float32Array(p.count * 3);
  const root = new THREE.Color(0x163a17);
  const tip = new THREE.Color(0xa8d860);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + 0.5;
    const x = p.getX(i);
    p.setXYZ(i, x * 0.09 * (1 - 0.9 * y), y * 0.6, y * y * 0.12);
    c.copy(root).lerp(tip, y);
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.computeVertexNormals();
  return g;
}

function windify(mat, timeU, amp) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeU;
    shader.uniforms.uAmp = { value: amp };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uAmp;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 iP = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 iP = vec3(0.0);
        #endif
        float sw = pow(max(position.y, 0.0), 1.5) * uAmp;
        transformed.x += sin(uTime * 1.6 + iP.x * 0.35 + iP.z * 0.27) * sw;
        transformed.z += cos(uTime * 1.2 + iP.z * 0.31 + iP.x * 0.22) * sw * 0.7;`
      );
  };
  return mat;
}

function taperedTube(curve, tubular, r0, r1, radial) {
  const g = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
  const pos = g.attributes.position;
  for (let j = 0; j <= tubular; j++) {
    const u = j / tubular;
    const c = curve.getPointAt(u);
    const r = r0 + (r1 - r0) * u;
    for (let k = 0; k <= radial; k++) {
      const i = j * (radial + 1) + k;
      pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * r, c.y + (pos.getY(i) - c.y) * r, c.z + (pos.getZ(i) - c.z) * r);
    }
  }
  g.computeVertexNormals();
  return g;
}

function makeHeartGeometry(depth = 0.2, bevel = 0.07) {
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    pts.push(
      new THREE.Vector2(
        (16 * Math.pow(Math.sin(t), 3)) / 32,
        (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 32
      )
    );
  }
  const shape = new THREE.Shape(pts);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 20
  });
  g.center();
  return g;
}

/* ================================================================== */
/*  6 MASTER 3D STATIONS DEFINITIONS                                   */
/* ================================================================== */
export const STATIONS = [
  {
    id: 'gift',
    u: 0.02,
    name: 'Hộp Quà Hoàng Gia',
    subtitle: 'Chạm Hộp Quà Mở Bung Nắp, Thả Bướm & Bong Bóng 20.10',
    icon: '🎁'
  },
  {
    id: 'letter',
    u: 0.18,
    name: 'Đại Điện Thư Ngỏ',
    subtitle: 'Tấm Thiệp Bifold Khổng Lồ Dát Vàng & Chân Dung Tri Ân',
    icon: '💌'
  },
  {
    id: 'balloons',
    u: 0.35,
    name: 'Thung Lũng Bóng Bay',
    subtitle: 'Chạm Nổ Bóng Nhận Ngay Những Lời Chúc May Mắn Ngọt Ngào',
    icon: '🎈'
  },
  {
    id: 'courier',
    u: 0.52,
    name: 'Đại Lộ Xe Hoa 20/10',
    subtitle: 'Chuyến Xe Hoa Cổ Điển Rực Rỡ & Hòm Thư Bưu Kiện Riêng',
    icon: '🚐'
  },
  {
    id: 'video',
    u: 0.70,
    name: 'Rạp Chiếu Điện Ảnh',
    subtitle: 'Khán Đài Hoàng Hôn & Thước Phim Tri Ân Phái Đẹp',
    icon: '🎬'
  },
  {
    id: 'party',
    u: 0.88,
    name: 'Lâu Đài Tiệc Mừng',
    subtitle: 'Cung Điện Tiệc Hoàng Gia & Tải Thiệp Kỷ Niệm 2x Retina',
    icon: '💐'
  }
];

/* ================================================================== */
/*  MAIN COMPONENT: WORLD 3D EXPERIENCE MASTER                         */
/* ================================================================== */
export default function World3DExperience() {
  const {
    selectedSister,
    updateExperienceMode,
    wishes,
    setActiveModalWish
  } = useApp();

  const sisterName = selectedSister ? selectedSister.name : 'Chị Lan Anh';

  // Navigation & Camera states: MẶC ĐỊNH MỞ ĐẦU TẠI TRẠM 0 (HỘP QUÀ HOÀNG GIA)
  const [activeStationIndex, setActiveStationIndex] = useState(0);
  const [activeVanCamPreset, setActiveVanCamPreset] = useState('chase');
  const [autoRotate, setAutoRotate] = useState(false);
  const autoRotateRef = useRef(false);
  autoRotateRef.current = autoRotate;

  // Phát hiện thiết bị di động / màn hình nhỏ để tối ưu chỉ dẫn thao tác cảm ứng
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

  // Chế độ Dạ Tiệc Đêm (Night Gala Mode - tăng đèn, tăng LED lung linh)
  const [isNightMode, setIsNightMode] = useState(false);
  const nightModeRef = useRef(false);
  nightModeRef.current = isNightMode;

  // Chế độ Điện Ảnh (Ẩn bớt thanh HUD trên đỉnh để mở rộng tầm nhìn toàn cảnh 100%)
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
    bloom: null
  });

  // Modals
  const [messages, setMessages] = useState([]);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [readingMessage, setReadingMessage] = useState(null);
  const [activeVideoModal, setActiveVideoModal] = useState(false);
  const [activePartyCardModal, setActivePartyCardModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  // Refs for Three.js World
  const containerRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const vanStateRef = useRef({ pos: new THREE.Vector3(), yaw: 0 });
  const transRef = useRef(null);
  const followVanRef = useRef(false); // Ban đầu ở Trạm 0 (Hộp quà), không bám xe
  const printableCardRef = useRef(null);

  // Dynamic animations hooks
  const giftAnimationRef = useRef({
    opened: false,
    lidMesh: null,
    butterflies: [],
    balloons: [],
    openProgress: 0
  });

  // Tải danh sách thư riêng
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

  // Chuyển đổi giữa Chế độ Hoàng Hôn & Dạ Tiệc Đêm
  const toggleNightMode = () => {
    setIsNightMode((prev) => {
      const next = !prev;
      nightModeRef.current = next;
      const atmo = worldAtmosphereRef.current;
      if (atmo && atmo.skyMat) {
        if (next) {
          // Bầu trời đêm huyền ảo tím than ngàn sao
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
          if (atmo.letterMat) {
            atmo.letterMat.emissiveIntensity = 0.55;
          }
          if (atmo.bloom) atmo.bloom.strength = 0.55;
          confetti({ particleCount: 70, spread: 90, origin: { y: 0.6 }, colors: ['#FDE68A', '#FCD34D', '#C084FC', '#FFF'] });
          showToast('🌙 Đã kích hoạt Dạ Tiệc Đêm lung linh ánh đèn!');
        } else {
          // Bầu trời hoàng hôn ấm áp
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
          if (atmo.letterMat) {
            atmo.letterMat.emissiveIntensity = 0.18;
          }
          if (atmo.bloom) atmo.bloom.strength = 0.38;
          showToast('🌅 Đã chuyển về Bầu Trời Hoàng Hôn ấm áp!');
        }
      }
      return next;
    });
  };

  // Góc nhìn Toàn Cảnh Thế Giới 3D (Đưa ra thành HUD chung của Thế Giới)
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

  // Fly to Station Function
  const flyToStation = (idx) => {
    playSoftTapSound();
    setActiveStationIndex(idx);
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl || !transRef.current) return;

    // Trạm 3 là trạm xe hoa -> bám theo xe
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

    // Các trạm cố định dọc theo đường
    followVanRef.current = false;
    const stConfig = transRef.current.stationsPos[idx];
    if (!stConfig) return;

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

  // Preset góc nhìn xe hoa
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

  // Tải thiệp kỷ niệm 2x Retina bằng html2canvas
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
    const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, powerPreference: 'high-performance' });
    const pr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

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

    // Vòm 1.200 vì sao tinh tú lấp lánh (hiện rực rỡ trong Dạ Tiệc Đêm)
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

    const sun = new THREE.DirectionalLight(
      isNightMode ? 0xbcd4ff : 0xffc890,
      isNightMode ? 1.2 : 2.7
    );
    sun.castShadow = true;
    sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 140;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
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

    /* ---------- Grass Instanced Fields ---------- */
    const bladeGeo = makeBlade();
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    {
      const GN = Math.floor(48000 * Q);
      const pts = scatter(GN, 2.0, 26, 1.8);
      const mat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), timeU, 0.3);
      const grass = new THREE.InstancedMesh(bladeGeo, mat, pts.length);
      pts.forEach((p, i) => {
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set((rand() - 0.5) * 0.25, rand() * Math.PI * 2, 0);
        const h = 0.7 + rand() * 1.1;
        dummy.scale.set(0.9 + rand() * 0.6, h, 1);
        dummy.updateMatrix();
        grass.setMatrixAt(i, dummy.matrix);
        tint.setRGB(0.75 + rand() * 0.4, 0.85 + rand() * 0.3, 0.65 + rand() * 0.25);
        grass.setColorAt(i, tint);
      });
      grass.frustumCulled = false;
      scene.add(grass);
    }

    /* ---------- 4 Real Flower Species (Roses, Tulips, Daisies, Lavender) ---------- */
    const roseHeadBase = makeRoseHead();
    const species = [
      {
        count: 1400,
        stemH: 0.7,
        head: roseHeadBase.clone(),
        leaves: true,
        tint: true,
        pal: [0xe11d48, 0xfb7185, 0xfda4af, 0xfff1f2, 0xbe123c, 0xf9a8d4],
        sc: [1.2, 1.9]
      },
      {
        count: 1500,
        stemH: 0.62,
        head: makeTulipHead(),
        leaves: true,
        tint: true,
        pal: [0xf43f5e, 0xfbbf24, 0xfde68a, 0xf97316, 0xfb7185, 0xe879f9],
        sc: [1.3, 2.0]
      },
      { count: 1800, stemH: 0.5, head: makeDaisyHead(), leaves: false, tint: false, pal: null, sc: [1.1, 1.8] },
      {
        count: 1400,
        stemH: 0.95,
        head: makeLavenderHead(),
        leaves: true,
        tint: true,
        pal: [0xffffff, 0xf5d0fe, 0xc7d2fe, 0xddd6fe],
        sc: [1.2, 1.9]
      }
    ];
    species.forEach((sp, si) => {
      const n = Math.floor(sp.count * Q);
      const pts = scatter(n, 2.0, 24, 1.5);
      const stemGeo = makeStem(sp.stemH, sp.leaves);
      sp.head.translate(0, sp.stemH, 0);
      const stemMat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), timeU, 0.2);
      const headMat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide }), timeU, 0.2);
      const stems = new THREE.InstancedMesh(stemGeo, stemMat, pts.length);
      const heads = new THREE.InstancedMesh(sp.head, headMat, pts.length);
      pts.forEach((p, i) => {
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set((rand() - 0.5) * 0.35, rand() * Math.PI * 2, (rand() - 0.5) * 0.35);
        const s = sp.sc[0] + rand() * (sp.sc[1] - sp.sc[0]);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        stems.setMatrixAt(i, dummy.matrix);
        heads.setMatrixAt(i, dummy.matrix);
        if (sp.tint) {
          const nv = (noise2(p.x * 0.9 + si * 7, p.z * 0.9) / 1.5 + 1) / 2;
          let ci = Math.floor(nv * sp.pal.length);
          if (rand() < 0.2) ci = Math.floor(rand() * sp.pal.length);
          ci = Math.min(sp.pal.length - 1, Math.max(0, ci));
          tint.set(sp.pal[ci]);
          heads.setColorAt(i, tint);
        }
      });
      stems.frustumCulled = false;
      heads.frustumCulled = false;
      scene.add(stems);
      scene.add(heads);
    });

    /* ---------- Cherry Blossom Trees with Petals ---------- */
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

    /* ---------- Vintage Fence + Climbing Roses Along Road ---------- */
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

    /* ---------- Street Lamp Posts (Vintage) & Station Lights ---------- */
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

      // 18 Cột đèn cổ kính dọc con đường đồi uốn lượn
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

      // Đèn cổ kính hoàng gia thắp sáng các trạm dừng
      spawnLamp(-4.2, 5.0); // Trạm 0 - Hộp quà
      spawnLamp(4.2, 5.0);
      spawnLamp(14.5, -3.8); // Trạm 1 - Thư ngỏ
      spawnLamp(18.5, 4.2);
      spawnLamp(-18.0, 16.5); // Trạm 2 - Bóng bay
      spawnLamp(-12.5, 23.5);
      spawnLamp(-24.5, -12.0); // Trạm 5 - Quảng trường Lâu đài
      spawnLamp(-15.5, -21.0);
    }

    /* ---------- Đàn 320 Đom Đóm Tròn Mềm Mại Bay Lượn Lung Linh ---------- */
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
    /*  ORIGINAL CLASSIC FLORAL DELIVERY TRUCK (CHIẾC XE HOA GỐC 100%)    */
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

    // Thân xe extrude cong mềm mại
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

    // Dải thân dưới màu rượu vang bo tròn
    const skirt = new THREE.Mesh(new RoundedBoxGeometry(2.03, 0.42, 4.5, 4, 0.12), wineMat);
    skirt.position.set(0, 0.8, 0.03);
    bodyGroup.add(skirt);

    // Bảng hiệu 2 bên xe
    const signTexMesh = signTexture('Bưu Điện Hoa · 20/10');
    const signMat = new THREE.MeshStandardMaterial({ map: signTexMesh, roughness: 0.5, transparent: true });
    [-1, 1].forEach((side) => {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.425), signMat);
      sign.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      sign.position.set(side * 0.985, 1.45, -0.85);
      bodyGroup.add(sign);

      // Cửa sổ cabin
      const wp = [
        [0.12, 1.5],
        [0.88, 1.5],
        [0.74, 1.9],
        [0.12, 1.9]
      ];
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

    // Kính chắn gió
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.58), glassMat);
    ws.rotation.x = -0.4636;
    ws.position.set(0, 1.77, 0.96);
    bodyGroup.add(ws);
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.42), glassMat);
    rw.rotation.y = Math.PI;
    rw.position.set(0, 1.75, -2.17);
    bodyGroup.add(rw);

    // Cản trước sau + đèn pha viền chrome
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

    // 4 Bánh xe vintage có nan hoa mạ vàng quay tròn
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

    // Giá hoa nóc xe + 120 đóa hoa hồng nhung
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
      [-RX, RZ0],
      [RX, RZ0],
      [-RX, RZ1],
      [RX, RZ1]
    ].forEach(([x, z]) => rackBar(x, (RY0 + RY1) / 2, z, 0.04, RY1 - RY0, 0.04));
    rackBar(0, RY1, RZ0, RX * 2, 0.04, 0.04);
    rackBar(0, RY1, RZ1, RX * 2, 0.04, 0.04);
    rackBar(-RX, RY1, (RZ0 + RZ1) / 2, 0.04, 0.04, RZ1 - RZ0);
    rackBar(RX, RY1, (RZ0 + RZ1) / 2, 0.04, 0.04, RZ1 - RZ0);
    rackBar(-RX, (RY0 + RY1) / 2, (RZ0 + RZ1) / 2, 0.03, 0.03, RZ1 - RZ0);
    rackBar(RX, (RY0 + RY1) / 2, (RZ0 + RZ1) / 2, 0.03, 0.03, RZ1 - RZ0);

    {
      const nR = 120;
      const roofRoses = new THREE.InstancedMesh(roseHeadBase.clone(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide }), nR);
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

    // Túi thư da nâu & chồng phong bì niêm phong sáp đỏ trái tim
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

    // Dây đèn fairy lights nhấp nháy 32 bóng quanh giá hoa
    const fairyOrbs = [];
    {
      const orbGeo = new THREE.SphereGeometry(0.035, 8, 6);
      const loop = [
        [-RX, RZ0],
        [RX, RZ0],
        [RX, RZ1],
        [-RX, RZ1]
      ];
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

    /* ---------- Floating Winged Letters & Crystal Hearts Around Van ---------- */
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

    scene.add(vanRoot);

    /* ---------- Vọng Lâu (Gazebo) bên vệ đường gần xe hoa ---------- */
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

    /* ---------- Sparkle Trail & Falling Petals System ---------- */
    const petalTex = petalTexture();
    const dotTex = glowTexture();
    const PETALS = Math.floor(260 * Q);
    const petalGeo = new THREE.BufferGeometry();
    const petalPos = new Float32Array(PETALS * 3);
    const petalVel = new Float32Array(PETALS * 2);
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
    /*  BUILDING 5 GRAND STATIONS ALONG THE SCENIC FLOWER ROAD            */
    /* ================================================================== */
    const interactiveMeshes = [];
    const stationCameraPositions = {};

    /* ------------------------------------------------------------------ */
    /*  1. TRẠM 0: HỘP QUÀ HOÀNG GIA (Mở nắp, bướm & bóng bay ra)        */
    /* ------------------------------------------------------------------ */
    {
      const pt = curve.getPointAt(STATIONS[0].u);
      const T = curve.getTangentAt(STATIONS[0].u);
      const norm = new THREE.Vector3(T.z, 0, -T.x).normalize();
      const st0Center = pt.clone().add(norm.clone().multiplyScalar(6.5));
      const st0Group = new THREE.Group();
      st0Group.position.set(st0Center.x, heightAt(st0Center.x, st0Center.z), st0Center.z);

      // Plaza bệ đá cẩm thạch trắng viền hoa
      const pl = new THREE.Mesh(
        new THREE.CylinderGeometry(5.2, 5.6, 0.4, 32),
        new THREE.MeshStandardMaterial({ color: 0xFFFAF3, roughness: 0.6 })
      );
      st0Group.add(pl);

      // Thân hộp quà nhung hồng
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

      // Nắp hộp quà (Lid) có thể bung mở xoay lộn
      const lidGroup = new THREE.Group();
      lidGroup.position.set(0, 2.25, 0);
      const lidBox = new THREE.Mesh(new RoundedBoxGeometry(2.55, 0.45, 2.55, 4, 0.08), giftBodyMat);
      lidGroup.add(lidBox);
      const lidRH = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.47, 0.46), ribbonMat);
      lidGroup.add(lidRH);
      const lidRV = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.47, 2.58), ribbonMat);
      lidGroup.add(lidRV);

      // Nơ 3D ruy băng vàng trên nắp
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

      // Đàn bướm 3D ngũ sắc ẩn trong hộp quà
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

      // Chùm bóng bay mini bung từ hộp
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

      // Bảng chỉ dẫn trên hộp quà
      const giftSignTex = signTexture('Mở Hộp Quà 20/10');
      const giftSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: giftSignTex, transparent: true }));
      giftSprite.position.set(0, 4.4, 0);
      giftSprite.scale.set(4.2, 1.05, 1);
      st0Group.add(giftSprite);

      scene.add(st0Group);

      // Click tương tác mở hộp quà
      const onGiftClick = () => {
        playSparkleSound();
        giftAnimationRef.current.opened = true;
        confetti({
          particleCount: 120,
          spread: 100,
          origin: { y: 0.55 },
          colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#E11D48']
        });
        showToast('🎁 Hộp quà đã mở! Đang đưa bạn đến Thư Ngỏ Tri Ân...');
        setTimeout(() => {
          flyToStation(1); // Tự động chuyển chặng 2
        }, 1600);
      };

      interactiveMeshes.push({ mesh: bodyBox, onClick: onGiftClick });
      interactiveMeshes.push({ mesh: lidBox, onClick: onGiftClick });
      interactiveMeshes.push({ mesh: giftSprite, onClick: onGiftClick });

      // Lưu góc camera nhìn thẳng mặt trước hộp quà
      stationCameraPositions[0] = {
        targetPos: st0Center.clone().add(new THREE.Vector3(0, 1.8, 0)),
        camPos: st0Center.clone().add(norm.clone().multiplyScalar(5.8)).add(new THREE.Vector3(0, 2.2, 0))
      };
    }

    /* ------------------------------------------------------------------ */
    /*  2. TRẠM 1: ĐẠI ĐIỆN THƯ NGỎ (Mặt trước chính diện, không lóa)      */
    /* ------------------------------------------------------------------ */
    {
      const pt = curve.getPointAt(STATIONS[1].u);
      const T = curve.getTangentAt(STATIONS[1].u);
      const norm = new THREE.Vector3(T.z, 0, -T.x).normalize();
      const st1Center = pt.clone().add(norm.clone().multiplyScalar(7.2));
      const st1Group = new THREE.Group();
      st1Group.position.set(st1Center.x, heightAt(st1Center.x, st1Center.z), st1Center.z);

      // Hướng mặt trước: quay quanh trục Y thẳng đứng
      st1Group.rotation.set(0, Math.atan2(norm.x, norm.z), 0);

      // Bệ đá cẩm thạch trắng
      const pl = new THREE.Mesh(
        new THREE.CylinderGeometry(7.2, 7.8, 0.45, 32),
        new THREE.MeshStandardMaterial({ color: 0xFFFAF3, roughness: 0.6 })
      );
      st1Group.add(pl);

      // Tấm thiệp Bifold khổng lồ rộng mở
      const bifoldRoot = new THREE.Group();
      bifoldRoot.position.set(0, 2.4, 0);

      const cardMat = new THREE.MeshStandardMaterial({ color: 0xFAF3EA, roughness: 0.8, metalness: 0.05 });
      const goldFrameMat = new THREE.MeshStandardMaterial({ color: 0xE5C388, metalness: 0.85, roughness: 0.25, envMap: envTex });

      // Cánh trái: Khung ảnh chân dung vinh danh
      const leftWing = new THREE.Mesh(new RoundedBoxGeometry(3.4, 4.4, 0.14, 4, 0.04), cardMat);
      leftWing.position.set(-1.75, 0, 0.35);
      leftWing.rotation.y = 0.22;
      bifoldRoot.add(leftWing);

      // Khung tranh mạ vàng lồng ảnh (dày 0.04, đặt ở z = 0.04)
      const photoFrame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.5, 0.04), goldFrameMat);
      photoFrame.position.set(0, 0.2, 0.05);
      leftWing.add(photoFrame);

      // Ảnh chân dung `/images.jpg` đặt nổi cách khung tranh (z = 0.10) => KHÔNG BAO GIỜ BỊ NHẤP NHÁY Z-FIGHTING!
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

      // Bảng vinh danh dưới ảnh
      const namePlate = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.45, 0.03), goldFrameMat);
      namePlate.position.set(0, -1.7, 0.08);
      leftWing.add(namePlate);

      // Cánh phải: Toàn văn Thư Ngỏ Calligraphy (Nền ngà #FAF3EA, KHÔNG BỊ LÓA BLOOM!)
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

      // Con dấu sáp đỏ 20.10
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
      // Dùng MeshStandardMaterial với emissiveMap để chữ thư ngỏ luôn sáng rõ, dễ đọc cả ban ngày lẫn ban đêm
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

      // Ngọn đèn nến ấm áp chiếu sáng trực tiếp trang thư ngỏ
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

      // Điểm camera đứng TRƯỚC MẶT CHÍNH DIỆN tấm thiệp
      stationCameraPositions[1] = {
        targetPos: st1Center.clone().add(new THREE.Vector3(0, 2.2, 0)),
        camPos: st1Center.clone().add(norm.clone().multiplyScalar(5.5)).add(new THREE.Vector3(0, 2.2, 0))
      };
    }

    /* ------------------------------------------------------------------ */
    /*  3. TRẠM 2: THUNG LŨNG BÓNG BAY (Góc thoáng đãng, bao quát dễ nhìn) */
    /* ------------------------------------------------------------------ */
    {
      const pt = curve.getPointAt(STATIONS[2].u);
      const T = curve.getTangentAt(STATIONS[2].u);
      const norm = new THREE.Vector3(T.z, 0, -T.x).normalize();
      const st2Center = pt.clone().add(norm.clone().multiplyScalar(6.5));
      const st2Group = new THREE.Group();
      st2Group.position.set(st2Center.x, heightAt(st2Center.x, st2Center.z), st2Center.z);

      // Cụm 14 quả bóng bay hoàng gia (hình trái tim & tròn) sắp xếp hình vòm cung trong tầm tay
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

        // Xếp theo hình cánh cung rộng 4m trước tầm mắt
        const angle = -1.2 + (i / 13) * 2.4;
        const rad = 2.8 + (i % 3) * 0.4;
        const bY = 1.3 + (i % 4) * 0.5 + Math.sin(i * 1.2) * 0.3;
        bMesh.position.set(Math.sin(angle) * rad, bY, Math.cos(angle) * rad * 0.5);
        bMesh.rotation.y = (rand() - 0.5) * 0.6;

        // Dây bóng bay
        const strMesh = new THREE.Mesh(stringGeo, stringMat);
        bMesh.add(strMesh);
        st2Group.add(bMesh);

        // Gắn lời chúc
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
            setActiveModalWish(wishData); // Mở Modal lời chúc 3D tilt
          }
        });
        balloonMeshes.push(bMesh);
      }

      scene.add(st2Group);

      // Điểm camera đứng góc thoáng đãng, lùi xa bao quát trọn vẹn cụm bóng bay
      stationCameraPositions[2] = {
        targetPos: st2Center.clone().add(new THREE.Vector3(0, 2.2, 0)),
        camPos: st2Center.clone().add(norm.clone().multiplyScalar(8.2)).add(new THREE.Vector3(0, 3.0, 0))
      };
    }

    /* ------------------------------------------------------------------ */
    /*  4. TRẠM 4: RẠP CHIẾU ĐIỆN ẢNH (Màn hình Cinema 16:9 ngoài trời)   */
    /* ------------------------------------------------------------------ */
    {
      const pt = curve.getPointAt(STATIONS[4].u);
      const T = curve.getTangentAt(STATIONS[4].u);
      const norm = new THREE.Vector3(T.z, 0, -T.x).normalize();
      const st4Center = pt.clone().add(norm.clone().multiplyScalar(7.5));
      const st4Group = new THREE.Group();
      st4Group.position.set(st4Center.x, heightAt(st4Center.x, st4Center.z), st4Center.z);
      st4Group.rotation.set(0, Math.atan2(norm.x, norm.z), 0);

      // Sàn gỗ amphitheater
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.85 });
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(8.0, 8.5, 0.4, 32), woodMat);
      st4Group.add(deck);

      // Màn hình Cinema 16:9
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

      // Dàn đèn festoon lights
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
        camPos: st4Center.clone().add(norm.clone().multiplyScalar(6.5)).add(new THREE.Vector3(0, 2.8, 0))
      };
    }

    /* ------------------------------------------------------------------ */
    /*  5. TRẠM 5: LÂU ĐÀI TIỆC MỪNG HOÀNG GIA (HOÀNH TRÁNG, ĐỨNG THẲNG)    */
    /* ------------------------------------------------------------------ */
    {
      const pt = curve.getPointAt(STATIONS[5].u);
      const T = curve.getTangentAt(STATIONS[5].u);
      const norm = new THREE.Vector3(T.z, 0, -T.x).normalize();
      const st5Center = pt.clone().add(norm.clone().multiplyScalar(9.5));
      const st5Group = new THREE.Group();
      st5Group.position.set(st5Center.x, heightAt(st5Center.x, st5Center.z), st5Center.z);
      // GIỮ TRỤC Y THẲNG ĐỨNG 100%, KHÔNG DÙNG lookAt TRÁNH BỊ ĐỔ NGHIÊNG
      st5Group.rotation.set(0, Math.atan2(norm.x, norm.z), 0);

      // Vật liệu lâu đài hoàng gia cao cấp
      const marbleMat = new THREE.MeshStandardMaterial({ color: 0xFFFDF9, roughness: 0.35, metalness: 0.08, envMap: envTex });
      const palaceWallMat = new THREE.MeshStandardMaterial({ color: 0xFAF3EA, roughness: 0.65, metalness: 0.05, envMap: envTex });
      const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.9, roughness: 0.2, envMap: envTex });
      const roofSpireMat = new THREE.MeshStandardMaterial({ color: 0x8C2F4B, roughness: 0.35, metalness: 0.3, envMap: envTex });
      const stainedGlassMat = new THREE.MeshStandardMaterial({ color: 0xFDE68A, emissive: 0xF59E0B, emissiveIntensity: 2.2, roughness: 0.2 });

      /* --- A. ĐẾ THÀNH TRÌ ĐA TẦNG & CẦU THANG DANH DỰ --- */
      // Tầng 1 thành trì
      const basePlatform1 = new THREE.Mesh(new THREE.CylinderGeometry(15.0, 16.2, 1.2, 40), marbleMat);
      basePlatform1.position.y = 0.6;
      basePlatform1.receiveShadow = true;
      st5Group.add(basePlatform1);

      // Tầng 2 sân thượng đại tiệc
      const basePlatform2 = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 13.5, 0.8, 36), marbleMat);
      basePlatform2.position.y = 1.6;
      basePlatform2.receiveShadow = true;
      st5Group.add(basePlatform2);

      // Lan can con tiện cẩm thạch bao quanh sân thượng (Balustrades)
      for (let b = 0; b < 28; b++) {
        const ang = (b / 28) * Math.PI * 2;
        // Chừa lối vào phía trước thảm đỏ
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

      // Thảm đỏ hoàng gia trải dài từ bậc thềm vào trung tâm
      const royalRedCarpet = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.06, 12.0),
        new THREE.MeshStandardMaterial({ color: 0x8C1D40, roughness: 0.75 })
      );
      royalRedCarpet.position.set(0, 2.04, 5.0);
      st5Group.add(royalRedCarpet);

      // 4 Bệ đuốc đá thắp lửa vàng lung linh
      [
        [-9.5, 9.5],
        [9.5, 9.5],
        [-9.5, -9.5],
        [9.5, -9.5]
      ].forEach(([bx, bz]) => {
        const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.4, 8), goldTrimMat);
        brazier.position.set(bx, 2.7, bz);
        st5Group.add(brazier);
        const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFDE68A, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }));
        flame.scale.set(1.8, 1.8, 1);
        flame.position.set(bx, 3.6, bz);
        st5Group.add(flame);
      });

      /* --- B. TÒA THÀNH CHÍNH (GRAND PALACE KEEP) --- */
      const mainKeep = new THREE.Mesh(new RoundedBoxGeometry(15.0, 9.5, 8.5, 4, 0.3), palaceWallMat);
      mainKeep.position.set(0, 6.75, -2.5);
      mainKeep.castShadow = true;
      st5Group.add(mainKeep);

      // Cổng vòm La Mã vĩ đại (Grand Roman Arch Portal)
      const archPortal = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.45, 12, 28, Math.PI), goldTrimMat);
      archPortal.position.set(0, 5.2, 1.8);
      st5Group.add(archPortal);

      const portalPillars = [-2.6, 2.6];
      portalPillars.forEach(px => {
        const pCol = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 4.2, 16), goldTrimMat);
        pCol.position.set(px, 3.1, 1.8);
        st5Group.add(pCol);
      });

      // Cửa gỗ sồi nâu viền đồng cổ bên trong cổng vòm
      const woodenDoors = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, 4.8, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x4A2E1B, roughness: 0.85 })
      );
      woodenDoors.position.set(0, 3.4, 1.7);
      st5Group.add(woodenDoors);

      // Cửa sổ Gothic kính màu phát sáng lung linh
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

      // Ban công hoàng gia tầng 2
      const royalBalcony = new THREE.Mesh(new RoundedBoxGeometry(6.4, 0.6, 1.8, 3, 0.08), marbleMat);
      royalBalcony.position.set(0, 6.8, 2.4);
      st5Group.add(royalBalcony);

      /* --- C. 4 TÒA THÁP CANH 4 GÓC & CHÓP THÁP VƯƠN CAO 16M --- */
      const towerPositions = [
        [-7.6, 1.6],
        [7.6, 1.6],
        [-7.6, -6.6],
        [7.6, -6.6]
      ];
      towerPositions.forEach(([tx, tz]) => {
        // Thân tháp tròn cẩm thạch cao 14m
        const towerShaft = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 13.5, 20), palaceWallMat);
        towerShaft.position.set(tx, 8.75, tz);
        towerShaft.castShadow = true;
        st5Group.add(towerShaft);

        // Vành răng cưa chiến lũy (crenellations)
        const crenel = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.7, 0.8, 16), goldTrimMat);
        crenel.position.set(tx, 15.6, tz);
        st5Group.add(crenel);

        // Chóp tháp nhọn cao vút màu đỏ mận hoàng gia (Conical Spire)
        const spire = new THREE.Mesh(new THREE.ConeGeometry(2.1, 6.5, 20), roofSpireMat);
        spire.position.set(tx, 19.2, tz);
        spire.castShadow = true;
        st5Group.add(spire);

        // Đỉnh tháp mạ vàng kim có quả cầu pha lê
        const spireTip = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), goldTrimMat);
        spireTip.position.set(tx, 22.6, tz);
        st5Group.add(spireTip);
      });

      /* --- D. ĐẠI THÁP TRUNG TÂM VĨ ĐẠI VƯƠN CAO 25M --- */
      // Thân tháp bát giác trung tâm
      const centralKeep = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 18.0, 8), palaceWallMat);
      centralKeep.position.set(0, 11.0, -2.5);
      centralKeep.castShadow = true;
      st5Group.add(centralKeep);

      // Vành ban công chuông
      const midRing = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 2.7, 1.0, 8), goldTrimMat);
      midRing.position.set(0, 20.2, -2.5);
      st5Group.add(midRing);

      // Mặt đồng hồ chạm nổi hoàng gia "20.10"
      const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.2, 24), goldTrimMat);
      clockFace.rotation.x = Math.PI / 2;
      clockFace.position.set(0, 16.5, 0.6);
      st5Group.add(clockFace);

      // Chóp Đại Tháp dát vàng kim cao 8m vươn tới độ cao 28m!
      const grandSpire = new THREE.Mesh(new THREE.ConeGeometry(3.0, 8.5, 16), goldTrimMat);
      grandSpire.position.set(0, 24.8, -2.5);
      grandSpire.castShadow = true;
      st5Group.add(grandSpire);

      // Cột cờ phướn nhung tung bay trên đỉnh cao nhất
      const grandFlagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), chromeMat);
      grandFlagPole.position.set(0, 29.8, -2.5);
      st5Group.add(grandFlagPole);

      const grandFlag = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xBE123C, side: THREE.DoubleSide })
      );
      grandFlag.position.set(1.2, 30.2, -2.5);
      st5Group.add(grandFlag);

      /* --- E. BÀN ĐẠI YẾN HOÀNG GIA (GRAND BANQUET TABLE) --- */
      const banquetTable = new THREE.Mesh(
        new RoundedBoxGeometry(8.0, 0.9, 2.6, 4, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xFFFAF3, roughness: 0.45 })
      );
      banquetTable.position.set(0, 2.45, 1.2);
      st5Group.add(banquetTable);

      // Bánh kem tiệc 20.10 4 tầng trang trí hoa hồng
      const cakeColors = [0xFFF1F2, 0xFB7185, 0xE11D48, 0xC9A66B];
      [
        [1.1, 0.38, 3.09],
        [0.82, 0.32, 3.44],
        [0.55, 0.28, 3.74],
        [0.32, 0.22, 3.99]
      ].forEach(([r, h, y], ci) => {
        const tier = new THREE.Mesh(
          new THREE.CylinderGeometry(r, r, h, 24),
          new THREE.MeshStandardMaterial({ color: cakeColors[ci], roughness: 0.35 })
        );
        tier.position.set(-1.8, y, 1.2);
        st5Group.add(tier);
      });
      // Nến số 20.10 phát sáng trên đỉnh bánh
      const candleFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFDE68A, transparent: true, blending: THREE.AdditiveBlending }));
      candleFlame.scale.set(0.9, 0.9, 1);
      candleFlame.position.set(-1.8, 4.3, 1.2);
      st5Group.add(candleFlame);

      // Tháp 24 ly Champagne pha lê kim tự tháp phát sáng
      for (let g = 0; g < 20; g++) {
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.065, 0.02, 0.24, 8),
          new THREE.MeshPhysicalMaterial({ color: 0xFDE68A, transmission: 0.9, roughness: 0.1, thickness: 0.3 })
        );
        const gx = 1.0 + (g % 5) * 0.28;
        const gz = 0.8 + Math.floor(g / 5) * 0.28;
        glass.position.set(gx, 3.02, gz);
        st5Group.add(glass);
      }

      // Giỏ hoa hồng lớn ở hai đầu bàn tiệc
      [-3.4, 3.4].forEach(fx => {
        const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.3, 0.5, 12), goldTrimMat);
        basket.position.set(fx, 3.15, 1.2);
        st5Group.add(basket);
        const bouquet = new THREE.Mesh(
          new THREE.SphereGeometry(0.55, 12, 10),
          new THREE.MeshStandardMaterial({ color: 0xE11D48, roughness: 0.5 })
        );
        bouquet.position.set(fx, 3.5, 1.2);
        st5Group.add(bouquet);
      });

      // 6 Chân nến đồng hoàng gia phát sáng
      [-2.6, 0, 2.6].forEach(nx => {
        [-0.8, 0.8].forEach(nz => {
          const cand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.55, 8), goldTrimMat);
          cand.position.set(nx, 3.18, 1.2 + nz);
          st5Group.add(cand);
          const cF = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFDE68A, transparent: true, blending: THREE.AdditiveBlending }));
          cF.scale.set(0.7, 0.7, 1);
          cF.position.set(nx, 3.55, 1.2 + nz);
          st5Group.add(cF);
        });
      });

      /* --- F. BỤC VINH DANH & RƯƠNG BÁU DÁT VÀNG PHÁT HÀO QUANG --- */
      const altarBase = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.45, 24), marbleMat);
      altarBase.position.set(0, 2.22, 6.2);
      st5Group.add(altarBase);

      const chestMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.9, roughness: 0.22, envMap: envTex });
      const royalChest = new THREE.Mesh(new RoundedBoxGeometry(1.8, 1.2, 1.2, 4, 0.12), chestMat);
      royalChest.position.set(0, 3.05, 6.2);
      royalChest.castShadow = true;
      st5Group.add(royalChest);

      // Luồng hào quang ánh kim xoay tròn quanh rương báu
      const chestHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFDE68A, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
      chestHalo.scale.set(4.2, 4.2, 1);
      chestHalo.position.set(0, 3.6, 6.2);
      st5Group.add(chestHalo);

      // Biển hiệu vương giả chào mừng
      const partySignTex = signTexture('Tiệc Mừng 20/10 & Nhận Quà');
      const partySignSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: partySignTex, transparent: true }));
      partySignSprite.position.set(0, 6.8, 6.2);
      partySignSprite.scale.set(4.8, 1.2, 1);
      st5Group.add(partySignSprite);

      scene.add(st5Group);

      const onPartyClick = () => {
        playSparkleSound();
        setActivePartyCardModal(true);
        confetti({
          particleCount: 110,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#BE123C']
        });
        showToast('💐 Đang mở cổng Tiệc Mừng 20/10 & xuất thiệp Retina 2x!');
      };

      interactiveMeshes.push({ mesh: royalChest, onClick: onPartyClick });
      interactiveMeshes.push({ mesh: banquetTable, onClick: onPartyClick });
      interactiveMeshes.push({ mesh: partySignSprite, onClick: onPartyClick });

      // Vị trí camera vàng: Đứng lùi 16.5m, cao 5.5m bao quát trọn vẹn tòa lâu đài 24m tráng lệ
      stationCameraPositions[5] = {
        targetPos: st5Center.clone().add(new THREE.Vector3(0, 4.2, 0)),
        camPos: st5Center.clone().add(norm.clone().multiplyScalar(16.5)).add(new THREE.Vector3(0, 5.5, 0))
      };
    }

    /* ---------- Setup Camera Transitions Dictionary ---------- */
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

    /* ---------- Post-processing: bloom nhẹ hoàng hôn / lung linh dạ tiệc đêm ---------- */
    const rt = new THREE.WebGLRenderTarget(width * pr, height * pr, { type: THREE.HalfFloatType, samples: lowPower ? 0 : 4 });
    const composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(pr);
    composer.setSize(width, height);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), isNightMode ? 0.55 : 0.38, 0.68, 0.88);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    worldAtmosphereRef.current.bloom = bloom;

    /* ---------- Pointer Interactions Setup ---------- */
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

        // Kiểm tra click xe hoa
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

        // Kiểm tra click các trạm
        const allTargets = interactiveMeshes.map(im => im.mesh);
        const hits = raycaster.intersectObjects(allTargets, true);
        if (hits.length > 0) {
          const hit = hits[0];
          const matched = interactiveMeshes.find(im => im.mesh === hit.object || (im.mesh.children && im.mesh.children.includes(hit.object)));
          if (matched && matched.onClick) {
            matched.onClick(hit);
          }
        }
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    /* ---------- Main Animation Loop ---------- */
    let animId;
    let prevT = performance.now();
    const startT = prevT;
    let vanU = 0.52; // Vị trí xe hoa
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

    // Khởi tạo camera ban đầu: Đứng trực diện ngắm Trạm 0 (Hộp quà mở đầu của kịch bản)
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

      /* --- 1. Chạy xe hoa & xoay bánh nan hoa --- */
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

      /* --- Đom đóm bay lượn 3 chiều & nhấp nháy phát quang lung linh --- */
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

      /* --- 2. Thư có cánh & trái tim bay quanh xe --- */
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

      /* --- 3. Animation Hộp Quà bung nắp & bướm bóng bay vọt --- */
      const giftAnim = giftAnimationRef.current;
      if (giftAnim.opened && giftAnim.openProgress < 1.0) {
        giftAnim.openProgress = Math.min(1.0, giftAnim.openProgress + dt * 1.8);
        const prog = giftAnim.openProgress;
        const easeProg = 1 - Math.pow(1 - prog, 3);

        // Nắp hộp quà nhấc cao và lộn góc
        if (giftAnim.lidMesh) {
          giftAnim.lidMesh.position.y = 2.25 + easeProg * 2.8;
          giftAnim.lidMesh.rotation.x = -easeProg * 1.1;
          giftAnim.lidMesh.rotation.z = easeProg * 0.35;
        }

        // Bướm bay vút lên bầu trời
        giftAnim.butterflies.forEach((b) => {
          b.group.visible = true;
          b.group.position.lerpVectors(b.initialPos, b.targetOffset, easeProg);
          const flap = Math.sin(elapsed * 18 + b.speed) * 0.7;
          b.wingLeft.rotation.y = flap;
          b.wingRight.rotation.y = -flap;
        });

        // Bóng bay mini bay túa lên
        giftAnim.balloons.forEach((bm) => {
          bm.mesh.visible = true;
          bm.mesh.position.lerpVectors(bm.initialPos, bm.targetOffset, easeProg);
        });
      }

      /* --- 4. Bụi sao lấp lánh (Sparkle trail) đuôi xe --- */
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

      /* --- 5. Ánh sáng và mặt trời theo xe --- */
      sun.position.copy(vanPos).addScaledVector(sunDir, 70);
      sun.target.position.copy(vanPos);

      /* --- 6. Điều hướng Camera (Transitions / Bám xe) --- */
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
        camera.position.copy(vanPos).add(camTmpA);
        controls.target.copy(vanPos).add(camTmpB);
      }
      lastVan.copy(vanPos);
      lastYaw = yaw;

      controls.autoRotate = autoRotateRef.current;
      controls.autoRotateSpeed = 1.2;
      controls.update();
      sky.position.copy(camera.position);

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
      composer.dispose && composer.dispose();
      rt.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="page-garden-3d" id="world-3d-sanctuary">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="garden-3d-viewport" />

      {/* ==========================================================
          CENTERED HUD CONSOLE & CINEMA MODE CONTROLS
          ========================================================== */}
      <div className="garden-game-hud">
        {/* KHI ẨN HUD: HIỂN THỊ THANH NỔI GỌN GÀNG ĐỂ MỞ LẠI */}
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

        {/* BẢNG CONSOLE ĐIỀU KHIỂN CHÍNH (ẨN ĐI KHI BẬT CHẾ ĐỘ ĐIỆN ẢNH) */}
        {!isHudHidden && (
          <div className="hud-top-console-wrapper">
            <div className="hud-top-console">
              {/* Header: Vinh danh người nhận */}
              <div className="hud-console-header">
                <span className="hud-console-badge">🌸 20.10 WORLD 3D</span>
                <span className="hud-console-title">
                  Vương Quốc Hoa Tri Ân • Dành Riêng Cho <strong>{sisterName}</strong> ✨
                </span>
              </div>

              {/* Waypoints Station Navigator & World Controls */}
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

                {/* Tự động quay góc nhìn 360 */}
                <button
                  className={`btn-cam-preset ${autoRotate ? 'autorotate-active' : ''}`}
                  onClick={() => setAutoRotate(!autoRotate)}
                  title="Tự động quay góc nhìn 360°"
                >
                  🎥 {autoRotate ? 'Dừng 360°' : 'Quay 360°'}
                </button>

                {/* Nút Góc Nhìn Toàn Cảnh Thế Giới (HUD chung của toàn thế giới) */}
                <button
                  className={`btn-cam-preset ${activeStationIndex === 'scenic' ? 'active' : ''}`}
                  onClick={flyToWorldScenic}
                  title="Góc nhìn bao quát toàn bộ Vương Quốc Hoa 3D từ trên cao"
                >
                  <span>🌄 Toàn Cảnh</span>
                </button>

                {/* Nút Chuyển Bầu Trời: Dạ Tiệc Đêm / Hoàng Hôn */}
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

                {/* Nút Ẩn Thanh Điều Khiển để ngắm nhìn toàn cảnh điện ảnh */}
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

                {/* Nút chuyển về 2D Editorial */}
                <button
                  className="btn-cam-preset btn-cam-switch-2d"
                  onClick={() => updateExperienceMode('2d')}
                  title="Chuyển sang bản Tạp chí 2D Cổ Tích"
                >
                  🌸 Bản 2D Cổ Tích
                </button>
              </div>

              {/* THANH HUD ĐIỀU KHIỂN CAMERA XE HOA (CHỈ HIỆN 4 GÓC NHÌN BÁM THEO XE KHI Ở CHẶNG XE HOA) */}
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

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div style={{ textAlign: 'center' }}>
            <span className="hud-interaction-hint" style={{ background: 'rgba(140, 47, 75, 0.92)', color: '#FFF' }}>
              {toastMessage}
            </span>
          </div>
        )}

        {/* Guide Prompt at Bottom Center (Chỉ hiển thị khi không ẩn HUD) */}
        {!isHudHidden && (
          <div className="hud-interaction-guide-group">
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

            {/* Gợi ý tinh tế trên thiết bị di động */}
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

        {/* Bottom Action Bar */}
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
            className="btn-rose"
            style={{ fontSize: '0.98rem', padding: '12px 26px' }}
          >
            <span>
              {typeof activeStationIndex === 'number' && STATIONS[(activeStationIndex + 1) % STATIONS.length]
                ? `Trạm Tiếp Theo: ${STATIONS[(activeStationIndex + 1) % STATIONS.length].name} ➔`
                : 'Khám Phá Các Trạm: Hộp Quà ➔'}
            </span>
          </button>
        </div>
      </div>

      {/* ==========================================================
          MODAL 1: HÒM THƯ BƯU KIỆN (PARCEL CHEST)
          ========================================================== */}
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

      {/* ==========================================================
          MODAL 2: ĐỌC THƯ DẤU SÁP HOÀNG GIA (ROYAL PARCHMENT)
          ========================================================== */}
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

      {/* ==========================================================
          MODAL 3: PHÒNG CHIẾU PHIM TRI ÂN (VIDEO MODAL)
          ========================================================== */}
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

      {/* ==========================================================
          MODAL 4: LÂU ĐÀI TIỆC MỪNG & XUẤT THIỆP 2X RETINA
          ========================================================== */}
      {activePartyCardModal && (
        <div className="modal-overlay open" onClick={() => setActivePartyCardModal(false)}>
          <div className="party-honor-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '100%', padding: '36px 32px' }}>
            {/* THẺ THIỆP HOÀNG GIA CHUẨN XUẤT RETINA 2X */}
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

            {/* CỤM NÚT ĐIỀU KHIỂN DƯỚI MODAL */}
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
