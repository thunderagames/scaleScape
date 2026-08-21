# MVP Scope

The MVP validates whether ScaleScape's audio-first, interval-based exploration creates a useful musical insight in a short session.

## MVP Outcome

A user starts with Guided Start or Explore Directly, hears a scale in tonic context, interacts with its changed or characteristic notes, and completes a short comparison without requiring prior theory knowledge.

## Included Capabilities

### Explore View

- Root selector for twelve pitch classes.
- Mode selector for major, natural minor, harmonic minor, melodic minor, Dorian, Phrygian, Lydian, Mixolydian, Locrian, major pentatonic, minor pentatonic, blues, major blues, chromatic, whole tone, diminished, augmented, Phrygian dominant, Hungarian minor, Hungarian major, Byzantine, Enigmatic, Prometheus, Persian, Egyptian, Oriental, Japanese, Hirajoshi, Romanian, Man Gong, Ritusen, dominant pentatonic, Voodoo, Neapolitan major, Neapolitan minor, Neapolitan Prometheus, Petrushka, Locrian natural 6, Ionian augmented, Lydian #2, Ultralocrian, Dorian b2, Lydian augmented, Lydian dominant, Mixolydian b6, Aeolian b5, altered, harmonic major, Iwato, Hon Kumoi Shiouzhi, Kumoi, Kumoi (common), Insen, Pelog, Chinese pentatonic, Enigmatic (Verdi), Prometheus (Scriabin), Istrian, Baake's tritonic, Far East, and approximate Slendro. Major pentatonic serves as a familiar, low-friction reference and is defined by its omitted fourth and seventh degrees; minor pentatonic uses degrees 1, 3, 4, 5, and 7.
- Interval-based highlighting.
- Tonic drone and optional tonic-fifth pedal.
- Interactive piano.
- Interactive six-string guitar fretboard.
- Note detail panel with name, degree, interval, and role.
- Scale formula panel with degree formula and full-octave interval structure; the mode selector groups formulas by category.

### Ear Gym View

- One A/B comparison exercise.
- Introductory broad contrast: major versus natural minor.
- Focused one-degree comparisons: major versus Mixolydian, major versus Lydian, Dorian versus natural minor, and natural minor versus Phrygian.
- Replay controls.
- Immediate explanation after the answer.
- Local streak of consecutive correct answers.

### Shell and Preferences

- Responsive navigation between Explore and Ear Gym.
- Guided Start as the primary first-session action, with Explore Directly always available.
- Mute control and audio status.
- Instrument preference stored locally.
- No account required.

## Explicitly Excluded

- Microphone pitch detection.
- MIDI input and performance grading.
- Full notation/pentagram editor.
- Generated backing tracks.
- MIDI or audio export.
- User accounts and server-side progress.
- Social sharing, leaderboards, and community content.
- AI-generated lessons.
- More than the minimum supported scale set.
- Alternate and custom guitar tunings; the MVP ships standard tuning only.
- Native mobile applications.

## MVP Screen Map

| Screen | Purpose | Required |
| --- | --- | --- |
| Explore | Main learning and instrument interaction loop. | Yes |
| Ear Gym | Short recognition practice. | Yes |
| Help | Contextual interaction help and optional theory detail. | Integrated, not a required reading screen |
| Settings | Audio, accessibility, and instrument preferences. | Minimal |

## Definition of Done

- The theory engine produces correct scale instances for every supported root and mode.
- Piano and guitar show the same scale state and interval roles.
- The core flow works from a 320px mobile viewport through a desktop viewport.
- Audio controls work in at least the agreed modern browser matrix.
- Keyboard and screen-reader paths cover the main controls, both instrument views, and Ear Gym feedback.
- A first-time user can complete one comparison exercise without facilitator help.
- A first-time user can complete Guided Start without understanding theory terminology in advance.
- Automated tests cover theory calculations and key state transitions.
- Known browser limitations are documented instead of hidden.
- Local diagnostic mode exports sanitized JSONL only after an explicit user action.
- Logging disabled or sink failure does not break startup, playback, navigation, or exercises.
- Production observability stays within the documented performance budget.

## Current Implementation Status

The core client-side MVP interaction slice is implemented. Release readiness still depends on manual browser/device validation, usability sessions, and recording known limitations in the browser matrix.

## Delivery Estimate

| Stage | Expected effort |
| --- | --- |
| Phase-0 feasibility POCs | 2-3 weeks |
| MVP implementation after POCs | 5-7 weeks |
| First usability refinement | 1-2 weeks |

These estimates assume one developer, 20-30 focused hours per week, a client-side MVP, and no major design-system or backend work. The two-week validation plan in the POC document is the focused schedule; the third week in the Phase-0 estimate is buffer for iterating on test findings.
