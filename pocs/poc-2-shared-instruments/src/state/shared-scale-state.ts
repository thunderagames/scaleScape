import { create_scale_instance, type ScaleInstance } from '../../../poc-0-theory-audio/src/theory/scale-instance'
import type { FormulaId } from '../../../poc-0-theory-audio/src/theory/scale-formulas'

export type InstrumentId = 'piano' | 'guitar'

export interface SharedScaleState {
  readonly root_pitch_class: number
  readonly formula_id: FormulaId
  readonly scale_instance: ScaleInstance
  readonly active_instrument: InstrumentId
  readonly generation_id: number
}

export interface SharedScaleStore {
  get_snapshot(): SharedScaleState
  set_scale(root_pitch_class: number, formula_id: FormulaId): SharedScaleState
  select_instrument(instrument_id: InstrumentId): SharedScaleState
  subscribe(listener: (state: SharedScaleState) => void): () => void
}

export function create_shared_scale_store(
  initial_root_pitch_class = 4,
  initial_formula_id: FormulaId = 'dorian'
): SharedScaleStore {
  let state: SharedScaleState = {
    root_pitch_class: initial_root_pitch_class,
    formula_id: initial_formula_id,
    scale_instance: create_scale_instance(initial_root_pitch_class, initial_formula_id),
    active_instrument: 'guitar',
    generation_id: 1
  }
  const listeners = new Set<(current_state: SharedScaleState) => void>()

  function publish(next_state: SharedScaleState): SharedScaleState {
    state = next_state
    listeners.forEach((listener) => listener(state))
    return state
  }

  return {
    get_snapshot() {
      return state
    },
    set_scale(root_pitch_class, formula_id) {
      const scale_instance = create_scale_instance(root_pitch_class, formula_id)
      return publish({
        ...state,
        root_pitch_class: scale_instance.root_pitch_class,
        formula_id,
        scale_instance,
        generation_id: state.generation_id + 1
      })
    },
    select_instrument(instrument_id) {
      if (instrument_id === state.active_instrument) {
        return state
      }

      return publish({ ...state, active_instrument: instrument_id })
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
