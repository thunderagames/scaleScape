# Validation and Proofs of Concept

Phase 0 exists to test the risks that could invalidate the product before the full MVP is built.

## Validation Questions

1. Can the theory engine represent supported modes correctly and explain their interval differences?
2. Can a mobile user interact with a fretboard without accidental notes or unusable targets?
3. Can the browser audio flow provide clear, controllable examples on P0 devices?
4. Do synchronized piano and guitar views communicate one shared musical structure?
5. Does the learning loop create an insight rather than only a visually attractive diagram?

## POC 0: Theory Engine and Basic Audio

### Scope

- Generate scale instances from a root and formula.
- Return degrees, interval labels, note spellings, and characteristic degrees.
- Play one ascending scale over a simple drone.

### Success Criteria

- All eight MVP formulas pass deterministic tests.
- Contextual spellings preserve interval letter names for all eight formulas across all twelve pitch classes; uncommon accidentals are surfaced correctly rather than silently respelled.
- The browser can start, stop, and replay audio after a user gesture.
- An automated contract test covers all eight formulas across all twelve roots. Every scheduled pitch uses the expected octave/register and is within 0.1 cent of the frequency derived from the generated note. Manual playback on each P0 browser covers at least five representative roots.

### Expected Effort

Three to five focused days.

## POC 1: Responsive Guitar Fretboard

### Scope

- Six strings and twelve frets.
- Touch, pointer, and keyboard focus behavior.
- Scale overlay and note playback.
- Horizontal scrolling on a 375px-wide viewport.

### Success Criteria

- Across the three POC testers on each P0 phone, at least 57 of 60 deliberate target taps activate the intended note, and none of 30 horizontal scroll gestures triggers a note.
- At 320px and 375px, open strings plus at least four frets are usable without page-level horizontal overflow; at 480px, at least six frets are visible; at 768px, at least eight frets are visible; desktop exposes frets 0 to 12.
- Focus and selected states remain visible.
- The interaction does not require hover or precise drag gestures.
- Targets meet the 44 by 44 CSS-pixel contract, and orientation changes preserve the selected note and focus context.

### Expected Effort

Four to seven focused days.

## POC 2: Shared Piano and Guitar State

### Scope

- One active root and mode.
- Piano and guitar consume the same scale instance.
- Changing the scale updates both views.
- The same pitch can be identified in both views.

### Success Criteria

- `E Phrygian` and `E Lydian` render the expected pitch classes on both instruments.
- No component maintains a separate scale formula.
- Across 100 root/mode changes on the recorded reference desktop fixture, both instrument view models are ready within 16 ms at p95 and commit in the same render cycle; no frame may display piano and guitar from different scale generations.
- A user can switch instrument without losing context.

### Expected Effort

Three to five focused days.

## POC 3: Learning Loop Prototype

### Scope

- Compare natural minor and Dorian over one root.
- Play both examples.
- Play example A, then ask whether example B sounds the same or different without naming the changed note.
- Before any guided toggle or reveal, ask the learner to select the changed note from three candidates and record the answer.
- Then let the learner toggle C and C# over the drone, reveal the major-sixth label, and show the degree on both instruments.

### Success Criteria

- Three testers can complete the flow without facilitator explanation: at least one newcomer without theory or instrument experience, one intermediate guitarist, and one keyboard player or producer.
- At least two of three correctly answer the same/different prompt and select the changed note from three candidates before the reveal.
- After the reveal, at least two of three identify the sixth as the changed degree on a second root from three labeled candidates without additional instruction.
- Static-diagram preference and explanation are recorded as qualitative evidence; preference is not a go/no-go gate.

### Test Protocol

- Recruit three testers matching the experience range: one newcomer without theory or instrument experience, one intermediate guitarist, and one keyboard player or producer.
- Run moderated fifteen-minute sessions.
- Ask the tester to complete Guided Start without facilitator instruction beyond the neutral task prompt.
- Immediately after the same/different answer and before any guided toggle or reveal, ask the tester to select the changed note from three audible/visual candidates; record correctness without coaching.
- Ask a transfer question on a new root after the comparison.
- After the transfer task, show an equivalent static diagram and ask which representation better explained the difference and why.
- Record confusion points verbatim instead of collecting feature requests.

For this POC, a transferable interval insight means correctly identifying the changed sixth on the second root under the scoring rule above.

### Expected Effort

Three to five focused days after POC 0.

## Recommended Sequence

1. POC 1 first because mobile fretboard usability is the largest product risk.
2. POC 0 in parallel or immediately after to stabilize the domain and audio boundaries.
3. POC 2 to prove cross-instrument consistency.
4. POC 3 to validate the actual educational value.

POCs are experiments: the MVP scaffold starts clean and carries over only validated patterns and interfaces, as defined in the architecture document.

## Two-Week Validation Plan

### Week 1

- Build the theory and audio proof.
- Build the smallest playable fretboard.
- Test touch behavior at mobile widths.
- Remove or simplify any interaction that is unreliable.

### Week 2

- Add the shared piano view.
- Add the minor-versus-Dorian comparison.
- Test with the three defined experience profiles.
- Record confusion points, not only feature requests.
- Decide whether to proceed, narrow the audience, or pivot the interaction model.

This is the focused schedule. The Phase-0 estimate in the MVP scope adds one week of buffer for iterating on what the tests reveal.

## Go / No-Go Criteria

Proceed to MVP when:

- The P0 browser matrix can start and control audio.
- The fretboard is usable on a small phone.
- Theory output is correct for the supported scope.
- At least two of three testers gain a transferable interval insight.

For Phase 0, a "small phone" means the 320px and 375px canonical viewports defined above. Audio success uses the measurable scenarios in the audio compatibility specification. Theory correctness means the full property and example suite passes, not a manual spot check.

Do not expand the feature set to compensate for a failed core learning loop.
