import { createExploreApplication } from './application/explore-application'
import { createBrowserPlayback } from './audio/browser-playback'
import { createSettingsStore } from './settings/settings-store'
import { createDiagnosticsLogger } from './observability/event-logger'
import { renderAppShell } from './ui/app-shell'
import { APP_CONFIG } from './app-config'
import { installUmamiTracker } from './integrations/umami'
import { loadContentCatalog } from './integrations/content-catalog-source'
import { installContentCatalog, parseContentCatalog } from './application/content-catalog'
import { createAuthClient } from './integrations/auth-client'
import { mountAccountPanel } from './ui/account-panel'
import './styles.css'

const app = document.querySelector<HTMLElement>('#app')
if (!app) {
  throw new Error('Application root was not found')
}

async function bootstrap(root: HTMLElement): Promise<void> {
  root.setAttribute('aria-busy', 'true')
  root.textContent = 'Loading ScaleScape…'
  const loaded = await loadContentCatalog(parseContentCatalog)
  root.removeAttribute('aria-busy')
  if (!loaded) {
    root.textContent = 'ScaleScape could not load its scale catalog. Please check your connection and reload the page.'
    return
  }
  installContentCatalog(loaded.catalog)
  root.textContent = ''

  const diagnostics = createDiagnosticsLogger()
  const settings = createSettingsStore('en', diagnostics)
  installUmamiTracker()
  renderAppShell(root, createExploreApplication(settings.getSettings().last_root, settings.getSettings().last_formula), createBrowserPlayback(diagnostics), settings, diagnostics, APP_CONFIG)
  void mountAccountPanel(root, createAuthClient(), settings)
}

void bootstrap(app)
