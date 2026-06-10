// Generates Bilo Fit app icons (dark gradient + blue lightning bolt) as PNGs.
// Pure Node (zlib only) — no image deps.
import zlib from 'node:zlib'
import fs from 'node:fs'

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1))
  }
  return (~c) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function png(W, H, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8; ihdr[9] = 6
  const raw = Buffer.alloc((W * 4 + 1) * H)
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0
    rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// Lightning bolt polygon (VOLT mark) in a 0..100 coordinate space.
const BOLT = [[54, 18], [38, 54], [52, 54], [49, 82], [73, 44], [58, 44], [62, 18]]
function inPoly(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside
  }
  return inside
}

function makeIcon(N) {
  const rgba = Buffer.alloc(N * N * 4)
  for (let y = 0; y < N; y++) {
    const t = y / N
    const r = Math.round(11 * (1 - t) + 5 * t)
    const g = Math.round(20 * (1 - t) + 7 * t)
    const b = Math.round(52 * (1 - t) + 14 * t)
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255
    }
  }
  const SS = 4, scale = 1.3, cx = 55.5, cy = 50
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let hit = 0
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const fx = (x + (sx + 0.5) / SS) / N, fy = (y + (sy + 0.5) / SS) / N
        const mx = (fx - 0.5) * 100 / scale + cx
        const my = (fy - 0.5) * 100 / scale + cy
        if (inPoly(mx, my, BOLT)) hit++
      }
      if (hit) {
        const a = hit / (SS * SS)
        const i = (y * N + x) * 4
        rgba[i]     = Math.round(rgba[i]     * (1 - a) + 0x2f * a)
        rgba[i + 1] = Math.round(rgba[i + 1] * (1 - a) + 0x6b * a)
        rgba[i + 2] = Math.round(rgba[i + 2] * (1 - a) + 0xff * a)
      }
    }
  }
  return png(N, N, rgba)
}

fs.mkdirSync('public', { recursive: true })
for (const n of [180, 192, 512]) fs.writeFileSync(`public/icon-${n}.png`, makeIcon(n))
console.log('Icons written to public/')
