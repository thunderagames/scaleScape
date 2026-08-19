# Product Requirements

This document translates the product vision into requirements for the first implementation cycle.

## Functional Requirements

### Scale Selection

- The user MUST be able to select a root from the twelve chromatic pitch classes.
- The user MUST be able to select each supported MVP scale or mode.
- The application MUST update all active instrument views from one scale state.
- The application SHOULD allow direct mode selection for experienced users.
- The selector MUST present familiar choices first and keep the full mode list one action away.
- A guided learner MUST be able to begin without selecting a root or understanding a mode name.

### Theory Explanation

- Each scale note MUST make its degree and interval available on demand.
- The interface MUST identify tonic, third, fifth, and characteristic degrees when applicable.
- The application MUST use contextually correct note spelling in theory output.
- Focused explanations MUST describe the selected mode against its one-degree reference using characteristic-degree metadata. Broad-contrast explanations MUST reveal all differing degrees progressively without presenting one degree as the sole cause.
- Explanations MUST be anchored to interactive elements: the highlighted degree on the instrument and an audible comparison. Standalone text explanations are not acceptable.
- Didactic text MUST be limited to short captions; reading MUST NOT be required before interacting.
- Plain-language meaning MUST appear before or alongside technical terminology.

### Instrument Exploration

- The MVP MUST include an interactive piano view.
- The MVP MUST include an interactive six-string guitar fretboard view.
- A user MUST be able to play a note by touch, mouse, or keyboard where supported.
- The selected scale MUST be visible on both instruments.
- The user MUST be able to switch the primary instrument without losing scale context.
- The listening and comparison path MUST remain completable without prior piano or guitar knowledge.

### Audio Context

- The application MUST support tonic drone playback.
- The application SHOULD support tonic-and-fifth pedal playback.
- The application MUST provide play, stop, mute, and replay controls.
- Audio MUST start only after a user gesture when required by the browser.
- The application MUST provide a visual state when audio is unavailable or muted.

### Ear Gym

- The MVP MUST include introductory contrast and focused-difference variants within one comparison exercise flow.
- The exercise MUST play two related scale or mode examples.
- Exercises MUST come from the domain comparison catalog, which contains introductory broad contrasts and focused one-degree pairs.
- The user MUST be able to replay both examples before answering.
- The result MUST explain the interval difference.
- A streak of consecutive correct answers MUST be maintained during the session and SHOULD persist locally when storage is available. It resets on an incorrect answer and never leaves the device.

## Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Responsive behavior | Core exploration MUST work from a 320px-wide mobile viewport through desktop widths. |
| Performance | Across 100 changes on the recorded reference desktop fixture, both instrument view models SHOULD be ready within 16 ms at p95 and MUST render from the same scale generation. |
| Initial load | First meaningful interaction SHOULD be possible within about five seconds on a mid-tier phone over a 4G connection. |
| Audio | The product MUST avoid avoidable scheduling jitter by using the audio clock for scheduled events. |
| Accessibility | Core controls and both instrument views MUST have keyboard and screen-reader paths, and information MUST not rely on color alone. |
| Reliability | Theory calculations MUST be deterministic and covered by unit tests. |
| Privacy | The MVP MUST not require personal data or an account. |
| Offline potential | The application SHOULD be structured so a later PWA/offline mode is possible. |
| Internationalization | User-facing copy SHOULD be isolated from music-domain data. |
| Observability | Debug and performance events MUST be structured, privacy-safe, bounded, failure-isolated, and persisted or exported only through interchangeable observability contracts. |

## Acceptance Principles

- A first-time user can reach an audible scale without reading documentation.
- A newcomer can complete Guided Start without knowing note, interval, or mode terminology.
- A user can understand why one mode differs from a close reference.
- The same scale state is represented consistently across piano and guitar.
- The interface remains usable without hover and without relying on a particular screen orientation.
