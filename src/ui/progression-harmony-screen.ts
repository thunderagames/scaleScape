import type { ExploreApplication } from '../application/explore-application'
import { formatProgressionDegrees, getCompatibleProgressions, getUniqueProgressionDegrees, type ProgressionDefinition } from '../content/progression-catalog'
import { createBassViewModel, STANDARD_BASS_TUNING } from '../instruments/bass-view-model'
import { createGuitarViewModel, findChordPositions, findFretWindowStart, shiftTuning, STANDARD_TUNING } from '../instruments/guitar-view-model'
import { createPianoViewModel } from '../instruments/piano-view-model'
import { createUkuleleViewModel, STANDARD_UKULELE_TUNING } from '../instruments/ukulele-view-model'
import type { PlaybackInstrument } from '../audio/playback-port'
import type { SettingsStore } from '../settings/settings-store'
import { displayNoteName } from '../settings/note-naming'
import { getDegreeTriad, getRomanDegree, mapProgressionRoles, type ProgressionRole } from '../theory/progression-harmony'
import { renderStringedInstrument } from './stringed-instrument-view'

interface InstrumentDefinition {
  readonly id: PlaybackInstrument
  readonly label: string
}

const INSTRUMENTS: readonly InstrumentDefinition[] = [
  { id: 'piano', label: 'piano' },
  { id: 'guitar', label: 'guitar' },
  { id: 'bass', label: 'bass' },
  { id: 'ukulele', label: 'ukulele' }
]

function getInstrumentLabel(instrument: PlaybackInstrument, settings: SettingsStore): string {
  const translation = settings.getTranslations()
  return instrument === 'piano' ? translation.piano : instrument === 'guitar' ? translation.guitar : instrument === 'bass' ? translation.bass : translation.ukulele
}

function createPianoMap(container: HTMLElement, scale_instance: ReturnType<ExploreApplication['getState']>['scale_instance'], generation_id: number, settings: SettingsStore, visible_pitch_classes: ReadonlySet<number>, progression_roles: ReadonlyMap<number, ProgressionRole>, label: string): void {
  const model = createPianoViewModel(scale_instance, generation_id, 48, 72, { visible_pitch_classes, progression_roles })
  const keyboard = document.createElement('div')
  keyboard.className = 'piano-keyboard harmony-piano-keyboard'
  keyboard.setAttribute('aria-label', label)
  model.keys.forEach((key, key_index) => {
    const button = document.createElement('button')
    const role = key.progression_role
    const natural_key_count = model.keys.slice(0, key_index + (key.is_natural ? 1 : 0)).filter((candidate) => candidate.is_natural).length
    button.type = 'button'
    button.className = `piano-key ${key.is_natural ? 'natural-key' : 'altered-key'} ${key.is_scale_note ? `progression-${role}` : 'outside-scale'}`
    button.style.setProperty('--key-index', String(key.is_natural ? natural_key_count - 1 : natural_key_count))
    button.textContent = key.is_scale_note ? displayNoteName(key.label, settings.getSettings().note_naming) : ''
    button.setAttribute('aria-label', key.is_scale_note ? `${displayNoteName(key.label, settings.getSettings().note_naming)}, ${settings.getTranslations().degree} ${key.degree}, ${settings.getTranslations().harmony_roles[role ?? 'nonchord']}, octave ${key.octave}` : '')
    button.disabled = !key.is_scale_note
    keyboard.append(button)
  })
  container.querySelector('.harmony-piano-keyboard')?.remove()
  container.append(keyboard)
  const available_width = container.clientWidth
  keyboard.style.setProperty('--harmony-natural-key-width', `${available_width > 0 ? available_width / 15 : 44}px`)
}

function createStringedMap(container: HTMLElement, instrument: PlaybackInstrument, scale_instance: ReturnType<ExploreApplication['getState']>['scale_instance'], generation_id: number, settings: SettingsStore, visible_pitch_classes: ReadonlySet<number>, progression_roles: ReadonlyMap<number, ProgressionRole>, fret_count: number, start_fret: number, label: string, chord_positions?: ReadonlyMap<number, number>): void {
  const tuning_offset = instrument === 'guitar' ? settings.getSettings().guitar_tuning_semitones : instrument === 'bass' ? settings.getSettings().bass_tuning_semitones : settings.getSettings().ukulele_tuning_semitones
  const tuning = instrument === 'guitar' ? shiftTuning(STANDARD_TUNING, tuning_offset) : instrument === 'bass' ? shiftTuning(STANDARD_BASS_TUNING, tuning_offset) : shiftTuning(STANDARD_UKULELE_TUNING, tuning_offset)
  const model_options = { start_fret, visible_pitch_classes, progression_roles, chord_positions }
  const model = instrument === 'guitar' ? createGuitarViewModel(scale_instance, generation_id, fret_count, tuning, model_options) : instrument === 'bass' ? createBassViewModel(scale_instance, generation_id, fret_count, tuning, model_options) : createUkuleleViewModel(scale_instance, generation_id, fret_count, tuning, model_options)
  const map_container = document.createElement('div')
  map_container.className = 'harmony-rendered-map'
  container.querySelector('.harmony-rendered-map')?.remove()
  container.append(map_container)
  renderStringedInstrument({
    container: map_container,
    model,
    translation: settings.getTranslations(),
    instrument,
    selected_pitch_classes: new Set(),
    aria_label: label,
    note_naming: settings.getSettings().note_naming,
    use_progression_roles: true,
    on_position_selected: () => undefined,
    on_preview: () => undefined,
    note_accessible_label: (position) => `${displayNoteName(position.label, settings.getSettings().note_naming)}, ${settings.getTranslations().degree} ${position.degree}, ${settings.getTranslations().harmony_roles[position.progression_role ?? 'nonchord']}, octave ${position.octave}`
  })
}

export function renderHarmonyScreen(container: HTMLElement, application: ExploreApplication, settings: SettingsStore): void {
  container.innerHTML = `
    <section class="harmony-content" aria-labelledby="harmony-title">
      <p class="eyebrow" id="harmony-label"></p>
      <h1 id="harmony-title"></h1>
      <p id="harmony-intro" class="harmony-intro"></p>
      <section class="harmony-controls" aria-labelledby="harmony-selection-mode-label">
        <fieldset class="harmony-mode-toggle">
          <legend id="harmony-selection-mode-label"></legend>
          <label><input type="radio" name="harmony-selection-mode" value="progression" checked><span id="harmony-progression-mode-label"></span></label>
          <label><input type="radio" name="harmony-selection-mode" value="chord"><span id="harmony-chord-mode-label"></span></label>
        </fieldset>
        <label for="harmony-progression"><span id="harmony-progression-label"></span><select id="harmony-progression" class="control-select"></select></label>
        <label for="harmony-chord"><span id="harmony-chord-label"></span><select id="harmony-chord" class="control-select"></select></label>
      </section>
      <section id="harmony-color-legend" class="harmony-color-legend" aria-labelledby="harmony-color-legend-title">
        <h2 id="harmony-color-legend-title"></h2>
        <div id="harmony-color-legend-items" class="harmony-color-legend-items"></div>
      </section>
      <p id="harmony-empty" class="audio-fallback" hidden></p>
      <div id="harmony-rows" class="harmony-rows"></div>
    </section>
  `

  const label = container.querySelector<HTMLElement>('#harmony-label')
  const title = container.querySelector<HTMLElement>('#harmony-title')
  const intro = container.querySelector<HTMLElement>('#harmony-intro')
  const progression_label = container.querySelector<HTMLElement>('#harmony-progression-label')
  const chord_label = container.querySelector<HTMLElement>('#harmony-chord-label')
  const mode_label = container.querySelector<HTMLElement>('#harmony-selection-mode-label')
  const progression_mode_label = container.querySelector<HTMLElement>('#harmony-progression-mode-label')
  const chord_mode_label = container.querySelector<HTMLElement>('#harmony-chord-mode-label')
  const progression_select = container.querySelector<HTMLSelectElement>('#harmony-progression')
  const chord_select = container.querySelector<HTMLSelectElement>('#harmony-chord')
  const color_legend_title = container.querySelector<HTMLElement>('#harmony-color-legend-title')
  const color_legend_items = container.querySelector<HTMLElement>('#harmony-color-legend-items')
  const empty = container.querySelector<HTMLElement>('#harmony-empty')
  const rows = container.querySelector<HTMLElement>('#harmony-rows')
  if (!label || !title || !intro || !progression_label || !chord_label || !mode_label || !progression_mode_label || !chord_mode_label || !progression_select || !chord_select || !color_legend_title || !color_legend_items || !empty || !rows) throw new Error('Harmony screen elements were not found')
  const ui = { label, title, intro, progression_label, chord_label, mode_label, progression_mode_label, chord_mode_label, progression_select, chord_select, color_legend_title, color_legend_items, empty, rows }

  let selected_progression_id: string | undefined
  let selected_chord_degree = 1
  let selection_mode: 'progression' | 'chord' = 'progression'

  function apply_translations(): void {
    const translation = settings.getTranslations()
    ui.label.textContent = translation.nav_harmony
    ui.title.textContent = translation.harmony_title
    ui.intro.textContent = translation.harmony_intro
    ui.progression_label.textContent = translation.harmony_progression
    ui.chord_label.textContent = translation.harmony_chord
    ui.mode_label.textContent = translation.harmony_selection_mode
    ui.progression_mode_label.textContent = translation.harmony_progression
    ui.chord_mode_label.textContent = translation.harmony_chord
    ui.color_legend_title.textContent = translation.harmony_color_legend
    ui.empty.textContent = translation.harmony_no_progressions
    ui.color_legend_items.replaceChildren()
    const legend_items: readonly { readonly role: 'chord_tonic' | 'chord_tone' | 'nonchord'; readonly label: string }[] = [
      { role: 'chord_tonic', label: translation.harmony_roles.chord_tonic },
      { role: 'chord_tone', label: translation.harmony_roles.chord_tone },
      { role: 'nonchord', label: translation.harmony_roles.nonchord }
    ]
    legend_items.forEach(({ role, label: item_label }) => {
      const item = document.createElement('div')
      item.className = 'harmony-color-legend-item'
      const swatch = document.createElement('span')
      swatch.className = `harmony-color-swatch harmony-color-swatch--${role}`
      swatch.setAttribute('aria-hidden', 'true')
      const text = document.createElement('span')
      text.textContent = item_label
      item.append(swatch, text)
      ui.color_legend_items.append(item)
    })
  }

  function render(): void {
    const translation = settings.getTranslations()
    const state = application.getState()
    const compatible = getCompatibleProgressions(state.scale_instance)
    const complete_degrees = state.scale_instance.notes.map((note) => note.degree).filter((degree) => getDegreeTriad(state.scale_instance, degree).ok)
    const selected = compatible.find((progression) => progression.id === selected_progression_id) ?? compatible[0]
    selected_progression_id = selected?.id
    ui.progression_select.replaceChildren()
    const genres = [...new Set(compatible.map((progression) => progression.genre))]
    genres.forEach((genre) => {
      const group = document.createElement('optgroup')
      group.label = translation.progression_genres[genre] ?? genre
      compatible.filter((progression) => progression.genre === genre).forEach((progression) => {
        const option = document.createElement('option')
        option.value = progression.id
        const progression_name = translation.progression_names[progression.id] ?? progression.id
        option.textContent = `${progression_name} (${formatProgressionDegrees(state.scale_instance, progression)})`
        group.append(option)
      })
      ui.progression_select.append(group)
    })
    ui.progression_select.value = selected?.id ?? ''
    ui.chord_select.replaceChildren()
    complete_degrees.forEach((degree) => {
      const triad_result = getDegreeTriad(state.scale_instance, degree)
      if (!triad_result.ok) return
      const option = document.createElement('option')
      option.value = String(degree)
      option.textContent = `${getRomanDegree(degree)}-${triad_result.value.name}`
      ui.chord_select.append(option)
    })
    if (!complete_degrees.includes(selected_chord_degree)) selected_chord_degree = complete_degrees[0] ?? 1
    ui.chord_select.value = String(selected_chord_degree)
    ui.progression_select.hidden = selection_mode !== 'progression'
    ui.progression_label.hidden = selection_mode !== 'progression'
    ui.chord_select.hidden = selection_mode !== 'chord'
    ui.chord_label.hidden = selection_mode !== 'chord'
    ui.empty.hidden = selection_mode === 'chord' || compatible.length > 0
    ui.rows.replaceChildren()
    if (selection_mode === 'progression' && selected) render_progression_rows(selected)
    if (selection_mode === 'chord') render_degree_rows([selected_chord_degree])
  }

  function render_progression_rows(progression: ProgressionDefinition): void {
    render_degree_rows(getUniqueProgressionDegrees(progression))
  }

  function render_degree_rows(degrees: readonly number[]): void {
    const state = application.getState()
    const translation = settings.getTranslations()
    degrees.forEach((degree) => {
      const triad_result = getDegreeTriad(state.scale_instance, degree)
      if (!triad_result.ok) return
      const triad = triad_result.value
      const roles = new Map(mapProgressionRoles(state.scale_instance, triad).map(({ note, role }) => [note.pitch_class, role]))
      const triad_pitch_classes = new Set(triad.notes.map((note) => note.pitch_class))
      const row = document.createElement('article')
      row.className = 'harmony-degree-row'
      const heading = document.createElement('div')
      heading.className = 'harmony-degree-heading'
      const heading_title = document.createElement('h2')
      heading_title.textContent = `${getRomanDegree(degree)}-${triad.name}`
      heading.append(heading_title)
      const heading_copy = document.createElement('p')
      heading_copy.textContent = `${triad.notes.map((note) => displayNoteName(note.spelling.text, settings.getSettings().note_naming)).join('–')} · ${translation.harmony_degree} ${degree}`
      heading.append(heading_copy)
      row.append(heading)
      const instruments = document.createElement('div')
      instruments.className = 'harmony-instrument-grid'
      INSTRUMENTS.filter((instrument) => settings.getSettings()[`show_${instrument.id}`]).forEach((instrument) => {
        const card = document.createElement('section')
        card.className = `harmony-instrument harmony-instrument--${instrument.id}`
        card.setAttribute('aria-label', getInstrumentLabel(instrument.id, settings))
        const maps = document.createElement('div')
        maps.className = 'harmony-map-grid'
        const left = document.createElement('div')
        left.className = 'harmony-map harmony-map--short'
        const left_label = instrument.id === 'piano' ? translation.harmony_chord_map : `${translation.harmony_chord_map} · ${translation.harmony_fret_window}`
        const right = document.createElement('div')
        right.className = 'harmony-map harmony-map--long'
        const right_label = instrument.id === 'piano' ? translation.harmony_piano_map : `${translation.harmony_scale_map} · ${translation.harmony_full_fretboard}`
        if (instrument.id === 'piano') {
          createPianoMap(left, state.scale_instance, state.generation_id, settings, triad_pitch_classes, roles, left_label)
          createPianoMap(right, state.scale_instance, state.generation_id, settings, new Set(state.scale_instance.notes.map((note) => note.pitch_class)), roles, right_label)
        } else {
          const tuning_offset = instrument.id === 'guitar' ? settings.getSettings().guitar_tuning_semitones : instrument.id === 'bass' ? settings.getSettings().bass_tuning_semitones : settings.getSettings().ukulele_tuning_semitones
          const tuning = instrument.id === 'guitar' ? shiftTuning(STANDARD_TUNING, tuning_offset) : instrument.id === 'bass' ? shiftTuning(STANDARD_BASS_TUNING, tuning_offset) : shiftTuning(STANDARD_UKULELE_TUNING, tuning_offset)
          const start_fret = findFretWindowStart(tuning, triad_pitch_classes)
          const chord_positions = findChordPositions(tuning, triad_pitch_classes, start_fret, 4, triad.notes[0].pitch_class)
          createStringedMap(left, instrument.id, state.scale_instance, state.generation_id, settings, triad_pitch_classes, roles, 4, start_fret, left_label, chord_positions)
          createStringedMap(right, instrument.id, state.scale_instance, state.generation_id, settings, new Set(state.scale_instance.notes.map((note) => note.pitch_class)), roles, 12, 0, right_label)
        }
        maps.append(left, right)
        card.append(maps)
        instruments.append(card)
      })
      row.append(instruments)
      ui.rows.append(row)
    })
  }

  ui.progression_select.addEventListener('change', () => { selected_progression_id = ui.progression_select.value; render() })
  ui.chord_select.addEventListener('change', () => { selected_chord_degree = Number(ui.chord_select.value); render() })
  container.querySelectorAll<HTMLInputElement>('input[name="harmony-selection-mode"]').forEach((input) => input.addEventListener('change', () => { selection_mode = input.value as 'progression' | 'chord'; render() }))
  settings.subscribe(() => { apply_translations(); render() })
  application.subscribe(() => render())
  apply_translations()
  render()
}
