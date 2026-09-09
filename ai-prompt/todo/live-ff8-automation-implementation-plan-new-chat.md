# Automatisation live FF8 — plan d'implémentation (nouveau chat)

Tu es un **nouvel agent**. Ce document est le livrable de l'investigation
`live_ff8_automation_89fe0af7.plan.md` (2026-09-09). Il a été produit **sans
écrire une seule ligne de code de solution**, par lecture des sources et des
evidence. Il est ton brief autoritatif pour implémenter, tranche par tranche,
un pilotage machine de `FF8_EN.exe` compatible avec la loi live.

Ne committe, ne pousse et ne réinitialise aucun worktree sans demande
explicite. Pas d'IDA sur un PID de preuve. Une action utilisateur à la fois,
en français.

Repos :

- ISO / DLL : `C:\Users\djden\source\repos\retro-eng\FinalFantasy_VIII_Reimaginated`
- Recherche / `ff8re` / doc : `C:\Users\djden\source\repos\retro-eng\re-ff8`
- Injecteur : `C:\Users\djden\source\repos\FFScriptLoader`

---

## 0. Décision (résumé exécutif)

| Bus | Verdict | Motif court |
| --- | --- | --- |
| **Bus 0 — orchestration lecture seule** (wrapper autour des primitives existantes) | **MVP, tranche 0** | Zéro écriture mémoire, zéro ABI, ferme le trou « `Invoke-IsoGroup` spécifié, jamais livré ». Convertit tous les prompts de classe A en machine. |
| **Bus B — pending synthétique stagé côté DLL** (nouveau scénario G09 `SYNTHETIC_PENDING`, réutilise le chemin de staging G07 déjà promu) | **MVP, tranche 3**, après durcissement provenance (tranche 2) | Seule voie d'écriture qui passe par `WriteGuard`, allowlist, préimage, readback, restore et témoin versionné. Réutilise un précédent promu (G07 closure = `ActionRequest` scriptés). Attack `0x01` uniquement. **Rehearsal / régression, jamais promotion.** |
| **Bus A — `WriteProcessMemory` externe des 8 octets** | **Rejeté** | Invisible au hook `BattlePendingActionWriteHook` (les captures `LIVE_PENDING` G08/G09/G11/G12 n'y vivent que là) ; écrivain non classifié → stop universel ; course avec `BattlePendingAction_TransferToExecQueue` chaque frame ; ne prouve rien que `ff8re` ne fasse déjà sous IDA. |
| **Bus W — appel direct de `BattlePendingAction_Write` `0x484D20`** | **Rejeté** au profit du Bus B | Traverse le hook mais G09/G11/G12 ne vérifient **pas** le caller → indiscernable d'un menu authentique = trou de provenance ; écriture native non comptée par `WriteGuard` → « host state drifted » ; concurrence thread distant vs boucle de jeu ; saute le commit EQUAL G12. |
| **Bus C — replay d'entrées (SendInput / pad virtuel)** | **Reporté** | Seul bus à provenance authentique, mais exige un oracle curseur/menu **absent** de l'address map (certain unknown), le focus fenêtre, et relève du territoire G24 (« scripted replay »). À rouvrir après promotion statique des globals HUD/curseur. |
| **`ff8re` + IDA** | **Rejeté pour tout PID de preuve** ; conservé comme banc RE | Débogueur = témoin non promotionnel (loi dure) ; crash WOW64 `0x4000001F` documenté 2026-07-18. |

Périmètre MVP : tranches 0 → 3 ci-dessous, sur **Attack `0x01`** (G09-shaped)
et sur la coquille A des cartes G23. Hors périmètre MVP : Fire / Potion /
Draw synthétiques (classe C, menu authentique obligatoire), GF `0x03`,
Bus C, bindings G23.

---

## 1. Fiche — Lois et hypothèses figées (piste « brief »)

### 1.1 Faits lus

- Loi live, `.agents/skills/ff8-live-necessity-filter/SKILL.md` §« Hard law —
  never waivable » : « Fresh FF8 process, no debugger » ; « EXE + DLL SHA-256
  recorded; no merge across hashes » ; « `validate_contracts` + Win32 build +
  PE32 before inject » ; « Write-guard / allowlist: no adjacent byte written » ;
  « Complete preimage of every range the gate may write » ; « Readback of every
  successful write » ; « Byte-exact restore + process alive + `Detached` » ;
  « Direct observation of any same-frame effect the gate claims » ; « Collector
  rejects incomplete / contradictory witnesses » ; « One user action at a time;
  French operator prompts ». Et : « Waivers never flip `[promotion.Gxx].satisfied`. »
- Layer law, `.agents/skills/implementing-iso-layer-boundary/SKILL.md` :
  RVA / `find_symbol` / `write_rva` → runtime adapter ou synchronizer ; POD →
  `abi/` ; « `BattlePendingAction_Write` stays a seam » ; `core/` interdit
  d'ABI, RVA, NCOMP, `import_legacy`.
- Hardening, `obsidian-docs/projects/ffscriptloader/skills/hardening-x86-dll-injection.md`
  §5 : « Do not attach a debugger for the routine injection sequence » ;
  « inject from field/menu rather than during an active battle » ; canary
  lecture seule pour identité, mode/substeps, préimage, détours, restauration,
  vivacité.
- Evidence négative `evidence/blocked/debugger-resume-crash-2026-07-18.md` :
  reprise sous débogueur → WER `0x4000001F` à `ntdll.dll+0x79F6C` (« WOW64
  breakpoint exception ») ; « Subsequent live validation must run injector
  exports without an attached debugger and use `tools/capture_live_canaries.py` ».
- `manifests/evidence-policy.toml` : **G07…G22 sont `satisfied = true`**
  (G11 2026-08-18 DLL `0b3c4bb9…`, G12 2026-08-25, G13 2026-08-25, G22
  2026-09-02) ; **G23 `satisfied = false`**.

### 1.2 Conséquence structurante

La « première promotion authentique » G11/G12/G13 est **déjà acquise**.
L'automatisation ne sert donc pas à promouvoir G11–G13 ; elle sert à :

1. **répéter / régresser** (nouveau candidat DLL, non-régression G07–G22) ;
2. **tenir la coquille** des campagnes futures (G23 cartes S/W/T/V/E, G24+) ;
3. **réduire le coût opérateur** des prompts de classe A.

Toute re-promotion d'un gate menu (G11/G12/G13) sur un nouveau hash reste
soumise au pending **authentique** : le contrat le dit dans le header
(`launch_contract.h`, commentaire `FF8ISO_G11_MAGIC_LIVE_PENDING` : « G11
deliberately has no synthetic live scenario: the first promoted boundary must
prove the real menu payload and battle stock » ; `FF8ISO_G12_ITEM_LIVE_PENDING` :
« after the native menu has already committed EQUAL »).

### 1.3 Hypothèse de départ du plan : confirmée

Le goulot n'est **pas** le format des 8 octets. C'est (a) l'orchestration sans
débogueur, (b) la **classe de preuve** d'un paquet piqué, (c) le fait que le
runtime ne voit un pending « live » **qu'à travers son hook**.

---

## 2. Fiche — Cartographie opérateur (piste 1)

Sources : `g11-live-single-cast-session-plan.md` §« Authentic Fire », §« Pass and
shutdown » ; `g12-live-item-session-plan.md` §« Operator actions » ;
`g13-live-draw-session-plan.md` ; `ai-prompt/todo/g13-live-draw-direct-replacement-new-chat.md`
(séquence de commandes complète) ; `evidence/g22-battle-init-live-promotion-v5-2026-09-02.md` ;
`evidence/battle-iso/g23-v2/card-V-victory.md` ; waiver G23 v2.

Classes : **A** déjà scriptable · **B** équivalent paquet plausible · **C**
menu natif exigé pour la preuve · **D** binding monde / save / rencontre ·
**V** (ajout à la grille) observation visuelle humaine, LIVE-REQUIRED, aucun
bus ne la remplace.

| # | Prompt opérateur (tel que joué G11–G23) | Classe | Témoin machine existant | Manque |
| --- | --- | --- | --- | --- |
| 1 | « Ferme FF8 ; je vérifie le SHA-256 gelé de la DLL » | A | `Get-FileHash`, `validate_contracts.py`, `app_injector validate <dll> --sha256` | Un seul script qui refuse si `FF8_EN.exe` vit encore (LNK1168) |
| 2 | « Démarre un **nouveau** `FF8_EN.exe` » | A/D | `capture_live_canaries.py` `find_process` (exige exactement 1 PID) | Contrôle « pas de débogueur » (`CheckRemoteDebuggerPresent`, lecture) et heure de démarrage du process (évidence G22 la note) |
| 3 | « Charge une sauvegarde jetable » | D | aucun | Binding save (slot / chemin) — hors harness |
| 4 | « Reste au field / menu et préviens-moi » | A | canary `--expect field` (`safe_field_or_menu = mode != 3`) | rien |
| 5 | Bootstrap | A | `make_bootstrap_payload.py` + `app_injector … --bootstrap-export FF8Iso_Bootstrap --bootstrap-payload` | Vérification automatique `all_hook_seams_installed` juste après |
| 6 | « Entre en combat avec <caster / monstre / stock> » | D | canary `--expect battle-g07` (`battle_post_init` = mode 3, phase `[3,1,4]`, seams G22) | Rencontre nommée = binding ; l'oracle « idle » manque (voir fiche 4) |
| 7 | Armement suite | A | `make_suite_payload.py` + `app_injector … --bootstrap-export FF8Iso_RunInProcessSuite` ; code de sortie = statut export (`win32=6` = `BUSY`) | Décodage systématique du code de retour en `FF8IsoStatus` |
| 8 | Vérif armement avant action | A | `capture_runtime_evidence.py --g13-mode direct-arm` (G13) ; snapshot `FF8Iso_EvidenceSnapshot` lu par `ReadProcessMemory` | Équivalent générique « armé, capture=0 » pour G09/G11/G12 |
| 9 | « Confirme **une** Fire » (G11) | **C** | hook `capture_g11_live_pending_write` (`0x02`, spell `0x01`, cible ennemie directe) | Aucun bus légal ne remplace le menu |
| 10 | « Confirme **une** Potion » (G12) | **C** | `capture_g12_live_pending_write` + `menu_commit_observed` | Le commit EQUAL est fait par le menu natif **avant** l'écriture pending |
| 11 | « Draw → sort → Cast / Stock » (G13) | **C** | hook `PendingCmdQueueOrStoreHook` avec `_ReturnAddress()` = `kG13DrawQueueOrStoreCallerRva 0x000AF064` | Fail-closed natif : un appel non-menu échoue le template |
| 12 | « Sélectionne et termine une Attack normale » (G22 playability, G09 live pending) | **B** | `capture_g09_live_pending_write` (`entry 0`, slot 0..2, `0x01`, arg 0, masque ennemi direct) | Bus B (tranche 3) |
| 13 | Invocation GF (`0x03`) | B (hors MVP) | G18 `GfProvenance::PlayerSummon` | Présentation GF = NCOMP scellé ; risque élevé, pas MVP |
| 14 | « Mets / retire la pause » (G16 exige `IS_BATTLE_PAUSED`) | C | latch `IS_BATTLE_PAUSED 0x01928de9` **lecture** | Aucune allowlist n'autorise à l'écrire ; Bus C seulement |
| 15 | « N'appuie plus (fenêtre 60 s) » | A | collector + timeout | rien |
| 16 | « Signale les anomalies visuelles / HUD et 3D visibles » | **V** | aucun (G07 : premier run machine-vert **écran noir**) | Aucun bus ; reste humain |
| 17 | « Retour terrain, shutdown » | A (+D pour le retour terrain) | `FF8Iso_Shutdown`, canary `--expect restored-g07`, procédure `BUSY` une-reprise | Séquencement automatique + refus du second `BUSY` |
| 18 | Cartes G23 S/W/T/V/E : opcode `0x39`, Phoenix, timer, victoire écran récompense, 2 escapes | **D** | témoins G23 v2 | Bindings vides (waiver G23 v2 §« Binding gaps ») |

Prévision confirmée : un paquet B ne convertit **aucun** C en A. Les playbooks
G11/G12/G13 mélangent A (coquille) et C (geste) ; le plan sépare la coquille
(automatisable) du geste (humain).

---

## 3. Fiche — Surfaces existantes (piste « map »)

| Surface | Capacité réelle lue | Limite de preuve |
| --- | --- | --- |
| `tools/capture_live_canaries.py` | `ReadProcessMemory` seul (`PROCESS_VM_READ|PROCESS_QUERY_INFORMATION`) ; 9 hooks avec préimages ; `mode`, `phase[3]`, `battle_paused`, `action_in_progress`, `hud_phase` ; `--expect field/battle/battle-g07/restored/restored-g07` ; poll 50 ms | Aucun champ ATB, aucun pending, aucun latch résultat, pas d'« idle » (fiche 4) |
| `tools/capture_live_pending_writes.py` | Poll lecture seule de `0x01928D44`, **9 entrées × 8**, intervalle 1 ms, match `command_id/arg/active==1` | Peut manquer un write+consume same-frame ; c'est un **diagnostic**, pas l'oracle. L'oracle same-frame est le témoin G07 (`pending_write_count`, `transfer_call_count`, `pending_hash_staged/transferred`) |
| `tools/capture_runtime_evidence.py` | Lit l'export data `FF8Iso_EvidenceSnapshot` (RVA calculée sur la DLL locale, lue par RPM à `remote_dll_base + rva`) ; décode schéma 28 / 4856 o ; `--group`, `--before/after-canary`, `--assertion`, `--output` | Sans DLL locale identique, pas de lecture ; verdict = témoin, jamais texte opérateur |
| `tools/make_bootstrap_payload.py` | 128 o ; `result_address = 0` (« fire-and-forget ») ; seams optionnels exigent `--install-frame-seam` ; garde Odin/Gilgamesh par défaut | Le résultat 192 o n'est pas relu : seul le `DWORD` de retour remonte via le code de sortie de l'injecteur |
| `tools/make_suite_payload.py` | 64 o : `group[8]`, `profile[16]`, `flags`, `reserved[7]` ; G09/G10/G11/G12 partagent `run_g09_attack_suite` | `reserved[2]` ≠ 0 seulement pour G11 matrix ; `reserved[3..6]` doivent être 0 → tout nouveau wire = bump de protocole |
| `app_injector` (FFScriptLoader) | `<process> [dll] --bootstrap-export <name> --bootstrap-payload <path> --timeout-ms N` ; `validate <dll> [--sha256]` ; `test` (self-test) ; `IsWow64Process2` ; DLL cherchée dans le **cwd** ; code de sortie du thread distant = statut export → `remote-bootstrap-failed (win32=N)` | Pas de `--manifest/--profile/--group/--suite/--evidence` : la syntaxe `Invoke-IsoGroup` du doc milestones §4 n'existe pas ; déclarée obsolète dès G20/G21 |
| Exports DLL (`launch_contract.h`, `dllmain.cpp`) | `FF8Iso_Bootstrap`, `FF8Iso_QueryStatus`, `FF8Iso_RunInProcessSuite`, `FF8Iso_Shutdown` + data `FF8Iso_EvidenceSnapshot` | Aucun export « driver ». **Pas un trou** : `RunInProcessSuite` + scénario versionné est le canal prévu |
| Seam pending (`runtime.cpp` 1247–1306, `runtime_command_seams.cpp` 45–79) | Détours sur `BattlePendingAction_Write 0x00084d20` **et** `PendingCmd_QueueOrStore 0x00084fd0` quand `ENABLE_PENDING_WRITE_SEAM`; le hook appelle `capture_g08/g11/g12/g09_live_pending_write` puis supprime l'écriture native (`result = 0`) | Capture conditionnée à `g07_ownership_arm_pending_ && !armed` ; **aucun contrôle de caller** pour G08/G09/G11/G12 (G13 seul le fait) |
| Armement (`runtime_g09.cpp` 79–300, `runtime_g07.cpp` 2074–2135) | `run_g09_attack_suite` exige `Ready|BattleActive`, seams UI/switch + director + pending, zéro violation, aucun autre owner ; pose `g07_ownership_arm_pending_` et retourne `OK` ; `activate_g07_ownership_at_frame_boundary` reste « read-only watcher until the first complete active-battle frame boundary » et attend `captured_live_*` | Le geste opérateur peut arriver des secondes après l'armement ; c'est déjà asynchrone |
| G16 (`g16_ai_actions.cpp`) | Exige `BattleActive` **et** `IS_BATTLE_PAUSED != 0` ; préimage via `import_g07_host_image` ; écrit via `export_pending_blocks` sous `g16_pending_write_allowlist()` (= `BATTLE_PENDING_ACTION_BLOCKS 0x01928d44`, `0x48`), puis remet `p0_write_allowlist()` ; `restore_g16_pending_preimage()` au shutdown | La **pause** est sa primitive de synchro (pas la frontière de frame) ; allowlist = un seul range, pas d'exec queue |
| G07 closure (`runtime_g07.cpp`, `evidence-policy [promotion.G07]`) | `ActionRequest` **scriptés** stagés côté DLL, `export_g07_ownership` écrit pending + links + heads + cells + latch sous `g07_ownership_write_allowlist()` ; promu 2026-08-09 | Précédent d'un pending synthétique **légal pour la mécanique G07**, pas pour la provenance menu ; a exigé `operator-confirmed-hud-and-3d-visible-throughout-replacement-window` |
| `ff8re` (`README.md` 278–316, `battle_state.py`, `docs/tech/reference/pending_action.md`) | Injection sous IDA : BP `0x4842B0`, `idc.patch_dbg_byte` octet par octet, « `ida_dbg.write_dbg_memory` silently fails on the `active` flag byte at offset +7 » ; « Because injection writes the pending bytes directly (bypassing `BattlePendingAction_Write`), the write function is **not** hit — assert on the transfer » | Débogueur ; bypass admis ; `PENDING_COUNT = 3` alors que l'address map ISO dit `0x48` = **9** entrées (dette doc) |
| G06 « scripts » (`runtime_g06.cpp` 267–276, README §« P0.9 G06 ») | `held_buttons = kEscapeHeldMask` → `core::normalize_input_frame(...)` : entrée **synthétique interne** au tick ATB/escape possédé par la DLL | Ne touche pas le pad natif ; ne navigue aucun menu ; n'est pas un Bus C |

---

## 4. Fiche — Ready-loop sans breakpoint (piste 3)

`ATB_TICK 0x4842B0` et `PENDING_TRANSFER 0x4847F0` restent des syncs
**débogueur**. Équivalent lecture seule, à partir de `abi/src/address_map.cpp`
(tous `Confidence::Proven`) :

| Signal | RVA | Taille | Rôle dans l'oracle |
| --- | --- | --- | --- |
| `MODE_STATE_GLOBAL` | `0x018d8fc6` | 1 | `== 3` combat |
| `MODE3_SUBSTEP` / subsub / subsubsub (canary) | `0x018ff83c` / `0x018ff848` / `0x01927b04` | 1 chacun | `[3,1,4]` = `is_ready_for_active_tick` (`abi/src/legacy_battle_image.cpp`) |
| `IS_BATTLE_PAUSED` | `0x01928de9` | 1 | `1` gèle ATB et timers ; fenêtre sûre pour G16 ; faux « idle » si on veut voir une consommation |
| `ACTION_IN_PROGRESS_LATCH` | `0x01928dfd` | 1 | `!= 0` → une action s'exécute |
| `BATTLE_RESULT_LATCH` | `0x01928dfe` | 1 | `!= 0` → combat en train de finir (G23) |
| `BATTLE_ACTION_EXECUTION_ACTIVE` | `0x01927b00` | 4 | gel de progression pendant présentation (G09) |
| `BATTLE_ATB_PROGRESSION_ACTIVE` | `0x01928deb` | 1 | progression ATB admise |
| `BATTLE_PENDING_ACTION_BLOCKS` | `0x01928d44` | `0x48` | 9 × `+7 active` ; « idle » = tous à 0 |
| `BATTLE_SLOT_DATA` | `0x01927b10` | `0x8f0` = 11 × `0xd0` | par slot `max_atb +0x10`, `cur_atb +0x14` (`layout.hpp`) ; **`flag_data +0x7C`** (u16, lu en DWORD avec `+0x7E`) : bit `0x01` slot actif, **`0x04` auto-ready, `0x08` menu-ready** — posés par `BattleATB_TickAndReady 0x4842B0` quand `cur_atb >= max_atb`, et `flag_data & 0x0C` clair = « pas encore ready » (re-ff8 `docs/tech/systems/atb_system.md`, `docs/tech/reference/battle_slot_layout.md`) ; `status_1 +0x80` (`0x01` mort, `0x04` pétrifié), `status_2 +0x08` (`0x09` sommeil/stop) ; `com_file_id +0xBB == 0xFF` slot vide. Slots : 0–2 party, 3–7 ennemis, 8–10 GF |
| `BATTLE_ATB_UI_MIRROR` | `0x018ff180` | 8 | miroir HUD, diagnostic |
| `BATTLE_UI_HUD_PHASE` | `0x01974ea8` | 4 | phase HUD, sémantique « menu ouvert » **non** prouvée |
| `BATTLE_UI_MENU_RENDERING_ENABLED` | `0x0196d4ac` | 4 | rendu menu on/off, idem |
| `BATTLE_ESCAPE_STATE` | `0x01928de8` | 1 | fuite en cours |
| `MENU_PENDING_COUNT` / `MENU_PENDING_BUFFER` | VA `0x1D76718` / `0x1D76721` → RVA `0x01976718` / `0x01976721` | 4 / buffer | **Absents de l'address map ISO** ; documentés seulement `docs/tech/reference/address_catalog.md` (`BATTLE_MENU_PENDING_CMD_COUNT/BUFFER`, « pending command staging ») et suites `ff8re` tier4 (`PENDING_EXEC_AUTHENTIC_BYTES_001`, `RUNTIME_CALLBACK_MENU_OPEN_001`). Lecture diagnostique tolérée ; **interdit** comme entrée de verdict tant que non promu (statique + live) |

Le latch natif « ready » existe donc **en lecture seule** : `flag_data & 0x08`
(menu-ready) sur un slot party est exactement ce que le BP sur `0x4842B0`
servait à observer — la transition est écrite par le jeu lui-même, pas déduite
par comparaison ATB. `cur_atb >= max_atb` devient un contrôle croisé. Le chemin
menu-ready enfile `BattleUI_EnqueueCommand(slot, 17, 128, 0)` (`0x4AD620`)
(`atb_system.md`), ce qui ouvre la fenêtre de commande : **menu-ready ≠ curseur
positionné**.

Faux positifs à nommer dans l'outil :

- **menu ouvert ≠ ready** : `flag_data & 0x08` dit « fenêtre demandée », pas
  « action choisie » ; le runtime ne connaît pas la position du curseur (aucun
  global prouvé) ;
- **auto-ready** : `flag_data & 0x04` (Berserk / auto-command) = le jeu écrira
  lui-même le pending ; un pending synthétique concurrent est interdit ;
- **pause** : `phase [3,1,4]` reste vraie, ATB figée, rien ne se consommera ;
- **ATB ennemie** : un ennemi (slots 3–7) ou un slot GF (8–10) avec
  `flag_data & 0x0C` peut pré-empter le tour ; comparer les 11 slots, ignorer
  `com_file_id == 0xFF` (leçon G06 escape) ;
- **animation en cours** : `battle_post_init` vrai pendant une présentation ;
  lire `ACTION_IN_PROGRESS_LATCH` et `BATTLE_ACTION_EXECUTION_ACTIVE` ;
- **combat terminal** : `BATTLE_RESULT_LATCH != 0`.

Le canary actuel **ne suffit pas** : il n'a ni ATB par slot, ni pending, ni
`BATTLE_RESULT_LATCH`, ni `BATTLE_ACTION_EXECUTION_ACTIVE`. Extension en
tranche 1, lecture seule, diagnostic seulement (le verdict reste le témoin).

---

## 5. Fiche — Matrice des bus (piste 2)

Même grille pour tous. « Oui/Non » = fait lu, « ? » = à prouver.

| Critère | A — WPM externe | B — scénario synthétique côté DLL | W — appel `0x484D20` | C — replay input | `ff8re` + IDA |
| --- | --- | --- | --- | --- | --- |
| Débogueur requis | Non | Non | Non | Non | **Oui** |
| Visible `WriteGuard` / allowlist / restore | **Non** (écrivain externe, non classifié) | **Oui** (`GuardedHostWriter`, `g07_ownership_write_allowlist`, préimage + readback + restore existants) | **Non** (l'écriture est native, hors `writer_`) → `memory_hash_before != after` = « host state drifted » | Oui par construction (aucune écriture harness) | Non |
| Frappe `BattlePendingAction_Write` | Non (bypass admis par `ff8re`) | Non — **et n'a pas besoin de** : le chemin authentique supprime lui-même l'écriture native (`result = 0`) et garde le record côté DLL ; B fait pareil sans le menu | Oui | Oui (via menu natif) | Non |
| Frappe le hook → capture `LIVE_PENDING` | **Non** : le paquet part en natif, le domaine ISO ne s'engage jamais | N/A : le scénario **synthétise** la capture (`g09_live_pending_entry_`, `captured = true`) avec `provenance = synthetic` | **Oui, sans contrôle de caller** → trou de provenance | Oui, provenance authentique | Non |
| Commit EQUAL G12 | Non | Non (donc **refusé** pour G12) | Non (`menu_commit_observed = 0`) | Oui | Non |
| Same-frame observable sans BP | Non (poll 1 ms externe) | **Oui** (témoin G07 : `pending_hash_staged/transferred`, `transfer_call_count`, `frames_completed`) | Partiel | Oui (témoin) | Oui (BP) |
| Surface de crash | Course écrivain externe vs `TransferToExecQueue` (la fragilité `+7` sous IDA en est le symptôme) | Celle de G07 déjà vécue : écran noir si HUD/BdLink non pompés → exige `frames_with_four_hud`, pump `file_callback`/`BdLink` 1/1 | Thread distant (`CreateRemoteThread`) exécutant du code natif **pendant** la boucle de jeu | Focus fenêtre, timing ; aucune écriture | WOW64 `0x4000001F` |
| Layer law | Outil externe : OK mais sans preuve | `runtime-x86/` + `contracts/` + `tools/` ; rien dans `core/`/`application/` | `runtime-x86/` mais appel natif = helper natif interdit (`HARD-HELPER`) | `tools/` (+ futur runtime G24) | hors ISO |
| Coût ABI | 0 | Moyen : enum scénario, bump `FF8ISO_G09_ATTACK_PROTOCOL_VERSION 2→3`, champs dans `reserved[]` des témoins, décodeur collector, `validate_contracts` | Moyen + nouveau chemin d'appel natif | Élevé (globals HUD à promouvoir, protocole G24) | 0 |
| Ce que ça **ne** prouve **pas** | Rien côté ISO | La provenance menu, le commit EQUAL, la navigation HUD, la présentation | Idem + comptabilité écriture | L'observation visuelle (reste humaine) | La promotion |

Conclusion de matrice : **B** est le seul bus d'écriture compatible avec les
sept lois dures ; **A** et **W** sont rejetés ; **C** reporté ; **IDA** rejeté
pour les PID de preuve. Aucun bus ne remplace **V** ni **D**.

---

## 6. Fiche — Provenance et promotion (piste 4)

Faits :

- `pending_provenance` n'existe que dans `FF8IsoG13DrawWitness`
  (`core::DrawPendingProvenance::ObservedQueueOrStore`) ; G13 pince le caller
  (`kG13DrawQueueOrStoreCallerRva = 0x000AF064`, `runtime_internal.hpp:71`).
- `FF8IsoG09AttackWitness.reserved[26]`, `FF8IsoG11MagicWitness.reserved[1]`,
  `FF8IsoG12ItemWitness.reserved[5]` : place pour une provenance u8 partout,
  pour `caller_rva` u32 seulement dans G09 et G12.
- Le hook `BattlePendingActionWriteHook` ne lit pas `_ReturnAddress()`.
- Commentaire du hook : « The selected action enters G07 from these exact
  menu-confirmed bytes. » — la confiance « menu-confirmed » est **implicite**,
  jamais vérifiée.

Décisions sur papier :

1. **Répétition / rehearsal** : un pending synthétique (Bus B) est acceptable
   **uniquement** pour un scénario dont le contrat porte sur la mécanique
   (G07 spine, G09 Attack, G16 actions ennemies), jamais pour un contrat dont
   la clé requise nomme le menu (`authentic-player-fire-pending-envelope`,
   `authentic-player-potion-pending-envelope`, `exact-live-call-validated-before-suppression`).
2. **`[promotion.Gxx].satisfied`** : jamais flippé par une enveloppe dont
   `pending_provenance != authentic`. Le collector marque l'enveloppe
   `rehearsal` et refuse tout `--assertion` de promotion dessus.
3. **Fail-closed collector** à spécifier (tranche 2) : provenance manquante
   (`0`) sur un scénario `LIVE_PENDING` = **reject** ; provenance `synthetic`
   sur un scénario non-synthétique = **reject** ; `caller_rva` hors de
   l'ensemble statique connu pour un scénario authentique = **reject**.
4. **G11/G12/G13 authentiques** : inchangés ; le durcissement caller les rend
   plus stricts, pas plus permissifs.
5. **G23 bindings** : ce ne sont pas des features du harness. Tant que la table
   « Binding gaps — injection forbidden until filled » du waiver v2 est vide,
   la campagne est « prepared, not executable » ; le harness livre la coquille
   A et **s'arrête** au premier geste D.

---

## 7. Fiche — Orchestration `Invoke-IsoGroup` (piste 6)

- Spécifié : `battle-iso-migration-milestones.md` §4 (lignes 186–201) comme
  fonction PowerShell appelant `ctest`, puis `app_injector validate --dll
  --manifest --suite`, puis `app_injector test --process --dll --manifest
  --profile --group --suite --evidence --timeout-ms`.
- Livré : l'injecteur ne connaît que `validate <dll> [--sha256]`, `test`
  (self-test) et l'invocation générique d'export. Le doc le dit lui-même :
  « The exact manifest/suite/evidence-aware `validate` and `test` syntax below
  is still the target consolidated interface » ; G20/G21 : « `Invoke-IsoGroup`
  is obsolete ».
- Réalité opérationnelle (G13 direct replacement, G22 v5, cartes G23) : une
  fonction ad hoc `Invoke-G13Injector` + 6 commandes Python à la main.

Comparaison :

| Option | Pour | Contre | Verdict |
| --- | --- | --- | --- |
| Wrapper externe (Python, `tools/`) sur `make_bootstrap_payload` / `make_suite_payload` / `app_injector` / canaries / collector | Zéro ABI, zéro écriture, testable offline (mocks des sous-processus), ré-entrant, produit un **manifeste de session** (hashes, PID, heure, étapes) | Ne voit que ce que le snapshot expose | **Retenu (tranche 0)** |
| Vrai runner dans la DLL (export `FF8Iso_RunSession`) | Un seul appel | Nouvel export + logique de session in-process = nouvelle surface de crash ; contredit « `RunInProcessSuite` + scénario versionné » ; ABI | Rejeté |
| Étendre `app_injector test` à la syntaxe milestones | Fidèle au doc | Coût FFScriptLoader ; duplique le wrapper ; le doc est déjà marqué obsolète | Rejeté pour le MVP |

Prévisions d'échec à coder dans le wrapper : `LNK1168` (DLL chargée → refuser
tout build tant qu'un PID vit) ; `remote-bootstrap-failed (win32=1)` (runtime
non initialisé → bootstrap d'abord) ; `win32=6` = `BUSY` (procédure une-reprise
de `ff8-live-validation-operations.md` §« Fin de campagne » : une frontière de
frame, pause, canari stable, **une** nouvelle tentative, puis stop) ;
`INVALID_STATE` après `Faulted` = terminal ; plusieurs PID = stop ; DLL non
trouvée dans le cwd de l'injecteur (le playbook G13 fait `Push-Location
$injectorDir`).

---

## 8. Tranches ordonnées

Chaque tranche : fichiers, ABI/wire, tests offline, critère live, rollback.
Aucune tranche n'écrit dans `core/` ni `application/`.

### Tranche 0 — Session runner lecture seule (classe A → machine)

- **Fichiers** : `FinalFantasy_VIII_Reimaginated/tools/live_session.py`
  (nouveau) ; réutilise `capture_live_canaries.py`, `capture_live_pending_writes.py`,
  `capture_runtime_evidence.py`, `make_bootstrap_payload.py`,
  `make_suite_payload.py` ; `tests/offline/test_live_session.py` (nouveau) ;
  `README.md` §« Live » (une section).
- **ABI / wire** : aucun.
- **Contenu** : machine à états `preflight → field → bootstrap → battle-idle →
  arm → prompt(FR, 1 action) → observe → collect → shutdown → restored`, avec :
  identité (EXE/DLL SHA-256, `validate_contracts`, PE32, `git diff` hash
  comme le waiver G23), un seul PID, `CheckRemoteDebuggerPresent == 0`,
  heure de démarrage du process, décodage du code de sortie injecteur en
  `FF8IsoStatus`, manifeste de session JSON (hash-bound, PID-bound) et
  journal des prompts avec fenêtre de réponse (exigence milestones §4 :
  « Manual input is permitted only when the suite records the prompt,
  response window, and resulting semantic input events »).
- **Tests offline** : sous-processus mockés ; refus si 2 PID, si hash DLL ≠
  gel, si débogueur, si `BUSY` deux fois, si `Faulted` ; le manifeste
  reproduit exactement la séquence G13 direct-replacement.
- **Critère live** : rejouer la coquille du playbook G13 direct (bootstrap au
  field, canary `battle-g07`, arm, prompt Cast humain, collect, shutdown,
  `restored-g07`) sur un PID neuf **avec la DLL déjà promue** ; résultat
  identique au run manuel ; aucune écriture.
- **Rollback** : supprimer le script ; rien dans le process.

### Tranche 1 — Oracle « battle-idle » lecture seule

- **Fichiers** : `tools/capture_live_canaries.py` (`--expect battle-idle`,
  `--watch`, champs ATB par slot, pending 9×8, `result_latch`,
  `action_execution_active`, `escape_state`) ; `tests/offline/test_capture_live_canaries.py`.
- **ABI / wire** : aucun ; RVA lues depuis `abi/src/address_map.cpp` (tranche
  1 peut dupliquer les constantes comme le fait déjà le canary, ou lire la
  table générée — au choix, mais **jamais** `MENU_PENDING_COUNT` comme verdict).
- **Définition `battle-idle`** : `battle_post_init` ∧ `IS_BATTLE_PAUSED == 0` ∧
  `ACTION_IN_PROGRESS_LATCH == 0` ∧ `BATTLE_RESULT_LATCH == 0` ∧
  `BATTLE_ACTION_EXECUTION_ACTIVE == 0` ∧ tous `pending[i].active == 0` ∧
  **exactement un** slot party (0–2, `com_file_id != 0xFF`) avec
  `flag_data & 0x08` (menu-ready) et `flag_data & 0x04 == 0` ∧ aucun slot 3–10
  occupé avec `flag_data & 0x0C` (sinon drapeau séparé `enemy_ready`) ;
  `cur_atb >= max_atb` du slot ready sert de contrôle croisé (mismatch =
  diagnostic « layout drift », pas verdict). Les offsets `+0x7C/+0x80/+0x08/+0xBB`
  viennent de re-ff8 (`battle_slot_layout.md`) ; vérifier qu'ils figurent dans
  `abi/include/ff8iso/abi/layout.hpp` avant usage, sinon les y ajouter en
  `abi/` (POD, pas de RVA) avec un test statique.
- **Tests offline** : fixtures d'octets ; chaque faux positif de la fiche 4 a
  un cas négatif nommé.
- **Critère live** : transitions observées cohérentes avec le témoin G07 sur
  un run tranche 0 (diagnostic croisé, pas de verdict).
- **Rollback** : options nouvelles seulement ; comportement par défaut inchangé.

### Tranche 2 — Durcissement provenance (prérequis de tout bus synthétique)

- **Fichiers** : `runtime-x86/src/runtime_command_seams.cpp` (hook lit
  `_ReturnAddress()`, transmet `caller_rva` aux `capture_g09/g11/g12`) ;
  `runtime-x86/src/runtime_internal.hpp` (constantes RVA caller connues) ;
  `core/include/ff8iso/core/…` : enum sémantique `PendingProvenance
  { Unknown=0, NativeMenu=1, Synthetic=2 }` (sans RVA, comme
  `DrawPendingProvenance`) ; `contracts/include/ff8iso/launch_contract.h` :
  dans `reserved[]` **append-only** — G09 `pending_provenance` u8 +
  `caller_rva` u32, G12 idem (5 octets exactement), G11 `pending_provenance`
  u8 seul (1 octet) ; bumps `FF8ISO_G09_ATTACK_PROTOCOL_VERSION 2→3`,
  `FF8ISO_G11_MAGIC_PROTOCOL_VERSION 4→5`, `FF8ISO_G12_ITEM_PROTOCOL_VERSION
  2→3` ; tailles **inchangées** (144/176/256, snapshot 4856, schéma 28) ;
  `tools/capture_runtime_evidence.py` (décodage + règles fail-closed §6) ;
  `tools/make_suite_payload.py` (nouvelles versions) ; `tools/validate_contracts.py`.
- **Prérequis statique (re-ff8, pas de live)** : la fonction appelante est
  déjà documentée — `docs/tech/systems/command_pipeline.md` : « On command
  confirmation, the menu state machine (`sub_4ADDB0`) calls
  `BattlePendingAction_Write` (`0x484D20`) … The write happens on **target
  confirmation**, not on command highlight » ; l'entrée est
  `BattleUI_InputPollAndMenuState 0x4A8772`. Reste à pincer le(s) **RVA de
  retour** exact(s) (adresse de l'instruction suivant chaque `call 0x484D20`
  dans `sub_4ADDB0`, RVA = VA − `0x400000`), comme `0x000AF064` l'a été pour
  `PendingCmd_QueueOrStore` ; vérifier s'il existe d'autres appelants
  (auto-command Berserk `Battle_ProcessAutoCommand`, IA ennemie) et les
  classer `NativeMenu` / `NativeAuto` / autre. Consigner dans
  `docs/tech/reference/pending_action.md` et corriger la dette doc « Three
  entries » (`pending_action.md`) et `battle_pending_action_entry[3]`
  (`address_catalog.md`) → `0x48` = 9 entrées comme l'address map ISO.
- **Tests offline** : hook avec caller connu → `NativeMenu` ; caller inconnu →
  refus **sans capture** pour G11/G12 (fail-closed), capture marquée
  `Unknown` refusée par le collector pour G09 ; enveloppes v1 (G11 v4, G12
  v2, G09 v2) décodent toujours.
- **Critère live** : **une** Attack authentique (classe B mais jouée au menu)
  sur PID neuf : `pending_provenance == NativeMenu`, `caller_rva` ∈ ensemble
  statique, `Detached`, restore `0x1ff`. Pas de promotion : c'est un
  contrôle de non-régression G09 sur nouveau hash.
- **Rollback** : les champs vivent dans `reserved[]` ; revenir aux versions
  précédentes ne casse aucun décodeur.

### Tranche 3 — Bus B : scénario `FF8ISO_G09_ATTACK_SYNTHETIC_PENDING`

- **Fichiers** : `contracts/include/ff8iso/launch_contract.h` (enum `= 3`,
  commentaire explicite « rehearsal only, never promotion ») ;
  `runtime-x86/src/runtime_g09.cpp` (wire : `reserved[2]` = `target_mask u16
  | attacker_slot << 16 | command_id << 24`, `reserved[3]` = `command_arg` ;
  validation : `command_id == 0x01`, `command_arg == 0`, `attacker_slot 0..2`,
  `is_direct_enemy_mask`) ; `runtime-x86/src/runtime_g07.cpp`
  (`activate_g07_ownership_at_frame_boundary` : si scénario synthétique, ne
  synthétiser la capture **qu'à** la frontière où `abi_tick_ready`,
  `IS_BATTLE_PAUSED == 0`, acteur `cur_atb >= max_atb`, `pending[0].active == 0`,
  **deux** slots party éligibles — la règle single-survivor reste réservée
  aux pendings authentifiés) ; `tools/make_suite_payload.py`
  (`--g09-scenario 3 --g09-synthetic-attack <slot> <mask>`) ;
  `tools/capture_runtime_evidence.py` (`pending_provenance == Synthetic` ⇒
  enveloppe `rehearsal`) ; `tests/offline/test_g09*.cpp`,
  `tests/offline/test_g09_payload.py`.
- **ABI / wire** : la révision de `FF8ISO_G09_ATTACK_PROTOCOL_VERSION` de la
  tranche 2 couvre ce scénario ; `static_assert` inchangés ;
  `validate_contracts` doit passer.
- **Écritures hôte** : **aucune nouvelle** — l'export passe par
  `export_g07_ownership` sous `g07_ownership_write_allowlist()` (pending +
  links + heads + cells + latch), préimage/readback/restore existants
  (`FF8ISO_G07_REQUIRED_RESTORE_FLAGS 0x1ff`).
- **Tests offline** : refus de tout `command_id != 0x01` ; refus si un
  pending authentique est armé en même temps ; témoin `provenance == 2` ;
  collector refuse `--assertion` de promotion ; fixture G07 dense inchangée.
- **Critère live** (rehearsal, pas promotion) : PID neuf, DLL candidate,
  bootstrap au field, `battle-idle` (tranche 1), arm scénario 3, **aucun
  geste opérateur**, témoin : `transfer_call_count == 1`,
  `pending_hash_staged/transferred/restored` cohérents, `hp_before > hp_after`,
  `frames_with_four_hud == frames_completed`, pump `file_callback`/`BdLink`
  1/1 par tick, **opérateur confirme HUD et 3D visibles** (classe V,
  non waivable), shutdown `Detached`, `restored-g07`.
- **Rollback** : le scénario est opt-in par wire ; scénario 1/2 inchangés.

### Tranche 4 — Coquille A des cartes G23 (sans geste D)

- **Fichiers** : `tools/live_session.py` (profil `g23-card`, noms JSON du
  waiver v2 §« JSON capture contract », arrêt automatique au premier geste D
  non lié) ; aucun changement runtime.
- **Critère** : la carte V rejouée jusqu'au prompt « Entre dans la rencontre
  nommée » et **stop** propre si `Encounter: BINDING GAP` ; après bindings
  fournis par l'opérateur, séquence gen1/gen2/shutdown avec captures nommées.
- **Rollback** : profil optionnel.

### Reporté (hors MVP, ordre indicatif)

- **Bus C** : promotion statique + live des globals curseur/menu HUD dans
  `address_map.cpp` (re-ff8 statique d'abord : candidats déjà nommés côté
  recherche — `BATTLE_MENU_PENDING_CMD_COUNT/BUFFER 0x1D76718/0x1D76721`,
  `BattleUI_EnqueueCommand 0x4AD620`, machine d'état menu `sub_4ADDB0`,
  `BattleUI_InputPollAndMenuState 0x4A8772`) ; protocole G24 ; focus fenêtre ;
  l'opérateur garde V.
- **GF `0x03` synthétique** : après G18 rehearsal-safe ; présentation NCOMP scellée.
- **Extension `app_injector`** (`--result-file` pour relire les 192 octets
  de `FF8IsoBootstrapResult`) : confort, non nécessaire.

---

## 9. Contrat de preuve

- **Provenance** : `NativeMenu` seule compte pour une clé requise nommant un
  pending authentique ; `Synthetic` = `rehearsal` ; `Unknown` = reject.
- **Collector** : `PASS` requis, jamais suffisant ; l'enveloppe porte
  `exe_sha256`, `dll_sha256`, PID, heure de démarrage, provenance ; rejet si
  incomplet / contradictoire / hash ≠ gel / provenance incohérente.
- **Ce qui ne flippe pas `satisfied`** : toute enveloppe `rehearsal` ; toute
  session où un outil externe a écrit dans le process (il n'y en a aucun dans
  ce plan) ; toute session sans confirmation V quand le contrat réclame la
  présentation ; toute enveloppe issue d'un PID où un débogueur a été vu.
- **Same-frame** : oracle = témoin runtime (`pending_hash_*`,
  `transfer_call_count`, `same_frame_order` G23) ; le poll externe 1 ms est
  un diagnostic.
- **Signal utilisateur** : coordonne, ne décide jamais
  (`ff8-live-validation-operations.md`).

---

## 10. Stops (recopiés)

Loi live (jamais waivable) : process neuf sans débogueur ; EXE + DLL SHA-256
enregistrés, pas de fusion ; `validate_contracts` + Win32 + PE32 avant
inject ; zéro `import_legacy` source, zéro helper natif ; write-guard /
allowlist, aucun octet adjacent ; préimage complète ; readback de chaque
écriture ; restore byte-exact + process vivant + `Detached` ; observation
directe des effets same-frame ; collector fail-closed ; une action à la fois,
prompts français. `refused_mask == 0` = critère de promotion, pas d'ancre.

Layer law : RVA / `find_symbol` / `write_rva` en runtime ou synchronizer
seulement ; POD en `abi/` ; jamais `#include "ff8iso/abi/` au-dessus de
runtime ; `BattlePendingAction_Write` reste un seam, pas un adaptateur G08.

Ops : `LNK1168` → fermer FF8, rebuild, nouveau hash = nouveau candidat ;
`Faulted` = terminal ; `BUSY` → une reprise, puis stop ; écran noir / acteur
figé = preuve négative même si compteurs verts ; ne jamais rebuild une DLL
chargée.

Session : stop au premier rouge sécurité **ou** FAIL contractuel ; fermer le
PID ; ne pas continuer en génération 2.

---

## 11. Dépendances G23 (bindings encore ouverts)

Recopié du waiver v2 : save/slot atteignant une rencontre G22-shaped
ordinaire (toutes cartes) ; déclencheur opcode `0x39` + id de rencontre (S) ;
inventaire Phoenix, `combat_scene_id ≠ 317`, désarmement Phoenix avant le
latch wipe (W) ; rencontre timer `encounter_battle_flag & 0x0004`, scène ≠ 317
(T) ; rencontre finissable en victoire replacement **avec écran récompense**
`end_type = 0` (V) ; rencontre avec deux escapes G06 réels (E).

Verdict : l'automatisation G23 est **bloquée sur les bindings**, pas sur le
harness. Recommandation : « harness (tranche 4) + bindings en parallèle », les
bindings étant une tâche statique/terrain re-ff8 (scripts de field, saves),
**sans** transformer `SUPPRESS_RANDOM_SPECIAL_GFS` en outil de farm.

---

## 12. Risques

| Risque | Où il mord | Mitigation prévue |
| --- | --- | --- |
| Timing ATB : staging synthétique alors que l'acteur n'est pas ready ou qu'un ennemi l'est | Tranche 3 | Conditions de frontière (fiche 4) ; refus typé, zéro écriture, comme G22 refuse-active |
| Désynchronisation HUD : le menu natif de l'acteur reste ouvert car aucun geste menu n'a consommé le tour | Tranche 3 | Même risque que G07 closure ; exiger ownership G06 HUD dans la fenêtre, `frames_with_four_hud`, confirmation V ; sinon preuve négative |
| Octet adjacent / taille : `pending_action.md` et `address_catalog.md` disent 3 entrées, `ff8re` `PENDING_COUNT = 3`, l'address map ISO `0x48` (9), `capture_live_pending_writes.py` 9 | Tranches 1–3 | Corriger la doc re-ff8 (tranche 2) ; l'allowlist couvre exactement `0x48` |
| Offsets slot (`flag_data +0x7C`, etc.) issus de la recherche, pas encore tous dans `layout.hpp` | Tranche 1 | Ajouter en `abi/` avec test statique avant de s'en servir ; contrôle croisé ATB détecte un drift |
| Débogueur accidentel (IDA encore attaché) | Toutes | `CheckRemoteDebuggerPresent` dans le preflight ; refus |
| Fusion de hash (DLL rebuild entre deux captures) | Toutes | Manifeste de session ; refus de build tant qu'un PID vit |
| `BUSY` shutdown / callback actif | Tranche 0 | Procédure une-reprise codée, second `BUSY` = stop |
| Provenance implicite (« menu-confirmed » jamais vérifié) | Aujourd'hui | Tranche 2 avant toute tranche 3 |
| Poll externe manquant un same-frame | Tranche 1 | Diagnostic seulement ; l'oracle est le témoin |
| Dette doc `Invoke-IsoGroup` | Doc | Marquer le §4 des milestones comme remplacé par `live_session.py` (une ligne, pas de réécriture) |

---

## 13. Non-objectifs

- Pas de raccourci de promotion : aucune enveloppe synthétique ne touche
  `[promotion.Gxx].satisfied`.
- Pas d'IDA, `ff8re` ou `patch_dbg_byte` sur un PID de preuve.
- Pas de `WriteProcessMemory` externe, pas d'appel natif direct à `0x484D20`.
- Pas de Fire / Potion / Draw synthétiques ; pas de pause écrite en mémoire.
- Pas de nouvel export DLL « driver » ; pas de runner in-process.
- Pas d'écriture dans `core/` ni `application/` ; pas de RVA hors runtime.
- Pas de bindings G23 inventés ; pas de farm Odin/Gilgamesh.
- Pas d'automatisation de l'observation visuelle (classe V).

---

## 14. Options rejetées (motifs)

| Option | Motif de rejet |
| --- | --- |
| Bus A WPM externe | Invisible au hook ; écrivain non classifié = stop universel ; course avec le transfert natif ; redondant avec `ff8re` |
| Bus W appel `BattlePendingAction_Write` | Provenance indiscernable ; écriture native hors `WriteGuard` ; helper natif (`HARD-HELPER`) ; thread distant dans la boucle de jeu ; saute EQUAL |
| Commencer par G11 Fire synthétique | Contrat G11 : « no synthetic live scenario » ; classe C |
| Écrire `IS_BATTLE_PAUSED` pour synchroniser | Latch natif hors allowlist ; violation write-guard |
| `MENU_PENDING_COUNT` comme oracle de verdict | Non promu dans l'address map ISO |
| Runner de session dans la DLL | Nouvelle surface de crash in-process, ABI, contredit le canal `RunInProcessSuite` |
| Étendre `app_injector test` à la syntaxe milestones | Doc déjà obsolète ; duplique le wrapper |
| Petit prototype « pour trancher » pendant l'investigation | Interdit par le plan ; tranché par lecture (ce document) |

---

## 15. Ordre d'exécution pour toi (agent suivant)

1. Lire ce document, la loi live, la layer law, `hardening-x86-dll-injection.md`.
2. Tranche 0, puis tranche 1 : **aucune écriture mémoire**, tests offline
   d'abord, un run live de coquille sur DLL déjà promue.
3. Tâche statique re-ff8 : RVA de retour des `call 0x484D20` dans `sub_4ADDB0`
   (+ autres appelants éventuels) ; offsets slot dans `layout.hpp` ; corriger
   `pending_action.md` / `address_catalog.md` (9 entrées). Pour chercher dans
   re-ff8, utiliser `grepai` (index = re-ff8 seul, `docs/`, `ff8re/`,
   `ai-prompt/`) ; le repo ISO n'est pas indexé — lecture directe.
4. Tranche 2 : provenance ; `validate_contracts` ; CTest ; un live Attack
   authentique de non-régression.
5. Tranche 3 : Bus B Attack `0x01` ; rehearsal live avec confirmation V.
6. Tranche 4 : coquille G23 ; stop aux bindings.
7. À chaque live : carte minimale, ledger de nécessité, une action à la fois,
   français, stop au premier rouge.
