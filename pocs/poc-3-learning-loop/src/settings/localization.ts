export type Language = 'en' | 'es'

export interface TranslationDictionary {
  readonly settings: string
  readonly settings_title: string
  readonly app_title: string
  readonly intro: string
  readonly language: string
  readonly degree: string
  readonly english: string
  readonly spanish: string
  readonly close: string
  readonly save: string
  readonly guided_comparison: string
  readonly natural_minor_vs_dorian: string
  readonly degree_intro: string
  readonly degree_example: string
  readonly listen: string
  readonly identify: string
  readonly reveal: string
  readonly transfer: string
  readonly play_natural_minor: string
  readonly play_dorian: string
  readonly hear_changed_interval: string
  readonly audio_locked: string
  readonly audio_playing: string
  readonly audio_unavailable: string
  readonly interval_prompt: string
  readonly identify_prompt: string
  readonly reveal_relationship: string
  readonly not_quite: string
  readonly changed_degree_correct: string
  readonly reveal_title: string
  readonly theory_after_experience: string
  readonly comparison_root: string
  readonly natural_minor: string
  readonly dorian: string
  readonly piano: string
  readonly guitar: string
  readonly try_same_idea_on_a: string
  readonly transfer_check: string
  readonly transfer_prompt: string
  readonly concept_transferred: string
  readonly transfer_correct: string
  readonly transfer_try_again: string
  readonly try_again: string
  readonly help_listen: string
  readonly help_identify: string
  readonly help_reveal: string
  readonly help_transfer: string
  readonly help_play_natural_minor: string
  readonly help_play_dorian: string
  readonly help_changed_interval: string
  readonly help_reveal_content: string
  readonly help_transfer_action: string
  readonly characteristic_caption: string
  readonly choose_before_answer: string
}

const ENGLISH: TranslationDictionary = {
  settings: 'Settings',
  settings_title: 'Configuration',
  app_title: 'Hear the note that changes the color.',
  intro: 'Listen first. Name the difference only after you have heard and located it.',
  language: 'Language',
  degree: 'Degree',
  english: 'English',
  spanish: 'Spanish',
  close: 'Close',
  save: 'Save',
  guided_comparison: 'Guided comparison',
  natural_minor_vs_dorian: 'Natural minor vs Dorian',
  degree_intro: 'Roman numerals count scale degrees from the root: I is first, VI is sixth.',
  degree_example: 'C major: I/C · II/D · III/E · IV/F · V/G · VI/A · VII/B',
  listen: '1. Listen',
  identify: '2. Identify',
  reveal: '3. Reveal',
  transfer: '4. Transfer',
  play_natural_minor: 'Play Natural minor · Example A',
  play_dorian: 'Play Dorian · Example B',
  hear_changed_interval: 'Hear the changed interval',
  audio_locked: 'Audio starts after your first action.',
  audio_playing: 'Audio playing.',
  audio_unavailable: 'Audio unavailable',
  interval_prompt: 'Which interval degree changed between the examples?',
  identify_prompt: 'Choose a degree, or reveal the relationship when you are ready.',
  reveal_relationship: 'Reveal the relationship',
  not_quite: 'Not quite. You can still replay before revealing the answer.',
  changed_degree_correct: 'That is the changed degree.',
  reveal_title: 'The sixth degree is the difference',
  theory_after_experience: 'Theory after experience',
  comparison_root: 'Comparison root',
  natural_minor: 'Natural minor',
  dorian: 'Dorian',
  piano: 'Piano',
  guitar: 'Guitar',
  try_same_idea_on_a: 'Try the same idea on A',
  transfer_check: 'Transfer check',
  transfer_prompt: 'Which note is the raised sixth in A Dorian?',
  concept_transferred: 'Concept transferred',
  transfer_correct: 'Correct: A Dorian raises F to F#.',
  transfer_try_again: 'The raised sixth in A Dorian is F#.',
  try_again: 'Try again',
  help_listen: 'Play both examples and listen for the interval that changes.',
  help_identify: 'Choose the Roman-numeral degree that changed before revealing the answer.',
  help_reveal: 'See the root, note names, interval name, and instrument locations.',
  help_transfer: 'Apply the same interval idea to a new root.',
  help_play_natural_minor: 'Hear the natural-minor version over its tonic drone.',
  help_play_dorian: 'Hear the Dorian version over the same tonic drone.',
  help_changed_interval: 'Replay the drone and the characteristic note together.',
  help_reveal_content: 'Now connect what you heard to the degree, interval name, spelling, and instrument locations.',
  help_transfer_action: 'Move to a new root and check whether the same sixth-degree idea transfers.',
  characteristic_caption: 'Dorian raises the sixth degree from {lower} to {raised} in {root}. That single note changes the color.',
  choose_before_answer: 'Choose the changed note before reading the answer.'
}

const SPANISH: TranslationDictionary = {
  settings: 'Ajustes',
  settings_title: 'Configuración',
  app_title: 'Escuchá la nota que cambia el color.',
  intro: 'Escuchá primero. Nombrá la diferencia después de oírla y ubicarla.',
  language: 'Idioma',
  degree: 'Grado',
  english: 'Inglés',
  spanish: 'Español',
  close: 'Cerrar',
  save: 'Guardar',
  guided_comparison: 'Comparación guiada',
  natural_minor_vs_dorian: 'Menor natural vs Dórico',
  degree_intro: 'Los números romanos cuentan los grados desde la tónica: I es el primero y VI es el sexto.',
  degree_example: 'Do mayor: I/Do · II/Re · III/Mi · IV/Fa · V/Sol · VI/La · VII/Si',
  listen: '1. Escuchá',
  identify: '2. Identificá',
  reveal: '3. Revelá',
  transfer: '4. Transferí',
  play_natural_minor: 'Reproducir menor natural · Ejemplo A',
  play_dorian: 'Reproducir dórico · Ejemplo B',
  hear_changed_interval: 'Escuchar el intervalo cambiado',
  audio_locked: 'El audio comienza después de tu primera acción.',
  audio_playing: 'Audio reproduciéndose.',
  audio_unavailable: 'Audio no disponible',
  interval_prompt: '¿Qué grado del intervalo cambió entre los ejemplos?',
  identify_prompt: 'Elegí un grado o revelá la relación cuando estés listo.',
  reveal_relationship: 'Revelar la relación',
  not_quite: 'No exactamente. Podés volver a escuchar antes de revelar la respuesta.',
  changed_degree_correct: 'Ese es el grado cambiado.',
  reveal_title: 'El sexto grado es la diferencia',
  theory_after_experience: 'Teoría después de la experiencia',
  comparison_root: 'Tónica de la comparación',
  natural_minor: 'Menor natural',
  dorian: 'Dórico',
  piano: 'Piano',
  guitar: 'Guitarra',
  try_same_idea_on_a: 'Probar la misma idea en La',
  transfer_check: 'Comprobación de transferencia',
  transfer_prompt: '¿Qué nota es el sexto grado elevado en La dórico?',
  concept_transferred: 'Concepto transferido',
  transfer_correct: 'Correcto: La dórico eleva Fa a Fa#.',
  transfer_try_again: 'El sexto grado elevado en La dórico es Fa#.',
  try_again: 'Intentar de nuevo',
  help_listen: 'Reproducí ambos ejemplos y escuchá qué intervalo cambia.',
  help_identify: 'Elegí el grado en números romanos que cambió antes de revelar la respuesta.',
  help_reveal: 'Mirá la tónica, las notas, el nombre del intervalo y sus ubicaciones.',
  help_transfer: 'Aplicá la misma idea de intervalo a una nueva tónica.',
  help_play_natural_minor: 'Escuchá la versión menor natural sobre su tónica.',
  help_play_dorian: 'Escuchá la versión dórica sobre la misma tónica.',
  help_changed_interval: 'Volvé a escuchar la tónica junto con la nota característica.',
  help_reveal_content: 'Relacioná lo que escuchaste con el grado, el intervalo, la escritura y el instrumento.',
  help_transfer_action: 'Pasá a una nueva tónica y comprobá si se mantiene la idea del sexto grado.',
  characteristic_caption: 'El modo dórico eleva el sexto grado de {lower} a {raised} en {root}. Esa sola nota cambia el color.',
  choose_before_answer: 'Elegí la nota cambiada antes de leer la respuesta.'
}

export function get_translations(language: Language): TranslationDictionary {
  return language === 'es' ? SPANISH : ENGLISH
}
