# ScaleScape Documentation

This folder contains the reviewed product planning and technical specification baseline for ScaleScape. It is ready to guide Phase-0 POCs once implementation is explicitly authorized.

## Reading Order

| Order | Document | Purpose |
| --- | --- | --- |
| 1 | [Product Vision](01-product-vision.md) | Defines the problem, audience, value proposition, and product principles. |
| 2 | [Personas and Jobs](02-personas-and-jobs.md) | Defines the initial users and the problems they are trying to solve. |
| 3 | [Learning Model](03-learning-model.md) | Defines how the product teaches scales and modes. |
| 4 | [Product Requirements](04-product-requirements.md) | Defines functional and non-functional requirements. |
| 5 | [MVP Scope](05-mvp-scope.md) | Defines what is included, excluded, and accepted for the first release. |
| 6 | [User Experience](06-user-experience.md) | Defines the main flows and responsive interaction model. |
| 7 | [Music Domain Model](07-music-domain-model.md) | Defines the musical concepts and invariants the application must represent. |
| 8 | [Technical Architecture](08-technical-architecture.md) | Defines the modular-monolith structure, module contracts, dependency rules, testing strategy, and extensibility rules. |
| 9 | [Audio and Browser Compatibility](09-audio-and-browser-compatibility.md) | Defines web audio behavior, device expectations, and fallbacks. |
| 10 | [Accessibility](10-accessibility.md) | Defines accessibility requirements for audio, visual, touch, and keyboard use. |
| 11 | [Validation and POCs](11-validation-and-pocs.md) | Defines feasibility prototypes, success criteria, and validation tests. |
| 12 | [Roadmap](12-roadmap.md) | Defines post-MVP increments and sequencing. |
| 13 | [Risks and Decisions](13-risks-and-decisions.md) | Records known risks, open decisions, and decision rules. |
| 14 | [Glossary](14-glossary.md) | Defines the shared vocabulary used across all documents. |
| 15 | [Coding Standards](15-coding-standards.md) | Defines pragmatic SOLID usage, identifier conventions, test naming, and enforcement rules. |
| 16 | [Observability and Logging](16-observability-and-logging.md) | Defines structured diagnostics, performance tracing, privacy, sinks, retention, and persistence-agnostic contracts. |
| 17 | [Metronome Development Plan](17-metronome-plan.md) | Defines the global metronome scope, interaction model, audio boundary, persistence, and acceptance criteria. |

## Document Conventions

- All documents are written in English because they will be used as implementation references.
- `MUST` describes a release or architectural constraint.
- `SHOULD` describes a strong default that may be changed with an explicit decision.
- `MAY` describes an optional capability.
- Dates and version numbers will be added when a formal release process begins.
- Runtime module visibility is configured in the root `settings.json`; keep `diagnostics` disabled in final-user builds.
- Defaults marked `SHOULD` in the audio, UX, and persistence specifications are starting values to be tuned during the POCs.
- Source-code identifiers and automated test titles follow the conventions in `15-coding-standards.md`.

## Scope Rule

When a proposed feature cannot be tied to the core loop of listening, recognizing, locating, playing, and contextualizing, it should remain outside the MVP until validated separately.
