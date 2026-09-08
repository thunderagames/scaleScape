# Progression Harmony Module Plan

A learner studying a selected scale can inspect a common roman-degree progression and see, for the current degree, where the chord lives and which notes of that same scale fit it. The first increment is visual only and diatonic. It maps, for the current progression degree, which selected-scale notes belong to the triad and which remaining notes are nonchord tones. It composes existing instrument renderers without changing their Explore contracts. Explore keeps its current behavior, including tonic-of-scale meaning.

This document is the working plan. It records only decisions already confirmed with the product owner. Open questions stay open. A completeness review against the current codebase found remaining product contracts; those are listed below instead of being guessed.

## Quick Path

1. Choose a root and scale in the existing Explore flow.
2. Open the new progression module.
3. Choose a genre group and a catalog progression such as `I–IV–V–IV`.
4. See one diagram per unique degree of that progression, in first-seen order.
5. Each unique degree is one row: a compact chord map on the left and a full-range nonchord-tone map on the right, for every visible instrument including piano.

## Confirmed Decisions

| Topic | Decision |
| --- | --- |
| Product job | While studying one scale, show which notes belong to the current progression degree and which remaining scale notes can connect them. |
| Chord construction | Each degree uses the in-scale triad stacked `1-3-5` from that degree. |
| Example, A natural minor | `I` = A–C–E, `IV` = D–F–A, `V` = E–G–B. |
| Degree labels | Catalog labels are scale degrees, not chord-quality symbols. `I` in A minor is still the tonic triad of the selected scale, even if that triad is minor. |
| Chord extensions | `Am7` and other modifications are later work. |
| Selected scale | The module keeps the scale the user is already studying. It does not swap to a different scale per chord. |
| Scale source | This screen follows Explore's current in-memory scale live. Changing root or formula in Explore updates Harmony without requiring a separate Apply/persist step. |
| Degree presentation | Unique degrees of the selected progression are visible at once, in first-seen catalog order. Repeated slots such as `I–I–I–I` share one diagram. The first slice has no degree stepper. On a 1920×1080 desktop, the compact layout targets four degree rows in one viewport. |
| First-slice instruments | Every visible instrument from Settings: guitar, bass, ukulele, and piano. |
| Left pane, stringed | Short fretboard window. Default width is 4 frets. Empty frets stay visible; the chord map marks at most one position per string, with unplayed strings left empty. The window may start after fret 0. |
| Right pane, stringed | 12-fret fretboard showing every note of the selected scale for that same degree. |
| Left pane, piano | Existing C3–C5 range stays fully visible. Only that degree's triad keys are marked. Piano has no fret window. Extending that range is later work. |
| Right pane, piano | The existing C3–C5 piano range, showing every note of the selected scale for that same degree. |
| Degree title | `{roman}-{chordName}`, for example `I-Am`. Quality comes from the stacked in-scale triad. |
| Chord-name spelling | Standard lead-sheet triad symbols. Major is the bare root (`C`), minor is `m` (`Am`), diminished is `°` (`B°`), augmented is `+` (`C+`). The root uses the scale-instance letter spelling. Solfège does not rewrite the title. |
| New-module colors | Three buckets: current-chord tonic, other current-chord tones, nonchord tones. |
| Third-bucket name | Domain type is `nonchord`. A leftover selected-scale note is not labeled `passing_tone`. |
| Tonic meaning here | Fundamental of the current degree chord. |
| Tonic meaning in Explore | Unchanged: degree 1 of the selected scale. |
| Characteristic color | Not part of the first-slice progression colors. |
| Progression input | First slice uses a curated catalog grouped by genre. The user does not type roman numerals. Each option shows its full quality-aware sequence, such as `Axis (I–V–vi–IV)`. |
| First-slice scales | Heptatonic named scales only. Non-heptatonic and gapped scales are out of the first slice. |
| Incompatible catalog items | Hide them. Do not disable them in place and do not show a partial degree list. |
| Surface | New shell screen with its own navigation entry. Not a mode inside Explore. |
| First-slice audio | Visual only. The first slice does not play the current degree triad or a backing progression. |
| Fretboard display | Fret count and cell width/height use module defaults so every degree row can fit on the page. They are not user-configurable in the first slice. |
| Short-board start | The left window may start after fret 0. The module chooses the start fret so every triad pitch class appears at least once, then chooses at most one position per string for a deterministic compact chord shape. The starting fret number is always visible. |
| Explore isolation | Explore stays as it is. Shared mapping and renderers may gain additive options, but their current defaults and Explore behavior must not change. |
| Narrow viewports | For each degree, the short chord board stacks above the 12-fret board. |
| Existing Explore roles | Do not overwrite `NoteRole` or formula `degree_roles`. Those remain tonic-of-scale. |

## Current Gap

Today ScaleScape has no progression model, no roman-degree catalog, and no degree-relative chord mapping.

- `playChord` filters only scale degrees `1`, `3`, and `5` of the selected scale.
- Instrument view models copy `primary_role` and `is_root` from the scale instance.
- `is_root` means the scale tonic, not the current chord root.
- Module flags in `settings.json` currently cover Explore, Ear Gym, Guided Start, and diagnostics.

The roadmap already names this as Phase 3 work: chord-progression context plus chord-tone explanations.

## First-Slice Catalog

The first catalog contains only in-scale degrees `I` through `VII`. Quality is derived by stacking `1-3-5` in the selected scale. Borrowed flats, secondary dominants, and sevenths are excluded here even when a genre commonly uses them.

| Group | Progression | Degrees | Why it is included |
| --- | --- | --- | --- |
| Pop | Axis | `I–V–VI–IV` | The common pop four-chord loop. |
| Pop | Axis rotation | `VI–IV–I–V` | Same chords, minor-start rotation. |
| Pop | 1950s | `I–VI–IV–V` | Standard doo-wop / 1950s loop. |
| Pop | Circle turnaround | `I–VI–II–V` | Common pop and jazz-adjacent turnaround. |
| Rock | Three-chord | `I–IV–V` | Basic rock/folk skeleton. |
| Rock | User example | `I–IV–V–IV` | The original requested loop. |
| Rock | Plagal loop | `I–V–IV–I` | Common rock cadence loop. |
| Rock | Pachelbel | `I–V–VI–III–IV–I–IV–V` | Widely reused popular sequence. |
| Blues | 12-bar skeleton | `I–I–I–I–IV–IV–I–I–V–IV–I–V` | Degree skeleton only; dominant sevenths are later. |
| Blues | Minor 12-bar skeleton | `I–I–I–I–IV–IV–I–I–V–IV–I–I` | Same degree skeleton starting from a minor scale. |
| Jazz | ii–V–I | `II–V–I` | Core jazz cadence as degrees; sevenths are later. |
| Jazz | Rhythm turnaround | `I–VI–II–V` | Common jazz turnaround without secondary dominants. |
| Jazz | Circle | `VI–II–V–I` | Descending-fifth close. |
| Metal | Aeolian lift | `I–VI–VII` | Common natural-minor metal loop. |
| Metal | Aeolian shuttle | `I–VII–VI–VII` | Common natural-minor rock/metal shuttle. |
| Metal | Minor three-chord | `I–IV–V` | Minor-key power-progression skeleton. |
| Metal | Aeolian walk | `I–VI–III–VII` | Common darker popular/metal loop. |

Roman numerals in this table are degree labels. In A natural minor, `I–VI–VII` is A–F–G, not A major–F major–G major unless the stacked triad happens to be major.

A progression is shown only when the selected scale is heptatonic and every listed degree can form a complete in-scale `1-3-5` triad. Any other case hides that catalog item. Incomplete degrees do not invent missing notes and do not appear as a partial list.

## Explicitly Later

| Item | Why it waits |
| --- | --- |
| Sevenths and other extensions | Confirmed later; first slice is triads only. |
| Per-chord scale substitution | Conflicts with "study one selected scale". |
| Avoid-note filtering | Not validated. First slice treats remaining scale notes as nonchord tones. |
| Borrowed degrees such as `bVI`, `bVII`, `bII` | Not in-scale for many selected formulas. |
| Mixolydian / blues dominant-seventh color | Requires chord modifications. |
| Andalusian cadence with major `V` | Uses a raised leading tone outside natural minor. |
| Rhythm changes, Coltrane changes, tritone substitutes | Secondary dominants and substitutions. |
| Non-heptatonic and gapped scales | First slice is heptatonic named scales only. |
| Disabled or partial catalog items | Incompatible progressions are hidden, not shown incomplete. |
| Custom typed progressions | Catalog first. |
| Playback of the current degree triad | First slice is a visual map only. |
| Backing-track playback of the full progression | Visual module first; audio is later work. |
| Changing Explore's tonic color meaning | Existing module stays scale-tonic. |
| Extending the piano range past C3–C5 | First slice reuses the existing Explore piano range. |

## Experience

The new module is a separate shell screen with its own navigation entry. It is not a mode inside Explore.

1. The user arrives with Explore's current in-memory root and scale. Harmony follows that selection live.
2. Genre groups are visible first; each group lists only compatible catalog items. Incompatible items are hidden, not disabled.
3. Selecting a progression shows one row per unique degree, in first-seen catalog order. Consecutive or later repeats such as the twelve-bar `I` bars share one diagram.
4. Each unique degree is one row with a small title such as `I-Am`.
5. For stringed instruments, the left copy is a short fretboard window. Default width is 4 frets. Empty frets stay visible. The module chooses a start fret so every triad pitch class is available, then marks at most one chord position per string; strings without a selected position remain empty. That starting fret number stays visible.
6. For stringed instruments, the right copy is a 12-fret fretboard and shows the selected scale with the three new-module colors for that same degree.
7. For piano, both copies use the existing C3–C5 range. Empty keys stay visible. The left copy marks only that triad and the right copy marks the selected scale. Extending the piano range is later work.
8. Fret count and cell size use first-slice module defaults so several unique-degree rows still fit. Those defaults apply to this module only and are not a user setting.
9. Explore, Ear Gym, metronome ownership, and existing Explore instrument settings remain unchanged. Shared components used here must keep their current Explore contracts.

Desktop places the short board and the 12-fret board side by side. Narrow viewports stack the short board above the long board and keep instrument-only scrolling. No essential meaning may depend on hover.

Each visible instrument from Settings gets the same left/right job: triad on the left, selected-scale map on the right. Piano has no start-fret number.

## Architecture

Reuse existing mapping and rendering. Add a derived harmony view; do not teach instrument modules new theory.

```text
selected ScaleInstance
        +
catalog progression
        |
        v
for each unique degree, first-seen order
        |
        v
pure harmony mapping
        |
        +--> chord name from stacked 1-3-5 quality
        +--> left pitch classes: that degree's triad
        +--> right roles: chord_tonic | chord_tone | nonchord
        |
        v
existing instrument view-model factories
        |
        +--> stringed left: module-chosen 4-fret window by default, start number visible
        +--> stringed right: 12 frets
        +--> piano left: triad keys on existing C3–C5
        +--> piano right: selected-scale map on existing C3–C5
```

| Area | Reuse | New work |
| --- | --- | --- |
| `theory` | `ScaleInstance`, degrees, spellings | Degree-triad derivation and degree-relative roles |
| Catalog | Content-as-data pattern from formulas/exercises | Genre-grouped progression list |
| Instruments | Position mapping and renderers | Additive options for fret window, start fret, cell size, and derived roles. Current Explore defaults stay unchanged. Piano reuses the existing range. |
| `ui` | Card chrome, visibility, localization, metronome placement | New screen, shell navigation entry, one row per degree, and dual instrument composition |
| `application` / `app-state` | Selected scale from the shared Explore application | Selected progression; Harmony reads the live scale, not a private copy |
| `settings.json` | Existing module-flag pattern | A new flag, disabled by default like Ear Gym |
| Explore `NoteRole` | Unchanged | A separate progression-role type |

`theory` remains pure. UI must not stack triads or assign roles locally.

Explore isolation is a hard constraint. If a shared factory or renderer needs a fret window, start fret, cell size, or progression role, that option is additive. Explore must keep rendering frets 0 to 12 with today's sizes, colors, and tonic-of-scale meaning.

## Implementation Order

1. Record and keep this plan current as remaining product questions are answered.
2. Add pure theory: given a scale instance and degree, return the triad or a typed incomplete result.
3. Add pure theory: map every selected-scale note to `chord_tonic`, `chord_tone`, or `nonchord` for the current degree.
4. Encode the first-slice catalog as data, including genre group and compatibility rules.
5. Add application state for selected progression and fretboard display settings, keyed to the current scale generation.
6. Compose one left-plus-right instrument row per unique degree behind a disabled module flag.
7. Add localization, accessibility names, and tests before enabling the module for users.

First-slice product questions below are closed. Implementation can start when the product owner asks for it.

## Test Plan

| Layer | Required coverage |
| --- | --- |
| Degree triad | A natural minor `I`, `IV`, and `V` match A–C–E, D–F–A, and E–G–B. |
| Incomplete triad | A degree missing a third or fifth does not invent notes. |
| Role mapping | Current chord root is `chord_tonic`; other triad notes are `chord_tone`; remaining selected-scale notes are `nonchord`. |
| Explore isolation | Existing scale-tonic roles, `playChord` behavior, fret range 0-12, and current Explore sizes stay unchanged. |
| Catalog | First-slice items contain only degrees `I`–`VII`; later borrowed/seventh patterns are absent. |
| Compatibility | Non-heptatonic, gapped, or otherwise incomplete cases hide the catalog item. Nothing is shown disabled or partial. |
| Chord title | A natural minor `I` is labeled `I-Am`. B Locrian `I` is `I-B°`. An augmented stacked triad is `C+`. Quality is derived, not stored as a catalog symbol. |
| Short-board start | A left window that does not start at 0 still shows its starting fret number. |
| Unique degrees | A 12-bar skeleton displays `I`, `IV`, and `V` once each, in that order. `I–IV–V–IV` displays `I`, `IV`, and `V`. |
| UI | Every unique compatible degree is visible; left copy shows only triad pitch classes; right copy shows the full selected scale. |

## Acceptance Checklist

- [ ] The user can inspect a catalog progression against the scale already selected in Explore.
- [ ] Unique compatible degrees of the selected progression are visible once each, in first-seen order.
- [ ] Each row reuses the same visible instruments and tunings; left is the compact triad map and right is the full-range scale map.
- [ ] A short board that starts after fret 0 still shows that starting fret number.
- [ ] New-module tonic means the current chord root; Explore tonic remains the scale root.
- [ ] Explore still works as it does today after any shared-component change.
- [ ] No seventh, borrowed chord, or per-chord scale change is required to use the first slice.
- [ ] Incomplete degrees fail closed instead of inventing pitches.
- [ ] The module can stay disabled through `settings.json` until it is ready.
- [ ] A non-heptatonic selected scale does not show first-slice catalog items.

## Expected Files

| Path | Planned change |
| --- | --- |
| `documentation/18-progression-harmony-plan.md` | This working plan. |
| `src/theory/` | Pure triad and degree-relative role helpers plus tests. |
| `src/content/` or a new harmony module | Catalog data. |
| `src/application/` and `src/app-state/` | Progression selection and fretboard display settings. |
| `src/ui/` | New screen, one row per unique degree, and dual instrument composition. |
| `src/app-config.ts` and `settings.json` | Module flag. |
| `src/settings/localization.ts` | English and Spanish copy. |

Exact file names stay undecided until implementation starts.

## Completeness Review

Reviewed against the current codebase. The confirmed decisions above are enough for the product job, catalog, Explore isolation, and left/right map. They are not enough to implement without guessing.

Existing code that the first slice must not break:

- Named vs generated scales are split by `category !== 'probable_scales'`. There is no public heptatonic helper.
- Stringed factories emit frets `0..fret_count` and renderer headers assume that same range.
- Piano defaults are MIDI 48–72 (`C3`–`C5`). Explore never overrides that range.
- Renderers always paint the full board and mark outsiders; they cannot hide non-matching positions today.
- Fret cell size is hardcoded CSS (`min-width: 900px`, `44×44`). There is no per-module size hook.
- `NoteRole` already includes `chord_tone`. Progression roles need a separate type and CSS prefix.
- No chord-quality namer exists. `I-Am` needs new theory.
- `AppScreen` and module flags are closed unions. A new screen follows the Ear Gym disabled-by-default pattern.

## Open Questions

These are not implementation details. They change the first slice if answered differently.

1. Closed: the short window must make every triad pitch class visible at least once. A playable voicing is not required.
2. Closed: empty frets and piano keys stay visible. Triad notes are marked on that full left copy.
3. Closed: default short-board width is 4 frets.
4. Closed: titles use standard triad symbols `C`, `Cm`, `C°`, and `C+`. The root stays a letter spelling; solfège does not rewrite it.
5. Closed: fret count and cell size are module defaults only. They are not user-configurable in the first slice.
6. Closed: Harmony follows Explore's current in-memory scale live.

## Theory Review: Long-Board Notes

Reviewed against extra sources after the completeness review. The first-slice long board is the right set of notes. The label for the third color is not.

What the first slice already does, and why it is enough:

| Long-board rule | Verdict | Why |
| --- | --- | --- |
| Show only notes of the selected scale | Keep | Matches the product job: study one scale against one degree. |
| Mark the stacked `1-3-5` as chord tones | Keep | Chord tones are the members of the sounding chord. |
| Mark the current chord root separately | Keep | The root is the chord fundamental, distinct from the other chord tones. |
| Show the remaining selected-scale notes | Keep | Those notes are available in-scale color against that triad. |
| Do not hide avoid notes | Keep for first slice | Avoid-note filtering is jazz pedagogy and was already deferred. |
| Do not swap scale per chord | Keep | Chord-scale substitution conflicts with "study one selected scale". |

What the sources add, and what they do not change:

- [Nonchord tone](https://en.wikipedia.org/wiki/Nonchord_tone) and [Open Music Theory: Embellishing Tones](https://viva.pressbooks.pub/openmusictheory/chapter/embellishing-tones/): any selected-scale note that is not in the current triad is a *nonchord* / *embellishing* tone. A *passing tone* is only one melodic use of that note: step in, continue in the same direction, land on a chord tone. A static map cannot tell passing from neighbor, escape, suspension, or appoggiatura.
- [Avoid note](https://en.wikipedia.org/wiki/Avoid_note): some remaining scale notes can clash, such as the natural 11th a semitone above a major third. That is later work, not a first-slice hide rule.
- [Chord-scale system](https://en.wikipedia.org/wiki/Chord-scale_system): pairing a different scale to each chord is a later jazz method. The first slice stays on the selected scale and the older chord-tone map.
- Guide-tone / targeting practice highlights the 3rd, and later the 7th, as the strongest quality tones. First slice already separates root from other triad tones. Splitting 3rd from 5th is optional later work, not required to show the map.

First-slice implementation must not invent avoid-note colors, per-chord scales, or 7th guide tones. The third color is the domain type `nonchord`.

## Sources Used For The Catalog

- [List of chord progressions](https://en.wikipedia.org/wiki/List_of_chord_progressions)
- [I–V–vi–IV progression](https://en.wikipedia.org/wiki/I%E2%80%93V%E2%80%93vi%E2%80%93IV_progression)
- [Twelve-bar blues](https://en.wikipedia.org/wiki/Twelve-bar_blues)
- [ii–V–I progression](https://en.wikipedia.org/wiki/Ii%E2%80%93V%E2%80%93I_progression)

These sources justify why a pattern is common. They do not expand first-slice harmony beyond the confirmed triad rule.
