# Observability and Logging

ScaleScape uses structured, persistence-agnostic observability for debugging, performance analysis, and support diagnostics. Logging is not product analytics and MUST NOT weaken privacy, determinism, audio timing, or user experience.

## Goals

- Reconstruct application and audio failures from structured events.
- Measure critical user flows and performance spans reproducibly.
- Switch persistence between memory, exported files, local databases, filesystem adapters, or database engines without changing log producers.
- Keep logging failures isolated from product behavior.
- Make diagnostic data understandable and safe to share.

## Non-Goals

- Tracking individual users or building behavioral profiles.
- Recording microphone/audio content, free-form user input, or personal data.
- Connecting the browser directly to server database credentials.
- Using logs as a substitute for tests, metrics, or explicit error handling.

## Architecture

The observability core owns event schemas, redaction, sampling, buffering, performance spans, and sink contracts. Producers know only the narrow capability they require.

```text
Application / UI adapters / Audio adapter / Persistence adapter
                    |
        EventLoggerPort or PerformanceTracerPort
                    |
             Observability pipeline
      enrich -> redact -> filter/sample -> buffer
                    |
                 LogSink
        console | memory | local database

DiagnosticsExportPort -> sanitized snapshot -> JSONL download
```

| Pattern | Use |
| --- | --- |
| Ports and Adapters | Producers depend on logging/tracing contracts; persistence is an adapter. |
| Strategy | Runtime configuration selects one sink without changing producers. |
| Composite | `CompositeLogSink` fans out to several independent sinks. |
| Decorator/Pipeline | Enrichment, redaction, sampling, and buffering wrap sink delivery. |
| Null Object | `NullEventLogger` and `NullPerformanceTracer` disable observability without conditionals in producers. |

Patterns MUST remain internal implementation tools. A new abstraction requires a concrete sink, policy, testing, or substitution need.

## Ownership Rules

- `observability` owns `EventLoggerPort`, `PerformanceTracerPort`, structured schemas, processors, and `LogSink`.
- `observability/adapters` owns console, memory, file-export, database, and remote-collector adapters.
- Application Services, UI adapters, audio adapters, persistence adapters, and benchmark harnesses MAY receive a narrow logging or tracing port.
- Pure theory, state-transition, instrument-mapping, and exercise-evaluation functions MUST NOT log. They return values or explicit failures; callers record boundary events.
- No module may call `console.log`, browser storage, filesystem APIs, or a database driver directly for logging.
- The composition root selects sinks and policies for the current environment.

## Structured Event Model

```text
LogEvent = {
  schema_version,
  event_id,
  sequence_number,
  timestamp,
  level,
  category,
  event_name,
  module,
  correlation_id,
  span_id,
  parent_span_id,
  session_id,
  outcome,
  duration_ms,
  attributes,
  error
}
```

| Field | Rule |
| --- | --- |
| `schema_version` | Required integer; Event Catalog V1 requires exactly `1`. |
| `event_id` | Required canonical lowercase UUID v4; generated per event and never reused as a user identifier. |
| `sequence_number` | Required non-negative safe integer, monotonically increasing within one session. |
| `timestamp` | Required ISO-8601 UTC string with millisecond precision. |
| `level` | Required enum: `TRACE`, `DEBUG`, `INFO`, `WARN`, or `ERROR`. |
| `category` | Required lowercase `[a-z][a-z0-9_]{0,31}` value cataloged with the event. |
| `event_name` | Required exact name from Event Catalog V1. |
| `module` | Required lowercase `[a-z][a-z0-9_/-]{0,63}` architectural module identifier. |
| `correlation_id` | Required canonical lowercase UUID v4 grouping one use case. |
| `span_id` | Required 16-character lowercase hexadecimal identifier for the current boundary/span. |
| `parent_span_id` | Optional 16-character lowercase hexadecimal parent identifier; absent on a root event/span. |
| `session_id` | Required canonical lowercase UUID v4 regenerated on every application start. |
| `outcome` | Optional enum: `SUCCESS`, `FAILURE`, or `CANCELLED`; required where the catalog declares one. |
| `duration_ms` | Optional finite non-negative number rounded to three decimals; required for completed spans. |
| `attributes` | Required object (empty when unused) containing only cataloged keys and bounded scalar values. |
| `error` | Optional `LogError`; required only where Event Catalog V1 declares it. |

Event names and fields are contracts. Renaming or changing meaning requires a schema-version decision.

### Error Schema

Raw error objects MUST NOT enter the pipeline.

```text
LogError = {
  code,
  safe_message,
  stack_frames
}

StackFrame = {
  function_name,
  file_name,
  line,
  column
}
```

- `code` is one of `UNEXPECTED_ERROR`, `TIMEOUT`, `ABORTED`, `UNAVAILABLE`, `INVALID_STATE`, `STORAGE_ERROR`, `AUDIO_ERROR`, `RENDER_ERROR`, or `PERMISSION_DENIED`.
- `safe_message` is optional, capped at 256 UTF-8 bytes, and MUST be produced from a controlled template rather than raw user or server text.
- `stack_frames` is available only in local diagnostic mode, capped at 20 frames, and contains file basenames rather than full paths or URLs.
- Causes, response bodies, request headers, query strings, cookies, and arbitrary nested error fields are rejected.
- The redaction processor scans the complete serialized event, including `error`, for credentials, authorization patterns, email-like values, URLs/query data, and local filesystem paths before any sink receives it.

## Logging and Tracing Ports

```text
EventLoggerPort
  log(log_event) -> EnqueueResult
  flush(deadline_ms) -> result

PerformanceTracerPort
  startRootSpan(span_name, correlation_id, attributes) -> PerformanceSpan
  startChildSpan(span_name, parent_trace_context, attributes) -> PerformanceSpan

PerformanceSpan
  traceContext() -> TraceContext
  addAttribute(attribute_name, attribute_value)
  finish(outcome, attributes)

TraceContext = {
  correlation_id,
  span_id,
  parent_span_id
}

LogSink
  appendBatch(log_events, operation_context) -> result
  flush(operation_context) -> result
  close(operation_context) -> result

SinkOperationContext = {
  operation_id,
  deadline_ms,
  abort_signal
}

DiagnosticsExportPort
  exportJsonl(export_request, trace_context) -> result

EnqueueResult =
  ACCEPTED |
  DROPPED_INVALID_SCHEMA |
  DROPPED_UNKNOWN_ATTRIBUTE |
  DROPPED_OVERSIZED |
  DROPPED_BUFFER_PRIORITY |
  DROPPED_DISABLED

SinkResult = SUCCESS | TIMEOUT | FAILURE
```

Methods use `camelCase`; parameters and event fields use `snake_case` according to the coding standards.

`startRootSpan` creates a new `span_id` and omits `parent_span_id`. `startChildSpan` creates a new `span_id`, preserves the parent's `correlation_id`, and sets `parent_span_id` to the captured parent `span_id`. The incoming context is never reused as the child's identity.

## Sink Adapters

| Sink | Environment | Purpose |
| --- | --- | --- |
| `ConsoleLogSink` | Development only | Immediate local debugging. Disabled during performance measurements. |
| `RingBufferLogSink` | Browser MVP | Bounded in-memory diagnostics with deterministic eviction. |
| `JsonlDiagnosticsExporter` | Browser MVP application adapter | Exports a sanitized snapshot as JSON Lines after a user gesture; it is not an active sink. |
| `IndexedDbLogSink` | Optional local diagnostic mode | Local database persistence with bounded retention. |
| `FileSystemLogSink` | Future non-browser runtime or backend | JSONL/rotating-file persistence behind the same contract. |
| `DatabaseLogSink` | Future backend/runtime | Persistence through a database driver or repository. |
| `HttpCollectorLogSink` | Future explicit-consent mode | Sends sanitized batches to a backend that may persist to files or a database. |

The browser MUST NOT receive database credentials or silently write arbitrary disk paths. File export requires a user action; remote collection requires an explicit future privacy decision and consent model.

`DiagnosticsExportPort` is application-facing and implemented by `JsonlDiagnosticsExporter`. The UI invokes an `exportDiagnostics` Application Service use case during the user's click/keyboard gesture; UI code never accesses sinks or exporters directly. `observability` owns an internal `DiagnosticsSnapshotReader` implemented by the ring-buffer and IndexedDB adapters; the exporter depends on that reader and never receives continuous log batches.

At export start, an observability-owned snapshot coordinator captures an immutable cutoff: the requested scope (`CURRENT_SESSION` or `RETAINED_LOCAL`), cutoff timestamp, and maximum accepted `sequence_number` per included session. It calls `flushThrough(cutoff_watermarks, 500_ms)` before reading. If retained events at or below the cutoff cannot reach their configured local sinks before the deadline, export fails visibly rather than producing a silently incomplete file.

After a successful flush, the ring buffer creates a synchronous immutable copy and IndexedDB opens one read-only snapshot transaction, both constrained to the cutoff. The reader unions those source snapshots, deduplicates by `event_id`, and sorts by `timestamp`, then `session_id`, then `sequence_number`. Events accepted after the cutoff are excluded. Events already evicted by documented retention before the cutoff are outside the export guarantee. Every included record was redacted before persistence; export runs schema validation/redaction again before encoding JSONL.

## Levels and Runtime Modes

| Mode | Enabled levels | Default sinks |
| --- | --- | --- |
| Development | `DEBUG` and above; `TRACE` temporarily | Console + ring buffer |
| Production | `INFO` and above | Ring buffer |
| Local diagnostic | `DEBUG` and above | Ring buffer + optional IndexedDB; JSONL export is available as an explicit action |
| Performance test | Performance spans, `WARN`, `ERROR` | Ring buffer or benchmark sink; console disabled |

- `TRACE` is temporary and MUST NOT be enabled in production builds by default.
- Debug logging is activated explicitly and expires at the end of the session unless the user enables bounded local diagnostic persistence.
- Performance reports MUST record the runtime mode, active sinks, sampling policy, application build, and device/browser fixture.

## Required Events and Spans

The first implementation must cover these boundaries without logging every note or render:

| Area | Required event or span |
| --- | --- |
| Application | Guided Start entered/completed/cancelled; scale change completed/failed; stale generation rejected. |
| Audio | Unlock completed/failed; context started/stopped; hanging-voice guard activated; unavailable/suspended transitions. |
| Persistence | Preferences load fallback; malformed version; write failure; diagnostic sink disabled. |
| UI | Fatal render boundary; unsupported viewport state; accessibility fallback activation. |
| Performance | Initial interaction, scale-change use case, instrument view-model creation, audio unlock, Ear Gym feedback. |

High-frequency note previews MUST be counted or sampled rather than logged individually in production. Audio scheduling callbacks MUST NOT synchronously write to a sink.

### Event Catalog V1

Event Catalog V1 uses `schema_version: 1`. Only cataloged attributes are accepted. `duration_ms`, trace fields, session fields, and top-level `error` follow the common schema and are not repeated in the attribute column. Events ending in `_failed`, `ui.render_failed`, and `audio.hanging_voice_guard_activated` require top-level `LogError`; `observability.sink_disabled` uses bounded failure codes to avoid recursive error serialization.

| `event_name` | Level | Outcome | Required attributes | Production cardinality |
| --- | --- | --- | --- | --- |
| `application.guided_start_entered` | `INFO` | Omitted | `entry_source` | Every occurrence |
| `application.guided_start_completed` | `INFO` | `SUCCESS` | `final_step_id` | Every occurrence |
| `application.guided_start_cancelled` | `INFO` | `CANCELLED` | `step_id`, `reason_code` | Every occurrence |
| `application.scale_change_completed` | `INFO` | `SUCCESS` | `formula_id`, `root_pitch_class`, `generation_id` | Every occurrence |
| `application.scale_change_failed` | `ERROR` | `FAILURE` | `formula_id`, `root_pitch_class`, `generation_id` | Every occurrence |
| `audio.unlock_completed` | `INFO` | `SUCCESS` | `audio_lifecycle` | Every occurrence |
| `audio.unlock_failed` | `WARN` | `FAILURE` | `audio_lifecycle` | Every occurrence |
| `audio.context_started` | `INFO` | `SUCCESS` | `generation_id`, `context_kind` | Every occurrence |
| `audio.context_stopped` | `INFO` | `SUCCESS` or `CANCELLED` | `generation_id`, `reason_code` | Every occurrence |
| `audio.stale_generation_rejected` | `DEBUG` | `CANCELLED` | `request_generation_id`, `active_generation_id` | First 10 per session, then counted |
| `audio.hanging_voice_guard_activated` | `ERROR` | `FAILURE` | `generation_id`, `channel` | Every occurrence |
| `audio.lifecycle_changed` | `WARN` | Omitted | `previous_lifecycle`, `new_lifecycle`, `reason_code` | Every unavailable/suspended/error transition |
| `persistence.preferences_fallback` | `WARN` | Omitted | `reason_code`; optional `stored_version` only when a valid integer was parsed | Every occurrence |
| `persistence.preferences_write_failed` | `WARN` | `FAILURE` | None | Every occurrence |
| `observability.sink_disabled` | `WARN` | `FAILURE` | `sink_kind`, `failure_code` | Once per disabled sink |
| `ui.render_failed` | `ERROR` | `FAILURE` | `boundary_id` | Every occurrence |
| `ui.unsupported_viewport_detected` | `WARN` | Omitted | `viewport_band`, `reason_code` | Once per session/reason |
| `ui.accessibility_fallback_activated` | `INFO` | `SUCCESS` | `fallback_kind` | Once per activation |

Event category/module assignment is fixed:

| Event prefix | `category` | `module` |
| --- | --- | --- |
| `application.*` | `application` | `application` |
| `audio.*` | `audio` | `audio` |
| `persistence.*` | `persistence` | `persistence` |
| `observability.*` | `observability` | `observability` |
| `ui.*` | `ui` | `ui` |

Catalog attribute types and bounds:

| Attribute | Type and bound |
| --- | --- |
| IDs and codes | Lowercase `[a-z0-9._-]`, 1-64 characters. |
| `root_pitch_class` | Integer 0-11. |
| Generation IDs | Non-negative safe integers. |
| `audio_lifecycle` | `LOCKED`, `READY`, `SUSPENDED`, `UNAVAILABLE`, `ERROR`. |
| `previous_lifecycle`, `new_lifecycle` | Same enum as `audio_lifecycle`. |
| `channel` | `CONTEXT`, `PREVIEW`, `EXERCISE`. |
| `context_kind` | `DRONE`, `PEDAL`, `SCALE`, `EXERCISE`. |
| `viewport_band` | `PHONE`, `TABLET`, `DESKTOP`. |
| `entry_source` | `FIRST_VISIT`, `NAVIGATION`, `RESTART`. |
| `instrument_type` | `PIANO`, `GUITAR`. |
| `sink_kind` | `CONSOLE`, `RING_BUFFER`, `INDEXED_DB`, `FILESYSTEM`, `DATABASE`, `HTTP_COLLECTOR`. |
| `comparison_kind` | `FOCUSED`, `BROAD`. |
| `duration_ms` | Finite non-negative number, rounded to three decimal places. |
| `stored_version` | Optional non-negative safe integer; present only when parsing recovered an integer. |

Cataloged reason/failure codes:

| Attribute context | Allowed values |
| --- | --- |
| Guided Start cancellation | `USER_EXIT`, `NAVIGATION`, `AUDIO_UNAVAILABLE`. |
| Audio context stop | `USER_STOP`, `CONTEXT_CHANGED`, `PAGE_HIDDEN`, `ENGINE_ERROR`. |
| Audio lifecycle change | `AUTOPLAY_LOCK`, `PAGE_HIDDEN`, `BROWSER_SUSPEND`, `UNSUPPORTED`, `ENGINE_ERROR`. |
| Preferences fallback | `MISSING`, `MALFORMED`, `UNSUPPORTED_VERSION`, `UNAVAILABLE`. |
| Viewport warning | `BELOW_MIN_WIDTH`, `INSUFFICIENT_HEIGHT`. |
| Sink failure | `TIMEOUT`, `APPEND_FAILED`, `FLUSH_FAILED`, `CLOSE_FAILED`, `MAILBOX_OVERFLOW`, `STORAGE_UNAVAILABLE`. |

Performance span catalog:

| Span name | Required attributes | Sampling |
| --- | --- | --- |
| `performance.initial_interaction` | `entry_source`, `viewport_band` | First per session; all in performance-test mode |
| `performance.scale_change` | `formula_id`, `root_pitch_class`, `generation_id` | First per session plus 10% production; all in performance-test mode |
| `performance.instrument_view_model` | `instrument_type`, `viewport_band`, `position_count` | First per instrument/band plus 10% production; all in performance-test mode |
| `performance.audio_unlock` | `audio_lifecycle` | Every occurrence |
| `performance.ear_gym_feedback` | `comparison_id`, `comparison_kind` | First per session plus 10% production; all in performance-test mode |

All spans use category `performance`, level `INFO`, and require an outcome and `duration_ms`. Module assignment is: initial interaction and scale change -> `application`; instrument view model -> `instruments/piano` or `instruments/guitar` according to `instrument_type`; audio unlock -> `audio`; Ear Gym feedback -> `exercises`. `position_count` is a non-negative safe integer; `comparison_kind` is `FOCUSED` or `BROAD`; other IDs follow the catalog ID rule.

Operational trace-span catalog:

| Root span name | Module | Required attributes |
| --- | --- | --- |
| `use_case.change_scale` | `application` | `formula_id`, `root_pitch_class`, `generation_id` |
| `use_case.enter_guided_start` | `application` | `entry_source` |
| `use_case.start_guided_comparison` | `application` | `comparison_id`, `comparison_kind`, `generation_id` |
| `use_case.preview_note` | `application` | `instrument_type`, `pitch_class`, `octave`, `generation_id` |
| `use_case.replay_example` | `application` | `example_id`, `generation_id` |
| `use_case.submit_answer` | `application` | `comparison_id`, `comparison_kind`, `is_correct` |
| `use_case.stop_playback` | `application` | `reason_code`, `generation_id` |
| `use_case.set_volume` | `application` | `volume` |
| `use_case.set_muted` | `application` | `is_muted` |
| `use_case.export_diagnostics` | `application` | `export_scope` |

| Child span name | Module | Required attributes |
| --- | --- | --- |
| `adapter.audio_unlock` | `audio` | `audio_lifecycle` |
| `adapter.audio_activate_generation` | `audio` | `generation_id` |
| `adapter.audio_start_context` | `audio` | `generation_id`, `context_kind` |
| `adapter.audio_preview` | `audio` | `generation_id`, `pitch_class`, `octave` |
| `adapter.audio_play_example` | `audio` | `generation_id`, `comparison_id` |
| `adapter.audio_replay` | `audio` | `generation_id`, `example_id` |
| `adapter.audio_stop_preview` | `audio` | `generation_id` |
| `adapter.audio_stop_exercise_playback` | `audio` | `generation_id` |
| `adapter.audio_stop_all` | `audio` | `reason_code` |
| `adapter.audio_set_volume` | `audio` | `volume` |
| `adapter.audio_set_muted` | `audio` | `is_muted` |
| `adapter.diagnostics_export` | `observability/adapters` | `export_scope`, `exported_event_count`, `exported_byte_count` |

Operational spans use level `DEBUG`, require an outcome and `duration_ms`, and always create/propagate trace context even when recording is sampled out. They are retained in local diagnostic and performance-test modes; production retains failures plus the first successful occurrence per span name/session.

Additional operational attribute types: `pitch_class` is integer `0..11`; `octave` is integer `-1..9`; `is_correct` and `is_muted` are booleans; `volume` is finite number `0..1`; `export_scope` is `CURRENT_SESSION` or `RETAINED_LOCAL`; exported counts are non-negative safe integers. Operational `reason_code` uses the corresponding cataloged cancellation/stop values.

## Correlation and Performance Spans

- Each public Application Service use case starts one root span and uses its immutable `TraceContext` for application-boundary events.
- Playback/export commands carry `parent_trace_context` together with request data. Each adapter MUST call `startChildSpan`, and delayed callbacks capture the resulting child context rather than reading ambient mutable trace state.
- Playback generations reuse the use-case correlation identifier and include `generation_id` as an allowlisted attribute.
- Performance spans use a monotonic clock; wall-clock timestamps are metadata only.
- A span is finished exactly once with `SUCCESS`, `FAILURE`, or `CANCELLED`.
- Nested spans MAY describe audio, mapping, and rendering work but must preserve `correlation_id` and set their captured `parent_span_id`.
- Performance acceptance tests use production logging configuration. Diagnostic-mode overhead is measured separately and never mixed with product timings.

## Privacy and Redaction

Logs MUST NOT contain:

- Names, email addresses, account identifiers, IP addresses, or persistent device identifiers.
- Raw audio, microphone data, MIDI performances, or free-form user content.
- Database credentials, authorization tokens, cookies, storage contents, or full URLs containing query data.
- Exact fingerprints assembled from device, browser, locale, and hardware fields.

Allowed musical context is limited to implementation diagnostics such as formula ID, root pitch class, instrument type, viewport band, generation ID, and error code.

A redaction processor runs before every sink, including console. Unknown attribute keys are rejected rather than passed through. Remote logging remains disabled in the MVP.

## Buffering, Failure, and Retention

- `log()` validates and enqueues an immutable event snapshot without performing sink I/O or awaiting a promise. It returns `ACCEPTED` or a bounded `DROPPED_<reason>` result and never throws.
- Delivery workers process batches outside audio scheduling and rendering-critical paths. Events preserve a monotonic `sequence_number` per session so each sink can maintain accepted-event order.
- Composite sinks receive independent immutable batches through separate bounded mailboxes. One sink cannot block dispatch to another.
- Each sink mailbox holds at most 10 batches or 1 MB. Overflow disables that sink for the session rather than growing memory or blocking producers.
- Each append receives an abort signal and a 250 ms deadline; explicit flush receives 500 ms; close receives 1,000 ms. On timeout, the worker aborts the operation, ignores any late completion using `operation_id`, clears the mailbox, and disables the sink immediately. No later operation is dispatched to that sink, so late side effects cannot reorder accepted work.
- A successful `flush()` guarantees that all events accepted by that sink up to the flush-call sequence watermark have been persisted or delivered. Failure/timeout returns an explicit result and provides no delivery guarantee beyond the sink's previous successful watermark.
- `pagehide` uses best-effort enqueue/flush and never delays navigation.
- The delivery queue and browser ring buffer each store at most 1,000 events or 2 MB, whichever limit is reached first.
- Size is the UTF-8 byte length of canonical serialized JSON after enrichment and redaction. A single event over 64 KB is rejected as `DROPPED_OVERSIZED`.
- Overflow evaluates the incoming event together with stored events. It repeatedly removes the lowest-severity candidate (`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`), breaking ties by oldest `sequence_number`, until both event-count and encoded-byte limits are satisfied. If the incoming event is removed, it returns `DROPPED_BUFFER_PRIORITY`; otherwise it is accepted and every removed stored event increments the drop counters. Therefore incoming `TRACE` never evicts stored `ERROR`, while incoming `ERROR` replaces as many oldest stored errors as required when no lower level exists.
- Drop counters are held in a fixed in-memory health snapshot keyed by level and reason; they are not recursively logged into the same saturated queue.
- IndexedDB diagnostic storage is capped at 10 MB and seven days by default. Pruning runs at startup and after each committed batch, ordered by timestamp and then event ID.
- File and database adapters require configured size/time retention and rotation policies before activation.
- A non-timeout sink failure is isolated from other composite sinks and product behavior. Three consecutive ordinary failures disable the sink; a successful operation resets the counter. A timeout or mailbox overflow disables it immediately. Disabling emits one `observability.sink_disabled` event to remaining sinks.
- Logging and flush failures never block application startup, playback, navigation, or shutdown.
- `pagehide` and visibility changes trigger a best-effort non-blocking flush.

## Performance Budget

- Performance tests use the exact recorded browser/device fixture, production processors and ring-buffer sink, closed developer tools, and no console sink. Performance-test mode overrides production sampling so every cataloged benchmark event/span is retained.
- Each benchmark performs 20 warm-up operations followed by five paired comparisons. Every pair contains one 100-operation baseline round and one 100-operation configured round; execution order alternates `baseline/configured`, then `configured/baseline`.
- Baseline uses both `NullEventLogger` and `NullPerformanceTracer`; configured rounds include event/span creation, enrichment, redaction, sampling decisions, and enqueue cost.
- Both modes use two separate clocks: the fixture's real high-resolution monotonic clock measures operation/span duration, while an injected deterministic wall-clock supplies event timestamps. UUID/span-ID sources use seed `scalescape_observability_v1`; generated identifiers retain the required V1 formats.
- Warm-up uses the first 20 tuples of the same cycle but is discarded. Every measured round restarts from the first tuple and initializes `generation_id` to `1`.
- The scale-change tuple order is formula-major: use formulas in the exact order listed in `07-music-domain-model.md`; for each formula iterate roots `0..11`; repeat from the first formula until 100 operations. Each operation emits one `performance.scale_change` span and one `application.scale_change_completed` event with the exact V1 payload and no error.
- The instrument-view-model benchmark repeats this exact cycle until 100 operations: `PIANO/PHONE`, `PIANO/TABLET`, `PIANO/DESKTOP`, `GUITAR/PHONE`, `GUITAR/TABLET`, `GUITAR/DESKTOP`. `position_count` comes from the generated view model; each operation emits one `performance.instrument_view_model` span with no additional event.
- Compare the median of the five round-level p95 values. When baseline p95 is at least 20 ms, configured overhead MUST be no more than 5%. When baseline p95 is below 20 ms, the absolute p95 increase MUST be no more than 1 ms.
- A run is invalid and must be repeated when baseline round-level p95 coefficient of variation exceeds 10%.
- Asynchronous batch drain, sink deadline behavior, memory, and explicit flush are measured in separate tests and are not hidden inside the interaction benchmark.
- Console output is forbidden during benchmark runs because developer tools distort timing.
- Logging allocations and buffer size are included in memory profiling.
- A failed observability budget blocks release until logging is reduced, sampled, buffered differently, or explicitly disabled on the critical path.

## Testing Strategy

Pipeline contract tests cover schema validation/versioning, enrichment, immutable trace propagation, whole-event redaction, attribute allowlists, sampling, queue overflow, and ordering.

Every `LogSink` runs the common sink contract suite:

- Accept an immutable ordered batch or return an explicit failure/timeout result.
- Preserve schema and sequence numbers without mutating events.
- Implement safe repeated flush and idempotent close.
- Surface failure without throwing into the producer or blocking another sink.

Capability-specific suites apply only where relevant:

| Capability | Required suite |
| --- | --- |
| Bounded memory | Byte accounting, oversized events, level-based eviction, drop counters. |
| IndexedDB | Version/open failure, transactions, startup/post-batch pruning, size/age retention. |
| JSONL export | Explicit user gesture, valid line-delimited output, sanitized snapshot, cancellation. |
| Rotating filesystem | Size/time rotation, retention, partial-write recovery, permissions failure. |
| Database | Transaction rollback, schema mapping/version, retry policy, retention query. |
| Composite | Independent dispatch/deadlines, failure isolation, sink disabling. |

Additional tests cover span completion, monotonic duration, correlation propagation into delayed callbacks, disabled logging, sink circuit breaking, and observability overhead.

Test titles follow the mandatory pattern, for example:

```text
given_sensitive_attributes_when_logging_event_then_values_are_rejected
given_full_ring_buffer_when_appending_error_then_oldest_lower_level_is_evicted
given_old_playback_generation_when_logging_failure_then_correlation_is_preserved
given_production_logging_when_measuring_scale_change_then_overhead_stays_within_budget
```

## MVP Acceptance

- The application runs with `NullEventLogger`, ring-buffer logging, or a composite sink without producer changes.
- A user can explicitly export sanitized JSONL diagnostics from local diagnostic mode.
- Logging disabled or sink failure produces no user-flow failure.
- No prohibited field reaches any sink in automated redaction tests.
- Required application/audio/persistence events and performance spans are present and correlated.
- Ring-buffer and optional IndexedDB limits are enforced.
- Production observability satisfies the performance budget.
- File-system and database adapters pass the common `LogSink` suite plus their capability-specific suites when introduced, without changing producers or event schemas.
