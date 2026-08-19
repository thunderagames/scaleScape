export type PressGuardState = 'idle' | 'pressing' | 'scrolling'

export interface PressGuard {
  pointerDown(pointer_id: number, client_x: number, client_y: number): void
  pointerMove(pointer_id: number, client_x: number, client_y: number): void
  pointerUp(pointer_id: number): boolean
  pointerCancel(pointer_id: number): void
  getState(): PressGuardState
}

export function create_press_guard(on_press: () => void, movement_threshold = 8): PressGuard {
  let state: PressGuardState = 'idle'
  let active_pointer_id: number | null = null
  let start_x = 0
  let start_y = 0

  return {
    pointerDown(pointer_id, client_x, client_y) {
      active_pointer_id = pointer_id
      start_x = client_x
      start_y = client_y
      state = 'pressing'
    },
    pointerMove(pointer_id, client_x, client_y) {
      if (active_pointer_id !== pointer_id || state !== 'pressing') {
        return
      }

      const distance = Math.hypot(client_x - start_x, client_y - start_y)
      if (distance > movement_threshold) {
        state = 'scrolling'
      }
    },
    pointerUp(pointer_id) {
      if (active_pointer_id !== pointer_id) {
        return false
      }

      const should_activate = state === 'pressing'
      active_pointer_id = null
      state = 'idle'

      if (should_activate) {
        on_press()
      }

      return should_activate
    },
    pointerCancel(pointer_id) {
      if (active_pointer_id !== pointer_id) {
        return
      }

      active_pointer_id = null
      state = 'idle'
    },
    getState() {
      return state
    }
  }
}
