// Generates PNG app icons (no external deps): node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
const encodePNG = (w, h, rgba) => {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const inPoly = (x, y, pts) => {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const BG1 = hex('#1C2740')
const BG2 = hex('#0B0E14')
const PAGE = hex('#9BBBF4')
const PAGE2 = hex('#7FA6EE')
const RIBBON = hex('#F39C12')

function shapeColor(u, v) {
  // u, v in 0..1 of the artwork square
  const left = [[0.18, 0.33], [0.485, 0.39], [0.485, 0.73], [0.18, 0.67]]
  const right = [[0.515, 0.39], [0.82, 0.33], [0.82, 0.67], [0.515, 0.73]]
  const ribbon = [[0.69, 0.345], [0.75, 0.335], [0.75, 0.52], [0.72, 0.49], [0.69, 0.525]]
  if (inPoly(u, v, ribbon)) return RIBBON
  if (inPoly(u, v, left)) return PAGE2
  if (inPoly(u, v, right)) return PAGE
  return null
}

function render(size, { maskable = false, rounded = false } = {}) {
  const buf = Buffer.alloc(size * size * 4)
  const SS = 4
  const scale = maskable ? 0.72 : 0.9
  const off = (1 - scale) / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = (x + (sx + 0.5) / SS) / size
          const py = (y + (sy + 0.5) / SS) / size
          if (rounded) {
            const rr = 0.22
            const cx = Math.min(Math.max(px, rr), 1 - rr)
            const cy = Math.min(Math.max(py, rr), 1 - rr)
            if ((px - cx) ** 2 + (py - cy) ** 2 > rr * rr) continue
          }
          const d = Math.min(1, Math.hypot(px - 0.3, py - 0.2) / 1.1)
          let c = BG1.map((v, i) => v + (BG2[i] - v) * d)
          const s = shapeColor((px - off) / scale, (py - off) / scale)
          if (s) c = s
          r += c[0]; g += c[1]; b += c[2]; a += 255
        }
      }
      const n = SS * SS
      const i = (y * size + x) * 4
      buf[i] = r / n; buf[i + 1] = g / n; buf[i + 2] = b / n; buf[i + 3] = a / n
    }
  }
  return encodePNG(size, size, buf)
}

writeFileSync(join(outDir, 'apple-touch-icon.png'), render(180))
writeFileSync(join(outDir, 'icon-192.png'), render(192, { rounded: true }))
writeFileSync(join(outDir, 'icon-512.png'), render(512, { rounded: true }))
writeFileSync(join(outDir, 'icon-maskable-512.png'), render(512, { maskable: true }))
console.log('Icons written to', outDir)
