import { SCALE_FORMULAS, type FormulaId } from '../theory/scale-formulas'
import type { ExploreApplication } from '../application/explore-application'
import type { ScaleState } from '../app-state/scale-state'

const ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

export function renderExploreScreen(container: HTMLElement, application: ExploreApplication): void {
  container.innerHTML = `
    <main class="explore-shell">
      <header>
        <p class="eyebrow">ScaleScape MVP</p>
        <h1>Explore what a scale sounds like.</h1>
        <p class="intro">Choose a root and mode. One shared scale state will drive the future instruments and audio context.</p>
      </header>
      <section class="explore-controls" aria-label="Scale controls">
        <label>Root <select id="root-select"></select></label>
        <label>Mode <select id="formula-select"></select></label>
        <span id="generation-status" role="status"></span>
      </section>
      <section class="scale-card" aria-labelledby="scale-title">
        <p class="eyebrow">Generated scale</p>
        <h2 id="scale-title"></h2>
        <div id="scale-notes" class="scale-notes"></div>
      </section>
    </main>
  `

  const root_select = container.querySelector<HTMLSelectElement>('#root-select')
  const formula_select = container.querySelector<HTMLSelectElement>('#formula-select')
  const scale_title = container.querySelector<HTMLElement>('#scale-title')
  const scale_notes = container.querySelector<HTMLElement>('#scale-notes')
  const generation_status = container.querySelector<HTMLElement>('#generation-status')
  if (!root_select || !formula_select || !scale_title || !scale_notes || !generation_status) {
    throw new Error('Explore screen elements were not found')
  }

  const ui = { root_select, formula_select, scale_title, scale_notes, generation_status }

  ROOTS.forEach((root, root_pitch_class) => {
    const option = document.createElement('option')
    option.value = String(root_pitch_class)
    option.textContent = root
    root_select.append(option)
  })
  SCALE_FORMULAS.forEach((formula) => {
    const option = document.createElement('option')
    option.value = formula.id
    option.textContent = formula.name
    formula_select.append(option)
  })

  function render(state: ScaleState): void {
    ui.root_select.value = String(state.root_pitch_class)
    ui.formula_select.value = state.formula_id
    ui.scale_title.textContent = `${state.scale_instance.root_spelling.text} ${state.scale_instance.formula.name}`
    ui.generation_status.textContent = `Generation ${state.generation_id}`
    ui.scale_notes.replaceChildren(...state.scale_instance.notes.map((note) => {
      const note_element = document.createElement('span')
      note_element.className = `scale-note ${note.primary_role}`
      note_element.textContent = `${note.spelling.text} · ${note.degree}`
      return note_element
    }))
  }

  ui.root_select.addEventListener('change', () => application.changeScale(Number(ui.root_select.value), ui.formula_select.value as FormulaId))
  ui.formula_select.addEventListener('change', () => application.changeScale(Number(ui.root_select.value), ui.formula_select.value as FormulaId))
  application.subscribe(render)
  render(application.getState())
}
