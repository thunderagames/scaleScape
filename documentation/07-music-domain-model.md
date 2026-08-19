# Music Domain Model

The music domain must be independent from the UI and audio implementation. It should be deterministic, explicit, and easy to test.

## Core Concepts

### Pitch Class

A pitch class represents one of the twelve chromatic positions independent of octave.

```text
PitchClass = 0..11
```

The domain should retain a display spelling when theory context matters, such as `C#` versus `Db`.

### Note

A note is a pitch class plus an optional octave and display spelling.

```text
Note = {
  pitch_class,
  octave,
  spelling
}
```

### Interval

An interval describes the relationship from a scale root to a note.

```text
Interval = {
  semitones,
  degree,
  label,
  quality
}
```

The MVP needs enough interval information to distinguish scale membership, chord tones, and characteristic degrees.

### Scale Formula

A scale formula is an ordered set of degrees and semitone offsets from a root.

```text
ScaleFormula = {
  id,
  name,
  degrees,
  semitone_offsets,
  parent_scale,
  mode_degree,
  characteristic_degrees,
  degree_roles
}
```

### Scale Instance

A scale instance applies a formula to a root.

```text
ScaleInstance = {
  root,
  formula,
  notes,
  interval_map,
  spelling_context
}
```

## MVP Formulas

| Scale or mode | Semitone offsets |
| --- | --- |
| Major | 0, 2, 4, 5, 7, 9, 11 |
| Natural minor | 0, 2, 3, 5, 7, 8, 10 |
| Dorian | 0, 2, 3, 5, 7, 9, 10 |
| Phrygian | 0, 1, 3, 5, 7, 8, 10 |
| Lydian | 0, 2, 4, 6, 7, 9, 11 |
| Mixolydian | 0, 2, 4, 5, 7, 9, 10 |
| Locrian | 0, 1, 3, 5, 6, 8, 10 |
| Major pentatonic | 0, 2, 4, 7, 9 |

## Reference Modes and Characteristic Degrees

Every explanation and comparison is anchored in a reference mode. The diatonic modes form a brightness chain in which each adjacent pair differs by exactly one degree:

```text
Lydian -> Major -> Mixolydian -> Dorian -> Natural minor -> Phrygian -> Locrian
(brighter ---------------------------------------------------> darker)
```

| Scale or mode | Focused reference | Characteristic difference |
| --- | --- | --- |
| Major | Mixolydian | Major seventh |
| Lydian | Major | Augmented fourth |
| Mixolydian | Major | Minor seventh |
| Dorian | Natural minor | Major sixth |
| Natural minor | Dorian | Minor sixth |
| Phrygian | Natural minor | Minor second |
| Locrian | Phrygian | Diminished fifth |
| Major pentatonic | None in focused exercises | Omits the fourth and seventh degrees relative to Major |

Focused references differ by exactly one degree. Major versus natural minor remains an introductory broad contrast and is explicitly not a focused comparison pair.

## Domain Invariants

- A scale instance MUST preserve the formula's degree order.
- A scale instance MUST contain no duplicate pitch class within one octave.
- The root MUST be degree one.
- Interval labels MUST be derived from domain data, not UI strings.
- Characteristic degrees MUST be explicit metadata and not inferred only from color.
- Note spelling MUST follow the selected theoretical context where applicable.
- Audio frequency calculation MUST be downstream from pitch identity, not the source of truth.

## Interval Roles

Each note in a scale instance carries one or more semantic roles. A `primary_role` controls visual emphasis; `roles` preserves every musically relevant meaning.

| Role | Meaning |
| --- | --- |
| Tonic | Degree one; the point of rest. |
| Chord tone | Degrees one, three, and five as spelled by the formula; together they define the tonic triad, which may be major, minor, diminished, or augmented. |
| Characteristic | The degree that distinguishes the mode from its reference mode. |
| Color tone | Any remaining degree; it adds flavor without defining the mode on its own. |

When roles overlap, visual precedence is `tonic` -> `characteristic` -> `chord_tone` -> `color_tone`. For example, Locrian's diminished fifth is both a chord tone and characteristic. Roles MUST come from formula metadata. Instrument views and explanations MUST NOT derive roles locally.

## Learning Exercise Model

Exercises are domain data, not UI logic.

```text
FocusedComparison = {
  id,
  formula_a,
  formula_b,
  differing_degree,
  level
}

BroadContrast = {
  id,
  formula_a,
  formula_b,
  differing_degrees,
  level
}

Exercise = {
  comparison,
  root,
  prompt_content_id,
  correct_answer,
  explanation_content_id
}
```

- A `FocusedComparison` MUST differ by exactly one degree, and `differing_degree` MUST match both formulas' metadata.
- A `BroadContrast` MAY differ by several degrees but MUST NOT ask the learner to identify one characteristic degree before the reveal.
- Major pentatonic is an exploration reference and is excluded from scored comparison exercises in the MVP.
- `level` maps to the recognition progression defined in the learning model.
- Domain exercise data contains content identifiers, never rendered copy.
- A streak is the count of consecutive correct answers. It resets on an incorrect answer, is maintained in session state, and may be persisted by the application layer.

## Instrument Mapping

Instrument modules consume `ScaleInstance` data and map it to positions. The theory domain supplies pitch identity and intervals but owns no fret, key, geometry, viewport, or rendering logic.

### Guitar

The guitar module's pure mapping requires:

- String tuning.
- Fret number.
- Pitch class and octave.
- Position geometry.

The MVP uses standard tuning (`E2 A2 D3 G3 B3 E4`) and a fret range of 0 to 12. The mapping MUST accept tuning as input data instead of hard-coding standard tuning, so alternate and custom tunings can be added in a later release without changing the domain model.

### Piano

The piano module's pure mapping requires:

- Key position.
- Pitch class and octave.
- Natural or accidental display.
- Visible keyboard range.

The default visible range is two octaves (`C3` to `C5`), with navigation available beyond it.

The instruments MUST NOT contain separate copies of scale-formula or interval logic.

## Musical Naming Policy

User-facing explanations may use both interval labels and plain language. Emotional descriptions are optional associations and MUST NOT be presented as objective definitions of a mode.

## Root Spelling Policy

The root selector offers the twelve pitch classes with familiar default labels:

```text
C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B
```

These labels are presentation defaults, not permanent spelling contexts. The theory engine MUST choose a formula-compatible enharmonic root spelling for generated notes. If every conventional spelling requires an uncommon accidental, the engine keeps the theoretically correct spelling and the UI MAY also show an enharmonic plain-language alias. Tests assert interval and letter-name correctness; they do not forbid double accidentals globally.
