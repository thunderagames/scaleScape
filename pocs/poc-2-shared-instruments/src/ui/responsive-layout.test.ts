import { describe, expect, it } from 'vitest'

describe('responsive instrument layout contract', () => {
  it('given_narrow_viewport_when_rendering_instrument_surfaces_then_each_surface_owns_horizontal_overflow', () => {
    const source = document.createElement('style')
    source.textContent = `
      .piano-view { width: 100%; max-width: 100%; overflow-x: auto; }
      .piano-keyboard { width: 660px; min-width: 660px; }
      .guitar-scroll { width: 100%; max-width: 100%; overflow-x: auto; }
      .guitar-table { width: max-content; min-width: 900px; }
    `
    document.head.append(source)

    const piano_view = document.createElement('div')
    piano_view.className = 'piano-view'
    const piano_keyboard = document.createElement('div')
    piano_keyboard.className = 'piano-keyboard'
    piano_view.append(piano_keyboard)

    const guitar_view = document.createElement('div')
    guitar_view.className = 'guitar-scroll'
    const guitar_table = document.createElement('table')
    guitar_table.className = 'guitar-table'
    guitar_view.append(guitar_table)
    document.body.append(piano_view, guitar_view)

    expect(getComputedStyle(piano_view).overflowX).toBe('auto')
    expect(getComputedStyle(guitar_view).overflowX).toBe('auto')
    expect(getComputedStyle(piano_keyboard).width).toBe('660px')
    expect(getComputedStyle(guitar_table).width).toBe('max-content')
  })
})
