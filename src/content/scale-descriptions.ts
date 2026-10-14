import type { Language } from '../settings/localization'

export interface ScaleDescription {
  readonly history: string
  readonly usage: string
}

let scale_descriptions: Readonly<Record<Language, Readonly<Record<string, ScaleDescription>>>> = { en: {}, es: {} }

export function installScaleDescriptions(descriptions: Readonly<Record<Language, Readonly<Record<string, ScaleDescription>>>>): void {
  scale_descriptions = descriptions
}

export function getScaleDescription(formula_id: string, language: Language): ScaleDescription | undefined {
  return scale_descriptions[language === 'es' ? 'es' : 'en'][formula_id]
}
