import { create_scale_instance, type ScaleInstance, type ScaleNote } from '../../../poc-0-theory-audio/src/theory/scale-instance'
import type { FormulaId } from '../../../poc-0-theory-audio/src/theory/scale-formulas'

export type LearningPhase = 'listen' | 'identify' | 'reveal' | 'transfer' | 'complete'

export interface DegreeCandidate {
  readonly degree: number
  readonly label: string
}

export interface ComparisonExercise {
  readonly root_pitch_class: number
  readonly transfer_root_pitch_class: number
  readonly formula_a: FormulaId
  readonly formula_b: FormulaId
  readonly scale_a: ScaleInstance
  readonly scale_b: ScaleInstance
  readonly changed_degree: number
  readonly changed_note_a: ScaleNote
  readonly changed_note_b: ScaleNote
  readonly candidates: readonly DegreeCandidate[]
  readonly transfer_candidates: readonly DegreeCandidate[]
}

export interface LearningLoopState {
  readonly phase: LearningPhase
  readonly exercise: ComparisonExercise
  readonly changed_note_degree: number | null
  readonly changed_note_correct: boolean | null
  readonly transfer_note_degree: number | null
  readonly transfer_correct: boolean | null
  readonly streak: number
}

const CHANGED_DEGREE = 6
const FORMULA_A: FormulaId = 'natural_minor'
const FORMULA_B: FormulaId = 'dorian'

function get_note_by_degree(scale_instance: ScaleInstance, degree: number): ScaleNote {
  const note = scale_instance.notes.find((candidate) => candidate.degree === degree)
  if (!note) {
    throw new Error(`Scale is missing degree ${degree}`)
  }

  return note
}

function get_degree_label(degree: number): string {
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][degree] ?? `Degree ${degree}`
}

function create_degree_candidates(scale_instance: ScaleInstance, degrees: readonly number[], show_note_names: boolean): readonly DegreeCandidate[] {
  return degrees.map((degree) => ({
    degree,
    label: show_note_names ? get_note_by_degree(scale_instance, degree).spelling.text : get_degree_label(degree)
  }))
}

export function create_comparison_exercise(root_pitch_class = 4, transfer_root_pitch_class = 9): ComparisonExercise {
  const scale_a = create_scale_instance(root_pitch_class, FORMULA_A)
  const scale_b = create_scale_instance(root_pitch_class, FORMULA_B)
  const transfer_scale_a = create_scale_instance(transfer_root_pitch_class, FORMULA_A)
  const transfer_scale_b = create_scale_instance(transfer_root_pitch_class, FORMULA_B)
  const changed_note_a = get_note_by_degree(scale_a, CHANGED_DEGREE)
  const changed_note_b = get_note_by_degree(scale_b, CHANGED_DEGREE)
  const transfer_note_a = get_note_by_degree(transfer_scale_a, CHANGED_DEGREE)
  const transfer_note_b = get_note_by_degree(transfer_scale_b, CHANGED_DEGREE)

  return {
    root_pitch_class: scale_a.root_pitch_class,
    transfer_root_pitch_class: transfer_scale_a.root_pitch_class,
    formula_a: FORMULA_A,
    formula_b: FORMULA_B,
    scale_a,
    scale_b,
    changed_degree: CHANGED_DEGREE,
    changed_note_a,
    changed_note_b,
    candidates: create_degree_candidates(scale_a, [5, CHANGED_DEGREE, 7], false),
    transfer_candidates: create_degree_candidates(transfer_scale_b, [5, CHANGED_DEGREE, 7], true)
  }
}

export function create_learning_loop_state(exercise = create_comparison_exercise()): LearningLoopState {
  return {
    phase: 'listen',
    exercise,
    changed_note_degree: null,
    changed_note_correct: null,
    transfer_note_degree: null,
    transfer_correct: null,
    streak: 0
  }
}

export function select_changed_note(state: LearningLoopState, degree: number): LearningLoopState {
  if (state.phase !== 'listen') {
    return state
  }

  const changed_note_correct = degree === state.exercise.changed_degree
  return {
    ...state,
    phase: 'identify',
    changed_note_degree: degree,
    changed_note_correct,
    streak: changed_note_correct ? state.streak : 0
  }
}

export function reveal_comparison(state: LearningLoopState): LearningLoopState {
  if (state.phase !== 'identify' || state.changed_note_degree === null) {
    return state
  }

  return { ...state, phase: 'reveal' }
}

export function start_transfer(state: LearningLoopState): LearningLoopState {
  if (state.phase !== 'reveal') {
    return state
  }

  return { ...state, phase: 'transfer', transfer_note_degree: null, transfer_correct: null }
}

export function answer_transfer(state: LearningLoopState, degree: number): LearningLoopState {
  if (state.phase !== 'transfer') {
    return state
  }

  const transfer_correct = degree === state.exercise.changed_degree
  return {
    ...state,
    phase: 'complete',
    transfer_note_degree: degree,
    transfer_correct,
    streak: transfer_correct && state.changed_note_correct ? state.streak + 1 : 0
  }
}

export function get_characteristic_caption(state: LearningLoopState): string {
  const root = state.exercise.scale_a.root_spelling.text
  const lower_note = state.exercise.changed_note_a.spelling.text
  const raised_note = state.exercise.changed_note_b.spelling.text
  return `Dorian raises the sixth degree from ${lower_note} to ${raised_note} in ${root}. That single note changes the color.`
}
