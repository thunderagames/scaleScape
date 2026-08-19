export interface EventLoggerPort {
  log(event_name: string, attributes: Readonly<Record<string, string | number | boolean>>): void
}
