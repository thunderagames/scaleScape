import { describe, expect, it } from 'vitest'
import { create_press_guard } from './fretboard-interaction'

describe('create_press_guard', () => {
  it('given_stationary_pointer_when_pointer_up_then_activates_the_note', () => {
    let activation_count = 0
    const press_guard = create_press_guard(() => {
      activation_count += 1
    })

    press_guard.pointerDown(1, 100, 100)
    const activated = press_guard.pointerUp(1)

    expect(activated).toBe(true)
    expect(activation_count).toBe(1)
    expect(press_guard.getState()).toBe('idle')
  })

  it('given_horizontal_movement_over_threshold_when_pointer_up_then_does_not_activate_the_note', () => {
    let activation_count = 0
    const press_guard = create_press_guard(() => {
      activation_count += 1
    })

    press_guard.pointerDown(1, 100, 100)
    press_guard.pointerMove(1, 120, 100)
    const activated = press_guard.pointerUp(1)

    expect(activated).toBe(false)
    expect(activation_count).toBe(0)
    expect(press_guard.getState()).toBe('idle')
  })

  it('given_different_pointer_when_pointer_up_then_preserves_the_active_press', () => {
    let activation_count = 0
    const press_guard = create_press_guard(() => {
      activation_count += 1
    })

    press_guard.pointerDown(1, 100, 100)
    const activated = press_guard.pointerUp(2)

    expect(activated).toBe(false)
    expect(activation_count).toBe(0)
    expect(press_guard.getState()).toBe('pressing')
  })

  it('given_cancelled_pointer_when_pointer_cancel_then_returns_to_idle_without_activation', () => {
    let activation_count = 0
    const press_guard = create_press_guard(() => {
      activation_count += 1
    })

    press_guard.pointerDown(1, 100, 100)
    press_guard.pointerCancel(1)

    expect(activation_count).toBe(0)
    expect(press_guard.getState()).toBe('idle')
  })
})
