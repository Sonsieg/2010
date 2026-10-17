import * as THREE from 'three';

export const Y_AXIS = new THREE.Vector3(0, 1, 0);

export const rngFactory = (seed) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const noise2 = (x, z) =>
  Math.sin(x * 0.21 + 1.3) * Math.cos(z * 0.19 - 0.7) +
  0.5 * Math.sin((x + z) * 0.11 + 2.0);

export const normAngle = (a) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

export function windify(mat, timeU, amp = 0.25) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeU;
    shader.uniforms.uAmp = { value: amp };
    shader.vertexShader =
      `uniform float uTime;\nuniform float uAmp;\n` +
      shader.vertexShader.replace(
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

export function taperedTube(curve, tubular, r0, r1, radial) {
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

export function makeHeartGeometry(depth = 0.2, bevel = 0.07) {
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
