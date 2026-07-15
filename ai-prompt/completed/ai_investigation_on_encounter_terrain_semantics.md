## Task: Clarify Encounter Terrain Type 27 And 28 Semantics

### Setup For You

- Start before battle, in field/world movement, not inside an active combat instance.
- Use locations where terrain can be compared: normal encounter terrain, road-like terrain, suspected type 27, suspected type 28, and vehicle or safe zones if available.
- Keep Enc-None and Initiative ability state explicit; test with and without them if possible.
- Watch terrain ID, encounter meter, selected formation, scene ID, and handoff flags until battle starts or is suppressed.

### Context

The encounter handoff docs describe terrain types 27 and 28 as roads or road-like encounter suppressors, but their exact semantic labels remain uncertain. This prompt should verify what those terrain IDs mean and how they affect encounter pressure.

### Known Anchors

- Field and world-map random encounter ticks feed battle handoff.
- Enc-None ability bit `0x08` returns before encounter processing.
- Initiative ability bit `0x01` shifts preemptive/back-attack odds.
- Terrain types 27 and 28 are described as road-like suppressors in current docs.
- Battle handoff eventually writes scene/encounter state such as `COMBAT_SCENE_ID` and `ENCOUTER_BATTLE_FLAG`.

### Investigation Steps

1. Locate terrain type reads in field/world encounter processing.
2. Confirm how IDs 27 and 28 alter encounter meter increment, encounter eligibility, or formation selection.
3. Compare behavior against known roads, paved areas, towns, bridges, vehicles, and world-map regions.
4. Determine whether the two IDs have distinct labels or are variants of a shared road suppressor.
5. Trace any special handling that still allows scripted battles or forced encounters.
6. Update terminology only after code or data evidence supports it.

### Runtime Evidence Plan

- Watch terrain ID, encounter meter, Enc-None flag, Initiative flag, selected formation, and battle handoff state.
- Compare walking on normal terrain, roads, suspected type 27, suspected type 28, and vehicle states.
- If runtime terrain setup is hard, use static xrefs from encounter processing to terrain lookup data.

### Expected Output

1. Terrain ID semantic table for 27 and 28.
2. Encounter suppression or meter formula changes.
3. Evidence for whether labels should be road, road-like, vehicle-safe, or another term.
4. Updates for `docs/tech/systems/encounter_trigger.md` and encounter handoff notes.
