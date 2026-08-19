import { create_web_audio_preview } from './audio/note-preview'
import { create_fretboard_model } from './domain/guitar-fretboard'
import { render_fretboard } from './ui/fretboard-view'
import './styles.css'

const app = document.querySelector<HTMLElement>('#app')
if (!app) {
  throw new Error('Application root was not found')
}

const root_pitch_class = 4
const scale_pitch_classes = [4, 6, 7, 9, 11, 1, 2]
const fretboard_model = create_fretboard_model({ root_pitch_class, scale_pitch_classes })
const preview_port = create_web_audio_preview()

app.innerHTML = `
  <main class="poc-shell">
    <header class="poc-header">
      <p class="eyebrow">ScaleScape Phase-0 POC 1</p>
      <h1>Responsive guitar fretboard</h1>
      <p class="intro">Tap a position to preview it. Drag horizontally to explore frets without triggering a note.</p>
    </header>
    <section class="learning-card" aria-labelledby="learning-title">
      <div>
        <p class="eyebrow">Current exploration</p>
        <h2 id="learning-title">E Dorian</h2>
        <p>Scale notes are labeled. The root has a gold marker. Theory detail appears after you select a position.</p>
      </div>
      <p class="audio-status" id="audio-status" role="status">Audio starts after your first tap.</p>
    </section>
    <section class="fretboard-section" aria-labelledby="fretboard-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Instrument interaction</p>
          <h2 id="fretboard-title">Standard tuning · 0 to 12 frets</h2>
        </div>
        <span class="scroll-hint">Scroll inside the fretboard</span>
      </div>
      <div id="fretboard"></div>
      <div class="note-detail" id="note-detail" aria-live="polite">Select a fret to hear it.</div>
    </section>
  </main>
`

const audio_status = document.querySelector<HTMLElement>('#audio-status')
const note_detail = document.querySelector<HTMLElement>('#note-detail')
const fretboard_container = document.querySelector<HTMLElement>('#fretboard')

if (!audio_status || !note_detail || !fretboard_container) {
  throw new Error('POC interface elements were not found')
}

render_fretboard(fretboard_container, fretboard_model, preview_port, {
  on_selected_note(note) {
    note_detail.textContent = `${note.note_name}${note.octave} · string ${note.string_index + 1} · ${note.is_open ? 'open string' : `fret ${note.fret}`}${note.is_scale_note ? ' · in scale' : ' · outside scale'}`
    audio_status.textContent = 'Preview requested. Move or tap another position to compare.'
  }
})
