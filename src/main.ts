import { createExploreApplication } from './application/explore-application'
import { renderExploreScreen } from './ui/explore-screen'
import './styles.css'

const app = document.querySelector<HTMLElement>('#app')
if (!app) {
  throw new Error('Application root was not found')
}

renderExploreScreen(app, createExploreApplication())
