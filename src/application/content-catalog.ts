import { installComparisonDefinitions, type ComparisonDefinition } from '../exercises/comparison-exercise'
import { installProgressionCatalog, type ProgressionDefinition } from '../content/progression-catalog'
import { installScaleDescriptions, type ScaleDescription } from '../content/scale-descriptions'
import { installCatalogTranslations, type CatalogTranslations, type Language } from '../settings/localization'
import { installScaleFormulas, type ScaleFormulaDefinition } from '../theory/scale-formulas'

export type LocalizedNames = Readonly<Record<Language, string | null>>

export interface CatalogScaleCategory {
  readonly id: string
  readonly names: LocalizedNames
}

export interface CatalogScaleFormula extends ScaleFormulaDefinition {
  readonly names: LocalizedNames
  readonly descriptions: Readonly<Record<Language, ScaleDescription | null>>
}

export interface CatalogProgressionGenre {
  readonly id: string
  readonly names: LocalizedNames
}

export interface CatalogProgression extends ProgressionDefinition {
  readonly names: LocalizedNames
}

export interface CatalogComparison extends ComparisonDefinition {
  readonly names: LocalizedNames
}

export interface ContentCatalog {
  readonly version: number
  readonly scale_categories: readonly CatalogScaleCategory[]
  readonly scale_formulas: readonly CatalogScaleFormula[]
  readonly progression_genres: readonly CatalogProgressionGenre[]
  readonly progressions: readonly CatalogProgression[]
  readonly comparisons: readonly CatalogComparison[]
}

function is_record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function is_number_array(value: unknown): value is readonly number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number')
}

function has_names(value: Record<string, unknown>): boolean {
  return is_record(value.names)
}

function is_scale_formula(value: unknown): value is CatalogScaleFormula {
  return is_record(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.category === 'string'
    && is_number_array(value.degrees)
    && is_number_array(value.semitone_offsets)
    && value.degrees.length === value.semitone_offsets.length
    && is_number_array(value.characteristic_degrees)
    && is_record(value.degree_roles)
    && has_names(value)
    && is_record(value.descriptions)
}

function is_progression(value: unknown): value is CatalogProgression {
  return is_record(value) && typeof value.id === 'string' && typeof value.genre === 'string' && is_number_array(value.degrees) && value.degrees.length > 0 && has_names(value)
}

function is_comparison(value: unknown): value is CatalogComparison {
  return is_record(value)
    && typeof value.id === 'string'
    && typeof value.formula_a === 'string'
    && typeof value.formula_b === 'string'
    && typeof value.changed_degree === 'number'
    && has_names(value)
}

function is_named_entry(value: unknown): value is CatalogScaleCategory {
  return is_record(value) && typeof value.id === 'string' && has_names(value)
}

export function parseContentCatalog(value: unknown): ContentCatalog | null {
  if (!is_record(value)) return null
  const { scale_categories, scale_formulas, progression_genres, progressions, comparisons } = value
  if (!Array.isArray(scale_categories) || !scale_categories.every(is_named_entry)) return null
  if (!Array.isArray(scale_formulas) || scale_formulas.length === 0 || !scale_formulas.every(is_scale_formula)) return null
  if (!Array.isArray(progression_genres) || !progression_genres.every(is_named_entry)) return null
  if (!Array.isArray(progressions) || !progressions.every(is_progression)) return null
  if (!Array.isArray(comparisons) || comparisons.length === 0 || !comparisons.every(is_comparison)) return null
  const formula_ids = new Set(scale_formulas.map((formula) => formula.id))
  if (!comparisons.every((comparison) => formula_ids.has(comparison.formula_a) && formula_ids.has(comparison.formula_b))) return null
  return {
    version: typeof value.version === 'number' ? value.version : 1,
    scale_categories,
    scale_formulas,
    progression_genres,
    progressions,
    comparisons
  }
}

function to_name_map(entries: readonly { readonly id: string; readonly names: LocalizedNames }[], language: Language): Record<string, string> {
  return Object.fromEntries(entries.flatMap((entry) => {
    const name = entry.names[language]
    return typeof name === 'string' ? [[entry.id, name]] : []
  }))
}

function to_description_map(formulas: readonly CatalogScaleFormula[], language: Language): Record<string, ScaleDescription> {
  return Object.fromEntries(formulas.flatMap((formula) => {
    const description = formula.descriptions[language]
    return description ? [[formula.id, { history: description.history, usage: description.usage }]] : []
  }))
}

function to_catalog_translations(catalog: ContentCatalog, language: Language): CatalogTranslations {
  return {
    formula_names: to_name_map(catalog.scale_formulas, language),
    scale_categories: to_name_map(catalog.scale_categories, language),
    comparison_names: to_name_map(catalog.comparisons, language),
    progression_genres: to_name_map(catalog.progression_genres, language),
    progression_names: to_name_map(catalog.progressions, language)
  }
}

export function installContentCatalog(catalog: ContentCatalog): void {
  installScaleFormulas(
    catalog.scale_formulas.map(({ names: _names, descriptions: _descriptions, ...formula }) => formula),
    catalog.scale_categories.map((category) => category.id)
  )
  installScaleDescriptions({ en: to_description_map(catalog.scale_formulas, 'en'), es: to_description_map(catalog.scale_formulas, 'es') })
  installProgressionCatalog(catalog.progressions.map(({ id, genre, degrees }) => ({ id, genre, degrees })))
  installComparisonDefinitions(catalog.comparisons.map(({ id, formula_a, formula_b, changed_degree }) => ({ id, formula_a, formula_b, changed_degree })))
  installCatalogTranslations({ en: to_catalog_translations(catalog, 'en'), es: to_catalog_translations(catalog, 'es') })
}
