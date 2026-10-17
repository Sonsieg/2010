import * as THREE from 'three';
import { rngFactory } from './worldMath.js';

export function fireflyTexture() {
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

export function glowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,0.35)') {
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

export function petalTexture() {
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

export function cloudTexture() {
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

export function signTexture(text) {
  const c = document.createElement('canvas');
  c.width = 800;
  c.height = 180;
  const g = c.getContext('2d');
  g.fillStyle = '#7a1f3d';
  g.beginPath();
  g.roundRect ? g.roundRect(8, 8, 784, 164, 32) : g.rect(8, 8, 784, 164);
  g.fill();
  g.strokeStyle = '#e8c27a';
  g.lineWidth = 6;
  g.stroke();
  g.strokeStyle = 'rgba(232,194,122,0.55)';
  g.lineWidth = 2;
  g.strokeRect(22, 22, 756, 136);

  // Đo độ dài text và tự động co dãn cỡ chữ để không bao giờ bị tràn lề
  let fontSize = 44;
  g.font = `italic 700 ${fontSize}px Georgia, "Times New Roman", serif`;
  while (g.measureText(text).width > 720 && fontSize > 20) {
    fontSize -= 2;
    g.font = `italic 700 ${fontSize}px Georgia, "Times New Roman", serif`;
  }

  g.fillStyle = '#f4d58d';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 400, 92);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
