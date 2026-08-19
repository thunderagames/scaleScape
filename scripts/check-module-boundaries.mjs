import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const source_root = join(process.cwd(), 'src')
const forbidden_imports = new Map([
  ['theory', /from ['"].*(?:ui|audio|application|persistence|observability|instruments|exercises|content)/],
  ['shared', /from ['"].*(?:theory|ui|audio|application|persistence|observability|instruments|exercises|content)/],
  ['app-state', /from ['"].*(?:ui|audio|persistence|observability)/],
  ['exercises', /from ['"].*(?:ui|audio|persistence)/]
])

async function visit(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const entry_path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await visit(entry_path))
    } else if (entry.name.endsWith('.ts')) {
      files.push(entry_path)
    }
  }
  return files
}

const violations = []
for (const file_path of await visit(source_root)) {
  const relative_path = relative(source_root, file_path)
  const module_name = relative_path.split(/[\\/]/)[0]
  const forbidden_pattern = forbidden_imports.get(module_name)
  if (!forbidden_pattern) {
    continue
  }

  const source = await readFile(file_path, 'utf8')
  if (forbidden_pattern.test(source)) {
    violations.push(relative_path)
  }
}

if (violations.length > 0) {
  console.error(`Forbidden module imports found:\n${violations.join('\n')}`)
  process.exit(1)
}

console.log('Module boundary check passed.')
