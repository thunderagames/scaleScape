# ScaleScape

ScaleScape is a responsive web application for learning how scales and modes sound, function, and map across instruments.

It is intentionally more than a scale visualizer. The product should help a learner connect four ideas:

1. What a scale sounds like in harmonic context.
2. Which intervals create its musical identity.
3. Where those intervals appear on an instrument.
4. How the same musical structure transfers between instruments.

The initial product direction is an audio-first, mobile-friendly learning laboratory for anyone curious about scales and modes, from first-time learners to experienced guitarists, keyboard players, and producers.

## Documentation

The planning and specification documents are in [`documentation/`](documentation/README.md).

Start with these documents:

1. [`01-product-vision.md`](documentation/01-product-vision.md)
2. [`05-mvp-scope.md`](documentation/05-mvp-scope.md)
3. [`11-validation-and-pocs.md`](documentation/11-validation-and-pocs.md)
4. [`08-technical-architecture.md`](documentation/08-technical-architecture.md)
5. [`15-coding-standards.md`](documentation/15-coding-standards.md)
6. [`16-observability-and-logging.md`](documentation/16-observability-and-logging.md)

## Current Status

| Area | Status |
| --- | --- |
| Product concept | Defined |
| MVP scope | Implementation-ready baseline |
| Technical stack | Not locked |
| Phase-0 POCs | POC 0 automated verification complete; POC 1, POC 2, and POC 3 validated |
| Application code | MVP interaction slice implemented; browser/device validation remains |

## Implemented MVP Slice

- Guided Start with tonic context, characteristic-note progression, and Ear Gym handoff.
- Explore root/mode selection, interval-role explanations, piano and guitar interaction.
- Explore piano, guitar, bass, and standard high-G ukulele fretboard interaction.
- Tonic drone and tonic-fifth pedal playback with volume and mute controls.
- Ear Gym focused comparisons, replay, feedback, and persisted streak.
- Local preferences for language, instrument visibility, volume, last scale, and Guided Start completion.
- Session-only diagnostic mode with sanitized, user-triggered JSONL export.

The remaining release work is validation: manual P0 browser/device checks, usability feedback, and documenting known browser limitations.

## Runtime Configuration

Module availability and the initial screen are configured in [`settings.json`](settings.json). The current configuration exposes Explore and starts there; Ear Gym and Guided Start remain implemented but disabled until they are enabled in that file.

### Feedback and Analytics

Copy [`.env.example`](.env.example) to `.env.local` for local development and set the following values:

- `VITE_WEB3FORMS_ACCESS_KEY`: Access key created at [Web3Forms](https://web3forms.com/).
- `VITE_UMAMI_SCRIPT_URL`: Umami tracking script URL, for example `https://analytics.example.com/script.js`.
- `VITE_UMAMI_WEBSITE_ID`: Website ID from the Umami website settings.

The GitHub Pages workflow reads the Web3Forms key from the `WEB3FORMS_ACCESS_KEY` repository secret and the two Umami values from repository variables named `UMAMI_SCRIPT_URL` and `UMAMI_WEBSITE_ID`. Configure those values in the repository before deploying. The feedback form remains visible but reports that it is not configured when the Web3Forms key is absent; Umami is not loaded until both Umami values are present.

## Product Boundary

ScaleScape does not initially include microphone pitch detection, MIDI performance grading, user accounts, social features, generated backing tracks, or a full music notation editor. Those areas can be evaluated after the core learning loop is validated.
