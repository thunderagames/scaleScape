# Risks and Decisions

This document keeps important assumptions visible so they can be tested instead of becoming accidental architecture.

## Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Mobile fretboard is too dense | High | Critical | Build and test the fretboard POC first; provide lower-density or single-string fallback. |
| Audio behavior varies across mobile browsers | High | High | Validate Chrome Android and Safari iOS early; expose clear audio states and fallbacks. |
| Product feels like a static visualizer | Medium | Critical | Validate the learning loop with mode comparisons and interval explanations before adding catalog breadth. |
| Too many modes overwhelm new users | Medium | High | Start with a narrow formula set and progressive disclosure. |
| Emotional labels are treated as universal truth | Medium | Medium | Present them as optional associations and anchor explanations in interval relationships. |
| Theory spelling is inconsistent | Medium | High | Keep spelling in the domain engine and test common tonal contexts. |
| Cross-instrument views drift apart | Medium | High | Use one scale instance and prohibit duplicated formula logic in instrument components. |
| Accessibility is added too late | Medium | High | Define semantic instrument behavior and color-independent encoding before implementation. |
| Content production expands the MVP | Medium | Medium | Use one comparison exercise and short explanations before creating a course. |
| Feature breadth hides weak retention | Medium | Critical | Measure insight transfer and return intent before adding new instruments or scales. |
| Guidance overwhelms experienced users | Medium | High | Keep Explore Directly visible and make guidance skippable without creating separate content models. |
| Beginner simplification teaches incorrect theory | Medium | High | Use plain language first but preserve correct interval spelling and expose technical detail on demand. |
| Diagnostic logging leaks data or harms performance | Medium | High | Use allowlisted structured fields, mandatory redaction, bounded buffers, sampling, sink isolation, and an explicit overhead budget. |
| Browser logging is mistaken for filesystem/database access | Medium | Medium | Use browser-safe JSONL export or IndexedDB; filesystem/database engines remain adapters in appropriate runtimes or backends. |

## Confirmed Direction

| Decision | Rationale |
| --- | --- |
| Web application first | Maximizes device reach and enables fast validation without native distribution. |
| Audio-first learning loop | The product must teach how modes sound, not only where notes are located. |
| Piano and guitar in the model | Cross-instrument transfer is a meaningful differentiator. |
| Client-side MVP | Avoids account, backend, and privacy complexity before product validation. |
| No microphone or MIDI in MVP | Keeps the product distinct from performance-training work and reduces latency risk. |
| Theory engine separated from UI | Musical correctness must be deterministic and independently testable. |
| Mobile fretboard validated before expansion | It is the highest-risk interaction and can invalidate the product experience. |
| First focused pair is Dorian versus natural minor | It isolates a single degree (the sixth) and supports an audible interactive reveal; Major versus natural minor remains the introductory broad contrast. |
| No third-party analytics in the MVP | Validation comes from moderated testing; the product collects no personal data. |
| Alternate guitar tunings deferred past the MVP | Keeps the MVP fretboard scope tight; the guitar mapping accepts tuning as data, so the extension is additive rather than a refactor. |
| Learners of any level are in scope | Guided Start assumes no theory or instrument knowledge; Explore Directly keeps the same domain model efficient for experienced users. |
| Application Service plus Ports and Adapters | Use-case orchestration owns cross-module flow; narrow consumer-owned ports isolate browser audio and persistence without overengineering the monolith. |
| Headless instrument features | Piano and guitar own pure mapping and interaction state; the UI owns framework rendering and accessibility adapters. |
| Pragmatic SOLID application | SOLID guides responsibility, substitution, small ports, and dependency direction; it must not create abstractions without a current testing or extension need. |
| Enforced naming conventions | Internal variables, parameters, and data fields use `snake_case`; automated test titles use the `given_when_then` pattern. External APIs retain their original names at adapter boundaries. |
| Persistence-agnostic observability | Producers use structured logging/tracing ports; interchangeable sinks support memory, local databases, and future filesystem/database engines, while a separate application port handles user-triggered exports. |
| Local-first diagnostic privacy | MVP logs stay local, bounded, redacted, and user-exported; remote collection requires a separate privacy and consent decision. |

## Open Decisions

These decisions should be made after or during the POCs:

1. SVG or Canvas for the dense fretboard interaction.
2. Whether to use a small audio helper library or only browser Web Audio APIs.
3. Which frontend framework and state library best support the chosen boundaries.
4. Whether anonymous local usage counters are added after the learning loop is validated.

## Decision Rule

No open decision should be locked based on preference alone when a small POC can provide direct evidence.
