import { createScaleInstance, type ScaleInstance } from '../theory/scale-instance'
import type { FormulaId } from '../theory/scale-formulas'

export interface ScaleState {
  readonly root_pitch_class: number
  readonly formula_id: FormulaId
  readonly scale_instance: ScaleInstance
  readonly generation_id: number
}

export function createInitialScaleState(): ScaleState {
  return createScaleState(4, 'dorian', 1)
}

export function createScaleState(root_pitch_class: number, formula_id: FormulaId, generation_id: number): ScaleState {
  const scale_instance = createScaleInstance(root_pitch_class, formula_id)
  return { root_pitch_class: scale_instance.root_pitch_class, formula_id, scale_instance, generation_id }
}
