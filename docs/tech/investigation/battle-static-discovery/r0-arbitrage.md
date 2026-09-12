# R0 — Arbitrage : recensement, gap-analysis, verdicts PE (2026-09-12)

Parent : arbitrage après 3 triplets read-only (9 rapports) + spot-checks
au désassemblage. Méthode §2 HANDOFF respectée (grok-4.6-xhigh /
muse-spark-1.3-max, sous-agents read-only, IDB non mutée).
Seule vraie divergence inter-rapports (IA test-type 08) tranchée par le
parent au disasm + bytes de table (§4).

Documents : périmètre [`r0-scope.md`](r0-scope.md) /
[`r0-scope.json`](r0-scope.json) (R0.1, figé).

## 1. Recensement entrée→sortie (9 maillons, statuts arbitrés)

Typé = structs C / layouts exacts ; documenté = comportement + VA ;
trou = absent ou spéculatif. Statuts **après** corrections R0 (§5).

| # | Maillon | Docs | VA clés | Statut |
|---|---|---|---|---|
| 1 | Transition in | `encounter_trigger.md`, pipeline §13, `battle_entry_hook.md` | `0x47CA90`, `0x541C80`, `0x523294`, `0x4706B0`, `0x559890` (72/82), one-shot `0x56D1D0` | Documenté. Trou borné : scanlines 490 DWORD sans clamp |
| 2 | Init battle | `battle_init.md`, `battle_slot_data.md`, `battle_slot_layout.md`, `kernel_tables.md` | `0x47CCB0`, `0x48D0E0`, `0x48B7E0`, `0x48BA10`, `0x48AFD0`, `0x48C620`, handoff `0x47D6F8` | Typé partiel + documenté. Trous : slots GF 8–10, `scene.out` 128 champs, `K_MISC` |
| 3 | Loop | `battle_loop.md`, `battle_entry_hook.md` | `0x47CF60`, `0x4A84E0`, `0x47CCB0`/`0x47D70F`, 5 checks fin | Documenté. Pas de struct C des flags de mode |
| 4 | ATB | `atb_system.md` (TBD levé §5), `battle_slot_data.md` | `0x4842B0`, `0x484490`, `0x4844D0`, miroir `0x1CFF180` | Documenté + offsets typés. Masque `0x02004000` clos (Confuse\|Angel Wing → auto) |
| 5 | Commandes / menus / ciblage | `command_pipeline.md`, `command_menu.md`, `pending_action.md`, `command_id_table.md` (+ ciblage HUD clos §4) | `0x484D20`, `0x4847F0`, `0x485460`, `0x485160`, `0x4BB9E0`, `0x4C7090` (HUD), `0x484FD0` | Pending typé, pipeline documenté. Trous : exec queue, SM Draw 44 cas, ciblage domaine, Silence/Zombie, `command_arg` GF |
| 6 | IA | `enemy_ai_vm.md` (test 08 clos §5) | `0x485610`, `0x4877F0`, `0x487DF0`, `0x48A680` | Typé + documenté (61 opcodes). Trou : alt-globals, Angelo/Moogle |
| 7 | Dégâts / statuts | `damage_pipeline.md`, `status_pipeline.md` (bypass clos §5), `status_bits.md` | `0x48FE20`, `0x4922B0`, `0x491AD0`, `0x494410`, `0x492AC0`, `0x4914E0`, `0x493840`, popup `0x5068B0` | Documenté + kernel/slot typés. Trous : switch 255 cmd, constantes élémentaires, exclusion mutuelle, timers |
| 8 | Récompenses | **`rewards.md` (créé §5)**, `battle_init.md` (XP), pipeline §13 | `0x494D40`, `0x4A6680`, `0x4A2690`, `0x47DFC0`, `0x47CDAB`, GF queue `0x1CFF6E4` | Documenté (séquence prouvée). Trou : packing interne Mode5 (476 insns non déroulés) |
| 9 | Transition out | **`battle_cleanup_and_reset.md` (créé §5)**, `battle_loop.md`, pipeline §13 | `0x4868C0`, `0x47DFC0`, `0x47CEF0`, modes 5/100, `btitle.ovl` debug | Documenté (séquence prouvée). Trou : reset exhaustif des transients |

## 2. Trous bloquants (liste fermée R0)

**Clos par R0.3** (preuves §4, docs corrigées §5) :
`rewards.md` absent, `battle_cleanup_and_reset.md` absent, bypass statut,
masque ATB TBD, test-type IA 08, `BACK_PREEMTIVE_INFO`, `ENCOUTER` type,
EndCleanup bit, popup ordonnancement, formules steal/drain/miss/Reflect/Shell.

**Restent ouverts (nommés, priorisés)** :
1. SM Draw `0x4ADDB0` : 44 cas non déroulés (PARENT_CHECK ×2).
2. Switch `COMMAND_TYPE_ID` `0x48FE20` (~255 cmd, 2e switch `ATTACK_FLAG`)
   + ~18 sous-types magie (PARENT_CHECK).
3. Constantes élémentaires `0x491AD0` (`(0x384−elem_def)`, diviseurs
   exacts) à recalculer aux magics.
4. `command_arg` GF 12/16 unconfirmed (méthode : dump `K_GF_JUNCTIONABLE`
   depuis case 254 de `0x48FE20`).
5. Exec queue `0x1D288E8`/`0x1D288EE` (packing `command_id`/`action_id`).
6. Slots GF 8–10, `FF8SceneOut` 128 champs, `K_MISC` (struct absente).
7. Ciblage domaine (`Battle_BuildTargetVisibilityMasks` `0x485FF0`,
   masques visibilité) — le HUD `0x4C7090` est clos, le domaine non.
8. Exclusion mutuelle `0x4918C8`, `HIT_ATTACK_ENABLER`×SPR, timers statut
   (`0x483340`/`0x483370`, site d'init des durées).
9. `BattleAction_ExecuteCurrent` `0x4856C8` (IA-only ?), Silence/Zombie menu.
10. Conflits mineurs non tranchés : `0x494360` (crise vs HP 50/25),
    pending 9 vs 3, `0x48B260` (party vs ennemi), `0x48EA93`,
    LUCK/EVA index 8, Draw `0x06` vs case 3, Odin seuil (nom), `0x4850FA`.

## 3. Verdicts R0.3 (convergences 3/3 sauf IA-08 : 2-1 + parent)

| Point | Verdict | Preuves |
|---|---|---|
| Sortie / modes | PROUVÉ | checks→timer `0x47DFC0` (60/30/40)→countdown→`0x4868C0`→mode 5 (`0x4A6680` + `AnimationState=4` **hors corps** `0x47CDAB`, spot-check parent)→mode 100→`exit_battle`+`AnimationState==4`→`0x4A2690` vs ModuleHandler ; `0x47CEF0` viewport+TPage ; `btitle.ovl`→`0x47EEF0` debug |
| BACK_PREEMTIVE | PROUVÉ | writer `0x48B093` ; `0x20→1`, `0x40→2` (spot-check parent, accès **byte**) ; mapper `0x48B2A0` ; ATB `jpt_48B144` ; display 46/45/44/47 ; escape 1-2 vs 3-4. **0 normal, 1–2 back, 3–4 preempt**. `battle_init.md` OK ; `encounter_trigger.md` + catalogue FAUX |
| Ciblage HUD | PROUVÉ | `0x4C7090` SM 235 insns, états 0–7, commit état 2 (Append+Flush), enqueue `0x12` état 3 |
| Popup | PROUVÉ | `0x493D80` @ `0x5066AB` **avant** `0x5068B0` @ `0x5067FF`/`0x506847` ; popup sans store HP ; commit `0x4946BC` |
| Bypass | PROUVÉ | `test HIT_STATUS_2,0x04000000` @ `0x492AC0` (spot-check parent), 1=bloqué 0=ok ; clear `0xFBFFFFFF` @ `0x4914E8`. `status_bits.md` OK ; `status_pipeline.md` polarité inversée + bypass mal posé |
| Draw petites | PROUVÉ | `0x4ADD10` open, `0x48CA70` flags, `0x48FD20` steal (clamp 0–9), `0x486A10` add/remove cap 100 (catalogue « Deduct » = misnomer) ; SM `0x4ADDB0` PARENT_CHECK |
| Masque ATB | PROUVÉ | `test eax,0x02004000` @ `0x4843FE` = Confuse `0x4000`\|Angel Wing `0x02000000` → auto vs menu |
| Formules | PARTIEL | chaîne + miss (`HIT_TYPE_2\|=4`) + drain (bit `0x8000`) + Reflect + Shell + commit HP prouvés ; switch 255 + sous-types + constantes ouverts |
| IA test 08 | PROUVÉ (CR-A/CR-B + parent) | `jpt_4887D6[8]` = `0x489106` (bytes table lus par parent ; l'analyse citait à tort `0x488F86`) : scan `com_file_id` stride `0xD0`, présence brute (cmp 0/3) ; case 9 = présent+actif |

## 4. Arbitrage des contradictions doc-doc

**Tranchées au PE (docs corrigées §5)** : BACK_PREEMTIVE (3 voix →
`battle_init.md`), bypass (→ `status_bits.md`), `ENCOUTER` u16/u8
(→ **uint8**, accès byte `A0`/`A8` prouvés, aucun accès word relevé),
EndCleanup « STATUS2 0x20 » (→ `status_1` Berserk `and 0xFFDF`),
`0x486A10` add-vs-deduct (→ add/remove selon `arg_8`), test 08
(→ présence brute), opcode VM 08 (→ DIE_SELF `0x489D48`, pas
END_TURN_ANIM), ATB TBD (→ clos).

**Non tranchées** (trou §2.10, méthode proposée §6) : `command_arg` GF,
pending 9v3, `0x494360`, `0x48B260`, `0x48EA93`, LUCK/EVA, Draw 0x06,
Odin, `0x4850FA`, ENCOUTER bit 3 vs table bits (le bit 3 no-XP de
`battle_init.md` n'est pas contredit au PE, juste absent de la table
`encounter_trigger.md` — les deux peuvent être vrais).

## 5. Fichiers modifiés par R0 (2026-09-12)

- Créés : `docs/tech/systems/rewards.md`, `docs/tech/systems/battle_cleanup_and_reset.md`,
  `docs/tech/investigation/battle-static-discovery/r0-scope.md|.json`,
  ce fichier.
- Corrigés : `encounter_trigger.md` (BACK table + forcés + Key Globals),
  `status_pipeline.md` (gate + gaps), `atb_system.md` (TBD levé),
  `enemy_ai_vm.md` (test 08), `battle_init.md` (`ENCOUTER` uint8,
  EndCleanup bit), `address_catalog.md` (BACK + ENCOUTER bits),
  `damage_pipeline.md` (Open Questions resserrées), `draw_system.md`
  (rôles prouvés).
- IDB : **non mutée** (R0 spec, aucun rename ; topology E3c inchangée).

## 6. Premier pourcentage (définition opposable, baseline R0)

Ne jamais citer un % sans sa définition. Trois métriques publiées
ensemble ; dénominateurs figés par [`r0-scope.json`](r0-scope.json) :

1. **rewrite** = unités reproduites + testées / 2276 (L0∪L1).
   Baseline R0 : **0 %** (R0 = spec, aucun module réécrit — honnête).
2. **spec** = unités à rôle prouvé / périmètre, par couche :
   L0 nommés 792/1594 (**49,7 %**) ; L1 structurelle 686/686 (**100 %**,
   sémantique partielle) ; L2 inventaire 493/493 (**100 %**),
   clos 117/493 (**23,7 %**), callbacks typés 0/1771 (**0 %**) ;
   domaine 9/9 maillons documentés au niveau séquence, 10 trous fins §2.
3. Le « 28 % » historique reste une couverture **lexicale** du graphe
   élargi, pas un avancement rewrite. Ne le citer qu'avec cette réserve.

## 7. Découpage opérationnel proposé (R1+)

- **R1 fixtures** (parent + 1 triplet validation) : corps générique,
  monstre, arme (H2/H4/H11/TPage), Edea, Zell/Kiros ; cas mag.00/01.
- **R1 visionneur** : spec (formats §12 pipeline) → implé → tests fixtures.
- **R2 seams** (triplets par couture) : matrice 66 slots, draw-list,
  OT 24 o / paquets, caméra/stages, MagicList/DRAW, callbacks L2 typés.
- **R3.0 RE résiduelle** (triplets, §2.1–10 avant/après selon blocage) :
  SM Draw 44, switch `0x48FE20`, constantes élémentaires (magics),
  `command_arg` GF (dump K_GF case 254), exec queue, slots GF, scene.out,
  K_MISC, ciblage domaine, timers statut, conflits §2.10.
- **R3 modules** : scheduling/submit → présentation → domaine (§5 HANDOFF).
- Règle : tout KEEP 68 rouvert uniquement si déclaré bloquant avec VA.
