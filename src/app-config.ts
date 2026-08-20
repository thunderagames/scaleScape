import raw_settings from '../settings.json'

export type AppScreen = 'guided_start' | 'explore' | 'ear_gym'

export interface AppModuleFlags {
  readonly explore: boolean
  readonly ear_gym: boolean
  readonly guided_start: boolean
}

export interface AppConfig {
  readonly default_screen: AppScreen
  readonly modules: AppModuleFlags
}

const FALLBACK_CONFIG: AppConfig = {
  default_screen: 'explore',
  modules: { explore: true, ear_gym: false, guided_start: false }
}

function is_screen(value: unknown): value is AppScreen {
  return value === 'explore' || value === 'ear_gym' || value === 'guided_start'
}

function is_boolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function normalize_config(value: unknown): AppConfig {
  if (!value || typeof value !== 'object') return FALLBACK_CONFIG
  const candidate = value as { readonly default_screen?: unknown; readonly modules?: unknown }
  if (!candidate.modules || typeof candidate.modules !== 'object') return FALLBACK_CONFIG
  const modules = candidate.modules as Partial<AppModuleFlags>
  if (!is_boolean(modules.explore) || !is_boolean(modules.ear_gym) || !is_boolean(modules.guided_start)) return FALLBACK_CONFIG
  const default_screen = is_screen(candidate.default_screen) ? candidate.default_screen : FALLBACK_CONFIG.default_screen
  return { default_screen, modules: { explore: modules.explore, ear_gym: modules.ear_gym, guided_start: modules.guided_start } }
}

export const APP_CONFIG = normalize_config(raw_settings)
