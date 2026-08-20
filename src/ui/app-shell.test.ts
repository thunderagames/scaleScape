import { describe, expect, it } from 'vitest'
import { createExploreApplication } from '../application/explore-application'
import type { PlaybackPort } from '../audio/playback-port'
import { createSettingsStore } from '../settings/settings-store'
import { renderAppShell } from './app-shell'

function createPlaybackFake(): PlaybackPort {
  let is_muted = false
  let volume = 0.7
  const state_listeners = new Set<(state: { readonly is_muted: boolean; readonly volume: number }) => void>()
  return {
    playScale: async () => ({ ok: true }),
    previewNote: async () => ({ ok: true }),
    stopAll: async () => undefined,
    setVolume: (next_volume) => { volume = next_volume; state_listeners.forEach((listener) => listener({ is_muted, volume })) },
    setMuted: (next_is_muted) => { is_muted = next_is_muted; state_listeners.forEach((listener) => listener({ is_muted, volume })) },
    getPlaybackState: () => ({ is_muted, volume }),
    subscribePlaybackState: (listener) => { state_listeners.add(listener); return () => state_listeners.delete(listener) },
    subscribe: () => () => undefined
  }
}

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

describe('application shell', () => {
  it('given_explore_screen_when_opening_ear_gym_then_switches_visible_screen_and_current_navigation', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())

    container.querySelector<HTMLButtonElement>('#navigate-ear-gym')?.click()

    expect(container.querySelector<HTMLElement>('#explore-screen')?.hidden).toBe(true)
    expect(container.querySelector<HTMLElement>('#ear-gym-screen')?.hidden).toBe(false)
    expect(container.querySelector('#navigate-ear-gym')?.getAttribute('aria-current')).toBe('page')
    expect(document.activeElement).toBe(container.querySelector('#navigate-ear-gym'))
  })

  it('given_ear_gym_screen_when_returning_to_explore_then_preserves_explore_dom_and_current_navigation', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())
    const scale_title = container.querySelector('#scale-title')?.textContent
    container.querySelector<HTMLButtonElement>('#navigate-ear-gym')?.click()

    container.querySelector<HTMLButtonElement>('#navigate-explore')?.click()

    expect(container.querySelector<HTMLElement>('#explore-screen')?.hidden).toBe(false)
    expect(container.querySelector('#scale-title')?.textContent).toBe(scale_title)
    expect(container.querySelector('#navigate-explore')?.getAttribute('aria-current')).toBe('page')
  })

  it('given_english_shell_when_switching_to_spanish_then_localizes_navigation_and_ear_gym_placeholder', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const settings = createSettings()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings)

    settings.setLanguage('es')

    expect(container.querySelector('#navigate-explore')?.textContent).toBe('Explorar')
    expect(container.querySelector('#navigate-ear-gym')?.textContent).toBe('Gimnasio auditivo')
    expect(container.querySelector('#ear-gym-title')?.textContent).toBe('Gimnasio auditivo')
  })

  it('given_audio_controls_when_changing_volume_and_mute_then_updates_playback_and_persists_volume', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const settings = createSettings()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings)
    const volume_control = container.querySelector<HTMLInputElement>('#volume-control')

    if (volume_control) {
      volume_control.value = '0.4'
      volume_control.dispatchEvent(new Event('input', { bubbles: true }))
    }
    container.querySelector<HTMLButtonElement>('#mute-audio')?.click()

    expect(settings.getSettings().volume).toBe(0.4)
    expect(container.querySelector('#mute-status')?.textContent).toBe('Muted')
    expect(container.querySelector('#mute-audio')?.textContent).toBe('Unmute')
  })
})
