import { create_comparison_audio, get_audio_variant } from './audio/comparison-audio'
import {
  answer_transfer,
  create_learning_loop_state,
  get_characteristic_caption,
  reveal_comparison,
  select_changed_note,
  start_transfer as start_transfer_state,
  type DegreeCandidate,
  type LearningLoopState
} from './domain/learning-loop'
import { create_guitar_view_model } from '../../poc-2-shared-instruments/src/instruments/guitar'
import { create_piano_view_model } from '../../poc-2-shared-instruments/src/instruments/piano'
import { create_settings_store, type SettingsStore } from './settings/settings'
import type { Language } from './settings/localization'
import './styles.css'

const app = document.querySelector<HTMLElement>('#app')
if (!app) {
  throw new Error('Application root was not found')
}

const audio = create_comparison_audio()
const settings_store: SettingsStore = create_settings_store()
let state = create_learning_loop_state()

app.innerHTML = `
  <main class="poc-shell">
    <header class="poc-header">
      <p class="eyebrow" id="phase-label">ScaleScape Phase-0 POC 3</p>
      <div class="title-row">
        <h1 id="app-title"></h1>
        <button id="open-settings" class="settings-trigger" type="button" aria-haspopup="dialog"></button>
      </div>
      <p class="intro" id="app-intro"></p>
    </header>
    <section class="progress-card" aria-label="Learning progress">
      <div class="progress-step active" data-step="listen"><span id="step-listen"></span><span class="help-cluster"><button class="help-button" type="button" aria-expanded="false" aria-controls="help-listen">?</button><span class="help-copy" id="help-listen"></span></span></div>
      <div class="progress-step" data-step="identify"><span id="step-identify"></span><span class="help-cluster"><button class="help-button" type="button" aria-expanded="false" aria-controls="help-identify">?</button><span class="help-copy" id="help-identify"></span></span></div>
      <div class="progress-step" data-step="reveal"><span id="step-reveal"></span><span class="help-cluster"><button class="help-button" type="button" aria-expanded="false" aria-controls="help-reveal">?</button><span class="help-copy" id="help-reveal"></span></span></div>
      <div class="progress-step" data-step="transfer"><span id="step-transfer"></span><span class="help-cluster"><button class="help-button" type="button" aria-expanded="false" aria-controls="help-transfer">?</button><span class="help-copy" id="help-transfer"></span></span></div>
    </section>
    <section class="exercise-card" aria-labelledby="exercise-title">
      <div class="exercise-heading">
        <div>
          <p class="eyebrow" id="guided-comparison"></p>
          <h2 id="exercise-title"></h2>
          <p class="degree-intro" id="degree-intro"></p>
          <p class="degree-example" id="degree-example"></p>
        </div>
        <span id="audio-status" role="status"></span>
      </div>
      <div class="audio-actions">
        <div class="control-with-help"><button id="play-a" type="button"></button><span class="help-cluster"><button class="help-button" type="button" aria-expanded="false" aria-controls="help-play-a">?</button><span class="help-copy" id="help-play-a"></span></span></div>
        <div class="control-with-help"><button id="play-b" type="button"></button><span class="help-cluster"><button class="help-button" type="button" aria-expanded="false" aria-controls="help-play-b">?</button><span class="help-copy" id="help-play-b"></span></span></div>
        <div class="control-with-help"><button id="play-difference" type="button"></button><span class="help-cluster"><button class="help-button" type="button" aria-expanded="false" aria-controls="help-play-difference">?</button><span class="help-copy" id="help-play-difference"></span></span></div>
      </div>
      <p id="prompt" class="prompt"></p>
      <div id="answer-area"></div>
      <p id="feedback" class="feedback" aria-live="polite"></p>
    </section>
    <section class="reveal-card" id="reveal-card" aria-labelledby="reveal-title" hidden>
      <p class="eyebrow" id="theory-after-experience"></p>
      <h2 id="reveal-title"></h2>
      <span class="help-cluster section-help"><button class="help-button" type="button" aria-expanded="false" aria-controls="help-reveal-content">?</button><span class="help-copy" id="help-reveal-content"></span></span>
      <p id="reveal-context" class="reveal-context"></p>
      <p id="reveal-caption"></p>
      <div class="comparison-notes">
        <div><span id="natural-minor-label"></span><strong id="minor-note"></strong></div>
        <div><span id="dorian-label"></span><strong id="dorian-note"></strong></div>
      </div>
      <div class="instrument-maps">
        <div><h3 id="piano-label"></h3><div id="piano-map" class="piano-map"></div></div>
        <div><h3 id="guitar-label"></h3><div id="guitar-map" class="guitar-map"></div></div>
      </div>
      <div class="control-with-help"><button id="start-transfer" type="button"></button><span class="help-cluster"><button class="help-button" type="button" aria-expanded="false" aria-controls="help-start-transfer">?</button><span class="help-copy" id="help-start-transfer"></span></span></div>
    </section>
    <section class="transfer-card" id="transfer-card" aria-labelledby="transfer-title" hidden>
      <p class="eyebrow" id="transfer-check"></p>
      <h2 id="transfer-title"></h2>
      <p id="transfer-instruction"></p>
      <div id="transfer-area"></div>
    </section>
    <section class="complete-card" id="complete-card" hidden>
      <p class="eyebrow" id="concept-transferred"></p>
      <h2 id="complete-title"></h2>
      <p id="complete-caption"></p>
      <button id="restart" type="button"></button>
    </section>
    <dialog id="settings-modal" aria-labelledby="settings-title">
      <form method="dialog" class="settings-form">
        <div class="settings-heading"><h2 id="settings-title"></h2><button id="close-settings" class="modal-close" type="button" aria-label="Close">×</button></div>
        <label for="language-select" id="language-label"></label>
        <select id="language-select"></select>
        <div class="settings-actions"><button id="cancel-settings" type="button"></button><button id="save-settings" type="button"></button></div>
      </form>
    </dialog>
  </main>
`

const audio_status = document.querySelector<HTMLElement>('#audio-status')
const prompt = document.querySelector<HTMLElement>('#prompt')
const answer_area = document.querySelector<HTMLElement>('#answer-area')
const feedback = document.querySelector<HTMLElement>('#feedback')
const reveal_card = document.querySelector<HTMLElement>('#reveal-card')
const reveal_context = document.querySelector<HTMLElement>('#reveal-context')
const reveal_caption = document.querySelector<HTMLElement>('#reveal-caption')
const minor_note = document.querySelector<HTMLElement>('#minor-note')
const dorian_note = document.querySelector<HTMLElement>('#dorian-note')
const piano_map = document.querySelector<HTMLElement>('#piano-map')
const guitar_map = document.querySelector<HTMLElement>('#guitar-map')
const transfer_card = document.querySelector<HTMLElement>('#transfer-card')
const transfer_area = document.querySelector<HTMLElement>('#transfer-area')
const complete_card = document.querySelector<HTMLElement>('#complete-card')
const complete_title = document.querySelector<HTMLElement>('#complete-title')
const complete_caption = document.querySelector<HTMLElement>('#complete-caption')
const progress_steps = Array.from(document.querySelectorAll<HTMLElement>('[data-step]'))
const app_title = document.querySelector<HTMLElement>('#app-title')
const app_intro = document.querySelector<HTMLElement>('#app-intro')
const open_settings = document.querySelector<HTMLButtonElement>('#open-settings')
const settings_modal = document.querySelector<HTMLDialogElement>('#settings-modal')
const settings_title = document.querySelector<HTMLElement>('#settings-title')
const language_label = document.querySelector<HTMLElement>('#language-label')
const language_select = document.querySelector<HTMLSelectElement>('#language-select')
const close_settings = document.querySelector<HTMLButtonElement>('#close-settings')
const cancel_settings = document.querySelector<HTMLButtonElement>('#cancel-settings')
const save_settings = document.querySelector<HTMLButtonElement>('#save-settings')
const phase_label = document.querySelector<HTMLElement>('#phase-label')
const guided_comparison = document.querySelector<HTMLElement>('#guided-comparison')
const degree_intro = document.querySelector<HTMLElement>('#degree-intro')
const degree_example = document.querySelector<HTMLElement>('#degree-example')
const theory_after_experience = document.querySelector<HTMLElement>('#theory-after-experience')
const natural_minor_label = document.querySelector<HTMLElement>('#natural-minor-label')
const dorian_label = document.querySelector<HTMLElement>('#dorian-label')
const piano_label = document.querySelector<HTMLElement>('#piano-label')
const guitar_label = document.querySelector<HTMLElement>('#guitar-label')
const transfer_check = document.querySelector<HTMLElement>('#transfer-check')
const transfer_instruction = document.querySelector<HTMLElement>('#transfer-instruction')
const concept_transferred = document.querySelector<HTMLElement>('#concept-transferred')
const exercise_title = document.querySelector<HTMLElement>('#exercise-title')
const step_listen = document.querySelector<HTMLElement>('#step-listen')
const step_identify = document.querySelector<HTMLElement>('#step-identify')
const step_reveal = document.querySelector<HTMLElement>('#step-reveal')
const step_transfer = document.querySelector<HTMLElement>('#step-transfer')
const help_listen = document.querySelector<HTMLElement>('#help-listen')
const help_identify = document.querySelector<HTMLElement>('#help-identify')
const help_reveal = document.querySelector<HTMLElement>('#help-reveal')
const help_transfer = document.querySelector<HTMLElement>('#help-transfer')
const play_a = document.querySelector<HTMLButtonElement>('#play-a')
const play_b = document.querySelector<HTMLButtonElement>('#play-b')
const play_difference = document.querySelector<HTMLButtonElement>('#play-difference')
const help_play_a = document.querySelector<HTMLElement>('#help-play-a')
const help_play_b = document.querySelector<HTMLElement>('#help-play-b')
const help_play_difference = document.querySelector<HTMLElement>('#help-play-difference')
const help_reveal_content = document.querySelector<HTMLElement>('#help-reveal-content')
const help_start_transfer = document.querySelector<HTMLElement>('#help-start-transfer')
const reveal_title = document.querySelector<HTMLElement>('#reveal-title')
const start_transfer = document.querySelector<HTMLButtonElement>('#start-transfer')
const transfer_title = document.querySelector<HTMLElement>('#transfer-title')
const restart = document.querySelector<HTMLButtonElement>('#restart')

if (!audio_status || !prompt || !answer_area || !feedback || !reveal_card || !reveal_context || !reveal_caption || !minor_note || !dorian_note || !piano_map || !guitar_map || !transfer_card || !transfer_area || !complete_card || !complete_title || !complete_caption || !app_title || !app_intro || !open_settings || !settings_modal || !settings_title || !language_label || !language_select || !close_settings || !cancel_settings || !save_settings || !phase_label || !guided_comparison || !degree_intro || !degree_example || !theory_after_experience || !natural_minor_label || !dorian_label || !piano_label || !guitar_label || !transfer_check || !transfer_instruction || !concept_transferred || !exercise_title || !step_listen || !step_identify || !step_reveal || !step_transfer || !help_listen || !help_identify || !help_reveal || !help_transfer || !play_a || !play_b || !play_difference || !help_play_a || !help_play_b || !help_play_difference || !help_reveal_content || !help_start_transfer || !reveal_title || !start_transfer || !transfer_title || !restart) {
  throw new Error('POC interface elements were not found')
}

function bind_help_controls(): void {
  const close_timers = new Map<HTMLButtonElement, number>()

  function close_help(button: HTMLButtonElement, help_copy: HTMLElement): void {
    help_copy.classList.remove('is-open')
    button.setAttribute('aria-expanded', 'false')
  }

  function open_help(button: HTMLButtonElement): void {
    const help_id = button.getAttribute('aria-controls')
    const help_copy = help_id ? document.getElementById(help_id) : null
    if (!help_copy) {
      return
    }

    const existing_timer = close_timers.get(button)
    if (existing_timer !== undefined) {
      window.clearTimeout(existing_timer)
    }
    help_copy.classList.add('is-open')
    button.setAttribute('aria-expanded', 'true')
    close_timers.set(button, window.setTimeout(() => close_help(button, help_copy), 3000))
  }

  document.querySelectorAll<HTMLButtonElement>('.help-button').forEach((button) => {
    button.addEventListener('click', () => {
      const help_id = button.getAttribute('aria-controls')
      const help_copy = help_id ? document.getElementById(help_id) : null
      if (!help_copy) {
        return
      }
      if (help_copy.classList.contains('is-open')) {
        close_help(button, help_copy)
        return
      }
      open_help(button)
    })
    button.addEventListener('mouseenter', () => open_help(button))
    button.addEventListener('focus', () => open_help(button))
  })
}

const ui = {
  audio_status,
  prompt,
  answer_area,
  feedback,
  reveal_card,
  reveal_context,
  reveal_caption,
  minor_note,
  dorian_note,
  piano_map,
  guitar_map,
  transfer_card,
  transfer_area,
  complete_card,
  complete_title,
  complete_caption,
  app_title,
  app_intro,
  open_settings,
  settings_modal,
  settings_title,
  language_label,
  language_select,
  close_settings,
  cancel_settings,
  save_settings,
  phase_label,
  guided_comparison,
  degree_intro,
  degree_example,
  theory_after_experience,
  natural_minor_label,
  dorian_label,
  piano_label,
  guitar_label,
  transfer_check,
  transfer_instruction,
  concept_transferred,
  exercise_title,
  step_listen,
  step_identify,
  step_reveal,
  step_transfer,
  help_listen,
  help_identify,
  help_reveal,
  help_transfer,
  play_a,
  play_b,
  play_difference,
  help_play_a,
  help_play_b,
  help_play_difference,
  help_reveal_content,
  help_start_transfer,
  reveal_title,
  start_transfer,
  transfer_title,
  restart
}

function set_audio_status(result: { readonly ok: boolean; readonly reason?: string }): void {
  const translation = settings_store.get_translations()
  ui.audio_status.textContent = result.ok ? translation.audio_playing : `${translation.audio_unavailable}: ${result.reason ?? 'failed'}.`
}

function create_answer_button(candidate: DegreeCandidate, on_answer: (degree: number) => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'candidate-button'
  button.textContent = candidate.label
  button.setAttribute('aria-label', `Degree ${candidate.label}`)
  button.addEventListener('click', () => on_answer(candidate.degree))
  return button
}

function apply_translations(): void {
  const translation = settings_store.get_translations()
  const language = settings_store.get_settings().language
  document.documentElement.lang = language === 'es' ? 'es' : 'en'
  ui.app_title.textContent = translation.app_title
  ui.app_intro.textContent = translation.intro
  ui.open_settings.textContent = '\u2699'
  ui.open_settings.setAttribute('aria-label', translation.settings)
  ui.open_settings.title = translation.settings
  ui.settings_title.textContent = translation.settings_title
  ui.language_label.textContent = translation.language
  ui.close_settings.setAttribute('aria-label', translation.close)
  ui.cancel_settings.textContent = translation.close
  ui.save_settings.textContent = translation.save
  ui.phase_label.textContent = 'ScaleScape Phase-0 POC 3'
  ui.guided_comparison.textContent = translation.guided_comparison
  ui.exercise_title.textContent = translation.natural_minor_vs_dorian
  ui.degree_intro.textContent = translation.degree_intro
  ui.degree_example.textContent = translation.degree_example
  ui.step_listen.textContent = translation.listen
  ui.step_identify.textContent = translation.identify
  ui.step_reveal.textContent = translation.reveal
  ui.step_transfer.textContent = translation.transfer
  ui.help_listen.textContent = translation.help_listen
  ui.help_identify.textContent = translation.help_identify
  ui.help_reveal.textContent = translation.help_reveal
  ui.help_transfer.textContent = translation.help_transfer
  ui.play_a.textContent = translation.play_natural_minor
  ui.play_b.textContent = translation.play_dorian
  ui.play_difference.textContent = translation.hear_changed_interval
  ui.help_play_a.textContent = translation.help_play_natural_minor
  ui.help_play_b.textContent = translation.help_play_dorian
  ui.help_play_difference.textContent = translation.help_changed_interval
  ui.theory_after_experience.textContent = translation.theory_after_experience
  ui.reveal_title.textContent = translation.reveal_title
  ui.help_reveal_content.textContent = translation.help_reveal_content
  ui.natural_minor_label.textContent = translation.natural_minor
  ui.dorian_label.textContent = translation.dorian
  ui.piano_label.textContent = translation.piano
  ui.guitar_label.textContent = translation.guitar
  ui.start_transfer.textContent = translation.try_same_idea_on_a
  ui.help_start_transfer.textContent = translation.help_transfer_action
  ui.transfer_check.textContent = translation.transfer_check
  ui.transfer_title.textContent = translation.transfer_prompt
  ui.transfer_instruction.textContent = translation.choose_before_answer
  ui.concept_transferred.textContent = translation.concept_transferred
  ui.restart.textContent = translation.try_again
  ui.language_select.innerHTML = `<option value="en">${translation.english}</option><option value="es">${translation.spanish}</option>`
  ui.language_select.value = language
  if (state.phase === 'listen') {
    ui.audio_status.textContent = translation.audio_locked
  }
}

function render_piano_map(): void {
  const piano = create_piano_view_model(state.exercise.scale_b, 1)
  ui.piano_map.replaceChildren(...piano.keys.filter((key) => key.primary_role === 'characteristic').map((key) => {
    const marker = document.createElement('span')
    marker.className = `map-key ${key.is_natural ? 'natural' : 'altered'}`
    marker.textContent = `${key.note_name}${key.octave}`
    return marker
  }))
}

function render_guitar_map(): void {
  const guitar = create_guitar_view_model(state.exercise.scale_b, 1)
  const characteristic_positions = guitar.strings.flatMap((guitar_string) => guitar_string.positions).filter((position) => position.primary_role === 'characteristic').slice(0, 6)
  ui.guitar_map.replaceChildren(...characteristic_positions.map((position) => {
    const marker = document.createElement('span')
    marker.className = 'map-position'
    marker.textContent = `${position.note_name}${position.octave} · ${position.string_name} fret ${position.fret}`
    return marker
  }))
}

function render_transfer_area(): void {
  ui.transfer_area.replaceChildren(...state.exercise.transfer_candidates.map((candidate) => create_answer_button(candidate, (degree) => {
    state = answer_transfer(state, degree)
    render()
  })))
}

function render_answer_area(): void {
  const translation = settings_store.get_translations()
  ui.answer_area.replaceChildren()
  if (state.phase === 'listen' || state.phase === 'identify') {
    ui.prompt.textContent = state.phase === 'listen' ? translation.interval_prompt : translation.identify_prompt
    state.exercise.candidates.forEach((candidate) => {
      ui.answer_area.append(create_answer_button(candidate, (degree) => {
        state = select_changed_note(state, degree)
        ui.feedback.textContent = state.changed_note_correct ? translation.changed_degree_correct : translation.not_quite
        render()
      }))
    })
    const reveal_button = document.createElement('button')
    reveal_button.type = 'button'
    reveal_button.className = 'secondary-button'
    reveal_button.textContent = translation.reveal_relationship
    reveal_button.disabled = state.changed_note_degree === null
    reveal_button.addEventListener('click', () => {
      state = reveal_comparison(state)
      render()
    })
    ui.answer_area.append(reveal_button)
    return
  }

  ui.prompt.textContent = state.phase === 'complete' ? translation.concept_transferred : translation.reveal_title
}

function render(): void {
  apply_translations()
  progress_steps.forEach((step) => step.classList.toggle('active', step.dataset.step === state.phase))
  render_answer_area()
  ui.reveal_card.hidden = !['reveal', 'transfer', 'complete'].includes(state.phase)
  ui.transfer_card.hidden = !['transfer', 'complete'].includes(state.phase)
  ui.complete_card.hidden = state.phase !== 'complete'

  if (state.phase === 'reveal' || state.phase === 'transfer' || state.phase === 'complete') {
    const translation = settings_store.get_translations()
    ui.reveal_caption.textContent = translation.characteristic_caption
      .replace('{lower}', state.exercise.changed_note_a.spelling.text)
      .replace('{raised}', state.exercise.changed_note_b.spelling.text)
      .replace('{root}', state.exercise.scale_a.root_spelling.text)
    ui.reveal_context.textContent = `${translation.comparison_root}: ${state.exercise.scale_a.root_spelling.text}`
    ui.minor_note.textContent = state.exercise.changed_note_a.spelling.text
    ui.dorian_note.textContent = state.exercise.changed_note_b.spelling.text
    render_piano_map()
    render_guitar_map()
  }

  if (state.phase === 'transfer') {
    render_transfer_area()
  }

  if (state.phase === 'complete') {
    const translation = settings_store.get_translations()
    ui.complete_title.textContent = state.transfer_correct ? translation.transfer_correct : translation.transfer_try_again
    ui.complete_caption.textContent = `${state.transfer_correct ? translation.changed_degree_correct : translation.not_quite} ${translation.degree}: ${state.streak}.`
  }
}

ui.play_a.addEventListener('click', async () => {
  const result = await audio.play_scale(get_audio_variant(state.exercise, 'a'))
  set_audio_status(result)
})

ui.play_b.addEventListener('click', async () => {
  const result = await audio.play_scale(get_audio_variant(state.exercise, 'b'))
  set_audio_status(result)
})

ui.play_difference.addEventListener('click', async () => {
  const result = await audio.play_characteristic_note(state.exercise.scale_b)
  set_audio_status(result)
})

ui.start_transfer.addEventListener('click', () => {
  state = start_transfer_state(state)
  render()
})

ui.restart.addEventListener('click', () => {
  audio.stop()
  state = create_learning_loop_state()
  ui.feedback.textContent = ''
  render()
})

bind_help_controls()
render()
settings_store.subscribe(() => render())
ui.open_settings.addEventListener('click', () => {
  ui.language_select.value = settings_store.get_settings().language
  ui.settings_modal.showModal()
})
ui.close_settings.addEventListener('click', () => ui.settings_modal.close())
ui.cancel_settings.addEventListener('click', () => ui.settings_modal.close())
ui.save_settings.addEventListener('click', () => {
  settings_store.set_language(ui.language_select.value as Language)
  ui.settings_modal.close()
})
