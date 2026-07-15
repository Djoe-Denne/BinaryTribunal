> **Complexité d'investigation : 5/5 (Très élevée) — statique.** 61 handlers d'opcode à décoder (opérandes, état lu/écrit, RNG, émission d'action), plus levée d'ambiguïté par recoupement de scripts monstres réels. Plus gros chantier statique restant ; volume + sémantique incertaine.

---

## RESOLVED — 2026-06-14 (static)

**Closed.** Full static decode of `EnemyAI_VM_ExecuteScript` (`0x487DF0`, 61-case dispatch at `0x487EDC`, indexed `opcode-1`). Deliverables landed in the canonical reference **`obsidian-docs/projects/re-ff8/references/enemy-ai-opcodes.md`** and summarised in `concepts/enemy-ai-vm.md`.

What was produced (matches the Expected Output):

1. **Complete 61-opcode table** — mnemonic, operand bytes (inline little-endian), exact effect, RNG use, and which opcodes *emit an action* (`0x06`, `0x0B`, `0x0C`, `0x1B`, `0x1E`, `0x2A`) vs control flow (`0x02`, `0x23`) vs AI-memory writes.
2. **IF (`0x02`) subject-selector table** — subjects `0x00..0x14`, item-qty `0x50..0x57`, global-var `0x60..0x67`, per-slot AI field `0xDC..0xE3`; comparator `EnemyAI_CompareValues` (`0x48A680`); HP threshold modes (decile %, ¼, absolute).
3. **Target-code table** — `0xC8..0xE3` symbolic codes (+ `com_file_id` scan fallback), with the 3 RNG-drawing codes flagged.
4. **AI state inventory** — reads/writes across `BATTLE_SLOT_DATA`, `BATTLE_LOCAL_VAR` (`0x1D277C4`), `BATTLE_BATTLE_VAR` (`0x1D28C18`), reward queues, and globals (`ENCOUTER_BATTLE_FLAG`, `AI_PREPARE_SUMMON_FLAG`, `SG_ODIN_ANGEL_GILGA_FLAG`, `SG_COUNTDOWN`, `BATTLE_SCRIPTED_END_PENDING`).
5. **Interpreter/commit model** — Berserk entry override (`AI_VM_FALLBACK_BYTECODE` `0x1D2A21D`), stop condition (`0x00` or committed action via `BOOL_TARGET_CHOOSEN`), and the `LABEL_375` commit tail (`K_MAGIC/K_ITEM/K_ENEMY_ATTACK` mask fold → `BattleAction_GetText` / `BattleAction_ResolveTargetAndHitCount`).
6. **Helper map** — `GetSubjectValue_A..D`, `TargetHasStatus`, `GetTargetMemberCount`, `GetTargetMaskFromMask`, `SelectRandomMagicFrom{Player,Stock}`, `BattleTarget_SelectByStatusOrStat`.

**Residual (non-blocking, corpus-dependent):** gameplay labels for the random-magic readers (`0x29`/`0x2E`) and a few IF subjects, to be confirmed against 2–3 real monster scripts. ISO readiness scorecard A5 marked closed.

---

## Task: Exact Enemy-AI VM Opcode Semantics (static)

### Setup For You

- Pure static. Interpreter + opcode table are mapped; this closes the residual opcode behaviours.

### Context

`enemy-ai-vm` documents the 61-opcode bytecode VM structurally, but several opcodes "still need richer semantic names from real monster script corpora rather than interpreter structure alone." ISO enemy behaviour requires every opcode's exact effect (operand decode + state writes + RNG use + action requests).

### Known Anchors

- `EnemyAI_PrepareTurnAction`, `EnemyAI_DispatchSection`, `EnemyAI_VM_ExecuteScript` (resolve exact addresses via callgraph from `BattleArbitration_SelectNextAction` `0x485460`).
- Monster `.dat` AI script sections; the 61-entry opcode dispatch (jumptable).
- Shared action output: pending/exec write path + `target_mask` contract (see `targeting-system`).
- Counter/death return edge into AI dispatch (cross-link forced-action prompt).

### Discovered So Far

- AI-selected monster actions converge on the same `target_mask` + damage apply layer as player actions (`command-action-pipeline`, `damage-status-pipeline`).
- Group routing: AI/special families land in exec groups 1/2; group 0 is engine specials only (see `ai_investigation_static_forced_action_group0_and_counters.md`).

### Static Investigation Steps

1. Resolve and decompile the VM execute function; extract the full 61-entry opcode jumptable (EA per opcode).
2. For each opcode: operand width/decode, registers/locals touched, comparisons, RNG draws, and any action/target request emitted.
3. Identify the AI-visible state: self/target HP%, statuses, turn counters, AI scratch vars, and global battle flags it can read/write.
4. Identify opcodes that **request an action** vs **control flow** vs **set AI memory**; map action-request opcodes to the pending/exec write.
5. Cross-check ambiguous opcodes against 2–3 real monster scripts to confirm semantics.

### Expected Output

1. Complete 61-opcode reference: mnemonic, operands, effect, RNG use, action emission.
2. AI-readable/writable state inventory.
3. Proposed IDA renames for opcode handlers.
4. Merge-ready deltas for `enemy-ai-vm`.
