import { describe, expect, it } from 'vitest'
import { createExploreApplication } from '../application/explore-application'
import { createSettingsStore } from '../settings/settings-store'
import { renderHarmonyScreen } from './progression-harmony-screen'

function createSettings() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0
    }
  })
  return createSettingsStore()
}

describe('progression harmony screen', () => {
  it('given_e_natural_minor_when_rendering_the_user_example_then_shows_unique_degree_rows_and_dual_maps', () => {
    const container = document.createElement('div')
    const application = createExploreApplication(9, 'natural_minor')
    renderHarmonyScreen(container, application, createSettings())

    const progression = container.querySelector<HTMLSelectElement>('#harmony-progression')
    progression!.value = 'rock_user_example'
    progression!.dispatchEvent(new Event('change'))

    expect(Array.from(container.querySelectorAll('.harmony-degree-heading h2')).map((element) => element.textContent)).toEqual(['I-Am', 'IV-Dm', 'V-Em'])
    expect(container.querySelectorAll('.harmony-instrument')).toHaveLength(12)
    expect(container.querySelectorAll('.harmony-map--short .progression-chord_tonic')).not.toHaveLength(0)
    expect(container.querySelectorAll('.harmony-map--short .progression-nonchord')).toHaveLength(0)
    expect(container.querySelectorAll('.harmony-map--long .progression-nonchord')).not.toHaveLength(0)
    expect(container.querySelector('#harmony-color-legend-title')?.textContent).toBe('Color guide')
    expect(Array.from(container.querySelectorAll('.harmony-color-legend-item')).map((item) => item.textContent)).toEqual(['chord tonic', 'chord tone', 'nonchord tone'])
    expect(container.querySelectorAll('.harmony-map .guitar-scroll')).toHaveLength(18)
    expect(container.querySelectorAll('.harmony-piano-keyboard')).toHaveLength(6)
    expect(container.querySelectorAll('.harmony-map h4')).toHaveLength(0)
    expect(container.querySelector('.harmony-map--short table')?.getAttribute('aria-label')).toBe('Chord tones · 4-fret chord window')
    expect(container.querySelectorAll('.harmony-instrument h3')).toHaveLength(0)
    expect(container.querySelector('.harmony-instrument--guitar')?.getAttribute('aria-label')).toBe('Guitar · frets 0 to 12')
    expect(Array.from(container.querySelectorAll('.harmony-map--short .guitar-table tbody tr')).every((row) => row.querySelectorAll('.guitar-position:not(.outside-scale)').length <= 1)).toBe(true)
    expect(container.querySelectorAll('.harmony-map--long .guitar-table tbody tr:first-child .guitar-position:not(.outside-scale)').length).toBeGreaterThan(1)
  })

  it('given_a_non_heptatonic_scale_when_rendering_then_hides_every_progression', () => {
    const container = document.createElement('div')
    const application = createExploreApplication(4, 'major_pentatonic')
    renderHarmonyScreen(container, application, createSettings())

    expect(container.querySelector<HTMLElement>('#harmony-empty')?.hidden).toBe(false)
    expect(container.querySelectorAll('#harmony-progression option')).toHaveLength(0)
    expect(container.querySelectorAll('.harmony-degree-row')).toHaveLength(0)
  })

  it('given_only_one_visible_instrument_when_rendering_then_keeps_one_full_width_instrument_card', () => {
    const container = document.createElement('div')
    const settings = createSettings()
    settings.setSettings({ ...settings.getSettings(), show_piano: false, show_bass: false, show_ukulele: false })
    renderHarmonyScreen(container, createExploreApplication(9, 'natural_minor'), settings)

    expect(container.querySelector('.harmony-degree-row .harmony-instrument-grid')?.children).toHaveLength(1)
    expect(container.querySelector('.harmony-degree-row .harmony-instrument')?.className).toContain('harmony-instrument--guitar')
  })

  it('given_c_major_when_switching_to_chord_mode_then_lists_all_diatonic_triads_and_renders_one_selected_chord', () => {
    const container = document.createElement('div')
    renderHarmonyScreen(container, createExploreApplication(0, 'major'), createSettings())

    const chord_mode = container.querySelector<HTMLInputElement>('input[value="chord"]')
    chord_mode!.checked = true
    chord_mode!.dispatchEvent(new Event('change', { bubbles: true }))

    expect(container.querySelector<HTMLSelectElement>('#harmony-progression')?.hidden).toBe(true)
    expect(container.querySelector<HTMLSelectElement>('#harmony-chord')?.hidden).toBe(false)
    expect(container.querySelectorAll('#harmony-chord option')).toHaveLength(7)
    expect(container.querySelectorAll('.harmony-degree-row')).toHaveLength(1)
    expect(container.querySelector('.harmony-degree-heading h2')?.textContent).toBe('I-C')

    const chord_select = container.querySelector<HTMLSelectElement>('#harmony-chord')
    chord_select!.value = '4'
    chord_select!.dispatchEvent(new Event('change'))

    expect(container.querySelector('.harmony-degree-heading h2')?.textContent).toBe('IV-F')
  })

  it('given_c_major_when_rendering_the_progression_selector_then_shows_the_full_axis_sequence', () => {
    const container = document.createElement('div')
    renderHarmonyScreen(container, createExploreApplication(0, 'major'), createSettings())

    expect(container.querySelector('#harmony-progression option[value="pop_axis"]')?.textContent).toBe('Axis (I–V–vi–IV)')
  })

  it('given_harmony_when_explore_changes_scale_then_recomputes_the_live_scale_without_private_state', () => {
    const container = document.createElement('div')
    const application = createExploreApplication(9, 'natural_minor')
    renderHarmonyScreen(container, application, createSettings())

    expect(container.querySelector('.harmony-degree-heading')?.textContent).toContain('Am')
    application.changeScale(0, 'major')

    expect(container.querySelector('.harmony-degree-heading')?.textContent).toContain('C')
  })
})
