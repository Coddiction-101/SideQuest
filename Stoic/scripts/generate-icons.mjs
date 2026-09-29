import { readFileSync, writeFileSync } from 'node:fs'
import opentype from 'opentype.js'
import { Resvg } from '@resvg/resvg-js'

// Outline the actual Comforter S, so app icons never depend on installed fonts.
const bytes = readFileSync('node_modules/@fontsource/comforter/files/comforter-latin-400-normal.woff')
const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
const path = font.getPath('S', 0, 0, 1000)
const box = path.getBoundingBox()
const scale = 56 / Math.max(box.x2 - box.x1, box.y2 - box.y1)
const x = 50 - (box.x1 + box.x2) / 2 * scale
const y = 50 - (box.y1 + box.y2) / 2 * scale
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#202020"/><path d="${path.toPathData(3)}" transform="translate(${x} ${y}) scale(${scale})" fill="#f0f0f0"/></svg>`
writeFileSync('public/stoic-comforter.svg', svg)
for (const size of [180, 192, 512]) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(`public/stoic-comforter-${size}.png`, png)
}
console.log('Generated Comforter S app icons.')
