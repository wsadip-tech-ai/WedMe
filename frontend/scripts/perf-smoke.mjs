// Measures total JS + CSS bundle size in dist/assets/.
// Budget: 500KB total (React baseline). Tighten per-sprint as lazy-loading is added.
import { readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, extname } from 'node:path'
import { existsSync } from 'node:fs'

const BUDGET_BYTES = 500 * 1024 // 500 KB

const assetsDir = fileURLToPath(new URL('../dist/assets', import.meta.url))

if (!existsSync(assetsDir)) {
  console.error('ERROR: dist/assets not found. Run `npm run build` first.')
  process.exit(1)
}

const files = await readdir(assetsDir)
const results = []

for (const file of files) {
  const ext = extname(file)
  if (ext !== '.js' && ext !== '.css') continue
  const filePath = join(assetsDir, file)
  const { size } = await stat(filePath)
  results.push({ file, bytes: size })
}

const totalBytes = results.reduce((sum, r) => sum + r.bytes, 0)
results.forEach((r) => console.log(`${r.file} ${r.bytes}B`))
console.log(`TOTAL ${totalBytes}B / BUDGET ${BUDGET_BYTES}B`)

if (totalBytes > BUDGET_BYTES) {
  console.error(`FAIL: bundle exceeds ${BUDGET_BYTES / 1024}KB budget`)
  process.exit(1)
}
console.log('PASS')
