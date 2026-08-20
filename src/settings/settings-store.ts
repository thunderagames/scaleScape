import { getTranslations, type Language, type TranslationDictionary } from './localization'

export interface AppSettings {
  readonly language: Language
  readonly show_piano: boolean
  readonly show_guitar: boolean
  readonly ear_gym_streak: number
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

function isLanguageAndVisibility(value: unknown): value is Pick<AppSettings, 'language' | 'show_piano' | 'show_guitar'> & { readonly ear_gym_streak?: unknown } {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppSettings>
  return (candidate.language === 'en' || candidate.language === 'es') && typeof candidate.show_piano === 'boolean' && typeof candidate.show_guitar === 'boolean'
}

function normalizeSettings(value: Pick<AppSettings, 'language' | 'show_piano' | 'show_guitar'> & { readonly ear_gym_streak?: unknown }): AppSettings {
  const stored_streak = value.ear_gym_streak
  const ear_gym_streak = typeof stored_streak === 'number' && Number.isInteger(stored_streak) && stored_streak >= 0 ? stored_streak : 0
  return { language: value.language, show_piano: value.show_piano, show_guitar: value.show_guitar, ear_gym_streak }
}

function loadSettings(fallback: AppSettings): AppSettings {
  try {
    const stored_value = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!stored_value) return fallback
    const parsed_value: unknown = JSON.parse(stored_value)
    return isLanguageAndVisibility(parsed_value) ? normalizeSettings(parsed_value) : fallback
  } catch {
    return fallback
  }
}

function saveSettings(settings: AppSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Settings remain usable when browser storage is unavailable or full.
  }
}

export function createSettingsStore(initial_language: Language = 'en'): SettingsStore {
  const fallback_settings: AppSettings = { language: initial_language, show_piano: true, show_guitar: true, ear_gym_streak: 0 }
  let settings: AppSettings = loadSettings(fallback_settings)
  const listeners = new Set<(current_settings: AppSettings) => void>()

  function publish(next_settings: AppSettings): AppSettings {
    settings = next_settings
    saveSettings(settings)
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
