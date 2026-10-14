export const CONTENT_CATALOG_SOURCES: readonly string[] = ['./api/catalog.php', './catalog.json']

const REQUEST_TIMEOUT_MS = 8000

export interface LoadedContentCatalog<T> {
  readonly catalog: T
  readonly source: string
}

async function fetch_json(source: string, fetch_impl: typeof fetch): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch_impl(source, { headers: { Accept: 'application/json' }, signal: controller.signal })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function loadContentCatalog<T>(
  parse: (value: unknown) => T | null,
  sources: readonly string[] = CONTENT_CATALOG_SOURCES,
  fetch_impl: typeof fetch = fetch
): Promise<LoadedContentCatalog<T> | null> {
  for (const source of sources) {
    const catalog = parse(await fetch_json(source, fetch_impl))
    if (catalog) return { catalog, source }
  }
  return null
}
