import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { windify, noise2 } from './worldMath.js';

const mergeGeos = BufferGeometryUtils.mergeGeometries;

export function paint(geo, color, shade = 1) {
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

export function petal({ sx, sy, sz, tilt, yaw, r, y, color, shade }) {
  const g = new THREE.SphereGeometry(1, 6, 4);
  g.scale(sx, sy, sz);
  g.translate(0, sy * 0.9, 0);
  g.rotateX(tilt);
  g.translate(0, 0, r);
  g.rotateY(yaw);
  g.translate(0, y, 0);
  return paint(g, color, shade);
}

export function makeRoseHead() {
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

export function makeTulipHead() {
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

export function makeDaisyHead() {
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

export function makeLavenderHead() {
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

export function makeStem(h, leaves = true) {
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

export function makeBlade() {
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

/**
 * Dựng toàn bộ thảm hoa 23.000 đóa và cánh đồng cỏ nhẹ
 */
export function buildVegetationField({ scene, scatter, scatterLandscape, timeU, rand, Q, onProgress }) {
  const bladeGeo = makeBlade();
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  const grassMat = windify(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }), timeU, 0.3);

  // 1. Dựng thảm cỏ nền chia làm 2 lát cắt (Slice 1: Cỏ gần đường; Slice 2: Cỏ thảo nguyên)
  const totalGrass = Math.floor(16500 * Q);
  const grassBatch1 = Math.floor(totalGrass * 0.45);
  const grassBatch2 = totalGrass - grassBatch1;

  function buildGrassSlice(count, latMin, latMax, pw, nextStep) {
    const pts = scatter(count, latMin, latMax, pw);
    const grass = new THREE.InstancedMesh(bladeGeo, grassMat, pts.length);
    grass.castShadow = false;
    grass.receiveShadow = false;
    pts.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set((rand() - 0.5) * 0.25, rand() * Math.PI * 2, 0);
      const h = 0.72 + rand() * 0.95;
      dummy.scale.set(0.95 + rand() * 0.55, h, 1);
      dummy.updateMatrix();
      grass.setMatrixAt(i, dummy.matrix);
      tint.setRGB(0.75 + rand() * 0.4, 0.85 + rand() * 0.3, 0.65 + rand() * 0.25);
      grass.setColorAt(i, tint);
    });
    grass.frustumCulled = false;
    scene.add(grass);
    if (nextStep) requestAnimationFrame(nextStep);
  }

  // 2. 4 Loài hoa chính phủ khắp thế giới (cache geometry gốc để không lặp lại mergeGeometries đắt đỏ)
  const species = [
    {
      name: 'Hoa Hồng',
      count: 3600,
      stemH: 0.72,
      getHead: () => makeRoseHead(),
      leaves: true,
      tint: true,
      pal: [0xe11d48, 0xfb7185, 0xfda4af, 0xfff1f2, 0xbe123c, 0xf9a8d4, 0xff2442],
      sc: [1.45, 2.35]
    },
    {
      name: 'Hoa Tulip',
      count: 3600,
      stemH: 0.64,
      getHead: () => makeTulipHead(),
      leaves: true,
      tint: true,
      pal: [0xf43f5e, 0xfbbf24, 0xfde68a, 0xf97316, 0xfb7185, 0xe879f9, 0xfacc15],
      sc: [1.55, 2.45]
    },
    { 
      name: 'Cúc Họa Mi',
      count: 4200, 
      stemH: 0.52, 
      getHead: () => makeDaisyHead(), 
      leaves: false, 
      tint: false, 
      pal: null, 
      sc: [1.35, 2.2] 
    },
    {
      name: 'Hoa Oải Hương',
      count: 3600,
      stemH: 0.98,
      getHead: () => makeLavenderHead(),
      leaves: true,
      tint: true,
      pal: [0xffffff, 0xf5d0fe, 0xc7d2fe, 0xddd6fe, 0x8b5cf6, 0xa855f7],
      sc: [1.45, 2.4]
    }
  ];

  let spIndex = 0;
  function stepSpecies() {
    if (spIndex >= species.length) {
      if (typeof onProgress === 'function') {
        try { onProgress('Hoàn tất thảm hoa 3D!'); } catch (e) {}
      }
      return;
    }
    const sp = species[spIndex];
    const si = spIndex;
    spIndex++;

    if (typeof onProgress === 'function') {
      try { onProgress(`Đang trải ${sp.name}...`); } catch (e) {}
    }

    const nTotal = Math.floor(sp.count * Q);
    const nNear = Math.floor(nTotal * 0.58);
    const nFar = nTotal - nNear;
    const ptsNear = scatter(nNear, 1.6, 22, 1.25);
    const ptsFar = scatterLandscape(nFar, 2.4, 115);
    const pts = ptsNear.concat(ptsFar);

    const stemGeo = makeStem(sp.stemH, sp.leaves);
    const headGeo = sp.getHead();
    headGeo.translate(0, sp.stemH, 0);

    // MeshLambertMaterial nhẹ hơn gấp 5 lần MeshStandardMaterial, màu sắc rực rỡ và chạy mượt 60fps trên mọi GPU
    const stemMat = windify(new THREE.MeshLambertMaterial({ vertexColors: true }), timeU, 0.2);
    const headMat = windify(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), timeU, 0.2);
    const stems = new THREE.InstancedMesh(stemGeo, stemMat, pts.length);
    const heads = new THREE.InstancedMesh(headGeo, headMat, pts.length);
    stems.castShadow = false;
    stems.receiveShadow = false;
    heads.castShadow = false;
    heads.receiveShadow = false;

    pts.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set((rand() - 0.5) * 0.35, rand() * Math.PI * 2, (rand() - 0.5) * 0.35);
      const distScale = p.d > 22 ? 1.35 : 1.0;
      const s = (sp.sc[0] + rand() * (sp.sc[1] - sp.sc[0])) * distScale;
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

    if (spIndex < species.length) {
      requestAnimationFrame(stepSpecies);
    } else if (typeof onProgress === 'function') {
      try { onProgress('Hoàn tất thảm hoa 3D!'); } catch (e) {}
    }
  }

  // Khởi động chuỗi micro-tasks: Cỏ đợt 1 -> Cỏ đợt 2 -> 4 loài hoa
  buildGrassSlice(grassBatch1, 2.0, 18, 1.3, () => {
    buildGrassSlice(grassBatch2, 16.0, 36, 1.4, () => {
      requestAnimationFrame(stepSpecies);
    });
  });
}
