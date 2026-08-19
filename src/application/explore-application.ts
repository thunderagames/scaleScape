import { createInitialScaleState, createScaleState, type ScaleState } from '../app-state/scale-state'
import type { FormulaId } from '../theory/scale-formulas'

export interface ExploreApplication {
  getState(): ScaleState
  changeScale(root_pitch_class: number, formula_id: FormulaId): ScaleState
  subscribe(listener: (state: ScaleState) => void): () => void
}

export function createExploreApplication(): ExploreApplication {
  let state = createInitialScaleState()
  const listeners = new Set<(current_state: ScaleState) => void>()

  function publish(next_state: ScaleState): ScaleState {
    state = next_state
    listeners.forEach((listener) => listener(state))
    return state
  }

  return {
    getState: () => state,
    changeScale: (root_pitch_class, formula_id) => publish(createScaleState(root_pitch_class, formula_id, state.generation_id + 1)),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
