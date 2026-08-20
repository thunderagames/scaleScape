import type { PlaybackPort } from '../audio/playback-port'
import type { SettingsStore } from '../settings/settings-store'
import { beginAnswer, COMPARISON_DEFINITIONS, createComparisonExercise, createEarGymState, markExamplePlaying, restartExercise, submitAnswer, type ComparisonId, type EarGymState } from '../exercises/comparison-exercise'
import { createDiagnosticsLogger, type EventLoggerPort } from '../observability/event-logger'
import { getVisiblePlaybackInstruments } from './visible-instruments'

export function renderEarGymScreen(container: HTMLElement, playback: PlaybackPort, settings: SettingsStore, diagnostics: EventLoggerPort = createDiagnosticsLogger()): void {
  container.innerHTML = `
    <section class="ear-gym-content" aria-labelledby="ear-gym-title">
      <p class="eyebrow" id="ear-gym-label"></p>
       <h1 id="ear-gym-title"></h1>
       <p id="ear-gym-intro" class="ear-gym-intro"></p>
       <p id="audio-fallback" class="audio-fallback" role="status" aria-live="polite" hidden></p>
       <section class="comparison-card" aria-labelledby="comparison-title">
        <p class="eyebrow" id="comparison-label"></p>
        <h2 id="comparison-title"></h2>
        <label id="comparison-selector-label" for="comparison-selector"></label>
        <select id="comparison-selector"></select>
        <p id="comparison-prompt" class="comparison-prompt"></p>
        <div class="comparison-actions">
          <button id="play-example-a" type="button"></button>
          <button id="play-example-b" type="button"></button>
          <button id="stop-audio" type="button"></button>
          <button id="start-answer" type="button"></button>
        </div>
        <p id="playback-status" role="status" aria-live="polite"></p>
        <fieldset id="answer-fieldset" class="answer-options" disabled>
          <legend id="answer-legend"></legend>
          <div id="answer-options"></div>
        </fieldset>
         <div id="feedback" class="exercise-feedback" tabindex="-1" aria-live="assertive"></div>
        <button id="restart-exercise" type="button" hidden></button>
      </section>
    </section>
  `

  const ear_gym_label = container.querySelector<HTMLElement>('#ear-gym-label')
  const ear_gym_title = container.querySelector<HTMLElement>('#ear-gym-title')
  const ear_gym_intro = container.querySelector<HTMLElement>('#ear-gym-intro')
  const audio_fallback = container.querySelector<HTMLElement>('#audio-fallback')
  const comparison_label = container.querySelector<HTMLElement>('#comparison-label')
  const comparison_title = container.querySelector<HTMLElement>('#comparison-title')
  const comparison_selector_label = container.querySelector<HTMLElement>('#comparison-selector-label')
  const comparison_selector = container.querySelector<HTMLSelectElement>('#comparison-selector')
  const comparison_prompt = container.querySelector<HTMLElement>('#comparison-prompt')
  const play_example_a = container.querySelector<HTMLButtonElement>('#play-example-a')
  const play_example_b = container.querySelector<HTMLButtonElement>('#play-example-b')
  const stop_audio = container.querySelector<HTMLButtonElement>('#stop-audio')
  const start_answer = container.querySelector<HTMLButtonElement>('#start-answer')
  const playback_status = container.querySelector<HTMLElement>('#playback-status')
  const answer_fieldset = container.querySelector<HTMLFieldSetElement>('#answer-fieldset')
  const answer_legend = container.querySelector<HTMLElement>('#answer-legend')
  const answer_options = container.querySelector<HTMLElement>('#answer-options')
  const feedback = container.querySelector<HTMLElement>('#feedback')
  const restart_exercise = container.querySelector<HTMLButtonElement>('#restart-exercise')
  if (!ear_gym_label || !ear_gym_title || !ear_gym_intro || !audio_fallback || !comparison_label || !comparison_title || !comparison_selector_label || !comparison_selector || !comparison_prompt || !play_example_a || !play_example_b || !stop_audio || !start_answer || !playback_status || !answer_fieldset || !answer_legend || !answer_options || !feedback || !restart_exercise) throw new Error('Ear Gym screen elements were not found')
  const ui = { ear_gym_label, ear_gym_title, ear_gym_intro, audio_fallback, comparison_label, comparison_title, comparison_selector_label, comparison_selector, comparison_prompt, play_example_a, play_example_b, stop_audio, start_answer, playback_status, answer_fieldset, answer_legend, answer_options, feedback, restart_exercise }

  let state: EarGymState = createEarGymState(undefined, settings.getSettings().ear_gym_streak)
  const played_examples = new Set<'a' | 'b'>()
  let has_started_comparison = false
  let is_audio_available = true

  function log_comparison_start(): void {
    if (has_started_comparison) return
    has_started_comparison = true
    try { diagnostics.log('application.start_guided_comparison', { comparison_id: state.exercise.id, comparison_kind: 'FOCUSED', generation_id: 0 }) } catch { /* Diagnostics must not block Ear Gym. */ }
  }

  function apply_translations(): void {
    const translation = settings.getTranslations()
    ui.ear_gym_label.textContent = translation.nav_ear_gym
    ui.ear_gym_title.textContent = translation.ear_gym_title
    ui.ear_gym_intro.textContent = translation.ear_gym_intro
    ui.audio_fallback.textContent = `${translation.ear_gym_audio_required} ${translation.ear_gym_visual_fallback}`
    ui.comparison_label.textContent = translation.guided_comparison
    ui.comparison_title.textContent = translation.comparison_names[state.exercise.id] ?? translation.natural_minor_vs_dorian
    ui.comparison_selector_label.textContent = translation.comparison_selector
    Array.from(ui.comparison_selector.options).forEach((option) => { option.textContent = translation.comparison_names[option.value] ?? option.value })
    ui.comparison_prompt.textContent = translation.interval_prompt
    ui.play_example_a.textContent = played_examples.has('a') ? translation.replay_natural_minor : translation.play_natural_minor
    ui.play_example_b.textContent = played_examples.has('b') ? translation.replay_dorian : translation.play_dorian
    ui.stop_audio.textContent = translation.stop_audio
    ui.start_answer.textContent = translation.begin_answer
    ui.answer_legend.textContent = translation.identify_prompt
    ui.restart_exercise.textContent = translation.try_again
  }

  async function play_example(example: 'a' | 'b'): Promise<void> {
    const scale = example === 'a' ? state.exercise.scale_a : state.exercise.scale_b
    log_comparison_start()
    state = markExamplePlaying(state, example)
    played_examples.add(example)
    ui.playback_status.textContent = example === 'a' ? settings.getTranslations().audio_playing_a : settings.getTranslations().audio_playing_b
    try { diagnostics.log('application.replay_example', { example_id: example === 'a' ? state.exercise.formula_a : state.exercise.formula_b, generation_id: 0 }) } catch { /* Diagnostics must not block Ear Gym. */ }
    render()
    const result = await playback.playScale(scale, getVisiblePlaybackInstruments(settings))
    if (!result.ok) {
      is_audio_available = false
      state = { ...state, playing_example: null }
      ui.playback_status.textContent = settings.getTranslations().audio_unavailable
      render()
      return
    }
  }

  function render(): void {
    apply_translations()
    const translation = settings.getTranslations()
    ui.answer_fieldset.disabled = state.phase !== 'answer'
    ui.start_answer.disabled = state.phase !== 'listen' || !is_audio_available
    ui.audio_fallback.hidden = is_audio_available
    ui.comparison_selector.value = state.exercise.id
    ui.start_answer.hidden = state.phase !== 'listen'
    ui.restart_exercise.hidden = state.phase !== 'feedback'
    ui.answer_options.replaceChildren(...state.exercise.choices.map((choice) => {
      const label = document.createElement('label')
      const input = document.createElement('input')
      input.type = 'radio'
      input.name = 'changed-degree'
      input.value = String(choice.degree)
      input.checked = state.answer === choice.degree
       input.addEventListener('change', () => { log_comparison_start(); state = submitAnswer(state, choice.degree); settings.setSettings({ ...settings.getSettings(), ear_gym_streak: state.streak }); try { diagnostics.log('application.submit_answer', { comparison_id: state.exercise.id, comparison_kind: 'FOCUSED', is_correct: state.is_correct === true }) } catch { /* Diagnostics must not block Ear Gym. */ } render(); ui.feedback.focus() })
      label.append(input, ` ${choice.label}`)
      return label
    }))
    if (state.phase === 'feedback') {
      const answer_copy = state.is_correct ? translation.changed_degree_correct : translation.not_quite
      ui.feedback.textContent = `${answer_copy} ${translation.characteristic_explanation.replace('{lower}', state.exercise.changed_note_a).replace('{raised}', state.exercise.changed_note_b).replace('{root}', state.exercise.scale_a.root_spelling.text)} ${translation.streak}: ${state.streak}.`
    } else {
      ui.feedback.textContent = ''
    }
    if (state.playing_example) ui.playback_status.textContent = state.playing_example === 'a' ? translation.audio_playing_a : translation.audio_playing_b
  }

  COMPARISON_DEFINITIONS.forEach((definition) => { const option = document.createElement('option'); option.value = definition.id; ui.comparison_selector.append(option) })
  ui.comparison_selector.addEventListener('change', () => { state = createEarGymState(createComparisonExercise(state.exercise.root_pitch_class, ui.comparison_selector.value as ComparisonId), state.streak); has_started_comparison = false; void playback.stopAll(); render() })

  ui.play_example_a.addEventListener('click', () => { void play_example('a') })
  ui.play_example_b.addEventListener('click', () => { void play_example('b') })
  ui.stop_audio.addEventListener('click', async () => { await playback.stopAll(); state = { ...state, playing_example: null }; ui.playback_status.textContent = settings.getTranslations().audio_stopped; render() })
  ui.start_answer.addEventListener('click', () => { state = beginAnswer(state); render(); ui.answer_options.querySelector<HTMLInputElement>('input')?.focus() })
  ui.restart_exercise.addEventListener('click', () => { state = restartExercise(state); render() })
  settings.subscribe(render)
  render()
}
