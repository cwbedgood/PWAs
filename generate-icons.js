#!/usr/bin/env node
// Run once to generate PNG icons from SVG
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.12;

  // Background
  ctx.fillStyle = '#2d9e5f';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, r);
  ctx.fill();

  // Cart body
  const s = size / 64;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Simple shopping basket icon
  ctx.beginPath();
  ctx.moveTo(12 * s, 20 * s);
  ctx.lineTo(8 * s, 12 * s);
  ctx.moveTo(12 * s, 20 * s);
  ctx.lineTo(52 * s, 20 * s);
  ctx.lineTo(48 * s, 40 * s);
  ctx.lineTo(16 * s, 40 * s);
  ctx.closePath();
  ctx.stroke();

  // Wheels
  ctx.beginPath();
  ctx.arc(22 * s, 46 * s, 4 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(42 * s, 46 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();

  // Checkmark lines on cart
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.moveTo(22 * s, 28 * s);
  ctx.lineTo(22 * s, 35 * s);
  ctx.moveTo(32 * s, 28 * s);
  ctx.lineTo(32 * s, 35 * s);
  ctx.moveTo(42 * s, 28 * s);
  ctx.lineTo(42 * s, 35 * s);
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

for (const size of [192, 512]) {
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), drawIcon(size));
  console.log(`Generated icon-${size}.png`);
}
