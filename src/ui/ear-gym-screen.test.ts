import { describe, expect, it } from 'vitest'
import type { PlaybackPort } from '../audio/playback-port'
import { createSettingsStore } from '../settings/settings-store'
import { renderEarGymScreen } from './ear-gym-screen'

function createPlaybackFake() {
  const played_formulas: string[] = []
  const playback: PlaybackPort = {
    playScale: async (scale) => { played_formulas.push(scale.formula.id); return { ok: true } },
    previewNote: async () => ({ ok: true }),
    stopAll: async () => undefined,
    subscribe: () => () => undefined
  }
  return { playback, played_formulas }
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

describe('ear gym screen', () => {
  it('given_listen_phase_when_playing_both_examples_then_reports_playback_for_both_formulas', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const playback_fake = createPlaybackFake()
    renderEarGymScreen(container, playback_fake.playback, createSettings())

    container.querySelector<HTMLButtonElement>('#play-example-a')?.click()
    container.querySelector<HTMLButtonElement>('#play-example-b')?.click()
    await Promise.resolve()

    expect(playback_fake.played_formulas).toEqual(['natural_minor', 'dorian'])
    expect(container.querySelector('#playback-status')?.textContent).toBe('Playing Dorian.')
  })

  it('given_listen_phase_when_answering_sixth_degree_then_reveals_feedback_and_streak', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderEarGymScreen(container, createPlaybackFake().playback, createSettings())

    container.querySelector<HTMLButtonElement>('#start-answer')?.click()
    container.querySelector<HTMLInputElement>('input[value="6"]')?.click()

    expect(container.querySelector('#feedback')?.textContent).toContain('That is the changed degree.')
    expect(container.querySelector('#feedback')?.textContent).toContain('Streak: 1')
    expect(container.querySelector<HTMLButtonElement>('#restart-exercise')?.hidden).toBe(false)
  })
})
