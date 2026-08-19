export type ContentId = 'guided_start' | 'explore' | 'ear_gym'

export interface ContentCatalog {
  get(content_id: ContentId): string
}
