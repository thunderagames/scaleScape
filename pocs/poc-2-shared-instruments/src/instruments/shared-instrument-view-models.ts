import { create_guitar_view_model, type GuitarViewModel } from './guitar'
import { create_piano_view_model, type PianoViewModel } from './piano'
import type { SharedScaleState } from '../state/shared-scale-state'

export interface SharedInstrumentViewModels {
  readonly generation_id: number
  readonly piano: PianoViewModel
  readonly guitar: GuitarViewModel
}

export function create_shared_instrument_view_models(state: SharedScaleState): SharedInstrumentViewModels {
  return {
    generation_id: state.generation_id,
    piano: create_piano_view_model(state.scale_instance, state.generation_id),
    guitar: create_guitar_view_model(state.scale_instance, state.generation_id)
  }
}
