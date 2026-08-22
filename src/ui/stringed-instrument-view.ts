import type { PlaybackInstrument } from '../audio/playback-port'
import type { TranslationDictionary } from '../settings/localization'
import type { StringedInstrumentPosition, StringedInstrumentViewModel } from '../instruments/guitar-view-model'
import { displayNoteName, type NoteNamingStyle } from '../settings/note-naming'

export interface StringedInstrumentViewOptions {
  readonly container: HTMLElement
  readonly model: StringedInstrumentViewModel
  readonly translation: TranslationDictionary
  readonly instrument: PlaybackInstrument
  readonly selected_pitch_class: number | null
  readonly aria_label: string
  readonly note_naming: NoteNamingStyle
  readonly on_position_selected: (pitch_class: number, target: 'guitar' | 'bass') => void
  readonly on_preview: (midi: number, instrument: PlaybackInstrument) => void
  readonly note_accessible_label: (position: StringedInstrumentPosition) => string
}

function move_focus(buttons: readonly HTMLButtonElement[], current_button: HTMLButtonElement, direction: -1 | 1): void {
  const next_button = buttons[buttons.indexOf(current_button) + direction]
  if (!next_button) return
  current_button.tabIndex = -1
  next_button.tabIndex = 0
  next_button.focus()
}

function focus_edge(buttons: readonly HTMLButtonElement[], current_button: HTMLButtonElement, edge: 'first' | 'last'): void {
  const next_button = buttons[edge === 'first' ? 0 : buttons.length - 1]
  if (!next_button) return
  current_button.tabIndex = -1
  next_button.tabIndex = 0
  next_button.focus()
}

export function renderStringedInstrument(options: StringedInstrumentViewOptions): void {
  const { container, model, translation, instrument, selected_pitch_class, aria_label, note_naming, on_position_selected, on_preview, note_accessible_label } = options
  const scroll = document.createElement('div')
  scroll.className = 'guitar-scroll'
  const table = document.createElement('table')
  table.className = 'guitar-table'
  table.setAttribute('aria-label', aria_label)
  const head = document.createElement('tr')
  const string_heading = document.createElement('th')
  string_heading.scope = 'col'
  string_heading.textContent = translation.string_label
  head.append(string_heading)
  for (let fret = 0; fret <= model.fret_count; fret += 1) {
    const cell = document.createElement('th')
    cell.scope = 'col'
    cell.textContent = String(fret)
    head.append(cell)
  }
  const table_head = document.createElement('thead')
  table_head.append(head)
  table.append(table_head)
  const body = document.createElement('tbody')
  const fret_buttons: HTMLButtonElement[][] = []
  const all_scale_buttons: HTMLButtonElement[] = []
  const target = instrument === 'bass' ? 'bass' : 'guitar'

  model.strings.forEach((string_model, string_index) => {
    const row = document.createElement('tr')
    const label = document.createElement('th')
    label.scope = 'row'
    label.textContent = displayNoteName(string_model.tuning.name, note_naming)
    row.append(label)
    const position_buttons: HTMLButtonElement[] = []
    const scale_buttons: HTMLButtonElement[] = []
    fret_buttons.push(position_buttons)
    string_model.positions.forEach((position) => {
      const cell = document.createElement('td')
      const button = document.createElement('button')
      const is_scale_note = position.is_scale_note
      const is_selected = selected_pitch_class === position.pitch_class && is_scale_note
      button.type = 'button'
      button.className = `guitar-position ${is_scale_note ? position.primary_role : 'outside-scale'} ${is_selected ? 'selected' : ''}`
      button.textContent = is_scale_note ? displayNoteName(position.label, note_naming) : ''
      button.setAttribute('aria-label', is_scale_note ? `${position.string_name}, ${translation.fret_label} ${position.fret}, ${note_accessible_label(position)}, octave ${position.octave}` : '')
      button.setAttribute('aria-pressed', String(is_selected))
      button.tabIndex = is_selected || (selected_pitch_class === null && all_scale_buttons.length === 0 && is_scale_note) ? 0 : -1
      position_buttons.push(button)
      if (is_scale_note) {
        scale_buttons.push(button)
        all_scale_buttons.push(button)
        button.addEventListener('click', () => { on_position_selected(position.pitch_class, target); on_preview(position.midi, instrument) })
        button.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); move_focus(scale_buttons, button, -1) }
          if (event.key === 'ArrowRight') { event.preventDefault(); move_focus(scale_buttons, button, 1) }
           if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
             event.preventDefault()
             const next_string_index = string_index + (event.key === 'ArrowUp' ? -1 : 1)
             const next_button = fret_buttons[next_string_index]?.[position.fret]
             if (next_button?.classList.contains('outside-scale') === false) {
               button.tabIndex = -1
               next_button.tabIndex = 0
               next_button.focus()
             }
           }
           if (event.key === 'Home') { event.preventDefault(); focus_edge(scale_buttons, button, 'first') }
           if (event.key === 'End') { event.preventDefault(); focus_edge(scale_buttons, button, 'last') }
         })
      } else {
        button.disabled = true
        button.setAttribute('aria-hidden', 'true')
      }
      cell.append(button)
      row.append(cell)
    })
    body.append(row)
  })
  table.append(body)
  scroll.append(table)
  container.replaceChildren(scroll)
}
