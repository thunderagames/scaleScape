import { create_guitar_view_model, type GuitarPosition } from './instruments/guitar'
import { create_piano_view_model, type PianoKey } from './instruments/piano'
import { create_shared_scale_store, type InstrumentId, type SharedScaleState } from './state/shared-scale-state'
import { SCALE_FORMULAS, type FormulaId } from '../../poc-0-theory-audio/src/theory/scale-formulas'
import './styles.css'

const ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const app = document.querySelector<HTMLElement>('#app')

if (!app) {
  throw new Error('Application root was not found')
}

const shared_scale_store = create_shared_scale_store()
let selected_pitch_class: number | null = null

app.innerHTML = `
  <main class="poc-shell">
    <header class="poc-header">
      <p class="eyebrow">ScaleScape Phase-0 POC 2</p>
      <h1>One scale, two instruments.</h1>
      <p class="intro">Change the musical context once. Piano and guitar receive the same generated scale and generation.</p>
    </header>
    <section class="controls" aria-label="Shared scale controls">
      <label>
        Root
        <select id="root-select"></select>
      </label>
      <label>
        Formula
        <select id="formula-select"></select>
      </label>
      <div class="instrument-switch" aria-label="Active instrument">
        <button type="button" data-instrument="piano">Piano</button>
        <button type="button" data-instrument="guitar">Guitar</button>
      </div>
      <p id="state-status" class="state-status" role="status"></p>
    </section>
    <section class="context-card" aria-labelledby="context-title">
      <p class="eyebrow">Shared musical context</p>
      <h2 id="context-title"></h2>
      <p id="context-caption"></p>
    </section>
    <section class="instrument-grid" aria-label="Synchronized instrument views">
      <article class="instrument-card" aria-labelledby="piano-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Keyboard view</p>
            <h2 id="piano-title">Piano · C3 to C5</h2>
          </div>
          <span id="piano-generation" class="generation-label"></span>
        </div>
        <div id="piano-view" class="piano-view"></div>
      </article>
      <article class="instrument-card" aria-labelledby="guitar-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Fretboard view</p>
            <h2 id="guitar-title">Guitar · standard tuning · frets 0 to 12</h2>
          </div>
          <span id="guitar-generation" class="generation-label"></span>
        </div>
        <div id="guitar-view" class="guitar-view"></div>
      </article>
    </section>
    <p id="selection-detail" class="selection-detail" aria-live="polite">Select a scale position to identify the same pitch across both instruments.</p>
  </main>
`

const root_select = document.querySelector<HTMLSelectElement>('#root-select')
const formula_select = document.querySelector<HTMLSelectElement>('#formula-select')
const state_status = document.querySelector<HTMLElement>('#state-status')
const context_title = document.querySelector<HTMLElement>('#context-title')
const context_caption = document.querySelector<HTMLElement>('#context-caption')
const piano_view = document.querySelector<HTMLElement>('#piano-view')
const guitar_view = document.querySelector<HTMLElement>('#guitar-view')
const piano_generation = document.querySelector<HTMLElement>('#piano-generation')
const guitar_generation = document.querySelector<HTMLElement>('#guitar-generation')
const selection_detail = document.querySelector<HTMLElement>('#selection-detail')
const instrument_buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-instrument]'))

if (!root_select || !formula_select || !state_status || !context_title || !context_caption || !piano_view || !guitar_view || !piano_generation || !guitar_generation || !selection_detail) {
  throw new Error('POC interface elements were not found')
}

const ui = {
  root_select,
  formula_select,
  state_status,
  context_title,
  context_caption,
  piano_view,
  guitar_view,
  piano_generation,
  guitar_generation,
  selection_detail
}

ROOTS.forEach((root, root_pitch_class) => {
  const option = document.createElement('option')
  option.value = String(root_pitch_class)
  option.textContent = root
  ui.root_select.append(option)
})

SCALE_FORMULAS.forEach((formula) => {
  const option = document.createElement('option')
  option.value = formula.id
  option.textContent = formula.name
  ui.formula_select.append(option)
})

function get_role_class(primary_role: string | null): string {
  return primary_role ?? 'outside-scale'
}

function render_piano(state: SharedScaleState): void {
  const piano = create_piano_view_model(state.scale_instance, state.generation_id)
  const keyboard = document.createElement('div')
  keyboard.className = 'piano-keyboard'
  keyboard.setAttribute('aria-label', 'Two-octave piano keyboard')

  piano.keys.forEach((key: PianoKey) => {
    const button = document.createElement('button')
    const is_selected = selected_pitch_class === key.pitch_class && key.is_scale_note
    button.type = 'button'
    button.className = `piano-key ${key.is_natural ? 'natural-key' : 'altered-key'} ${key.is_scale_note ? get_role_class(key.primary_role) : 'outside-scale'} ${is_selected ? 'selected' : ''}`
    button.style.setProperty('--key-index', String(key.key_index))
    button.textContent = key.is_scale_note ? key.note_name : ''
    button.title = `${key.note_name}${key.octave}${key.is_scale_note ? `, degree ${key.degree}` : ', outside scale'}`
    button.setAttribute('aria-label', button.title)
    button.setAttribute('aria-pressed', String(is_selected))
    button.addEventListener('click', () => {
      if (!key.is_scale_note) {
        return
      }
      selected_pitch_class = key.pitch_class
      render(shared_scale_store.get_snapshot())
    })
    keyboard.append(button)
  })

  ui.piano_view.replaceChildren(keyboard)
  ui.piano_generation.textContent = `generation ${piano.generation_id}`
}

function render_guitar(state: SharedScaleState): void {
  const guitar = create_guitar_view_model(state.scale_instance, state.generation_id)
  const scroll_container = document.createElement('div')
  scroll_container.className = 'guitar-scroll'
  const table = document.createElement('table')
  table.className = 'guitar-table'
  table.setAttribute('aria-label', 'Synchronized six-string guitar fretboard')
  const header = document.createElement('tr')
  header.innerHTML = '<th scope="col">String</th>'

  for (let fret = 0; fret <= guitar.fret_count; fret += 1) {
    const cell = document.createElement('th')
    cell.scope = 'col'
    cell.textContent = String(fret)
    header.append(cell)
  }

  const table_head = document.createElement('thead')
  table_head.append(header)
  table.append(table_head)
  const table_body = document.createElement('tbody')

  guitar.strings.forEach((guitar_string) => {
    const row = document.createElement('tr')
    const string_cell = document.createElement('th')
    string_cell.scope = 'row'
    string_cell.textContent = guitar_string.tuning.name
    row.append(string_cell)

    guitar_string.positions.forEach((position: GuitarPosition) => {
      const cell = document.createElement('td')
      const button = document.createElement('button')
      const is_selected = selected_pitch_class === position.pitch_class && position.is_scale_note
      button.type = 'button'
      button.className = `guitar-position ${position.is_scale_note ? get_role_class(position.primary_role) : 'outside-scale'} ${is_selected ? 'selected' : ''}`
      button.textContent = position.is_scale_note ? position.note_name : ''
      button.title = `${position.note_name}${position.octave}${position.is_scale_note ? `, degree ${position.degree}` : ', outside scale'}`
      button.setAttribute('aria-label', `${guitar_string.tuning.name}, fret ${position.fret}, ${button.title}`)
      button.setAttribute('aria-pressed', String(is_selected))
      button.addEventListener('click', () => {
        if (!position.is_scale_note) {
          return
        }
        selected_pitch_class = position.pitch_class
        render(shared_scale_store.get_snapshot())
      })
      cell.append(button)
      row.append(cell)
    })

    table_body.append(row)
  })

  table.append(table_body)
  scroll_container.append(table)
  ui.guitar_view.replaceChildren(scroll_container)
  ui.guitar_generation.textContent = `generation ${guitar.generation_id}`
}

function render(state: SharedScaleState): void {
  const formula_name = state.scale_instance.formula.name
  ui.context_title.textContent = `${state.scale_instance.root_spelling.text} ${formula_name}`
  ui.context_caption.textContent = `${state.scale_instance.notes.map((note) => note.spelling.text).join(' · ')} · one ScaleInstance consumed by both views.`
  ui.state_status.textContent = `Shared generation ${state.generation_id} · active instrument: ${state.active_instrument}`
  ui.root_select.value = String(state.root_pitch_class)
  ui.formula_select.value = state.formula_id
  instrument_buttons.forEach((button) => {
    const is_active = button.dataset.instrument === state.active_instrument
    button.classList.toggle('active', is_active)
    button.setAttribute('aria-pressed', String(is_active))
  })
  render_piano(state)
  render_guitar(state)

  if (selected_pitch_class === null) {
    ui.selection_detail.textContent = 'Select a scale position to identify the same pitch across both instruments.'
    return
  }

  const selected_note = state.scale_instance.notes.find((note) => note.pitch_class === selected_pitch_class)
  ui.selection_detail.textContent = selected_note
    ? `${selected_note.spelling.text} · degree ${selected_note.degree} · ${selected_note.interval.label} · ${selected_note.primary_role} · highlighted on both instruments.`
    : 'The selected pitch is outside the current scale.'
}

ui.root_select.addEventListener('change', () => {
  shared_scale_store.set_scale(Number(ui.root_select.value), ui.formula_select.value as FormulaId)
})

ui.formula_select.addEventListener('change', () => {
  shared_scale_store.set_scale(Number(ui.root_select.value), ui.formula_select.value as FormulaId)
})

instrument_buttons.forEach((button) => {
  button.addEventListener('click', () => {
    shared_scale_store.select_instrument(button.dataset.instrument as InstrumentId)
  })
})

shared_scale_store.subscribe(render)
render(shared_scale_store.get_snapshot())
