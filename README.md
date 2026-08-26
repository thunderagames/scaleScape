# ScaleScape

ScaleScape is a responsive, audio-first web app for learning how musical scales and modes sound, work, and map across instruments. It combines a scale explorer, synchronized instrument views, audible harmonic context, and concise musical explanations.

**Live site:** https://thunderagames.github.io/scaleScape/

## What You Can Do

- Choose a root note and a scale or mode from fundamental, modal, pentatonic, blues, symmetric, exotic, and generated probable-scale groups.
- Inspect the degree formula, interval structure, note roles, brief history, and common uses of named scales.
- Play the selected scale or its tonic triad, with optional tonic drone or tonic-plus-fifth pedal context.
- See the same notes on piano, guitar, bass, and standard high-G ukulele fretboards.
- Select notes to inspect their degree, interval, and musical role across every visible instrument.
- Switch note labels between classical letter notation and solfege.
- Adjust playback tempo, volume, mute state, instrument visibility, scale information visibility, and uniform tuning transposition for guitar, bass, and ukulele.
- Send feedback through the in-app form. Email is optional.

## Quick Start

```bash
npm ci
npm run dev
```

Open the local Vite URL shown in the terminal. No external service configuration is needed to explore scales and use the audio features.

## Using The App

1. Open **Select Scale** and choose a root note and formula, then select **Apply**.
2. Use **Play scale** to hear the collection or **Play chord** to hear degrees 1, 3, and 5 together.
3. Select a scale note, piano key, or fretboard position to follow the same pitch across the visible instruments.
4. Open **Settings** to change notation, audio controls, harmonic context, visible instruments, scale-information visibility, or tuning.
5. Use **Send feedback** in the footer to submit a comment. An email address is only needed when the user wants a reply.

## Features

| Area | Available behavior |
| --- | --- |
| Scale explorer | Root and formula selection, grouped formula catalog, degree/interval data, note-role colors, and synchronized selection |
| Scale context | Bilingual brief history and common-use descriptions for named formulas; generated probable scales remain clearly identified |
| Audio | Browser Web Audio playback for notes, ascending scales, simultaneous tonic triads, tonic drone, tonic-plus-fifth pedal, tempo, volume, and mute |
| Instruments | Piano from C3 to C5 plus 0-12 fret views for guitar, four-string bass, and standard reentrant high-G ukulele |
| Tuning | Uniform +/-12 semitone transposition per stringed instrument, persisted locally |
| Preferences | English/Spanish, letter/solfege naming, last selected scale, visibility controls, volume, tempo, and Guided Start completion are stored in local storage |
| Accessibility | Keyboard-accessible scale and instrument controls, roving focus where appropriate, clear focus states, semantic labels, and touch-sized controls |
| Feedback | Optional-email comment form sent through Web3Forms when configured |
| Analytics | Optional privacy-focused Umami visitor analytics when configured |
| Diagnostics | Explicit session-only diagnostic mode with a user-triggered sanitized JSONL export |

## Optional Learning Modules

Explore is the current default screen. Guided Start and Ear Gym are implemented but disabled by default. Enable them in [`settings.json`](settings.json):

```json
{
  "default_screen": "explore",
  "modules": {
    "explore": true,
    "ear_gym": true,
    "guided_start": true
  }
}
```

Guided Start introduces E Dorian over a tonic drone and leads into Ear Gym. Ear Gym provides focused scale comparisons, audio replay, answer feedback, and a locally persisted streak.

## Feedback And Analytics

Copy [`.env.example`](.env.example) to `.env.local` to configure optional integrations for local development:

```bash
VITE_WEB3FORMS_ACCESS_KEY=
VITE_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
VITE_UMAMI_WEBSITE_ID=
```

| Variable | Purpose |
| --- | --- |
| `VITE_WEB3FORMS_ACCESS_KEY` | Enables feedback submission to the Web3Forms recipient configured for that key |
| `VITE_UMAMI_SCRIPT_URL` | Umami tracker script URL |
| `VITE_UMAMI_WEBSITE_ID` | Umami website identifier |

For GitHub Pages, configure these values in `Settings` -> `Secrets and variables` -> `Actions`:

- Add `WEB3FORMS_ACCESS_KEY` as a repository secret.
- Add `UMAMI_SCRIPT_URL` and `UMAMI_WEBSITE_ID` as repository variables.

The Pages workflow passes them to Vite during the production build. Vite variables prefixed `VITE_` are embedded in the browser bundle. The Web3Forms access key is therefore not a private credential; use Web3Forms domain restrictions and spam protection to limit abuse. Do not store private mail-provider or Umami administrative credentials in these variables.

When Web3Forms is not configured, the feedback dialog stays available and explains that feedback is not configured. When either Umami value is missing, no tracker script is loaded.

## Quality Checks

```bash
npm run test:run
npm run build
npm run check
```

`npm run check` runs module-boundary validation, the Vitest suite, TypeScript type checking, and the production Vite build.

## Deployment

Pushing to `master` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which installs dependencies, builds `dist`, and deploys the artifact to GitHub Pages.

In the repository's GitHub Pages settings, set **Build and deployment** -> **Source** to **GitHub Actions**. Selecting a branch source publishes the repository root instead of the workflow's `dist` artifact.

## Project Structure

| Path | Responsibility |
| --- | --- |
| `src/theory/` | Scale formulas, note generation, frequency conversion, and musical roles |
| `src/audio/` | Browser Web Audio playback and harmonic context |
| `src/instruments/` | Piano and stringed-instrument view models and tunings |
| `src/ui/` | Application shell, explorer, Ear Gym, and rendered instrument views |
| `src/settings/` | Local preference persistence, localization, and note-name display |
| `src/content/` | Bilingual scale history and usage catalog |
| `src/integrations/` | Web3Forms feedback and optional Umami tracker setup |
| `src/observability/` | Opt-in local diagnostic event logging and export |
| `documentation/` | Product, UX, domain, architecture, accessibility, validation, and roadmap references |

## Further Documentation

The implementation-facing documentation is in [`documentation/`](documentation/README.md). Useful entry points are:

1. [Product vision](documentation/01-product-vision.md)
2. [MVP scope](documentation/05-mvp-scope.md)
3. [Technical architecture](documentation/08-technical-architecture.md)
4. [Accessibility](documentation/10-accessibility.md)
5. [Validation and POCs](documentation/11-validation-and-pocs.md)
6. [Observability and logging](documentation/16-observability-and-logging.md)

## Product Boundaries

ScaleScape does not currently include microphone pitch detection, MIDI performance grading, user accounts, social features, generated backing tracks, or a full music notation editor. Those capabilities can be evaluated after the core learning loop is further validated.
