import { createExploreApplication } from './application/explore-application'
import { createBrowserPlayback } from './audio/browser-playback'
import { createSettingsStore } from './settings/settings-store'
import { createDiagnosticsLogger } from './observability/event-logger'
import { renderAppShell } from './ui/app-shell'
import { APP_CONFIG } from './app-config'
import { installUmamiTracker } from './integrations/umami'
import './styles.css'

const app = document.querySelector<HTMLElement>('#app')
if (!app) {
  throw new Error('Application root was not found')
}

const diagnostics = createDiagnosticsLogger()
const settings = createSettingsStore('en', diagnostics)
installUmamiTracker()
renderAppShell(app, createExploreApplication(settings.getSettings().last_root, settings.getSettings().last_formula), createBrowserPlayback(diagnostics), settings, diagnostics, APP_CONFIG)
