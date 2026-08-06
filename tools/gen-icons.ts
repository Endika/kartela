import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const PUBLIC_DIR = join(import.meta.dirname, '..', 'public')
const SOURCE = join(PUBLIC_DIR, 'icon.svg')
const BACKGROUND = { r: 0x1d, g: 0x11, b: 0x47, alpha: 1 }

async function square(svg: Buffer, size: number, name: string): Promise<void> {
  const png = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer()
  await writeFile(join(PUBLIC_DIR, name), png)
  console.log(`${name} — ${size}×${size}`)
}

// Maskable icons get cropped to a circle by the launcher, so the artwork has to
// live inside the middle 80% or the poster corners get shaved off.
async function maskable(svg: Buffer, size: number, name: string): Promise<void> {
  const inner = Math.round(size * 0.8)
  const pad = Math.round((size - inner) / 2)
  const png = await sharp(svg, { density: 384 })
    .resize(inner, inner)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BACKGROUND })
    .png()
    .toBuffer()
  await writeFile(join(PUBLIC_DIR, name), png)
  console.log(`${name} — ${size}×${size} maskable`)
}

const svg = await readFile(SOURCE)
await square(svg, 192, 'pwa-192.png')
await square(svg, 512, 'pwa-512.png')
await square(svg, 180, 'apple-touch-icon.png')
await maskable(svg, 512, 'pwa-maskable-512.png')
await copyFile(SOURCE, join(PUBLIC_DIR, 'favicon.svg'))
console.log('favicon.svg')
