export interface PreferencesStore {
  load(): Promise<unknown>
  save(preferences: unknown): Promise<{ readonly ok: boolean }>
}
