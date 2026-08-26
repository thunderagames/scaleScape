import { describe, expect, it } from 'vitest'
import { APP_CONFIG } from './app-config'

describe('application config', () => {
  it('given_settings_json_when_loading_config_then_starts_in_explore_with_optional_modules_disabled', () => {
    expect(APP_CONFIG.default_screen).toBe('explore')
    expect(APP_CONFIG.modules).toEqual({ explore: true, ear_gym: false, guided_start: false, diagnostics: false })
  })
})
