import { createExploreApplication } from './application/explore-application'
import { createBrowserPlayback } from './audio/browser-playback'
import { createSettingsStore } from './settings/settings-store'
import { renderExploreScreen } from './ui/explore-screen'
import './styles.css'

const app = document.querySelector<HTMLElement>('#app')
if (!app) {
  throw new Error('Application root was not found')
}

renderExploreScreen(app, createExploreApplication(), createBrowserPlayback(), createSettingsStore())
