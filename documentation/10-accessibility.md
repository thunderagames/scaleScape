# Accessibility Requirements

Accessibility is part of the product model because ScaleScape communicates through sound, visual structure, touch, and musical language. No single channel should carry essential meaning by itself.

## Priority Levels

- `P0`: required for the MVP core flow.
- `P1`: required before public release beyond early validation.
- `P2`: useful enhancement after the learning loop is validated.

## Requirements

| Area | Priority | Requirement |
| --- | --- | --- |
| Keyboard operation | P0 | All navigation, selectors, playback controls, Ear Gym answers, piano keys, and guitar note targets have a defined keyboard path. |
| Focus visibility | P0 | Focus must remain visible against the instrument and application background. |
| Color independence | P0 | Interval roles must use labels, symbols, or patterns in addition to color. |
| Touch targets | P0 | Interactive targets MUST be at least 44 by 44 CSS pixels, including enlarged invisible hit areas where visual geometry is smaller. |
| Reduced motion | P1 | Respect `prefers-reduced-motion` and disable pulsing or unnecessary animation. |
| Screen readers | P0 | Announce selected root, mode, note, interval role, playback state, guidance, and exercise feedback. |
| Contrast | P0 | Text MUST meet WCAG AA: at least 4.5:1 for normal text and 3:1 for large text; meaningful controls, focus indicators, and graphical objects MUST meet at least 3:1 against adjacent colors. |
| Color vision | P1 | Provide a palette and symbols that do not depend on red versus green. |
| Captions and text | P0 | Instructional content must be available as text, not audio only. Interactive explanations must expose their caption text to assistive technology. |
| Volume control | P0 | Provide an in-app volume control and visible mute state. |
| Non-audio fallback | P0 | Theory and visual exploration remain available when audio cannot play. |

Keyboard operation means every control is reachable and usable without a pointer. Direct musical shortcuts are optional and never the only path.

## Keyboard and Focus Contract

| Area | Required behavior |
| --- | --- |
| Global controls | Standard Tab order; Enter or Space activates; Escape closes overlays and restores focus to the trigger. |
| Piano | One Tab stop enters the instrument; arrow keys move to adjacent visible keys; Enter or Space previews; Home returns to the visible root. |
| Guitar | One Tab stop enters the instrument; left/right changes fret, up/down changes string; Enter or Space previews; Home moves to the open string in the current row. |
| Ear Gym | Answers form one keyboard group; arrows change choice; Enter or Space submits; feedback receives programmatic focus after submission. |
| Responsive changes | Focus remains on the same musical note when possible; otherwise it moves to the instrument container with an announcement. |

Selection, focus, and playback are separate states and MUST be exposed separately to assistive technology. Repeated note previews use a polite live region; errors and exercise results use an assertive announcement.

## Instrument Semantics

Interactive notes should expose:

- Note name.
- Octave where relevant.
- Degree and interval.
- Scale membership.
- Musical role such as tonic or characteristic degree.
- Current selected or focused state.

The screen reader representation should be concise enough for navigation. A user should not have to listen to a long paragraph for every fret.

## Visual Encoding

The visual system may use color, but each important category should also have at least one of:

- Text label.
- Shape or icon.
- Pattern or border treatment.
- Position and legend.

The characteristic degree should not be defined only by a gold color or glow.

## Mobile Accessibility

- Avoid requiring precision dragging for essential actions.
- Do not rely on hover tooltips.
- Preserve logical focus after horizontal instrument scrolling.
- Offer a lower-density instrument view if the full fretboard is difficult to navigate.
- Keep controls reachable in both portrait and landscape orientations.

## Validation

Accessibility checks should combine automated audits with manual testing:

1. Keyboard-only completion of the Explore flow.
2. Screen-reader completion of Guided Start, both instruments, and one Ear Gym exercise.
3. High-contrast and color-vision review.
4. Reduced-motion review.
5. Touch exploration on a small mobile viewport.
6. Focus preservation after scrolling, orientation changes, overlays, and responsive layout changes.
