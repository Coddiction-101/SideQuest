import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, bytes) {
  const payload = Buffer.concat([Buffer.from(type), bytes])
  const size = Buffer.alloc(4); size.writeUInt32BE(bytes.length)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(payload))
  return Buffer.concat([size, payload, crc])
}
for (const size of [180, 192, 512]) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let ink = 0
      for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
        const px = (x + (sx + 0.5) / 4) / size * 100
        const py = (y + (sy + 0.5) / 4) / size * 100
        // Geometric S: three straight strokes joined by two semicircles.
        const segment = (left, right, y) => Math.hypot(px - Math.max(left, Math.min(right, px)), py - y) <= 5
        const upperArc = px <= 44 && Math.abs(Math.hypot(px - 44, py - 39) - 11) <= 5
        const lowerArc = px >= 56 && Math.abs(Math.hypot(px - 56, py - 61) - 11) <= 5
        if (segment(44, 68, 28) || segment(44, 56, 50) || segment(32, 56, 72) || upperArc || lowerArc) ink++
      }
      const color = Math.round(32 + (240 - 32) * ink / 16)
      const index = y * (size * 3 + 1) + 1 + x * 3
      raw[index] = raw[index + 1] = raw[index + 2] = color
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4)
  header[8] = 8; header[9] = 2
  const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
  writeFileSync(`public/stoic-symbol-${size}.png`, png)
}
console.log('Generated monochrome app icons.')
