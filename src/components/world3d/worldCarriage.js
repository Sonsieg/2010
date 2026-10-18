import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { glowTexture } from './worldTextures.js';
import { makeRoseHead, makeDaisyHead } from './worldVegetation.js';

const TAU = Math.PI * 2;
const merge = BufferGeometryUtils.mergeGeometries;

/* ================================================================== */
/*  LOFT HELPER (Thân và chi tiết hữu cơ liền mạch)                   */
/* ================================================================== */
const S = (y, z, rx, ry, x = 0) => ({ p: [x, y, z], rx, ry });

function loft(st, radial = 20, ref = new THREE.Vector3(0, 1, 0)) {
  const n = st.length;
  const pts = st.map((s) => new THREE.Vector3(s.p[0], s.p[1], s.p[2]));
  const pos = [];
  const idx = [];
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();

  for (let i = 0; i < n; i++) {
    T.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize();
    N.crossVectors(T, ref).normalize();
    B.crossVectors(T, N).normalize();
    for (let k = 0; k <= radial; k++) {
      const th = (k / radial) * TAU;
      const cx = Math.cos(th) * st[i].rx;
      const sy = Math.sin(th) * st[i].ry;
      pos.push(pts[i].x + N.x * cx + B.x * sy, pts[i].y + N.y * cx + B.y * sy, pts[i].z + N.z * cx + B.z * sy);
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * (radial + 1) + k;
      const b = a + 1;
      const c = a + radial + 1;
      const d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g = BufferGeometryUtils.mergeVertices(g, 1e-4);
  g.computeVertexNormals();
  return g;
}

/* ================================================================== */
/*  GEOMETRY HELPERS (Lông vũ, Trái tim, Hoa trang trí)              */
/* ================================================================== */
const featherShape = new THREE.Shape();
featherShape.moveTo(0, 0);
featherShape.bezierCurveTo(0.12, 0.075, 0.34, 0.07, 1, 0);
featherShape.bezierCurveTo(0.34, -0.05, 0.12, -0.045, 0, 0);
const featherGeo = new THREE.ShapeGeometry(featherShape, 8);

function makePlume(len = 0.55) {
  const g = new THREE.Group();
  const cols = [0xffffff, 0xffe4ee, 0xffffff, 0xffd0e0, 0xfff3f8];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(
      featherGeo,
      new THREE.MeshStandardMaterial({
        color: cols[i],
        roughness: 0.6,
        emissive: 0xffc8dc,
        emissiveIntensity: 0.14,
        side: THREE.DoubleSide
      })
    );
    m.scale.set(len * (1 - Math.abs(i - 2) * 0.06), 1.8, 1);
    m.rotation.set((i - 2) * 0.1, (i - 2) * 0.55, Math.PI / 2 + (i - 2) * 0.17);
    g.add(m);
  }
  return g;
}

function makeHeartGeo(depth = 0.06, bevel = 0.025) {
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * TAU;
    pts.push(
      new THREE.Vector2(
        (16 * Math.pow(Math.sin(t), 3)) / 32,
        (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 32
      )
    );
  }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 16
  });
  g.center();
  return g;
}

function medallionTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#7a1f3d';
  g.beginPath();
  g.arc(128, 128, 124, 0, TAU);
  g.fill();
  g.strokeStyle = '#e8c27a';
  g.lineWidth = 8;
  g.beginPath();
  g.arc(128, 128, 116, 0, TAU);
  g.stroke();
  g.lineWidth = 2;
  g.beginPath();
  g.arc(128, 128, 100, 0, TAU);
  g.stroke();
  g.fillStyle = '#f4d58d';
  g.beginPath();
  g.moveTo(128, 100);
  g.bezierCurveTo(128, 84, 100, 74, 92, 96);
  g.bezierCurveTo(84, 118, 110, 138, 128, 156);
  g.bezierCurveTo(146, 138, 172, 118, 164, 96);
  g.bezierCurveTo(156, 74, 128, 84, 128, 100);
  g.fill();
  g.font = 'italic 600 40px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('20·10', 128, 194);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ================================================================== */
/*  BẠCH MÃ HOÀNG GIA (Giải phẫu mượt mà)                             */
/* ================================================================== */
let cachedHorseGeos = null;

function getHorseGeos() {
  if (cachedHorseGeos) return cachedHorseGeos;
  const Z = new THREE.Vector3(0, 0, 1);
  const torso = loft(
    [
      S(1.3, -1.0, 0.03, 0.05),
      S(1.3, -0.94, 0.17, 0.24),
      S(1.32, -0.78, 0.3, 0.36),
      S(1.32, -0.45, 0.31, 0.37),
      S(1.28, -0.1, 0.31, 0.385),
      S(1.28, 0.25, 0.31, 0.39),
      S(1.31, 0.55, 0.31, 0.4),
      S(1.27, 0.82, 0.24, 0.36),
      S(1.24, 0.97, 0.12, 0.24),
      S(1.22, 1.01, 0.02, 0.05)
    ],
    24
  );
  const neckSt = [
    S(1.55, 0.62, 0.15, 0.25),
    S(1.76, 0.8, 0.13, 0.21),
    S(2.0, 0.98, 0.115, 0.17),
    S(2.2, 1.12, 0.1, 0.14),
    S(2.3, 1.19, 0.09, 0.12)
  ];
  const neck = loft(neckSt, 20);
  const hd = new THREE.Vector3(0, -0.6, 0.8).normalize();
  const headSt = [
    [0, 0.09, 0.12],
    [0.1, 0.1, 0.15],
    [0.22, 0.105, 0.165],
    [0.34, 0.072, 0.115],
    [0.46, 0.07, 0.095],
    [0.56, 0.076, 0.09],
    [0.62, 0.062, 0.072],
    [0.645, 0.012, 0.012]
  ].map(([s, rx, ry]) => ({ p: [hd.x * s, hd.y * s, hd.z * s], rx, ry }));
  const head = loft(headSt, 18);
  const fu = loft(
    [
      S(0.02, 0, 0.03, 0.03),
      S(0, 0, 0.13, 0.16),
      S(-0.15, 0, 0.11, 0.13),
      S(-0.4, 0, 0.075, 0.085),
      S(-0.62, 0, 0.06, 0.065),
      S(-0.64, 0, 0.03, 0.03)
    ],
    16,
    Z
  );
  const hu = loft(
    [
      S(0.02, 0, 0.03, 0.03),
      S(0, 0, 0.17, 0.22),
      S(-0.2, -0.05, 0.15, 0.19),
      S(-0.45, -0.1, 0.09, 0.12),
      S(-0.62, -0.12, 0.065, 0.08),
      S(-0.64, -0.12, 0.03, 0.03)
    ],
    16,
    Z
  );
  const low = loft(
    [
      S(0, 0, 0.045, 0.05),
      S(-0.04, 0, 0.06, 0.065),
      S(-0.3, 0, 0.042, 0.048),
      S(-0.42, 0, 0.05, 0.058),
      S(-0.47, 0, 0.06, 0.066),
      S(-0.55, 0.035, 0.045, 0.05),
      S(-0.57, 0.04, 0.066, 0.076),
      S(-0.66, 0.075, 0.082, 0.096),
      S(-0.665, 0.075, 0.02, 0.02)
    ],
    14,
    Z
  );

  cachedHorseGeos = { torso, neck, neckSt, head, hd, fu, hu, low };
  return cachedHorseGeos;
}

function makeSingleHorse({ mats, sph }) {
  const G = getHorseGeos();
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const add = (geo, mat = mats.horseMat, parent = body) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const ell = (sx, sy, sz, x, y, z, mat = mats.horseMat, parent = body) => {
    const m = add(sph, mat, parent);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    return m;
  };

  add(G.torso);
  add(G.neck);
  [-1, 1].forEach((s) => {
    ell(0.1, 0.21, 0.24, s * 0.27, 1.3, 0.5);
    ell(0.12, 0.24, 0.27, s * 0.27, 1.3, -0.7);
  });
  const neckCurve = new THREE.CatmullRomCurve3(G.neckSt.map((s) => new THREE.Vector3(...s.p)));

  // Đầu ngựa
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 2.3, 1.19);
  body.add(headPivot);
  add(G.head, mats.horseMat, headPivot);
  const hd = G.hd;
  const hp = (s, x = 0, y = 0, z = 0) => [x + hd.x * s, y + hd.y * s, z + hd.z * s];
  const tilt = Math.atan2(0.6, 0.8);
  const jaw = ell(0.07, 0.08, 0.17, ...hp(0.32, 0, -0.065, -0.02), mats.horseMat, headPivot);
  jaw.rotation.x = tilt;

  [-1, 1].forEach((s) => {
    const ear = add(new THREE.ConeGeometry(0.042, 0.18, 8), mats.horseMat, headPivot);
    ear.scale.z = 0.6;
    ear.position.set(s * 0.078, 0.11, -0.01);
    ear.rotation.set(0.28, 0, -s * 0.14);
    ell(0.028, 0.028, 0.02, ...hp(0.2, s * 0.1, 0.035, 0), mats.dark, headPivot);
    ell(0.009, 0.009, 0.006, ...hp(0.2, s * 0.105, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }), headPivot);
    ell(0.017, 0.011, 0.02, ...hp(0.6, s * 0.043, 0.02, 0), mats.dark, headPivot);
  });

  const fore = ell(0.04, 0.11, 0.035, ...hp(0.08, 0, 0.1, 0.03), mats.maneMat, headPivot);
  fore.rotation.x = tilt;

  const qd = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), hd);
  [[0.5, 0.085, 1], [0.1, 0.112, 1.3], [0.22, 0.118, 1.55]].forEach(([s, r, sy]) => {
    const t = add(new THREE.TorusGeometry(r, 0.009, 6, 24), mats.goldMat, headPivot);
    t.quaternion.copy(qd);
    t.position.set(...hp(s));
    t.scale.y = sy;
  });

  const plumes = [];
  const pl = makePlume(0.42);
  pl.position.set(0, 0.15, 0);
  headPivot.add(pl);
  plumes.push(pl);

  // Vòng hoa xinh xắn đội trên đầu ngựa (giữa hai tai)
  const headWreath = new THREE.Group();
  headWreath.position.set(0, 0.13, 0.04);
  headWreath.rotation.x = 0.32;
  headPivot.add(headWreath);
  headWreath.add(new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.009, 6, 20), mats.goldMat));
  const wreathColors = [0xff2442, 0xfb7185, 0xfde68a, 0xffffff, 0xf43f5e, 0xfbcfe8];
  for (let wi = 0; wi < 6; wi++) {
    const wa = (wi / 6) * TAU;
    const miniFlower = new THREE.Mesh(sph, new THREE.MeshStandardMaterial({ color: wreathColors[wi], roughness: 0.5 }));
    miniFlower.scale.set(0.028, 0.028, 0.022);
    miniFlower.position.set(Math.cos(wa) * 0.09, Math.sin(wa) * 0.09, 0.01);
    headWreath.add(miniFlower);
  }

  // Bờm ngựa
  const mane = [];
  for (let i = 0; i < 20; i++) {
    const t = 0.03 + (i / 19) * 0.95;
    const p = neckCurve.getPointAt(t);
    const g = new THREE.Group();
    g.position.set((i % 2 ? 1 : -1) * 0.015, p.y + 0.13 - t * 0.02, p.z - 0.09 - t * 0.03);
    body.add(g);
    const len = 0.24 + 0.1 * (1 - t);
    ell(0.032 + (1 - t) * 0.012, len * 0.5, 0.05, 0, -len * 0.5, 0, mats.maneMat, g);
    mane.push({ g, i });
  }

  // Đuôi lụa 5 dải mềm mại
  const tails = [];
  [-0.08, -0.04, 0, 0.04, 0.08].forEach((xo, ci) => {
    const base = new THREE.Group();
    base.position.set(xo * 1.2, 1.32, -0.98);
    body.add(base);
    let parent = base;
    const segs = [];
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      if (i > 0) g.position.y = -0.17;
      parent.add(g);
      const w = (0.055 - i * 0.0045) * (ci === 2 ? 1.15 : 1);
      ell(w, 0.11, w * 0.85, 0, -0.085, 0, mats.maneMat, g);
      segs.push(g);
      parent = g;
    }
    tails.push({ base, segs, ci });
  });

  // Chân ngựa (4 chân)
  const legs = [];
  const addLeg = (x, z, front, off) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.285, z);
    body.add(pivot);
    add(front ? G.fu : G.hu, mats.horseMat, pivot);
    const lower = new THREE.Group();
    lower.position.set(0, -0.62, front ? 0 : -0.12);
    pivot.add(lower);
    add(G.low, mats.horseMat, lower);
    ell(0.065, 0.07, 0.075, 0, 0, 0, mats.horseMat, lower);
    if (!front) ell(0.055, 0.08, 0.085, 0, 0.04, -0.045, mats.horseMat, lower);
    const ank = add(new THREE.TorusGeometry(0.06, 0.011, 6, 16).rotateX(Math.PI / 2), mats.goldMat, lower);
    ank.position.set(0, -0.5, 0.015);
    legs.push({ pivot, lower, off, front });
  };
  addLeg(-0.2, 0.5, true, 0);
  addLeg(0.2, 0.5, true, Math.PI);
  addLeg(-0.22, -0.7, false, Math.PI);
  addLeg(0.22, -0.7, false, 0);

  // Yên đỏ viền vàng hoàng gia
  const trim = add(new RoundedBoxGeometry(0.74, 0.03, 0.64, 2, 0.012), mats.goldMat);
  trim.position.set(0, 1.685, 0.12);
  const pad = add(new RoundedBoxGeometry(0.68, 0.05, 0.58, 2, 0.02), mats.crimson);
  pad.position.set(0, 1.71, 0.12);

  // Vòng hoa đeo cổ ngựa
  const cpnt = neckCurve.getPointAt(0.05);
  const ctan = neckCurve.getTangentAt(0.05);
  const collar = new THREE.Group();
  collar.position.copy(cpnt);
  collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ctan);
  body.add(collar);
  collar.add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 30), mats.goldMat));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    const r = new THREE.Mesh(sph, mats.roseMats[i % mats.roseMats.length]);
    r.scale.setScalar(0.052);
    r.position.set(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0);
    collar.add(r);
  }

  return { root, body, headPivot, legs, mane, tails, plumes };
}

/* ================================================================== */
/*  CỖ XE CỔ TÍCH LỌ LEM (Royal Cinderella Carriage)                  */
/* ================================================================== */
function makeWheel(r, spokes, mats, sph) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.96, 0.055, 10, 48).rotateY(Math.PI / 2), mats.pearl));
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.022, 8, 48).rotateY(Math.PI / 2), mats.goldMat));
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.8, 0.016, 8, 40).rotateY(Math.PI / 2), mats.goldMat));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 16).rotateZ(Math.PI / 2), mats.goldMat));

  [-1, 1].forEach((s) => {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), mats.goldMat);
    cap.position.x = s * 0.15;
    g.add(cap);
  });

  for (let k = 0; k < spokes; k++) {
    const a = (k / spokes) * TAU;
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.026, r * 0.9, 8).translate(0, r * 0.47, 0), mats.pearl);
    s.rotation.x = a;
    g.add(s);
    const gd = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), mats.goldMat);
    gd.position.set(0, Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
    g.add(gd);
  }

  const beadG = new THREE.SphereGeometry(0.022, 6, 5);
  const nb = 28;
  for (let k = 0; k < nb; k++) {
    const a = (k / nb) * TAU;
    [-1, 1].forEach((s) => {
      const b = new THREE.Mesh(beadG, mats.goldMat);
      b.position.set(s * 0.05, Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0);
      g.add(b);
    });
  }
  return g;
}

function spiral(cz, cy, r, dir, x, goldMat, turns = 2.1) {
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const th = (i / 40) * turns * TAU;
    const rr = r * (1 - th / (turns * TAU + 1.2));
    pts.push(new THREE.Vector3(x, cy + Math.sin(th * dir) * rr, cz + Math.cos(th * dir) * rr));
  }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 50, 0.015, 6, false), goldMat);
}

function makeCarriageBody({ mats, sph, gTex }) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const sh = new THREE.Shape();
  sh.moveTo(-1.25, 0.78);
  sh.quadraticCurveTo(-1.55, 1.0, -1.5, 1.55);
  sh.quadraticCurveTo(-1.47, 2.1, -1.05, 2.12);
  sh.quadraticCurveTo(-0.72, 2.12, -0.7, 1.7);
  sh.quadraticCurveTo(-0.5, 1.2, -0.15, 1.18);
  sh.lineTo(0.55, 1.18);
  sh.quadraticCurveTo(0.85, 1.2, 0.98, 1.6);
  sh.quadraticCurveTo(1.1, 2.05, 1.35, 2.0);
  sh.quadraticCurveTo(1.58, 1.9, 1.48, 1.5);
  sh.quadraticCurveTo(1.4, 1.1, 1.2, 0.9);
  sh.quadraticCurveTo(0.9, 0.62, 0.4, 0.6);
  sh.lineTo(-0.7, 0.6);
  sh.quadraticCurveTo(-1.1, 0.62, -1.25, 0.78);

  const D = 1.2;
  const BT = 0.1;
  const bg = new THREE.ExtrudeGeometry(sh, {
    depth: D,
    bevelEnabled: true,
    bevelThickness: BT,
    bevelSize: 0.09,
    bevelSegments: 5,
    curveSegments: 16
  });
  bg.rotateY(-Math.PI / 2);
  bg.translate(D / 2, 0, 0);
  body.add(new THREE.Mesh(bg, mats.pearl));

  const XS = D / 2 + BT + 0.004;
  const outline = sh.getSpacedPoints(120);
  const medTex = medallionTexture();

  [-1, 1].forEach((s) => {
    body.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outline.map((p) => new THREE.Vector3(s * XS, p.y, p.x)), true), 220, 0.018, 6, true),
        mats.goldMat
      )
    );
    body.add(spiral(-1.08, 1.82, 0.24, s, s * XS, mats.goldMat));
    body.add(spiral(1.3, 1.75, 0.22, -s, s * XS, mats.goldMat));
    const med = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), new THREE.MeshStandardMaterial({ map: medTex, roughness: 0.5 }));
    med.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
    med.position.set(s * (XS + 0.006), 0.98, 0.1);
    body.add(med);
  });

  // Cột xoắn dát vàng & mui vòm
  const DC = { x: 0, y: 2.35, z: 0.05 };
  const DR = { x: 0.8, y: 0.78, z: 1.0 };
  const cols = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
  ].map(([a, b]) => ({ x: a * DR.x * 0.707, z: DC.z + b * DR.z * 0.707 }));

  cols.forEach((c) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 1.2, 8).translate(0, 1.2 + 0.6, 0), mats.pearl);
    pole.position.set(c.x, 0, c.z);
    body.add(pole);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), mats.goldMat);
    top.position.set(c.x, DC.y, c.z);
    body.add(top);
  });

  // Mui vòm ngọc trai xuyên sáng
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 12, 0, TAU, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0xfff0f5,
      roughness: 0.4,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  dome.scale.set(DR.x, DR.y, DR.z);
  dome.position.set(DC.x, DC.y, DC.z);
  body.add(dome);

  // Đống hoa ngát hương tràn đầy bên trong xe (dưới vòm kính ngọc trai)
  const flowerGroup = new THREE.Group();
  body.add(flowerGroup);
  const roseHeadGeo = makeRoseHead();
  const daisyHeadGeo = makeDaisyHead();
  const pal = [0xe11d48, 0xfb7185, 0xfda4af, 0xfff1f2, 0xf43f5e, 0xfcd34d, 0xf9a8d4].map((c) => new THREE.Color(c));
  const vcMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide });

  const dummyFlower = new THREE.Object3D();
  const tintFlower = new THREE.Color();

  // 120 bông hoa hồng & cúc đặt bên trong sàn xe
  const N_ROSES = 120;
  const rosesMesh = new THREE.InstancedMesh(roseHeadGeo, vcMat, N_ROSES);
  for (let i = 0; i < N_ROSES; i++) {
    const rx = (Math.random() * 2 - 1) * 0.48;
    const rz = -0.45 + Math.random() * 1.1;
    const ry = 1.18 + Math.random() * 0.22;
    dummyFlower.position.set(rx, ry, rz);
    dummyFlower.rotation.set((Math.random() - 0.5) * 0.6, Math.random() * TAU, (Math.random() - 0.5) * 0.6);
    dummyFlower.scale.setScalar(0.9 + Math.random() * 0.7);
    dummyFlower.updateMatrix();
    rosesMesh.setMatrixAt(i, dummyFlower.matrix);
    tintFlower.set(pal[Math.floor(Math.random() * pal.length)]);
    rosesMesh.setColorAt(i, tintFlower);
  }
  flowerGroup.add(rosesMesh);

  const N_DAISIES = 60;
  const daisiesMesh = new THREE.InstancedMesh(daisyHeadGeo, vcMat, N_DAISIES);
  for (let i = 0; i < N_DAISIES; i++) {
    const rx = (Math.random() * 2 - 1) * 0.44;
    const rz = -0.4 + Math.random() * 1.0;
    const ry = 1.25 + Math.random() * 0.2;
    dummyFlower.position.set(rx, ry, rz);
    dummyFlower.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * TAU, (Math.random() - 0.5) * 0.5);
    dummyFlower.scale.setScalar(0.8 + Math.random() * 0.5);
    dummyFlower.updateMatrix();
    daisiesMesh.setMatrixAt(i, dummyFlower.matrix);
  }
  flowerGroup.add(daisiesMesh);

  // Gọng vòm vàng
  const ribPts = (phi) => {
    const a = [];
    for (let i = 0; i <= 16; i++) {
      const th = (i / 16) * Math.PI * 2 * 0.25;
      a.push(new THREE.Vector3(DR.x * Math.cos(th) * Math.cos(phi), DC.y + DR.y * Math.sin(th), DC.z + DR.z * Math.cos(th) * Math.sin(phi)));
    }
    return new THREE.CatmullRomCurve3(a);
  };
  const ribs = [];
  for (let k = 0; k < 6; k++) {
    const c = ribPts((k / 6) * TAU + Math.PI / 6);
    ribs.push(c);
    body.add(new THREE.Mesh(new THREE.TubeGeometry(c, 24, 0.018, 5, false), mats.goldMat));
  }

  // Đỉnh vương miện + Trái tim phát sáng hoàng gia
  const apex = DC.y + DR.y;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.3, 8), mats.goldMat);
  spire.position.set(DC.x, apex + 0.2, DC.z);
  body.add(spire);

  const heart = new THREE.Mesh(
    makeHeartGeo(0.05, 0.02).scale(0.2, 0.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xff3d6b, emissive: 0xff2a5a, emissiveIntensity: 2.2, roughness: 0.25 })
  );
  heart.position.set(DC.x, apex + 0.46, DC.z);
  body.add(heart);

  const hs = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: gTex, color: 0xff8fb0, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  hs.scale.set(1.1, 1.1, 1);
  hs.position.copy(heart.position);
  body.add(hs);

  // Đèn lồng phía trước
  const lanternGlow = new THREE.MeshStandardMaterial({ color: 0xffe9bd, emissive: 0xffb45a, emissiveIntensity: 2.6, roughness: 0.3 });
  [-1, 1].forEach((s) => {
    const g = new THREE.Group();
    g.position.set(s * 0.76, 2.1, 1.28);
    body.add(g);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.55, 6).translate(0, -0.27, 0), mats.goldMat));
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.065, 0.24, 6), lanternGlow);
    glass.position.y = 0.12;
    g.add(glass);
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: gTex, color: 0xffc27a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.scale.set(1.4, 1.4, 1);
    halo.position.y = 0.12;
    g.add(halo);
  });

  // Hạt ngọc / Led lấp lánh dọc gọng vòm
  const orbs = [];
  const orbG = new THREE.SphereGeometry(0.026, 6, 5);
  ribs.forEach((c, k) => {
    for (let i = 1; i < 7; i++) {
      const p = c.getPointAt(i / 7.5);
      const m = new THREE.Mesh(
        orbG,
        new THREE.MeshStandardMaterial({
          color: 0xfff0c0,
          emissive: (i + k) % 2 ? 0xffb85a : 0xff8fb0,
          emissiveIntensity: 2.5
        })
      );
      m.position.copy(p);
      m.position.y += 0.035;
      body.add(m);
      orbs.push({ m, o: i + k * 5 });
    }
  });

  // 4 chùm lông vũ
  const plumes = [];
  cols.forEach((c, i) => {
    const p = makePlume(0.55);
    p.scale.setScalar(1.2);
    p.position.set(c.x * 1.05, DC.y + 0.08, c.z);
    p.rotation.y = i * 1.6;
    body.add(p);
    plumes.push(p);
  });

  // 4 Bánh xe hoàng gia
  const wheels = [];
  [
    [-1.0, -0.55, 0.8, 14],
    [1.0, -0.55, 0.8, 14],
    [-1.0, 0.98, 0.54, 10],
    [1.0, 0.98, 0.54, 10]
  ].forEach(([x, z, r, sp]) => {
    const w = makeWheel(r, sp, mats, sph);
    w.position.set(x, r, z);
    root.add(w);
    wheels.push({ w, r: r * 1.45 });
  });

  [
    [-0.55, 0.8],
    [0.98, 0.54]
  ].forEach(([z, r]) => {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.0, 8).rotateZ(Math.PI / 2), mats.goldMat);
    a.position.set(0, r, z);
    root.add(a);
  });

  return { root, body, wheels, orbs, plumes };
}

/* ================================================================== */
/*  MAIN EXPORT: BUILD ROYAL CARRIAGE ASSEMBLY                        */
/* ================================================================== */
export function buildRoyalCarriage({ scene, envTex }) {
  const gTex = glowTexture('rgba(255,236,190,1)', 'rgba(255,190,110,0.35)');
  const sph = new THREE.SphereGeometry(1, 20, 14);

  const mats = {
    pearl: new THREE.MeshStandardMaterial({
      color: 0xfffdf9,
      roughness: 0.35,
      metalness: 0.08,
      envMap: envTex,
      envMapIntensity: 0.9
    }),
    horseMat: new THREE.MeshStandardMaterial({
      color: 0xfcfaf6,
      roughness: 0.55,
      envMap: envTex,
      envMapIntensity: 0.65
    }),
    maneMat: new THREE.MeshStandardMaterial({
      color: 0xfff5fa,
      roughness: 0.6,
      emissive: 0x6a3a50,
      emissiveIntensity: 0.12
    }),
    goldMat: new THREE.MeshStandardMaterial({
      color: 0xe0b25e,
      metalness: 0.92,
      roughness: 0.25,
      envMap: envTex,
      envMapIntensity: 1.3
    }),
    dark: new THREE.MeshStandardMaterial({ color: 0x15101a, roughness: 0.2 }),
    crimson: new THREE.MeshStandardMaterial({ color: 0x9b1b3f, roughness: 0.8 }),
    roseMats: [0xe11d48, 0xfb7185, 0xfda4af, 0xfff1f2].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 }))
  };

  const rig = new THREE.Group();
  rig.userData.isVehicle = true;

  // 1. Cỗ xe
  const CS = 1.45;
  const carriage = makeCarriageBody({ mats, sph, gTex });
  carriage.root.scale.setScalar(CS);
  rig.add(carriage.root);

  // 2. 4 Chú Bạch Mã Hoàng Gia
  const HS = 1.1;
  const horses = [];
  const horseSpots = [
    [-0.85, 4.8],
    [0.85, 4.8],
    [-0.85, 8.2],
    [0.85, 8.2]
  ];
  horseSpots.forEach(([x, z]) => {
    const h = makeSingleHorse({ mats, sph });
    h.root.scale.setScalar(HS);
    h.root.position.set(x, 0, z);
    rig.add(h.root);
    horses.push(h);
  });

  // 3. Khung nối vàng (Dây cương & càng kéo dát vàng)
  const tube = (pts, r) => {
    const m = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 24, r, 6, false),
      mats.goldMat
    );
    rig.add(m);
  };
  tube(
    [
      [0, 1.15, 1.9],
      [0, 1.35, 3.8],
      [0, 1.55, 5.7]
    ],
    0.06
  );
  const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 8).rotateZ(Math.PI / 2), mats.goldMat);
  yoke.position.set(0, 1.78, 5.62);
  rig.add(yoke);
  const yoke2 = yoke.clone();
  yoke2.position.z = 8.9;
  rig.add(yoke2);

  [-1, 1].forEach((s) => {
    tube(
      [
        [s * 0.85, 1.7, 5.6],
        [s * 0.8, 1.4, 3.8],
        [s * 0.7, 1.2, 2.1]
      ],
      0.018
    );
    tube(
      [
        [s * 0.85, 1.7, 8.9],
        [s * 0.85, 1.55, 7.2],
        [s * 0.85, 1.7, 5.6]
      ],
      0.016
    );
  });

  // Đặt mặc định ẩn để chuyển đổi qua lại mượt mà
  rig.visible = false;
  scene.add(rig);

  // Biến nhịp phi
  let gait = 0;

  return {
    root: rig,
    update: (dt, elapsed, speed, yawRateS) => {
      if (!rig.visible) return;

      const spdFactor = Math.max(0.5, speed / 3.6);
      gait += dt * 8.5 * spdFactor;

      // Animate 4 chú ngựa
      horses.forEach((h, hi) => {
        const ph0 = gait + (hi >> 1) * 0.5 + (hi & 1) * 0.12;
        h.body.position.y = Math.abs(Math.sin(ph0)) * 0.05 * spdFactor;
        h.body.rotation.x = Math.sin(ph0 * 2) * 0.012;
        h.headPivot.rotation.x = 0.6 + Math.sin(ph0 * 2 + 0.6) * 0.05;

        // Chân gập nhịp nhàng
        h.legs.forEach((l) => {
          const ph = ph0 + l.off;
          l.pivot.rotation.x = Math.sin(ph) * (l.front ? 0.6 : 0.5);
          l.lower.rotation.x = Math.max(0, -Math.cos(ph)) * 1.15 + (l.front ? 0 : 0.12);
        });

        // Bờm và lông vũ bay trong gió
        h.mane.forEach(({ g, i }) => {
          g.rotation.x = 0.5 + Math.sin(elapsed * 5 - i * 0.5) * 0.15;
          g.rotation.z = Math.sin(elapsed * 3 - i * 0.4) * 0.06;
        });

        h.plumes.forEach((pl, k) => {
          pl.rotation.x = -0.35 - Math.sin(elapsed * 5 - k) * 0.12;
          pl.rotation.z = Math.sin(elapsed * 3.3 + k) * 0.1;
        });

        // Đuôi lụa uốn lượn
        h.tails.forEach(({ base, segs, ci }) => {
          base.rotation.x = 0.45 + Math.sin(elapsed * 3 + ci) * 0.06;
          base.rotation.z = (ci - 2) * 0.1;
          segs.forEach((s, i) => {
            s.rotation.x = 0.12 + Math.sin(elapsed * 4.2 - i * 0.7 + ci) * 0.17;
            s.rotation.z = Math.sin(elapsed * 2.6 - i * 0.6 + ci * 1.3) * 0.08;
          });
        });
      });

      // Animate cỗ xe
      carriage.wheels.forEach(({ w, r }) => {
        w.rotation.x += (speed * dt) / r;
      });

      carriage.body.position.y = Math.sin(elapsed * 8) * 0.012 + Math.sin(elapsed * 3.1) * 0.01;
      carriage.body.rotation.z = yawRateS * 0.35 + Math.sin(elapsed * 2.2) * 0.005;
      carriage.body.rotation.x = Math.sin(elapsed * 2.6) * 0.006;

      carriage.plumes.forEach((pl, k) => {
        pl.rotation.x = -0.3 + Math.sin(elapsed * 3 + k) * 0.1;
        pl.rotation.z = Math.sin(elapsed * 2.4 + k * 1.3) * 0.12;
      });

      carriage.orbs.forEach(({ m: o, o: off }) => {
        o.scale.setScalar(0.85 + Math.sin(elapsed * 3.4 + off * 0.9) * 0.3);
      });
    }
  };
}
