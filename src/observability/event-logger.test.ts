import { describe, expect, it } from 'vitest'
import { createDiagnosticsLogger } from './event-logger'

describe('diagnostics logger', () => {
  it('given_sensitive_diagnostic_attributes_when_exporting_then_redacts_private_values', () => {
    const logger = createDiagnosticsLogger()
    logger.log('ui.render_failed', { boundary_id: 'explore', email: 'learner@example.com', token: 'secret-token' })

    const result = logger.exportJsonl()

    expect(result.ok).toBe(true)
    expect(result.content).toContain('"email":"[REDACTED]"')
    expect(result.content).toContain('"token":"[REDACTED]"')
    expect(result.content).not.toContain('learner@example.com')
    expect(result.content).not.toContain('secret-token')
  })

  it('given_more_events_than_buffer_capacity_when_exporting_then_keeps_newest_events_only', () => {
    const logger = createDiagnosticsLogger(2)
    logger.log('first', { value: 1 })
    logger.log('second', { value: 2 })
    logger.log('third', { value: 3 })

    const result = logger.exportJsonl()

    expect(result.content).not.toContain('"event_name":"first"')
    expect(result.content).toContain('"event_name":"second"')
    expect(result.content).toContain('"event_name":"third"')
  })
})
