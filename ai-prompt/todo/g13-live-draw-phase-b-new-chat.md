# Nouveau batch — session 4 G13 Phase B (remplacement direct validé)

> [!IMPORTANT]
> **Contrat opérationnel v3 — 2026-08-25.** Cette section remplace les
> anciennes obligations B0/B1 du document. Les mentions « confirm-then-arm »,
> « B0 obligatoire », « même processus » et « Stock natif préalable » plus
> bas sont conservées comme historique et ne sont plus normatives.
>
> Runbook live autoritatif avec chemins, hashes et commandes :
> `ai-prompt/todo/g13-live-draw-direct-replacement-new-chat.md`.

## Politique directe v3

Le binaire cible, le caller QueueOrStore et la forme Cast/Stock sont déjà
étayés statiquement. Le scénario 2 peut donc armer directement. Le hook doit
encore valider au moment de l'appel le caller, la ligne de menu, les huit
octets, la source, le mask et les bornes avant de supprimer exactement un
appel. Une divergence reste native et fail-closed.

L'observation native du scénario 1 est **facultative**. Le modèle décide de
l'utiliser seulement si elle résout une incertitude concrète, par exemple :

- identité du binaire non épinglée ;
- caller ou arguments statiques incomplets/contradictoires ;
- divergence observée au seam ;
- nouvelle variante non couverte par les fixtures.

Avant d'ajouter une observation, le modèle doit pouvoir nommer l'incertitude
qu'elle tranche. À défaut, il la saute. Une connaissance statique déjà
confirmée ne doit pas être revalidée live par routine.

Plan live par défaut :

1. processus FF8 neuf et combat idle ;
2. armement direct scénario 2 puis **un remplacement Cast** ;
3. nouvel armement direct scénario 2 puis **un remplacement Stock** ;
4. capture séparée des deux enveloppes.

Aucune action Cast/Stock native sacrificielle n'est requise. Une observation
facultative ne devient jamais une condition cachée d'armement. Le critère de
promotion porte sur les deux remplacements exacts, les commits bornés, le
rollback et l'absence de résolveur natif après engagement.

## Archive v2 — contexte non normatif

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
   `ctx_execute_file` refuse les chemins hors `re-ff8` : pour Reimaginated,
   passe un chemin **absolu** via `ctx_execute` / `ctx_batch_execute`.
4. **`Invoke-IsoGroup` n’existe pas.** Une seule vérification
   `Get-Command`/`rg` suffit. Utilise `tools\make_suite_payload.py`,
   FFScriptLoader et les outils de capture existants.
   Injecteur :
   `FFScriptLoader\build\bin\RelWithDebInfo\app_injector.exe`.

Arrête-toi seulement si RTK ou son hook est réellement absent, si Context Mode
refuse le dépôt d’implémentation, ou si QMD CLI échoue. Après ces contrôles,
lis les `AGENT(S).md` applicables, vérifie le MCP IDA en lecture seule si
besoin, puis ne refais plus la découverte d’outillage.

## Loi de couches obligatoire pour G13

Lis intégralement avant tout patch :

`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\.agents\skills\implementing-iso-layer-boundary\SKILL.md`

et le rappel :

`C:\Users\djden\source\repos\retro-eng\re-ff8\ai-prompt\todo\_gate-layer-preamble.md`

- Domaine dans `core/` (`begin_draw_transaction` / `commit` / `resolve`).
  `DrawProfile.observed_pending_id` vient du byte live confirmé.
- `application/` : `BattleState` / rapports sémantiques seulement.
- RVA, seams, witness, transfer de file : runtime uniquement.
- Pas de `TemporaryG13NcompAdapter` ; présentation Draw = G14.
- `core/` n’encode **pas** `kDrawCommandId = 0x06`.
- `validate_contracts.py` puis `cmake --preset debug-x86` et
  `ctest --preset debug-x86` après chaque edit.

Copie aussi le préambule `_gate-layer-preamble.md` : pas d’ABI / `find_symbol`
/ pods natifs dans `core/` ou `application/`.

## Dépôts

Travaille principalement dans :

`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

Sources et vault :

`C:\Users\djden\source\repos\retro-eng\re-ff8`

Injection :

`C:\Users\djden\source\repos\FFScriptLoader`

Ne fais pas de commit sans demande explicite.

## Mission

Exécuter Phase B **après** la revue déjà close :

1. Implémenter le gate confirm-then-arm (scénario 2 toujours refusé tant
   qu’un observe B0 de **ce** processus ne matche pas le template).
2. **B0** : second dump QueueOrStore sur un `FF8_EN.exe` **neuf**.
3. **B1** : seulement si B0 PASS — ownership + matrice, de préférence sur
   un **deuxième** processus neuf.

`[promotion.G13].satisfied` reste `false` à la fin de ce batch. SQ-G13-002
reste `static-closed-with-cap`. Session 5 interdite.

Autorité de design :

`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\evidence\g13-draw-observe-review-and-phase-b-design-2026-08-25.md`

## Hors scope — ne pas faire

- Réinjecter le PID 42248 (Detached) ou fusionner avec un run G11/G12.
- Canoniser `kDrawCommandId = 0x06` dans `core/`.
- Lancer le scénario 2 avant un B0 match de cette campagne.
- Tuer la source / orchestrer une course mid-flight.
- Inventer un adapter NCOMP Draw ou une compat présentation.
- Revendiquer la promotion G13 même si la matrice passe.
- Recycler les hashes DLL G11 `0b3c4bb9…`, G12 `26d04c35…`, candidat
  offline `d869c95f…`, ou un hash DLL plus ancien que `runtime.cpp`.

## Template B0 — « identique » = forme, pas l’hex Phase A

Le dump revu (PID 42248) est `08 00 02 06 02 09 03 01`. Un autre combat
ne rejouera pas ces huit octets. B0 doit matcher :

| Requis | Variable de session |
| --- | --- |
| Layout `[mask_lo, mask_hi, attacker, id, arg, aux_5, aux_6, ready]` | mask, attacker, spell/arg, `aux_6` |
| `command_id == 0x06` | numéros de slots |
| `aux_5 ∈ {9, 10}` ; B0 demandé = **Cast `9`** | quel sort drawable |
| `ready == 1` au hook | ready-clear natif plus tard |
| Caller RVA `0x000AF064` | PID / base DLL |
| Menu `dword_1D768D8+2` == packed `command_id` | HP / stock / RNG |
| Writer natif appelé **en premier** | |

Écart sur un champ requis → stop, pas d’armement.

## État confirmé à reprendre (2026-08-25)

- Revue **acceptée** : discriminateur PID-bound seulement.
  Enveloppe Phase A SHA-256
  `69310a5bd0bad1093bffeda27d2bddd427622e0a7d93ea74f0462f8a20c23c81`.
- SQ-G13-001 : `live-observed-pid-bound` ; 2e confirmation encore requise.
- SQ-G13-002 : `static-closed-with-cap` ; ne pas relitiger.
- G11 / G12 sémantiquement promus.
- Runtime actuel refuse encore `FF8ISO_G13_DRAW_LIVE_PENDING`.
- Suite observe `suite-G13-observe.bin` flags `0x2000`, reserved
  `(1,1,0,0,0,0,0)`, SHA-256
  `d2aefe3c02c662496eed4ac71c18e198c746c8b5f6a9846fcc2cd204768934af`.
  Régénérer seulement si le wire change.
- EXE supporté
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- `kernel.bin` EN Steam
  `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`.
- Trois identifiants distincts : pending menu-row ; resolver
  `COMMAND_TYPE_ID = 6` ; `aux_5` 9/10, `aux_6` source.
  `mov eax,6` @ `0x4ADF4E` = UI. `0x0D` = Item.

Vérifie HEAD et le hash DLL **actuels** au préflight.

## Décision SQ-G13-002 — déjà prise

GetText (`0x48D200`) : fail si sort absent / source KO / caster Silence.
Cast : steal-count puis handoff Magic, pas de remove stock.
Stock : même qty puis `MutateStock(add)` **dans GetText**.
Resolver case 6 : scale Cast ou `ReviveHP = 0` ; **aucun** re-test source.

Ne pas tuer le monstre. `SourceDiedAfterGetTextUnproven` reste un
garde-fou de test injecté, pas un gate live.

## Recherche initiale — QMD puis sections seulement

1. G13 review-accepted Phase B design confirm-then-arm
2. SQ-G13-001 live-observed-pid-bound second confirmation
3. SQ-G13-002 static-closed-with-cap
4. g13-draw-observe-review-and-phase-b-design
5. G13 observe Fire Plus PID 42248
6. ff8-live-validation-operations one process

Pages :

- `projects/final-fantasy-viii-reimaginated/skills/g13-live-draw-session-plan`
- `projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index`
- `projects/re-ff8/references/g11-g20-static-open-questions`
- `projects/re-ff8/concepts/command-action-pipeline`
- `projects/re-ff8/skills/ff8-live-validation-operations`

Ordre d’autorité : revue 2026-08-25 + HEAD + contrats → IDA EXE supporté
→ wiki actuel → draft offline août 19.

## Inspection minimale avant code

Dans Reimaginated :

- `evidence/g13-draw-observe-review-and-phase-b-design-2026-08-25.md`
- `tests/in-process/G13.suite.toml` + `tools/make_suite_payload.py`
- `contracts/include/ff8iso/launch_contract.h`
- `runtime-x86/src/runtime.cpp` : refuse scénario 2,
  `g13_live_arm_authorized_`
- `core/include/ff8iso/core/draw_slice.hpp` + `tests/test_g13.cpp`
- allowlist / address-map : QueueOrStore RVA `0x00084FD0`

## Travail code — gate d’abord

Avant tout live :

1. Le scénario 2 reste `BAD_REQUEST` tant qu’un observe B0 **du même
   processus** n’a pas matché le template (flag process-local, pas un
   `#define` global `0x06`).
2. Après match B0, le runtime **peut** autoriser l’armement pour les
   QueueOrStore **suivants**. Ne pas exproprier le slot B0 déjà écrit.
3. `observed_pending_id` reste un byte de profil / witness.
4. Contrats + `ctest --preset debug-x86` (35+ tests, dont
   `G13.draw-payload-wire` / `G13.draw-slice`).
5. Recalcule le SHA-256 de la DLL debug-x86 PE32 I386 réellement
   injectée. Ne recycle pas `ea8e1c0d…` si `runtime.cpp` a changé.

Préflight live ensuite (processus neuf) :

1. `python .\tools\validate_contracts.py`
2. `cmake --preset debug-x86` et `ctest --preset debug-x86`
3. PE32 / `IMAGE_FILE_MACHINE_I386`
4. Hashes EXE, DLL, kernel, address-map, suite `.bin`
5. Compat suite/profil **sans** toucher FF8
6. IDA : zéro BP, debugger détaché avant bootstrap

## Protocole live

Un session = un `FF8_EN.exe` neuf, un hash DLL immuable, un bootstrap,
une lignée, un cleanup. `Faulted` est terminal.

### Setup opérateur

- Sauvegarde jetable ; caster avec capacité Magic libre.
- Monstre avec sort offensif drawable connu, pas un GF `id >= 0x40`.
- Combat idle, files vides, pas de latch hérité, pas de DLL inattendue.

### B0 — confirm (processus 1, scénario 1)

Bootstrap observe (flags frame + QueueOrStore/PendingWrite, pas
d’ownership). Suite `g13-draw-observe-v1` scénario 1.

```powershell
python .\tools\make_suite_payload.py --group G13 --g13-scenario 1 `
  --output .\suite-G13-observe.bin
```

Opérateur : Draw → sort déclaré → **Cast**. Le runtime laisse le writer
natif s’exécuter, dump les 8 octets + menu row + caller.

Assertions B0 : template ci-dessus ; `arm_authorized = 0` ; zéro
transfer. Émettre
`evidence/battle-iso/p0-g13-draw-confirm-…-YYYY-MM-DD.json`.

Mismatch → cleanup + stop. Pas de B1.

### B1 — ownership (processus 2 préféré, scénario 2)

Seulement si B0 PASS. Nouveau FF8. D0 **réel** avant la première action
ownée : table Draw/tier, stats caster/source, `K_MAGIC`, stock Magic,
RNG, files, action, latches.

```powershell
python .\tools\make_suite_payload.py --group G13 --g13-scenario 2 `
  --output .\suite-G13-live.bin
```

Le scénario 2 n’est légal que si le gate code exige encore un observe
match **dans ce processus**, **ou** si tu documentes explicitement que
B0 inter-processus (enveloppe hash-bound) lève le refuse pour B1. Le
design préféré : B1 démarre observe-disarmed, re-valide un Cast natif
rapide contre le template, **puis** arme les actions suivantes.

Matrice (pas toutes dans le même processus si `Faulted`) :

| Cas | Résultat requis |
| --- | --- |
| resisted/zero | un RNG quantité ; qty 0 ; pas de mutation stock |
| Cast success | qty `1..9`, RNG scale Cast, handoff Magic, pas de remove |
| Stock success | qty `1..9`, add exact, cap 100 |
| stock plein | add échoue au cap sans corrompre id/qty |
| id absent table | monster amount = 1 |
| high result | clamp 9 |

RNG : steal-count d’abord ; scale Cast seulement si Cast. Restore `D1`
après idle présentation/résultat.

Stock owné : observer d’abord un pending natif `aux_5=10` (forme
template) avant le premier Stock de remplacement.

Fallback un-processus : autorisé seulement si B0 n’est pas `Faulted` et
les files sont idle. Ownership = QueueOrStore **suivant**.

### Cleanup

- Restaurer les hooks ; lire les préimages.
- Runtime `Detached`.
- Processus FF8 survivant.
- Zéro appel domaine interdit, zéro violation d’allowlist.
- HUD/ATB/Switch/Director : ne les installer que s’ils sont nécessaires
  au B1 documenté ; ne pas inventer un restore mask G11 `0x1ff` si seuls
  frame / QueueOrStore / PendingWrite étaient posés.

Injection type (ajuster export / payload) :

```
app_injector.exe FF8_EN.exe <dll> --bootstrap-export FF8Iso_Bootstrap --bootstrap-payload bootstrap-g13-observe.bin --timeout-ms 60000
app_injector.exe FF8_EN.exe <dll> --bootstrap-export FF8Iso_RunInProcessSuite --bootstrap-payload <suite.bin> --timeout-ms 60000
app_injector.exe FF8_EN.exe <dll> --bootstrap-export FF8Iso_Shutdown --timeout-ms 60000
```

Canaris : `python .\tools\capture_live_canaries.py --expect field|battle|restored`.
Evidence : `python .\tools\capture_runtime_evidence.py --dll ... --group G13 --profile P0 --output ...`.

L’assertion observe **FAIL** si `observe_count=0` (D0) et **FAIL**
post-shutdown (witness cleared). Le PASS B0 se lit sur le snapshot
BattleActive. Un PASS B1 ownership se lit sur l’enveloppe de cas, pas
sur un D0 vide.

## Stop conditions

- `Faulted` ou recovery failed ;
- scénario 2 armé sans match B0 ;
- `kDrawCommandId = 0x06` ajouté dans `core/` ;
- write Magic / EQUAL / SG / HP hors contrat Cast/Stock ;
- `command_id` inféré au lieu d’être dumpé ;
- RNG / file / latch inattendu attribué à notre hook ;
- DLL rebuild ou hash changé en cours de processus ;
- écran noir / acteur gelé présenté comme compat G13 (c’est G14) ;
- tentative de tuer la source.

Un processus stoppé = diagnostic seulement. Nouvel essai = FF8 neuf.

## Preuve à émettre

- JSON B0 + note ; JSON par cas B1 (ne pas fusionner en un PASS).
- Hashes EXE / DLL / kernel / suite / enveloppes.
- Dump hex + tableau ; `observed_pending_id` comme byte.
- PID, runtime state, restore mask, call audit.
- B0 : `arm_authorized = 0`. B1 : documenter quand le flag passe à 1.

## Wiki et QMD en fin de batch

Sans inventer de promotion G13 :

- `g13-live-draw-session-plan.md` (B0/B1 PASS/FAIL, hashes) ;
- SQ-G13-001 (2e PID si confirmé ; toujours pas d’enum global) ;
- index campagne + ledger G13 ;
- `log.md` avec `Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"` ;
- `qmd update` puis smokes :
  `Draw pending command_id`, `G13 Phase B confirm`,
  `SQ-G13-002 static-closed-with-cap`.

## Critères de fin

Tous ces points doivent être vrais :

1. Le gate confirm-then-arm est dans le runtime (scénario 2 fail-closed
   sans match) et `ctest` passe ;
2. B0 a une enveloppe hash-bound **ou** un stop discriminant ;
3. B1 n’a pas été lancé si B0 a échoué ;
4. `core/` n’a pas de `kDrawCommandId = 0x06` ;
5. SQ-G13-002 non rouverte ; session 5 non jouée ;
6. `[promotion.G13].satisfied` toujours false ;
7. wiki + QMD à jour ;
8. aucun commit sauf demande explicite.

La **prochaine** étape après un B1 propre est une revue d’ownership,
pas G14, pas la course source-death.
