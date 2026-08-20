import type { ExploreApplication } from '../application/explore-application'
import type { PlaybackPort } from '../audio/playback-port'
import type { SettingsStore } from '../settings/settings-store'
import { createDiagnosticsLogger, type DiagnosticsPort } from '../observability/event-logger'
import { renderExploreScreen, type ExploreGuidedStartPort } from './explore-screen'
import { renderEarGymScreen } from './ear-gym-screen'

export type AppScreen = 'guided_start' | 'explore' | 'ear_gym'

export function renderAppShell(container: HTMLElement, application: ExploreApplication, playback: PlaybackPort, settings: SettingsStore, diagnostics: DiagnosticsPort = createDiagnosticsLogger()): void {
  container.innerHTML = `
    <div class="app-shell">
      <header class="app-shell-header">
        <p id="shell-label" class="eyebrow"></p>
        <nav id="app-navigation" class="app-navigation" aria-label="Application navigation">
          <button id="navigate-explore" type="button" aria-controls="explore-screen" aria-current="page"></button>
          <button id="navigate-ear-gym" type="button" aria-controls="ear-gym-screen"></button>
          <button id="navigate-guided-start" type="button" aria-controls="guided-start-screen"></button>
        </nav>
        <div id="audio-controls" class="audio-controls" role="group">
          <label id="context-label" for="context-control"></label>
          <select id="context-control"></select>
          <label id="volume-label" for="volume-control"></label>
          <input id="volume-control" type="range" min="0" max="1" step="0.05" />
          <button id="mute-audio" type="button"></button>
          <label id="diagnostics-mode-label"><input id="diagnostics-mode-control" type="checkbox" /><span id="diagnostics-mode-text"></span></label>
          <button id="export-diagnostics" type="button"></button>
          <span id="mute-status" role="status" aria-live="polite"></span>
          <span id="diagnostics-status" role="status" aria-live="polite"></span>
        </div>
      </header>
      <section id="guided-start-screen" class="guided-start-screen" aria-labelledby="guided-start-title">
        <p id="guided-start-label" class="eyebrow"></p>
        <h1 id="guided-start-title"></h1>
        <p id="guided-start-intro" class="guided-start-intro"></p>
        <ol id="guided-start-steps" class="guided-start-steps">
          <li id="guided-start-step-one"></li>
          <li id="guided-start-step-two"></li>
          <li id="guided-start-step-three"></li>
        </ol>
        <div class="guided-start-actions">
          <button id="start-guided" type="button"></button>
          <button id="explore-directly" type="button"></button>
        </div>
        <p id="guided-start-status" role="status" aria-live="polite"></p>
      </section>
      <div id="explore-screen"></div>
      <section id="ear-gym-screen" class="screen-placeholder" hidden></section>
    </div>
  `

  const explore_screen = container.querySelector<HTMLElement>('#explore-screen')
  const ear_gym_screen = container.querySelector<HTMLElement>('#ear-gym-screen')
  const guided_start_screen = container.querySelector<HTMLElement>('#guided-start-screen')
  const navigate_explore = container.querySelector<HTMLButtonElement>('#navigate-explore')
  const navigate_ear_gym = container.querySelector<HTMLButtonElement>('#navigate-ear-gym')
  const navigate_guided_start = container.querySelector<HTMLButtonElement>('#navigate-guided-start')
  const shell_label = container.querySelector<HTMLElement>('#shell-label')
  const audio_controls = container.querySelector<HTMLElement>('#audio-controls')
  const context_label = container.querySelector<HTMLElement>('#context-label')
  const context_control = container.querySelector<HTMLSelectElement>('#context-control')
  const volume_label = container.querySelector<HTMLElement>('#volume-label')
  const volume_control = container.querySelector<HTMLInputElement>('#volume-control')
  const mute_audio = container.querySelector<HTMLButtonElement>('#mute-audio')
  const diagnostics_mode_label = container.querySelector<HTMLLabelElement>('#diagnostics-mode-label')
  const diagnostics_mode_control = container.querySelector<HTMLInputElement>('#diagnostics-mode-control')
  const diagnostics_mode_text = container.querySelector<HTMLElement>('#diagnostics-mode-text')
  const export_diagnostics = container.querySelector<HTMLButtonElement>('#export-diagnostics')
  const mute_status = container.querySelector<HTMLElement>('#mute-status')
  const diagnostics_status = container.querySelector<HTMLElement>('#diagnostics-status')
  const guided_start_label = container.querySelector<HTMLElement>('#guided-start-label')
  const guided_start_title = container.querySelector<HTMLElement>('#guided-start-title')
  const guided_start_intro = container.querySelector<HTMLElement>('#guided-start-intro')
  const guided_start_step_one = container.querySelector<HTMLElement>('#guided-start-step-one')
  const guided_start_step_two = container.querySelector<HTMLElement>('#guided-start-step-two')
  const guided_start_step_three = container.querySelector<HTMLElement>('#guided-start-step-three')
  const start_guided = container.querySelector<HTMLButtonElement>('#start-guided')
  const explore_directly = container.querySelector<HTMLButtonElement>('#explore-directly')
  const guided_start_status = container.querySelector<HTMLElement>('#guided-start-status')
  if (!explore_screen || !ear_gym_screen || !guided_start_screen || !navigate_explore || !navigate_ear_gym || !navigate_guided_start || !shell_label || !audio_controls || !context_label || !context_control || !volume_label || !volume_control || !mute_audio || !diagnostics_mode_label || !diagnostics_mode_control || !diagnostics_mode_text || !export_diagnostics || !mute_status || !diagnostics_status || !guided_start_label || !guided_start_title || !guided_start_intro || !guided_start_step_one || !guided_start_step_two || !guided_start_step_three || !start_guided || !explore_directly || !guided_start_status) throw new Error('Application shell elements were not found')
  const ui = { explore_screen, ear_gym_screen, guided_start_screen, navigate_explore, navigate_ear_gym, navigate_guided_start, shell_label, audio_controls, context_label, context_control, volume_label, volume_control, mute_audio, diagnostics_mode_label, diagnostics_mode_control, diagnostics_mode_text, export_diagnostics, mute_status, diagnostics_status, guided_start_label, guided_start_title, guided_start_intro, guided_start_step_one, guided_start_step_two, guided_start_step_three, start_guided, explore_directly, guided_start_status }

  let current_screen: AppScreen = 'guided_start'
  let is_guided_progress_active = false
  let guided_progress: HTMLElement | null = null
  let guided_progress_text: HTMLElement | null = null
  let guided_progress_action: HTMLButtonElement | null = null

  function apply_translations(): void {
    const translation = settings.getTranslations()
    ui.shell_label.textContent = translation.app_label
    ui.navigate_explore.textContent = translation.nav_explore
    ui.navigate_ear_gym.textContent = translation.nav_ear_gym
    ui.navigate_guided_start.textContent = translation.nav_guided_start
    ui.navigate_explore.setAttribute('aria-label', translation.nav_explore)
    ui.navigate_ear_gym.setAttribute('aria-label', translation.nav_ear_gym)
    ui.navigate_guided_start.setAttribute('aria-label', translation.nav_guided_start)
    ui.audio_controls.setAttribute('aria-label', translation.audio_controls)
    ui.context_label.textContent = translation.context
    ui.context_control.setAttribute('aria-label', translation.context)
    ui.context_control.innerHTML = `<option value="off">${translation.context_off}</option><option value="drone">${translation.context_drone}</option><option value="pedal">${translation.context_pedal}</option>`
    ui.context_control.value = playback.getPlaybackState().context
    ui.volume_label.textContent = translation.volume
    ui.volume_control.setAttribute('aria-label', translation.volume)
    ui.mute_audio.textContent = playback.getPlaybackState().is_muted ? translation.unmute : translation.mute
    ui.mute_audio.setAttribute('aria-label', ui.mute_audio.textContent)
    ui.mute_status.textContent = playback.getPlaybackState().is_muted ? translation.muted : ''
    ui.export_diagnostics.textContent = translation.export_diagnostics
    ui.export_diagnostics.setAttribute('aria-label', translation.export_diagnostics)
    ui.diagnostics_mode_label.setAttribute('aria-label', translation.diagnostics_mode)
    ui.diagnostics_mode_text.textContent = translation.diagnostics_mode
    ui.diagnostics_mode_control.checked = diagnostics.isEnabled()
    ui.guided_start_label.textContent = translation.guided_start
    ui.guided_start_title.textContent = translation.guided_start_title
    ui.guided_start_intro.textContent = translation.guided_start_intro
    ui.guided_start_step_one.textContent = translation.guided_start_step_one
    ui.guided_start_step_two.textContent = translation.guided_start_step_two
    ui.guided_start_step_three.textContent = translation.guided_start_step_three
    ui.start_guided.textContent = translation.start_guided
    ui.explore_directly.textContent = translation.explore_directly
  }

  function show_screen(screen: AppScreen): void {
    current_screen = screen
    ui.guided_start_screen.hidden = current_screen !== 'guided_start'
    const is_explore = current_screen === 'explore'
    const is_guided_start = current_screen === 'guided_start'
    ui.explore_screen.hidden = !is_explore
    ui.ear_gym_screen.hidden = is_explore
    ui.guided_start_screen.hidden = !is_guided_start
    ui.navigate_explore.setAttribute('aria-current', is_explore ? 'page' : 'false')
    ui.navigate_ear_gym.setAttribute('aria-current', current_screen === 'ear_gym' ? 'page' : 'false')
    ui.navigate_guided_start.setAttribute('aria-current', is_guided_start ? 'page' : 'false')
    const active_control = is_guided_start ? ui.start_guided : is_explore ? ui.navigate_explore : ui.navigate_ear_gym
    active_control.focus()
  }

  ui.navigate_explore.addEventListener('click', () => show_screen('explore'))
  ui.navigate_ear_gym.addEventListener('click', () => show_screen('ear_gym'))
  ui.navigate_guided_start.addEventListener('click', () => show_screen('guided_start'))
  ui.explore_directly.addEventListener('click', () => show_screen('explore'))
  ui.start_guided.addEventListener('click', async () => {
    const state = application.getState()
    diagnostics.log('application.guided_start_entered', { entry_source: 'FIRST_VISIT' })
    const context_result = await playback.setContext(state.root_pitch_class, 'drone')
    show_screen('explore')
    if (!context_result.ok) return
    const playback_result = await playback.playScale(state.scale_instance)
    if (playback_result.ok) {
      settings.setSettings({ ...settings.getSettings(), guided_start_completed: true })
      is_guided_progress_active = true
      if (guided_progress && guided_progress_text && guided_progress_action) {
        guided_progress.hidden = false
        guided_progress_text.textContent = settings.getTranslations().guided_step_select
        guided_progress_action.hidden = true
      }
      diagnostics.log('application.guided_start_completed', { final_step_id: 'scale_playback' })
    }
    const audio_status = container.querySelector<HTMLElement>('#audio-status')
    if (audio_status) audio_status.textContent = playback_result.ok ? settings.getTranslations().guided_start_playing : settings.getTranslations().audio_unavailable
  })
  ui.export_diagnostics.addEventListener('click', () => {
    const result = diagnostics.exportJsonl()
    if (!result.ok || result.content === undefined) {
      ui.diagnostics_status.textContent = settings.getTranslations().diagnostics_unavailable
      return
    }
    const download_url = URL.createObjectURL(new Blob([result.content], { type: 'application/x-ndjson' }))
    const link = document.createElement('a')
    link.href = download_url
    link.download = 'scalescape-diagnostics.jsonl'
    link.click()
    URL.revokeObjectURL(download_url)
    ui.diagnostics_status.textContent = settings.getTranslations().diagnostics_exported
  })
  ui.context_control.addEventListener('change', () => { const context = ui.context_control.value as 'off' | 'drone' | 'pedal'; const root_pitch_class = application.getState().root_pitch_class; void playback.setContext(root_pitch_class, context) })
  playback.setVolume(settings.getSettings().volume)
  ui.volume_control.value = String(settings.getSettings().volume)
  ui.volume_control.addEventListener('input', () => { const volume = Number(ui.volume_control.value); playback.setVolume(volume); settings.setSettings({ ...settings.getSettings(), volume }) })
  ui.mute_audio.addEventListener('click', () => playback.setMuted(!playback.getPlaybackState().is_muted))
  ui.diagnostics_mode_control.addEventListener('change', () => diagnostics.setEnabled(ui.diagnostics_mode_control.checked))
  settings.subscribe(apply_translations)
  playback.subscribePlaybackState(apply_translations)
  application.subscribe((state) => { const context = playback.getPlaybackState().context; if (context !== 'off') void playback.setContext(state.root_pitch_class, context) })
  apply_translations()
  show_screen(settings.getSettings().guided_start_completed ? 'explore' : 'guided_start')
  const guided_start_port: ExploreGuidedStartPort = {
    on_characteristic_note_selected: () => {
      if (!is_guided_progress_active || !guided_progress_text || !guided_progress_action) return
      guided_progress_text.textContent = settings.getTranslations().guided_step_compare
      guided_progress_action.textContent = settings.getTranslations().guided_open_ear_gym
      guided_progress_action.hidden = false
    }
  }
  renderExploreScreen(ui.explore_screen, application, playback, settings, diagnostics, guided_start_port)
  guided_progress_text = ui.explore_screen.querySelector<HTMLElement>('#guided-progress-text')
  guided_progress_action = ui.explore_screen.querySelector<HTMLButtonElement>('#guided-progress-action')
  guided_progress = ui.explore_screen.querySelector<HTMLElement>('#guided-progress')
  guided_progress_action?.addEventListener('click', () => show_screen('ear_gym'))
  renderEarGymScreen(ui.ear_gym_screen, playback, settings, diagnostics)
}
