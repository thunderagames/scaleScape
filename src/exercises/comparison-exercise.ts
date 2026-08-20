import { createScaleInstance, type ScaleInstance } from '../theory/scale-instance'
import type { FormulaId } from '../theory/scale-formulas'

export type EarGymPhase = 'listen' | 'answer' | 'feedback'

export interface DegreeChoice {
  readonly degree: number
  readonly label: string
}

export interface ComparisonExercise {
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

const CHANGED_DEGREE = 6

function get_note_by_degree(scale_instance: ScaleInstance, degree: number) {
  const note = scale_instance.notes.find((candidate) => candidate.degree === degree)
  if (!note) throw new Error(`Scale is missing degree ${degree}`)
  return note
}

export function createComparisonExercise(root_pitch_class = 4): ComparisonExercise {
  const scale_a = createScaleInstance(root_pitch_class, 'natural_minor')
  const scale_b = createScaleInstance(root_pitch_class, 'dorian')
  return {
    root_pitch_class: scale_a.root_pitch_class,
    formula_a: 'natural_minor',
    formula_b: 'dorian',
    scale_a,
    scale_b,
    changed_degree: CHANGED_DEGREE,
    changed_note_a: get_note_by_degree(scale_a, CHANGED_DEGREE).spelling.text,
    changed_note_b: get_note_by_degree(scale_b, CHANGED_DEGREE).spelling.text,
    choices: [5, CHANGED_DEGREE, 7].map((degree) => ({ degree, label: ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][degree] ?? `Degree ${degree}` }))
  }
}

export function createEarGymState(exercise = createComparisonExercise()): EarGymState {
  return { phase: 'listen', exercise, answer: null, is_correct: null, streak: 0, playing_example: null }
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
  return createEarGymState(state.exercise)
}
