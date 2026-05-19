import sharp from 'sharp'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const svg = join(publicDir, 'favicon.svg')

const brand = { r: 134, g: 59, b: 255, alpha: 1 }

async function writeSquarePng(size, filename) {
  const out = join(publicDir, filename)
  await sharp(svg)
    .resize(size, size, {
      fit: 'contain',
      background: brand,
    })
    .png()
    .toFile(out)
  console.log(`Wrote ${out}`)
}

await writeSquarePng(192, 'pwa-icon-192.png')
await writeSquarePng(512, 'pwa-icon-512.png')
