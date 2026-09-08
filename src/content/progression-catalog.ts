import type { ScaleInstance } from '../theory/scale-instance'
import { getDegreeTriad, getRomanChordDegree, isCompleteHeptatonicScale, type DegreeTriadResult } from '../theory/progression-harmony'

export type ProgressionGenre = 'Pop' | 'Rock' | 'Blues' | 'Jazz' | 'Metal'

export interface ProgressionDefinition {
  readonly id: string
  readonly genre: ProgressionGenre
  readonly degrees: readonly number[]
}

const progression = (id: string, genre: ProgressionGenre, degrees: readonly number[]): ProgressionDefinition => ({ id, genre, degrees })

export const PROGRESSION_CATALOG: readonly ProgressionDefinition[] = [
  progression('pop_axis', 'Pop', [1, 5, 6, 4]),
  progression('pop_axis_rotation', 'Pop', [6, 4, 1, 5]),
  progression('pop_1950s', 'Pop', [1, 6, 4, 5]),
  progression('pop_circle_turnaround', 'Pop', [1, 6, 2, 5]),
  progression('rock_three_chord', 'Rock', [1, 4, 5]),
  progression('rock_user_example', 'Rock', [1, 4, 5, 4]),
  progression('rock_plagal_loop', 'Rock', [1, 5, 4, 1]),
  progression('rock_pachelbel', 'Rock', [1, 5, 6, 3, 4, 1, 4, 5]),
  progression('blues_12_bar', 'Blues', [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5]),
  progression('blues_minor_12_bar', 'Blues', [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 1]),
  progression('jazz_ii_v_i', 'Jazz', [2, 5, 1]),
  progression('jazz_rhythm_turnaround', 'Jazz', [1, 6, 2, 5]),
  progression('jazz_circle', 'Jazz', [6, 2, 5, 1]),
  progression('metal_aeolian_lift', 'Metal', [1, 6, 7]),
  progression('metal_aeolian_shuttle', 'Metal', [1, 7, 6, 7]),
  progression('metal_minor_three_chord', 'Metal', [1, 4, 5]),
  progression('metal_aeolian_walk', 'Metal', [1, 6, 3, 7])
]

export function getProgressionTriads(scale_instance: ScaleInstance, definition: ProgressionDefinition): readonly DegreeTriadResult[] {
  return definition.degrees.map((degree) => getDegreeTriad(scale_instance, degree))
}

export function getCompatibleProgressions(scale_instance: ScaleInstance): readonly ProgressionDefinition[] {
  if (!isCompleteHeptatonicScale(scale_instance)) return []
  return PROGRESSION_CATALOG.filter((definition) => getProgressionTriads(scale_instance, definition).every((triad) => triad.ok))
}

export function getUniqueProgressionDegrees(definition: ProgressionDefinition): readonly number[] {
  return [...new Set(definition.degrees)]
}

export function formatProgressionDegrees(scale_instance: ScaleInstance, definition: ProgressionDefinition): string {
  return getProgressionTriads(scale_instance, definition).map((result, index) => {
    const degree = definition.degrees[index] ?? 1
    return result.ok ? getRomanChordDegree(degree, result.value.quality) : String(degree)
  }).join('–')
}
