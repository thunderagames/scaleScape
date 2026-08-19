# Audio and Browser Compatibility

Audio is central to ScaleScape, but browser audio behavior varies by device, operating system, and user settings. The application must degrade clearly instead of pretending that audio is always available.

## Audio Responsibilities

- Start or resume the audio context after a permitted user gesture.
- Schedule scale notes using the audio clock.
- Provide a stable tonic drone and optional tonic-fifth pedal.
- Stop scheduled events when the user changes context or presses stop.
- Avoid overlapping voices that make simple examples unclear.
- Keep the visual playback state synchronized closely enough for learning.

## Audio Contract

Playable requests MUST include an absolute register and never rely on an optional octave:

```text
PlayablePitch = { pitch_class, octave, frequency }
AudioLifecycle = locked | ready | suspended | unavailable | error
ChannelPlayback = idle | starting | playing | stopping
AudioSnapshot = {
  lifecycle,
  channels: { context, preview, exercise },
  muted,
  volume,
  error
}
```

- `unlock()` and all playback starts are asynchronous and return explicit success or failure results.
- Audio state is observable; UI state changes only from confirmed engine state, never from optimistic assumptions.
- Every context change activates a larger generation identifier before new playback begins. Activating it cancels prior-generation channels.
- Every playback start receives its generation identifier from the application service; requests that do not match the active generation MUST be rejected, including delayed asynchronous requests.
- The drone request includes root, octave/register, gain, and optional fifth voicing.
- `stopAll()` completes only after scheduled nodes have been disconnected or safely faded.

## MVP Sound Design

The MVP should use a simple synthesized timbre rather than a large sample library. This reduces asset size, licensing questions, and loading complexity.

Initial sound requirements:

- Clear attack for individual notes.
- Sustained drone that does not overpower the learner.
- Distinct but consistent tone for examples.
- Adjustable master volume.
- Mute without losing the current learning state.

## Playback Defaults

Initial values, to be tuned during POC 0:

| Parameter | Default |
| --- | --- |
| Scale playback tempo | About 72 BPM, one note per beat. |
| Note duration | Roughly 80 percent of the beat, with a gentle release. |
| Drone register | Tonic in a low octave, below the played scale. |
| Drone level | Clearly quieter than the played notes. |
| Scale register | A comfortable middle octave, consistent across examples. |

These defaults are product decisions, not library commitments, and MUST remain easy to adjust.

## Browser Constraints

The implementation must account for:

- Autoplay restrictions that require a user gesture.
- Different mobile audio latency and power behavior.
- Background tab throttling.
- Device volume and browser mute behavior.
- Older browsers without the required Web Audio features.
- Touch and pointer event differences.

## Browser Matrix for Validation

At implementation start, supported versions are the current and previous major browser versions available on this P0 reference set. Each validation cycle MUST record the exact browser build, OS version, device/model (or desktop hardware class), and viewport in a dated test fixture:

| Environment | Priority |
| --- | --- |
| Chrome on a mid-range Android phone released within the previous four years | P0 |
| Safari on the oldest iPhone/iOS version in the supported-version window | P0 |
| Chrome on desktop at 1366x768 or larger | P0 |
| Safari on macOS | P1 |
| Firefox on desktop | P1 |
| Edge on desktop | P1 |

## Fallback Behavior

| Condition | Behavior |
| --- | --- |
| Audio context suspended | Show a clear Start Audio action and continue visual exploration. |
| Audio unavailable | Keep theory and instrument views usable; explain the limitation. |
| User mutes audio | Preserve all interactions and show an obvious muted state. |
| Tab becomes hidden | Stop or safely pause scheduled playback and reset visual playback state. |
| High latency device | Prefer short, explicit interactions over continuous real-time feedback. |

## Audio Acceptance Criteria

- A user gesture can reliably start audio in every P0 environment.
- Play and stop do not leave hanging tones.
- Changing root or mode invalidates old scheduled playback.
- A drone remains stable during a short exploration session.
- The interface does not claim that a note was played when audio is muted or unavailable.
- Audio behavior is manually tested on both a small iOS viewport and a common Android viewport.

These criteria are verified with concrete scenarios:

- In 20 consecutive unlock/start/stop cycles per P0 environment, every cycle reaches `ready` or returns a visible failure; no cycle remains in an unknown state.
- After stop, context change, or hidden-tab handling, no audible voice remains after a 100 ms release window.
- A test marker driven by the scheduled audio timestamp appears within 100 ms of that timestamp in instrumented P0 runs; a manual pass confirms that feedback does not feel disconnected from sound.
- A three-minute drone session has no unintended restart, stuck voice, or unhandled error.

Each release candidate stores a dated matrix report under `documentation/validation/browser-matrix/`. The report MUST include the tested build identifier, exact fixture data, pass/fail for every acceptance scenario above, automated logs where available, manual tester/date, and known limitations. P0 reports must test the release-candidate build and be no older than seven days at release time.

## Important Boundary

ScaleScape is not a pitch-detection or performance-grading product in the MVP. It does not need microphone input, MIDI, onset detection, or low-latency hardware monitoring.
