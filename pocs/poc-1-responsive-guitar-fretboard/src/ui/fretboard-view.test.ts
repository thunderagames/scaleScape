import { beforeEach, describe, expect, it } from 'vitest'
import { create_fretboard_model } from '../domain/guitar-fretboard'
import type { GuitarNote } from '../domain/guitar-fretboard'
import type { AudioResult, NotePreviewPort } from '../audio/note-preview'
import { render_fretboard } from './fretboard-view'

function create_fake_preview(): NotePreviewPort & { played_notes: GuitarNote[] } {
  const played_notes: GuitarNote[] = []
  const fake_preview: NotePreviewPort & { played_notes: GuitarNote[] } = {
    played_notes,
    async preview(note): Promise<AudioResult> {
      played_notes.push(note)
      return { ok: true }
    },
    stop() {
      return
    }
  }

  return fake_preview
}

describe('render_fretboard', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  it('given_six_string_model_when_rendering_then_exposes_seventy_eight_keyboard_targets', () => {
    const root = document.querySelector<HTMLElement>('#root')
    const preview_port = create_fake_preview()

    if (!root) {
      throw new Error('Test root was not found')
    }

    render_fretboard(root, create_fretboard_model(), preview_port)

    expect(root.querySelectorAll('button.fret-note')).toHaveLength(78)
    expect(root.querySelector('[data-fretboard-scroll]')).not.toBeNull()
    expect(root.querySelector('table[aria-label="Interactive six-string guitar fretboard"]')).not.toBeNull()
  })

  it('given_keyboard_activation_when_clicking_a_note_then_selects_and_previews_the_note', () => {
    const root = document.querySelector<HTMLElement>('#root')
    const preview_port = create_fake_preview()

    if (!root) {
      throw new Error('Test root was not found')
    }

    render_fretboard(root, create_fretboard_model(), preview_port)
    const note_button = root.querySelector<HTMLButtonElement>('[data-note_key="0:0"]')

    if (!note_button) {
      throw new Error('Expected low E open-string button was not found')
    }

    note_button.click()

    expect(note_button.getAttribute('aria-pressed')).toBe('true')
    expect(note_button.dataset.selected).toBe('true')
    expect(preview_port.played_notes[0]?.note_name).toBe('E')
  })

  it('given_selected_note_when_setting_selected_note_then_only_that_position_is_pressed', () => {
    const root = document.querySelector<HTMLElement>('#root')
    const preview_port = create_fake_preview()

    if (!root) {
      throw new Error('Test root was not found')
    }

    const fretboard_view = render_fretboard(root, create_fretboard_model(), preview_port)
    const selected_note = create_fretboard_model().strings[1]?.notes[3]

    if (!selected_note) {
      throw new Error('Expected selected note was not found')
    }

    fretboard_view.setSelectedNote(selected_note)

    expect(root.querySelectorAll('[data-selected="true"]')).toHaveLength(1)
    expect(root.querySelector(`[data-note_key="${selected_note.string_index}:${selected_note.fret}"]`)).not.toBeNull()
  })
})
