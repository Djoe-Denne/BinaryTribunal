## Task: Clarify Hidden Mechanics And Rare Battle Edge Cases

### Setup For You

- Start with static discovery first; many rare mechanics are hard to trigger reliably.
- Keep several saves around unusual battle contexts: normal random battle, boss battle, low-party-HP battle, and battle with special items/abilities available.
- Use runtime only after a candidate entry point or trigger condition has been found.
- Record the exact party, inventory, story/event state, encounter, and flags for any rare mechanic observed.

### Context

The product-level battle overview notes hidden or rare mechanics that are not yet fully mapped to implementation details. This prompt is for a broad sweep that identifies which rare mechanics are battle-loop relevant and promotes them into specific follow-up prompts if needed.

### Candidate Topics

- Hidden affection or compatibility variables that affect battle events.
- Rare auto-trigger or rescue mechanics beyond Odin, Gilgamesh, Phoenix, and Angelo.
- Special battle-end or scripted victory cases.
- Card, Devour, Mug, and other non-standard action side effects.
- Boss-specific death scripts or forced transitions.
- Flags that alter rewards, escape, targetability, or battle UI.

### Investigation Steps

1. Enumerate rare mechanics mentioned in product docs or kernel data but missing from technical docs.
2. For each mechanic, identify whether it touches the active battle loop, init, action resolution, status, rewards, or presentation only.
3. Find static anchors: function names, MagicList effect IDs, command IDs, kernel sections, or battle flags.
4. Rank each mechanic by implementation value and reverse-engineering risk.
5. Split any large mechanic into a dedicated prompt if it deserves a focused investigation.

### Runtime Evidence Plan

- Prefer static discovery first; many rare mechanics are hard to trigger.
- Use runtime probes only for high-value cases with known entry points.
- Capture battle flags, command bytes, action globals, reward state, and special event callbacks.

### Expected Output

1. Inventory of rare mechanics with confidence and known anchors.
2. Classification: init, active tick, action resolve, status, reward, presentation, or script-only.
3. Proposed prompt backlog additions for mechanics that need dedicated research.
4. Documentation targets and unresolved questions.
