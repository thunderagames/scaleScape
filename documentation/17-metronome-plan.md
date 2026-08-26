# Metronome Development Plan

ScaleScape will add one global, accessible metronome for practice with any visible instrument. Each instrument card will expose the same quick toggle, while Settings will own the single persisted BPM configuration. This keeps the tool close to the instrument without creating independent clocks or conflicting preferences.

## Quick Path

1. Open Settings and set a whole-number tempo from 30 to 250 BPM.
2. Save the configuration.
3. Use the metronome button in the piano, guitar, bass, or ukulele card to start or stop the same global click.
4. Continue playing notes or scales while the click runs; stop it from any instrument card.

## Scope

| Included in this increment | Explicitly out of scope |
| --- | --- |
| One global click track | Time signatures, accents, subdivisions, and count-ins |
| Persisted whole-number BPM from 30 through 250 | Tap tempo and MIDI sync |
| Slider, numeric BPM display, and +/- 1 BPM controls in Settings | A standalone metronome screen or floating global player |
| One analog-metronome toggle in every visible instrument card | Per-instrument BPM, volume, or playback state |
| Shared master volume/mute behavior | Audio recording, performance grading, and microphone input |
| English and Spanish copy, keyboard support, and screen-reader state | Visual beat animation or pendulum animation |

`tempo_bpm`, which currently controls scale playback speed, remains unchanged. The metronome receives its own `metronome_bpm` preference so practicing tempo does not unexpectedly change scale playback tempo.

## Product Decisions

| Topic | Decision |
| --- | --- |
| Ownership | There is exactly one metronome state and one scheduler for the application. Instrument buttons are equivalent entry points to it. |
| Default | 120 BPM. |
| Valid range | Integer BPM values inclusive from 30 to 250. |
| Fine adjustment | The decrease and increase buttons change the pending BPM by one. They disable at 30 and 250 respectively. |
| Slider | A range input with `min=30`, `max=250`, and `step=1`; it and the numeric display always show the same pending value. |
| Configuration commit | Settings edits are a draft. Save persists the BPM and applies it; Close/Cancel discards unsaved BPM edits. |
| Active tempo change | Saving a new BPM while the metronome is running stops its current schedule and starts a single new schedule at the saved BPM. |
| Playback lifecycle | BPM is persisted. Playback is not: every new browser session starts with the metronome stopped. |
| Audio relationship | The click shares the existing master gain, volume, mute setting, and Web Audio unlock flow. It can run while scale, chord, and note-preview playback occur. |
| Stop behavior | Any metronome toggle stops the global click. Hiding the page stops all audio, including the metronome. |

## Experience

### Settings Configuration

Add a **Metronome** group to the existing Settings dialog, near the other audio controls. It contains:

1. A labelled output such as `120 BPM`. It is the authoritative visible value and has polite live announcement when the value changes.
2. A labelled range input for BPM. The accessible value text includes the unit, for example `120 BPM`.
3. A decrease button with a minus icon and an accessible name such as `Decrease BPM`.
4. An increase button with a plus icon and an accessible name such as `Increase BPM`.

The range and step buttons operate on a pending value initialized from the saved setting whenever Settings opens. The existing Save action commits that value with the rest of the Settings form. If audio is unavailable, configuration remains usable; only a subsequent start attempt reports failure through the normal playback state.

### Instrument Quick Controls

Every instrument card, including piano, guitar, bass, and ukulele, receives the same compact metronome control in its heading.

- The control uses an inline SVG analog-metronome icon, not a text-only play triangle.
- The analog icon remains recognizable in both states; the active state has a distinct visual treatment and `aria-pressed="true"`.
- Its accessible label and tooltip change between `Start metronome` and `Stop metronome`.
- A short visible legend is rendered with the control: `Configure BPM in Settings.` It is localized and does not rely on hover.
- Starting from any card updates every card to the active state. Stopping from any card resets every card.

The quick control uses the saved BPM. Opening Settings is therefore the only way to change tempo, while starting and stopping remain immediately accessible beside the instrument being practiced.

## Architecture

### State and Persistence

Add a `MetronomeBpm` value type or validation helper separate from the existing limited `TempoBpm` union. It must accept only finite integers in the inclusive 30--250 range.

Add `metronome_bpm` to `AppSettings` with a default of `120`. The current local-storage object accepts legacy records, so records without this property must normalize to `120`. Invalid, fractional, out-of-range, or non-numeric persisted values must also normalize to `120` without blocking startup.

The current `scalescape.settings.v1` key can remain in place because the settings normalizer already supports optional fields and defaults. No migration or backward-compatibility layer beyond that normalizer is required.

### Audio Contract

Extend the playback contract with explicit metronome operations and observable state. The final method names can follow repository conventions, but the contract must support these behaviors:

```text
startMetronome(bpm: MetronomeBpm) -> Promise<{ ok: boolean }>
stopMetronome() -> Promise<void>
getPlaybackState() -> { ..., is_metronome_playing: boolean }
subscribePlaybackState(listener) -> unsubscribe
```

The existing `stopAll()` remains the full audio shutdown used for lifecycle cleanup. Add a melodic-only cancellation path for scale, chord, and note-preview controls so those operations do not unintentionally stop an active practice click. Likewise, starting a scale, chord, or note preview must cancel only prior melodic scheduling, not the metronome channel.

The browser adapter keeps separate node/timer ownership and generation counters for musical playback and metronome playback. This is required because the current scheduler cancels all active nodes together; reusing that collection would make scale playback and the metronome interrupt one another.

### Timing and Click Sound

The metronome must use the Web Audio clock, not DOM rendering timing, as its musical clock.

1. A user action unlocks or resumes `AudioContext`, following the existing browser policy.
2. `startMetronome` schedules the first click slightly in the future on `AudioContext.currentTime`.
3. A short look-ahead loop schedules upcoming clicks on the audio timeline. A timer may wake the scheduler, but it must not be the source of beat timing.
4. Each click uses a brief synthesized percussive envelope routed through the existing master gain. No audio asset is needed for this first increment.
5. Stop increments the metronome generation, clears its look-ahead wake-up, and stops/disconnects its scheduled sources safely.

At 250 BPM, beat intervals are 240 ms; the look-ahead window and wake-up cadence must be chosen so multiple clicks cannot be scheduled for the same beat and normal browser timer jitter does not create audible drift. Repeated Start requests while already active must be idempotent: one scheduler, one click per beat.

`visibilitychange` must stop both channels and publish `is_metronome_playing: false`. Master mute and volume updates apply to the metronome immediately because its nodes route through the existing master gain.

### UI Composition

Keep the repeated instrument toggle as a small UI component or shared renderer so its SVG, labels, active styling, and event behavior cannot drift between four cards. The Explore screen owns placement in the four card headings; it reads the shared playback state and invokes the playback contract. The Settings dialog remains in the application shell because that is where persisted global configuration already lives.

No metronome logic belongs in individual instrument view models. Instruments only provide placement for a global practice tool.

## Localization

Add equivalent English and Spanish translation entries for:

| Purpose | English | Spanish |
| --- | --- | --- |
| Settings group | Metronome | Metrónomo |
| BPM label | Tempo (BPM) | Tempo (BPM) |
| Start action | Start metronome | Iniciar metrónomo |
| Stop action | Stop metronome | Detener metrónomo |
| Decrease action | Decrease BPM | Disminuir BPM |
| Increase action | Increase BPM | Aumentar BPM |
| Instrument legend | Configure BPM in Settings. | Configura los BPM en Ajustes. |

The BPM number and unit remain readable regardless of language. The icon is decorative only; the button label supplies its meaning.

## Accessibility Requirements

- All metronome controls meet the existing 44 by 44 CSS-pixel touch-target minimum.
- The range input, both step buttons, and every instrument toggle are keyboard reachable and operable with standard keys.
- The BPM output is associated with its range input and announced politely after a slider or step-button change.
- Toggle state is exposed with `aria-pressed`, and its accessible name changes to Start or Stop as appropriate.
- The visible legend communicates where configuration lives without requiring a tooltip or sound.
- Audio failure does not present an active toggle state. The visual instrument experience remains fully usable.
- The active style has sufficient contrast and does not rely solely on color.
- No continuous beat animation is introduced in this increment.

## Test Plan

| Layer | Required coverage |
| --- | --- |
| Metronome BPM validation | Defaults to 120; accepts 30 and 250; rejects fractional, out-of-range, and non-numeric values. |
| Settings store | Persists a valid BPM; restores it; defaults missing or invalid legacy values to 120 without affecting other preferences. |
| Browser playback | Starts only after audio unlock; schedules a click; does not create a second scheduler when started twice; stops and clears scheduled click sources; exposes state changes; respects master mute/volume; stops when the document becomes hidden. |
| Channel isolation | A running metronome survives scale, chord, and note-preview starts/stops; full shutdown stops both melodic and metronome channels. |
| Explore UI | Renders one toggle in each of the four instrument cards; toggling any one updates all four; labels and pressed state reflect playback confirmation; the settings legend is localized. |
| Settings UI | Slider and output stay synchronized; +/- changes by one; boundary controls disable; Save persists the draft; Close/Cancel leaves the saved BPM unchanged. |
| Manual browser pass | Validate start/stop, 30/120/250 BPM, mute/volume, hidden-tab stop, and concurrent note playback on the existing P0 mobile and desktop browser matrix. |

## Acceptance Checklist

- [ ] A user can select any whole BPM from 30 through 250 in Settings.
- [ ] The slider, numeric BPM output, and step buttons remain synchronized and enforce both bounds.
- [ ] The saved BPM is restored after reload; metronome playback is stopped after reload.
- [ ] Piano, guitar, bass, and ukulele each expose an analog-metronome quick toggle and the Settings legend.
- [ ] All four toggles represent one shared running/stopped state.
- [ ] The click remains steady and singular at 30, 120, and 250 BPM.
- [ ] Notes, scales, and chords can be heard while the metronome runs.
- [ ] Stop from an instrument toggle and page-hidden handling leave no audible click.
- [ ] Master mute and volume affect the click, and unavailable audio never reports a false running state.
- [ ] English and Spanish copy, keyboard behavior, focus treatment, and touch targets meet the existing application requirements.

## Implementation Order

1. Add the bounded metronome BPM value and settings normalization/persistence tests.
2. Extend the playback port and browser adapter with isolated metronome scheduling, state publication, and audio tests.
3. Add the Settings group, draft BPM interaction, localized copy, and UI tests.
4. Add the shared analog-toggle rendering to all instrument cards and synchronize it to playback state.
5. Run `npm run check`, then complete the targeted manual browser and accessibility passes.

## Expected Files

| Path | Change |
| --- | --- |
| `src/metronome/` | New pure BPM validation/value module and tests. |
| `src/settings/settings-store.ts` | Persist and normalize `metronome_bpm`. |
| `src/settings/settings-store.test.ts` | Cover defaults, validation, and persistence. |
| `src/audio/playback-port.ts` | Add metronome commands and observable running state. |
| `src/audio/browser-playback.ts` | Add the isolated audio-clock scheduler and click voice. |
| `src/audio/browser-playback.test.ts` | Cover scheduler lifecycle and channel isolation. |
| `src/settings/localization.ts` | Add English and Spanish metronome copy. |
| `src/ui/app-shell.ts` | Render and commit the Settings configuration group. |
| `src/ui/explore-screen.ts` and a small UI control module if needed | Render four synchronized analog-metronome toggles. |
| `src/ui/*.test.ts` | Cover Settings and instrument-toggle behavior. |
| `src/styles.css` | Add responsive active, legend, range, and focus styles consistent with existing controls. |

## Open Extension Points

Future work may add time signatures, accented downbeats, subdivisions, tap tempo, count-ins, alternate click sounds, MIDI sync, or a visual beat indicator. None of these should change the one-global-metronome ownership or the isolated audio-channel boundary established by this increment.
