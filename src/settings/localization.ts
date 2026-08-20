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
  readonly nav_guided_start: string
  readonly toggle_navigation: string
  readonly ear_gym_title: string
  readonly ear_gym_intro: string
  readonly ear_gym_audio_required: string
  readonly ear_gym_visual_fallback: string
  readonly ear_gym_placeholder: string
  readonly guided_comparison: string
  readonly comparison_selector: string
  readonly natural_minor_vs_dorian: string
  readonly comparison_names: Readonly<Record<string, string>>
  readonly interval_prompt: string
  readonly identify_prompt: string
  readonly begin_answer: string
  readonly play_natural_minor: string
  readonly play_dorian: string
  readonly replay_natural_minor: string
  readonly replay_dorian: string
  readonly stop_audio: string
  readonly audio_playing_a: string
  readonly audio_playing_b: string
  readonly changed_degree_correct: string
  readonly not_quite: string
  readonly characteristic_explanation: string
  readonly streak: string
  readonly try_again: string
  readonly app_title: string
  readonly intro: string
  readonly scale_controls: string
  readonly scale_selection_hint: string
  readonly root: string
  readonly mode: string
  readonly play_scale: string
  readonly stop: string
  readonly audio_locked: string
  readonly audio_playing: string
  readonly audio_unavailable: string
  readonly audio_stopped: string
  readonly generated_scale: string
  readonly interval_label: string
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
  readonly audio_controls: string
  readonly volume: string
  readonly mute: string
  readonly unmute: string
  readonly muted: string
  readonly guided_start: string
  readonly guided_start_title: string
  readonly guided_start_intro: string
  readonly guided_start_step_one: string
  readonly guided_start_step_two: string
  readonly guided_start_step_three: string
  readonly start_guided: string
  readonly explore_directly: string
  readonly guided_start_playing: string
  readonly guided_step_select: string
  readonly guided_step_compare: string
  readonly guided_open_ear_gym: string
  readonly export_diagnostics: string
  readonly diagnostics_mode: string
  readonly diagnostics_exported: string
  readonly diagnostics_unavailable: string
  readonly context: string
  readonly context_off: string
  readonly context_drone: string
  readonly context_pedal: string
}

const ENGLISH: TranslationDictionary = {
  settings: 'Settings',
  settings_title: 'Configuration',
  language: 'Language',
  english: 'English',
  spanish: 'Spanish',
   formula_names: { major: 'Major', natural_minor: 'Natural minor', dorian: 'Dorian', phrygian: 'Phrygian', lydian: 'Lydian', mixolydian: 'Mixolydian', locrian: 'Locrian', major_pentatonic: 'Major pentatonic', minor_pentatonic: 'Minor pentatonic' },
  note: 'Note',
  close: 'Close',
  save: 'Save',
  app_label: 'ScaleScape MVP',
  nav_explore: 'Explore',
  nav_ear_gym: 'Ear Gym',
  nav_guided_start: 'Guided Start',
  toggle_navigation: 'Toggle navigation',
  ear_gym_title: 'Ear Gym',
  ear_gym_intro: 'Train your ear by comparing related scales and modes.',
  ear_gym_audio_required: 'Audio is required for scored listening exercises.',
  ear_gym_visual_fallback: 'You can still inspect the two scales visually while audio is unavailable.',
  ear_gym_placeholder: 'The first comparison exercise is the next step.',
  guided_comparison: 'Guided comparison',
  comparison_selector: 'Comparison',
  natural_minor_vs_dorian: 'Natural minor vs Dorian',
  comparison_names: { natural_minor_dorian: 'Natural minor vs Dorian', major_mixolydian: 'Major vs Mixolydian', major_lydian: 'Major vs Lydian', natural_minor_phrygian: 'Natural minor vs Phrygian' },
  interval_prompt: 'Which degree changed between the examples?',
  identify_prompt: 'Choose the degree that changed.',
  begin_answer: 'Identify the changed degree',
  play_natural_minor: 'Play natural minor · Example A',
  play_dorian: 'Play Dorian · Example B',
  replay_natural_minor: 'Replay natural minor · Example A',
  replay_dorian: 'Replay Dorian · Example B',
  stop_audio: 'Stop audio',
  audio_playing_a: 'Playing natural minor.',
  audio_playing_b: 'Playing Dorian.',
  changed_degree_correct: 'That is the changed degree.',
  not_quite: 'Not quite. The changed degree is VI.',
  characteristic_explanation: 'Dorian raises the sixth degree from {lower} to {raised} in {root}.',
  streak: 'Streak',
  try_again: 'Try again',
   app_title: 'Scale Explorer',
  intro: 'Choose a root and mode. Hear the scale, inspect interval roles, and find the same notes on piano and guitar.',
  scale_controls: 'Scale controls',
  scale_selection_hint: 'Select the tonic and mode',
  root: 'Root',
  mode: 'Mode',
  play_scale: 'Play scale',
  stop: 'Stop',
  audio_locked: 'Audio starts after your first action.',
  audio_playing: 'Audio playing.',
  audio_unavailable: 'Audio unavailable.',
  audio_stopped: 'Audio stopped.',
   generated_scale: 'Select Scale',
  interval_label: 'semitones',
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
  ,audio_controls: 'Audio controls'
  ,volume: 'Volume'
  ,mute: 'Mute'
  ,unmute: 'Unmute'
  ,muted: 'Muted'
  ,guided_start: 'Guided Start'
  ,guided_start_title: 'Start by hearing one scale in context.'
  ,guided_start_intro: 'We will play E Dorian over a tonic drone. Then inspect its characteristic sixth and compare it with natural minor in Ear Gym.'
  ,guided_start_step_one: 'Hear the scale over its tonic.'
  ,guided_start_step_two: 'Select the characteristic note on piano or guitar.'
  ,guided_start_step_three: 'Compare the changed degree in Ear Gym.'
  ,start_guided: 'Start Guided Start'
  ,explore_directly: 'Explore directly'
  ,guided_start_playing: 'Guided Start is playing.'
  ,guided_step_select: 'Now select the characteristic note on piano or guitar.'
  ,guided_step_compare: 'You found the characteristic note. Compare it in Ear Gym.'
  ,guided_open_ear_gym: 'Open Ear Gym'
  ,export_diagnostics: 'Export diagnostics'
  ,diagnostics_mode: 'Enable diagnostic mode'
  ,diagnostics_exported: 'Diagnostics exported.'
  ,diagnostics_unavailable: 'Diagnostics export unavailable.'
  ,context: 'Harmonic context'
  ,context_off: 'No context'
  ,context_drone: 'Tonic drone'
  ,context_pedal: 'Tonic + fifth pedal'
}

const SPANISH: TranslationDictionary = {
  settings: 'Ajustes',
  settings_title: 'Configuración',
  language: 'Idioma',
  english: 'Inglés',
  spanish: 'Español',
   formula_names: { major: 'Mayor', natural_minor: 'Menor natural', dorian: 'Dórico', phrygian: 'Frigio', lydian: 'Lidio', mixolydian: 'Mixolidio', locrian: 'Locrio', major_pentatonic: 'Pentatónica mayor', minor_pentatonic: 'Pentatónica menor' },
  note: 'Nota',
  close: 'Cerrar',
  save: 'Guardar',
  app_label: 'ScaleScape MVP',
  nav_explore: 'Explorar',
  nav_ear_gym: 'Gimnasio auditivo',
  nav_guided_start: 'Inicio guiado',
  toggle_navigation: 'Alternar navegación',
  ear_gym_title: 'Gimnasio auditivo',
  ear_gym_intro: 'Entrena el oído comparando escalas y modos relacionados.',
  ear_gym_audio_required: 'El audio es necesario para puntuar los ejercicios auditivos.',
  ear_gym_visual_fallback: 'Mientras el audio no esté disponible, puedes inspeccionar visualmente las dos escalas.',
  ear_gym_placeholder: 'El primer ejercicio de comparación es el próximo paso.',
  guided_comparison: 'Comparación guiada',
  comparison_selector: 'Comparación',
  natural_minor_vs_dorian: 'Menor natural vs Dórico',
  comparison_names: { natural_minor_dorian: 'Menor natural vs Dórico', major_mixolydian: 'Mayor vs Mixolidio', major_lydian: 'Mayor vs Lidio', natural_minor_phrygian: 'Menor natural vs Frigio' },
  interval_prompt: '¿Qué grado cambió entre los ejemplos?',
  identify_prompt: 'Elige el grado que cambió.',
  begin_answer: 'Identificar el grado cambiado',
  play_natural_minor: 'Reproducir menor natural · Ejemplo A',
  play_dorian: 'Reproducir dórico · Ejemplo B',
  replay_natural_minor: 'Repetir menor natural · Ejemplo A',
  replay_dorian: 'Repetir dórico · Ejemplo B',
  stop_audio: 'Detener audio',
  audio_playing_a: 'Reproduciendo menor natural.',
  audio_playing_b: 'Reproduciendo dórico.',
  changed_degree_correct: 'Ese es el grado cambiado.',
  not_quite: 'No exactamente. El grado cambiado es VI.',
  characteristic_explanation: 'El modo dórico eleva el sexto grado de {lower} a {raised} en {root}.',
  streak: 'Racha',
  try_again: 'Intentar de nuevo',
   app_title: 'Scale Explorer',
  intro: 'Elige una tónica y un modo. Escucha la escala, observa los roles de los intervalos y encuentra las mismas notas en piano y guitarra.',
  scale_controls: 'Controles de escala',
  scale_selection_hint: 'Selecciona la tónica y el modo',
  root: 'Tónica',
  mode: 'Modo',
  play_scale: 'Reproducir escala',
  stop: 'Detener',
  audio_locked: 'El audio comienza después de tu primera acción.',
  audio_playing: 'Audio reproduciéndose.',
  audio_unavailable: 'Audio no disponible.',
  audio_stopped: 'Audio detenido.',
   generated_scale: 'Selecciona la escala',
  interval_label: 'semitonos',
  select_note: 'Selecciona una nota para ver el detalle del intervalo y su rol.',
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
  ,audio_controls: 'Controles de audio'
  ,volume: 'Volumen'
  ,mute: 'Silenciar'
  ,unmute: 'Activar sonido'
  ,muted: 'Silenciado'
  ,guided_start: 'Inicio guiado'
   ,guided_start_title: 'Comienza escuchando una escala en contexto.'
   ,guided_start_intro: 'Reproduciremos Mi dórico sobre un drone de tónica. Después observa su sexta característica y compárala con el menor natural en el gimnasio auditivo.'
   ,guided_start_step_one: 'Escucha la escala sobre su tónica.'
   ,guided_start_step_two: 'Selecciona la nota característica en piano o guitarra.'
   ,guided_start_step_three: 'Compara el grado cambiado en el gimnasio auditivo.'
  ,start_guided: 'Comenzar inicio guiado'
  ,explore_directly: 'Explorar directamente'
  ,guided_start_playing: 'El inicio guiado está reproduciéndose.'
   ,guided_step_select: 'Ahora selecciona la nota característica en el piano o la guitarra.'
   ,guided_step_compare: 'Encontraste la nota característica. Compárala en el gimnasio auditivo.'
  ,guided_open_ear_gym: 'Abrir gimnasio auditivo'
  ,export_diagnostics: 'Exportar diagnósticos'
  ,diagnostics_mode: 'Activar modo diagnóstico'
  ,diagnostics_exported: 'Diagnósticos exportados.'
  ,diagnostics_unavailable: 'La exportación de diagnósticos no está disponible.'
  ,context: 'Contexto armónico'
  ,context_off: 'Sin contexto'
  ,context_drone: 'Drone de tónica'
   ,context_pedal: 'Pedal de tónica y quinta'
}

export function getTranslations(language: Language): TranslationDictionary {
  return language === 'es' ? SPANISH : ENGLISH
}
