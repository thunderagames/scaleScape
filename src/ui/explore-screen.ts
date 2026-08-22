import { SCALE_CATEGORY_ORDER, SCALE_FORMULAS, getStepSemitones, type FormulaId, type NoteRole } from '../theory/scale-formulas'
import type { ExploreApplication } from '../application/explore-application'
import type { ScaleState } from '../app-state/scale-state'
import type { PlaybackInstrument, PlaybackPort } from '../audio/playback-port'
import { createPianoViewModel } from '../instruments/piano-view-model'
import { createGuitarViewModel, getGuitarTuningNote, shiftTuning, STANDARD_TUNING } from '../instruments/guitar-view-model'
import { createBassViewModel, getBassTuningNote, STANDARD_BASS_TUNING } from '../instruments/bass-view-model'
import { renderStringedInstrument } from './stringed-instrument-view'
import type { SettingsStore } from '../settings/settings-store'
import type { TranslationDictionary } from '../settings/localization'
import { createDiagnosticsLogger, type EventLoggerPort } from '../observability/event-logger'
import { transposePitch } from '../theory/frequency'
import { getVisiblePlaybackInstruments } from './visible-instruments'
import { displayNoteName, type NoteNamingStyle } from '../settings/note-naming'

const ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
export const EXPLORE_HELP_CLOSE_EVENT = 'scalescape:close-explore-help'
const HELP_AUTO_CLOSE_MS = 5000

function format_interval(semitones: number): string {
  if (semitones === 1) return 'S'
  if (semitones === 2) return 'T'
  if (semitones === 3) return 'TS'
  if (semitones === 4) return '2T'
  return `${semitones / 2}T`
}

function display_scale_degree(note_count: number, note_index: number, domain_degree: number): number {
  return note_count === 7 ? domain_degree : note_index + 1
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
         <section class="scale-card" aria-labelledby="generated-scale-label">
          <div class="section-heading scale-heading"><h2 id="generated-scale-label"></h2><div class="help-cluster"><button id="scale-help-button" class="help-button" type="button" aria-expanded="false" aria-controls="scale-help">?</button><div id="scale-help" class="help-copy" role="tooltip"></div></div></div>
          <div class="scale-selection-row"><button id="scale-selector" class="control-button scale-selector" type="button" aria-haspopup="dialog"></button><button id="play-scale" class="control-button control-button--icon" type="button" aria-label=""></button><button id="play-chord" class="control-button control-button--chord" type="button" aria-label=""></button></div>
          <p id="scale-caption" class="scale-caption"></p>
         <div id="scale-formula-info" class="scale-formula-info" aria-live="polite"></div><div id="scale-notes" class="scale-notes"></div>
        <div id="note-detail" class="note-detail" aria-live="polite"></div>
       </section>
        <section id="guided-progress" class="guided-progress" hidden aria-live="polite"><p id="guided-progress-text"></p><button id="guided-progress-action" class="control-button control-button--primary" type="button" hidden></button></section>
       <section id="instrument-region" class="instrument-grid">
             <article id="piano-card" class="instrument-card" aria-labelledby="piano-title"><div class="section-heading"><h2 id="piano-title"></h2><div class="help-cluster"><button id="piano-help-button" class="help-button" type="button" aria-expanded="false" aria-controls="piano-help">?</button><div id="piano-help" class="help-copy" role="tooltip"></div></div></div><div id="piano-view" class="piano-view"></div></article>
             <article id="guitar-card" class="instrument-card" aria-labelledby="guitar-title"><div class="section-heading"><h2 id="guitar-title"></h2><div class="help-cluster"><button id="guitar-help-button" class="help-button" type="button" aria-expanded="false" aria-controls="guitar-help">?</button><div id="guitar-help" class="help-copy" role="tooltip"></div></div></div><div id="guitar-view" class="guitar-view"></div></article>
             <article id="bass-card" class="instrument-card" aria-labelledby="bass-title"><div class="section-heading"><h2 id="bass-title"></h2></div><div id="bass-view" class="guitar-view"></div></article>
       </section>
     </main>
       <dialog id="scale-selector-modal" class="scale-selector-modal" aria-labelledby="scale-selector-title"><form class="modal-form scale-selector-form"><div class="modal-heading scale-selector-heading"><h2 id="scale-selector-title"></h2><button id="close-scale-selector" class="control-button control-button--icon modal-close scale-selector-close" type="button" aria-label=""><svg class="modal-close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="scale-selector-fields"><label class="modal-field scale-selector-field" for="root-select"><span id="root-label"></span><select id="root-select" class="control-select"></select></label><label class="modal-field scale-selector-field" for="formula-select"><span id="mode-label"></span><select id="formula-select" class="control-select"></select></label></div><div class="modal-actions scale-selector-actions"><button id="cancel-scale-selector" class="control-button" type="button"></button><button id="apply-scale-selector" class="control-button control-button--primary" type="button"></button></div></form></dialog>
  `

   const root_select = container.querySelector<HTMLSelectElement>('#root-select')
   const formula_select = container.querySelector<HTMLSelectElement>('#formula-select')
    const scale_selector = container.querySelector<HTMLButtonElement>('#scale-selector')
    const play_scale = container.querySelector<HTMLButtonElement>('#play-scale')
    const play_chord = container.querySelector<HTMLButtonElement>('#play-chord')
    const scale_selector_modal = container.querySelector<HTMLDialogElement>('#scale-selector-modal')
   const close_scale_selector = container.querySelector<HTMLButtonElement>('#close-scale-selector')
   const cancel_scale_selector = container.querySelector<HTMLButtonElement>('#cancel-scale-selector')
   const apply_scale_selector = container.querySelector<HTMLButtonElement>('#apply-scale-selector')
   const scale_help_button = container.querySelector<HTMLButtonElement>('#scale-help-button')
   const scale_help_copy = container.querySelector<HTMLElement>('#scale-help')
   const piano_help_button = container.querySelector<HTMLButtonElement>('#piano-help-button')
   const piano_help_copy = container.querySelector<HTMLElement>('#piano-help')
   const guitar_help_button = container.querySelector<HTMLButtonElement>('#guitar-help-button')
    const guitar_help_copy = container.querySelector<HTMLElement>('#guitar-help')
    const scale_caption = container.querySelector<HTMLElement>('#scale-caption')
   const scale_formula_info = container.querySelector<HTMLElement>('#scale-formula-info')
   const scale_notes = container.querySelector<HTMLElement>('#scale-notes')
  const note_detail = container.querySelector<HTMLElement>('#note-detail')
  const piano_view = container.querySelector<HTMLElement>('#piano-view')
   const guitar_view = container.querySelector<HTMLElement>('#guitar-view')
   const bass_view = container.querySelector<HTMLElement>('#bass-view')
   const piano_card = container.querySelector<HTMLElement>('#piano-card')
   const guitar_card = container.querySelector<HTMLElement>('#guitar-card')
   const bass_card = container.querySelector<HTMLElement>('#bass-card')
  const guided_progress = container.querySelector<HTMLElement>('#guided-progress')
  const guided_progress_text = container.querySelector<HTMLElement>('#guided-progress-text')
  const guided_progress_action = container.querySelector<HTMLButtonElement>('#guided-progress-action')
     if (!root_select || !formula_select || !scale_selector || !play_scale || !play_chord || !scale_selector_modal || !close_scale_selector || !cancel_scale_selector || !apply_scale_selector || !scale_help_button || !scale_help_copy || !piano_help_button || !piano_help_copy || !guitar_help_button || !guitar_help_copy || !scale_caption || !scale_formula_info || !scale_notes || !note_detail || !piano_view || !guitar_view || !bass_view || !piano_card || !guitar_card || !bass_card || !guided_progress || !guided_progress_text || !guided_progress_action) throw new Error('Explore screen elements were not found')

   const ui = { root_select, formula_select, scale_selector, play_scale, play_chord, scale_selector_modal, close_scale_selector, cancel_scale_selector, apply_scale_selector, scale_help_button, scale_help_copy, piano_help_button, piano_help_copy, guitar_help_button, guitar_help_copy, scale_caption, scale_formula_info, scale_notes, note_detail, piano_view, guitar_view, bass_view, piano_card, guitar_card, bass_card, guided_progress, guided_progress_text, guided_progress_action }
   let selected_pitch_classes = new Set<number>()
   let is_playing = false

   function rebuild_root_options(naming: NoteNamingStyle): void {
      ui.root_select.innerHTML = ''
      ROOTS.forEach((root, root_pitch_class) => { const option = document.createElement('option'); option.value = String(root_pitch_class); option.textContent = displayNoteName(root, naming); ui.root_select.append(option) })
    }
    SCALE_CATEGORY_ORDER.forEach((category) => {
      const group = document.createElement('optgroup')
      group.label = settings.getTranslations().scale_categories[category]
      SCALE_FORMULAS.filter((formula) => formula.category === category).forEach((formula) => {
        const option = document.createElement('option')
        option.value = formula.id
        option.textContent = formula.name
        group.append(option)
      })
      ui.formula_select.append(group)
    })

    const help_closers = new Set<() => void>()

    function bind_help(button: HTMLButtonElement, copy: HTMLElement): void {
      let close_timer: number | undefined
      let is_pinned = false
      const close = () => { if (close_timer !== undefined) window.clearTimeout(close_timer); close_timer = undefined; is_pinned = false; copy.classList.remove('is-open'); button.setAttribute('aria-expanded', 'false') }
      const open = (pin = false) => {
        help_closers.forEach((close_help) => close_help())
        if (close_timer !== undefined) window.clearTimeout(close_timer)
        if (pin) is_pinned = true
        copy.classList.add('is-open')
        button.setAttribute('aria-expanded', 'true')
        close_timer = window.setTimeout(close, HELP_AUTO_CLOSE_MS)
      }
      button.addEventListener('click', () => { if (copy.classList.contains('is-open') && is_pinned) close(); else open(true) })
      button.addEventListener('mouseenter', () => { if (!is_pinned) open() })
      button.addEventListener('focus', () => { if (!is_pinned) open() })
      help_closers.add(close)
    }

   bind_help(ui.scale_help_button, ui.scale_help_copy)
   bind_help(ui.piano_help_button, ui.piano_help_copy)
   bind_help(ui.guitar_help_button, ui.guitar_help_copy)
   document.addEventListener(EXPLORE_HELP_CLOSE_EVENT, () => help_closers.forEach((close_help) => close_help()))

   function render_convention_help(copy: HTMLElement, intro: string, translation: TranslationDictionary): void {
     const conventions = [
       { swatch: 'tonic', label: translation.legend_tonic, description: translation.legend_tonic_description },
       { swatch: 'characteristic', label: translation.legend_characteristic, description: translation.legend_characteristic_description },
       { swatch: 'chord-tone', label: translation.legend_chord_tone, description: translation.legend_chord_tone_description },
       { swatch: 'color-tone', label: translation.legend_color_tone, description: translation.legend_color_tone_description }
     ] as const
     const intro_copy = document.createElement('p')
     intro_copy.className = 'help-copy-intro'
     intro_copy.textContent = intro
     const table = document.createElement('table')
     table.className = 'color-convention-table'
     table.setAttribute('aria-label', translation.color_legend)
     const caption = document.createElement('caption')
     caption.textContent = translation.color_legend
     const head = document.createElement('thead')
     const head_row = document.createElement('tr')
     const color_heading = document.createElement('th')
     color_heading.scope = 'col'
     color_heading.textContent = translation.legend_color
     const meaning_heading = document.createElement('th')
     meaning_heading.scope = 'col'
     meaning_heading.textContent = translation.legend_meaning
     head_row.append(color_heading, meaning_heading)
     head.append(head_row)
     const body = document.createElement('tbody')
     conventions.forEach(({ swatch, label, description }) => {
       const row = document.createElement('tr')
       const color_cell = document.createElement('td')
       const swatch_element = document.createElement('span')
       swatch_element.className = `color-swatch color-swatch--${swatch}`
       swatch_element.setAttribute('aria-label', label)
       color_cell.append(swatch_element)
       const meaning_cell = document.createElement('td')
       const meaning_copy = document.createElement('span')
       meaning_copy.className = 'convention-copy'
       const label_element = document.createElement('strong')
       label_element.textContent = label
       const description_element = document.createElement('span')
       description_element.textContent = description
       meaning_copy.append(label_element, description_element)
       meaning_cell.append(meaning_copy)
       row.append(color_cell, meaning_cell)
       body.append(row)
     })
     table.append(caption, head, body)
     copy.replaceChildren(intro_copy, table)
   }

   function apply_translations(): void {
     const translation = settings.getTranslations()
     const naming = settings.getSettings().note_naming
     document.documentElement.lang = settings.getSettings().language
     const set_text = (selector: string, value: string) => { const element = container.querySelector<HTMLElement>(selector); if (element) element.textContent = value }
       set_text('#app-title', translation.app_title); set_text('#generated-scale-label', translation.generated_scale); set_text('#piano-title', translation.piano); set_text('#guitar-title', `${translation.guitar} · ${displayNoteName(getGuitarTuningNote(settings.getSettings().guitar_tuning_semitones), naming)}`); set_text('#bass-title', `${translation.bass} · ${displayNoteName(getBassTuningNote(settings.getSettings().bass_tuning_semitones), naming)}`); set_text('#scale-selector-title', translation.scale_controls); set_text('#root-label', translation.root); set_text('#mode-label', translation.mode); set_text('#cancel-scale-selector', translation.close); set_text('#apply-scale-selector', translation.save)
        ui.close_scale_selector.setAttribute('aria-label', translation.close); ui.close_scale_selector.title = translation.close
        ui.scale_help_button.setAttribute('aria-label', translation.help); ui.piano_help_button.setAttribute('aria-label', translation.help); ui.guitar_help_button.setAttribute('aria-label', translation.help)
        ui.scale_help_button.title = translation.help; ui.piano_help_button.title = translation.help; ui.guitar_help_button.title = translation.help
        render_convention_help(ui.scale_help_copy, translation.scale_note_help, translation); render_convention_help(ui.piano_help_copy, translation.instrument_color_help, translation); render_convention_help(ui.guitar_help_copy, translation.instrument_color_help, translation)
      container.querySelector('#instrument-region')?.setAttribute('aria-label', translation.instrument_region)
       Array.from(ui.formula_select.options).forEach((option) => { const formula = SCALE_FORMULAS.find((candidate) => candidate.id === option.value); if (formula) option.textContent = translation.formula_names[formula.id] ?? formula.name })
       Array.from(ui.formula_select.querySelectorAll('optgroup')).forEach((group, index) => { const category = SCALE_CATEGORY_ORDER[index]; if (category) group.label = translation.scale_categories[category] })
      set_text('#root-label', translation.root); set_text('#mode-label', translation.mode)
      rebuild_root_options(naming)
      const current_state = application.getState()
      ui.scale_selector.textContent = `${displayNoteName(current_state.scale_instance.root_spelling.text, naming)} ${translation.formula_names[current_state.formula_id] ?? current_state.scale_instance.formula.name}`
     ui.scale_selector.setAttribute('aria-label', translation.scale_controls)
      ui.root_select.value = String(current_state.root_pitch_class)
      ui.formula_select.value = current_state.formula_id
        ui.play_scale.innerHTML = is_playing ? '<svg class="playback-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h12v12H6z"/></svg>' : '<svg class="playback-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>'
       ui.play_scale.setAttribute('aria-label', is_playing ? translation.stop : translation.play_scale)
       ui.play_chord.textContent = translation.play_chord
       ui.play_chord.setAttribute('aria-label', translation.play_chord)
  }

  function select_note(pitch_class: number, focus_target: 'scale' | 'piano' | 'guitar' | 'bass' | null = null): void {
    const guitar_scroll_left = ui.guitar_view.querySelector<HTMLElement>('.guitar-scroll')?.scrollLeft ?? 0
    const bass_scroll_left = ui.bass_view.querySelector<HTMLElement>('.guitar-scroll')?.scrollLeft ?? 0
    selected_pitch_classes = new Set([pitch_class])
    render(application.getState())
    const next_guitar_scroll = ui.guitar_view.querySelector<HTMLElement>('.guitar-scroll')
    const next_bass_scroll = ui.bass_view.querySelector<HTMLElement>('.guitar-scroll')
    if (next_guitar_scroll) next_guitar_scroll.scrollLeft = guitar_scroll_left
    if (next_bass_scroll) next_bass_scroll.scrollLeft = bass_scroll_left
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
    piano.keys.forEach((key, key_index) => { const button = document.createElement('button'); const is_selected = selected_pitch_classes.has(key.pitch_class) && key.is_scale_note; const natural_key_count = piano.keys.slice(0, key_index + (key.is_natural ? 1 : 0)).filter((candidate) => candidate.is_natural).length; const has_scale_overlay = key.is_scale_note && key.primary_role !== 'tonic' && key.primary_role !== 'characteristic'; button.type = 'button'; button.className = `piano-key ${key.is_natural ? 'natural-key' : 'altered-key'} ${key.is_scale_note ? key.primary_role : 'outside-scale'} ${has_scale_overlay ? 'is-scale-note' : ''} ${is_selected ? 'selected' : ''}`; button.style.setProperty('--key-index', String(key.is_natural ? natural_key_count - 1 : natural_key_count)); button.textContent = key.is_scale_note ? displayNoteName(key.label, settings.getSettings().note_naming) : ''; button.setAttribute('aria-label', key.is_scale_note ? `${note_accessible_label({ label: displayNoteName(key.label, settings.getSettings().note_naming), degree: key.degree, primary_role: key.primary_role }, settings.getTranslations())}, octave ${key.octave}` : ''); button.setAttribute('aria-pressed', String(is_selected)); if (key.is_scale_note) { scale_buttons.push(button); button.tabIndex = is_selected || (selected_pitch_classes.size === 0 && scale_buttons.length === 1) ? 0 : -1; button.addEventListener('click', () => { select_note(key.pitch_class, 'piano'); preview_instrument_midi(key.midi, 'piano') }); button.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); move_focus(scale_buttons, button, -1) } if (event.key === 'ArrowRight') { event.preventDefault(); move_focus(scale_buttons, button, 1) } if (event.key === 'Home') { event.preventDefault(); focus_first(scale_buttons) } }) } else { button.tabIndex = -1; button.setAttribute('aria-hidden', 'true'); button.disabled = true } keyboard.append(button) })
    ui.piano_card.hidden = !settings.getSettings().show_piano; ui.piano_view.replaceChildren(keyboard)
  }

  function render_guitar(state: ScaleState): void {
    const naming = settings.getSettings().note_naming
    renderStringedInstrument({
      container: ui.guitar_view,
      model: createGuitarViewModel(state.scale_instance, state.generation_id, 12, shiftTuning(STANDARD_TUNING, settings.getSettings().guitar_tuning_semitones)),
      translation: settings.getTranslations(),
      instrument: 'guitar',
      selected_pitch_classes,
      aria_label: settings.getTranslations().guitar_table,
      note_naming: settings.getSettings().note_naming,
      on_position_selected: (pitch_class, target) => select_note(pitch_class, target),
      on_preview: preview_instrument_midi,
      note_accessible_label: (position) => note_accessible_label({ label: displayNoteName(position.label, settings.getSettings().note_naming), degree: position.degree, primary_role: position.primary_role }, settings.getTranslations())
    })
    ui.guitar_card.hidden = !settings.getSettings().show_guitar
  }

  function render_bass(state: ScaleState): void {
    renderStringedInstrument({
      container: ui.bass_view,
      model: createBassViewModel(state.scale_instance, state.generation_id, 12, shiftTuning(STANDARD_BASS_TUNING, settings.getSettings().bass_tuning_semitones)),
      translation: settings.getTranslations(),
      instrument: 'bass',
      selected_pitch_classes,
      aria_label: settings.getTranslations().bass_table,
      note_naming: settings.getSettings().note_naming,
      on_position_selected: (pitch_class, target) => select_note(pitch_class, target),
      on_preview: preview_instrument_midi,
      note_accessible_label: (position) => note_accessible_label({ label: displayNoteName(position.label, settings.getSettings().note_naming), degree: position.degree, primary_role: position.primary_role }, settings.getTranslations())
    })
    ui.bass_card.hidden = !settings.getSettings().show_bass
  }

  function render(state: ScaleState): void {
     apply_translations(); const naming = settings.getSettings().note_naming; const translation = settings.getTranslations(); ui.root_select.value = String(state.root_pitch_class); ui.formula_select.value = state.formula_id; ui.scale_caption.textContent = state.scale_instance.notes.map((note) => displayNoteName(note.spelling.text, naming)).join(' · '); const note_steps = getStepSemitones(state.scale_instance.formula); ui.scale_formula_info.replaceChildren(); ui.scale_formula_info.setAttribute('aria-label', translation.formula_information); const formula_label = document.createElement('strong'); formula_label.textContent = translation.degree_formula; const formula_value = document.createElement('span'); formula_value.textContent = state.scale_instance.formula.degree_formula.join(' - '); const structure_label = document.createElement('strong'); structure_label.textContent = translation.interval_structure; const structure_value = document.createElement('span'); structure_value.textContent = state.scale_instance.formula.interval_formula.join(' - '); ui.scale_formula_info.append(formula_label, formula_value, structure_label, structure_value); ui.scale_notes.replaceChildren(...state.scale_instance.notes.flatMap((note, note_index) => { const note_wrapper = document.createElement('div'); note_wrapper.className = 'scale-note-wrapper'; const degree_label = document.createElement('span'); degree_label.className = 'scale-degree'; degree_label.textContent = String(display_scale_degree(state.scale_instance.notes.length, note_index, note.degree)); const note_element = document.createElement('button'); note_element.type = 'button'; note_element.className = `scale-note ${note.primary_role} ${selected_pitch_classes.has(note.pitch_class) ? 'selected' : ''}`; note_element.textContent = displayNoteName(note.spelling.text, naming); note_element.setAttribute('aria-label', note_accessible_label({ label: displayNoteName(note.spelling.text, naming), degree: note.degree, primary_role: note.primary_role }, translation)); note_element.setAttribute('aria-pressed', String(selected_pitch_classes.has(note.pitch_class))); note_element.addEventListener('click', () => { select_note(note.pitch_class, 'scale'); preview_scale_note(note_index) }); note_wrapper.append(degree_label, note_element); const interval = note_steps[note_index]; if (interval === undefined) return [note_wrapper]; const interval_element = document.createElement('span'); interval_element.className = 'scale-interval'; interval_element.textContent = format_interval(interval); interval_element.setAttribute('aria-label', `${interval} ${translation.interval_label}`); return [note_wrapper, interval_element] })); const selected_note = selected_pitch_classes.size !== 1 ? null : state.scale_instance.notes.find((note) => selected_pitch_classes.has(note.pitch_class)); ui.note_detail.textContent = selected_note ? `${displayNoteName(selected_note.spelling.text, naming)} · ${translation.degree} ${selected_note.degree} · ${translation.role} ${translation.roles[selected_note.primary_role]}` : translation.select_note; render_piano(state); render_guitar(state); render_bass(state)
  }

  function change_scale_from_controls(): void {
    const next_root_pitch_class = Number(ui.root_select.value)
    const next_formula_id = ui.formula_select.value as FormulaId
    selected_pitch_classes = new Set()
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

  const close_scale_selector_dialog = () => { if (typeof ui.scale_selector_modal.close === 'function') ui.scale_selector_modal.close(); else ui.scale_selector_modal.removeAttribute('open'); ui.scale_selector.focus() }
  ui.scale_selector.addEventListener('click', () => { document.dispatchEvent(new Event(EXPLORE_HELP_CLOSE_EVENT)); if (typeof ui.scale_selector_modal.showModal === 'function') ui.scale_selector_modal.showModal(); else ui.scale_selector_modal.setAttribute('open', '') })
  ui.close_scale_selector.addEventListener('click', close_scale_selector_dialog)
  ui.cancel_scale_selector.addEventListener('click', close_scale_selector_dialog)
  ui.apply_scale_selector.addEventListener('click', () => { change_scale_from_controls(); close_scale_selector_dialog() })
   ui.play_scale.addEventListener('click', async () => { if (is_playing) { await playback.stopAll(); is_playing = false; render(application.getState()); return } selected_pitch_classes = new Set(); const result = await playback.playScale(application.getState().scale_instance, getVisiblePlaybackInstruments(settings)); is_playing = result.ok; render(application.getState()) }); ui.play_chord.addEventListener('click', async () => { if (is_playing) { await playback.stopAll(); is_playing = false; render(application.getState()); return } selected_pitch_classes = new Set(); const state = application.getState(); const chord_notes = state.scale_instance.notes.filter((note) => note.degree === 1 || note.degree === 3 || note.degree === 5); if (chord_notes.length < 2) return; const result = await playback.playChord(state.scale_instance, getVisiblePlaybackInstruments(settings)); is_playing = result.ok; render(application.getState()) }); playback.subscribe({ on_note_started: (note_index) => { const note = application.getState().scale_instance.notes[note_index]; if (note) { selected_pitch_classes = new Set([note.pitch_class]); render(application.getState()) } }, on_chord_started: (note_indexes) => { const chord_pitch_classes = note_indexes.map((note_index) => application.getState().scale_instance.notes[note_index]?.pitch_class).filter((pitch_class): pitch_class is number => pitch_class !== undefined); if (chord_pitch_classes.length > 0) { selected_pitch_classes = new Set(chord_pitch_classes); render(application.getState()) } }, on_stopped: () => { selected_pitch_classes = new Set(); is_playing = false; render(application.getState()) } }); settings.subscribe(() => render(application.getState())); application.subscribe(render); render(application.getState())
}
