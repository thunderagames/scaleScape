import { SCALE_CATEGORY_ORDER, SCALE_FORMULAS, type FormulaId } from '../theory/scale-formulas'
import type { ExploreApplication } from '../application/explore-application'
import type { PlaybackPort } from '../audio/playback-port'
import type { SettingsStore } from '../settings/settings-store'
import type { EventLoggerPort } from '../observability/event-logger'
import { displayNoteName } from '../settings/note-naming'

const ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
export const EXPLORE_HELP_CLOSE_EVENT = 'scalescape:close-explore-help'

export interface ScaleContextControlOptions {
  readonly close_help_event?: string
  readonly id_prefix?: string
}

export function renderScaleContextControl(container: HTMLElement, application: ExploreApplication, playback: PlaybackPort, settings: SettingsStore, diagnostics: EventLoggerPort, options: ScaleContextControlOptions = {}): void {
  const prefix = options.id_prefix ?? ''
  const id = (value: string): string => `${prefix}${value}`
  container.innerHTML = `
    <button id="${id('scale-selector')}" class="control-button scale-context-trigger" type="button" aria-haspopup="dialog"></button>
    <dialog id="${id('scale-selector-modal')}" class="scale-selector-modal" aria-labelledby="${id('scale-selector-title')}"><form class="modal-form scale-selector-form"><div class="modal-heading scale-selector-heading"><h2 id="${id('scale-selector-title')}"></h2><button id="${id('close-scale-selector')}" class="control-button control-button--icon modal-close scale-selector-close" type="button" aria-label=""><svg class="modal-close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="scale-selector-fields"><label class="modal-field scale-selector-field" for="${id('root-select')}"><span id="${id('root-label')}"></span><select id="${id('root-select')}" class="control-select"></select></label><label class="modal-field scale-selector-field" for="${id('formula-select')}"><span id="${id('mode-label')}"></span><select id="${id('formula-select')}" class="control-select"></select></label></div><div class="modal-actions scale-selector-actions"><button id="${id('cancel-scale-selector')}" class="control-button" type="button"></button><button id="${id('apply-scale-selector')}" class="control-button control-button--primary" type="button"></button></div></form></dialog>
  `

  const root_select = container.querySelector<HTMLSelectElement>(`#${id('root-select')}`)
  const formula_select = container.querySelector<HTMLSelectElement>(`#${id('formula-select')}`)
  const scale_selector = container.querySelector<HTMLButtonElement>(`#${id('scale-selector')}`)
  const scale_selector_modal = container.querySelector<HTMLDialogElement>(`#${id('scale-selector-modal')}`)
  const close_scale_selector = container.querySelector<HTMLButtonElement>(`#${id('close-scale-selector')}`)
  const cancel_scale_selector = container.querySelector<HTMLButtonElement>(`#${id('cancel-scale-selector')}`)
  const apply_scale_selector = container.querySelector<HTMLButtonElement>(`#${id('apply-scale-selector')}`)
  if (!root_select || !formula_select || !scale_selector || !scale_selector_modal || !close_scale_selector || !cancel_scale_selector || !apply_scale_selector) throw new Error('Scale context control elements were not found')
  const ui = { root_select, formula_select, scale_selector, scale_selector_modal, close_scale_selector, cancel_scale_selector, apply_scale_selector }

  function apply_translations(): void {
    const translation = settings.getTranslations()
    const naming = settings.getSettings().note_naming
    document.documentElement.lang = settings.getSettings().language
    container.querySelector<HTMLElement>(`#${id('scale-selector-title')}`)!.textContent = translation.scale_controls
    container.querySelector<HTMLElement>(`#${id('root-label')}`)!.textContent = translation.root
    container.querySelector<HTMLElement>(`#${id('mode-label')}`)!.textContent = translation.mode
    ui.cancel_scale_selector.textContent = translation.close
    ui.apply_scale_selector.textContent = translation.save
    ui.close_scale_selector.setAttribute('aria-label', translation.close)
    ui.close_scale_selector.title = translation.close
    ui.root_select.replaceChildren()
    ROOTS.forEach((root, root_pitch_class) => {
      const option = document.createElement('option')
      option.value = String(root_pitch_class)
      option.textContent = displayNoteName(root, naming)
      ui.root_select.append(option)
    })
    if (ui.formula_select.options.length === 0) {
      SCALE_CATEGORY_ORDER.forEach((category) => {
        const group = document.createElement('optgroup')
        group.dataset.category = category
        SCALE_FORMULAS.filter((formula) => formula.category === category).forEach((formula) => {
          const option = document.createElement('option')
          option.value = formula.id
          group.append(option)
        })
        ui.formula_select.append(group)
      })
    }
    Array.from(ui.formula_select.options).forEach((option) => {
      const formula = SCALE_FORMULAS.find((candidate) => candidate.id === option.value)
      if (formula) option.textContent = translation.formula_names[formula.id] ?? formula.name
    })
    Array.from(ui.formula_select.querySelectorAll('optgroup')).forEach((group) => {
      const category = group.dataset.category as typeof SCALE_CATEGORY_ORDER[number] | undefined
      if (category) group.label = translation.scale_categories[category]
    })
    const state = application.getState()
    ui.scale_selector.textContent = `${displayNoteName(state.scale_instance.root_spelling.text, naming)} ${translation.formula_names[state.formula_id] ?? state.scale_instance.formula.name}`
    ui.scale_selector.setAttribute('aria-label', translation.scale_controls)
    ui.root_select.value = String(state.root_pitch_class)
    ui.formula_select.value = state.formula_id
  }

  const close_dialog = () => {
    if (typeof ui.scale_selector_modal.close === 'function') ui.scale_selector_modal.close()
    else ui.scale_selector_modal.removeAttribute('open')
    ui.scale_selector.focus()
  }
  ui.scale_selector.addEventListener('click', () => {
    if (options.close_help_event) document.dispatchEvent(new Event(options.close_help_event))
    if (typeof ui.scale_selector_modal.showModal === 'function') ui.scale_selector_modal.showModal()
    else ui.scale_selector_modal.setAttribute('open', '')
  })
  ui.close_scale_selector.addEventListener('click', close_dialog)
  ui.cancel_scale_selector.addEventListener('click', close_dialog)
  ui.apply_scale_selector.addEventListener('click', () => {
    const root_pitch_class = Number(ui.root_select.value)
    const formula_id = ui.formula_select.value as FormulaId
    void playback.stopMelodicPlayback()
    try {
      const state = application.changeScale(root_pitch_class, formula_id)
      settings.setSettings({ ...settings.getSettings(), last_root: root_pitch_class, last_formula: formula_id })
      try { diagnostics.log('application.scale_change_completed', { formula_id, root_pitch_class, generation_id: state.generation_id }) } catch { /* Diagnostics must not block scale changes. */ }
    } catch {
      try { diagnostics.log('application.scale_change_failed', { formula_id, root_pitch_class, generation_id: application.getState().generation_id }) } catch { /* Diagnostics must not block scale changes. */ }
    }
    close_dialog()
  })
  settings.subscribe(apply_translations)
  application.subscribe(apply_translations)
  apply_translations()
}
