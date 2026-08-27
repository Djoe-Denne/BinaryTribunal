# Nouveau batch — G16 actions, mutations, spawn, texte et relais IA

Tu dois implémenter G16 complètement hors-ligne, préparer puis conduire sa
validation live minimale. Travaille de façon autonome jusqu’à ce qu’un geste
dans FF8 soit réellement nécessaire. À ce moment-là, demande une action courte
et précise à l’opérateur.

Ne committe et ne pousse rien sans demande explicite.

## Résultat attendu

À la fin :

- les huit unités U16.1–U16.8 sont implémentées et testées hors-ligne ;
- les intentions `AiDeferredKind` déjà produites par G15 sont **appliquées**
  sur l’état canonique, plus seulement reconnues ;
- un `ActionRequest` G07 est publié pour chaque commit d’action (cible
  valide), sans appeler `BattleAction_GetText`,
  `BattleAction_ResolveTargetAndHitCount` ni `EnemyAI_VM_ExecuteScript` ;
- le corpus 200 `c0m000–c0m199.dat` est **exécuté** Init/Turn (plus les
  sous-sections qui portent des opcodes G16) sur une copie canonique, avec
  un rapport de couverture reproductible ;
- une unique session live positive prouve l’émission `UseAbility` sur le
  combat déjà authentifié `c0m044` ;
- une session spawn/`0x71` n’est ouverte que si le walker free-slot et le
  codec `0x71` restent `live-required` après IDA + corpus ;
- G14 et G15 restent promus ; leurs enveloppes et DLL historiques ne sont
  pas réécrites ;
- `promotion.G16.satisfied` ne devient vrai qu’après la preuve live
  d’émission et le shutdown `Detached`.

G16 ne doit pas devenir le moteur de réactions (G17), ni le gameplay GF
(G18), ni l’inventaire de commandes joueur (G19), ni les Limits (G20).

## Préambule outillage — vérifie une fois, puis travaille

### RTK

```powershell
rtk --version
```

Version observée : `0.42.4`. Si le hook `preToolUse` est présent, ne
l’invoque pas manuellement.

### QMD / Oxygen

Utilise la commande `qmd`, pas le MCP QMD.

```powershell
qmd status
qmd get ff8-wiki/projects/re-ff8/references/battle-iso-migration-milestones.md:696:20
qmd get ff8-wiki/projects/re-ff8/references/g11-g20-static-readiness-ledger.md:551:16
qmd get ff8-wiki/projects/re-ff8/references/enemy-ai-opcodes.md
qmd get ff8-wiki/projects/re-ff8/concepts/enemy-ai-vm.md
qmd get ff8-wiki/projects/re-ff8/concepts/command-action-pipeline.md
qmd get ff8-wiki/projects/re-ff8/skills/ff8-live-validation-operations.md
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p1-g15-ai-control-validation.md
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p0-g14-presentation-validation.md
```

`enemy-ai-opcodes` reste l’autorité des 61 opcodes. **Ne les redécompile
pas.** Le contrôle de flux G15 (IF skip `u16` non signé après l’instruction ;
JUMP `0x23` = `int16` signé, largeur 3, ajouté après les 3 octets) est clos.
Ne rouvre pas ce débat.

Si le reranker CUDA échoue : `qmd search` ou `qmd query --no-gpu --no-rerank`.

### Context Mode

Filtre les gros outputs (corpus, diffs, CTest). La racine Context Mode de
ce workspace est `re-ff8`. Si `ctx_execute_file` refuse un chemin
Reimaginated, utilise une commande locale ciblée. Les `$variables`
PowerShell passées via MCP sont mangées : préfère Python.

### IDA MCP

IDB autoritative :

```text
D:\Modding\ff8\retro-exe\FF8_EN.exe.i64
```

EXE supporté SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

N’utilise IDA que pour les préimages encore `unknown` au contrat runtime.
Racines déjà nommées :

- `EnemyAI_LookupAbilityByIndex` `0x482C90` ;
- `EnemyAI_AbilityLookupCallback` `0x48ACD0` ;
- commit `LABEL_375` (GetText + Resolve + fold `K_*`) ;
- `BattleSlot_AddMonsterToRAM` / `BattleSlot_ManageDeathState` (famille spawn) ;
- worker `0x71` `0x502F30` et les six sites d’enqueue
  (`0x1F` / `0x34` / `0x3B` / `0x1B` / `0x35`) ;
- `BattleAction_GetText` / `BattleAction_ResolveTargetAndHitCount`
  (interdiction d’appel depuis le remplacement).

Toute découverte va d’abord dans l’IDB (nom, type, commentaire), ensuite
seulement dans l’address map et l’ABI ledger.

## Dépôts et état de départ audité

Documentation et prompt :

```text
C:\Users\djden\source\repos\retro-eng\re-ff8
```

Implémentation :

```text
C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated
```

Injecteur :

```text
C:\Users\djden\source\repos\FFScriptLoader\build\bin\RelWithDebInfo\app_injector.exe
```

`Invoke-IsoGroup` **n’existe pas**. Le flux live réel, déjà prouvé en G15 :

```text
tools\make_bootstrap_payload.py
tools\make_suite_payload.py
app_injector.exe  (FF8Iso_Bootstrap / FF8Iso_RunInProcessSuite / FF8Iso_Shutdown)
tools\capture_runtime_evidence.py
tools\capture_live_canaries.py
```

Cwd injecteur = dossier du DLL RelWithDebInfo.

État vérifié le 2026-08-27 après promotion G15 :

- HEAD implémentation `c67d1a4d46d80836e649ac64a39b3b2e53f2fdc9`
  (« Add G15 enemy AI control mechanics… ») ;
- worktree implémentation propre au moment de l’audit ; s’il est redevenu
  sale, préserve-le ; aucun reset, checkout destructif, ni nettoyage global ;
- `validate_contracts.py` : PASS au moment de la promotion G15 ;
- CTest `debug-x86` : **40/40** ;
- `[promotion.G14].satisfied = true` DLL
  `363d91cf8a4107c41fa5cbc2f8eb692dcf834765fa88790832aea3ca2c814471` ;
- `[promotion.G15].satisfied = true` DLL
  `fcc8365ef20fcc8071ca5d00ccaa2a188a48623c1b4e7750711070ebda57e212` ;
- enveloppes G15 :
  post-suite `103d8905e7630b60c98a485d7c295b17e8eac2ed19b105dc5323cd047624396f`,
  post-shutdown `038f8d16d1546136b16849791f6745d688e840aa3e81ef7db675e26090249601` ;
- protocole G15 v1, snapshot 2808 B, witness 256 B, schéma 19,
  `FF8ISO_SUITE_G15_AI_CONTROL = 1<<15` ;
- `AiControlPolicy.emit_native_action == false` et
  `read_only_shadow == true` restent les défauts G15.

Le processus FF8 G15 (PID 39224 à la promotion) peut encore être vivant.
**Demande l’état réel** avant tout rebuild. Ne suppose jamais qu’une
instance n’existe plus.

Après inspection, capture un résumé du diff G15 déjà commité vs tes ajouts
G16. Ne mélange pas les deux dans le rapport.

## Dettes à préserver, pas à rouvir

### G15 — clos

- VM Init/Turn ombre, corpus 200/200, SQ-G15-001 `static-closed-by-corpus`.
- Import live = `*monster_ai_section` (`0x487823`), pas le champ slot brut.
- `dat_sha32==0` en live : identité = `section_sha32` ; résidu documenté,
  pas un bloqueur G16.
- Le premier PID G15 11660 (`INVALID_STATE`) n’est pas promotionnel.

### G14 — clos, résidu `0x71`

- `0x70` / `0x74` live. Prédicat idle `0x71` = `confirmed-static`
  (`0x502F30`, `return 8` jusqu’à `node+1=0xFF`).
- La **durée de présence en liste pendant un spawn** est le seul résidu
  live. Elle appartient à U16.4/U16.7. Elle ne bloque pas l’émission
  d’action si le walker + le codec sont `confirmed-static` / offline.

### Interdiction

Ne reconstruis pas le DLL G14 `363d91cf…` ni le DLL G15 `fcc8365e…`.
Le candidat G16 est un **nouveau** RelWithDebInfo.

## Contrat G16 autoritatif

G16 dépend de G15 et porte :

| Unité | Contenu | Autorité |
| --- | --- | --- |
| **U16.1** | Préparation d’abilité : `0x03` SET_MAGIC, `0x07` SET_MONSTER_ATTACK, `0x0C` USE_ABILITY (`16*difficulty+idx`), `0x09` hit anim, table `monster_info_section`, lecteur `K_ENEMY_ATTACK` | opcodes + `0x482C90` |
| **U16.2** | Émission : `0x06` EXECUTE, `0x0B` random-3, `0x1E` chocobo, `0x2A` CAST_READ_MAGIC → `ActionRequest` G07 + fold cible + intents G14 GetText | LABEL_375 sémantique |
| **U16.3** | Mutations : `0x16` heal, `0x17` escape, `0x24` ATB, `0x27` auto-status, `0x28` stat %, `0x2D` res, `0x3C` HP delta, `0x2F/0x30/0x3A` hide/show (`flag_data&0x40`) | G08 untargetable |
| **U16.4** | Cycle de vie : `0x1F`/`0x34`/`0x3B` spawn, `0x08` die, `0x1D` leave, `0x2C` remove hidden ; **walker free-slot 3..7 obligatoire avant tout code spawn** | CA-G16-001 |
| **U16.5** | Texte : `0x01`/`0x18` wait, `0x1A`/`0x22` attack text, `0x1C`/`0x20` frames, `0x25` scan → `PresentationIntent` G14, jamais un délai fixe métier | G14 |
| **U16.6** | Récompenses : `0x37` card, `0x38` item drop, `0x31` give GF+queue, `0x36` Odin, `0x3D` Omega, `0x39` scripted end ; `0x11`/`0x15` via service G12 | persist vs battle-local |
| **U16.7** | Relais : `0x33`/`0x1B` → barrière `0x70` ; spawn / `0x35` → actor-ready `0x71` ; aucun `BattleTaskQueue_Dispatch` depuis le domaine | G14 |
| **U16.8** | Corpus : exécuter les scripts livrés sur copie canonique ; histogramme + branches + intents appliqués | archives G15 |

Le gate est atteint lorsque un vrai tour ennemi émet une action ordinaire
**et** ses effets de bord typés exclusivement par des interfaces de
remplacement.

Le jalon dit « un monstre par classe de comportement » en live. Ce n’est
**pas** la politique de ce batch. Applique l’économie G13–G15 ci-dessous.

## Hors scope strict

Ne pas implémenter dans G16 :

- sections Counter / Death / PreHit comme **moteurs de réaction** (G17) ;
  tu peux exécuter ces blobs hors-ligne s’ils portent des opcodes G16
  (spawn/reward), mais le déclenchement depuis `ApplyDamageOrHeal` est G17 ;
- Berserk fallback `AI_VM_FALLBACK_BYTECODE` `0x1D2A21D` (G17) ;
- Cover / Return / Angelo / auto-recover (G17) ;
- charge / Boost / cinématique GF (G18) ; `0x1B` est typé + barrières G14
  seulement ;
- Limits (G20) ;
- remplacement graphique, caméra métier, BdLink hors G14 déjà scellé ;
- appel natif GetText / Resolve / VM / subject / target / RNG helpers ;
- publication d’un pointeur replacement dans une liste native `0x71` ;
- soak live de bytecode malformé ou livelock.

## Loi de couches obligatoire

```text
ff8iso_core -> ff8iso_application -> ff8iso_runtime -> ff8_battle_iso
ff8iso_abi  -> ff8iso_runtime
```

- `core` : application des intents, construction d’`ActionRequest`,
  walker de slots, mutations sémantiques, lecteur `K_ENEMY_ATTACK` et
  table d’abilités **déjà décodée** ;
- `application` : `run_enemy_ai_actions` (ou extension policy de
  `run_enemy_ai_control`) + publication G07 + barrières G14 + transaction
  G12 ; jamais `LegacyBattleImage` ;
- `abi` : POD / préimages seulement ;
- `runtime-x86` : codec table d’abilités (`monster_info_section`), codec
  spawn hôte si session spawn, snapshot/witness G16, export suite.

Interdictions :

- aucun `ff8iso/abi`, RVA, `find_symbol` dans `core` / `application` ;
- aucun choix de règle métier dans `runtime-x86` ;
- aucun nouveau domaine dans `TemporaryG06/G07/G09` ni dans
  `SealedNativePresentationAdapter` ;
- un NCOMP G16 n’existe que s’il appelle vraiment une compatibilité
  native autorisée (spawn hôte). Header : `Removal target: U16.4`.
  Le chemin positif d’émission **ne doit en appeler aucun**.

`command_id` reste un octet brut (8 / 236 pour `K_ENEMY_ATTACK`). N’en
fais pas un enum canonique.

Lis `.agents/skills/implementing-iso-layer-boundary/SKILL.md` avant de
coder. `validate_contracts.py` doit étendre la garde à G16.

## Architecture cible

### 1. Consommer G15, ne pas le forker

G15 s’arrête déjà avec :

- `ActionWouldCommit` (`0x06` + cible valide) ;
- `ActionHadNoTarget` (fall-through de contrôle) ;
- `DeferredG16Intent` + `AiDeferredKind` (UseAbility=6, SpawnMonster=28, …).

G16 **n’ajoute pas** une seconde VM. Il :

1. exécute `run_enemy_ai_vm` / `run_enemy_ai_control` ;
2. applique l’arrêt (commit ou intent) sur une transaction ;
3. reprend le script seulement là où le natif reprend (cible vide,
   texte/wait, mutations non-commit).

`0x03` / `0x06` / `0x07` ne sont **pas** dans
`ai_opcode_is_g16_deferred` : ce sont préparation + commit. Ne les
déplace pas dans l’enum différé.

`0x11` / `0x15` écrivent déjà l’ombre inventaire et **continuent**. G16
route la persistance réelle par G12 uniquement si la policy
`apply_inventory` est armée. Défaut live : éteint.

### 2. Policy

Étends `AiControlPolicy` sans casser G15 :

```text
read_only_shadow     // défaut true — G15 inchangé
emit_native_action   // reste false
apply_deferred       // G16 : appliquer sur la copie canonique
publish_action       // G16 : ActionRequest -> spine G07
apply_inventory      // défaut false ; G12 transactionnel seulement
apply_persist_reward // défaut false (Odin/Omega/GF/carte)
host_publish         // live : allowlist G07 seulement
```

Les tests G15 existants doivent rester verts avec les défauts.

### 3. Table d’abilités — codec runtime (leçon G15)

Natif : `ability_table = BATTLE_SLOT_DATA[slot].monster_info_section`
puis `EnemyAI_LookupAbilityByIndex` `0x482C90`, index
`16 * difficulty + idx`.

**Vérifie sous IDA** si le champ slot est un pointeur à déréférencer
(comme `*monster_ai_section`) ou déjà la base de table. N’invente pas.
Un import faux = `INVALID_STATE` / taille absurde, exactement G15 PID
11660.

Le codec runtime produit des rangées canoniques pointer-free
(`ability_id`, texte, flags utiles au fold de cible). `core` ne voit pas
le layout `.dat`.

Dump obligatoire hors-ligne : table de `c0m044` **et** d’au moins un
fichier spawn (`c0m012` a 3× `0x34`). Fixtures hashées dans
`tests/fixtures/g16/`, pas les `.dat` complets.

### 4. Commit sémantique (LABEL_375)

Sur cible valide :

1. stocker le masque dans l’acteur canonique ;
2. plier le default-target de `K_MAGIC` / `K_ITEM` / `K_ENEMY_ATTACK`
   (lecteurs G11/G12 + **nouveau** lecteur enemy-attack ; pas de table
   native) ;
3. émettre `PresentationIntent` GetText (G14), pas l’appel natif ;
4. résoudre cible/hits via G08, pas `ResolveTargetAndHitCount` ;
5. publier `ActionRequest` (`source = Scripted`, `command_id` brut) ;
6. arrêter la VM (équivalent `BOOL_TARGET_CHOOSEN != 0`).

Sur cible vide : fall-through G15 déjà testé + `AdvanceExecQueue`
**canonique** seulement. Ne touche pas la queue hôte sur ce chemin
sauf si un test live nommé le justifie (aucun par défaut).

`0x0C` / `0x0B` font la lookup puis le même commit. `0x0B` :
`rand%3`, `253` = skip. `param==0` déjà interdit sans UB côté IF.

### 5. Mutations et visibilité

Applique sur `BattleState` / `AiWorldState` :

- HP, ATB, status bits, `flag_data&0x40`, masques de ciblage G08 ;
- `0x3C` = `int16` LE, largeur 3 (déjà dans `ai_opcode_width`) ;
- hide/show doit rester cohérent avec l’éligibilité G08.

Aucune de ces mutations n’est live-required individuellement si
l’émission `UseAbility` est prouvée. Elles sont `confirmed-offline`.

### 6. Spawn — walker d’abord

Avant tout code spawn :

1. xrefs IDA du free-list 3..7 ;
2. fixture « 5 ennemis vivants » → premier libre / aucun libre ;
3. `0x3B` slot explicite vs `slot==0` → premier libre ;
4. `0x08` / `0x1D` / `0x2C` sur la copie : Death, eject, hidden.

La chorégraphie native
`ManageDeathState → AddMonsterToRAM → relay 0x71` devient :

- mutation de slot canonique ;
- `PresentationBarrierKind` actor-ready (G14) ;
- **pas** d’insertion d’un callback replacement dans la liste native.

Host spawn (AddMonsterToRAM) = session live optionnelle seulement.

### 7. Texte, récompenses, relais

- Texte / wait / scan / frames = intents G14. Un timeout de sûreté
  `Faulted` n’est pas une completion.
- Drops carte/item = listes **battle-local** typées.
- `0x31` / `0x36` / `0x3D` / `0x39` = intents persist fail-closed par
  défaut. Ne pas écrire la savemap en live G16.
- `0x33` → barrière caméra G14 (`0x70` déjà live).
- `0x1B` → intents + `0x70` + `0x71` ; pas de moteur GF.

### 8. Orchestration `application`

```text
run_enemy_ai_actions(script, section, actor, state, rng, policy, services)
  -> AiActionReport
```

`AiActionReport` étend `AiExecutionReport` avec :

- `ActionRequest` optionnel ;
- liste d’intents présentation ;
- diff mutations (HP/ATB/flags/slots) ;
- spawn/remove records ;
- reward intents ;
- `cancelled` / allowlist writes.

Services injectés : spine G07, targeting G08, magic/item G11/G12,
barrières G14. Headless : les mêmes services, signaux scriptés.

Live positif : `apply_deferred + publish_action + host_publish` sur
allowlist G07. HUD/ATB/Switch/Director **ne sont pas** installés par
G16 (leçon G15).

## Corpus — faits déjà mesurés (ne pas rescanner à l’aveugle)

Archives (inchangées, SHA G15) :

```text
battle.fi  0ed9688468e1259a7fd8dc3e16b175f3a9de29b078e34a72d64bce4d97234c03
battle.fl  32de82b1d2354d3544cd496b9e6e7fc2f6ede912b25425297ef4a5028a4e6469
battle.fs  3565f9638d9ab7a30c47e9931989f32081a0fd01d1d6604b85838bead17b6d16
```

Histogramme G15 (200/200, `max_decoded=253`, `livelock_risk=[]`) :

| Opcode | Compte | Conséquence G16 |
| --- | ---: | --- |
| `0x0C` USE_ABILITY | 965 | **chemin live réel** |
| `0x0B` random-3 | 217 | 2ᵉ émission ; RNG lane existante |
| `0x1A` attack text | 183 | U16.5 offline |
| `0x28` stat % | 119 | mutation fréquente, offline |
| `0x1F` ENTER | 27 | spawn |
| `0x33` relay 70 | 27 | G14 |
| `0x34` SPAWN | 7 | spawn |
| `0x3B` SPAWN_TO_SLOT | 6 | spawn |
| `0x06` EXECUTE | **0** | offline seulement |
| `0x03` SET_MAGIC | **0** | offline seulement |
| `0x07` SET_MONSTER_ATTACK | **0** | offline seulement |
| `0x2F` SHOW_SELF | 0 | fixture synthétique |
| `0x20` / `0x22` | 0 | fixture synthétique |
| `0x1B` / `0x36` / `0x37` / `0x39` / `0x3D` | 1–2 | offline, pas de live persist |

`c0m044.dat` (live G15) : 7× `0x0C`, 2× `0x0B`, Init STOP, Turn
`UseAbility` `deferred_kind=6`, `target_mask=0x00000008`,
`section_sha32=0x9a226457`.

Fichiers spawn (17) : `c0m012` (3× `0x34` + 4× `0x33`) est le meilleur
candidat `0x34`. Ne présuppose pas Ifrit `c0m094` : il n’apparaît pas
dans ces 17.

Réutilise `tools/scan_g15_corpus.py` et
`evidence/g15-ai-corpus-2026-08-27.json`. U16.8 **exécute** ; il ne se
contente pas de recompter les opcodes. Extraction read-only, jamais
dans le dossier Steam.

## Classification des claims (économie de live)

Avant tout live, classe chaque claim :

| Claim | Classe | Live ? |
| --- | --- | --- |
| Largeurs / IF / JUMP / sujets / cibles | `confirmed-static` + G15 live | non |
| Lookup `16*difficulty+idx` + table `c0m044` | `confirmed-offline` après dump | non si dump = live bytes |
| EXECUTE / SET_MAGIC / SET_ATK | `confirmed-offline` (absents du corpus) | non |
| Fall-through cible vide + AdvanceExec canonique | `confirmed-offline` | non |
| Mutations U16.3 | `confirmed-offline` | non |
| Walker 3..7 + spawn/remove canonique | `confirmed-offline` après IDA | non |
| Texte / scan / frames | `confirmed-offline` + G14 | non |
| Récompenses persist | `confirmed-offline` fail-closed | non |
| Relais `0x70` | `confirmed-static` + G14 live | non |
| Idle `0x71` | `confirmed-static` | non |
| **Handoff UseAbility → ActionRequest G07** | **`live-required`** | **Session P** |
| Durée liste `0x71` pendant spawn | `live-required` seulement si IDA+walker ne ferment pas | Session S optionnelle |
| Octets `.dat` live ≠ archive | `unknown` nommé A/B | Session O seulement |

Le milestone « un monstre live par famille » est une couverture
**offline**. Le live rejoue une connaissance statique déjà épinglée
uniquement s’il reste un discriminant temporel ou ABI.

## Questions ouvertes à traiter (pas 61 opcodes)

- **SQ-G16-001** — layout exact de `monster_info_section` / stride /
  déréférencement. Fermer par IDA + dump `c0m044` avant le codec. Bloque
  U16.1.
- **SQ-G16-002** — cadence liste `0x71` au spawn. Défaut : rester
  `confirmed-static` comme G14 si le walker + worker suffisent. Ne pas
  bloquer `promotion.G16` sur cette question.
- **SQ-G16-003** — fold `K_ENEMY_ATTACK` default-target au commit.
  Fermer hors-ligne avec le lecteur kernel. Live seulement si le masque
  `c0m044` diverge du fold attendu (alors Session O nommée).

## Tests offline obligatoires

Ajoute `tests/offline/test_g16.cpp` (+ Python corpus/payload). Enregistre
`G15.ai-control-vm` **et** `G16.ai-actions` dans CTest. Les 40 tests
actuels restent verts.

Couverture minimale :

1. dump + parse table d’abilités `c0m044` et un spawn file ; offsets hors
   bornes / stride faux → erreur typée ;
2. `0x0C` difficulty 0/1/2 → bons `ability_id` ;
3. `0x0B` trois indices + 253 skip + RNG exacte ;
4. `0x03`+`0x06` et `0x07`+`0x06` (fixtures synthétiques, absents du
   corpus) → `ActionRequest` ;
5. EXECUTE cible valide → request + stop ; cible vide → fall-through +
   pas de request ;
6. `0x1E` / `0x2A` → request typé ;
7. chaque mutation U16.3 sur copie ; hide puis scan G08 ;
8. walker : 0, 1, 5 ennemis ; `0x3B` occupé / libre / `slot==0` ;
9. die / leave / remove hidden ; aucun pointeur natif ;
10. chaque texte → `PresentationIntent` ; wait n’avance pas tout seul ;
11. card/item battle-local ; Odin/Omega/GF/scripted-end fail-closed sans
    policy persist ;
12. `0x33` → barrière G14 camera ; spawn → actor-ready ; zéro Dispatch
    domaine ;
13. `0x11`/`0x15` : ombre continue (G15) ; persist G12 seulement si
    policy ;
14. exécution corpus 200 Init/Turn + sections G16 : 200/200, zéro
    livelock nouveau, histogramme d’intents appliqués ;
15. traces dorées `c0m044` Turn : `UseAbility` → même masque `0x8` +
    request ;
16. régressions G00–G15, G11/G12 exhaustif, contrats de couche ;
17. payload/wire G16 + schéma JSON.

Le test de boucle infinie et les scripts malformés restent hors-ligne.

## Contrat runtime et preuves

Étends de façon **versionnée** (ne pas casser le décodeur G15) :

- `FF8ISO_EVIDENCE_SCHEMA_VERSION` suivant (20 si tu ajoutes le witness) ;
- `FF8ISO_G16_AI_PROTOCOL_VERSION = 1` ;
- `FF8ISO_SUITE_G16_AI_ACTIONS = 1u << 16` ;
- `FF8ISO_EVIDENCE_G16_AI_ACTIONS` ;
- scénarios : `positive-emit` (1), `observe` (2, refusé sans A/B),
  `spawn-optional` (3, seulement si Session S) ;
- `--group G16` dans `capture_runtime_evidence.py` (G15 a déjà montré
  qu’il faut l’allowlist + le choice).

Witness compact, pointer-free, au minimum :

- tout le witness G15 utile (slot, monster_id, PC, stop, deferred, RNG,
  hashes, native/forbidden/write-guard, Odin, cleanup) ;
- `action_published`, `command_id`, `command_argument`, `target_mask`,
  `aux_5`, `aux_6` ;
- `ability_row`, `difficulty`, `section_sha32` ;
- `pending_writes` / `host_write_allowlist_count` ;
- `presentation_intents` (borné) ;
- `spawn_records` (0 sur Session P) ;
- `k_enemy_attack_fold`.

Refuse G16 sous `P0`, `Observe` sans discriminant, ou profil implicite.

Ajoute :

- `tests/in-process/G16.suite.toml` ;
- payload dans `make_suite_payload.py` ;
- `[P1.G16]` ownership-matrix ;
- `[promotion.G16]` evidence-policy `satisfied=false` tant que le live
  n’est pas clos ;
- assertions `validate_contracts.py`.

## Seam live recommandé

Le live G16 **prend le tour de remplacement** que G15 interdisait, mais
reste en combat **pause**. Il ne joue pas une animation ennemie
visuelle : G09 a déjà prouvé l’attaque.

1. Combat pause, ATB party pleine OK (comme G15).
2. Runtime choisit le slot `c0m044` (ou le monstre corpus retenu).
3. Relit section 8 via `*monster_ai_section` ; SHA vs corpus.
4. Importe table d’abilités via le codec **vérifié** (SQ-G16-001).
5. Exécute Init (STOP attendu) puis Turn jusqu’à commit `UseAbility`.
6. Publie `ActionRequest` dans la spine G07 allowlistée.
7. N’appelle pas la VM native, GetText, Resolve, ni G14 sauf intent
   GetText si le commit le produit — et dans ce cas le scheduler G14
   headless/in-process déjà promu.
8. Witness + désarmement. Pas d’install HUD/ATB/Switch/Director.

Canaris (identiques G15) :

- field : `mode != 3` ;
- battle : `mode==3`, phase `[3,1,4]`, `battle_paused==1` ;
- bootstrap flags `0x47` + garde Odin/Gilgamesh.

`BUSY` (`win32=6`) : une seule retry après **une** frontière de frame.
`INVALID_STATE` (`win32=5`) : ne pas retry à l’aveugle ; dumper le
slot (leçon import G15).

## Politique live

- pas de session native d’observation par défaut ;
- pas de revalidation des 61 opcodes ;
- pas de live malformé / livelock ;
- pas de live EXECUTE (absent du corpus) ;
- pas de live persist Odin/Omega/GF/carte ;
- pas de live `0x71` par routine ;
- collector = verdict ; opérateur = HUD/3D/acteurs seulement ;
- anomalie visuelle = échec même si compteurs verts ;
- `Faulted` = processus terminal ;
- même DLL hashé pour toutes les captures positives d’un candidat ;
- aucun rebuild au-dessus d’un DLL chargé ;
- rollback exact et survie du processus vérifiés séparément.

## Stratégie live minimale

**Au plus deux processus.** Défaut : **un**.

### Session P — émission `c0m044` (obligatoire)

Objectif : Turn replacement → `UseAbility` → `ActionRequest` G07,
zéro VM native, cleanup `Detached`.

Déroulé opérateur (identique G15, combat déjà connu) :

1. « FF8 est-il fermé ? » Attends « jeu fermé » avant le rebuild.
2. `validate_contracts` + `debug-x86` CTest + RelWithDebInfo. SHA
   EXE/DLL/bootstrap/suite.
3. « Lance FF8 et dis-moi quand tu es sur la carte du monde. »
4. Bootstrap Open World, canaris field.
5. « Lance le même type de combat que G15 (`c0m044`), mets-le
   immédiatement en pause, puis dis combat en pause. »
6. Canaris battle, PID, EXE, slot, `section_sha32`.
7. Suite G16 scénario 1. Collecte post-suite.
8. « HUD, 3D et acteurs sont-ils restés normaux ? »
9. Shutdown, collecteur post-shutdown, préimage frame.
10. Si PASS/Detached et processus sain : **ne demande pas de quitter**.

PASS P :

- `section_sha32` = corpus `c0m044` ;
- Turn `UseAbility` / request publié ;
- `command_id` / masque / argument = fixture offline du même fichier ;
- `native_ai_vm_calls == 0` ;
- `forbidden_calls == 0` ;
- `write_guard_violations == 0` hors allowlist G07 documentée ;
- hashes hors allowlist identiques, ou delta named + restauré ;
- garde Odin actif ;
- runtime PASS, cleanup Detached, processus vivant ;
- pas d’écran noir / freeze / UI disparue.

Le PID 11660 G15 n’est pas un précédent à « retry suite ».

### Session S — spawn / `0x71` (optionnelle)

Ouvre-la seulement si, après IDA + walker, SQ-G16-002 reste
`live-required` avec un discriminant A/B écrit (ex. durée du nœud
`0x71` > 0 frames vs unlink immédiat).

Alors : un combat corpus spawn (`c0m012` ou le plus petit joignable),
même DLL, process neuf uniquement si P est déjà shutdown. Sinon,
documente le résidu et **promouvois quand même l’émission**.

### Session O — divergence nommée seulement

Interdite « pour être sûr ». Écrire A/B + capture qui ferme avant
d’armer `observe`.

Pas de session N live par défaut. Demi-propriété spawn = fixture
offline (rejet avant mutation), déjà le modèle G14.

## Garde Odin/Gilgamesh

`FF8ISO_BOOTSTRAP_SUPPRESS_RANDOM_SPECIAL_GFS` reste le défaut de
`--install-frame-seam`. Ne touche pas Phoenix / Angelo / Witch. Witness
G16 confirme le garde.

## Vérifications avant live

Sans FF8 chargé :

```powershell
python .\tools\validate_contracts.py
cmake --build --preset debug-x86
ctest --preset debug-x86 --output-on-failure
cmake --build --preset relwithdebinfo-x86
```

Vérifie PE32/I386, exports, schéma/payload, corpus exécuté, fixtures
sans chemin absolu, régressions G00–G15, aucune altération des
enveloppes G14/G15.

## Manifestes et promotion

`[promotion.G16]` avant live, `satisfied = false`, required au minimum :

- `g15-dependency-promoted` ;
- `ability-table-codec-and-k-enemy-attack-reader` ;
- `u16-1-through-u16-8-offline` ;
- `useability-actionrequest-handoff` ;
- `zero-native-ai-vm-gettext-resolve` ;
- `canonical-spawn-walker-before-host-spawn` ;
- `rewards-persist-fail-closed-by-default` ;
- `representative-positive-live-envelope` ;
- `exact-cleanup-and-process-survival`.

Optional :

- `spawn-0x71-live-walk-only-if-named-ab` ;
- `native-observe-only-on-named-ab-discriminant`.

`satisfied = true` seulement après l’enveloppe post-shutdown du hash
final. Ne prétends pas que G17 est commencé.

## Documentation et mémoire Oxygen

- `evidence/g16-ai-actions-offline-validation-YYYY-MM-DD.md` ;
- `evidence/g16-ai-corpus-apply-YYYY-MM-DD.json` ;
- `evidence/g16-ai-actions-live-promotion-YYYY-MM-DD.md` après le live ;
- enveloppes sous `evidence/battle-iso/` ;
- README, ownership-matrix, evidence-policy, ABI ledger, address map ;
- page
  `obsidian-docs/projects/final-fantasy-viii-reimaginated/references/p1-g16-ai-actions-validation.md` ;
- maj `enemy-ai-vm`, ledger G16 `mapped` → `live-promoted` (émission) +
  résidu `0x71` si non marché, catalogue, index.

Skill `ff8-evidence-wiki-ingest` après checkpoint offline puis après
promo live. Distinguer : statique / corpus / live / différé G17+ /
dette ouverte.

## Stop conditions

Arrête-toi si :

- identité EXE ou archive ≠ SHA connus ;
- SQ-G16-001 (table d’abilités) reste `unknown` ;
- le codec déréférence au mauvais niveau (régression G15) ;
- une règle exige GetText / Resolve / VM native ;
- ABI remonte dans `core` / `application` ;
- G14/G15 cessent de passer ou leurs preuves sont altérées ;
- FF8 est encore chargé avant un rebuild ;
- runtime `Faulted`, cleanup incomplet, ou régression visuelle ;
- tu es tenté d’élargir le live à « un monstre par famille ».

## Rapport final attendu

Rapport compact :

- fichiers G16 vs G15 déjà commité ;
- couverture U16.1–U16.8 ;
- corpus exécuté 200/200 + intents appliqués ;
- CTest final ;
- SHA archive/EXE/DLL/enveloppes ;
- verdict live P (et S si ouverte) + cleanup ;
- appels natifs et writes allowlist ;
- SQ-G16-001/002/003 ;
- dettes G17+ ;
- `promotion.G16` ;
- pages Oxygen + smoke QMD
  (`G16 live-promoted UseAbility`, `SQ-G15-001`, `G06 closure RNG`,
  `Draw pending command_id`).
