# Technical Architecture

ScaleScape is a client-side **modular monolith**: one deployable web application, internally split into modules with enforced boundaries, explicit dependencies, and independent testability.

## Why a Modular Monolith

| Force | Consequence |
| --- | --- |
| Client-side MVP, no backend | One deployable unit; distribution complexity would buy nothing. |
| One developer, 20-30 hours per week | Boundaries must be cheap to maintain: folder-level modules with tooling enforcement, not services. |
| High-risk interactions under validation | Modules must be replaceable (renderer, audio, state) once POC evidence arrives. |
| Correctness-critical domain | The theory core must be pure, deterministic, and testable in milliseconds. |

A monolith without module discipline decays into a tangle; micro-frontends or services would be overhead with no payoff at this scale. The modular monolith keeps the deployable simple and the internals strict.

## Architectural Goals

- Keep theory calculations deterministic and independent of rendering.
- Keep audio timing separate from UI rendering.
- Share one scale state between instruments.
- Make mobile interaction a first-class constraint.
- Make every module replaceable through a narrow public contract.
- Avoid backend and account complexity until the learning loop is validated.

## Module Catalog

| Module | Responsibility | May depend on | Must NOT depend on |
| --- | --- | --- | --- |
| `theory` | Pure music domain: formulas, scale instances, intervals, roles, spellings, focused pairs and broad contrasts, including major and minor pentatonic references | Nothing beyond the standard library | DOM, Web Audio, framework, instrument position or rendering logic |
| `audio` | Audio context lifecycle, scheduling on the audio clock, synth voices, drone, volume and mute | `theory` types, observability contracts at adapter boundaries | UI, exercises, app-state internals |
| `instruments/shared` | Headless instrument contract and shared selection/view-model types | `theory` | concrete instruments, audio internals, framework |
| `instruments/piano` | Pure key mapping, responsive view model, interaction state, preview intents | `theory`, `instruments/shared` | guitar, playback, persistence, framework |
| `instruments/guitar` | Pure fret mapping, responsive view model, scroll/press state machine, preview intents | `theory`, `instruments/shared` | piano, playback, persistence, framework |
| `exercises` | Ear Gym: focused-pair or broad-contrast selection, prompts, answer evaluation, playback intents, streak logic | `theory`, `content` | instruments, playback, persistence, framework |
| `content` | Didactic units (captions bound to domain references and interactions) and UI copy; i18n-ready | `theory` types | UI, audio |
| `application` | Use cases and orchestration across state, playback, exercises, and persistence | public module contracts, application-owned ports, observability contracts | framework, Web Audio, concrete adapters |
| `app-state` | Immutable state and transitions: root, mode, scale instance, active instrument, audio preferences, exercise session, streak | `theory` | framework, Web Audio, persistence |
| `persistence` | Implements `PreferencesStore` over local storage | the port contract from `application`, observability contracts at adapter boundaries | UI, audio, instruments |
| `observability` | Structured logging/tracing contracts, redaction, sampling, buffering, and sink orchestration | shared result/id primitives | theory rules, UI framework, concrete persistence APIs |
| `observability/adapters` | Console, ring buffer, IndexedDB, JSONL exporter, and future filesystem/database/collector adapters | `observability`, application-owned `DiagnosticsExportPort` when implementing export | theory, exercises, instrument logic |
| `ui` | Framework adapters, screens, navigation, responsive rendering, accessibility semantics | public APIs and view models of modules above | module internals or domain calculations |
| `shared` | Cross-cutting primitives: result types and ids | Nothing | any module |

## Dependency Rules

1. Dependencies point inward: `ui` and adapters -> `application`/feature modules -> `theory`. Nothing points back out.
2. `theory` and `shared` sit at the bottom and depend on nothing.
3. Modules consume each other only through their public `index` contract. Deep imports into another module's files are forbidden.
4. Business side effects (sound, preferences) use narrow application-owned ports. Cross-cutting diagnostics use observability-owned logging/tracing ports. Neither imports concrete infrastructure.
5. `main.ts` is the composition root: the only place where concrete implementations are created and wired.
6. Pure theory, state transitions, instrument mapping, and exercise evaluation do not log; callers observe their boundary outcomes.

These rules apply the Dependency Inversion pattern. The application module follows the Application Service pattern: it coordinates use cases but owns no musical or rendering rules. Instrument and exercise modules follow a Headless Feature pattern: pure state/view-model logic is framework-independent, while `ui` supplies rendering adapters.

These rules MUST be enforced by tooling (import-boundary lint rules or a dependency checker), chosen at scaffold time. Boundaries that are not enforced decay within weeks.

## Module Details

### Theory

Responsibilities:

- Define formulas and interval metadata, including reference modes and characteristic degrees.
- Resolve roots and note spellings following the root spelling policy.
- Create scale instances and semantic comparison data.
- Define focused comparisons, broad contrasts, and exercise domain types.
- Expose pure functions for tests.

It MUST NOT depend on the UI framework, browser audio APIs, or global state. Everything it produces is immutable data.

### Audio

Responsibilities:

- Initialize and resume the browser audio context after a permitted user gesture.
- Schedule tones, drones, and scale playback on the audio clock.
- Track playback state and provide mute, volume, and stop behavior.
- Invalidate scheduled events when the musical context changes.

It MUST use an audio-time model for scheduled events and MUST NOT use UI animation timing as the musical clock. It SHOULD be loadable on demand at the first user gesture to protect the initial-load budget.

### Application Services

Responsibilities:

- Execute use cases such as `enterGuidedStart`, `changeScale`, `startGuidedComparison`, `previewNote`, `replayExample`, `submitAnswer`, `stopPlayback`, `setVolume`, `setMuted`, and `exportDiagnostics`.
- Coordinate state transitions with playback cancellation and persistence.
- Translate adapter failures into user-facing application states without exposing browser APIs.

Application services depend on narrow ports and module contracts. They contain orchestration only: no theory calculations, layout decisions, or rendered copy.

### Application State

Responsibilities:

- Store the active root, formula, and derived scale instance.
- Store selected instrument, visible range, audio preferences, and exercise state.
- Apply deterministic state transitions so piano and guitar consume one scale instance.
- Own streak and preference values as state; application services decide when persistence occurs.

The state mechanism is an implementation decision to be finalized after the initial project scaffold. The boundary matters more than the library choice.

### Instrument Features

Responsibilities:

- Map scale notes to keys or frets using pure functions owned by each instrument module.
- Produce framework-neutral view models containing geometry, labels, roles, selection, focus, and accessibility metadata.
- Model pointer-versus-scroll behavior as an explicit interaction state machine.
- Emit a `PreviewNoteRequested` intent containing a playable pitch; the application service decides whether and how to execute it.

The `ui` module renders instrument view models using semantic HTML/SVG or a validated Canvas adapter. Instrument modules MUST NOT calculate scale formulas or derive interval roles locally.

### Learning Exercises

Responsibilities:

- Select a `FocusedComparison | BroadContrast` and root, using injectable seeded randomness for determinism.
- Build prompts, evaluate answers, and compute streak changes.
- Produce focused feedback for one characteristic degree or progressive broad feedback for all differing degrees, bound to didactic units from `content`.

Exercises emit typed playback intents but never invoke audio directly. The application service owns execution, cancellation, and error handling through its playback port. Prompt and explanation fields are content identifiers; rendered strings remain in `content`.

### Content

Responsibilities:

- Hold didactic units as structured data: a caption, the domain reference it explains (formula, degree, focused comparison, or broad contrast), and the interaction it binds to.
- Hold UI copy separately from domain data so translation never touches the theory engine.

Teaching text MUST live here, never hardcoded in components. Didactic units are data; the UI renders whichever unit an interaction triggers. This is how the interaction-first learning model is enforced structurally.

### Observability

Responsibilities:

- Define structured event and performance-span contracts.
- Enrich, redact, filter/sample, and buffer events before persistence.
- Dispatch batches through interchangeable `LogSink` adapters.
- Isolate sink failures and enforce privacy, retention, and overhead limits.

Producers receive only `EventLoggerPort` or `PerformanceTracerPort`. They never know whether events are persisted to memory, IndexedDB, filesystem, database, or no sink. User-triggered JSONL export is a separate Application Service use case. The detailed contract lives in `16-observability-and-logging.md`.

### UI Shell

Responsibilities:

- Compose screens from module outputs and route between Explore and Ear Gym.
- Render captions attached to the interactive elements they describe.
- Handle responsive layout following the viewport strategy in the UX specification: mobile-first, driven by available space rather than device detection.
- Handle accessibility semantics.

The UI contains no theory, audio, or exercise logic. Framework code lives only here and in `main.ts`.

## Ports and Adapters

Business ports are interfaces owned by the consuming application module; observability ports are cross-cutting contracts owned by `observability`. Concrete adapters are wired in the composition root. Headless features emit intents, and Application Services remain the single owner of playback orchestration.

```text
PlaybackControlPort (defined by application)
  unlock(parent_trace_context) -> result
  activateGeneration(generation_id, parent_trace_context) -> result
  startContext(context_request, generation_id, parent_trace_context) -> result
  preview(playable_pitch, generation_id, parent_trace_context) -> result
  playExample(example_request, generation_id, parent_trace_context) -> result
  replay(example_id, generation_id, parent_trace_context) -> result
  stopPreview(parent_trace_context) -> result
  stopExercisePlayback(parent_trace_context) -> result
  stopAll(reason_code, parent_trace_context) -> result
  setVolume(value, parent_trace_context) -> result
  setMuted(value, parent_trace_context) -> result
  subscribe(listener) -> unsubscribe

PreferencesStore (defined by application, implemented by persistence)
  load() -> result with stored preferences or defaults
  save(preferences) -> result

DiagnosticsExportPort (defined by application, implemented by observability browser adapter)
  exportJsonl(export_request, parent_trace_context) -> result
```

`generation_id` is a monotonically increasing integer owned by the application service. Each public Application Service use case starts one root span. Whenever root, mode, exercise, or learning context changes, the service increments the generation and awaits `activateGeneration(id)` before sending new playback requests. Every adapter request carries immutable `parent_trace_context`; the adapter starts a child span and delayed callbacks retain that child context rather than reading ambient state. The audio adapter stores one active generation, cancels all channels from previous generations, and rejects any delayed request whose generation does not equal the active value. Test fakes implement the same ports; silent playback/export fakes and an in-memory `PreferencesStore` keep application and feature tests fast and deterministic.

## Composition Root

`main.ts` creates the concrete audio engine and persistence adapter, adapts them to consumer ports, injects them into application services and feature modules, and mounts the UI. No module may act as a service locator or hold hidden global instances.

## Rendering Strategy

The initial implementation should choose the simplest renderer that supports accessible interaction and responsive layout:

- SVG is preferred when individual notes need semantic focus, labels, and event handling.
- Canvas is acceptable for dense visuals only when an accessible interaction layer exists.
- CSS and semantic HTML should handle controls, legends, and explanation panels.

The choice should be validated in the fretboard POC rather than assumed.

## Data and Persistence

The MVP is client-side only:

- Static formulas and copy ship with the application.
- Preferences and an exercise streak use local storage when available; the application remains fully usable when storage fails.
- No user identity or server database is required.

Local persistence for the MVP:

| Data | Stored | Notes |
| --- | --- | --- |
| Instrument preference | Yes | Last selected primary instrument. |
| Master volume | Yes | Restored on the next session. |
| Mute state | No | Sessions start unmuted to avoid silent-app confusion; the mute control is always visible. |
| Last root and mode | Yes | Lets a returning learner continue where they stopped. |
| Ear Gym streak | Yes | Consecutive correct answers; resets on an incorrect answer. |
| Guided Start completion | Yes | Returning learners open Explore instead of repeating the first-session entry. |

Persistence stays behind the `PreferencesStore` port so a future account-backed implementation does not leak into domain logic.

Persisted state is versioned:

```text
StoredPreferencesV1 = {
  version: 1,
  instrument,
  volume,
  last_root,
  last_formula,
  streak,
  guided_start_completed
}
```

Missing, malformed, unavailable, or newer-version data MUST fall back to defaults without blocking startup. Failed writes are non-fatal and remain observable to diagnostics.

## Testing Strategy

Testing is layered per module, with effort concentrated where correctness is critical:

| Module | Primary tests | Focus |
| --- | --- | --- |
| `theory` | Unit and property-based | All eight formulas across all twelve roots: unique pitch classes, degree order, interval/letter-name spelling correctness, overlapping roles, focused pairs differing by exactly one degree, broad-contrast metadata |
| `audio` | Unit (scheduler with a fake clock) plus browser integration | Gesture unlock, start, stop, mute, no hanging tones, invalidation on context change |
| `instruments/*` | Unit and interaction-contract tests | Correct key/fret positions, responsive view models, touch-versus-scroll state machine, keyboard/focus metadata, emitted preview intents |
| `exercises` | Deterministic unit tests | Prompt generation, answer evaluation, feedback binding, streak increment and reset |
| `application` | Use-case tests with fakes | One owner executes every playback intent; a scale/context change creates a new generation and cancels old playback; failures produce explicit states; preferences load/save without blocking the core flow |
| `app-state` | State transition tests | A scale change fans out one instance to all subscribers; instrument switch preserves context |
| `persistence` | Contract tests | The same suite runs against the local-storage adapter and the in-memory fake |
| `observability` | Unit, contract, privacy, and performance tests | Event schema, redaction, correlation, spans, bounded buffers, sink substitution/failure, and overhead budget |
| Architecture | Dependency-rule checks | No forbidden imports, no deep module imports, and no framework/browser dependencies in domain or headless features |
| End to end | Browser tests | Guided Start and Explore Directly golden paths, including both instruments and Ear Gym, at phone, tablet, and desktop widths |

Testing practices:

- Test behavior through public contracts, never through module internals.
- Prefer fakes over mocks for ports; keep unit tests free of browser APIs.
- Make randomness deterministic through injected seeds, and time deterministic through fake clocks.
- Encode the worked examples from the planning documents as tests (for example, E Dorian raising C to C#), so planning and code stay traceable.
- Colocate tests with their module; keep end-to-end tests separate and few.
- Coverage targets follow criticality: near-complete branch coverage in `theory`; critical-path coverage elsewhere. Vanity coverage is a non-goal.
- CI and branch-protection gates follow `15-coding-standards.md`; every automated suite runs on every change, and the full physical P0 browser/device matrix blocks releases.
- Every automated test title follows the exact `given_when_then` grammar in `15-coding-standards.md`.
- Direct console logging outside the observability console adapter is rejected by static analysis.

## Extensibility Playbook

Extensions should add new data or new modules, not modify existing ones:

| Change | Recipe |
| --- | --- |
| New scale or mode | Add formula data, metadata, content, and tests. Core algorithms stay unchanged. |
| New instrument | Add a headless feature and UI adapter under `instruments/`, register it, and add interaction/accessibility tests. Theory and audio stay unchanged. |
| Alternate guitar tunings | Add tuning data; the guitar mapping already accepts tuning as input. Additive change, no refactor. |
| New exercise type | Add a generator in `exercises` using the existing domain types and ports. |
| New persistence backend | Add an adapter implementing `PreferencesStore` and wire it in the composition root. Zero domain changes. |
| New sound source | Add a voice implementation inside `audio` behind the same facade (for example, samples replacing synth). |
| New language | Add a content pack and validate layout/accessibility. Core logic stays unchanged. |
| New didactic sequence | Add content bindings and exercise configuration; reuse existing interaction components when the behavior is unchanged. |

Extensions SHOULD avoid changing unrelated module internals. Registration, content, tests, and layout validation are expected work and do not indicate a broken boundary.

## Supportability Practices

- One public contract per module; everything else is private by default.
- Boundary rules enforced by tooling from the first commit, not added after decay begins.
- Architecture Decision Records in `documentation/adr/` for every decision that gets locked (renderer, state library, audio approach).
- Module names describe the domain, not the technology.
- Planning examples are encoded as tests, keeping documentation and behavior synchronized.
- SOLID principles are applied pragmatically according to `15-coding-standards.md`; simplicity wins when an abstraction has no concrete boundary, substitution, or testing value.
- Naming, test-title, observability-boundary, and import conventions are merge-blocking static checks.

## POC Artifact Policy

Phase-0 POCs are experiments. POC code MAY inform the MVP, but the MVP scaffold starts clean and carries over only validated patterns and interfaces. A POC is not a foundation for production code by default.

## Stack Decision Status

The framework, renderer library, audio helper library, and state library are not locked in this planning phase. They should be selected after the POCs using these criteria:

1. Strong mobile browser support.
2. Good TypeScript support if TypeScript is selected for implementation.
3. Accessible interaction primitives.
4. Low runtime overhead for the core client experience.
5. A maintainable testing story.

Whatever is selected must slot into the module boundaries above: framework code stays in `ui` and `main.ts`; the state library stays behind the application-state boundary.
