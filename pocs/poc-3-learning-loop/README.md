# POC 3: Learning Loop Prototype

This isolated Phase-0 experiment validates the core learning loop through an E natural minor versus E Dorian comparison, followed by transfer to A.

## Run

```bash
npm install
npm run test:run
npm run build
npm run dev
```

## Scope

- Play natural minor and Dorian over a tonic drone.
- Keep the initial exercise labels mode-focused; reveal the comparison root after the learner commits to an answer.
- Show contextual `?` help on steps and controls through hover or click; open help closes automatically after three seconds.
- Ask the learner to identify the changed degree using Roman numerals before reveal; do not ask a redundant same/different question.
- Reveal that Dorian raises the sixth degree.
- Introduce Roman-numeral degree counting briefly near the comparison title (`I` = first, `VI` = sixth).
- Show the changed note on piano and guitar.
- Ask the learner to identify the raised sixth on A Dorian using concrete note names.
- Track a simple streak through the transfer answer.
- Configure English or Spanish from an extensible settings modal.

## Deliberate Non-Goals

- No production exercise engine.
- No persistence or analytics.
- No facilitator/tester reporting UI.
- No final content system or renderer decision.
- Settings are intentionally limited to language; future preferences can extend the same store and modal.

## Verification Target

- Domain flow prevents reveal before Roman-numeral degree selection.
- Roman-numeral degree choice is recorded before reveal.
- Correct transfer identifies F# as the raised sixth in A Dorian.
- Incorrect transfer resets the streak.
- Audio starts after a user gesture and reports unavailable/failed states visibly.

## Current Verification

- Automated tests: 8 passing across comparison generation, answer gating, reveal, transfer, captions, streak behavior, and settings localization.
- TypeScript check: passing.
- Production build: passing.
- Three-tester learning validation: passed per user report; POC works as expected.
