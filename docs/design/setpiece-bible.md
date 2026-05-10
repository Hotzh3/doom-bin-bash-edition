# Setpiece bible (raycast presentation hooks)

Each cue is **presentation-only**: HUD strip, `corruptionVeil`, `pulseFeedback`, `cameras.main.flash`, and existing **AudioFeedbackSystem** cues. No scripted camera moves or cutscene UI.

## Cue reference

| Cue | Player read | Implementation sketch |
|-----|-------------|------------------------|
| **BLACKOUT_PULSE** | Lights/machine breath snap off for a beat | Veil alpha spike + dark blue-gray flash + soft `directorWarning`. |
| **ALARM_SURGE** | Facility alarm / breach klaxon | Layered `directorWarning`, red pulses, delayed `stingerDread`. |
| **RITUAL_PULSE** | Vault / spore chamber “wrong holiness” | `pulseCorruption` + toxic bloom tint pulse + quiet `directorAmbush`. |
| **FAKE_CALM** | System pretends recovery / lure | `directorRecovery` + bright pulse + veil **thins** temporarily (trap foreshadow). |
| **CORRIDOR_HUNT** | Being tracked along a lane | `directorWarning` + `uiSoftDeny` + amber pulse (denial ping). |

## Authored placements (current)

| Level | Hook | Cue |
|-------|------|-----|
| Slag Foundry — gate ambush trigger | Main arena breach | `ALARM_SURGE` |
| Slag Foundry — south drain trigger | Flooded-trap-room fantasy | `BLACKOUT_PULSE` |
| Slag Foundry — east exit snare zone beat | Fake early exit gleam | `FAKE_CALM` |
| Sulfur Lattice — conduit surge trigger | Yellow shear alarm | `ALARM_SURGE` |
| Sulfur Lattice — cache stir trigger | Lower-loop crawl hunt | `CORRIDOR_HUNT` |
| Sulfur Lattice — bloom archive zone beat | Spore vault ritual read | `RITUAL_PULSE` |
| Ember Meridian — Cinder Ramp flank spike (`meridian-flank-spike`) | Vent breach alarm | `ALARM_SURGE` |
| Ember Meridian — Gate Cut lockdown (`meridian-lockdown`) | Ring finale surge | `RITUAL_PULSE` |

## Extension rules

1. Prefer **one cue per beat/trigger** unless layering is intentional.
2. Do not attach cues to **every** zone — save them for inflection points (breach, lure, vault).
3. Boss arenas rely on existing boss telegraph audio; avoid doubling `bossPhaseShift` unless design asks for it.
