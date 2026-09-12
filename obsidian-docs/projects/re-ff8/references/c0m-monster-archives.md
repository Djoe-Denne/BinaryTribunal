---
title: C0M Monster Archives
category: references
tags: [ff8, battle-system, runtime-memory, reference]
aliases: [C0M registry, monster dat sections, battle model loaders]
sources:
  - docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md
  - docs/tech/investigation/battle-static-discovery/closure-audit.md
  - docs/tech/investigation/battle-static-discovery/c0m-registry.json
  - docs/tech/reference/address_catalog.md
summary: Byte-exact C0M corpus (144 wired payloads plus 56 filler aliases), 11-section layout with IDA consumers, and the actor-id loader dispatch.
provenance:
  extracted: 0.93
  inferred: 0.05
  ambiguous: 0.02
created: 2026-09-10T14:30:00+02:00
updated: 2026-09-11T08:50:00+02:00
---

# C0M Monster Archives

PC `battle.fi/fl/fs` (`lang-en`, hashes pinned in the registry) holds 200 `c0m000.dat…c0m199.dat`. The EXE wires only `C0M000..143` via `BattleFilesArray[166..309]` (`0xB84CCC`); `C0M144..199` are 56 byte-identical filler aliases (SHA `90422600…41c`). Registry `c0m-registry.json` (v1.2, SHA `7ef0ab55…eed5df`) re-extracts with zero section-level mismatch. No `C0M144` string exists in the EXE.

## Loader Dispatch (`0x507080`)

`BattleModel_DispatchLoaderByActorId` routes on `actor_id` (Hex-Rays hides the `sub ebx, 0x1000` for weapons — trust the disassembly):

| `actor_id` | Loader | Files |
| --- | --- | --- |
| `< 16`, ≠ 7 | `0x5077B0` bodies | `PartyModelsArray` (`0xB8B914`) → `D0C*` (7 sections, TIM H6) |
| `== 7` | `0x5079B0` Edea body | `D7C016.DAT` (10 sections, TIM H9, weapon H10) |
| `16..4095`, ≠ 143 | `0x507120` monsters | C0M 11 sections, `file_id = actor_id + 150` |
| `== 143` | `0x507F80` derived | C0M127 2-section overlay (below) |
| `≥ 4096` (≠ Edea/Zell/Kiros) | `0x507BF0` weapons | `PartyWeaponsArray` (`0xB8B940`) → `D0W*` (8 sections, TIM H7) |
| `4097`/`4105` Zell/Kiros | `0x507E20` inline | 5-section files, **H1 = mesh**, TIM H5, no `0x507010`, inlined into the type-1 body record |
| `4103` Edea weapon | immediate return | `PartyWeaponsArray[7] = NULL` |

Monster mapping: `monster_id 16..159 → C0M000..143` (`id − 16`). IDs 11–15 would overrun the 11-entry party lists; no static caller passes them.

## C0M 11-Section Layout (consumers in IDA)

`BattleModel_LoadMonster` copies H1–H9, sends H11+H2 to `BattleModel_AllocateTexturePagesAndPatchTPage` (`0x507400`), and publishes H7/H8 to the domain:

| H | Role | Consumer |
| --- | --- | --- |
| H1 | skeleton (byte 0 = bone count; bones stride `0x30` after `0x10` header) | `BattleSkeleton_BuildHierarchicalFK` (`0x508C90`) |
| H2 | mesh (TPage patched against H11) | `BattleMesh_RemapPrimitiveTPageBits` (`0x507550`), `RenderGeometry` |
| H3 | animation clips (`u32` count + `{3,6,9,16}`/`{3,6,8,12}` bitstream) | `BattleAnim_ReserveBonePoseScratch` (`0x507010`), `0x509440`, `0x508F90` |
| H4 | UV-slot table, 16–324 bytes (37/143 present) | `BattleModel_ApplyH4UvSlot` (`0x50C780`) + sisters `0x50C860`/`0x50C950`, via `0x504BB0` opcodes `0x80/0x9B/0x9F/0xBD/0xBE` |
| H5 | animation sequences (`u16` count + offsets, never empty) | attack scripts (format-proven, consumer naming open) |
| H6 | **camera collection BASE** (do **not** apply stage `res+u16[res+4]`; `u16` count + banks + 8 tracks, **×2** scale; 133/143, c0m101 alone has 2 banks; attested max 22 keys/seg vs engine 32) | `0x505F00` (null-guard only), `0x506190`, `0x5064F0` (tracks 22/23 succeed only on c0m101) read record `+0x2C` |
| H7 | monster info, always 380 bytes | `setMonsterInfoFromDatInfoSection` (`0x48BBD0`) |
| H8 | monster AI (subsection header) | `EnemyAI_DispatchSection` (`0x4877F0`) / VM `0x487DF0` |
| H9 | **AKAO sound table** (count + offsets + embedded `AKAO`, never at byte 0) | format-proven; no direct C0M consumer shown — `BS_SetAKAOHeader` (`0x501C60`) is a global reset |
| H10 | raw AKAO (`AKAO` at +0) or empty (113/143) | same AKAO family caveat as H9 |
| H11 | TIM container (`u32` count + offsets, `0x10` magic) | `0x507400`, `GetTextureEOF` (`0x505E30`) |

Dominant layout: only H4 empty (85 files). Skinning is rigid (one bone per batch, no weights) in `RenderGeometry`/`ParseVertices`.

## C0M127 (Ultimecia Second Form)

460 bytes, 2 sections: H1 = 380-byte replacement info (name `UltimeciA`, 197/380 bytes differ from C0M126), H2 = 64-byte AI stub. Loader `0x507F80` borrows the live type-3 record of actor 142 (skeleton/mesh/anims/TIM), forces `[4] = unk_1D999C0`, and slots 127's H1/H2 into the info/AI positions. "Derived from C0M126" describes the **record reuse**, not file bytes.

`g_BattleResourceRecords` (`0x1D99768`) is a shared typed pool of 11×`0x34` records (0 empty / 1 body / 2 weapon / 3 monster), not an 11-actor table.

## Related

- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]]
- [[projects/re-ff8/concepts/enemy-ai-vm]]
- [[projects/re-ff8/concepts/battle-camera-architecture]]
- [[projects/re-ff8/references/battle-address-catalog]]
