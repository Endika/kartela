import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(import.meta.dirname, '..', 'src')

function filesIn(layer: string): string[] {
  const dir = join(SRC, layer)
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => join(entry.parentPath, entry.name))
}

function importsOf(file: string): string[] {
  const source = readFileSync(file, 'utf8')
  return [...source.matchAll(/from '([^']+)'/g)].map((match) => match[1] as string)
}

/** Which layer a relative import from `file` actually lands in. */
function targetLayer(file: string, specifier: string): string {
  const resolved = join(file, '..', specifier).replace(`${SRC}/`, '')
  return resolved.split('/')[0] as string
}

const outward = (file: string): string[] =>
  importsOf(file)
    .filter((specifier) => specifier.startsWith('.'))
    .map((specifier) => targetLayer(file, specifier))

describe('architecture', () => {
  it('keeps the domain independent of everything else', () => {
    const leaks = filesIn('domain').flatMap((file) =>
      outward(file)
        .filter((layer) => layer !== 'domain')
        .map((layer) => `${file.replace(`${SRC}/`, '')} -> ${layer}`),
    )
    expect(leaks).toEqual([])
  })

  it('keeps the ui off the adapters, talking to ports only', () => {
    const leaks = filesIn('ui').flatMap((file) =>
      outward(file)
        .filter((layer) => layer !== 'domain' && layer !== 'ui')
        .map((layer) => `${file.replace(`${SRC}/`, '')} -> ${layer}`),
    )
    expect(leaks).toEqual([])
  })

  it('lets adapters depend on the domain and the bundled data, nothing else', () => {
    const allowed = new Set(['domain', 'adapters', 'data'])
    const leaks = filesIn('adapters').flatMap((file) =>
      outward(file)
        .filter((layer) => !allowed.has(layer))
        .map((layer) => `${file.replace(`${SRC}/`, '')} -> ${layer}`),
    )
    expect(leaks).toEqual([])
  })

  it('keeps the browser out of the domain', () => {
    const browserApi = /\b(document|window|localStorage|navigator|fetch)\b/
    const offenders = filesIn('domain').filter((file) =>
      browserApi.test(readFileSync(file, 'utf8')),
    )
    expect(offenders.map((file) => file.replace(`${SRC}/`, ''))).toEqual([])
  })

  it('wires the adapters in one place only', () => {
    const wiring = [...filesIn('ui'), ...filesIn('domain')].filter((file) =>
      importsOf(file).some((specifier) => specifier.includes('adapters/')),
    )
    expect(wiring.map((file) => file.replace(`${SRC}/`, ''))).toEqual([])
    expect(importsOf(join(SRC, 'main.ts')).filter((s) => s.includes('adapters/')).length).toBe(4)
  })
})
