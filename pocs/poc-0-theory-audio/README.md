# POC 0: Theory Engine and Basic Audio

This is an isolated Phase-0 experiment for deterministic scale generation, contextual spelling, interval metadata, frequency conversion, and browser audio scheduling.

## Run

```bash
npm install
npm run test:run
npm run build
npm run dev
```

## Scope

- Eight formulas across all twelve roots.
- Explicit degrees and semitone offsets, including major pentatonic degrees `1, 2, 3, 5, 6`.
- Formula-compatible letter spelling, including uncommon accidentals when theory requires them.
- Interval quality and labels.
- Overlapping roles, including Locrian's characteristic/chord-tone diminished fifth.
- A4 = 440 Hz equal temperament with MIDI octave numbering.
- Deterministic ascending-scale timeline over a tonic drone.
- Browser audio unlock, play, replay, stop, state subscription, and generation invalidation.

## Deliberate Non-Goals

- No shared MVP theory package yet.
- No final audio library or production sound design decision.
- No server, database, analytics, or remote logging.
- No microphone, MIDI, or performance grading.
- No final UI framework decision.

## Verification Target

- All `8 formulas x 12 roots` pass deterministic tests.
- Full spelling, interval, role, frequency, and timeline contract tests pass.
- Browser audio is manually validated on the P0 matrix after a user gesture.

## Current Verification

- Automated tests: 27 passing across formula metadata, the full formula/root matrix, spelling, interval roles, octave-aware frequency conversion, validated audio timelines, and audio lifecycle failure handling.
- TypeScript check: passing.
- Production build: passing.
- Browser audio validation: pending on the P0 browser/device matrix.
