import type { PlaybackInstrument } from '../audio/playback-port'
import type { SettingsStore } from '../settings/settings-store'

export function getVisiblePlaybackInstruments(settings: SettingsStore): readonly PlaybackInstrument[] {
  const instruments: PlaybackInstrument[] = []
  const current_settings = settings.getSettings()
  if (current_settings.show_piano) instruments.push('piano')
  if (current_settings.show_guitar) instruments.push('guitar')
  if (current_settings.show_bass) instruments.push('bass')
  return instruments
}
