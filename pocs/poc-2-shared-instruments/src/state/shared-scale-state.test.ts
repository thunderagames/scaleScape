import { describe, expect, it } from 'vitest'
import { create_shared_scale_store } from './shared-scale-state'
import { create_shared_instrument_view_models } from '../instruments/shared-instrument-view-models'

describe('create_shared_scale_store', () => {
  it('given_e_phrygian_when_building_instrument_views_then_both_consume_the_same_scale_generation', () => {
    const store = create_shared_scale_store()
    const state = store.set_scale(4, 'phrygian')
    const view_models = create_shared_instrument_view_models(state)
    const expected_pitch_classes = [4, 5, 7, 9, 11, 0, 2]

    expect(state.scale_instance.notes.map((note) => note.pitch_class)).toEqual(expected_pitch_classes)
    expect(view_models.generation_id).toBe(state.generation_id)
    expect(view_models.piano.generation_id).toBe(state.generation_id)
    expect(view_models.guitar.generation_id).toBe(state.generation_id)
    expect(new Set(view_models.piano.keys.filter((key) => key.is_scale_note).map((key) => key.pitch_class))).toEqual(new Set(expected_pitch_classes))
    expect(new Set(view_models.guitar.strings.flatMap((guitar_string) => guitar_string.positions).filter((position) => position.is_scale_note).map((position) => position.pitch_class))).toEqual(new Set(expected_pitch_classes))
  })

  it('given_an_active_instrument_when_switching_instrument_then_preserves_scale_and_generation', () => {
    const store = create_shared_scale_store(4, 'lydian')
    const before_switch = store.get_snapshot()

    const after_switch = store.select_instrument('piano')

    expect(after_switch.active_instrument).toBe('piano')
    expect(after_switch.generation_id).toBe(before_switch.generation_id)
    expect(after_switch.scale_instance).toBe(before_switch.scale_instance)
    expect(after_switch.formula_id).toBe('lydian')
  })

  it('given_a_scale_change_when_subscribers_are_notified_then_publishes_one_coherent_snapshot', () => {
    const store = create_shared_scale_store()
    const snapshots: ReturnType<typeof store.get_snapshot>[] = []
    store.subscribe((state) => snapshots.push(state))

    const state = store.set_scale(4, 'lydian')

    expect(snapshots).toHaveLength(1)
    expect(snapshots[0]).toBe(state)
    expect(state.scale_instance.formula.id).toBe('lydian')
    expect(state.generation_id).toBe(2)
  })
})
