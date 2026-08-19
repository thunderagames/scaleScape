import { describe, expect, it } from 'vitest'
import { create_shared_scale_store } from './shared-scale-state'
import { create_shared_instrument_view_models } from '../instruments/shared-instrument-view-models'

describe('shared scale performance', () => {
  it('given_one_hundred_root_and_mode_changes_when_building_both_views_then_keeps_each_generation_coherent', () => {
    const store = create_shared_scale_store()
    const durations: number[] = []

    for (let index = 0; index < 100; index += 1) {
      const start_time = performance.now()
      const state = store.set_scale(index % 12, index % 2 === 0 ? 'phrygian' : 'lydian')
      const view_models = create_shared_instrument_view_models(state)
      durations.push(performance.now() - start_time)

      expect(view_models.generation_id).toBe(state.generation_id)
      expect(view_models.piano.generation_id).toBe(view_models.guitar.generation_id)
    }

    durations.sort((left, right) => left - right)
    const p95 = durations[Math.ceil(durations.length * 0.95) - 1] ?? Number.POSITIVE_INFINITY
    expect(p95).toBeLessThan(16)
  })
})
