import { create_audio_engine } from './audio/audio-engine'
import { transpose_pitch } from './theory/frequency'
import { create_scale_instance } from './theory/scale-instance'
import { SCALE_FORMULAS } from './theory/scale-formulas'
import './styles.css'

const app = document.querySelector<HTMLElement>('#app')
if (!app) {
  throw new Error('Application root was not found')
}

const scale_instance = create_scale_instance(4, 'dorian')
const audio_engine = create_audio_engine()
const scale_root_octave = 4

app.innerHTML = `
  <main class="poc-shell">
    <header>
      <p class="eyebrow">ScaleScape Phase-0 POC 0</p>
      <h1>Theory you can hear.</h1>
      <p class="intro">Generate a scale, inspect its interval roles, then hear it over a tonic drone.</p>
    </header>
    <section class="controls" aria-label="Audio controls">
      <button id="play-scale" type="button">Play E Dorian</button>
      <button id="replay-scale" type="button">Replay</button>
      <button id="stop-audio" type="button">Stop</button>
      <span id="audio-status" role="status">Audio is locked until your first action.</span>
    </section>
    <section class="theory-card" aria-labelledby="scale-title">
      <p class="eyebrow">Generated scale</p>
      <h2 id="scale-title">E Dorian</h2>
      <p id="scale-caption">Hear the notes first. Select a note to reveal its theory.</p>
      <div class="note-grid" id="note-grid"></div>
    </section>
    <section class="matrix-card" aria-labelledby="matrix-title">
      <p class="eyebrow">Formula coverage</p>
      <h2 id="matrix-title">${SCALE_FORMULAS.length} formulas × 12 roots</h2>
      <p>POC 0 tests the complete deterministic matrix before any instrument state is shared.</p>
    </section>
  </main>
`

const note_grid = document.querySelector<HTMLElement>('#note-grid')
const audio_status = document.querySelector<HTMLElement>('#audio-status')
const scale_caption = document.querySelector<HTMLElement>('#scale-caption')
const play_button = document.querySelector<HTMLButtonElement>('#play-scale')
const replay_button = document.querySelector<HTMLButtonElement>('#replay-scale')
const stop_button = document.querySelector<HTMLButtonElement>('#stop-audio')

if (!note_grid || !audio_status || !scale_caption || !play_button || !replay_button || !stop_button) {
  throw new Error('POC interface elements were not found')
}

scale_instance.notes.forEach((note) => {
  const button = document.createElement('button')
  const expected_pitch = transpose_pitch(scale_instance.root_pitch_class, scale_root_octave, note.interval.semitones)
  button.type = 'button'
  button.className = `scale-note ${note.primary_role}`
  button.textContent = note.spelling.text
  button.setAttribute('aria-label', `${note.spelling.text}${expected_pitch.octave}, degree ${note.degree}, ${note.interval.label}, ${note.primary_role}`)
  button.addEventListener('click', () => {
    scale_caption.textContent = `${note.spelling.text}${expected_pitch.octave} is degree ${note.degree}, ${note.interval.label}, ${note.primary_role}. ${expected_pitch.frequency.toFixed(2)} Hz.`
  })
  note_grid.append(button)
})

audio_engine.subscribe((snapshot) => {
  audio_status.textContent = snapshot.error ?? `${snapshot.lifecycle} · generation ${snapshot.generation_id}`
})

play_button.addEventListener('click', () => void audio_engine.play_scale(scale_instance))
replay_button.addEventListener('click', () => void audio_engine.replay())
stop_button.addEventListener('click', () => void audio_engine.stop_all())
