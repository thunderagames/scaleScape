import type { ExploreApplication } from '../application/explore-application'
import type { PlaybackPort } from '../audio/playback-port'
import type { SettingsStore } from '../settings/settings-store'
import { createDiagnosticsLogger, type DiagnosticsPort } from '../observability/event-logger'
import { EXPLORE_HELP_CLOSE_EVENT, renderExploreScreen, type ExploreGuidedStartPort } from './explore-screen'
import { renderEarGymScreen } from './ear-gym-screen'
import { getVisiblePlaybackInstruments } from './visible-instruments'
import type { AppConfig, AppModuleFlags, AppScreen } from '../app-config'
import type { TempoBpm } from '../shared/tempo'
import { getGuitarTuningNote } from '../instruments/guitar-view-model'
import { getBassTuningNote } from '../instruments/bass-view-model'
import { getUkuleleTuningNote } from '../instruments/ukulele-view-model'
import { displayNoteName } from '../settings/note-naming'
import { submitFeedback } from '../integrations/web3forms'

export function renderAppShell(container: HTMLElement, application: ExploreApplication, playback: PlaybackPort, settings: SettingsStore, diagnostics: DiagnosticsPort = createDiagnosticsLogger(), config: AppConfig = { default_screen: 'explore', modules: { explore: true, ear_gym: false, guided_start: false } }): void {
  container.innerHTML = `
    <div class="app-shell">
      <header class="app-shell-header">
        <p id="shell-label" class="eyebrow"></p>
        <button id="toggle-navigation" class="control-button control-button--icon navigation-toggle" type="button" aria-controls="app-navigation" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
        <nav id="app-navigation" class="app-navigation" aria-label="Application navigation" data-open="false">
          <button id="navigate-explore" class="control-button control-button--navigation" type="button" aria-controls="explore-screen" aria-current="page"></button>
          <button id="navigate-ear-gym" class="control-button control-button--navigation" type="button" aria-controls="ear-gym-screen"></button>
          <button id="navigate-guided-start" class="control-button control-button--navigation" type="button" aria-controls="guided-start-screen"></button>
        </nav>
      </header>
      <button id="open-settings" class="control-button control-button--icon settings-trigger settings-floating" type="button" aria-haspopup="dialog"><svg class="settings-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.6 2.8h4.8l.7 2.1a7.7 7.7 0 0 1 1.7 1l2.1-.7 2.4 4.1-1.5 1.6c.1.4.1.8.1 1.1s0 .8-.1 1.2l1.5 1.6-2.4 4.1-2.1-.7a7.7 7.7 0 0 1-1.7 1l-.7 2.1H9.6l-.7-2.1a7.7 7.7 0 0 1-1.7-1l-2.1.7-2.4-4.1 1.5-1.6A7.8 7.8 0 0 1 4.1 12c0-.4 0-.8.1-1.2L2.7 9.2l2.4-4.1 2.1.7a7.7 7.7 0 0 1 1.7-1l.7-2.1Z"/><circle cx="12" cy="12" r="3.1"/></svg></button>
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
          <button id="start-guided" class="control-button control-button--primary" type="button"></button>
          <button id="explore-directly" class="control-button" type="button"></button>
        </div>
      </section>
      <div id="explore-screen"></div>
      <section id="ear-gym-screen" class="screen-placeholder" hidden></section>
      <footer id="app-footer" class="app-footer"><span id="footer-credit"></span><button id="open-feedback" class="control-button feedback-trigger" type="button" aria-haspopup="dialog"></button></footer>
      <dialog id="feedback-modal" class="feedback-modal" aria-labelledby="feedback-title"><form id="feedback-form" class="modal-form feedback-form"><div class="modal-heading"><h2 id="feedback-title"></h2><button id="close-feedback" class="control-button control-button--icon modal-close" type="button" aria-label=""><svg class="modal-close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><p id="feedback-intro" class="feedback-intro"></p><label class="modal-field" for="feedback-name"><span id="feedback-name-label"></span><input id="feedback-name" class="control-input" name="name" type="text" autocomplete="name" required /></label><label class="modal-field" for="feedback-email"><span id="feedback-email-label"></span><input id="feedback-email" class="control-input" name="email" type="email" autocomplete="email" required /></label><label class="modal-field" for="feedback-message"><span id="feedback-message-label"></span><textarea id="feedback-message" class="control-input feedback-message" name="message" rows="5" required></textarea></label><input name="botcheck" type="checkbox" tabindex="-1" aria-hidden="true" class="feedback-honeypot" /><p id="feedback-status" class="feedback-status" role="status" aria-live="polite"></p><div class="modal-actions"><button id="cancel-feedback" class="control-button" type="button"></button><button id="send-feedback" class="control-button control-button--primary" type="submit"></button></div></form></dialog>
      <dialog id="guitar-tuning-modal" class="guitar-tuning-modal" aria-labelledby="guitar-tuning-title"><form method="dialog" class="modal-form guitar-tuning-form"><div class="modal-heading"><h2 id="guitar-tuning-title"></h2><button id="close-guitar-tuning" class="control-button control-button--icon modal-close" type="button" aria-label=""><svg class="modal-close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><label id="guitar-tuning-value" class="guitar-tuning-value" for="raise-guitar-tuning"></label><div class="guitar-tuning-stepper"><button id="lower-guitar-tuning" class="control-button" type="button"></button><button id="raise-guitar-tuning" class="control-button" type="button"></button></div><div class="modal-actions"><button id="cancel-guitar-tuning" class="control-button" type="button"></button><button id="save-guitar-tuning" class="control-button control-button--primary" type="button"></button></div></form></dialog>
      <dialog id="settings-modal" class="settings-modal" aria-labelledby="settings-title"><form method="dialog" class="modal-form settings-form"><div class="modal-heading settings-heading"><h2 id="settings-title"></h2><button id="close-settings" class="control-button control-button--icon modal-close" type="button" aria-label=""><svg class="modal-close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="settings-fields"><label class="modal-field settings-field" for="language-select"><span id="language-label"></span><select id="language-select" class="control-select"></select></label><fieldset class="settings-group instrument-settings"><legend id="instrument-visibility-label"></legend><label class="settings-choice"><input id="show-piano" class="control-choice" type="checkbox"> <span id="show-piano-label"></span></label><label class="settings-choice"><input id="show-guitar" class="control-choice" type="checkbox"> <span id="show-guitar-label"></span></label></fieldset><fieldset class="settings-group context-settings"><legend id="context-label"></legend><label class="settings-choice"><input id="context-off" class="control-choice" type="radio" name="harmonic-context" value="off"><span id="context-off-label"></span></label><label class="settings-choice"><input id="context-drone" class="control-choice" type="radio" name="harmonic-context" value="drone"><span id="context-drone-label"></span></label><label class="settings-choice"><input id="context-pedal" class="control-choice" type="radio" name="harmonic-context" value="pedal"><span id="context-pedal-label"></span></label></fieldset><fieldset class="settings-group audio-settings"><legend id="audio-settings-label"></legend><label class="modal-field settings-field settings-volume-field" for="volume-control"><span id="volume-label"></span><input id="volume-control" class="control-range" type="range" min="0" max="1" step="0.05" /></label><button id="mute-audio" class="control-button" type="button"></button><span id="mute-status" role="status" aria-live="polite"></span></fieldset><fieldset class="settings-group diagnostics-settings"><legend id="diagnostics-settings-label"></legend><label id="diagnostics-mode-label" class="settings-choice" for="diagnostics-mode-control"><input id="diagnostics-mode-control" class="control-choice" type="checkbox" /><span id="diagnostics-mode-text"></span></label><button id="export-diagnostics" class="control-button" type="button"></button><span id="diagnostics-status" role="status" aria-live="polite"></span></fieldset></div><div class="modal-actions settings-actions"><button id="cancel-settings" class="control-button" type="button"></button><button id="save-settings" class="control-button control-button--primary" type="button"></button></div></form></dialog>
    </div>
  `

  const explore_screen = container.querySelector<HTMLElement>('#explore-screen')
  const ear_gym_screen = container.querySelector<HTMLElement>('#ear-gym-screen')
  const guided_start_screen = container.querySelector<HTMLElement>('#guided-start-screen')
  const navigate_explore = container.querySelector<HTMLButtonElement>('#navigate-explore')
  const navigate_ear_gym = container.querySelector<HTMLButtonElement>('#navigate-ear-gym')
  const navigate_guided_start = container.querySelector<HTMLButtonElement>('#navigate-guided-start')
  const toggle_navigation = container.querySelector<HTMLButtonElement>('#toggle-navigation')
  const open_settings = container.querySelector<HTMLButtonElement>('#open-settings')
  const shell_label = container.querySelector<HTMLElement>('#shell-label')
  const app_footer = container.querySelector<HTMLElement>('#app-footer')
  const footer_credit = container.querySelector<HTMLElement>('#footer-credit')
  const open_feedback = container.querySelector<HTMLButtonElement>('#open-feedback')
  const feedback_modal = container.querySelector<HTMLDialogElement>('#feedback-modal')
  const feedback_form = container.querySelector<HTMLFormElement>('#feedback-form')
  const close_feedback = container.querySelector<HTMLButtonElement>('#close-feedback')
  const cancel_feedback = container.querySelector<HTMLButtonElement>('#cancel-feedback')
  const feedback_name = container.querySelector<HTMLInputElement>('#feedback-name')
  const feedback_email = container.querySelector<HTMLInputElement>('#feedback-email')
  const feedback_message = container.querySelector<HTMLTextAreaElement>('#feedback-message')
  const send_feedback = container.querySelector<HTMLButtonElement>('#send-feedback')
  const feedback_status = container.querySelector<HTMLElement>('#feedback-status')
  const feedback_title = container.querySelector<HTMLElement>('#feedback-title')
  const feedback_intro = container.querySelector<HTMLElement>('#feedback-intro')
  const feedback_name_label = container.querySelector<HTMLElement>('#feedback-name-label')
  const feedback_email_label = container.querySelector<HTMLElement>('#feedback-email-label')
  const feedback_message_label = container.querySelector<HTMLElement>('#feedback-message-label')
  const guitar_tuning_modal = container.querySelector<HTMLDialogElement>('#guitar-tuning-modal')
  const guitar_tuning_title = container.querySelector<HTMLElement>('#guitar-tuning-title')
  const guitar_tuning_value = container.querySelector<HTMLElement>('#guitar-tuning-value')
  const close_guitar_tuning = container.querySelector<HTMLButtonElement>('#close-guitar-tuning')
  const cancel_guitar_tuning = container.querySelector<HTMLButtonElement>('#cancel-guitar-tuning')
  const save_guitar_tuning = container.querySelector<HTMLButtonElement>('#save-guitar-tuning')
  const lower_guitar_tuning = container.querySelector<HTMLButtonElement>('#lower-guitar-tuning')
  const raise_guitar_tuning = container.querySelector<HTMLButtonElement>('#raise-guitar-tuning')
  const audio_settings = container.querySelector<HTMLElement>('.audio-settings')
  const diagnostics_settings = container.querySelector<HTMLElement>('.diagnostics-settings')
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
  const settings_modal = container.querySelector<HTMLDialogElement>('#settings-modal')
  const close_settings = container.querySelector<HTMLButtonElement>('#close-settings')
  const cancel_settings = container.querySelector<HTMLButtonElement>('#cancel-settings')
  const save_settings = container.querySelector<HTMLButtonElement>('#save-settings')
  const language_select = container.querySelector<HTMLSelectElement>('#language-select')
  language_select?.closest('label')?.insertAdjacentHTML('afterend', '<label class="modal-field settings-field" for="note-naming-select"><span id="note-naming-label"></span><select id="note-naming-select" class="control-select"><option value="letter"></option><option value="solfege"></option></select></label><label class="modal-field settings-field" for="tempo-select"><span id="tempo-label"></span><select id="tempo-select" class="control-select"><option value="120">120 BPM</option><option value="150">150 BPM</option><option value="200">200 BPM</option></select></label>')
  container.querySelector<HTMLElement>('.instrument-settings')?.insertAdjacentHTML('beforeend', '<label class="settings-choice"><input id="show-bass" class="control-choice" type="checkbox"> <span id="show-bass-label"></span></label>')
  container.querySelector<HTMLElement>('.instrument-settings')?.insertAdjacentHTML('afterend', '<fieldset class="settings-group scale-description-settings"><legend id="scale-description-visibility-label"></legend><label class="settings-choice"><input id="show-scale-description" class="control-choice" type="checkbox"><span id="show-scale-description-label"></span></label></fieldset>')
  const guitar_visibility = container.querySelector<HTMLInputElement>('#show-guitar')?.closest('label')
  if (guitar_visibility) {
    const guitar_settings_row = document.createElement('div')
    guitar_settings_row.className = 'settings-choice-row'
    guitar_visibility.parentElement?.insertBefore(guitar_settings_row, guitar_visibility)
    guitar_settings_row.append(guitar_visibility)
    guitar_settings_row.insertAdjacentHTML('beforeend', '<button id="open-guitar-tuning" class="control-button guitar-tuning-trigger" type="button"></button>')
  }
   const bass_visibility = container.querySelector<HTMLInputElement>('#show-bass')?.closest('label')
   if (bass_visibility) {
    const bass_settings_row = document.createElement('div')
    bass_settings_row.className = 'settings-choice-row'
    bass_visibility.parentElement?.insertBefore(bass_settings_row, bass_visibility)
    bass_settings_row.append(bass_visibility)
     bass_settings_row.insertAdjacentHTML('beforeend', '<button id="open-bass-tuning" class="control-button guitar-tuning-trigger" type="button"></button>')
   }
   container.querySelector<HTMLElement>('.instrument-settings')?.insertAdjacentHTML('beforeend', '<label class="settings-choice"><input id="show-ukulele" class="control-choice" type="checkbox"> <span id="show-ukulele-label"></span></label>')
   const ukulele_visibility = container.querySelector<HTMLInputElement>('#show-ukulele')?.closest('label')
   if (ukulele_visibility) {
     const ukulele_settings_row = document.createElement('div')
     ukulele_settings_row.className = 'settings-choice-row'
     ukulele_visibility.parentElement?.insertBefore(ukulele_settings_row, ukulele_visibility)
     ukulele_settings_row.append(ukulele_visibility)
     ukulele_settings_row.insertAdjacentHTML('beforeend', '<button id="open-ukulele-tuning" class="control-button guitar-tuning-trigger" type="button"></button>')
   }
  const open_guitar_tuning = container.querySelector<HTMLButtonElement>('#open-guitar-tuning')
   const open_bass_tuning = container.querySelector<HTMLButtonElement>('#open-bass-tuning')
   const open_ukulele_tuning = container.querySelector<HTMLButtonElement>('#open-ukulele-tuning')
  const tempo_label = container.querySelector<HTMLElement>('#tempo-label')
  const tempo_select = container.querySelector<HTMLSelectElement>('#tempo-select')
  const note_naming_label = container.querySelector<HTMLElement>('#note-naming-label')
  const note_naming_select = container.querySelector<HTMLSelectElement>('#note-naming-select')
  const show_piano = container.querySelector<HTMLInputElement>('#show-piano')
  const show_guitar = container.querySelector<HTMLInputElement>('#show-guitar')
   const show_bass = container.querySelector<HTMLInputElement>('#show-bass')
   const show_ukulele = container.querySelector<HTMLInputElement>('#show-ukulele')
  const show_scale_description = container.querySelector<HTMLInputElement>('#show-scale-description')
  const context_label = container.querySelector<HTMLElement>('#context-label')
  const context_off = container.querySelector<HTMLInputElement>('#context-off')
  const context_drone = container.querySelector<HTMLInputElement>('#context-drone')
  const context_pedal = container.querySelector<HTMLInputElement>('#context-pedal')
  const context_off_label = container.querySelector<HTMLElement>('#context-off-label')
  const context_drone_label = container.querySelector<HTMLElement>('#context-drone-label')
  const context_pedal_label = container.querySelector<HTMLElement>('#context-pedal-label')
       if (!explore_screen || !ear_gym_screen || !guided_start_screen || !navigate_explore || !navigate_ear_gym || !navigate_guided_start || !toggle_navigation || !open_settings || !shell_label || !app_footer || !footer_credit || !open_feedback || !feedback_modal || !feedback_form || !close_feedback || !cancel_feedback || !feedback_name || !feedback_email || !feedback_message || !send_feedback || !feedback_status || !feedback_title || !feedback_intro || !feedback_name_label || !feedback_email_label || !feedback_message_label || !guitar_tuning_modal || !guitar_tuning_title || !guitar_tuning_value || !open_guitar_tuning || !open_bass_tuning || !open_ukulele_tuning || !close_guitar_tuning || !cancel_guitar_tuning || !save_guitar_tuning || !lower_guitar_tuning || !raise_guitar_tuning || !audio_settings || !diagnostics_settings || !volume_label || !volume_control || !tempo_label || !tempo_select || !mute_audio || !diagnostics_mode_label || !diagnostics_mode_control || !diagnostics_mode_text || !export_diagnostics || !mute_status || !diagnostics_status || !guided_start_label || !guided_start_title || !guided_start_intro || !guided_start_step_one || !guided_start_step_two || !guided_start_step_three || !start_guided || !explore_directly || !settings_modal || !close_settings || !cancel_settings || !save_settings || !language_select || !note_naming_label || !note_naming_select || !show_piano || !show_guitar || !show_bass || !show_ukulele || !show_scale_description || !context_label || !context_off || !context_drone || !context_pedal || !context_off_label || !context_drone_label || !context_pedal_label) throw new Error('Application shell elements were not found')
       const ui = { explore_screen, ear_gym_screen, guided_start_screen, navigate_explore, navigate_ear_gym, navigate_guided_start, toggle_navigation, open_settings, shell_label, app_footer, footer_credit, open_feedback, feedback_modal, feedback_form, close_feedback, cancel_feedback, feedback_name, feedback_email, feedback_message, send_feedback, feedback_status, feedback_title, feedback_intro, feedback_name_label, feedback_email_label, feedback_message_label, guitar_tuning_modal, guitar_tuning_title, guitar_tuning_value, open_guitar_tuning, open_bass_tuning, open_ukulele_tuning, close_guitar_tuning, cancel_guitar_tuning, save_guitar_tuning, lower_guitar_tuning, raise_guitar_tuning, audio_settings, diagnostics_settings, volume_label, volume_control, tempo_label, tempo_select, note_naming_label, note_naming_select, mute_audio, diagnostics_mode_label, diagnostics_mode_control, diagnostics_mode_text, export_diagnostics, mute_status, diagnostics_status, guided_start_label, guided_start_title, guided_start_intro, guided_start_step_one, guided_start_step_two, guided_start_step_three, start_guided, explore_directly, settings_modal, close_settings, cancel_settings, save_settings, language_select, show_piano, show_guitar, show_bass, show_ukulele, show_scale_description, context_label, context_off, context_drone, context_pedal, context_off_label, context_drone_label, context_pedal_label }

  const modules: AppModuleFlags = config.modules
  const default_screen: AppScreen = modules[config.default_screen] ? config.default_screen : modules.explore ? 'explore' : modules.ear_gym ? 'ear_gym' : 'guided_start'
  ui.navigate_explore.hidden = !modules.explore
  ui.navigate_ear_gym.hidden = !modules.ear_gym
  ui.navigate_guided_start.hidden = !modules.guided_start
  ui.guided_start_screen.hidden = !modules.guided_start
  ui.ear_gym_screen.hidden = !modules.ear_gym

  let current_screen: AppScreen = 'guided_start'
  let is_guided_progress_active = false
  let guided_progress: HTMLElement | null = null
  let guided_progress_text: HTMLElement | null = null
  let guided_progress_action: HTMLButtonElement | null = null
   let pending_tuning_instrument: 'guitar' | 'bass' | 'ukulele' = 'guitar'
  let pending_tuning_semitones = settings.getSettings().guitar_tuning_semitones

  function apply_translations(): void {
    const translation = settings.getTranslations()
    const note_naming = settings.getSettings().note_naming
    const guitar_tuning_semitones = settings.getSettings().guitar_tuning_semitones
    const bass_tuning_semitones = settings.getSettings().bass_tuning_semitones
    const ukulele_tuning_semitones = settings.getSettings().ukulele_tuning_semitones
    const active_tuning_semitones = pending_tuning_instrument === 'guitar' ? guitar_tuning_semitones : pending_tuning_instrument === 'bass' ? bass_tuning_semitones : ukulele_tuning_semitones
    const active_tuning_note = displayNoteName(pending_tuning_instrument === 'guitar' ? getGuitarTuningNote(active_tuning_semitones) : pending_tuning_instrument === 'bass' ? getBassTuningNote(active_tuning_semitones) : getUkuleleTuningNote(active_tuning_semitones), note_naming)
    const display_guitar_tuning_note = displayNoteName(getGuitarTuningNote(guitar_tuning_semitones), note_naming)
    const display_bass_tuning_note = displayNoteName(getBassTuningNote(bass_tuning_semitones), note_naming)
    const display_ukulele_tuning_note = displayNoteName(getUkuleleTuningNote(ukulele_tuning_semitones), note_naming)
    ui.shell_label.textContent = translation.app_label
     ui.footer_credit.textContent = translation.footer_credit
     ui.open_feedback.textContent = translation.feedback
     ui.open_feedback.setAttribute('aria-label', translation.feedback)
     ui.feedback_title.textContent = translation.feedback_title
     ui.feedback_intro.textContent = translation.feedback_intro
     ui.feedback_name_label.textContent = translation.feedback_name
     ui.feedback_email_label.textContent = translation.feedback_email
     ui.feedback_message_label.textContent = translation.feedback_message
     ui.close_feedback.setAttribute('aria-label', translation.close)
     ui.cancel_feedback.textContent = translation.close
     ui.send_feedback.textContent = translation.send_feedback
     ui.open_guitar_tuning.setAttribute('aria-label', `${translation.guitar_tuning}: ${display_guitar_tuning_note}`)
     ui.open_guitar_tuning.title = translation.guitar_tuning
      ui.guitar_tuning_title.textContent = pending_tuning_instrument === 'guitar' ? translation.guitar_tuning : pending_tuning_instrument === 'bass' ? translation.bass_tuning : translation.ukulele_tuning
     ui.open_guitar_tuning.textContent = translation.tuner
     ui.guitar_tuning_value.textContent = `${active_tuning_note} · ${active_tuning_semitones > 0 ? '+' : ''}${active_tuning_semitones} ${translation.guitar_tuning_semitones}`
     ui.open_bass_tuning.setAttribute('aria-label', `${translation.bass_tuning}: ${display_bass_tuning_note}`)
     ui.open_bass_tuning.title = translation.bass_tuning
     ui.open_bass_tuning.textContent = translation.tuner
     ui.open_ukulele_tuning.setAttribute('aria-label', `${translation.ukulele_tuning}: ${display_ukulele_tuning_note}`)
     ui.open_ukulele_tuning.title = translation.ukulele_tuning
     ui.open_ukulele_tuning.textContent = translation.tuner
    ui.lower_guitar_tuning.textContent = '−'
    ui.raise_guitar_tuning.textContent = '+'
    ui.lower_guitar_tuning.setAttribute('aria-label', translation.lower_tuning)
    ui.raise_guitar_tuning.setAttribute('aria-label', translation.raise_tuning)
    ui.close_guitar_tuning.setAttribute('aria-label', translation.close)
    ui.cancel_guitar_tuning.textContent = translation.close
    ui.save_guitar_tuning.textContent = translation.save
    ui.navigate_explore.textContent = translation.nav_explore
    ui.navigate_ear_gym.textContent = translation.nav_ear_gym
    ui.navigate_guided_start.textContent = translation.nav_guided_start
    ui.navigate_explore.setAttribute('aria-label', translation.nav_explore)
    ui.navigate_ear_gym.setAttribute('aria-label', translation.nav_ear_gym)
    ui.navigate_guided_start.setAttribute('aria-label', translation.nav_guided_start)
    ui.toggle_navigation.setAttribute('aria-label', translation.toggle_navigation)
    ui.toggle_navigation.title = translation.toggle_navigation
    ui.open_settings.setAttribute('aria-label', translation.settings)
    ui.open_settings.title = translation.settings
    ui.audio_settings.setAttribute('aria-label', translation.audio_controls)
    ui.volume_label.textContent = translation.volume
    ui.volume_control.setAttribute('aria-label', translation.volume)
    ui.tempo_label.textContent = translation.tempo
    ui.tempo_select.innerHTML = `<option value="120">${translation.tempo_120}</option><option value="150">${translation.tempo_150}</option><option value="200">${translation.tempo_200}</option>`
    ui.tempo_select.value = String(settings.getSettings().tempo_bpm)
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
     ui.close_settings.setAttribute('aria-label', translation.close)
     ui.close_settings.title = translation.close
    ui.settings_modal.querySelector<HTMLElement>('#settings-title')!.textContent = translation.settings_title
    ui.language_select.innerHTML = `<option value="en">${translation.english}</option><option value="es">${translation.spanish}</option>`
    ui.language_select.value = settings.getSettings().language
    ui.note_naming_label.textContent = translation.note_naming_label
    ui.note_naming_select.innerHTML = `<option value="letter">${translation.note_naming_letter}</option><option value="solfege">${translation.note_naming_solfege}</option>`
    ui.note_naming_select.value = settings.getSettings().note_naming
    ui.show_piano.checked = settings.getSettings().show_piano
    ui.show_guitar.checked = settings.getSettings().show_guitar
     ui.show_bass.checked = settings.getSettings().show_bass
     ui.show_ukulele.checked = settings.getSettings().show_ukulele
     ui.show_scale_description.checked = settings.getSettings().show_scale_description
    ui.context_label.textContent = translation.context
    ui.context_off_label.textContent = translation.context_off
    ui.context_drone_label.textContent = translation.context_drone
    ui.context_pedal_label.textContent = translation.context_pedal
    ui.context_off.checked = playback.getPlaybackState().context === 'off'
    ui.context_drone.checked = playback.getPlaybackState().context === 'drone'
    ui.context_pedal.checked = playback.getPlaybackState().context === 'pedal'
    ui.settings_modal.querySelector<HTMLElement>('#language-label')!.textContent = translation.language
    ui.settings_modal.querySelector<HTMLElement>('#instrument-visibility-label')!.textContent = translation.instrument_visibility
    ui.settings_modal.querySelector<HTMLElement>('#show-piano-label')!.textContent = translation.show_piano
    ui.settings_modal.querySelector<HTMLElement>('#show-guitar-label')!.textContent = translation.show_guitar
     ui.settings_modal.querySelector<HTMLElement>('#show-bass-label')!.textContent = translation.show_bass
     ui.settings_modal.querySelector<HTMLElement>('#show-ukulele-label')!.textContent = translation.show_ukulele
     ui.settings_modal.querySelector<HTMLElement>('#scale-description-visibility-label')!.textContent = translation.scale_description_visibility
     ui.settings_modal.querySelector<HTMLElement>('#show-scale-description-label')!.textContent = translation.show_scale_description
    ui.settings_modal.querySelector<HTMLElement>('#audio-settings-label')!.textContent = translation.audio_controls
    ui.settings_modal.querySelector<HTMLElement>('#diagnostics-settings-label')!.textContent = translation.diagnostics_mode
    ui.cancel_settings.textContent = translation.close
    ui.save_settings.textContent = translation.save
  }

  function show_screen(screen: AppScreen): void {
    set_navigation_open(false)
    current_screen = screen
    ui.guided_start_screen.hidden = current_screen !== 'guided_start'
    const is_explore = current_screen === 'explore'
    const is_guided_start = current_screen === 'guided_start'
    const is_ear_gym = current_screen === 'ear_gym'
    ui.explore_screen.hidden = !is_explore
    ui.ear_gym_screen.hidden = !is_ear_gym
    ui.guided_start_screen.hidden = !is_guided_start
    ui.navigate_explore.setAttribute('aria-current', is_explore ? 'page' : 'false')
    ui.navigate_ear_gym.setAttribute('aria-current', is_ear_gym ? 'page' : 'false')
    ui.navigate_guided_start.setAttribute('aria-current', is_guided_start ? 'page' : 'false')
    const active_control = is_guided_start ? ui.start_guided : is_explore ? ui.navigate_explore : ui.navigate_ear_gym
    active_control.focus()
  }

  function set_navigation_open(is_open: boolean): void {
    ui.toggle_navigation.setAttribute('aria-expanded', String(is_open))
    container.querySelector<HTMLElement>('#app-navigation')?.setAttribute('data-open', String(is_open))
  }

  ui.navigate_explore.addEventListener('click', () => show_screen('explore'))
  ui.navigate_ear_gym.addEventListener('click', () => show_screen('ear_gym'))
  ui.navigate_guided_start.addEventListener('click', () => show_screen('guided_start'))
  ui.toggle_navigation.addEventListener('click', () => set_navigation_open(ui.toggle_navigation.getAttribute('aria-expanded') !== 'true'))
  const open_settings_dialog = () => {
    document.dispatchEvent(new Event(EXPLORE_HELP_CLOSE_EVENT))
    apply_translations()
    if (typeof ui.settings_modal.showModal === 'function') ui.settings_modal.showModal()
    else ui.settings_modal.setAttribute('open', '')
  }
    const update_tuning_value = () => {
       const tuning_note = displayNoteName(pending_tuning_instrument === 'guitar' ? getGuitarTuningNote(pending_tuning_semitones) : pending_tuning_instrument === 'bass' ? getBassTuningNote(pending_tuning_semitones) : getUkuleleTuningNote(pending_tuning_semitones), settings.getSettings().note_naming)
      ui.guitar_tuning_value.textContent = `${tuning_note} · ${pending_tuning_semitones > 0 ? '+' : ''}${pending_tuning_semitones} ${settings.getTranslations().guitar_tuning_semitones}`
   }
   const close_tuning_dialog = () => { if (typeof ui.guitar_tuning_modal.close === 'function') ui.guitar_tuning_modal.close(); else ui.guitar_tuning_modal.removeAttribute('open'); (pending_tuning_instrument === 'guitar' ? ui.open_guitar_tuning : pending_tuning_instrument === 'bass' ? ui.open_bass_tuning : ui.open_ukulele_tuning).focus() }
   const open_tuning_dialog = (instrument: 'guitar' | 'bass' | 'ukulele') => { pending_tuning_instrument = instrument; pending_tuning_semitones = instrument === 'guitar' ? settings.getSettings().guitar_tuning_semitones : instrument === 'bass' ? settings.getSettings().bass_tuning_semitones : settings.getSettings().ukulele_tuning_semitones; apply_translations(); if (typeof ui.guitar_tuning_modal.showModal === 'function') ui.guitar_tuning_modal.showModal(); else ui.guitar_tuning_modal.setAttribute('open', '') }
   ui.open_guitar_tuning.addEventListener('click', () => open_tuning_dialog('guitar'))
   ui.open_bass_tuning.addEventListener('click', () => open_tuning_dialog('bass'))
   ui.open_ukulele_tuning.addEventListener('click', () => open_tuning_dialog('ukulele'))
   ui.lower_guitar_tuning.addEventListener('click', () => { pending_tuning_semitones = Math.max(-12, pending_tuning_semitones - 1); update_tuning_value() })
   ui.raise_guitar_tuning.addEventListener('click', () => { pending_tuning_semitones = Math.min(12, pending_tuning_semitones + 1); update_tuning_value() })
   ui.close_guitar_tuning.addEventListener('click', close_tuning_dialog)
   ui.cancel_guitar_tuning.addEventListener('click', close_tuning_dialog)
   ui.save_guitar_tuning.addEventListener('click', () => { const next_settings = pending_tuning_instrument === 'guitar' ? { ...settings.getSettings(), guitar_tuning_semitones: pending_tuning_semitones } : pending_tuning_instrument === 'bass' ? { ...settings.getSettings(), bass_tuning_semitones: pending_tuning_semitones } : { ...settings.getSettings(), ukulele_tuning_semitones: pending_tuning_semitones }; settings.setSettings(next_settings); close_tuning_dialog() })
  ui.open_settings.addEventListener('click', open_settings_dialog)
  const close_feedback_dialog = () => {
    if (typeof ui.feedback_modal.close === 'function') ui.feedback_modal.close()
    else ui.feedback_modal.removeAttribute('open')
    ui.open_feedback.focus()
  }
  ui.open_feedback.addEventListener('click', () => {
    ui.feedback_status.textContent = ''
    if (typeof ui.feedback_modal.showModal === 'function') ui.feedback_modal.showModal()
    else ui.feedback_modal.setAttribute('open', '')
    ui.feedback_name.focus()
  })
  ui.close_feedback.addEventListener('click', close_feedback_dialog)
  ui.cancel_feedback.addEventListener('click', close_feedback_dialog)
  ui.feedback_form.addEventListener('submit', async (event) => {
    event.preventDefault()
    ui.send_feedback.disabled = true
    ui.send_feedback.textContent = settings.getTranslations().feedback_sending
    const result = await submitFeedback({ name: ui.feedback_name.value.trim(), email: ui.feedback_email.value.trim(), message: ui.feedback_message.value.trim() }, import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? '')
    ui.send_feedback.disabled = false
    ui.send_feedback.textContent = settings.getTranslations().send_feedback
    ui.feedback_status.textContent = result.ok ? settings.getTranslations().feedback_sent : result.reason === 'not_configured' ? settings.getTranslations().feedback_not_configured : settings.getTranslations().feedback_error
    if (result.ok) {
      ui.feedback_form.reset()
      window.setTimeout(close_feedback_dialog, 1200)
    }
  })
  const close_settings_dialog = () => {
    if (typeof ui.settings_modal.close === 'function') ui.settings_modal.close()
    else ui.settings_modal.removeAttribute('open')
    ui.open_settings.focus()
  }
  ui.close_settings.addEventListener('click', close_settings_dialog)
  ui.cancel_settings.addEventListener('click', close_settings_dialog)
  ui.save_settings.addEventListener('click', () => {
    const context = ui.context_drone.checked ? 'drone' : ui.context_pedal.checked ? 'pedal' : 'off'
    const tempo_bpm = Number(ui.tempo_select.value) as TempoBpm
    settings.setSettings({ ...settings.getSettings(), language: ui.language_select.value as 'en' | 'es', note_naming: ui.note_naming_select.value as 'letter' | 'solfege', show_piano: ui.show_piano.checked, show_guitar: ui.show_guitar.checked, show_bass: ui.show_bass.checked, show_ukulele: ui.show_ukulele.checked, show_scale_description: ui.show_scale_description.checked, tempo_bpm })
    playback.setTempo(tempo_bpm)
    void playback.setContext(application.getState().root_pitch_class, context)
    close_settings_dialog()
  })
  ui.explore_directly.addEventListener('click', () => show_screen('explore'))
  ui.start_guided.addEventListener('click', async () => {
    const state = application.getState()
    diagnostics.log('application.guided_start_entered', { entry_source: 'FIRST_VISIT' })
    const context_result = await playback.setContext(state.root_pitch_class, 'drone')
    show_screen('explore')
    if (!context_result.ok) return
    const playback_result = await playback.playScale(state.scale_instance, getVisiblePlaybackInstruments(settings))
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
  playback.setTempo(settings.getSettings().tempo_bpm)
  playback.setVolume(settings.getSettings().volume)
  ui.volume_control.value = String(settings.getSettings().volume)
  ui.volume_control.addEventListener('input', () => { const volume = Number(ui.volume_control.value); playback.setVolume(volume); settings.setSettings({ ...settings.getSettings(), volume }) })
  ui.mute_audio.addEventListener('click', () => playback.setMuted(!playback.getPlaybackState().is_muted))
  ui.diagnostics_mode_control.addEventListener('change', () => diagnostics.setEnabled(ui.diagnostics_mode_control.checked))
  settings.subscribe(apply_translations)
  playback.subscribePlaybackState(apply_translations)
  application.subscribe((state) => { const context = playback.getPlaybackState().context; void playback.setContext(state.root_pitch_class, context) })
  apply_translations()
  show_screen(default_screen)
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
  if (modules.ear_gym) renderEarGymScreen(ui.ear_gym_screen, playback, settings, diagnostics)
}
