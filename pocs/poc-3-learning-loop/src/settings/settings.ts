import { get_translations, type Language, type TranslationDictionary } from './localization'

export interface AppSettings {
  readonly language: Language
}

export interface SettingsStore {
  get_settings(): AppSettings
  set_language(language: Language): AppSettings
  get_translations(): TranslationDictionary
  subscribe(listener: (settings: AppSettings) => void): () => void
}

export function create_settings_store(initial_language: Language = 'en'): SettingsStore {
  let settings: AppSettings = { language: initial_language }
  const listeners = new Set<(current_settings: AppSettings) => void>()

  function publish(next_settings: AppSettings): AppSettings {
    settings = next_settings
    listeners.forEach((listener) => listener(settings))
    return settings
  }

  return {
    get_settings() {
      return settings
    },
    set_language(language) {
      return publish({ ...settings, language })
    },
    get_translations() {
      return get_translations(settings.language)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
