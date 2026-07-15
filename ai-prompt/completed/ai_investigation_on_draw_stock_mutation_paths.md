## Task: Clarify Draw And Magic Stock Mutation Paths

### Setup For You

- Use one active battle with a known Draw list and one out-of-battle menu/junction context for comparison.
- Capture authentic Draw Stock, Draw Cast, Magic cast, menu stock change, and junction stock change if possible.
- Break on `Battle_MutateMagicStock` and any discovered direct stock writer.
- Snapshot character magic stock before and after each action, then return to the same save point for repeatability.

### Context

The draw system and render bridge are mapped at a high level, but it is not confirmed whether `Battle_MutateMagicStock` is the only stock mutation path across battle, menu, and junction contexts. This investigation should find every path that changes character magic stock.

### Known Anchors

- Draw command path enters through battle command menu and pending action pipeline.
- Magic stock mutation is associated with `Battle_MutateMagicStock`.
- Draw/stock interacts with MagicList effect dispatch and battle presentation output.
- Character magic stock is persisted outside `BATTLE_SLOT_DATA`, but battle actions can mutate it.

### Investigation Steps

1. Identify `Battle_MutateMagicStock` callers and classify them by battle, menu, junction, field, or system context.
2. Search for direct writes to magic stock storage that bypass `Battle_MutateMagicStock`.
3. Trace Draw command variants: Draw Stock, Draw Cast, failed Draw, enemy draw list, and quantity calculation.
4. Trace magic consumption from casting in battle and compare with menu/junction mutation.
5. Confirm how stock mutation is synchronized to save/character data and UI.
6. Document whether `Battle_MutateMagicStock` is authoritative or only battle-local.

### Runtime Evidence Plan

- Break on `Battle_MutateMagicStock` and any discovered direct stock writers.
- Perform Draw Stock, Draw Cast, normal Magic cast, item/spell reward if relevant, menu magic changes, and junction changes.
- Capture caller, character ID, magic ID, delta, final stock, and UI sync.

### Expected Output

1. Complete magic stock mutation caller table.
2. Draw quantity and success/failure flow.
3. Storage location and synchronization notes.
4. Determination of whether `Battle_MutateMagicStock` is authoritative.
5. Updates for draw system and render bridge documentation.
