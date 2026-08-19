import type { NotePreviewPort } from '../audio/note-preview'
import type { FretboardModel, GuitarNote } from '../domain/guitar-fretboard'
import { create_press_guard } from '../interaction/fretboard-interaction'

export interface FretboardView {
  setSelectedNote(note: GuitarNote | null): void
  destroy(): void
}

export interface FretboardViewOptions {
  readonly on_selected_note?: (note: GuitarNote) => void
}

function get_note_label(note: GuitarNote): string {
  const position = note.is_open ? 'open string' : `fret ${note.fret}`
  const scale_label = note.is_scale_note ? 'scale note' : 'outside scale'
  const root_label = note.is_root ? ', root' : ''
  return `${note.string_name}, ${position}, ${note.note_name}${note.octave}, ${scale_label}${root_label}`
}

export function render_fretboard(
  container: HTMLElement,
  model: FretboardModel,
  preview_port: NotePreviewPort,
  options: FretboardViewOptions = {}
): FretboardView {
  const scroll_container = document.createElement('div')
  scroll_container.className = 'fretboard-scroll'
  scroll_container.setAttribute('data-fretboard-scroll', 'true')

  const table = document.createElement('table')
  table.className = 'fretboard'
  table.setAttribute('aria-label', 'Interactive six-string guitar fretboard')

  const table_head = document.createElement('thead')
  const header_row = document.createElement('tr')
  const string_header = document.createElement('th')
  string_header.scope = 'col'
  string_header.textContent = 'String'
  header_row.append(string_header)

  for (let fret = 0; fret <= model.fret_count; fret += 1) {
    const fret_header = document.createElement('th')
    fret_header.scope = 'col'
    fret_header.textContent = String(fret)
    header_row.append(fret_header)
  }

  table_head.append(header_row)
  table.append(table_head)

  const table_body = document.createElement('tbody')
  const note_buttons = new Map<string, HTMLButtonElement>()

  const select_note = (note: GuitarNote, button: HTMLButtonElement) => {
    for (const selected_button of note_buttons.values()) {
      selected_button.removeAttribute('data-selected')
      selected_button.setAttribute('aria-pressed', 'false')
    }

    button.setAttribute('data-selected', 'true')
    button.setAttribute('aria-pressed', 'true')
    options.on_selected_note?.(note)
    void preview_port.preview(note)
  }

  for (const guitar_string of model.strings) {
    const row = document.createElement('tr')
    const string_cell = document.createElement('th')
    string_cell.scope = 'row'
    string_cell.textContent = guitar_string.tuning.name
    row.append(string_cell)

    for (const note of guitar_string.notes) {
      const cell = document.createElement('td')
      const button = document.createElement('button')
      const note_key = `${note.string_index}:${note.fret}`
      const press_guard = create_press_guard(() => select_note(note, button))

      button.type = 'button'
      button.className = 'fret-note'
      button.textContent = note.is_scale_note ? note.note_name : ''
      button.title = get_note_label(note)
      button.setAttribute('aria-label', get_note_label(note))
      button.setAttribute('aria-pressed', 'false')
      button.setAttribute('data-scale-note', String(note.is_scale_note))
      button.setAttribute('data-root', String(note.is_root))
      button.dataset.note_key = note_key

      button.addEventListener('pointerdown', (event) => {
        press_guard.pointerDown(event.pointerId, event.clientX, event.clientY)
        button.setPointerCapture?.(event.pointerId)
      })
      button.addEventListener('pointermove', (event) => {
        press_guard.pointerMove(event.pointerId, event.clientX, event.clientY)
      })
      button.addEventListener('pointerup', (event) => {
        press_guard.pointerUp(event.pointerId)
      })
      button.addEventListener('pointercancel', (event) => {
        press_guard.pointerCancel(event.pointerId)
      })
      button.addEventListener('click', (event) => {
        if (event.detail === 0) {
          select_note(note, button)
        }
      })

      note_buttons.set(note_key, button)
      cell.append(button)
      row.append(cell)
    }

    table_body.append(row)
  }

  table.append(table_body)
  scroll_container.append(table)
  container.replaceChildren(scroll_container)

  return {
    setSelectedNote(note) {
      for (const [note_key, button] of note_buttons) {
        const selected = note !== null && note_key === `${note.string_index}:${note.fret}`
        if (selected) {
          button.setAttribute('data-selected', 'true')
        } else {
          button.removeAttribute('data-selected')
        }
        button.setAttribute('aria-pressed', String(selected))
      }
    },
    destroy() {
      preview_port.stop()
      container.replaceChildren()
    }
  }
}
