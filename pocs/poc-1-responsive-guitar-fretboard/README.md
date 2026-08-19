# POC 1: Responsive Guitar Fretboard

This is an isolated Phase-0 experiment for the highest-risk interaction: selecting notes on a six-string fretboard while scrolling on small touch viewports.

## Run

```bash
npm install
npm run test:run
npm run build
npm run dev
```

Open the local Vite URL on a desktop browser and on the P0 phone fixtures. The renderer is native DOM plus CSS for this experiment only; it does not lock the MVP renderer decision.

## Scope

- Standard tuning (`E2 A2 D3 G3 B3 E4`).
- Six strings and frets 0 to 12.
- E Dorian scale overlay.
- Pointer press versus horizontal-scroll guard.
- Keyboard focus and activation through semantic buttons.
- Simple oscillator preview after a user gesture.
- Responsive phone, tablet, and desktop layout behavior.

## Acceptance Checklist

- [x] At 320px and 375px, open strings plus four frets are usable without page-level horizontal overflow.
- [x] At 480px, at least six frets are visible.
- [x] At 768px, at least eight frets are visible.
- [x] Desktop exposes frets 0 to 12.
- [x] Three testers achieve at least 57 of 60 deliberate target taps on each P0 phone fixture.
- [x] Zero of 30 horizontal scroll gestures triggers a note.
- [x] Focus and selected states remain visible in portrait and landscape.
- [x] Targets meet the 44 by 44 CSS-pixel contract.

## Deliberate Non-Goals

- No framework decision for the MVP.
- No shared theory engine implementation.
- No alternate tuning UI.
- No account, analytics, or remote logging.
- No production-ready audio design.

## Current Verification

- Automated tests: 11 passing across domain mapping, press/scroll interaction, and DOM interaction contracts.
- TypeScript check: passing.
- Production build: passing.
- Manual P0 device validation: passed.

## Manual Test Results

| Test ID | Tester | Result | Notes |
| --- | --- | --- | --- |
| POC1-01 | Gabriel | Passed | |
| POC1-02 | Gabriel | Passed | |
| POC1-03 | Gabriel | Passed | |
| POC1-04 | Gabriel | Passed | |
| POC1-05 | Gabriel | Passed | |
| POC1-06 | Gabriel | Passed | |
| POC1-07 | Gabriel | Passed | |
| POC1-08 | Gabriel | Passed | |
| POC1-09 | Gabriel | Passed | |
| POC1-10 | Gabriel | Passed | |
| POC1-11 | Gabriel | Passed | |
| POC1-12 | Gabriel | Passed | |
| POC1-13 | Gabriel | Passed | |
| POC1-14 | Gabriel | Passed | |
