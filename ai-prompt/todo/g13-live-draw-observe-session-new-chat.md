# Nouveau batch — session 4 G13 observation facultative (archive Phase A)

> [!IMPORTANT]
> Depuis le contrat G13 v3 du 2026-08-25, cette session n'est plus un
> préalable à l'armement. Ne l'exécuter que pour résoudre une incertitude
> nommée (identité binaire, caller/arguments incomplets, divergence au seam ou
> variante non couverte). Si la preuve statique épinglée et les fixtures
> suffisent, passer directement aux remplacements Cast et Stock du scénario 2.
> Le reste de ce document décrit le protocole d'observation historique et
> n'impose aucune action native sacrificielle.

## Préambule outillage — une vérification, puis travaille

Ne dépense pas de contexte à chercher ces outils dans le dépôt :

1. **RTK n’est pas un MCP.** Exécute une seule fois
   `Get-Command rtk; rtk --version`, puis vérifie dans
   `$env:USERPROFILE\.cursor\hooks.json` la commande `rtk hook cursor` sous
   `preToolUse` pour Shell. L’installation connue est RTK 0.42.4. Si le hook
   est présent et la commande fonctionne, il réécrit automatiquement les
   commandes Shell : ne préfixe jamais toi-même une commande par `rtk`, ne
   cherche pas de serveur RTK et passe immédiatement à la suite. Si RTK gêne
   une commande composée, sépare simplement les commandes.
2. **QMD est le moteur du vault.** Dans Cursor, utilise **uniquement** la CLI
   déjà installée — jamais un serveur MCP QMD :
   `qmd status`, `qmd search ... -c ff8-wiki`,
   `qmd vsearch ... -c ff8-wiki`, `qmd get qmd://ff8-wiki/<page>`.
   Après une mise à jour substantielle de `obsidian-docs`,
   `qmd update` puis `qmd embed -c ff8-wiki` si les embeddings doivent suivre.
3. **Context Mode sert à comprimer les gros outputs du dépôt cible, pas à
   interroger le wiki.** Appelle `ctx_doctor` sur le serveur context-mode du
   projet, puis teste `ctx_execute_file` sur le `README.md` absolu de
   `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated` en n’affichant
   que son premier titre. Ensuite : `ctx_batch_execute` / `ctx_execute` pour
   dériver, `ctx_search` pour rappeler. Le vault `re-ff8` passe par QMD.
4. **`Invoke-IsoGroup` n’existe pas.** Une seule vérification
   `Get-Command`/`rg` suffit. Utilise `tools\make_suite_payload.py`,
   FFScriptLoader et les outils de capture existants.

Arrête-toi seulement si RTK ou son hook est réellement absent, si Context Mode
refuse le dépôt d’implémentation, ou si QMD CLI échoue. Après ces contrôles,
lis les `AGENT(S).md` applicables, vérifie le MCP IDA (lecture seule pour
confirmer GetText / QueueOrStore), puis ne refais plus la découverte
d’outillage.

## Loi de couches obligatoire pour G13

Lis intégralement avant tout patch :

`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\.agents\skills\implementing-iso-layer-boundary\SKILL.md`

et le rappel :

`C:\Users\djden\source\repos\retro-eng\re-ff8\ai-prompt\todo\_gate-layer-preamble.md`

Cette session **n’arme pas** le domaine Draw. Si tu touches le runtime :

- Phase A observe `PendingCmd_QueueOrStore` uniquement ;
- le writer natif **reste** ; aucun delete, aucun transfer, aucun ownership ;
- pas de `TemporaryG13NcompAdapter` ; la présentation Draw est G14 ;
- `core/` n’encode **pas** `kDrawCommandId = 0x06` ;
- `validate_contracts.py` puis `ctest --preset debug-x86` après chaque edit.

## Dépôts

Travaille principalement dans :

`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

Sources et vault :

`C:\Users\djden\source\repos\retro-eng\re-ff8`

Injection :

`C:\Users\djden\source\repos\FFScriptLoader`

Ne fais pas de commit sans demande explicite.

## Mission

Exécuter **uniquement** la session 4 Phase A : observation live d’un pending
Draw authentique écrit par `PendingCmd_QueueOrStore` (`0x484FD0`), sans
prendre ownership, sans Phase B, sans session 5.

Livrable : une enveloppe hash-bound qui contient les huit octets pending, le
byte de ligne menu, `aux_5` / `aux_6`, le caller RVA, et
`arm_authorized = 0`. SQ-G13-001 avance (discriminateur **de ce processus**).
`[promotion.G13].satisfied` reste `false`.

## Hors scope — ne pas faire

- Ne pas lancer `FF8ISO_G13_DRAW_LIVE_PENDING` / Phase B.
- Ne pas orchestrer la session 5 (course source-death). Elle est
  **retirée** : SQ-G13-002 est `static-closed-with-cap` (voir plus bas).
- Ne pas tuer le monstre source. Une mort avant GetText rejoue un fail déjà
  statique ; une mort « mid-flight » n’est pas définissable par un tour
  ennemi.
- Ne pas canoniser `0x06` comme enum global, même si le dump vaut `0x06`.
- Ne pas écrire Magic / EQUAL / SG / HP depuis cette suite.
- Ne pas fusionner cette preuve avec un run G11/G12 du même processus.
- Ne pas revendiquer Cast/Stock ownership, quantité live, ni GF Draw
  `id >= 0x40`.

## État confirmé à reprendre (2026-08-25)

- G11 Fire v2 : `[promotion.G11].satisfied = true`. Enveloppe
  `evidence/battle-iso/p0-g11-magic-fire-v2-final-live-2026-08-18.json`.
  DLL promu `0b3c4bb9…5df0aef1`. Suite `suite-G11-fire-v2.bin`.
- G12 : `[promotion.G12].satisfied = true` (revue sémantique 2026-08-25).
  Preuve : `evidence/g12-item-live-promotion-2026-08-25.md`. Potion /
  Meteor Stone / Mega Phoenix / Friendship en PASS Detached ; Pinion /
  Gysahl en observations d’intent. Présentation Item = G14.
- G13 offline : `offline-candidate-ready` + `observation-ready-unpromoted`.
  Draft `evidence/g13-draw-offline-draft-2026-08-19.md`. Addendum 2026-08-25 :
  G12 ne bloque plus Phase A. Phase B reste refusée jusqu’au dump authentique
  **et** une seconde confirmation identique.
- Suite `tests/in-process/G13.suite.toml` : protocol `g13-draw-observe-v1`,
  scenario `draw-observe-pending`, `requires_fresh_process = true`,
  `safe_point = field-or-menu-or-battle-idle-queue-or-store`.
  Génération :

  ```powershell
  python .\tools\make_suite_payload.py --group G13 --g13-scenario 1 `
    --output .\suite-G13-observe.bin
  ```

  Payload already compiled 2026-08-25: `suite-G13-observe.bin`
  (64 bytes, `G13`/`P0`, flags `0x2000` = `FF8ISO_SUITE_G13_DRAW`, reserved
  `(1, 1, 0, 0, 0, 0, 0)`). SHA-256
  `d2aefe3c02c662496eed4ac71c18e198c746c8b5f6a9846fcc2cd204768934af`.
  Regenerer seulement si le wire ou le scenario change ; verifier le hash
  avant injection.

- EXE supporté SHA-256 :
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- `kernel.bin` EN Steam SHA-256 :
  `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`.
- Trois identifiants distincts : pending menu-row (live) ; resolver
  `COMMAND_TYPE_ID = 6` ; `aux_5` 9 Cast / 10 Stock, `aux_6` slot source.
  `mov eax,6` @ `0x4ADF4E` = UI `dword_1D768D0`, pas le pending.
  `0x0D` = Item, pas Draw.

Vérifie HEAD et le hash DLL **actuels** au préflight ; ne recycle pas le hash
candidat offline `d869c95f…` de août 19 comme ancre live.

## Décision SQ-G13-002 — déjà prise, à appliquer pas à relitiger

IDA `BattleAction_GetText` (`0x48D200`) case `COMMAND_DRAW` :

1. sort absent de la table 4 slots → fail `LABEL_48` ;
2. source `status_1 & 1` **ou** caster Silence `status_1 & 0x10` → fail ;
3. Cast (`param == 9`) : `Draw_ComputeStealCount` ; qty 0 → fail ; sinon
   charge le profil Magic et sort (aucun `MutateStock` remove) ;
4. Stock (`param == 10`, id `< 0x40`) : même qty puis boucle
   `BattleMagic_MutateStock(..., add)` **dans GetText** ;
5. Resolver case 6 (`0x48FE20`) : `related == 9` → Magic + scale
   `(rand8+10)/150` sur la **cible du sort** ; `related == 10` → `ReviveHP = 0`.
   **Aucun** re-test de mort de la source.

Conséquences :

| Fenêtre | Politique |
| --- | --- |
| Source morte / Silence à l’entrée GetText | Fail fermé (`SourceDeadBeforeGetText`) |
| Stock après acceptation GetText | Commit déjà fait dans GetText ; fenêtre inter-frames vide |
| Cast après acceptation GetText | Handoff Magic ; pas de re-validation source |
| Course live mid-flight | Non nécessaire pour promouvoir le domaine Draw ; optionnel G14 |

Aligner avant le live, si le code/wiki n’est pas déjà à jour :

- SQ-G13-002 → `static-closed-with-cap` ;
- plan session 5 → `superseded-static-closure` (comme la session 3 G12) ;
- assertion suite `source-death-after-gettext-remains-live-required` →
  retirer ou remplacer par un témoin non bloquant
  `source-death-after-gettext-static-capped` ;
- `SourceDiedAfterGetTextUnproven` reste un garde-fou fail-closed **si** un
  test injecte une mort intra-fonction ; ce n’est pas un gate live.

Ne pas inventer une politique « reject vs complete » au-delà du graphe
ci-dessus.

## Recherche initiale — QMD puis sections seulement

Dans `ff8-wiki`, combine lex et vec :

1. G13 Live Draw Session Plan observe-then-arm Phase A
2. SQ-G13-001 PendingCmd_QueueOrStore command_id
3. SQ-G13-002 static-closed-with-cap GetText
4. g13-draw-offline-draft observation-ready
5. G12 item live promotion 2026-08-25
6. ff8-live-validation-operations one process

Pages à ouvrir ensuite seulement par sections :

- `projects/final-fantasy-viii-reimaginated/skills/g13-live-draw-session-plan`
- `projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index`
- `projects/re-ff8/references/g11-g20-static-open-questions` (SQ-G13-001/002)
- `projects/re-ff8/concepts/command-action-pipeline` (writer Draw)
- `projects/re-ff8/concepts/draw-magic-and-render-bridge`
- `projects/re-ff8/skills/ff8-live-validation-operations`

Ordre d’autorité :

HEAD + contrats + enveloppes hash-bound → IDA EXE supporté → pages wiki
actuelles → draft G13 août 19 (addendum 25 août prime sur les phrases
« G12 bloque ») → vieux prompts.

## Inspection minimale avant lancement

Dans Reimaginated :

- `tests/in-process/G13.suite.toml`
- `tools/make_suite_payload.py` (scénario 1 = observe)
- `contracts/include/ff8iso/launch_contract.h` (`FF8ISO_SUITE_G13_DRAW`,
  `FF8ISO_G13_DRAW_OBSERVE_PENDING` vs `…_LIVE_PENDING`)
- `runtime-x86/src/runtime.cpp` : refuse Phase B, `g13_live_arm_authorized_ = false`
- `core/include/ff8iso/core/draw_slice.hpp` + tests `test_g13.cpp`
- `evidence/g13-draw-offline-draft-2026-08-19.md`
- `evidence/g12-item-live-promotion-2026-08-25.md`
- README section P0.G13
- allowlist / address-map : `PendingCmd_QueueOrStore` RVA `0x00084FD0`

Préflight obligatoire (un processus neuf ensuite) :

1. `python .\tools\validate_contracts.py`
2. `cmake --preset debug-x86` et `ctest --preset debug-x86`
3. PE32 / `IMAGE_FILE_MACHINE_I386` sur la DLL chargée
4. Hashes EXE, DLL, kernel, address-map, suite `.bin`
5. Compat suite/profil **sans** toucher FF8
6. Si IDA a servi : retirer tous les breakpoints et détacher **avant** bootstrap

## Protocole live — un processus, une action authentique

Un session = un `FF8_EN.exe` neuf, un hash DLL immuable, un bootstrap, une
lignée de combat, un cleanup final. `Faulted` est terminal.

### Setup opérateur

- Sauvegarde jetable ; un caster avec capacité Magic libre.
- Un monstre avec un sort offensif drawable connu (Fire de Bite Bug / equivalent
  stable). Ne pas viser un GF `id >= 0x40`.
- Combat idle, files vides, pas de latch hérité, pas de DLL inattendue.

### Phase 0 — bootstrap observe

- Démarrer FF8 depuis field/menu (safe point de la suite).
- Installer la seam pending-write / observer QueueOrStore.
- Armer **seulement** le groupe session G13 observe
  (`FF8ISO_SUITE_G13_DRAW`, scenario 1).
- Capturer baseline `D0` : table Draw/tier source, stats caster/monstre,
  stock Magic combat, RNG, files, action courante, latches, préimages hooks.

### Phase 1 — un Draw Cast authentique (opérateur)

L’opérateur :

1. ouvre Draw ;
2. choisit le sort déclaré ;
3. confirme **Cast** (pas Stock pour ce premier dump) ;
4. s’arrête et confirme le texte visible / l’absence d’écran noir si demandé.

Le runtime, **avant** tout transfer de remplacement :

- laisse le writer natif s’exécuter ;
- capture les 8 octets packed + les 6 arguments
  `(slot, command_id, arg, aux_6, aux_5, mask)` ;
- capture le byte de ligne menu (`dword_1D768D8+2`) et le caller/return ;
- n’infère **jamais** `command_id` depuis l’UI ou `COMMAND_TYPE_ID`.

Assertions Phase 1 :

- attacker, mask et spell id = sélection UI ;
- `aux_5 = 9`, `aux_6` = slot monstre source ;
- `command_id` brut reporté ;
- zéro write de remplacement, zéro transfer, `arm_authorized = 0` ;
- EQUAL / SG / HP / Magic stock inchangés par **nous** (le natif peut
  avancer Draw) ;
- si le byte contredit la carte candidate **et** ne se rattache pas à la
  ligne menu : **stop sans ownership**.

Si le record est valide : le binder comme discriminateur **de ce PID**
seulement. Une seconde confirmation identique n’est **pas** requise pour
clôturer Phase A ; elle est requise plus tard pour Phase B (autre chat).

### Phase 2 — hors de ce batch

La matrice resisted / Cast / Stock / stock plein / clamp est un run ownership
ultérieur, après revue du dump. Ne la commence pas ici.

### Cleanup

- Restaurer les hooks ; lire les préimages.
- Runtime `Detached` (ou l’état observe documenté si le protocole v1 ne
  détache pas — alors l’enveloppe doit le dire explicitement, sans inventer
  un PASS ownership).
- Processus FF8 survivant.
- Zéro appel domaine interdit, zéro violation d’allowlist.

## Stop conditions

- `Faulted` ou recovery failed ;
- Phase B armée ou `arm_authorized != 0` ;
- writer QueueOrStore supprimé / transfer de file ;
- write Magic / EQUAL / SG / HP depuis le remplacement ;
- `command_id` inféré au lieu d’être dumpé ;
- RNG / file / latch inattendu attribué à notre hook ;
- DLL rebuild ou hash changé en cours de processus ;
- écran noir, acteur/caméra gelés **si** la session prétend une
  compat présentation (elle ne doit pas : présentation = G14) ;
- tentative de tuer la source ou d’injecter une course mid-flight.

Un processus stoppé = diagnostic seulement. Nouvel essai = FF8 neuf.

## Preuve à émettre

- JSON canonique sous `evidence/battle-iso/`
  (`p0-g13-draw-observe-…-YYYY-MM-DD.json`) ;
- note Markdown d’accompagnement ;
- hashes EXE / DLL / kernel / suite / enveloppe ;
- dump hex des 8 octets + tableau des champs ;
- `observed_pending_id` comme byte, pas comme constante core ;
- `arm_authorized = 0` ;
- PID, runtime state, restore mask, call audit.

Ne résume pas plusieurs cas en un PASS unique. Ici il n’y a **qu’un** cas.

## Wiki et QMD en fin de batch

Met à jour, sans inventer de promotion G13 :

- `obsidian-docs/projects/final-fantasy-viii-reimaginated/skills/g13-live-draw-session-plan.md`
  (status observe PASS/FAIL, hashes) ;
- `g11-g20-static-open-questions.md` SQ-G13-001 (dump lié au PID ; toujours
  pas d’enum global) ;
- `log.md` avec l’heure de `Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"` ;
- `qmd update` puis smokes :
  `Draw pending command_id`, `G13 observe QueueOrStore`,
  `SQ-G13-002 static-closed-with-cap`.

`qmd=pass` seulement après la compile **et** les smokes.

## Critères de fin

Le batch est fini quand **tous** ces points sont vrais :

1. Phase A a produit une enveloppe hash-bound **ou** un stop documenté avec
   cause discriminante (pas un silence) ;
2. `arm_authorized` est resté 0 ;
3. SQ-G13-002 n’a pas été rouverte en live-required ;
4. session 5 n’a pas été jouée ;
5. `[promotion.G13].satisfied` est toujours false ;
6. le wiki + QMD reflètent le dump (ou le diagnostic) ;
7. aucun commit n’a été créé sauf demande explicite.

Si le dump est bon, la **prochaine** étape (autre chat) est la revue du
discriminateur puis, seulement après, un design Phase B. Pas G14, pas la
course source-death.
