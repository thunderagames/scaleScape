import { describe, expect, it, vi } from 'vitest'
import { createBassViewModel } from '../instruments/bass-view-model'
import { createGuitarViewModel, findChordPositions, STANDARD_TUNING } from '../instruments/guitar-view-model'
import { createUkuleleViewModel } from '../instruments/ukulele-view-model'
import { createScaleInstance } from '../theory/scale-instance'
import { getTranslations } from '../settings/localization'
import { renderStringedInstrument } from './stringed-instrument-view'

function createRenderedBass(selected_pitch_classes: ReadonlySet<number> = new Set()) {
  const container = document.createElement('div')
  document.body.append(container)
  const on_position_selected = vi.fn()
  const on_preview = vi.fn()
  renderStringedInstrument({
    container,
    model: createBassViewModel(createScaleInstance(4, 'dorian'), 1),
    translation: getTranslations('en'),
    instrument: 'bass',
    selected_pitch_classes,
    aria_label: 'Interactive bass fretboard',
    note_naming: 'letter',
    on_position_selected,
    on_preview,
    note_accessible_label: (position) => position.label
  })
  return { container, on_position_selected, on_preview }
}

function createRenderedUkulele() {
  const container = document.createElement('div')
  document.body.append(container)
  const on_position_selected = vi.fn()
  const on_preview = vi.fn()
  renderStringedInstrument({ container, model: createUkuleleViewModel(createScaleInstance(4, 'dorian'), 1), translation: getTranslations('en'), instrument: 'ukulele', selected_pitch_classes: new Set(), aria_label: 'Interactive ukulele fretboard', note_naming: 'letter', on_position_selected, on_preview, note_accessible_label: (position) => position.label })
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

  it('given_ukulele_model_when_rendering_then_creates_four_string_table_and_previews_ukulele', () => {
    const { container, on_position_selected, on_preview } = createRenderedUkulele()
    const tonic = container.querySelector<HTMLButtonElement>('tbody tr:first-child .guitar-position.tonic')

    tonic?.click()

    expect(container.querySelectorAll('tbody tr')).toHaveLength(4)
    expect(on_position_selected).toHaveBeenCalledWith(4, 'ukulele')
    expect(on_preview).toHaveBeenCalledWith(76, 'ukulele')
  })

  it('given_a_short_board_starting_after_fret_zero_when_rendering_then_keeps_the_absolute_fret_headers_and_vertical_navigation', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderStringedInstrument({
      container,
      model: createGuitarViewModel(createScaleInstance(4, 'dorian'), 1, 4, STANDARD_TUNING, { start_fret: 5 }),
      translation: getTranslations('en'),
      instrument: 'guitar',
      selected_pitch_classes: new Set(),
      aria_label: 'Short guitar fretboard',
      note_naming: 'letter',
      on_position_selected: vi.fn(),
      on_preview: vi.fn(),
      note_accessible_label: (position) => position.label
    })

    expect(Array.from(container.querySelectorAll('thead th')).slice(1).map((header) => header.textContent)).toEqual(['5', '6', '7', '8', '9'])
    const first_scale_note = container.querySelector<HTMLButtonElement>('tbody tr:first-child .guitar-position:not(.outside-scale)')
    const next_string_same_column = container.querySelector<HTMLButtonElement>('tbody tr:nth-child(2) .guitar-position:not(.outside-scale)')
    first_scale_note?.focus()
    first_scale_note?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

    expect(document.activeElement).toBe(next_string_same_column)
  })

  it('given_a_triads_chord_map_when_selecting_string_positions_then_marks_at_most_one_note_per_string_and_covers_the_triad', () => {
    const triad_pitch_classes = new Set([4, 7, 11])
    const chord_positions = findChordPositions(STANDARD_TUNING, triad_pitch_classes, 0, 4, 4)
    const model = createGuitarViewModel(createScaleInstance(4, 'dorian'), 1, 4, STANDARD_TUNING, { visible_pitch_classes: triad_pitch_classes, chord_positions })

    expect(model.strings.every((string_model) => string_model.positions.filter((position) => position.is_scale_note).length <= 1)).toBe(true)
    expect(new Set(model.strings.flatMap((string_model) => string_model.positions).filter((position) => position.is_scale_note).map((position) => position.pitch_class))).toEqual(triad_pitch_classes)
  })
})
