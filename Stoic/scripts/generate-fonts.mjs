// Download the official Satoshi webfonts at build time; do not redistribute raw fonts in the source repository.
import { mkdir, access, writeFile } from 'node:fs/promises'
const sources = {
  400: 'TTX2Z3BF3P6Y5BQT3IV2VNOK6FL22KUT/7QYRJOI3JIMYHGY6CH7SOIFRQLZOLNJ6/KFIAZD4RUMEZIYV6FQ3T3GP5PDBDB6JY',
  500: 'P2LQKHE6KA6ZP4AAGN72KDWMHH6ZH3TA/ZC32TK2P7FPS5GFTL46EU6KQJA24ZYDB/7AHDUZ4A7LFLVFUIFSARGIWCRQJHISQP',
  700: 'LAFFD4SDUCDVQEXFPDC7C53EQ4ZELWQI/PXCT3G6LO6ICM5I3NTYENYPWJAECAWDD/GHM6WVH6MILNYOOCXHXB5GTSGNTMGXZR',
}
await mkdir('public/fonts', { recursive: true })
for (const [weight, source] of Object.entries(sources)) {
  const path = `public/fonts/satoshi-${weight}.woff2`
  try { await access(path); continue } catch {}
  const response = await fetch(`https://cdn.fontshare.com/wf/${source}.woff2`, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Satoshi download failed: ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.subarray(0, 4).toString() !== 'wOF2') throw new Error('Invalid Satoshi webfont response')
  await writeFile(path, bytes)
}
console.log('Satoshi webfonts ready (Fontshare / ITF Free Font License).')
