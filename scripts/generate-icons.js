const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);

  // Draw satellite dish / radar icon
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;

  // Outer circle (radar dish)
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = size * 0.03;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner radar sweep lines
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = size * 0.02;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius
    );
    ctx.stroke();
  }

  // Center dot
  ctx.fillStyle = '#00ff41';
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Pulsing rings
  for (let r = 0.15; r <= 0.3; r += 0.075) {
    ctx.strokeStyle = `rgba(0, 255, 65, ${0.3})`;
    ctx.lineWidth = size * 0.015;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Write to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated ${outputPath}`);
}

// Generate both icon sizes
const publicDir = __dirname + '/../public';
generateIcon(192, `${publicDir}/icon-192.png`);
generateIcon(512, `${publicDir}/icon-512.png`);

console.log('✅ Icons generated successfully!');
