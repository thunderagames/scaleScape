import { describe, expect, it } from 'vitest'
import { createSettingsStore } from '../settings/settings-store'
import { getVisiblePlaybackInstruments } from './visible-instruments'

function createSettings() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0
    }
  })
  return createSettingsStore()
}

describe('visible playback instruments', () => {
  it('given_both_instruments_visible_when_reading_playback_instruments_then_returns_piano_and_guitar', () => {
    expect(getVisiblePlaybackInstruments(createSettings())).toEqual(['piano', 'guitar', 'bass'])
  })

  it('given_hidden_guitar_when_reading_playback_instruments_then_returns_only_piano', () => {
    const settings = createSettings()
    settings.setSettings({ ...settings.getSettings(), show_guitar: false, show_bass: false })

    expect(getVisiblePlaybackInstruments(settings)).toEqual(['piano'])
  })

  it('given_hidden_piano_when_reading_playback_instruments_then_returns_only_guitar', () => {
    const settings = createSettings()
    settings.setSettings({ ...settings.getSettings(), show_piano: false, show_bass: false })

    expect(getVisiblePlaybackInstruments(settings)).toEqual(['guitar'])
  })

  it('given_both_instruments_hidden_when_reading_playback_instruments_then_returns_empty_list', () => {
    const settings = createSettings()
    settings.setSettings({ ...settings.getSettings(), show_piano: false, show_guitar: false, show_bass: false })

    expect(getVisiblePlaybackInstruments(settings)).toEqual([])
  })

  it('given_bass_visible_when_reading_playback_instruments_then_includes_bass', () => {
    const settings = createSettings()
    settings.setSettings({ ...settings.getSettings(), show_bass: true })

    expect(getVisiblePlaybackInstruments(settings)).toEqual(['piano', 'guitar', 'bass'])
  })
})
