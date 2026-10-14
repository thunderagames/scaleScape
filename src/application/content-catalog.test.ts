import { afterAll, describe, expect, it } from 'vitest'
import catalog_json from '../../public/catalog.json'
import { getComparisonDefinitions } from '../exercises/comparison-exercise'
import { getProgressionCatalog } from '../content/progression-catalog'
import { getScaleDescription } from '../content/scale-descriptions'
import { getTranslations } from '../settings/localization'
import { getScaleCategoryOrder, getScaleFormulas, PROBABLE_SCALES_CATEGORY } from '../theory/scale-formulas'
import { installContentCatalog, parseContentCatalog, type ContentCatalog } from './content-catalog'

const minimal_catalog: ContentCatalog = {
  version: 1,
  scale_categories: [{ id: 'fundamental', names: { en: 'Fundamental', es: 'Fundamentales' } }],
  scale_formulas: [{
    id: 'major', name: 'Major', category: 'fundamental', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 5, 7, 9, 11],
    characteristic_degrees: [7], degree_roles: { 1: ['tonic', 'chord_tone'] },
    names: { en: 'Major', es: 'Mayor' }, descriptions: { en: { history: 'H', usage: 'U' }, es: null }
  }],
  progression_genres: [{ id: 'Pop', names: { en: 'Pop', es: 'Pop' } }],
  progressions: [{ id: 'pop_axis', genre: 'Pop', degrees: [1, 5, 6, 4], names: { en: 'Axis', es: 'Eje' } }],
  comparisons: [{ id: 'major_major', formula_a: 'major', formula_b: 'major', changed_degree: 7, names: { en: 'Major vs Major', es: null } }]
}

describe('content catalog', () => {
  afterAll(() => {
    const catalog = parseContentCatalog(catalog_json)
    if (catalog) installContentCatalog(catalog)
  })

  it('given_bundled_catalog_json_when_parsing_then_accepts_it', () => {
    expect(parseContentCatalog(catalog_json)?.scale_formulas.length).toBeGreaterThan(0)
  })

  it('given_invalid_payloads_when_parsing_then_rejects_them', () => {
    expect(parseContentCatalog(null)).toBeNull()
    expect(parseContentCatalog('<html>challenge</html>')).toBeNull()
    expect(parseContentCatalog({ ...minimal_catalog, scale_formulas: [] })).toBeNull()
    expect(parseContentCatalog({ ...minimal_catalog, scale_formulas: [{ ...minimal_catalog.scale_formulas[0], semitone_offsets: [0, 2] }] })).toBeNull()
    expect(parseContentCatalog({ ...minimal_catalog, comparisons: [{ id: 'x' }] })).toBeNull()
  })

  it('given_catalog_when_installing_then_feeds_theory_content_exercises_and_translations', () => {
    installContentCatalog(minimal_catalog)

    expect(getScaleFormulas()[0]?.id).toBe('major')
    expect(getScaleFormulas().filter((formula) => formula.category === PROBABLE_SCALES_CATEGORY).length).toBeGreaterThan(0)
    expect(getScaleCategoryOrder()).toEqual(['fundamental', PROBABLE_SCALES_CATEGORY])
    expect(getScaleDescription('major', 'en')).toEqual({ history: 'H', usage: 'U' })
    expect(getScaleDescription('major', 'es')).toBeUndefined()
    expect(getProgressionCatalog()).toEqual([{ id: 'pop_axis', genre: 'Pop', degrees: [1, 5, 6, 4] }])
    expect(getComparisonDefinitions()).toEqual([{ id: 'major_major', formula_a: 'major', formula_b: 'major', changed_degree: 7 }])
    expect(getTranslations('es').formula_names.major).toBe('Mayor')
    expect(getTranslations('es').comparison_names).toEqual({})
    expect(getTranslations('en').settings).toBe('Settings')
  })
})
