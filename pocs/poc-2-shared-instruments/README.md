# POC 2: Shared Piano and Guitar State

This isolated Phase-0 experiment proves that piano and guitar can consume one deterministic `ScaleInstance` while preserving one active root, formula, and generation.

## Run

```bash
npm install
npm run test:run
npm run build
npm run dev
```

## Scope

- Shared root and formula selection.
- One `ScaleInstance` owned by `SharedScaleStore`.
- Synchronized piano view from C3 to C5.
- Piano layout with full-size natural keys and narrower overlaid altered keys.
- Standard-tuning guitar view from frets 0 to 12.
- Shared generation ID on every state and instrument view model.
- Cross-instrument pitch highlighting.
- Instrument switching without losing musical context.

## Deliberate Non-Goals

- No production application state or framework decision.
- No audio playback or exercise flow.
- No alternate tuning UI.
- No persistence, accounts, or remote logging.

## Verification Target

- E Phrygian and E Lydian produce the expected pitch classes on both instruments.
- No instrument module owns scale formula or interval derivation.
- One hundred root/mode changes preserve a coherent generation across both view models and remain below the 16 ms p95 reference target.
- Switching instruments preserves scale instance and generation.

## Current Verification

- Automated tests: 8 passing across shared-state, synchronized pitch, piano key layout, spelling, and 100-change generation/performance contracts.
- TypeScript check: passing.
- Production build: passing.
- Manual reference-desktop validation: passed per user report.
- Responsive layout validation: passed per user report; each piano and guitar surface owns a horizontal scroller.
