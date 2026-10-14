import type { ScaleInstance } from '../theory/scale-instance'
import { getDegreeTriad, getRomanChordDegree, isCompleteHeptatonicScale, type DegreeTriadResult } from '../theory/progression-harmony'

export type ProgressionGenre = string

export interface ProgressionDefinition {
  readonly id: string
  readonly genre: ProgressionGenre
  readonly degrees: readonly number[]
}

let progression_catalog: readonly ProgressionDefinition[] = []

export function installProgressionCatalog(definitions: readonly ProgressionDefinition[]): void {
  progression_catalog = definitions
}

export function getProgressionCatalog(): readonly ProgressionDefinition[] {
  return progression_catalog
}

export function getProgressionTriads(scale_instance: ScaleInstance, definition: ProgressionDefinition): readonly DegreeTriadResult[] {
  return definition.degrees.map((degree) => getDegreeTriad(scale_instance, degree))
}

export function getCompatibleProgressions(scale_instance: ScaleInstance): readonly ProgressionDefinition[] {
  if (!isCompleteHeptatonicScale(scale_instance)) return []
  return progression_catalog.filter((definition) => getProgressionTriads(scale_instance, definition).every((triad) => triad.ok))
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
