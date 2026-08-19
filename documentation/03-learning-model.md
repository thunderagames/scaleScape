# Learning Model

ScaleScape uses guided discovery rather than passive explanation. The same musical model supports newcomers and experienced learners: newcomers receive progressive guidance, while experienced learners can enter free exploration immediately.

## Core Sequence

### 1. Listen

Play a scale over one of these contexts:

- Tonic drone.
- Tonic and fifth pedal.
- A small mode-appropriate progression when available.

The first exposure must not require theory vocabulary or instrument knowledge.

### 2. Recognize

Ask a lightweight question:

- Which of two modes did you hear?
- Which note changed?
- Which sound feels brighter, darker, or more open?

The answer must be supported by immediate replay and explanation, not only a score.

### 3. Locate

Reveal the scale on the selected instrument. Highlight interval functions with labels and symbols in addition to color.

### 4. Play

Allow free exploration. A learner can tap or click notes to hear them against the selected context.

### 5. Contextualize

Reveal the defining relationship through interaction first, then name it. The learner hears and manipulates the difference before reading about it:

1. Highlight the characteristic degree on the instrument.
2. Let the learner toggle between the two compared variants over the drone (for example, C and C# in E).
3. Attach one short caption that names what just happened. For example:

> Dorian raises the sixth degree. That single note changes the color.

Text is the caption of an experience, never a prerequisite for it.

## Progressive Disclosure

| Layer | What the learner sees | When it appears |
| --- | --- | --- |
| Experience | Play, replay, A/B toggle, visible changed note | Immediately |
| Plain meaning | One short caption such as "one note moved higher" | After the learner hears or selects the change |
| Theory label | Degree, interval name, formula, and spelling | On reveal or explicit request |
| Advanced detail | Parent scale, mode degree, comparison data | In an optional detail view |

The app MUST not ask the learner to choose a level. Guidance is contextual and can be skipped, replayed, or expanded.

## Teaching Scope for MVP

The MVP should focus on:

- Major scale.
- Natural minor.
- Dorian.
- Phrygian.
- Lydian.
- Mixolydian.
- Locrian.
- Major pentatonic as a familiar reference: a low-friction entry point defined by its omitted fourth and seventh degrees.

The MVP should not attempt to teach every possible scale formula.

## Recognition Progression

| Level | Task | Example |
| --- | --- | --- |
| 1 | Hear a scale against a tonic drone | Major or natural minor? |
| 2 | Compare related modes with the same root | Dorian or natural minor? |
| 3 | Identify the changed degree | Which note creates the difference? |
| 4 | Locate the degree on an instrument | Find the major sixth in Dorian. |
| 5 | Apply the degree over context | Use the characteristic note and hear its color. |

Ear Gym uses introductory contrast exercises for level one and focused one-degree exercises for levels two and three. Explore supports levels three through five through interactive reveals and instrument mapping.

## Feedback Rules

- Explain the musical reason for an answer.
- Allow replay before forcing another attempt.
- Do not punish exploration in the free-play view.
- Separate recognition confidence from theoretical naming.
- Avoid presenting emotional labels as universal facts. Use them as optional descriptions, not definitions.
- Keep didactic text to one short caption per reveal; deeper explanation is optional and collapsible.
- Every caption MUST be attached to something the learner can hear and manipulate.

## Three-Minute Learning Session

1. The learner chooses E and a minor color.
2. The app plays E natural minor and E Dorian over the same drone.
3. The learner chooses which version sounds more open.
4. The app reveals that Dorian raises the sixth degree from C to C#.
5. The learner finds C# on piano and guitar.
6. The learner replays the drone and hears the characteristic note in context.

## Learning Validation

The product is teaching successfully when a learner can transfer the concept to a new root, not only repeat the example used in the lesson.
