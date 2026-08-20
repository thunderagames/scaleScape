import { getTranslations, type Language, type TranslationDictionary } from './localization'
import { SCALE_FORMULAS, type FormulaId } from '../theory/scale-formulas'
import type { EventLoggerPort } from '../observability/event-logger'

export interface AppSettings {
  readonly language: Language
  readonly show_piano: boolean
  readonly show_guitar: boolean
  readonly ear_gym_streak: number
  readonly volume: number
  readonly last_root: number
  readonly last_formula: FormulaId
  readonly guided_start_completed: boolean
}

export interface SettingsStore {
  getSettings(): AppSettings
  getTranslations(): TranslationDictionary
  setSettings(settings: AppSettings): AppSettings
  setLanguage(language: Language): AppSettings
  setInstrumentVisibility(instrument: 'piano' | 'guitar', is_visible: boolean): AppSettings
  subscribe(listener: (settings: AppSettings) => void): () => void
}

const SETTINGS_STORAGE_KEY = 'scalescape.settings.v1'

function log_diagnostic(diagnostics: EventLoggerPort, event_name: string, attributes: Readonly<Record<string, string | number | boolean>>): void {
  try { diagnostics.log(event_name, attributes) } catch { /* Diagnostics must not block settings. */ }
}

function isStoredSettings(value: unknown): value is Pick<AppSettings, 'language' | 'show_piano' | 'show_guitar'> & { readonly ear_gym_streak?: unknown; readonly volume?: unknown; readonly last_root?: unknown; readonly last_formula?: unknown; readonly guided_start_completed?: unknown } {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppSettings>
  return (candidate.language === 'en' || candidate.language === 'es') && typeof candidate.show_piano === 'boolean' && typeof candidate.show_guitar === 'boolean'
}

function normalizeSettings(value: Pick<AppSettings, 'language' | 'show_piano' | 'show_guitar'> & { readonly ear_gym_streak?: unknown; readonly volume?: unknown; readonly last_root?: unknown; readonly last_formula?: unknown; readonly guided_start_completed?: unknown }): AppSettings {
  const stored_streak = value.ear_gym_streak
  const ear_gym_streak = typeof stored_streak === 'number' && Number.isInteger(stored_streak) && stored_streak >= 0 ? stored_streak : 0
  const stored_volume = value.volume
  const volume = typeof stored_volume === 'number' && Number.isFinite(stored_volume) && stored_volume >= 0 && stored_volume <= 1 ? stored_volume : 0.7
  const last_root = typeof value.last_root === 'number' && Number.isInteger(value.last_root) && value.last_root >= 0 && value.last_root <= 11 ? value.last_root : 4
  const last_formula = typeof value.last_formula === 'string' ? SCALE_FORMULAS.find((formula) => formula.id === value.last_formula)?.id ?? 'dorian' : 'dorian'
  const guided_start_completed = value.guided_start_completed === true
  return { language: value.language, show_piano: value.show_piano, show_guitar: value.show_guitar, ear_gym_streak, volume, last_root, last_formula, guided_start_completed }
}

function loadSettings(fallback: AppSettings, diagnostics: EventLoggerPort): AppSettings {
  try {
    const stored_value = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!stored_value) return fallback
    const parsed_value: unknown = JSON.parse(stored_value)
    if (!isStoredSettings(parsed_value)) {
      log_diagnostic(diagnostics, 'persistence.preferences_fallback', { reason_code: 'MALFORMED' })
      return fallback
    }
    return normalizeSettings(parsed_value)
  } catch {
    log_diagnostic(diagnostics, 'persistence.preferences_fallback', { reason_code: 'UNAVAILABLE' })
    return fallback
  }
}

function saveSettings(settings: AppSettings, diagnostics: EventLoggerPort): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    log_diagnostic(diagnostics, 'persistence.preferences_write_failed', {})
  }
}

export function createSettingsStore(initial_language: Language = 'en', diagnostics: EventLoggerPort = { log: () => undefined }): SettingsStore {
  const fallback_settings: AppSettings = { language: initial_language, show_piano: true, show_guitar: true, ear_gym_streak: 0, volume: 0.7, last_root: 4, last_formula: 'dorian', guided_start_completed: false }
  let settings: AppSettings = loadSettings(fallback_settings, diagnostics)
  const listeners = new Set<(current_settings: AppSettings) => void>()

  function publish(next_settings: AppSettings): AppSettings {
    settings = next_settings
    saveSettings(settings, diagnostics)
    listeners.forEach((listener) => listener(settings))
    return settings
  }

  return {
    getSettings: () => settings,
    getTranslations: () => getTranslations(settings.language),
    setSettings: (next_settings) => publish(next_settings),
    setLanguage: (language) => publish({ ...settings, language }),
    setInstrumentVisibility: (instrument, is_visible) => publish({ ...settings, [instrument === 'piano' ? 'show_piano' : 'show_guitar']: is_visible }),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
