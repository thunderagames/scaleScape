# Coding Standards

These standards apply once implementation is authorized. They favor clarity, testability, and predictable collaboration over cleverness or mechanical pattern use.

## Decision Order

When rules appear to compete, use this order:

1. Preserve correct user-visible behavior and accessibility.
2. Preserve domain and module boundaries.
3. Keep the simplest design that satisfies current requirements.
4. Apply SOLID where it creates a concrete testing, extension, or ownership benefit.
5. Follow naming and formatting conventions consistently.

SOLID is a design lens, not a requirement to create an interface, class, or layer for every function.

## SOLID Rules

| Principle | ScaleScape rule | Review evidence |
| --- | --- | --- |
| Single Responsibility | A module owns one cohesive capability; a use case coordinates one user intention; a function performs one understandable operation. | Its name explains its purpose, and a behavior change normally affects one module. |
| Open/Closed | Prefer adding formula data, content, a feature module, or an adapter over editing unrelated core algorithms. | An extension follows the playbook in the architecture document. |
| Liskov Substitution | Every adapter honoring a port must accept the same valid inputs, preserve the same outcomes, and return failures through the declared contract. | The shared contract suite passes for production adapters and test fakes. |
| Interface Segregation | A port exposes only the capabilities required by its consumer. Split it when consumers require meaningfully different operations or lifecycle rules. | Consumers do not receive methods they cannot legitimately call. |
| Dependency Inversion | Domain and application code depend on contracts; browser, storage, logging persistence, rendering, and framework details remain adapters. | Dependency-rule checks reject inward modules importing concrete infrastructure. |

### Pragmatic Guardrails

- Prefer pure functions and composition over inheritance.
- Do not create an interface only to mirror one pure implementation.
- Introduce a port when crossing a side-effect boundary, substituting adapters, or enabling a meaningful test fake.
- Avoid generic `Manager`, `Helper`, `Utils`, or `Common` modules. Name code after the domain capability it owns.
- Do not add a design pattern without naming the concrete problem it solves.
- Expected failures use explicit result values; exceptions are reserved for unexpected faults.
- Domain values are immutable. State changes produce a new value or pass through a defined transition.

## Naming Rules

| Identifier | Convention | Example |
| --- | --- | --- |
| Local variables | `snake_case` | `selected_root`, `scale_instance` |
| Function parameters | `snake_case` | `generation_id`, `playable_pitch` |
| Internal object/data fields | `snake_case` | `differing_degree`, `last_formula` |
| Functions and methods | action-oriented `camelCase` | `createScale`, `activateGeneration` |
| Classes, types, interfaces, and enum types | `PascalCase` | `ScaleInstance`, `PlaybackControlPort`, `AudioLifecycle` |
| Enum members | `SCREAMING_SNAKE_CASE` | `LOCKED`, `PLAYING` |
| Immutable module constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_VOLUME`, `MAX_FRET` |
| Modules and files | lowercase kebab-case | `scale-instance.ts`, `audio-engine.ts` |

Additional rules:

- Boolean variables start with `is_`, `has_`, `can_`, or `should_` when grammatically appropriate.
- Collection variables use plural nouns; singular values use singular nouns.
- Names describe domain meaning, not incidental implementation details.
- Avoid abbreviations unless they are established musical or platform terms such as `midi`, `bpm`, or `pwa`.
- Browser, framework, generated, and third-party property names keep their external spelling. Adapters map them to internal `snake_case` fields at the boundary.
- Renaming external payload fields solely to satisfy this convention is forbidden.

## Test Naming

Every automated test title MUST use:

```text
given_<precondition>_when_<action>_then_<observable_outcome>
```

The enforced grammar is:

```text
^given_[a-z0-9]+(?:_[a-z0-9]+)*_when_[a-z0-9]+(?:_[a-z0-9]+)*_then_[a-z0-9]+(?:_[a-z0-9]+)*$
```

Example:

```text
given_e_dorian_when_creating_scale_then_c_sharp_is_the_major_sixth
```

Rules:

- Use lowercase `snake_case` throughout the title.
- Name one observable behavior; do not join outcomes with `and`.
- Describe behavior through the tested public contract, not private implementation details.
- Keep the `given`, `when`, and `then` clauses specific enough that a failing title explains the regression.
- Property-based, contract, interaction, accessibility, architecture, and end-to-end tests follow the same pattern.
- Parameterized cases include the distinguishing case value in the `given` clause; no suffix outside the pattern is allowed.
- Avoid `should`, `works`, `test_`, ticket numbers, and vague outcomes such as `then_success`.

The test body follows Given/When/Then semantics:

1. **Given:** create deterministic state and fakes.
2. **When:** execute one public action.
3. **Then:** assert observable outcomes and relevant side effects.

Comments marking these sections are optional when the structure is already obvious.

## Code Structure Rules

- Import another module only through its public contract.
- Keep framework and browser APIs in adapters or the UI module.
- Keep domain calculations free from I/O, time, randomness, and global state.
- Inject clocks, random sources, playback, and persistence where deterministic tests require control.
- Prefer early returns over deeply nested control flow.
- Do not use boolean parameters to select unrelated behaviors; use distinct operations or an explicit options type.
- Keep public contracts narrow and document their failures and lifecycle behavior.
- A change to one module includes its behavior tests and any affected contract tests in the same work unit.
- Direct `console.log`, filesystem, database-driver, or browser-storage calls for diagnostics are forbidden outside observability adapters.
- Log structured events at application or adapter boundaries; do not add logging side effects to pure domain, state-transition, exercise-evaluation, or mapping functions.

## Enforcement

The implementation scaffold MUST configure protected-branch checks using this applicability matrix:

| Check | When it runs | Merge/release rule |
| --- | --- | --- |
| Formatting, static analysis, identifier naming, and test-title grammar | Every change | Merge-blocking |
| Type checking | Every change when supported by the selected language | Merge-blocking |
| Unit, property-based, and contract tests | Every change | Merge-blocking |
| Architecture and forbidden-import checks | Every change | Merge-blocking |
| Interaction and automated accessibility tests | Every change | Merge-blocking |
| Browser integration and golden-path end-to-end tests | Every change | Merge-blocking |
| Full P0 browser/device matrix | Every release candidate | Release-blocking |

Branch protection MUST prevent merge or release while a required check is missing, skipped, or failing. Automated suites are never conditionally skipped; the full physical P0 device matrix remains the only release-only check. External API naming exceptions are allowed only at adapter boundaries. Internal naming exceptions are not permitted.

## Review Checklist

- Does each changed unit have one clear responsibility?
- Is the extension additive where the architecture says it should be?
- Can every adapter pass the same contract suite as its fake?
- Are business side effects behind application-owned ports and diagnostics behind observability-owned ports?
- Do new identifiers follow the naming matrix?
- Do all tests use `given_when_then` and assert observable behavior?
- Did the change add only the abstractions required by current evidence?
