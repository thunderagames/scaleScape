import type { GuitarNote } from '../domain/guitar-fretboard'

export type AudioResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'unavailable' | 'failed' }

export interface NotePreviewPort {
  preview(note: GuitarNote): Promise<AudioResult>
  stop(): void
}

interface BrowserAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

export function create_web_audio_preview(): NotePreviewPort {
  let audio_context: AudioContext | null = null
  let active_oscillator: OscillatorNode | null = null

  function get_audio_context(): AudioContext | null {
    if (audio_context) {
      return audio_context
    }

    const browser_window = window as BrowserAudioWindow
    const AudioContextConstructor = window.AudioContext ?? browser_window.webkitAudioContext
    if (!AudioContextConstructor) {
      return null
    }

    audio_context = new AudioContextConstructor()
    return audio_context
  }

  return {
    async preview(note) {
      const context = get_audio_context()
      if (!context) {
        return { ok: false, reason: 'unavailable' }
      }

      try {
        if (context.state === 'suspended') {
          await context.resume()
        }

        active_oscillator?.stop()
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const start_time = context.currentTime

        oscillator.type = 'triangle'
        oscillator.frequency.setValueAtTime(note.frequency, start_time)
        gain.gain.setValueAtTime(0.0001, start_time)
        gain.gain.exponentialRampToValueAtTime(0.22, start_time + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.0001, start_time + 0.45)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(start_time)
        oscillator.stop(start_time + 0.5)
        active_oscillator = oscillator

        oscillator.addEventListener('ended', () => {
          if (active_oscillator === oscillator) {
            active_oscillator = null
          }
        })

        return { ok: true }
      } catch {
        return { ok: false, reason: 'failed' }
      }
    },
    stop() {
      active_oscillator?.stop()
      active_oscillator = null
    }
  }
}
