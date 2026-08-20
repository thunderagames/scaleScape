import { createScaleInstance, type ScaleInstance } from '../theory/scale-instance'
import type { FormulaId } from '../theory/scale-formulas'

export type EarGymPhase = 'listen' | 'answer' | 'feedback'

export interface DegreeChoice {
  readonly degree: number
  readonly label: string
}

export type ComparisonId = 'natural_minor_dorian' | 'major_mixolydian' | 'major_lydian' | 'natural_minor_phrygian'

interface ComparisonDefinition {
  readonly id: ComparisonId
  readonly formula_a: FormulaId
  readonly formula_b: FormulaId
  readonly changed_degree: number
}

export interface ComparisonExercise {
  readonly id: ComparisonId
  readonly root_pitch_class: number
  readonly formula_a: FormulaId
  readonly formula_b: FormulaId
  readonly scale_a: ScaleInstance
  readonly scale_b: ScaleInstance
  readonly changed_degree: number
  readonly changed_note_a: string
  readonly changed_note_b: string
  readonly choices: readonly DegreeChoice[]
}

export interface EarGymState {
  readonly phase: EarGymPhase
  readonly exercise: ComparisonExercise
  readonly answer: number | null
  readonly is_correct: boolean | null
  readonly streak: number
  readonly playing_example: 'a' | 'b' | null
}

export const COMPARISON_DEFINITIONS: readonly ComparisonDefinition[] = [
  { id: 'natural_minor_dorian', formula_a: 'natural_minor', formula_b: 'dorian', changed_degree: 6 },
  { id: 'major_mixolydian', formula_a: 'major', formula_b: 'mixolydian', changed_degree: 7 },
  { id: 'major_lydian', formula_a: 'major', formula_b: 'lydian', changed_degree: 4 },
  { id: 'natural_minor_phrygian', formula_a: 'natural_minor', formula_b: 'phrygian', changed_degree: 2 }
]

function get_note_by_degree(scale_instance: ScaleInstance, degree: number) {
  const note = scale_instance.notes.find((candidate) => candidate.degree === degree)
  if (!note) throw new Error(`Scale is missing degree ${degree}`)
  return note
}

export function createComparisonExercise(root_pitch_class = 4, comparison_id: ComparisonId = 'natural_minor_dorian'): ComparisonExercise {
  const definition = COMPARISON_DEFINITIONS.find((candidate) => candidate.id === comparison_id)
  if (!definition) throw new Error(`Unknown comparison: ${comparison_id}`)
  const scale_a = createScaleInstance(root_pitch_class, definition.formula_a)
  const scale_b = createScaleInstance(root_pitch_class, definition.formula_b)
  return {
    id: definition.id,
    root_pitch_class: scale_a.root_pitch_class,
    formula_a: definition.formula_a,
    formula_b: definition.formula_b,
    scale_a,
    scale_b,
    changed_degree: definition.changed_degree,
    changed_note_a: get_note_by_degree(scale_a, definition.changed_degree).spelling.text,
    changed_note_b: get_note_by_degree(scale_b, definition.changed_degree).spelling.text,
    choices: Array.from({ length: 7 }, (_, index) => index + 1).sort((left, right) => Math.abs(left - definition.changed_degree) - Math.abs(right - definition.changed_degree)).slice(0, 3).sort((left, right) => left - right).map((degree) => ({ degree, label: ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][degree] ?? `Degree ${degree}` }))
  }
}

export function createEarGymState(exercise = createComparisonExercise(), streak = 0): EarGymState {
  return { phase: 'listen', exercise, answer: null, is_correct: null, streak, playing_example: null }
}

export function markExamplePlaying(state: EarGymState, example: 'a' | 'b'): EarGymState {
  if (state.phase === 'feedback') return state
  return { ...state, playing_example: example }
}

export function beginAnswer(state: EarGymState): EarGymState {
  if (state.phase !== 'listen') return state
  return { ...state, phase: 'answer', playing_example: null }
}

export function submitAnswer(state: EarGymState, degree: number): EarGymState {
  if (state.phase !== 'answer') return state
  const is_correct = degree === state.exercise.changed_degree
  return { ...state, phase: 'feedback', answer: degree, is_correct, streak: is_correct ? state.streak + 1 : 0, playing_example: null }
}

export function restartExercise(state: EarGymState): EarGymState {
  return createEarGymState(state.exercise, state.streak)
}
