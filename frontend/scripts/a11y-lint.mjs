// Checks the built dist/index.html for basic a11y rules.
// For full React component checks, add @axe-core/react in Sprint 3.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const distHtmlPath = fileURLToPath(new URL('../dist/index.html', import.meta.url))

if (!existsSync(distHtmlPath)) {
  console.error('ERROR: dist/index.html not found. Run `npm run build` first.')
  process.exit(1)
}

const html = await readFile(distHtmlPath, 'utf8')
const checks = []

// Check: img elements must have alt
const imgTags = [...html.matchAll(/<img\b[^>]*>/g)]
const imgWithoutAlt = imgTags.filter((m) => !/\balt\s*=/.test(m[0]))
checks.push({
  name: 'img elements require alt',
  passed: imgWithoutAlt.length === 0,
  detail: `${imgWithoutAlt.length} img tags without alt`,
})

// Check: inputs should have explicit labels
const inputs = [...html.matchAll(/<input\b[^>]*id="([^"]+)"[^>]*/g)].map((m) => m[1])
const labels = new Set([...html.matchAll(/<label\b[^>]*for="([^"]+)"[^>]*/g)].map((m) => m[1]))
const unlabelled = inputs.filter((id) => !labels.has(id))
checks.push({
  name: 'inputs should have explicit labels',
  passed: unlabelled.length === 0,
  detail: `${unlabelled.length} inputs without matching label`,
})

const failed = checks.filter((c) => !c.passed)
checks.forEach((c) => {
  const mark = c.passed ? 'PASS' : 'FAIL'
  console.log(`${mark} - ${c.name} (${c.detail})`)
})

if (failed.length > 0) process.exit(1)
