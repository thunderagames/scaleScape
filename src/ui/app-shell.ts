import type { ExploreApplication } from '../application/explore-application'
import type { PlaybackPort } from '../audio/playback-port'
import type { SettingsStore } from '../settings/settings-store'
import { renderExploreScreen } from './explore-screen'
import { renderEarGymScreen } from './ear-gym-screen'

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
      <section id="ear-gym-screen" class="screen-placeholder" hidden></section>
    </div>
  `

  const explore_screen = container.querySelector<HTMLElement>('#explore-screen')
  const ear_gym_screen = container.querySelector<HTMLElement>('#ear-gym-screen')
  const navigate_explore = container.querySelector<HTMLButtonElement>('#navigate-explore')
  const navigate_ear_gym = container.querySelector<HTMLButtonElement>('#navigate-ear-gym')
  const shell_label = container.querySelector<HTMLElement>('#shell-label')
  if (!explore_screen || !ear_gym_screen || !navigate_explore || !navigate_ear_gym || !shell_label) throw new Error('Application shell elements were not found')
  const ui = { explore_screen, ear_gym_screen, navigate_explore, navigate_ear_gym, shell_label }

  let current_screen: AppScreen = 'explore'

  function apply_translations(): void {
    const translation = settings.getTranslations()
    ui.shell_label.textContent = translation.app_label
    ui.navigate_explore.textContent = translation.nav_explore
    ui.navigate_ear_gym.textContent = translation.nav_ear_gym
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
  renderEarGymScreen(ui.ear_gym_screen, playback, settings)
}
