import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, `..`)
const webDistDir = path.join(repoRoot, `apps`, `web`, `dist`)
const cliDir = path.join(repoRoot, `packages`, `md-cli`)
const cliDistDir = path.join(cliDir, `dist`)

async function listFiles(dir) {
  if (!existsSync(dir))
    return []

  const files = []
  const stack = [dir]

  while (stack.length > 0) {
    const current = stack.pop()
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(absolutePath)
      }
      else if (entry.isFile()) {
        files.push(path.relative(dir, absolutePath).replace(/\\/g, `/`))
      }
    }
  }

  return files.sort()
}

async function removeSourceMaps(dir) {
  const files = await listFiles(dir)
  await Promise.all(files
    .filter(file => file.endsWith(`.map`))
    .map(file => fs.rm(path.join(dir, file), { force: true })))
}

async function validateStaticDist(dir, label) {
  const indexPath = path.join(dir, `index.html`)
  const index = existsSync(indexPath) ? await fs.readFile(indexPath, `utf8`) : ``
  const files = await listFiles(dir)

  const expectations = {
    distExists: index.length > 0,
    hasAppMount: index.includes(`id="app"`),
    hasModuleScript: /<script[^>]+type="module"/u.test(index),
    hasStylesheet: /<link[^>]+stylesheet/u.test(index),
    usesMdBase: /(?:src|href)="\/md\//u.test(index),
    hasJavaScriptAsset: files.some(file => file.endsWith(`.js`)),
    hasCssAsset: files.some(file => file.endsWith(`.css`)),
  }

  const failed = Object.entries(expectations)
    .filter(([, passed]) => !passed)
    .map(([name]) => name)

  if (failed.length > 0)
    throw new Error(`${label} static dist validation failed: ${failed.join(`, `)}`)
}

function npmPack() {
  const result = spawnSync(`npm`, [`pack`], {
    cwd: cliDir,
    shell: process.platform === `win32`,
    stdio: `inherit`,
  })

  if (result.error)
    throw result.error

  if (result.status !== 0)
    process.exit(result.status ?? 1)
}

async function main() {
  await validateStaticDist(webDistDir, `web`)
  await removeSourceMaps(webDistDir)
  await fs.rm(cliDistDir, { recursive: true, force: true })
  await fs.cp(webDistDir, cliDistDir, { recursive: true })
  await validateStaticDist(cliDistDir, `md-cli`)
  npmPack()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
