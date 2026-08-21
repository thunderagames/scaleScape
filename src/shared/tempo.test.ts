import { describe, expect, it } from 'vitest'
import type { TempoBpm } from './tempo'

describe('tempo values', () => {
  it('given_supported_tempo_values_when_declared_then_exposes_three_choices', () => {
    const supported_tempos: readonly TempoBpm[] = [120, 150, 200]

    expect(supported_tempos).toEqual([120, 150, 200])
  })
})
