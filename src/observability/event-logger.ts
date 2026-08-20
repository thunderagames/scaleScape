export interface EventLoggerPort {
  log(event_name: string, attributes: Readonly<Record<string, string | number | boolean>>): void
}

export interface DiagnosticsExportResult {
  readonly ok: boolean
  readonly content?: string
}

export interface DiagnosticsExportPort {
  exportJsonl(): DiagnosticsExportResult
}

export interface DiagnosticsControlPort {
  setEnabled(is_enabled: boolean): void
  isEnabled(): boolean
}

export type DiagnosticsPort = EventLoggerPort & DiagnosticsExportPort & DiagnosticsControlPort

export interface DiagnosticEvent {
  readonly schema_version: 1
  readonly event_id: string
  readonly sequence_number: number
  readonly timestamp: string
  readonly event_name: string
  readonly attributes: Readonly<Record<string, string | number | boolean>>
}

const MAX_EVENTS = 200
const MAX_STRING_LENGTH = 64

function create_uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const random_hex = () => Math.floor(Math.random() * 16).toString(16)
  const section = (length: number) => Array.from({ length }, random_hex).join('')
  return `${section(8)}-${section(4)}-4${section(3)}-a${section(3)}-${section(12)}`
}

function sanitize_value(key: string, value: string | number | boolean): string | number | boolean {
  if (/(token|password|secret|email|url|path|query|cookie|header)/i.test(key)) return '[REDACTED]'
  if (typeof value !== 'string') return value
  if (value.length > MAX_STRING_LENGTH || /(?:https?:\/\/|file:\/\/|\b[^\s@]+@[^\s@]+\b)/i.test(value)) return '[REDACTED]'
  return value
}

export function createDiagnosticsLogger(max_events = MAX_EVENTS): DiagnosticsPort {
  const session_id = create_uuid()
  const events: DiagnosticEvent[] = []
  let sequence_number = 0
  let is_enabled = false

  return {
    setEnabled(next_is_enabled) {
      is_enabled = next_is_enabled
    },
    isEnabled() {
      return is_enabled
    },
    log(event_name, attributes) {
      if (!is_enabled) return
      const sanitized_attributes = Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, sanitize_value(key, value)]))
      events.push({ schema_version: 1, event_id: create_uuid(), sequence_number, timestamp: new Date().toISOString(), event_name, attributes: sanitized_attributes })
      sequence_number += 1
      if (events.length > max_events) events.shift()
    },
    exportJsonl() {
      const content = events.map((event) => JSON.stringify({ ...event, session_id })).join('\n')
      return { ok: true, content: content.length > 0 ? `${content}\n` : '' }
    }
  }
}
