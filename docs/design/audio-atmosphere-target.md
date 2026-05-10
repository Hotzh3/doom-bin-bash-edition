# Audio atmosphere target (raycast procedural layer)

This doc captures **design intent** for the Web Audio oscillator layer (`AudioFeedbackSystem`). It is not a full sound-design bible; it aligns engineering choices with feel goals.

## Pillars

1. **Clarity first** — Combat feedback (weapon identity, hit confirm, damage) must remain readable at a glance; ambience never wins a loudness fight with combat cues.
2. **Horror through implication** — Drones and beds suggest machinery and corrupted signal; avoid melodic hooks or long sustained tones that fight music headroom (there is no music track—beds *are* the score).
3. **Contrast** — Recovery and calm sectors allow **longer gaps** between ambient pulses so pressure phases feel denser by comparison.
4. **Boss identity** — Phase shifts use a **dedicated** cue (`bossPhaseShift`) so players learn “something escalated” separate from generic director stings.

## Cue vocabulary (current)

| Family | Cues | Notes |
|--------|------|------|
| Exploration bed | `ambient`, `ambientIndustrial`, `ambientCorrupt` | Same scheduling API; scene picks variant. |
| Director AI | `directorWarning`, `directorAmbush`, `directorRecovery` | Driven by `GameDirector` / encounter beats. |
| Boss presentation | `bossPhaseShift`, `stingerDread` + existing `directorWarning` | Telegraph edge uses layered warning + thin stinger. |
| Combat | `damage`, weapon shoots, `hit`, `kill`, … | Damage intensity scaled from hit severity. |

## Anti-goals

- Continuous oscillator drones (would require loop nodes / buffers—out of scope for this layer).
- Per-frame audio triggers or unthrottled one-shots on dense events (e.g. every projectile).

## Future (optional)

- Gate rare stingers behind “first telegraph in volley window” if playtests show repetition.
- Asset-based stems behind the same semantic events if the project moves beyond procedural-only audio.
