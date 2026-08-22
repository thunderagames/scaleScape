import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTranslations } from './localization'
import { createSettingsStore } from './settings-store'
import type { EventLoggerPort } from '../observability/event-logger'

describe('settings store', () => {
  const storage_data = new Map<string, string>()
  const storage = {
    getItem: (key: string) => storage_data.get(key) ?? null,
    setItem: (key: string, value: string) => storage_data.set(key, value),
    removeItem: (key: string) => storage_data.delete(key),
    clear: () => storage_data.clear(),
    key: (index: number) => [...storage_data.keys()][index] ?? null,
    get length() { return storage_data.size }
  }

  function createDiagnosticsFake(): EventLoggerPort & { readonly events: string[] } {
    const events: string[] = []
    return { events, log: (event_name) => events.push(event_name) }
  }

  beforeEach(() => {
    storage_data.clear()
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
  })

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: undefined })
  })

  it('given_english_settings_when_reading_translations_then_returns_english_copy', () => {
    expect(getTranslations('en').settings).toBe('Settings')
  })

  it('given_english_settings_when_setting_spanish_then_notifies_and_returns_spanish_copy', () => {
    const store = createSettingsStore()
    const languages: string[] = []
    store.subscribe((settings) => languages.push(settings.language))

    store.setLanguage('es')

    expect(languages).toEqual(['es'])
    expect(store.getTranslations().app_title).toBe('Scale Explorer')
  })

  it('given_visible_instruments_when_hiding_piano_then_preserves_guitar_visibility', () => {
    const store = createSettingsStore()

    const settings = store.setInstrumentVisibility('piano', false)

    expect(settings.show_piano).toBe(false)
    expect(settings.show_guitar).toBe(true)
  })

  it('given_pending_language_and_visibility_changes_when_saving_settings_then_publishes_all_values_together', () => {
    const store = createSettingsStore()
    const observed_settings: Array<{ language: string; show_piano: boolean; show_guitar: boolean; show_bass: boolean; bass_tuning_semitones: number }> = []
    store.subscribe((settings) => observed_settings.push(settings))

    store.setSettings({ language: 'es', note_naming: 'letter', show_piano: false, show_guitar: true, show_bass: true, ear_gym_streak: 0, volume: 0.7, tempo_bpm: 120, guitar_tuning_semitones: 0, bass_tuning_semitones: 0, last_root: 4, last_formula: 'dorian', guided_start_completed: false })

    expect(observed_settings).toEqual([{ language: 'es', note_naming: 'letter', show_piano: false, show_guitar: true, show_bass: true, ear_gym_streak: 0, volume: 0.7, tempo_bpm: 120, guitar_tuning_semitones: 0, bass_tuning_semitones: 0, last_root: 4, last_formula: 'dorian', guided_start_completed: false }])
  })

  it('given_saved_settings_when_creating_a_new_store_then_loads_them_from_local_storage', () => {
    window.localStorage.clear()
    const first_store = createSettingsStore()
    first_store.setSettings({ language: 'es', note_naming: 'letter', show_piano: false, show_guitar: true, show_bass: false, ear_gym_streak: 3, volume: 0.45, tempo_bpm: 150, guitar_tuning_semitones: -2, bass_tuning_semitones: 3, last_root: 9, last_formula: 'lydian', guided_start_completed: true })

    const second_store = createSettingsStore()

    expect(second_store.getSettings()).toEqual({ language: 'es', note_naming: 'letter', show_piano: false, show_guitar: true, show_bass: false, ear_gym_streak: 3, volume: 0.45, tempo_bpm: 150, guitar_tuning_semitones: -2, bass_tuning_semitones: 3, last_root: 9, last_formula: 'lydian', guided_start_completed: true })
  })

  it('given_invalid_saved_settings_when_creating_a_store_then_uses_safe_defaults', () => {
    window.localStorage.setItem('scalescape.settings.v1', '{invalid')

    const store = createSettingsStore()

    expect(store.getSettings()).toEqual({ language: 'en', note_naming: 'letter', show_piano: true, show_guitar: true, show_bass: true, ear_gym_streak: 0, volume: 0.7, tempo_bpm: 120, guitar_tuning_semitones: 0, bass_tuning_semitones: 0, last_root: 4, last_formula: 'dorian', guided_start_completed: false })
  })

  it('given_legacy_saved_settings_when_creating_a_store_then_defaults_missing_streak', () => {
    window.localStorage.setItem('scalescape.settings.v1', JSON.stringify({ language: 'es', show_piano: true, show_guitar: false }))

    const store = createSettingsStore()

    expect(store.getSettings()).toEqual({ language: 'es', note_naming: 'letter', show_piano: true, show_guitar: false, show_bass: true, ear_gym_streak: 0, volume: 0.7, tempo_bpm: 120, guitar_tuning_semitones: 0, bass_tuning_semitones: 0, last_root: 4, last_formula: 'dorian', guided_start_completed: false })
  })

  it('given_legacy_saved_settings_when_creating_a_store_then_defaults_bass_visibility_to_true', () => {
    window.localStorage.setItem('scalescape.settings.v1', JSON.stringify({ language: 'en', show_piano: true, show_guitar: true }))

    expect(createSettingsStore().getSettings().show_bass).toBe(true)
  })

  it('given_legacy_saved_settings_when_creating_a_store_then_defaults_bass_tuning_to_standard', () => {
    window.localStorage.setItem('scalescape.settings.v1', JSON.stringify({ language: 'en', show_piano: true, show_guitar: true }))

    expect(createSettingsStore().getSettings().bass_tuning_semitones).toBe(0)
  })

  it('given_invalid_saved_scale_when_creating_a_store_then_defaults_root_and_formula', () => {
    window.localStorage.setItem('scalescape.settings.v1', JSON.stringify({ language: 'en', show_piano: true, show_guitar: true, last_root: 99, last_formula: 'unknown' }))

    const store = createSettingsStore()

    expect(store.getSettings().last_root).toBe(4)
    expect(store.getSettings().last_formula).toBe('dorian')
  })

  it('given_legacy_saved_settings_when_creating_a_store_then_defaults_guided_start_to_incomplete', () => {
    window.localStorage.setItem('scalescape.settings.v1', JSON.stringify({ language: 'en', show_piano: true, show_guitar: true }))

    const store = createSettingsStore()

    expect(store.getSettings().guided_start_completed).toBe(false)
  })

  it('given_malformed_saved_settings_when_creating_a_store_then_logs_preferences_fallback', () => {
    const diagnostics = createDiagnosticsFake()
    window.localStorage.setItem('scalescape.settings.v1', '{invalid')

    createSettingsStore('en', diagnostics)

    expect(diagnostics.events).toEqual(['persistence.preferences_fallback'])
  })

  it('given_unavailable_storage_when_saving_settings_then_logs_write_failure_without_throwing', () => {
    const diagnostics = createDiagnosticsFake()
    Object.defineProperty(window, 'localStorage', { configurable: true, get: () => { throw new Error('storage unavailable') } })
    const store = createSettingsStore('en', diagnostics)

    expect(() => store.setLanguage('es')).not.toThrow()
    expect(diagnostics.events).toEqual(['persistence.preferences_fallback', 'persistence.preferences_write_failed'])
  })
})
