import type { FormulaId, NoteRole, ScaleCategory } from '../theory/scale-formulas'

export type Language = 'en' | 'es'

export interface TranslationDictionary {
  readonly settings: string
  readonly help: string
  readonly settings_title: string
  readonly language: string
  readonly english: string
  readonly spanish: string
  readonly formula_names: Readonly<Partial<Record<FormulaId, string>>>
  readonly scale_categories: Readonly<Record<ScaleCategory, string>>
  readonly note: string
  readonly close: string
  readonly save: string
  readonly app_label: string
  readonly footer_credit: string
  readonly nav_explore: string
  readonly nav_ear_gym: string
  readonly nav_harmony: string
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
  readonly scale_note_help: string
  readonly color_legend: string
  readonly legend_color: string
  readonly legend_meaning: string
  readonly legend_tonic: string
  readonly legend_tonic_description: string
  readonly legend_characteristic: string
  readonly legend_characteristic_description: string
  readonly legend_chord_tone: string
  readonly legend_chord_tone_description: string
  readonly legend_color_tone: string
  readonly legend_color_tone_description: string
  readonly instrument_color_help: string
  readonly root: string
  readonly mode: string
  readonly play_scale: string
  readonly play_chord: string
  readonly stop: string
  readonly audio_locked: string
  readonly audio_playing: string
  readonly audio_unavailable: string
  readonly audio_stopped: string
  readonly generated_scale: string
  readonly degree_formula: string
  readonly interval_structure: string
  readonly formula_information: string
  readonly interval_label: string
  readonly select_note: string
  readonly piano: string
  readonly guitar: string
  readonly bass: string
  readonly ukulele: string
  readonly generation: string
  readonly degree: string
  readonly role: string
  readonly roles: Readonly<Record<NoteRole, string>>
  readonly instrument_visibility: string
  readonly show_piano: string
  readonly show_guitar: string
  readonly show_bass: string
  readonly show_ukulele: string
  readonly scale_description_visibility: string
  readonly show_scale_description: string
  readonly instrument_region: string
  readonly guitar_table: string
  readonly bass_table: string
  readonly ukulele_table: string
  readonly guitar_tuning: string
  readonly bass_tuning: string
  readonly ukulele_tuning: string
  readonly tuner: string
  readonly guitar_tuning_semitones: string
  readonly lower_tuning: string
  readonly raise_tuning: string
  readonly string_label: string
  readonly fret_label: string
  readonly audio_controls: string
  readonly metronome: string
  readonly metronome_bpm: string
  readonly start_metronome: string
  readonly stop_metronome: string
  readonly decrease_bpm: string
  readonly increase_bpm: string
  readonly metronome_settings_hint: string
  readonly volume: string
  readonly tempo: string
  readonly tempo_120: string
  readonly tempo_150: string
  readonly tempo_200: string
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
  readonly note_naming_label: string
  readonly note_naming_letter: string
  readonly note_naming_solfege: string
  readonly scale_history: string
  readonly scale_usage: string
  readonly feedback: string
  readonly feedback_title: string
  readonly feedback_intro: string
  readonly feedback_name: string
  readonly feedback_email: string
  readonly feedback_message: string
  readonly send_feedback: string
  readonly feedback_sending: string
  readonly feedback_sent: string
  readonly feedback_error: string
  readonly feedback_not_configured: string
  readonly harmony_title: string
  readonly harmony_intro: string
  readonly harmony_progression: string
  readonly harmony_chord: string
  readonly harmony_selection_mode: string
  readonly harmony_no_progressions: string
  readonly harmony_degree: string
  readonly harmony_chord_map: string
  readonly harmony_scale_map: string
  readonly harmony_fret_window: string
  readonly harmony_full_fretboard: string
  readonly harmony_piano_map: string
  readonly harmony_color_legend: string
  readonly harmony_roles: Readonly<Record<'chord_tonic' | 'chord_tone' | 'nonchord', string>>
  readonly progression_genres: Readonly<Record<string, string>>
  readonly progression_names: Readonly<Record<string, string>>
  readonly account: string
  readonly account_title: string
  readonly account_username: string
  readonly account_password: string
  readonly account_sign_in: string
  readonly account_create: string
  readonly account_sign_out: string
  readonly account_signed_in_as: string
  readonly account_error_invalid_credentials: string
  readonly account_error_username_taken: string
  readonly account_error_invalid_username: string
  readonly account_error_invalid_password: string
  readonly account_error_too_many_attempts: string
  readonly account_error_unavailable: string
}

const ENGLISH: UiTranslations = {
  settings: 'Settings',
  help: 'Help',
  settings_title: 'Configuration',
  language: 'Language',
  english: 'English',
  spanish: 'Spanish',
  note: 'Note',
  close: 'Close',
  save: 'Save',
  app_label: 'ScaleScape MVP',
  footer_credit: 'Developed by ThunderaGames · 2026',
  nav_explore: 'Explore',
  nav_ear_gym: 'Ear Gym',
  nav_harmony: 'Harmony',
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
  scale_controls: 'Choose a note and a mode',
  scale_note_help: 'Light gray notes are chord tones: stable notes from the tonic triad. Gray notes are color tones. Orange marks the tonic and teal marks the characteristic degree.',
  color_legend: 'Color guide',
  legend_color: 'Color',
  legend_meaning: 'Meaning',
  legend_tonic: 'Tonic',
  legend_tonic_description: 'Degree 1, the tonal center and point of rest.',
  legend_characteristic: 'Characteristic',
  legend_characteristic_description: 'The degree that gives this mode its distinctive color.',
  legend_chord_tone: 'Chord tone',
  legend_chord_tone_description: 'A stable note of the tonic triad, usually degree 1, 3, or 5.',
  legend_color_tone: 'Color tone',
  legend_color_tone_description: 'A remaining scale note that adds flavor without defining the mode.',
  instrument_color_help: "Colors show each note's primary musical role. Tonic and characteristic take precedence when roles overlap.",
  root: 'Root',
  mode: 'Mode',
   play_scale: 'Play scale',
   play_chord: 'Play chord',
   stop: 'Stop',
  audio_locked: 'Audio starts after your first action.',
  audio_playing: 'Audio playing.',
  audio_unavailable: 'Audio unavailable.',
  audio_stopped: 'Audio stopped.',
   generated_scale: 'Select Scale',
  degree_formula: 'Degree formula',
  interval_structure: 'Interval structure',
  formula_information: 'Scale formula information',
  interval_label: 'semitones',
  select_note: 'Select a scale note for interval and role detail.',
  piano: 'Piano · C3 to C5',
   guitar: 'Guitar · frets 0 to 12',
     bass: 'Bass · frets 0 to 12',
     ukulele: 'Ukulele · frets 0 to 12',
  generation: 'Generation',
  degree: 'degree',
  role: 'role'
  ,roles: { tonic: 'tonic', characteristic: 'characteristic', chord_tone: 'chord tone', color_tone: 'color tone' }
  ,instrument_visibility: 'Instrument visibility'
  ,show_piano: 'Show piano'
   ,show_guitar: 'Show guitar'
   ,show_bass: 'Show bass'
   ,show_ukulele: 'Show ukulele'
   ,scale_description_visibility: 'Scale information'
   ,show_scale_description: 'Show scale history and uses'
  ,instrument_region: 'Synchronized instruments'
   ,guitar_table: 'Interactive six-string guitar fretboard'
    ,bass_table: 'Interactive four-string bass fretboard'
    ,ukulele_table: 'Interactive four-string ukulele fretboard'
     ,guitar_tuning: 'Guitar tuning'
      ,bass_tuning: 'Bass tuning'
      ,ukulele_tuning: 'Ukulele tuning'
     ,tuner: 'Tuner'
   ,guitar_tuning_semitones: 'semitones from standard tuning'
   ,lower_tuning: 'Lower tuning'
   ,raise_tuning: 'Raise tuning'
  ,string_label: 'String'
  ,fret_label: 'Fret'
   ,audio_controls: 'Audio controls'
   ,metronome: 'Metronome'
   ,metronome_bpm: 'Tempo (BPM)'
   ,start_metronome: 'Start metronome'
   ,stop_metronome: 'Stop metronome'
   ,decrease_bpm: 'Decrease BPM'
   ,increase_bpm: 'Increase BPM'
   ,metronome_settings_hint: 'Configure BPM in Settings.'
  ,volume: 'Volume'
  ,tempo: 'Scale tempo'
  ,tempo_120: '120 BPM'
  ,tempo_150: '150 BPM'
  ,tempo_200: '200 BPM'
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
  ,  context: 'Harmonic context'
  ,context_off: 'No context'
  ,context_drone: 'Tonic drone'
  ,context_pedal: 'Tonic + fifth pedal'
  ,note_naming_label: 'Note naming'
  ,note_naming_letter: 'Classical (C D E)'
   ,note_naming_solfege: 'Solfège (Do Re Mi)'
    ,scale_history: 'Brief history'
    ,scale_usage: 'Common uses'
   ,feedback: 'Send feedback'
   ,feedback_title: 'Send feedback'
   ,feedback_intro: 'Tell us what works well or what could be improved.'
   ,feedback_name: 'Name'
   ,feedback_email: 'Email (optional)'
   ,feedback_message: 'Comment'
   ,send_feedback: 'Send comment'
   ,feedback_sending: 'Sending...'
   ,feedback_sent: 'Thank you. Your comment was sent.'
   ,feedback_error: 'The comment could not be sent. Please try again.'
    ,feedback_not_configured: 'Feedback is not configured yet.'
    ,harmony_title: 'Progression harmony'
    ,harmony_intro: 'Inspect each chord in a curated progression against the scale selected in Explore. The left map marks the triad; the right map shows every note of the selected scale.'
     ,harmony_progression: 'Progression'
     ,harmony_chord: 'Chord'
     ,harmony_selection_mode: 'View'
    ,harmony_no_progressions: 'No first-slice progressions are compatible with this scale.'
    ,harmony_degree: 'degree'
    ,harmony_chord_map: 'Chord tones'
    ,harmony_scale_map: 'Selected scale'
    ,harmony_fret_window: '4-fret chord window'
    ,harmony_full_fretboard: '12-fret scale map'
     ,harmony_piano_map: 'Piano map, C3 to C5'
     ,harmony_color_legend: 'Color guide'
    ,harmony_roles: { chord_tonic: 'chord tonic', chord_tone: 'chord tone', nonchord: 'nonchord tone' }
    ,account: 'Account'
    ,account_title: 'Your profile'
    ,account_username: 'Username'
    ,account_password: 'Password'
    ,account_sign_in: 'Sign in'
    ,account_create: 'Create account'
    ,account_sign_out: 'Sign out'
    ,account_signed_in_as: 'Signed in as {username}.'
    ,account_error_invalid_credentials: 'Wrong username or password.'
    ,account_error_username_taken: 'That username is already taken.'
    ,account_error_invalid_username: 'Use 3–32 letters, numbers, dots, dashes or underscores.'
    ,account_error_invalid_password: 'The password must have 8–128 characters.'
    ,account_error_too_many_attempts: 'Too many attempts. Try again in 15 minutes.'
    ,account_error_unavailable: 'The account service is unavailable. Try again later.'
  }

const SPANISH: UiTranslations = {
  settings: 'Ajustes',
  help: 'Ayuda',
  settings_title: 'Configuración',
  language: 'Idioma',
  english: 'Inglés',
  spanish: 'Español',
  note: 'Nota',
  close: 'Cerrar',
  save: 'Guardar',
  app_label: 'ScaleScape MVP',
  footer_credit: 'Desarrollado por ThunderaGames en 2026',
  nav_explore: 'Explorar',
  nav_ear_gym: 'Gimnasio auditivo',
  nav_harmony: 'Armonía',
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
   scale_controls: 'Escoja una nota y un modo',
  scale_note_help: 'Las notas gris claro son notas del acorde: notas estables de la tríada de la tónica. Las notas grises son notas de color. El naranja marca la tónica y el verde azulado marca el grado característico.',
  color_legend: 'Clave de colores',
  legend_color: 'Color',
  legend_meaning: 'Significado',
  legend_tonic: 'Tónica',
  legend_tonic_description: 'Grado 1, el centro tonal y punto de reposo.',
  legend_characteristic: 'Característica',
  legend_characteristic_description: 'El grado que da a este modo su color distintivo.',
  legend_chord_tone: 'Nota del acorde',
  legend_chord_tone_description: 'Nota estable de la tríada de la tónica, normalmente el grado 1, 3 o 5.',
  legend_color_tone: 'Nota de color',
  legend_color_tone_description: 'Nota restante de la escala que aporta matiz sin definir el modo.',
  instrument_color_help: 'Los colores muestran el rol musical principal de cada nota. La tónica y la nota característica tienen prioridad cuando los roles se superponen.',
  root: 'Tónica',
  mode: 'Modo',
   play_scale: 'Reproducir escala',
   play_chord: 'Reproducir acorde',
   stop: 'Detener',
  audio_locked: 'El audio comienza después de tu primera acción.',
  audio_playing: 'Audio reproduciéndose.',
  audio_unavailable: 'Audio no disponible.',
  audio_stopped: 'Audio detenido.',
   generated_scale: 'Selecciona la escala',
  degree_formula: 'Fórmula de grados',
  interval_structure: 'Estructura de intervalos',
  formula_information: 'Información de la fórmula de la escala',
  interval_label: 'semitonos',
  select_note: 'Selecciona una nota para ver el detalle del intervalo y su rol.',
  piano: 'Piano · Do3 a Do5',
   guitar: 'Guitarra · trastes 0 a 12',
     bass: 'Bajo · trastes 0 a 12',
     ukulele: 'Ukelele · trastes 0 a 12',
  generation: 'Generación',
  degree: 'grado',
  role: 'rol'
  ,roles: { tonic: 'tónica', characteristic: 'característica', chord_tone: 'nota del acorde', color_tone: 'nota de color' }
  ,instrument_visibility: 'Visibilidad de instrumentos'
  ,show_piano: 'Mostrar piano'
   ,show_guitar: 'Mostrar guitarra'
   ,show_bass: 'Mostrar bajo'
   ,show_ukulele: 'Mostrar ukelele'
   ,scale_description_visibility: 'Información de la escala'
   ,show_scale_description: 'Mostrar historia y usos de la escala'
  ,instrument_region: 'Instrumentos sincronizados'
   ,guitar_table: 'Diapasón interactivo de seis cuerdas'
   ,bass_table: 'Diapasón interactivo de cuatro cuerdas para bajo'
    ,ukulele_table: 'Diapasón interactivo de cuatro cuerdas para ukelele'
     ,guitar_tuning: 'Afinación de guitarra'
      ,bass_tuning: 'Afinación de bajo'
      ,ukulele_tuning: 'Afinación de ukelele'
     ,tuner: 'Afinador'
   ,guitar_tuning_semitones: 'semitonos desde la afinación estándar'
   ,lower_tuning: 'Bajar afinación'
   ,raise_tuning: 'Subir afinación'
  ,string_label: 'Cuerda'
  ,fret_label: 'Traste'
   ,audio_controls: 'Controles de audio'
   ,metronome: 'Metrónomo'
   ,metronome_bpm: 'Tempo (BPM)'
   ,start_metronome: 'Iniciar metrónomo'
   ,stop_metronome: 'Detener metrónomo'
   ,decrease_bpm: 'Disminuir BPM'
   ,increase_bpm: 'Aumentar BPM'
   ,metronome_settings_hint: 'Configura los BPM en Ajustes.'
  ,volume: 'Volumen'
  ,tempo: 'Velocidad de la escala'
  ,tempo_120: '120 BPM'
  ,tempo_150: '150 BPM'
  ,tempo_200: '200 BPM'
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
  ,  context: 'Contexto armónico'
  ,context_off: 'Sin contexto'
  ,context_drone: 'Drone de tónica'
   ,context_pedal: 'Pedal de tónica y quinta'
  ,note_naming_label: 'Nombre de notas'
  ,note_naming_letter: 'Clásico (Do Re Mi)'
   ,note_naming_solfege: 'Solfeo (Do Re Mi)'
    ,scale_history: 'Historia breve'
    ,scale_usage: 'Usos habituales'
   ,feedback: 'Enviar comentarios'
   ,feedback_title: 'Enviar comentarios'
   ,feedback_intro: 'Cuéntanos qué funciona bien o qué podríamos mejorar.'
   ,feedback_name: 'Nombre'
   ,feedback_email: 'Correo electrónico (opcional)'
   ,feedback_message: 'Comentario'
   ,send_feedback: 'Enviar comentario'
   ,feedback_sending: 'Enviando...'
   ,feedback_sent: 'Gracias. Tu comentario fue enviado.'
   ,feedback_error: 'No se pudo enviar el comentario. Inténtalo de nuevo.'
    ,feedback_not_configured: 'Los comentarios todavía no están configurados.'
    ,harmony_title: 'Armonía de progresiones'
    ,harmony_intro: 'Inspecciona cada acorde de una progresión seleccionada contra la escala elegida en Explorar. El mapa izquierdo marca la tríada; el derecho muestra todas las notas de la escala.'
     ,harmony_progression: 'Progresión'
     ,harmony_chord: 'Acorde'
     ,harmony_selection_mode: 'Vista'
    ,harmony_no_progressions: 'No hay progresiones de la primera etapa compatibles con esta escala.'
    ,harmony_degree: 'grado'
    ,harmony_chord_map: 'Notas del acorde'
    ,harmony_scale_map: 'Escala seleccionada'
    ,harmony_fret_window: 'Ventana de acorde de 4 trastes'
    ,harmony_full_fretboard: 'Mapa de escala de 12 trastes'
     ,harmony_piano_map: 'Mapa de piano, Do3 a Do5'
     ,harmony_color_legend: 'Clave de colores'
    ,harmony_roles: { chord_tonic: 'tónica del acorde', chord_tone: 'nota del acorde', nonchord: 'nota no perteneciente al acorde' }
    ,account: 'Cuenta'
    ,account_title: 'Tu perfil'
    ,account_username: 'Usuario'
    ,account_password: 'Contraseña'
    ,account_sign_in: 'Entrar'
    ,account_create: 'Crear cuenta'
    ,account_sign_out: 'Cerrar sesión'
    ,account_signed_in_as: 'Sesión iniciada como {username}.'
    ,account_error_invalid_credentials: 'Usuario o contraseña incorrectos.'
    ,account_error_username_taken: 'Ese usuario ya existe.'
    ,account_error_invalid_username: 'Usa de 3 a 32 letras, números, puntos, guiones o guiones bajos.'
    ,account_error_invalid_password: 'La contraseña debe tener entre 8 y 128 caracteres.'
    ,account_error_too_many_attempts: 'Demasiados intentos. Vuelve a intentarlo en 15 minutos.'
    ,account_error_unavailable: 'El servicio de cuentas no está disponible. Inténtalo más tarde.'
  }

export type CatalogTranslationKey = 'formula_names' | 'scale_categories' | 'comparison_names' | 'progression_genres' | 'progression_names'
export type CatalogTranslations = Pick<TranslationDictionary, CatalogTranslationKey>
type UiTranslations = Omit<TranslationDictionary, CatalogTranslationKey>

const EMPTY_CATALOG_TRANSLATIONS: CatalogTranslations = { formula_names: {}, scale_categories: {}, comparison_names: {}, progression_genres: {}, progression_names: {} }

let dictionaries: Readonly<Record<Language, TranslationDictionary>> = {
  en: { ...ENGLISH, ...EMPTY_CATALOG_TRANSLATIONS },
  es: { ...SPANISH, ...EMPTY_CATALOG_TRANSLATIONS }
}

export function installCatalogTranslations(catalog_translations: Readonly<Record<Language, CatalogTranslations>>): void {
  dictionaries = {
    en: { ...ENGLISH, ...catalog_translations.en },
    es: { ...SPANISH, ...catalog_translations.es }
  }
}

export function getTranslations(language: Language): TranslationDictionary {
  return dictionaries[language === 'es' ? 'es' : 'en']
}
