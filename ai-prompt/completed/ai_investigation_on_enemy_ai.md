# FF8 Battle Loop — Remaining Work Items

## Status: Mapped vs Unmapped

### ✅ Mapped Systems
- Battle main loop (per-frame tick sequence)
- Command pipeline (Input → Pending → Exec → Resolve)
- Damage pipeline (metadata → compute → apply)
- Status pipeline (gating → resolution → commit → sync)
- ATB system (increment, eligibility, readiness)
- Command menu (builder, limit crisis, availability)
- GF summon system (all 16 junctionable + 5 special)
- MagicList_Logic dispatch table (400 entries)
- Auto-trigger GFs (Odin, Gilgamesh, Phoenix, Angelo)
- Random encounters (field + world map + formation selection)
- Preemptive / back-attack resolution
- Encounter → battle module handoff
- Render bridge (domain → presentation)
- Draw system (quantity, stock mutation)

### ❌ Unmapped Systems

#### Tier 1 — Architecture (high value)

| System | Description | Known Anchors |
|--------|-------------|---------------|
| **Enemy AI VM** | Stack-based script interpreter for .dat section 8. Controls all enemy behavior: attack selection, target choice, phase transitions, summon other enemies | Qhimm wiki documents field VM opcodes; battle VM is similar but has battle-specific opcodes |
| **Battle init sequence** | Complete flow from module switch to first ATB tick. Substeps 0→3 of mode_StateGlobal==3 | ReadSceneOutFileForSpecificEncounter, setMonsterInfoFromDatInfoSection (0x48BBD0), Battle_InitPartySlotStatusFromChar (0x48B5F0), Battle_InitPreemptiveBackAttackStatus (0x48AFD0) |

#### Tier 2 — Core Combat Mechanics

| System | Description | Known Anchors |
|--------|-------------|---------------|
| **Targeting system** | Target mask resolution, fan-out multi-target, Double/Triple iteration, random target | BattleAction_ResolveTargetsAndApplyHits (0x48EA93) |
| **Elemental resolution** | Weakness/resist/null/absorb multiplier calculation from HIT_ELEMENT vs target elemental defense | Inside Damage_ComputeRawDeltaFromAttackType (0x4922B0) |
| **Escape mechanics** | Flee RNG, RELATED_CANT_ESCAPE, success/fail determination | Unknown function; RELATED_CANT_ESCAPE set from ENCOUTER_BATTLE_FLAG bit 0 |
| **GF charge absorption** | During GF summon, GF absorbs damage instead of character; GF KO possible | Somewhere in the damage application path, likely a check on "summoning" status bit |

#### Tier 3 — Limit Breaks

| System | Description | Known Anchors |
|--------|-------------|---------------|
| **Renzokuken** (Squall) | Multi-hit sequence + finisher selection | BattleAction_ResolveRenzokukenFinisherHits (0x48F350), kernel.bin section 23 |
| **Slots** (Selphie) | Random spell selection from pool | kernel.bin section 24 |
| **Duel** (Zell) | Timed combo input, move chaining | kernel.bin sections 17+25 |
| **Shot** (Irvine) | Ammo-based repeated shots, ammo consumption | kernel.bin section 22 |
| **Blue Magic** (Quistis) | Learned enemy abilities, unique effect per spell | kernel.bin section 18 |
| **Angel Wing** (Rinoa) | Auto-cast random magic from stock at 5× power | Effect_id 96 in MagicList_Logic; Berserk-like status |
| **Combine** (Rinoa+Angelo) | Angelo variants — already mapped (91-94) | ✅ Done |

#### Tier 4 — Data Flow / Lifecycle

| System | Description | Known Anchors |
|--------|-------------|---------------|
| **Junction → battle stats** | How junctioned magic translates to BATTLE_SLOT_DATA stats at init | Part of battle init; reads from save/character data |
| **Save data → battle slots** | Complete mapping between save structure and combat slots | Part of battle init |
| **Battle end / rewards** | EXP/AP/Gil distribution, item drops, card drops, level up, victory fanfare | Runs after all enemies are dead; separate state in battleLoop |
| **Timed status expiry** | Timer tick for Doom, Gradual Petrify→Petrify, timed buffs | sub_483470 identified but not decompiled |
| **Battle camera system** | Camera positioning, cinematic camera during spells/GFs | Multiple functions in 0x56XXXX range |

---

## Priority Prompts

See below for the two Tier 1 prompts: Enemy AI VM and Battle Init Sequence.