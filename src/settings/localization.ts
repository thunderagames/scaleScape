import type { FormulaId, NoteRole } from '../theory/scale-formulas'

export type Language = 'en' | 'es'

export interface TranslationDictionary {
  readonly settings: string
  readonly settings_title: string
  readonly language: string
  readonly english: string
  readonly spanish: string
  readonly formula_names: Readonly<Record<FormulaId, string>>
  readonly note: string
  readonly close: string
  readonly save: string
  readonly app_label: string
  readonly nav_explore: string
  readonly nav_ear_gym: string
  readonly ear_gym_title: string
  readonly ear_gym_intro: string
  readonly ear_gym_placeholder: string
  readonly app_title: string
  readonly intro: string
  readonly scale_controls: string
  readonly root: string
  readonly mode: string
  readonly play_scale: string
  readonly stop: string
  readonly audio_locked: string
  readonly audio_playing: string
  readonly audio_unavailable: string
  readonly audio_stopped: string
  readonly generated_scale: string
  readonly select_note: string
  readonly piano: string
  readonly guitar: string
  readonly generation: string
  readonly degree: string
  readonly role: string
  readonly roles: Readonly<Record<NoteRole, string>>
  readonly instrument_visibility: string
  readonly show_piano: string
  readonly show_guitar: string
  readonly instrument_region: string
  readonly guitar_table: string
  readonly string_label: string
  readonly fret_label: string
}

const ENGLISH: TranslationDictionary = {
  settings: 'Settings',
  settings_title: 'Configuration',
  language: 'Language',
  english: 'English',
  spanish: 'Spanish',
  formula_names: { major: 'Major', natural_minor: 'Natural minor', dorian: 'Dorian', phrygian: 'Phrygian', lydian: 'Lydian', mixolydian: 'Mixolydian', locrian: 'Locrian', major_pentatonic: 'Major pentatonic' },
  note: 'Note',
  close: 'Close',
  save: 'Save',
  app_label: 'ScaleScape MVP',
  nav_explore: 'Explore',
  nav_ear_gym: 'Ear Gym',
  ear_gym_title: 'Ear Gym',
  ear_gym_intro: 'Train your ear by comparing related scales and modes.',
  ear_gym_placeholder: 'The first comparison exercise is the next step.',
  app_title: 'Explore what a scale sounds like.',
  intro: 'Choose a root and mode. Hear the scale, inspect interval roles, and find the same notes on piano and guitar.',
  scale_controls: 'Scale controls',
  root: 'Root',
  mode: 'Mode',
  play_scale: 'Play scale',
  stop: 'Stop',
  audio_locked: 'Audio starts after your first action.',
  audio_playing: 'Audio playing.',
  audio_unavailable: 'Audio unavailable.',
  audio_stopped: 'Audio stopped.',
  generated_scale: 'Generated scale',
  select_note: 'Select a scale note for interval and role detail.',
  piano: 'Piano · C3 to C5',
  guitar: 'Guitar · standard tuning · frets 0 to 12',
  generation: 'Generation',
  degree: 'degree',
  role: 'role'
  ,roles: { tonic: 'tonic', characteristic: 'characteristic', chord_tone: 'chord tone', color_tone: 'color tone' }
  ,instrument_visibility: 'Instrument visibility'
  ,show_piano: 'Show piano'
  ,show_guitar: 'Show guitar'
  ,instrument_region: 'Synchronized instruments'
  ,guitar_table: 'Interactive six-string guitar fretboard'
  ,string_label: 'String'
  ,fret_label: 'Fret'
}

const SPANISH: TranslationDictionary = {
  settings: 'Ajustes',
  settings_title: 'Configuración',
  language: 'Idioma',
  english: 'Inglés',
  spanish: 'Español',
  formula_names: { major: 'Mayor', natural_minor: 'Menor natural', dorian: 'Dórico', phrygian: 'Frigio', lydian: 'Lidio', mixolydian: 'Mixolidio', locrian: 'Locrio', major_pentatonic: 'Pentatónica mayor' },
  note: 'Nota',
  close: 'Cerrar',
  save: 'Guardar',
  app_label: 'ScaleScape MVP',
  nav_explore: 'Explorar',
  nav_ear_gym: 'Gimnasio auditivo',
  ear_gym_title: 'Gimnasio auditivo',
  ear_gym_intro: 'Entrená el oído comparando escalas y modos relacionados.',
  ear_gym_placeholder: 'El primer ejercicio de comparación es el próximo paso.',
  app_title: 'Explorá cómo suena una escala.',
  intro: 'Elegí una tónica y un modo. Escuchá la escala, mirá los roles de los intervalos y encontrá las mismas notas en piano y guitarra.',
  scale_controls: 'Controles de escala',
  root: 'Tónica',
  mode: 'Modo',
  play_scale: 'Reproducir escala',
  stop: 'Detener',
  audio_locked: 'El audio comienza después de tu primera acción.',
  audio_playing: 'Audio reproduciéndose.',
  audio_unavailable: 'Audio no disponible.',
  audio_stopped: 'Audio detenido.',
  generated_scale: 'Escala generada',
  select_note: 'Seleccioná una nota para ver el detalle de intervalo y rol.',
  piano: 'Piano · Do3 a Do5',
  guitar: 'Guitarra · afinación estándar · trastes 0 a 12',
  generation: 'Generación',
  degree: 'grado',
  role: 'rol'
  ,roles: { tonic: 'tónica', characteristic: 'característica', chord_tone: 'nota del acorde', color_tone: 'nota de color' }
  ,instrument_visibility: 'Visibilidad de instrumentos'
  ,show_piano: 'Mostrar piano'
  ,show_guitar: 'Mostrar guitarra'
  ,instrument_region: 'Instrumentos sincronizados'
  ,guitar_table: 'Diapasón interactivo de seis cuerdas'
  ,string_label: 'Cuerda'
  ,fret_label: 'Traste'
}

export function getTranslations(language: Language): TranslationDictionary {
  return language === 'es' ? SPANISH : ENGLISH
}
