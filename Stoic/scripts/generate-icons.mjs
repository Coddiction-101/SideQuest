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
        // The same geometric S as stoic-mark.svg, kept inside the maskable safe area.
        if ((px >= 27 && px <= 73 && ((py >= 27 && py <= 37) || (py >= 45 && py <= 55) || (py >= 63 && py <= 73))) || (px >= 27 && px <= 37 && py >= 37 && py <= 45) || (px >= 63 && px <= 73 && py >= 55 && py <= 63)) ink++
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
  writeFileSync(`public/icon-${size}.png`, png)
  writeFileSync(`public/stoic-s-${size}.png`, png)
}
console.log('Generated monochrome app icons.')
