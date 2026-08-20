import type { ExploreApplication } from '../application/explore-application'
import type { PlaybackPort } from '../audio/playback-port'
import type { SettingsStore } from '../settings/settings-store'
import { renderExploreScreen } from './explore-screen'

export type AppScreen = 'explore' | 'ear_gym'

export function renderAppShell(container: HTMLElement, application: ExploreApplication, playback: PlaybackPort, settings: SettingsStore): void {
  container.innerHTML = `
    <div class="app-shell">
      <header class="app-shell-header">
        <p id="shell-label" class="eyebrow"></p>
        <nav id="app-navigation" class="app-navigation" aria-label="Application navigation">
          <button id="navigate-explore" type="button" aria-controls="explore-screen" aria-current="page"></button>
          <button id="navigate-ear-gym" type="button" aria-controls="ear-gym-screen"></button>
        </nav>
      </header>
      <div id="explore-screen"></div>
      <section id="ear-gym-screen" class="screen-placeholder" hidden aria-labelledby="ear-gym-title">
        <p class="eyebrow" id="ear-gym-label"></p>
        <h1 id="ear-gym-title"></h1>
        <p id="ear-gym-intro"></p>
        <p id="ear-gym-placeholder" class="placeholder-message"></p>
      </section>
    </div>
  `

  const explore_screen = container.querySelector<HTMLElement>('#explore-screen')
  const ear_gym_screen = container.querySelector<HTMLElement>('#ear-gym-screen')
  const navigate_explore = container.querySelector<HTMLButtonElement>('#navigate-explore')
  const navigate_ear_gym = container.querySelector<HTMLButtonElement>('#navigate-ear-gym')
  const shell_label = container.querySelector<HTMLElement>('#shell-label')
  const ear_gym_label = container.querySelector<HTMLElement>('#ear-gym-label')
  const ear_gym_title = container.querySelector<HTMLElement>('#ear-gym-title')
  const ear_gym_intro = container.querySelector<HTMLElement>('#ear-gym-intro')
  const ear_gym_placeholder = container.querySelector<HTMLElement>('#ear-gym-placeholder')
  if (!explore_screen || !ear_gym_screen || !navigate_explore || !navigate_ear_gym || !shell_label || !ear_gym_label || !ear_gym_title || !ear_gym_intro || !ear_gym_placeholder) throw new Error('Application shell elements were not found')
  const ui = { explore_screen, ear_gym_screen, navigate_explore, navigate_ear_gym, shell_label, ear_gym_label, ear_gym_title, ear_gym_intro, ear_gym_placeholder }

  let current_screen: AppScreen = 'explore'

  function apply_translations(): void {
    const translation = settings.getTranslations()
    ui.shell_label.textContent = translation.app_label
    ui.navigate_explore.textContent = translation.nav_explore
    ui.navigate_ear_gym.textContent = translation.nav_ear_gym
    ui.ear_gym_label.textContent = translation.nav_ear_gym
    ui.ear_gym_title.textContent = translation.ear_gym_title
    ui.ear_gym_intro.textContent = translation.ear_gym_intro
    ui.ear_gym_placeholder.textContent = translation.ear_gym_placeholder
    ui.navigate_explore.setAttribute('aria-label', translation.nav_explore)
    ui.navigate_ear_gym.setAttribute('aria-label', translation.nav_ear_gym)
  }

  function show_screen(screen: AppScreen): void {
    current_screen = screen
    const is_explore = current_screen === 'explore'
    ui.explore_screen.hidden = !is_explore
    ui.ear_gym_screen.hidden = is_explore
    ui.navigate_explore.setAttribute('aria-current', is_explore ? 'page' : 'false')
    ui.navigate_ear_gym.setAttribute('aria-current', is_explore ? 'false' : 'page')
    const active_button = is_explore ? ui.navigate_explore : ui.navigate_ear_gym
    active_button.focus()
  }

  ui.navigate_explore.addEventListener('click', () => show_screen('explore'))
  ui.navigate_ear_gym.addEventListener('click', () => show_screen('ear_gym'))
  settings.subscribe(apply_translations)
  apply_translations()
  renderExploreScreen(ui.explore_screen, application, playback, settings)
}
