import { describe, expect, it } from 'vitest'
import { get_translations } from './localization'
import { create_settings_store } from './settings'

describe('settings and localization', () => {
  it('given_english_when_reading_translations_then_returns_english_copy', () => {
    expect(get_translations('en').settings).toBe('Settings')
  })

  it('given_spanish_when_changing_language_then_notifies_subscribers_and_returns_spanish_copy', () => {
    const store = create_settings_store()
    const observed_languages: string[] = []
    store.subscribe((settings) => observed_languages.push(settings.language))

    store.set_language('es')

    expect(observed_languages).toEqual(['es'])
    expect(store.get_translations().settings).toBe('Ajustes')
    expect(store.get_translations().natural_minor_vs_dorian).toBe('Menor natural vs Dórico')
  })
})
