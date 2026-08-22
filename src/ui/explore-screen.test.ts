import { describe, expect, it, vi } from 'vitest'
import { createExploreApplication } from '../application/explore-application'
import type { PlaybackListener, PlaybackPort } from '../audio/playback-port'
import { createSettingsStore } from '../settings/settings-store'
import type { EventLoggerPort } from '../observability/event-logger'
import { renderExploreScreen } from './explore-screen'

function createPlaybackFake() {
  const previewed_notes: Array<{ readonly pitch_class: number; readonly octave: number }> = []
  const previewed_instruments: Array<readonly string[]> = []
  const played_instruments: Array<readonly string[]> = []
  const played_chord_instruments: Array<readonly string[]> = []
  let listener: PlaybackListener | null = null
  let chord_started_indexes: readonly number[][] = []
  const playback: PlaybackPort = {
    playScale: async (_scale, instruments) => { played_instruments.push(instruments); return { ok: true } },
    playChord: async (_scale, instruments) => {
      played_chord_instruments.push(instruments)
      setTimeout(() => listener?.on_chord_started?.([0, 2, 4]), 0)
      return { ok: true }
    },
    previewNote: async (note, instruments) => { previewed_notes.push(note); previewed_instruments.push(instruments); return { ok: true } },
    stopAll: async () => { listener?.on_stopped() },
    setContext: async () => ({ ok: true }),
    setTempo: () => undefined,
    setVolume: () => undefined,
    setMuted: () => undefined,
    getPlaybackState: () => ({ is_muted: false, volume: 0.7, context: 'off' }),
    subscribePlaybackState: () => () => undefined,
    subscribe: (next_listener) => { listener = next_listener; return () => { listener = null } }
  }
  return { playback, previewed_notes, previewed_instruments, played_instruments, played_chord_instruments, listener: () => listener, chord_started_indexes }
}

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

function createContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.append(container)
  return container
}

function createDiagnosticsFake(should_throw = false): EventLoggerPort & { readonly events: string[] } {
  const events: string[] = []
  return {
    events,
    log: (event_name) => { if (should_throw) throw new Error('diagnostics unavailable'); events.push(event_name) }
  }
}

describe('explore screen', () => {
  it('given_initial_explore_screen_when_selecting_scale_note_then_announces_note_role_and_previews_pitch', () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    const note_button = container.querySelector<HTMLButtonElement>('#scale-notes .scale-note')
    note_button?.click()

    expect(container.querySelector('#note-detail')?.textContent).toContain('degree 1')
    expect(container.querySelector('#note-detail')?.textContent).toContain('tonic')
    expect(playback_fake.previewed_notes[0]).toMatchObject({ pitch_class: 4, octave: 4 })
    expect(note_button?.getAttribute('aria-label')).toContain('degree 1')
    expect(note_button?.textContent).toBe('E')
    expect(note_button?.parentElement?.querySelector('.scale-degree')?.textContent).toBe('1')
    expect(note_button?.textContent).toBe('E')
    expect(note_button?.parentElement?.querySelector('.scale-degree')?.textContent).toBe('1')
    expect(container.querySelector('#generated-scale-label')?.textContent).toBe('Select Scale')
  })

  it('given_dorian_scale_when_rendering_generated_scale_then_shows_tone_and_semitone_steps', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    expect(Array.from(container.querySelectorAll('.scale-interval')).map((element) => element.textContent)).toEqual(['T', 'S', 'T', 'T', 'T', 'S'])
    expect(container.querySelector('.scale-interval')?.getAttribute('aria-label')).toBe('2 semitones')
  })

  it('given_dorian_scale_when_rendering_generated_scale_then_shows_degree_formula_and_interval_structure', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    const formula_info = container.querySelector('.scale-formula-info')

    expect(formula_info?.textContent).toContain('Degree formula1 - 2 - b3 - 4 - 5 - 6 - b7')
    expect(formula_info?.textContent).toContain('Interval structureT - S - T - T - T - S - T')
    expect(formula_info?.nextElementSibling?.id).toBe('scale-notes')
  })

  it('given_scale_selector_when_rendering_then_groups_modes_by_category', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    const groups = Array.from(container.querySelectorAll<HTMLOptGroupElement>('#formula-select optgroup'))

    expect(groups.map((group) => group.label)).toEqual([
      'Fundamental scales',
      'Greek modes',
      'Pentatonic and blues',
      'Symmetric scales',
      'Exotic and world scales',
      'Probable scales'
    ])
    expect(groups[0]?.querySelector('option[value="major"]')).not.toBeNull()
    expect(groups[1]?.querySelector('option[value="dorian"]')).not.toBeNull()
    expect(groups[2]?.querySelector('option[value="blues"]')).not.toBeNull()
    expect(groups[3]?.querySelector('option[value="chromatic"]')).not.toBeNull()
    expect(groups[4]?.querySelector('option[value="pelog"]')).not.toBeNull()
    expect(groups[5]?.querySelector('option[value^="probable_heptatonic_"]')).not.toBeNull()
  })

  it('given_approximate_slendro_when_rendering_then_shows_its_explicit_tuning_note', () => {
    const container = createContainer()
    const application = createExploreApplication()
    application.changeScale(0, 'slendro')
    renderExploreScreen(container, application, createPlaybackFake().playback, createSettings())

    expect(container.querySelector('#scale-formula-info')?.textContent).toContain('~240 cents - ~240 cents - ~240 cents - ~240 cents - ~240 cents')
  })

  it('given_major_pentatonic_scale_when_rendering_generated_scale_then_shows_one_and_a_half_tone_step', () => {
    const container = createContainer()
    const application = createExploreApplication()
    application.changeScale(4, 'major_pentatonic')
    renderExploreScreen(container, application, createPlaybackFake().playback, createSettings())

    expect(Array.from(container.querySelectorAll('.scale-interval')).map((element) => element.textContent)).toContain('TS')
  })

  it('given_minor_pentatonic_mode_when_rendering_explore_then_lists_minor_pentatonic_and_notes', () => {
    const container = createContainer()
    const application = createExploreApplication()
    application.changeScale(4, 'minor_pentatonic')
    renderExploreScreen(container, application, createPlaybackFake().playback, createSettings())

    expect(container.querySelector('#formula-select option[value="minor_pentatonic"]')?.textContent).toBe('Minor pentatonic')
    expect(Array.from(container.querySelectorAll('#scale-notes .scale-note')).map((note) => note.textContent)).toEqual(['E', 'G', 'A', 'B', 'D'])
    expect(Array.from(container.querySelectorAll('#scale-notes .scale-degree')).map((degree) => degree.textContent)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('given_major_pentatonic_mode_when_rendering_explore_then_numbers_notes_from_one_to_five', () => {
    const container = createContainer()
    const application = createExploreApplication()
    application.changeScale(4, 'major_pentatonic')
    renderExploreScreen(container, application, createPlaybackFake().playback, createSettings())

    expect(Array.from(container.querySelectorAll('#scale-notes .scale-degree')).map((degree) => degree.textContent)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('given_prometheus_mode_when_rendering_explore_then_lists_five_sequential_scale_degrees', () => {
    const container = createContainer()
    const application = createExploreApplication()
    application.changeScale(4, 'prometheus')
    renderExploreScreen(container, application, createPlaybackFake().playback, createSettings())

    expect(container.querySelector('#formula-select option[value="prometheus"]')?.textContent).toBe('Prometheus')
    expect(Array.from(container.querySelectorAll('#scale-notes .scale-degree')).map((degree) => degree.textContent)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('given_prometheus_scriabin_scale_when_rendering_explore_then_numbers_notes_from_one_to_six', () => {
    const container = createContainer()
    const application = createExploreApplication()
    application.changeScale(4, 'prometheus_scriabin')
    renderExploreScreen(container, application, createPlaybackFake().playback, createSettings())

    expect(Array.from(container.querySelectorAll('#scale-notes .scale-degree')).map((degree) => degree.textContent)).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('given_japanese_mode_when_rendering_explore_then_lists_japanese_scale_with_sequential_degrees', () => {
    const container = createContainer()
    const application = createExploreApplication()
    application.changeScale(9, 'japanese')
    renderExploreScreen(container, application, createPlaybackFake().playback, createSettings())

    expect(container.querySelector('#formula-select option[value="japanese"]')?.textContent).toBe('Japanese')
    expect(Array.from(container.querySelectorAll('#scale-notes .scale-degree')).map((degree) => degree.textContent)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('given_guitarmonia_pentatonic_mode_when_rendering_explore_then_lists_sequential_scale_degrees', () => {
    const container = createContainer()
    const application = createExploreApplication()
    application.changeScale(4, 'man_gong')
    renderExploreScreen(container, application, createPlaybackFake().playback, createSettings())

    expect(container.querySelector('#formula-select option[value="man_gong"]')?.textContent).toBe('Man Gong')
    expect(Array.from(container.querySelectorAll('#scale-notes .scale-degree')).map((degree) => degree.textContent)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('given_generated_scale_when_playing_with_guitar_hidden_then_uses_only_visible_piano', async () => {
    const container = createContainer()
    const settings = createSettings()
    settings.setSettings({ ...settings.getSettings(), show_guitar: false, show_bass: false })
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, settings)

    container.querySelector<HTMLButtonElement>('#play-scale')?.click()
    await Promise.resolve()

    expect(playback_fake.played_instruments).toEqual([['piano']])
  })

  it('given_generated_scale_when_both_instruments_visible_then_uses_piano_and_guitar', async () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    const settings = createSettings()
    settings.setSettings({ ...settings.getSettings(), show_bass: false })
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, settings)

    container.querySelector<HTMLButtonElement>('#play-scale')?.click()
    await Promise.resolve()

    expect(playback_fake.played_instruments).toEqual([['piano', 'guitar']])
  })

  it('given_generated_scale_note_when_guitar_hidden_then_uses_only_visible_piano', () => {
    const container = createContainer()
    const settings = createSettings()
    settings.setSettings({ ...settings.getSettings(), show_guitar: false, show_bass: false })
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, settings)

    container.querySelector<HTMLButtonElement>('#scale-notes .scale-note')?.click()

    expect(playback_fake.previewed_instruments).toEqual([['piano']])
  })

  it('given_piano_note_when_selected_then_uses_piano_timbre', () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    container.querySelector<HTMLButtonElement>('#piano-view .piano-key.tonic')?.click()

    expect(playback_fake.previewed_instruments).toEqual([['piano']])
  })

  it('given_guitar_note_when_selected_then_uses_guitar_timbre', () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    container.querySelector<HTMLButtonElement>('#guitar-view .guitar-position.tonic')?.click()

    expect(playback_fake.previewed_instruments).toEqual([['guitar']])
  })

  it('given_bass_note_when_selected_then_uses_bass_timbre', () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    container.querySelector<HTMLButtonElement>('#bass-view .guitar-position.tonic')?.click()

    expect(playback_fake.previewed_instruments).toEqual([['bass']])
  })

  it('given_guitar_scroll_position_when_selecting_note_then_preserves_horizontal_scroll', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())
    const guitar_scroll = container.querySelector<HTMLElement>('.guitar-scroll')
    const guitar_note = container.querySelector<HTMLButtonElement>('#guitar-view .guitar-position.tonic')
    if (guitar_scroll && guitar_note) {
      guitar_scroll.scrollLeft = 240
      guitar_note.click()
    }

    expect(container.querySelector<HTMLElement>('.guitar-scroll')?.scrollLeft).toBe(240)
  })

  it('given_bass_scroll_position_when_selecting_note_then_preserves_horizontal_scroll', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())
    const bass_scroll = container.querySelector<HTMLElement>('#bass-view .guitar-scroll')
    const bass_note = container.querySelector<HTMLButtonElement>('#bass-view .guitar-position.tonic')
    if (bass_scroll && bass_note) {
      bass_scroll.scrollLeft = 240
      bass_note.click()
    }

    expect(container.querySelector<HTMLElement>('#bass-view .guitar-scroll')?.scrollLeft).toBe(240)
  })

  it('given_shifted_bass_tuning_when_rendering_then_shows_shifted_open_string', () => {
    const container = createContainer()
    const settings = createSettings()
    settings.setSettings({ ...settings.getSettings(), bass_tuning_semitones: -2 })

    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, settings)

    expect(container.querySelector('#bass-title')?.textContent).toContain('D')
    expect(container.querySelector('#bass-view tbody tr:first-child th')?.textContent).toBe('D')
  })

  it('given_initial_explore_screen_when_moving_piano_focus_then_advances_to_next_scale_note', () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    const piano_buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('#piano-view .piano-key.tonic, #piano-view .piano-key.characteristic, #piano-view .piano-key.chord_tone, #piano-view .piano-key.color_tone'))
    const first_button = piano_buttons[0]
    first_button?.focus()
    first_button?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

    expect(document.activeElement).toBe(piano_buttons[1])
    expect(piano_buttons[0]?.tabIndex).toBe(-1)
    expect(piano_buttons[1]?.tabIndex).toBe(0)
  })

  it('given_explore_screen_when_rendering_piano_then_keeps_black_keys_separate_from_fretboard_controls', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    const black_key = container.querySelector('#piano-view .piano-key.altered-key')

    expect(black_key).not.toBeNull()
    expect(black_key?.classList.contains('guitar-position')).toBe(false)
    expect(container.querySelector('.guitar-position')).not.toBeNull()
  })

  it('given_explore_screen_when_rendering_piano_then_marks_regular_scale_keys_with_full_overlay_class', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    const scale_overlays = Array.from(container.querySelectorAll('#piano-view .piano-key.is-scale-note'))

    expect(scale_overlays.length).toBeGreaterThan(0)
    expect(container.querySelector('#piano-view .piano-key.tonic.is-scale-note')).toBeNull()
    expect(container.querySelector('#piano-view .piano-key.characteristic.is-scale-note')).toBeNull()
    expect(container.querySelector('.guitar-position.is-scale-note')).toBeNull()
  })

  it('given_explore_screen_when_rendering_role_guide_then_shows_legends_and_toggleable_help', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    expect(container.querySelectorAll('.instrument-legend')).toHaveLength(0)
    expect(container.querySelectorAll('.color-convention-table')).toHaveLength(3)
    expect(container.querySelectorAll('.help-copy .color-swatch')).toHaveLength(12)
    expect(container.querySelector('#scale-help')?.textContent).toContain('Light gray notes are chord tones')
    expect(container.querySelector('#piano-help')?.textContent).toContain('primary musical role')
    expect(container.querySelector('#scale-notes .scale-note.chord_tone')).not.toBeNull()
    expect(container.querySelector('#scale-help .color-convention-table caption')?.textContent).toBe('Color guide')
    expect(container.querySelector('#scale-help .color-convention-table th:last-child')?.textContent).toBe('Meaning')
    expect(container.querySelector('#piano-help')?.closest('#piano-card')).not.toBeNull()
    expect(container.querySelector('#guitar-help')?.closest('#guitar-card')).not.toBeNull()

    const help_button = container.querySelector<HTMLButtonElement>('#scale-help-button')
    help_button?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    help_button?.click()
    expect(container.querySelector('#scale-help')?.classList.contains('is-open')).toBe(true)
    expect(help_button?.getAttribute('aria-expanded')).toBe('true')
    help_button?.click()
    expect(container.querySelector('#scale-help')?.classList.contains('is-open')).toBe(false)
  })

  it('given_open_help_when_opening_another_help_then_closes_the_previous_popup', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    container.querySelector<HTMLButtonElement>('#scale-help-button')?.click()
    container.querySelector<HTMLButtonElement>('#piano-help-button')?.click()

    expect(container.querySelector('#scale-help')?.classList.contains('is-open')).toBe(false)
    expect(container.querySelector('#piano-help')?.classList.contains('is-open')).toBe(true)
  })

  it('given_help_popup_when_opened_then_keeps_help_out_of_card_layout_flow', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    const help_copy = container.querySelector<HTMLElement>('#piano-help')

    expect(help_copy?.parentElement?.classList.contains('help-cluster')).toBe(true)
    expect(help_copy?.closest('.section-heading')).not.toBeNull()
    expect(help_copy?.closest('#piano-card')?.querySelector('.piano-view')).not.toBeNull()
    expect(help_copy?.classList.contains('is-open')).toBe(false)
  })

  it('given_open_help_when_opening_scale_selector_then_closes_help_before_modal', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    container.querySelector<HTMLButtonElement>('#scale-help-button')?.click()
    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()

    expect(container.querySelector('#scale-help')?.classList.contains('is-open')).toBe(false)
  })

  it('given_open_help_when_five_seconds_pass_then_closes_help_popup', () => {
    vi.useFakeTimers()
    try {
      const container = createContainer()
      renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())
      container.querySelector<HTMLButtonElement>('#scale-help-button')?.click()

      vi.advanceTimersByTime(4999)
      expect(container.querySelector('#scale-help')?.classList.contains('is-open')).toBe(true)
      vi.advanceTimersByTime(1)
      expect(container.querySelector('#scale-help')?.classList.contains('is-open')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('given_english_explore_screen_when_switching_to_spanish_then_localizes_controls_and_modes', () => {
    const container = createContainer()
    const settings = createSettings()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, settings)
    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()

    settings.setLanguage('es')

    expect(container.querySelector('#root-label')?.textContent).toBe('Tónica')
    expect(container.querySelector('#formula-select option[value="dorian"]')?.textContent).toBe('Dórico')
    expect(container.querySelector<HTMLOptGroupElement>('#formula-select optgroup')?.label).toBe('Escalas fundamentales')
    expect(container.querySelector('.scale-formula-info')?.textContent).toContain('Fórmula de grados1 - 2 - b3 - 4 - 5 - 6 - b7')
    expect(document.documentElement.lang).toBe('es')
    expect(container.querySelector('#app-label')).toBeNull()
    expect(container.querySelector('#generated-scale-label')?.textContent).toBe('Selecciona la escala')
    expect(container.querySelector('#scale-selector-title')?.textContent).toBe('Escoja una nota y un modo')
  })

  it('given_explore_screen_when_rendering_then_centers_main_title', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    expect(container.querySelector('.title-row')?.classList.contains('title-row')).toBe(true)
    expect(container.querySelector('#app-title')?.textContent).toBe('Scale Explorer')
  })

  it('given_changed_root_when_selecting_root_then_keeps_new_root_after_playback_stops', () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())
    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()
    const root_select = container.querySelector<HTMLSelectElement>('#root-select')
    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()

    if (root_select) {
      root_select.value = '7'
    }
    container.querySelector<HTMLButtonElement>('#apply-scale-selector')?.click()

    expect(root_select?.value).toBe('7')
    expect(container.querySelector('#scale-selector')?.textContent).toContain('G Dorian')
  })

  it('given_explore_screen_when_opening_scale_selector_then_shows_current_root_and_mode', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()

    expect(container.querySelector<HTMLSelectElement>('#root-select')?.value).toBe('4')
    expect(container.querySelector<HTMLSelectElement>('#formula-select')?.value).toBe('dorian')
  })

  it('given_scale_selector_when_rendering_then_uses_an_icon_close_control_and_stacked_fields', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    const close_button = container.querySelector<HTMLButtonElement>('#close-scale-selector')

    expect(container.querySelector('#scale-selector-modal')?.classList.contains('scale-selector-modal')).toBe(true)
    expect(close_button?.textContent).toBe('')
    expect(close_button?.getAttribute('aria-label')).toBe('Close')
    expect(close_button?.querySelector('.modal-close-icon')).not.toBeNull()
    expect(container.querySelectorAll('.scale-selector-field')).toHaveLength(2)
    expect(container.querySelectorAll('.scale-selector-field select')).toHaveLength(2)
    expect(container.querySelector('.scale-selector-actions')?.children).toHaveLength(2)
  })

  it('given_play_scale_when_clicked_twice_then_toggles_between_play_and_stop', async () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())
    const play_button = container.querySelector<HTMLButtonElement>('#play-scale')

    play_button?.click()
    await Promise.resolve()
    expect(play_button?.querySelector('.playback-icon path')?.getAttribute('d')).toBe('M6 6h12v12H6z')
    play_button?.click()
    await Promise.resolve()
    expect(play_button?.querySelector('.playback-icon path')?.getAttribute('d')).toContain('m8')
  })

  it('given_changed_mode_when_selecting_mode_then_keeps_new_mode_after_playback_stops', () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())
    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()
    const formula_select = container.querySelector<HTMLSelectElement>('#formula-select')
    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()

    if (formula_select) {
      formula_select.value = 'lydian'
    }
    container.querySelector<HTMLButtonElement>('#apply-scale-selector')?.click()

    expect(formula_select?.value).toBe('lydian')
    expect(container.querySelector('#scale-selector')?.textContent).toContain('E Lydian')
  })

  it('given_scale_controls_when_changing_scale_then_persists_last_root_and_formula', () => {
    const container = createContainer()
    const settings = createSettings()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, settings)
    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()
    const root_select = container.querySelector<HTMLSelectElement>('#root-select')
    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()
    const formula_select = container.querySelector<HTMLSelectElement>('#formula-select')
    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()

    if (root_select && formula_select) {
      root_select.value = '9'
      formula_select.value = 'lydian'
    }
    container.querySelector<HTMLButtonElement>('#apply-scale-selector')?.click()

    expect(settings.getSettings().last_root).toBe(9)
    expect(settings.getSettings().last_formula).toBe('lydian')
  })

  it('given_scale_controls_when_changing_scale_then_logs_completed_scale_change', () => {
    const container = createContainer()
    const diagnostics = createDiagnosticsFake()
    const root_select = '#root-select'
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings(), diagnostics)

    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()
    const control = container.querySelector<HTMLSelectElement>(root_select)
    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()
    if (control) {
      control.value = '7'
    }
    container.querySelector<HTMLButtonElement>('#apply-scale-selector')?.click()

    expect(diagnostics.events).toEqual(['application.scale_change_completed'])
  })

  it('given_failing_diagnostics_when_changing_scale_then_keeps_scale_change_functional', () => {
    const container = createContainer()
    const diagnostics = createDiagnosticsFake(true)
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings(), diagnostics)

    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()
    const control = container.querySelector<HTMLSelectElement>('#root-select')
    container.querySelector<HTMLButtonElement>('#scale-selector')?.click()
    if (control) {
      control.value = '7'
    }
    container.querySelector<HTMLButtonElement>('#apply-scale-selector')?.click()

    expect(container.querySelector('#scale-selector')?.textContent).toContain('G Dorian')
  })

  it('given_initial_explore_screen_when_rendering_then_shows_chord_button', () => {
    const container = createContainer()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings())

    const chord_button = container.querySelector<HTMLButtonElement>('#play-chord')

    expect(chord_button).not.toBeNull()
    expect(chord_button?.textContent).toBe('Play chord')
    expect(chord_button?.getAttribute('aria-label')).toBe('Play chord')
  })

  it('given_generated_scale_when_playing_chord_then_invokes_play_chord_playback', async () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    container.querySelector<HTMLButtonElement>('#play-chord')?.click()
    await Promise.resolve()

    expect(playback_fake.played_chord_instruments).toEqual([['piano', 'guitar', 'bass']])
  })

  it('given_generated_scale_when_playing_chord_with_guitar_hidden_then_uses_only_visible_piano', async () => {
    const container = createContainer()
    const settings = createSettings()
    settings.setSettings({ ...settings.getSettings(), show_guitar: false, show_bass: false })
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, settings)

    container.querySelector<HTMLButtonElement>('#play-chord')?.click()
    await Promise.resolve()

    expect(playback_fake.played_chord_instruments).toEqual([['piano']])
  })

  it('given_tritonic_scale_when_playing_chord_then_does_not_crash', async () => {
    const container = createContainer()
    const application = createExploreApplication()
    application.changeScale(0, 'baake_tritonic')
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, application, playback_fake.playback, createSettings())

    container.querySelector<HTMLButtonElement>('#play-chord')?.click()
    await Promise.resolve()

    expect(playback_fake.played_chord_instruments).toEqual([['piano', 'guitar', 'bass']])
  })

  it('given_spanish_explore_screen_when_switching_language_then_chord_button_localizes', () => {
    const container = createContainer()
    const settings = createSettings()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, settings)

    settings.setLanguage('es')

    const chord_button = container.querySelector<HTMLButtonElement>('#play-chord')
    expect(chord_button?.textContent).toBe('Reproducir acorde')
    expect(chord_button?.getAttribute('aria-label')).toBe('Reproducir acorde')
  })

  it('given_generated_scale_when_playing_chord_then_three_scale_note_buttons_are_selected_simultaneously', async () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    const chord_button = container.querySelector<HTMLButtonElement>('#play-chord')
    chord_button?.click()
    await Promise.resolve()
    // Advance timers so on_chord_started callback fires
    await new Promise((resolve) => setTimeout(resolve, 10))

    const selected_scale_buttons = container.querySelectorAll('#scale-notes .scale-note.selected')
    expect(selected_scale_buttons).toHaveLength(3)
    expect(Array.from(selected_scale_buttons).map((btn) => btn.textContent)).toEqual(['E', 'G', 'B'])
  })

  it('given_generated_scale_when_playing_chord_then_matching_piano_keys_are_selected_simultaneously', async () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    const chord_button = container.querySelector<HTMLButtonElement>('#play-chord')
    chord_button?.click()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 10))

    const selected_piano_keys = container.querySelectorAll('#piano-view .piano-key.selected')
    expect(selected_piano_keys.length).toBeGreaterThanOrEqual(3)
  })

  it('given_generated_scale_when_playing_chord_then_matching_guitar_positions_are_selected_simultaneously', async () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    const chord_button = container.querySelector<HTMLButtonElement>('#play-chord')
    chord_button?.click()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 10))

    const selected_guitar_positions = container.querySelectorAll('#guitar-view .guitar-position.selected')
    expect(selected_guitar_positions.length).toBeGreaterThanOrEqual(1)
  })

  it('given_generated_scale_when_single_note_clicked_then_only_one_selected_across_ui', async () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    // Click a scale note
    const second_scale_note = container.querySelectorAll<HTMLButtonElement>('#scale-notes .scale-note')[1]
    second_scale_note?.click()

    const selected_scale_buttons = container.querySelectorAll('#scale-notes .scale-note.selected')
    expect(selected_scale_buttons).toHaveLength(1)
    expect(selected_scale_buttons[0]?.textContent).toBe('F#')

    const selected_piano_keys = container.querySelectorAll('#piano-view .piano-key.selected')
    expect(selected_piano_keys.length).toBeGreaterThanOrEqual(1)

    const selected_guitar_positions = container.querySelectorAll('#guitar-view .guitar-position.selected')
    expect(selected_guitar_positions.length).not.toBe(0)
  })

  it('given_chord_playing_when_playback_stops_then_no_notes_remain_selected', async () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    const chord_button = container.querySelector<HTMLButtonElement>('#play-chord')
    chord_button?.click()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 10))

    // At this point chord notes are selected
    const selected_during_chord = container.querySelectorAll('#scale-notes .scale-note.selected')
    expect(selected_during_chord).toHaveLength(3)

    // Trigger on_stopped
    playback_fake.listener()?.on_stopped()

    const selected_after_stop = container.querySelectorAll('#scale-notes .scale-note.selected')
    expect(selected_after_stop).toHaveLength(0)
  })
})
