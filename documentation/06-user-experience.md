# User Experience Specification

The interface is mobile-first, audio-aware, and designed for short sessions. Every important action must work with touch, mouse, or keyboard where the interaction makes sense.

## Primary Flow

```text
Guided Start: Open app -> Hear A/B -> Manipulate the change -> Reveal the label -> Explore an instrument
Explore Directly: Open app -> Choose root and mode -> Start context -> Explore intervals -> Try Ear Gym
```

Guided Start is visually primary on a first visit. Explore Directly is always visible and becomes the returning-user default when the learner previously chose it.

## Explore Layout

### Mobile

- A compact header contains the root, mode, audio state, mute, and navigation.
- Before interaction, show only the selected sound context and one primary action. Reveal the theory summary after first playback or on request.
- One instrument is primary at a time; the user switches between piano and guitar.
- The guitar fretboard scrolls horizontally. It must not interpret normal scrolling as note presses.
- The piano shows a manageable range and supports horizontal navigation for more keys.
- The note detail panel remains available without requiring hover.

### Desktop

- Piano and guitar may appear side by side.
- The selected scale and interval legend remain visible while the user explores.
- The explanation panel may remain docked instead of appearing as a modal.

## Viewport Strategy

The layout is mobile-first: each screen is designed for the smallest supported viewport and enhanced upward.

| Band | Width | Layout behavior |
| --- | --- | --- |
| Phone | 320 to 479px | One instrument visible at a time; at least one piano octave or open strings plus four frets visible; explanation panel as an overlay; instrument-only horizontal scrolling. |
| Tablet | 480 to 1023px | At 480px, at least one piano octave or open strings plus six frets are visible; additional range uses instrument-only scrolling. From 768px, two piano octaves or open strings plus eight frets may be visible. The explanation panel may dock when space permits. |
| Desktop | 1024px and up | Full MVP ranges (`C3` to `C5`, frets 0 to 12) visible; piano and guitar may appear side by side; legend and explanation remain visible. |

Rules:

- Touch targets never shrink to fit a narrower band; visible range and density are reduced instead.
- Layout decisions are driven by available space, not by device detection.
- Portrait and landscape orientations are both supported on every band.
- The page itself MUST NOT overflow horizontally; only the bounded instrument viewport may scroll.
- Changing orientation MUST preserve root, mode, selected note, exercise progress, and playback state.

## Interaction Rules

- No essential information may depend on hover.
- Every playable note must have a visible focus state.
- A press should provide immediate visual confirmation, with audio scheduled separately.
- A note should not be toggled accidentally during horizontal scrolling.
- A muted state must be visible and reversible.
- Audio startup must explain any browser gesture requirement without blocking the rest of the interface.
- Long content should not be required to start exploring.
- Didactic text appears as short captions attached to the element being explained, during or after interaction, never as a prerequisite reading block.
- Comparisons are taught with an audible toggle (for example, switching between two sixth degrees over the drone), not with paragraphs.

## Instrument Interaction

### Piano

- White keys and black keys need distinct visual and semantic targets.
- The black-key hit area should be forgiving on touch devices.
- The selected scale should be visible without making all keys unreadable.
- The keyboard should support a keyboard mapping on desktop as an optional shortcut.

### Guitar Fretboard

- The MVP displays six strings and a bounded fret range.
- The user can scroll to additional frets on narrow screens.
- The app should distinguish open strings, fretted notes, and the current octave.
- The active note must remain legible at common mobile zoom levels.
- A fallback single-string view should remain possible if the full fretboard is too dense.

## First-Session Guidance

The interface should use progressive disclosure:

1. Show root, mode, and a single play action.
2. Ask the learner to hear or manipulate one difference using plain language.
3. Introduce interval roles after the first playback or selection.
4. Introduce characteristic-degree language only after the changed note is experienced.
5. Offer free exploration and Ear Gym without forcing either path.

## Error and Empty States

| Situation | User-facing behavior |
| --- | --- |
| Audio unavailable | Keep visual exploration active and explain the browser limitation. |
| Audio unavailable in Ear Gym | Disable scored listening exercises, explain that they require sound, and offer an unscored visual comparison. |
| Audio muted | Show the muted state and preserve all non-audio functions. |
| No mode selected | Default to root C and major, the most familiar reference, and explain what is currently selected. The default MAY change based on usability testing. |
| Narrow viewport | Reduce visible range and offer horizontal navigation rather than shrinking targets. |
| Keyboard focus | Keep focus visible and announce the selected note or control. |

## Three-Minute Example

1. The user selects E and Dorian.
2. The app plays E Dorian over an E drone.
3. The user plays notes and selects C#.
4. The app identifies C# as the major sixth and the characteristic degree for this comparison.
5. The user switches from piano to guitar and finds the same pitch class.
6. Ear Gym compares E Dorian with E natural minor.
