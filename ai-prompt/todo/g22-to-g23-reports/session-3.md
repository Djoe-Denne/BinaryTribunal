# Rapport session 3

```text
Session : 3
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6
G23 commencé : non
Live lancé : oui
satisfied proposé : false
```

## Waiver ledger (avant injection)

```text
gate: G22
candidate_source: RelWithDebInfo ff8_battle_iso after G22 sessions 1–2 (dead-timer octet + SG_PARTY_BATTLE checksum+0xAF4)
candidate_dll_sha256: 5d5f5c61d39fcbfe99854624db8b6afe251f7ee02d04d17d5d60341de3fabc77
policy_status: constrained-live-anchor
review_or_test_pack: evidence/g22-constrained-anchor-test-pack-2026-08-29.md
date: 2026-08-31

L22-A | LIVE-REQUIRED | field handoff ordinary; visible fight; host step 4; G07 file+BdLink = 1; party Attack; enemies stay up | — | yes | yes
L22-B | LIVE-REQUIRED | refuse-active same ready battle; AlreadyActive; write_count==0; memory hash unchanged | — | yes | yes
L22-C | LIVE-REQUIRED | field then Detached; restore_hash==preimage_hash; every G22-owned hook restored; process alive | — | yes | yes
v3 envelope | LIVE-REQUIRED | complete preimage / write+readback / queue-reset 3 / enqueue detour / G07 pair | — | yes | yes
fail-closed residuals | LIVE-REQUIRED | junction/draw/dead-timer-host/story/crisis/enqueue-eligibility not written | — | yes | no
T22-01/02/03/04/05 | SET-ASIDE-VERIFIED | formulas + collector negatives re-run 2026-08-31 after battle_init.cpp sessions 1–2 | tests/offline/test_g22.cpp G22 exit 0 | no | no
L22-A×2 | SET-ASIDE-VERIFIED | second fresh process | T22-01 + constrained-anchor policy | no | no
DeadTimer octet | SET-ASIDE-VERIFIED | K_MISC+0x0F=200 | session-1.md + test_g22 | yes (zero host write) | no
PartyDerivation map | SET-ASIDE-VERIFIED | triplet 01 00 02 ff → slots 1/0/2 | session-2.md + test_g22 + sg_party.bin | yes (no party max_hp write) | no
SQ-G21-001 | SET-ASIDE-CERTAIN-UNKNOWN | junctions / story | SQ-G21-001 | yes | no
SQ-G22-005/006/007/008 | SET-ASIDE-CERTAIN-UNKNOWN | crisis / per-enemy DAT / ordinary roll / max_hp | named SQs | yes | no
SQ-G22-003 host write | SET-ASIDE-CERTAIN-UNKNOWN | dead-timer not on G22 allowlist | SQ-G22-003 | yes | no
SQ-G22-004 | SET-ASIDE-VERIFIED | mechanical enqueue detour re-observed; eligibility still 0/0 | v15 + this card | yes | no
```

Do not merge `5d5f5c61…` with `14cd2bbf…`, `d901a8c2…`, `dba19f39…`.

## After-action addendum

```text
process_id: 43988
dll_sha256_observed: 5d5f5c61d39fcbfe99854624db8b6afe251f7ee02d04d17d5d60341de3fabc77
actions_run: L22-A ordinary visible + operator Attack; L22-B refuse-active; return to field; L22-C shutdown
safety_red: no
L22-A: PASS constrained — BattleActive, scene=692, host 3/3/1/4, writes=21/21, preimage=487/487, G07 file+BdLink=1/1 observed, SEH=0, queue-reset 3/7/1/0 writes 9/9, enqueue replacement/native 1/0 masks 0/0, native_helpers=0, imported=0, refused_mask=373
L22-B: PASS — injector win32=6 = BUSY attendu; error=8; writes=0/0; memory_hash 0xa0731382 unchanged
L22-C: PASS — Detached; restore_hash==preimage_hash==0xe8e55ae3; five G22 hook preimages restored; active_callbacks=0; process 43988 alive/responding
remaining_live_required: none for this constrained-anchor card
promotion_decision: no
```

## Périmètre tenu / dépassé

- Tenu : carte L22-A/B/C sur une DLL **nouvelle** (pas v15) ; process frais 43988 ; pas de debugger ; pas de flip `satisfied` ; pas G23 ; `refused_mask==0` non forcé.
- Dépassé : aucun.

## Preuves / code

- Bits ordinary live : **509 (v15) → 373**. Tombé : `PartyDerivation` (128). Encore : Junction(1)+DrawList(4)+StoryFlags(16)+InitialEnqueue(32)+CrisisCatalog(64)+OrdinaryStartType(256).
- DLL RelWithDebInfo PE32, flags bootstrap `0xc7`.
- Tests offline déjà verts session 2 (G21/G22/`validate_contracts`).
- Pages wiki : `p1-g22-battle-init-validation.md` mis à jour (ancre v16, `satisfied` reste false). Les hashes v1 de `evidence-policy.toml` restent historiques.

## Skips nommés

- `refused_mask == 0` : critère de promotion. 373 est l’ancre attendue après sessions 1–2.
- Junction / Draw / story / crisis / ordinary roll / per-enemy DAT / `max_hp` party : fail-closed, non écrits.
- Dead-timer : octet dérivé offline, **pas** sur l’allowlist hôte.
- Enqueue éligibilité : masks 0/0 ; detour mécanique invoqué une fois (SQ-G22-004 seam, pas fill de file party).
- `enemy_hp_hash=0x0b2ae445` : même hash v15 (SQ-G22-006). Pas un overlay Death : opérateur playable, slots non dérivés non écrits.

## Live (session 3 seulement)

- EXE SHA-256 : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`
- DLL SHA-256 : `5d5f5c61d39fcbfe99854624db8b6afe251f7ee02d04d17d5d60341de3fabc77`
- PID : 43988
- Enveloppes :
  - L22-A `evidence/battle-iso/p1-g22-v16-ordinary-visible-2026-08-31.json` `fed7916fb662e2910ba5440d31edc63e1cfec440ef9b70e10436a136e861af52`
  - L22-B `evidence/battle-iso/p1-g22-v16-refuse-active-2026-08-31.json` `deed9925813369bac88226e876728765ee19be94b64690992dfc6ef90f2b9a22`
  - L22-C `evidence/battle-iso/p1-g22-v16-post-shutdown-2026-08-31.json` `d27794dfa109aa439a48cf1e993c0bce8c022fd2941f1862016e756d59dd6420`
- `refused_mask` ordinary : **373**
- restore_hash == preimage_hash : **oui** `0xe8e55ae3`
- native_helper_calls / imported_post_init : **0 / 0**
- Safety rouge : aucun

Hashes proposés pour une future ligne policy (ne pas les écrire dans `evidence-policy.toml` aujourd’hui) : DLL `5d5f5c61…` + les trois SHA d’enveloppes ci-dessus. Les v1 `14cd2bbf…` / `a1a0a66c…` / `840888d4…` restent le lock historique.

## Pour le chat parent

Rester **constrained-live-anchor**. Carte L22-A/B/C verte sur le candidat v16 ; `PartyDerivation` tombe live (373). Ne pas promouvoir : residuals nommés + `refused_mask != 0`. Pas G23.

Bloqué sur : jonctions / JFlag / `max_hp` ; Draw ; DAT par ennemi ; roll ordinary ; consommateur `special_id=0` / éligibilité enqueue.
