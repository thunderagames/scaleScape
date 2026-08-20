import { SCALE_FORMULAS, getStepSemitones, type FormulaId, type NoteRole } from '../theory/scale-formulas'
import type { ExploreApplication } from '../application/explore-application'
import type { ScaleState } from '../app-state/scale-state'
import type { PlaybackInstrument, PlaybackPort } from '../audio/playback-port'
import { createPianoViewModel } from '../instruments/piano-view-model'
import { createGuitarViewModel, type GuitarPosition } from '../instruments/guitar-view-model'
import type { SettingsStore } from '../settings/settings-store'
import type { TranslationDictionary } from '../settings/localization'
import { createDiagnosticsLogger, type EventLoggerPort } from '../observability/event-logger'
import { transposePitch } from '../theory/frequency'
import { getVisiblePlaybackInstruments } from './visible-instruments'

const ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

function format_interval(semitones: number): string {
  if (semitones === 1) return '1/2'
  if (semitones === 2) return '1'
  if (semitones === 3) return '1 1/2'
  return `${semitones / 2}`
}

export interface ExploreGuidedStartPort {
  readonly on_characteristic_note_selected: () => void
}

export function renderExploreScreen(container: HTMLElement, application: ExploreApplication, playback: PlaybackPort, settings: SettingsStore, diagnostics: EventLoggerPort = createDiagnosticsLogger(), guided_start?: ExploreGuidedStartPort): void {
  container.innerHTML = `
     <main class="explore-shell">
      <header class="explore-header">
          <div class="title-row"><div><h1 id="app-title"></h1></div></div>
        <p id="app-intro" class="intro"></p>
      </header>
      <section id="scale-controls" class="explore-controls">
        <label><span id="root-label"></span><select id="root-select"></select></label>
        <label><span id="mode-label"></span><select id="formula-select"></select></label>
        <button id="play-scale" type="button"></button>
        <button id="stop-audio" type="button"></button>
        <span id="audio-status" class="audio-status" role="status" aria-live="polite"></span>
        <span id="generation-status" role="status"></span>
      </section>
        <section class="scale-card" aria-labelledby="scale-title">
        <p class="eyebrow" id="generated-scale-label"></p>
        <h2 id="scale-title"></h2>
        <p id="scale-caption" class="scale-caption"></p>
        <div id="scale-notes" class="scale-notes"></div>
        <div id="note-detail" class="note-detail" aria-live="polite"></div>
       </section>
       <section id="guided-progress" class="guided-progress" hidden aria-live="polite"><p id="guided-progress-text"></p><button id="guided-progress-action" type="button" hidden></button></section>
      <section id="instrument-region" class="instrument-grid">
        <article id="piano-card" class="instrument-card" aria-labelledby="piano-title"><div class="section-heading"><h2 id="piano-title"></h2><span id="piano-generation"></span></div><div id="piano-view" class="piano-view"></div></article>
        <article id="guitar-card" class="instrument-card" aria-labelledby="guitar-title"><div class="section-heading"><h2 id="guitar-title"></h2><span id="guitar-generation"></span></div><div id="guitar-view" class="guitar-view"></div></article>
      </section>
    </main>
  `

  const root_select = container.querySelector<HTMLSelectElement>('#root-select')
  const formula_select = container.querySelector<HTMLSelectElement>('#formula-select')
  const play_scale = container.querySelector<HTMLButtonElement>('#play-scale')
  const stop_audio = container.querySelector<HTMLButtonElement>('#stop-audio')
  const audio_status = container.querySelector<HTMLElement>('#audio-status')
  const generation_status = container.querySelector<HTMLElement>('#generation-status')
  const scale_title = container.querySelector<HTMLElement>('#scale-title')
  const scale_caption = container.querySelector<HTMLElement>('#scale-caption')
  const scale_notes = container.querySelector<HTMLElement>('#scale-notes')
  const note_detail = container.querySelector<HTMLElement>('#note-detail')
  const piano_view = container.querySelector<HTMLElement>('#piano-view')
  const guitar_view = container.querySelector<HTMLElement>('#guitar-view')
  const piano_generation = container.querySelector<HTMLElement>('#piano-generation')
  const guitar_generation = container.querySelector<HTMLElement>('#guitar-generation')
  const piano_card = container.querySelector<HTMLElement>('#piano-card')
  const guitar_card = container.querySelector<HTMLElement>('#guitar-card')
  const guided_progress = container.querySelector<HTMLElement>('#guided-progress')
  const guided_progress_text = container.querySelector<HTMLElement>('#guided-progress-text')
  const guided_progress_action = container.querySelector<HTMLButtonElement>('#guided-progress-action')
   if (!root_select || !formula_select || !play_scale || !stop_audio || !audio_status || !generation_status || !scale_title || !scale_caption || !scale_notes || !note_detail || !piano_view || !guitar_view || !piano_generation || !guitar_generation || !piano_card || !guitar_card || !guided_progress || !guided_progress_text || !guided_progress_action) throw new Error('Explore screen elements were not found')

   const ui = { root_select, formula_select, play_scale, stop_audio, audio_status, generation_status, scale_title, scale_caption, scale_notes, note_detail, piano_view, guitar_view, piano_generation, guitar_generation, piano_card, guitar_card, guided_progress, guided_progress_text, guided_progress_action }
  let selected_pitch_class: number | null = null

  ROOTS.forEach((root, root_pitch_class) => { const option = document.createElement('option'); option.value = String(root_pitch_class); option.textContent = root; ui.root_select.append(option) })
  SCALE_FORMULAS.forEach((formula) => { const option = document.createElement('option'); option.value = formula.id; option.textContent = formula.name; ui.formula_select.append(option) })

  function apply_translations(): void {
    const translation = settings.getTranslations()
    document.documentElement.lang = settings.getSettings().language
    const set_text = (selector: string, value: string) => { const element = container.querySelector<HTMLElement>(selector); if (element) element.textContent = value }
     set_text('#app-title', translation.app_title); set_text('#app-intro', translation.intro); set_text('#root-label', translation.root); set_text('#mode-label', translation.mode); set_text('#play-scale', translation.play_scale); set_text('#stop-audio', translation.stop); set_text('#generated-scale-label', translation.generated_scale); set_text('#piano-title', translation.piano); set_text('#guitar-title', translation.guitar)
    container.querySelector('#scale-controls')?.setAttribute('aria-label', translation.scale_controls); container.querySelector('#instrument-region')?.setAttribute('aria-label', translation.instrument_region)
    Array.from(ui.formula_select.options).forEach((option) => { const formula = SCALE_FORMULAS.find((candidate) => candidate.id === option.value); if (formula) option.textContent = translation.formula_names[formula.id] })
    if (ui.audio_status.textContent === '') ui.audio_status.textContent = translation.audio_locked
  }

  function select_note(pitch_class: number, focus_target: 'scale' | 'piano' | 'guitar' | null = null): void {
    const guitar_scroll_left = ui.guitar_view.querySelector<HTMLElement>('.guitar-scroll')?.scrollLeft ?? 0
    selected_pitch_class = pitch_class
    render(application.getState())
    const next_guitar_scroll = ui.guitar_view.querySelector<HTMLElement>('.guitar-scroll')
    if (next_guitar_scroll) next_guitar_scroll.scrollLeft = guitar_scroll_left
    const selected_note = application.getState().scale_instance.notes.find((note) => note.pitch_class === pitch_class)
    if (selected_note?.primary_role === 'characteristic') guided_start?.on_characteristic_note_selected()
    if (focus_target) container.querySelector<HTMLButtonElement>(`#${focus_target === 'scale' ? 'scale-notes' : `${focus_target}-view`} .selected`)?.focus({ preventScroll: true })
  }

  function note_accessible_label(note: { readonly label: string; readonly degree: number | null; readonly primary_role: NoteRole | null }, translation: TranslationDictionary): string {
    const degree = note.degree === null ? '' : `, ${translation.degree} ${note.degree}`
    const role = note.primary_role === null ? '' : `, ${translation.role} ${translation.roles[note.primary_role]}`
    return `${translation.note} ${note.label}${degree}${role}`
  }

  function preview_instrument_midi(midi: number, instrument: PlaybackInstrument): void {
    const pitch_class = ((midi % 12) + 12) % 12
    const octave = Math.floor(midi / 12) - 1
    void playback.previewNote({ pitch_class, octave, semitones: midi - 60 }, [instrument])
  }

  function move_focus(buttons: readonly HTMLButtonElement[], current_button: HTMLButtonElement, direction: -1 | 1): void {
    const current_index = buttons.indexOf(current_button)
    const next_button = buttons[current_index + direction]
    if (next_button) {
      current_button.tabIndex = -1
      next_button.tabIndex = 0
      next_button.focus()
    }
  }

  function focus_first(buttons: readonly HTMLButtonElement[]): void {
    const first_button = buttons[0]
    if (first_button) {
      buttons.forEach((button) => { button.tabIndex = -1 })
      first_button.tabIndex = 0
      first_button.focus()
    }
  }

  function preview_scale_note(note_index: number): void {
    const state = application.getState()
    const note = state.scale_instance.notes[note_index]
    if (note) void playback.previewNote({ ...transposePitch(state.root_pitch_class, 4, note.semitones), semitones: note.semitones }, getVisiblePlaybackInstruments(settings))
  }

  function render_piano(state: ScaleState): void {
    const piano = createPianoViewModel(state.scale_instance, state.generation_id)
    const keyboard = document.createElement('div'); keyboard.className = 'piano-keyboard'
    const scale_buttons: HTMLButtonElement[] = []
    piano.keys.forEach((key, key_index) => { const button = document.createElement('button'); const is_selected = selected_pitch_class === key.pitch_class && key.is_scale_note; const natural_key_count = piano.keys.slice(0, key_index + (key.is_natural ? 1 : 0)).filter((candidate) => candidate.is_natural).length; const has_scale_overlay = key.is_scale_note && key.primary_role !== 'tonic' && key.primary_role !== 'characteristic'; button.type = 'button'; button.className = `piano-key ${key.is_natural ? 'natural-key' : 'altered-key'} ${key.is_scale_note ? key.primary_role : 'outside-scale'} ${has_scale_overlay ? 'is-scale-note' : ''} ${is_selected ? 'selected' : ''}`; button.style.setProperty('--key-index', String(key.is_natural ? natural_key_count - 1 : natural_key_count)); button.textContent = key.is_scale_note ? key.label : ''; button.setAttribute('aria-label', key.is_scale_note ? `${note_accessible_label(key, settings.getTranslations())}, octave ${key.octave}` : ''); button.setAttribute('aria-pressed', String(is_selected)); if (key.is_scale_note) { scale_buttons.push(button); button.tabIndex = is_selected || (selected_pitch_class === null && scale_buttons.length === 1) ? 0 : -1; button.addEventListener('click', () => { select_note(key.pitch_class, 'piano'); preview_instrument_midi(key.midi, 'piano') }); button.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); move_focus(scale_buttons, button, -1) } if (event.key === 'ArrowRight') { event.preventDefault(); move_focus(scale_buttons, button, 1) } if (event.key === 'Home') { event.preventDefault(); focus_first(scale_buttons) } }) } else { button.tabIndex = -1; button.setAttribute('aria-hidden', 'true'); button.disabled = true } keyboard.append(button) })
    ui.piano_card.hidden = !settings.getSettings().show_piano; ui.piano_view.replaceChildren(keyboard); ui.piano_generation.textContent = `${settings.getTranslations().generation} ${piano.generation_id}`
  }

  function render_guitar(state: ScaleState): void {
    const guitar = createGuitarViewModel(state.scale_instance, state.generation_id); const scroll = document.createElement('div'); scroll.className = 'guitar-scroll'; const table = document.createElement('table'); table.className = 'guitar-table'; table.setAttribute('aria-label', 'Interactive six-string guitar fretboard'); const head = document.createElement('tr'); head.innerHTML = '<th scope="col">String</th>'; for (let fret = 0; fret <= guitar.fret_count; fret += 1) { const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = String(fret); head.append(cell) }; const table_head = document.createElement('thead'); table_head.append(head); table.append(table_head); const body = document.createElement('tbody')
    const guitar_position_buttons: HTMLButtonElement[][] = []
    const guitar_scale_buttons: HTMLButtonElement[][] = []
    guitar.strings.forEach((guitar_string, string_index) => { const row = document.createElement('tr'); const label = document.createElement('th'); label.scope = 'row'; label.textContent = guitar_string.tuning.name; row.append(label); const position_buttons: HTMLButtonElement[] = []; const scale_buttons: HTMLButtonElement[] = []; guitar_position_buttons.push(position_buttons); guitar_scale_buttons.push(scale_buttons); guitar_string.positions.forEach((position: GuitarPosition, fret) => { const cell = document.createElement('td'); const button = document.createElement('button'); const is_selected = selected_pitch_class === position.pitch_class && position.is_scale_note; button.type = 'button'; button.className = `guitar-position ${position.is_scale_note ? position.primary_role : 'outside-scale'} ${is_selected ? 'selected' : ''}`; button.textContent = position.is_scale_note ? position.label : ''; button.setAttribute('aria-label', position.is_scale_note ? `${position.string_name}, ${settings.getTranslations().fret_label} ${position.fret}, ${note_accessible_label(position, settings.getTranslations())}, octave ${position.octave}` : ''); button.setAttribute('aria-pressed', String(is_selected)); button.tabIndex = is_selected ? 0 : -1; position_buttons.push(button); if (position.is_scale_note) { scale_buttons.push(button); button.addEventListener('click', () => { select_note(position.pitch_class, 'guitar'); preview_instrument_midi(position.midi, 'guitar') }); button.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); move_focus(scale_buttons, button, -1) } if (event.key === 'ArrowRight') { event.preventDefault(); move_focus(scale_buttons, button, 1) } if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); const next_string_index = string_index + (event.key === 'ArrowUp' ? -1 : 1); const next_button = guitar_position_buttons[next_string_index]?.[fret]; if (next_button && !next_button.disabled) next_button.focus() } if (event.key === 'Home') { event.preventDefault(); focus_first(scale_buttons) } }) } else { button.setAttribute('aria-hidden', 'true'); button.disabled = true } cell.append(button); row.append(cell) }); body.append(row) }); const first_guitar_button = guitar_scale_buttons.flat()[0]; if (first_guitar_button && selected_pitch_class === null) first_guitar_button.tabIndex = 0; table.append(body); scroll.append(table); table.setAttribute('aria-label', settings.getTranslations().guitar_table); ui.guitar_card.hidden = !settings.getSettings().show_guitar; ui.guitar_view.replaceChildren(scroll); ui.guitar_generation.textContent = `${settings.getTranslations().generation} ${guitar.generation_id}`
  }

  function render(state: ScaleState): void {
     apply_translations(); const translation = settings.getTranslations(); ui.root_select.value = String(state.root_pitch_class); ui.formula_select.value = state.formula_id; ui.scale_title.textContent = `${state.scale_instance.root_spelling.text} ${translation.formula_names[state.formula_id]}`; ui.scale_caption.textContent = state.scale_instance.notes.map((note) => note.spelling.text).join(' · '); ui.generation_status.textContent = `${translation.generation} ${state.generation_id}`; const step_semitones = getStepSemitones(state.scale_instance.formula); ui.scale_notes.replaceChildren(...state.scale_instance.notes.flatMap((note, note_index) => { const note_wrapper = document.createElement('div'); note_wrapper.className = 'scale-note-wrapper'; const degree_label = document.createElement('span'); degree_label.className = 'scale-degree'; degree_label.textContent = String(note.degree); const note_element = document.createElement('button'); note_element.type = 'button'; note_element.className = `scale-note ${note.primary_role} ${selected_pitch_class === note.pitch_class ? 'selected' : ''}`; note_element.textContent = note.spelling.text; note_element.setAttribute('aria-label', note_accessible_label(note, translation)); note_element.setAttribute('aria-pressed', String(selected_pitch_class === note.pitch_class)); note_element.addEventListener('click', () => { select_note(note.pitch_class, 'scale'); preview_scale_note(note_index) }); note_wrapper.append(degree_label, note_element); const interval = step_semitones[note_index]; if (interval === undefined) return [note_wrapper]; const interval_element = document.createElement('span'); interval_element.className = 'scale-interval'; interval_element.textContent = format_interval(interval); interval_element.setAttribute('aria-label', `${interval} ${translation.interval_label}`); return [note_wrapper, interval_element] })); const selected_note = state.scale_instance.notes.find((note) => note.pitch_class === selected_pitch_class); ui.note_detail.textContent = selected_note ? `${selected_note.spelling.text} · ${translation.degree} ${selected_note.degree} · ${translation.role} ${translation.roles[selected_note.primary_role]}` : translation.select_note; render_piano(state); render_guitar(state)
  }

  function change_scale_from_controls(): void {
    const next_root_pitch_class = Number(ui.root_select.value)
    const next_formula_id = ui.formula_select.value as FormulaId
    selected_pitch_class = null
    void playback.stopAll()
    try {
      const next_state = application.changeScale(next_root_pitch_class, next_formula_id)
      settings.setSettings({ ...settings.getSettings(), last_root: next_root_pitch_class, last_formula: next_formula_id })
      try { diagnostics.log('application.scale_change_completed', { formula_id: next_formula_id, root_pitch_class: next_root_pitch_class, generation_id: next_state.generation_id }) } catch { /* Diagnostics must not block scale changes. */ }
    } catch {
      try { diagnostics.log('application.scale_change_failed', { formula_id: next_formula_id, root_pitch_class: next_root_pitch_class, generation_id: application.getState().generation_id }) } catch { /* Diagnostics must not block scale changes. */ }
      render(application.getState())
    }
  }

  ui.root_select.addEventListener('change', change_scale_from_controls); ui.formula_select.addEventListener('change', change_scale_from_controls); ui.play_scale.addEventListener('click', async () => { selected_pitch_class = null; const result = await playback.playScale(application.getState().scale_instance, getVisiblePlaybackInstruments(settings)); ui.audio_status.textContent = result.ok ? settings.getTranslations().audio_playing : settings.getTranslations().audio_unavailable; render(application.getState()) }); ui.stop_audio.addEventListener('click', async () => { await playback.stopAll(); ui.audio_status.textContent = settings.getTranslations().audio_stopped }); playback.subscribe({ on_note_started: (note_index) => { const note = application.getState().scale_instance.notes[note_index]; if (note) { selected_pitch_class = note.pitch_class; render(application.getState()) } }, on_stopped: () => { selected_pitch_class = null; render(application.getState()) } }); settings.subscribe(() => render(application.getState())); application.subscribe(render); render(application.getState())
}
