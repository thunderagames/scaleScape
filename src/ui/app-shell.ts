import type { ExploreApplication } from '../application/explore-application'
import type { PlaybackPort } from '../audio/playback-port'
import type { SettingsStore } from '../settings/settings-store'
import { renderExploreScreen } from './explore-screen'
import { renderEarGymScreen } from './ear-gym-screen'

export type AppScreen = 'explore' | 'ear_gym'

export function renderAppShell(container: HTMLElement, application: ExploreApplication, playback: PlaybackPort, settings: SettingsStore): void {
  container.innerHTML = `
    <div class="app-shell">
      <header class="app-shell-header">
        <p id="shell-label" class="eyebrow"></p>
        <nav id="app-navigation" class="app-navigation" aria-label="Application navigation">
          <button id="navigate-explore" type="button" aria-controls="explore-screen" aria-current="page"></button>
          <button id="navigate-ear-gym" type="button" aria-controls="ear-gym-screen"></button>
        </nav>
        <div id="audio-controls" class="audio-controls" role="group">
          <label id="volume-label" for="volume-control"></label>
          <input id="volume-control" type="range" min="0" max="1" step="0.05" />
          <button id="mute-audio" type="button"></button>
          <span id="mute-status" role="status" aria-live="polite"></span>
        </div>
      </header>
      <div id="explore-screen"></div>
      <section id="ear-gym-screen" class="screen-placeholder" hidden></section>
    </div>
  `

  const explore_screen = container.querySelector<HTMLElement>('#explore-screen')
  const ear_gym_screen = container.querySelector<HTMLElement>('#ear-gym-screen')
  const navigate_explore = container.querySelector<HTMLButtonElement>('#navigate-explore')
  const navigate_ear_gym = container.querySelector<HTMLButtonElement>('#navigate-ear-gym')
  const shell_label = container.querySelector<HTMLElement>('#shell-label')
  const audio_controls = container.querySelector<HTMLElement>('#audio-controls')
  const volume_label = container.querySelector<HTMLElement>('#volume-label')
  const volume_control = container.querySelector<HTMLInputElement>('#volume-control')
  const mute_audio = container.querySelector<HTMLButtonElement>('#mute-audio')
  const mute_status = container.querySelector<HTMLElement>('#mute-status')
  if (!explore_screen || !ear_gym_screen || !navigate_explore || !navigate_ear_gym || !shell_label || !audio_controls || !volume_label || !volume_control || !mute_audio || !mute_status) throw new Error('Application shell elements were not found')
  const ui = { explore_screen, ear_gym_screen, navigate_explore, navigate_ear_gym, shell_label, audio_controls, volume_label, volume_control, mute_audio, mute_status }

  let current_screen: AppScreen = 'explore'

  function apply_translations(): void {
    const translation = settings.getTranslations()
    ui.shell_label.textContent = translation.app_label
    ui.navigate_explore.textContent = translation.nav_explore
    ui.navigate_ear_gym.textContent = translation.nav_ear_gym
    ui.navigate_explore.setAttribute('aria-label', translation.nav_explore)
    ui.navigate_ear_gym.setAttribute('aria-label', translation.nav_ear_gym)
    ui.audio_controls.setAttribute('aria-label', translation.audio_controls)
    ui.volume_label.textContent = translation.volume
    ui.volume_control.setAttribute('aria-label', translation.volume)
    ui.mute_audio.textContent = playback.getPlaybackState().is_muted ? translation.unmute : translation.mute
    ui.mute_audio.setAttribute('aria-label', ui.mute_audio.textContent)
    ui.mute_status.textContent = playback.getPlaybackState().is_muted ? translation.muted : ''
  }

  function show_screen(screen: AppScreen): void {
    current_screen = screen
    const is_explore = current_screen === 'explore'
    ui.explore_screen.hidden = !is_explore
    ui.ear_gym_screen.hidden = is_explore
    ui.navigate_explore.setAttribute('aria-current', is_explore ? 'page' : 'false')
    ui.navigate_ear_gym.setAttribute('aria-current', is_explore ? 'false' : 'page')
    const active_button = is_explore ? ui.navigate_explore : ui.navigate_ear_gym
    active_button.focus()
  }

  ui.navigate_explore.addEventListener('click', () => show_screen('explore'))
  ui.navigate_ear_gym.addEventListener('click', () => show_screen('ear_gym'))
  playback.setVolume(settings.getSettings().volume)
  ui.volume_control.value = String(settings.getSettings().volume)
  ui.volume_control.addEventListener('input', () => { const volume = Number(ui.volume_control.value); playback.setVolume(volume); settings.setSettings({ ...settings.getSettings(), volume }) })
  ui.mute_audio.addEventListener('click', () => playback.setMuted(!playback.getPlaybackState().is_muted))
  settings.subscribe(apply_translations)
  playback.subscribePlaybackState(apply_translations)
  apply_translations()
  renderExploreScreen(ui.explore_screen, application, playback, settings)
  renderEarGymScreen(ui.ear_gym_screen, playback, settings)
}
