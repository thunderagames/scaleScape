import { describe, expect, it } from 'vitest'
import { APP_CONFIG } from './app-config'

describe('application config', () => {
  it('given_settings_json_when_loading_config_then_enables_harmony_for_manual_testing', () => {
    expect(APP_CONFIG.default_screen).toBe('explore')
    expect(APP_CONFIG.modules).toEqual({ explore: true, ear_gym: false, guided_start: false, diagnostics: false, harmony: true })
  })
})
