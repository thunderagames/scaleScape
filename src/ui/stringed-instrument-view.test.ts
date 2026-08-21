import { describe, expect, it, vi } from 'vitest'
import { createBassViewModel } from '../instruments/bass-view-model'
import { createScaleInstance } from '../theory/scale-instance'
import { getTranslations } from '../settings/localization'
import { renderStringedInstrument } from './stringed-instrument-view'

function createRenderedBass() {
  const container = document.createElement('div')
  document.body.append(container)
  const on_position_selected = vi.fn()
  const on_preview = vi.fn()
  renderStringedInstrument({
    container,
    model: createBassViewModel(createScaleInstance(4, 'dorian'), 1),
    translation: getTranslations('en'),
    instrument: 'bass',
    selected_pitch_class: null,
    aria_label: 'Interactive bass fretboard',
    on_position_selected,
    on_preview,
    note_accessible_label: (position) => position.label
  })
  return { container, on_position_selected, on_preview }
}

describe('stringed instrument view', () => {
  it('given_bass_model_when_rendering_then_creates_four_string_table_with_first_scale_note_focusable', () => {
    const { container } = createRenderedBass()

    expect(container.querySelectorAll('tbody tr')).toHaveLength(4)
    expect(container.querySelectorAll('thead th')).toHaveLength(14)
    expect(container.querySelector('table')?.getAttribute('aria-label')).toBe('Interactive bass fretboard')
    expect(container.querySelector<HTMLButtonElement>('.guitar-position')?.tabIndex).toBe(0)
  })

  it('given_bass_note_when_clicked_then_notifies_selection_and_previews_bass', () => {
    const { container, on_position_selected, on_preview } = createRenderedBass()
    const tonic = container.querySelector<HTMLButtonElement>('tbody tr:first-child .guitar-position.tonic')

    tonic?.click()

    expect(on_position_selected).toHaveBeenCalledWith(4, 'bass')
    expect(on_preview).toHaveBeenCalledWith(28, 'bass')
  })

  it('given_bass_note_when_moving_down_then_focuses_the_same_fret_on_the_next_string', () => {
    const { container } = createRenderedBass()
    const first_string_tonic = container.querySelector<HTMLButtonElement>('tbody tr:first-child .guitar-position.tonic')
    const next_string_same_fret = container.querySelector<HTMLButtonElement>('tbody tr:nth-child(2) .guitar-position')

    first_string_tonic?.focus()
    first_string_tonic?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

    expect(document.activeElement).toBe(next_string_same_fret)
    expect(first_string_tonic?.tabIndex).toBe(-1)
  })

  it('given_bass_note_when_pressing_end_then_focuses_the_last_scale_note_on_that_string', () => {
    const { container } = createRenderedBass()
    const first_string_scale_notes = Array.from(container.querySelectorAll<HTMLButtonElement>('tbody tr:first-child .guitar-position:not(.outside-scale)'))
    const first_scale_note = first_string_scale_notes[0]
    const last_scale_note = first_string_scale_notes.at(-1)

    first_scale_note?.focus()
    first_scale_note?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))

    expect(document.activeElement).toBe(last_scale_note)
    expect(first_scale_note?.tabIndex).toBe(-1)
  })
})
