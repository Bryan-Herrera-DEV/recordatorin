import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const buildDir = 'build'

const crcTable = new Uint32Array(256)
for (let index = 0; index < 256; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  crcTable[index] = value >>> 0
}

const crc32 = (buffer) => {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const typeBuffer = Buffer.from(type, 'ascii')
  const chunkBuffer = Buffer.alloc(12 + data.length)
  chunkBuffer.writeUInt32BE(data.length, 0)
  typeBuffer.copy(chunkBuffer, 4)
  data.copy(chunkBuffer, 8)
  chunkBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length)
  return chunkBuffer
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const mix = (from, to, amount) => from * (1 - amount) + to * amount

const setPixel = (pixels, size, x, y, color) => {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return
  }
  const index = (y * size + x) * 4
  const alpha = color[3] / 255
  const inverseAlpha = 1 - alpha
  pixels[index] = Math.round(color[0] * alpha + pixels[index] * inverseAlpha)
  pixels[index + 1] = Math.round(color[1] * alpha + pixels[index + 1] * inverseAlpha)
  pixels[index + 2] = Math.round(color[2] * alpha + pixels[index + 2] * inverseAlpha)
  pixels[index + 3] = Math.round(color[3] + pixels[index + 3] * inverseAlpha)
}

const roundedRectContains = (x, y, left, top, width, height, radius) => {
  const right = left + width
  const bottom = top + height
  const centerX = x < left + radius ? left + radius : x > right - radius ? right - radius : x
  const centerY = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y
  const distanceX = x - centerX
  const distanceY = y - centerY
  return distanceX * distanceX + distanceY * distanceY <= radius * radius
}

const drawRoundedRect = (pixels, size, left, top, width, height, radius, colorForPixel) => {
  const startX = Math.floor(left)
  const endX = Math.ceil(left + width)
  const startY = Math.floor(top)
  const endY = Math.ceil(top + height)

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      if (roundedRectContains(x + 0.5, y + 0.5, left, top, width, height, radius)) {
        setPixel(pixels, size, x, y, colorForPixel(x, y))
      }
    }
  }
}

const drawCircle = (pixels, size, centerX, centerY, radius, color) => {
  const radiusSquared = radius * radius
  for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y += 1) {
    for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x += 1) {
      const distanceX = x + 0.5 - centerX
      const distanceY = y + 0.5 - centerY
      if (distanceX * distanceX + distanceY * distanceY <= radiusSquared) {
        setPixel(pixels, size, x, y, color)
      }
    }
  }
}

const drawIconPixels = (size) => {
  const pixels = Buffer.alloc(size * size * 4)
  const scale = size / 128

  drawRoundedRect(pixels, size, 0, 0, size, size, 34 * scale, (x, y) => {
    const amount = clamp((x + y) / (size * 1.7), 0, 1)
    const first = [255, 183, 223]
    const second = amount < 0.62 ? [185, 131, 255] : [78, 205, 196]
    return [mix(first[0], second[0], amount), mix(first[1], second[1], amount), mix(first[2], second[2], amount), 255]
  })

  drawRoundedRect(pixels, size, 32 * scale, 25 * scale, 68 * scale, 67 * scale, 16 * scale, (_x, y) => {
    const amount = clamp((y - 25 * scale) / (67 * scale), 0, 1)
    return [255, mix(255, 242, amount), mix(255, 251, amount), 255]
  })

  const tail = [
    [45, 84],
    [31, 110],
    [60, 92],
  ].map(([x, y]) => [x * scale, y * scale])
  for (let y = Math.floor(83 * scale); y < Math.ceil(112 * scale); y += 1) {
    for (let x = Math.floor(30 * scale); x < Math.ceil(62 * scale); x += 1) {
      const [a, b, c] = tail
      const area = Math.abs((b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]))
      const area1 = Math.abs((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1]))
      const area2 = Math.abs((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1]))
      const area3 = Math.abs((a[1] - b[1]) * (x - b[0]) + (b[0] - a[0]) * (y - b[1]))
      if (Math.abs(area - area1 - area2 - area3) < scale * 2) {
        setPixel(pixels, size, x, y, [255, 242, 251, 255])
      }
    }
  }

  for (const [x, y, width] of [
    [51, 43, 34],
    [51, 61, 41],
    [51, 79, 25],
  ]) {
    drawRoundedRect(pixels, size, x * scale, y * scale, width * scale, 11 * scale, 5.5 * scale, () => [123, 63, 242, 255])
  }

  drawCircle(pixels, size, 93 * scale, 34 * scale, 13 * scale, [255, 247, 251, 230])
  drawRoundedRect(pixels, size, 91.5 * scale, 27 * scale, 4.6 * scale, 11 * scale, 2 * scale, () => [215, 92, 170, 255])
  drawRoundedRect(pixels, size, 87 * scale, 32.5 * scale, 10 * scale, 4.6 * scale, 2 * scale, () => [215, 92, 170, 255])

  return pixels
}

const createPng = (size) => {
  const pixels = drawIconPixels(size)
  const rows = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1)
    rows[rowStart] = 0
    pixels.copy(rows, rowStart + 1, y * size * 4, (y + 1) * size * 4)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6
  header[10] = 0
  header[11] = 0
  header[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const createIco = (png) => {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  header[6] = 0
  header[7] = 0
  header[8] = 0
  header[9] = 0
  header.writeUInt16LE(1, 10)
  header.writeUInt16LE(32, 12)
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(22, 18)
  return Buffer.concat([header, png])
}

mkdirSync(buildDir, { recursive: true })
writeFileSync(join(buildDir, 'icon.png'), createPng(512))
writeFileSync(join(buildDir, 'icon.ico'), createIco(createPng(256)))

console.log('Generated build/icon.png and build/icon.ico')
