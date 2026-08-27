# Nouveau batch — G17 réactions, contres, actions périodiques et auto-actions

Tu dois implémenter G17 complètement hors-ligne, préparer puis conduire sa
validation live minimale. Travaille de façon autonome jusqu’à ce qu’un geste
dans FF8 soit réellement nécessaire. À ce moment-là, demande une action courte
et précise à l’opérateur.

Ne committe et ne pousse rien sans demande explicite.

## Résultat attendu

À la fin :

- les huit unités U17.1–U17.8 sont implémentées et testées hors-ligne ;
- G17 consomme le VM G15 et l’application d’actions G16 : il ne crée ni
  second interpréteur, ni second chemin de publication ;
- les réactions immédiates ennemies (section 4), leur staging groupe 0 vers
  Counter/Death (sections 2/3), le Counter joueur produit par la section 2 et
  les routes synthétiques 5–8 sont distingués explicitement ;
- Counter, Cover/Return Damage, auto-recover, groupe 0, Odin/Gilgamesh/Phoenix,
  Angelo et Regen/Doom ont chacun un contrat canonique, transactionnel et
  fail-closed ;
- les réactions différées 2/3 et les actions moteur 5/6/7/8 utilisent la spine
  canonique et sa priorité groupe 0 ; une section 2 joueur peut ensuite publier
  un `ActionRequest` Counter G07, sans writer ni dispatcher natif ;
- **SQ-G17-001** (timing Cover) est réauditée puis fermée par le CFG
  `BattleAction_SelectCoverRedirect` et la capture G08 déjà authentifiée ; une
  nouvelle observation live n’est ouverte que si un discriminant précis reste
  réellement non couvert ;
- une session live positive représentative prouve au minimum un Counter
  replacement publié depuis un vrai hit, sans VM, helper de réaction ni
  dispatcher natif **après la frontière de propriété G17** ;
- G14, G15 et G16 restent promus ; leurs enveloppes et DLL historiques ne sont
  pas réécrites ;
- `promotion.G17.satisfied` ne devient vrai qu’après preuve live, shutdown
  `Detached`, restauration exacte et survie du processus.

G17 ne résout pas les profils de gameplay GF (G18), Card/Devour/Mug (G19), les
Limits (G20), les rolls one-shot de battle init (U22.7), ni la persistance
savemap.

## Préambule outillage — vérifie une fois, puis travaille

### RTK

```powershell
rtk --version
```

Version observée lors des batches G15–G16 : `0.42.4`. Si le hook
`preToolUse` est présent, ne l’invoque pas manuellement.

### QMD / Oxygen

Utilise la commande `qmd`, jamais un MCP QMD.

```powershell
qmd status
qmd get ff8-wiki/projects/re-ff8/references/battle-iso-migration-milestones.md:719:21
qmd get ff8-wiki/projects/re-ff8/references/g11-g20-static-readiness-ledger.md:568:17
qmd get ff8-wiki/projects/re-ff8/references/g11-g20-static-open-questions.md:276:12
qmd get ff8-wiki/projects/re-ff8/concepts/command-action-pipeline.md
qmd get ff8-wiki/projects/re-ff8/concepts/enemy-ai-vm.md
qmd get ff8-wiki/projects/re-ff8/concepts/timed-status-expiry.md
qmd get ff8-wiki/projects/re-ff8/concepts/targeting-system.md
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p1-g16-ai-actions-validation.md
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p1-g15-ai-control-validation.md
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p0-g14-presentation-validation.md
```

Lis aussi directement, par sections :

```text
ai-prompt/completed/ai_investigation_static_forced_action_group0_and_counters.md
ai-prompt/completed/ai_investigation_live_ai_relay_70_71.md
ai-prompt/todo/g16-enemy-ai-actions-new-chat.md
.agents/skills/implementing-iso-layer-boundary/SKILL.md
```

Les pages peuvent contenir des commentaires IDA historiques devenus faux.
L’instruction machine et les captures authentifiées priment sur le nom
Hex-Rays ou une phrase de wiki.

Si le reranker CUDA échoue : `qmd search` ou
`qmd query --no-gpu --no-rerank`.

### Context Mode

Filtre les gros outputs (diffs, CTest, traces multi-hit). La racine Context
Mode est `re-ff8`. Si un outil refuse un chemin Reimaginated, utilise une
commande locale ciblée. Les `$variables` PowerShell passées via MCP peuvent
être mangées : préfère Python pour les extractions structurées.

### IDA MCP

IDB autoritative :

```text
D:\Modding\ff8\retro-exe\FF8_EN.exe.i64
```

EXE supporté SHA-256 :

```text
064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570
```

Racines G17 déjà connues :

- `Battle_ApplyDamageOrHeal` `0x494410` ;
- appels réaction immédiate `0x4947F6` (survie) et `0x4949FF` (KO) ;
- `BattleArbitration_SelectNextAction` `0x485460` ;
- `EnemyAI_PrepareTurnAction` `0x485610`, dispatch dynamique vers
  `EnemyAI_DispatchSection` autour de `0x48567F` ;
- `EnemyAI_DispatchSection` `0x4877F0` ;
- `EnemyAI_VM_ExecuteScript` `0x487DF0` — interdit depuis le remplacement ;
- `BattlePendingAction_SetupCommand` `0x483400` ;
- `Battle_EnqueueSpecialAction` `0x484720` ;
- `Battle_EnqueueEnemyCounterActions` `0x4847B0` ;
- `BattleAction_SelectCoverRedirect` `0x48EB90` ;
- `BattleAction_ResolveSpecialActionAndUpdateDamage` `0x485160` — interdit ;
- `EnemyAI_CheckCurativeAbilityAvailable` `0x487D80` — à spécifier, pas à
  appeler ;
- `EnemyAI_UseCurativeAbility` `0x487DB0` — à spécifier, pas à appeler ;
- `Angelo_SetupAutoCommand` `0x482E60` ;
- `Angelo_CheckAutoCounter` `0x482E80` ;
- `Angelo_DamageCounter_ReverseCheck` `0x482F10` ;
- `AngeloOdin_SpecialActionTick` `0x482F80` ;
- `Angelo_QueueVariantAction` `0x4831C0` ;
- `Battle_FindFirstAlivePartySlot` `0x486080`.

Toute découverte va d’abord dans l’IDB (nom, type, commentaire), puis dans
l’address map et l’ABI ledger. Ne promeus pas un nom historique sans vérifier
les bytes.

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

`Invoke-IsoGroup` **n’existe pas**. Le flux live réel est :

```text
tools\make_bootstrap_payload.py
tools\make_suite_payload.py
app_injector.exe  (FF8Iso_Bootstrap / FF8Iso_RunInProcessSuite / FF8Iso_Shutdown)
tools\capture_runtime_evidence.py
tools\capture_live_canaries.py
```

Cwd injecteur = dossier qui contient `app_hook.dll`. Le DLL ISO peut être
fourni en chemin absolu.

État audité après la promotion G16 du 2026-08-27 :

- HEAD docs `a3d4d5568ecf73b29eaebe70446f86893f51d207` ;
- HEAD implémentation `adfc5ac81bde04331d75aa433c73259a8ac54eca` ;
- worktrees propres au moment de cet audit ; s’ils sont devenus sales,
  préserve tout changement utilisateur, sans reset ni checkout destructif ;
- `validate_contracts.py` : PASS ;
- CTest `debug-x86` : **43/43** ;
- `[promotion.G14].satisfied = true`, DLL
  `363d91cf8a4107c41fa5cbc2f8eb692dcf834765fa88790832aea3ca2c814471` ;
- `[promotion.G15].satisfied = true`, DLL
  `fcc8365ef20fcc8071ca5d00ccaa2a188a48623c1b4e7750711070ebda57e212` ;
- `[promotion.G16].satisfied = true`, DLL
  `9241978072bdc85bec9d54c38f28a1261f171cf6f7c55eef155edf9e3a3b6f54` ;
- enveloppes G16 canoniques :
  post-suite `2080b5c67a80ca4d09376f3c1c2750483d7f8a4064c5829f75fd2a2730d335ab`,
  post-shutdown `2edb4805767b159045b131c68f14a28bc4199633367b5785ebc0cf5e5dc987c6` ;
- l’ancien couple G16 DLL `85bda304…`, enveloppes `cdcef508…` /
  `504839dd…`, est **rétracté** et non promotionnel ;
- protocole G16 v1, schéma 20, snapshot 3064 B, witness G16 256 B à
  l’offset 2776 ;
- G16 live : `c0m044`, slot 3, `UseAbility`, commande 8, argument 2,
  masque `0x8`, `aux_5=12`, une écriture pending allowlistée, restauration
  exacte.

Le champ `[P1.G16].status` de `ownership-matrix.toml` peut encore porter une
phrase `offline-corrected ... unsatisfied`, alors que la preuve canonique et
`evidence-policy.toml` disent `live-promoted`. Corrige cette dette documentaire
avant d’ajouter `[P1.G17]`, sans modifier les hashes ni les enveloppes G16.

Un ancien PID de promotion peut encore être vivant. Demande l’état réel avant
tout rebuild. Ne reconstruis jamais par-dessus un DLL chargé.

## Dettes à préserver, pas à rouvrir

### G15 — VM close

- Un seul VM bytecode, 61 opcodes, IF/JUMP et budget de sécurité déjà testés.
- Import live via `*monster_ai_section`.
- `AiControlPolicy.read_only_shadow=true` et
  `emit_native_action=false` restent les défauts.
- Le corpus 200 est clos ; ne rescane pas les opcodes à l’aveugle.

### G16 — application d’actions close

- `run_enemy_ai_actions` = VM G15 + application des `AiDeferredKind` + resume.
- `ActionRequest` G07 est le seul handoff canonique des actions ordinaires.
- Import table d’abilités via `*monster_info_section`, 380 B.
- Pending host est la seule écriture live G16, allowlistée et restaurée.
- GetText, Resolve et VM natifs restent interdits.
- Host spawn/insert `0x71` n’est pas acquis par G16.

### G14 — présentation close

- Les intentions et barrières typées vont vers le propriétaire scellé G14.
- `0x70` et `0x74` sont live ; `0x71` worker est confirmed-static.
- G17 ne publie aucun pointeur replacement dans une liste native.

### G10 / G07 / G08 / G09

- G10 émet déjà `PeriodicActionIntent` Regen 6 / Doom 5.
- G07 possède `enqueue_forced_action`, les groupes 0–2 et l’arbitrage.
- G08 applique un redirect **déjà décidé** ; choisir Cover/Return est G17.
- G09 possède les primitives HP/event ; `Battle_ApplyDamageOrHeal` reste
  interdit.

## Contrat G17 autoritatif

G17 dépend de G16 et porte :

| Unité | Contenu | Autorité actuelle |
| --- | --- | --- |
| **U17.1** | Réaction on-hit/death : provenance attaquant, champs last-attacker, section 4 immédiate ennemie, `target_reaction_type`, staging groupe 0 vers section 2/3, ordre par impact | ApplyDamage + callbacks de fin d’action |
| **U17.2** | Counter joueur : gate d’ability, last-attacker target, incapacitation, publication G07, exactly-once | section 2 party branch |
| **U17.3** | Décision Cover puis Return Damage séparée : selector pré-résolution, redirect U08.6, accumulateur et follow-up | `0x48EB90` + SQ-G17-001 |
| **U17.4** | Auto-recover : `max_hp-current_hp`, seuils, sélection Item EQUAL, cible self, consume/rollback | section 2 + `0x487D80/DB0` |
| **U17.5** | Groupe 0 moteur : sections 2/3 et ids 5/6/7/8, priorité, saturation, exemption incapacitation | callbacks + G07 + `0x484720` |
| **U17.6** | Scheduling runtime Odin/Gilgamesh/Phoenix : état initialisé, gates récurrents, RNG, variant, interception wipe | trigger seulement |
| **U17.7** | Angelo : auto, turn/damage counters, cooldown, variants et request typée | section 8 + famille `0x482E60` |
| **U17.8** | Regen/Doom : intents G10 → groupe 0 → résolution canonique HP/status/event → ack | G10/G07/G09 |

Le gate est atteint lorsque tous les canaux non-menu sont distingués et
orchestrés sans dispatcher battle natif.

## Vérités statiques connues — ne pas les dégrader

1. `Battle_ApplyDamageOrHeal` appelle `EnemyAI_DispatchSection(target, 4)` sur
   les branches ennemies admissibles du chemin survie (`flag_data&0x10`) et du
   chemin KO (`flag_data&0x20`, hors Eject). Ce n’est pas un appel universel
   pour toute cible party. Les commentaires historiques « section 2/3 » à ces
   callsites sont faux ; l’immédiat poussé est `4`.
2. Le chemin survie pose `target_reaction_type=2`, le chemin KO `=3`, puis la
   section 4 peut discriminer.
3. Après l’action, les callbacks `0x47DDA0`, `0x47DE70` et `0x47E120`
   parcourent `target_reaction_type`/`attack_sequence_id`, enfilent les sections
   2 ou 3 par `Battle_EnqueueSpecialAction(slot, section, 0)`, puis clearent ces
   deux champs. `EnemyAI_PrepareTurnAction` dépile ensuite le `special_id`
   dynamique et appelle le dispatcher.
4. Table de dispatch actuellement reconnue :
   - 0 Init ;
   - 1 Turn ;
   - 2 Counter ;
   - 3 Death ;
   - 4 OnHit / pre-hit historique ;
   - 5 fixed attack `(246, 0x2B)` ;
   - 6 basic attack `(0, 4)` ;
   - 7 Odin/Gilgamesh `(245, variant)` ;
   - 8 Angelo `(240, variant)`.
5. Les sections 5–8 sont des routes synthétiques. Elles ne prouvent pas que la
   table `.dat` contient neuf blobs. Le codec G15 infère au plus huit offsets ;
   ne l’élargis pas à neuf sans bytes qui le justifient.
6. Les réactions Counter/Death sont donc **staged dans le groupe 0**, puis
   AI-dispatched en section 2/3. Le Counter joueur produit par la section 2 est,
   lui, une commande ordinaire et non une seconde action groupe 0.
7. `Battle_EnqueueEnemyCounterActions` `0x4847B0` est un autre chemin : il
   parcourt les ennemis `flag_data&0x200`, enfile `special_id=1` dans le
   groupe 2, puis clear le bit. Ne le confonds ni avec la réaction section 2,
   ni avec le groupe 0.
8. Branche party section 2 reconnue :
   - ability bit `&4` → Counter, commande 1, argument 0, cible
     `1 << last_attacker` ;
   - `com_file_id==4` → famille Angelo ;
   - ability gate `&0x40000` → Auto-Potion/auto-recover Item.
9. Le groupe 0 n’est jamais rempli par transfer pending. Son seul writer natif
   est `Battle_EnqueueSpecialAction` `0x484720`.
10. IDs G17 connus dans ce writer : 2 Counter section, 3 Death section,
    5 Doom, 6 Regen, 7 Odin/Gilgamesh/Phoenix, 8 Angelo. L’id 0 sert aussi à
    l’initialisation/entrée et n’est pas une réaction G17.
11. L’arbitrage scanne 0→1→2. Le groupe 0 est exempt du skip
    d’incapacitation ; cette exemption ne doit pas être appliquée à Counter.
    Elle admet toutefois la **section 2** groupe 0 ; les gates Counter party se
    trouvent à l’intérieur de cette section.
12. G10 émet Regen à une frontière de 60 unités. Doom désactive timer[10],
    retire le bit Doom et émet l’action 5.
13. `BattleSession::tick_g10_status` enfile déjà ces intents via
    `enqueue_forced_action`. G17 doit étendre/refactorer ce chemin, pas ajouter
    un second enqueue.
14. Les RNG Odin/Gilgamesh/Phoenix/Angelo partagent les lanes de battle RNG.
15. La route synthétique 7 produit normalement une request `(245, variant)`.
    Pour `variant==1`, elle produit **deux** requests ordonnées et atomiques :
    `(245,1,target dérivé)` puis `(0,8,0xC007)`.
16. U18.7 résoudra les profils spéciaux GF. G17 ne doit produire que trigger,
    variant, cible et request/intent.
17. Les rolls Odin `33/256` / Gilgamesh `9/256` de battle init appartiennent à
    U22.7 ; G17 consomme leur état, il ne les rejoue pas.

## Contradictions à résoudre avant le code G17

Ne code pas ces points à partir des phrases de wiki :

1. Certaines pages disent encore « ApplyDamage dispatch section 2 après hit,
   section 3 après mort ». Les callsites connus poussent section 4. Revalide les
   deux branches et corrige les pages.
2. Le nom `AiSectionId::PreHit` n’est pas une preuve que la section 4 s’exécute
   avant le hit. Renomme-la en fonction de l’ordre réellement prouvé.
3. `CHARA_ABILITIES` est déjà prouvé `uint32_t`, stride `0x1D0`, trois party
   records dans un span `0x3A4`. Le reader G11 ne lit volontairement que le
   byte bas. G17 doit ajouter un import 32 bits distinct sans casser l’API ni
   les witnesses G11.
4. Auto-recover compare exactement `max_hp-current_hp` : `<=200` aucun item,
   `201..1000` item 1 si présent, `>1000` item 3 puis fallback
   `1,2,4,5,9`. Les helpers nommés « ability » scannent en réalité EQUAL et
   publient une commande Item 4 self-target, puis décrémentent l’inventaire.
5. `CHARA_ABILITIES&8` vu dans ApplyDamage ne distingue pas à lui seul Cover de
   Return Damage ni son ordre par rapport au commit HP.
6. Les noms « Odin/Gilgamesh/Phoenix/Angelo » sur l’action 7/8 ne ferment pas
   les gates runtime, probabilités, variants ou cooldowns.

Tout point non fermé devient une `SQ-G17-xxx` avec :

- claim A/B ;
- preuve pour/contre ;
- discriminant manquant ;
- prochain probe statique ;
- probe live éventuel ;
- scope bloqué et comportement fail-closed.

## Hors scope strict

Ne pas implémenter dans G17 :

- calcul de dégâts/statuts/Boost d’un GF, charge ou absorption (G18) ;
- cinematic GF, chargement MagicList ou callback GF natif ;
- rolls one-shot Odin/Gilgamesh d’initialisation bataille (U22.7) ;
- Card, Devour, Mug/steal, reward persist (G19 / cleanup) ;
- Limit player state machines et Angel Wing (G20) ;
- drain live, toujours fail-closed ;
- retour à `Battle_ApplyDamageOrHeal`, GetText, Resolve, dispatcher spécial,
  helpers Counter/Cover/Angelo/curative natifs ;
- insertion host directe dans exec group 0 ;
- pointeur replacement dans task/relay/sequence native ;
- promotion d’un champ, bit ou seuil depuis un nom Hex-Rays seul ;
- large matrice live « chaque special » sans discriminant temporel ou ABI.

## Loi de couches obligatoire

```text
ff8iso_core -> ff8iso_application -> ff8iso_runtime -> ff8_battle_iso
ff8iso_abi  -> ff8iso_runtime
```

- `core` : événements de hit, décisions de réaction, queues/intents, règles
  Counter/Cover/auto-recover/special et résolutions Regen/Doom.
- `application` : orchestration transactionnelle, appel G15/G16 par section,
  publication G07, acknowledgements et rollback.
- `abi` : uniquement POD/adresses/layouts natifs prouvés.
- `runtime-x86` : import des champs host, codecs de tables G17, witness,
  observation/suppression bornée et write guard.
- `core` / `application` : aucun `ff8iso/abi`, `abi::`, RVA, `find_symbol`,
  `LegacyBattleImage`, NCOMP ou record natif.
- N’ajoute pas de `TemporaryG17NcompAdapter` par défaut. Si un appel natif
  exceptionnel est réellement requis, stoppe et prouve son ABI, son ownership
  et sa cible de retrait avant de coder.
- `ff8iso_core` ne linke pas `ff8iso_abi`.
- Étends `validate_contracts.py` pour interdire au-dessus de runtime :
  `Battle_ApplyDamageOrHeal`, `EnemyAI_PrepareTurnAction`,
  `EnemyAI_DispatchSection`, `BattlePendingAction_SetupCommand`,
  `Battle_EnqueueSpecialAction`, `BattleAction_ResolveSpecialActionAndUpdateDamage`,
  helpers Angelo et helpers curatifs natifs.

Lis `.agents/skills/implementing-iso-layer-boundary/SKILL.md` avant le code.

## Architecture cible

### 1. Un événement de réaction canonique

Ajoute dans `core` un modèle valeur pointer-free, par exemple :

- `ReactionTrigger` (`ImpactSurvived`, `ImpactKilled`, `CounterReady`,
  `Periodic`, `PartyWipe`, `TurnCounter`, `DamageCounter`) ;
- `ReactionChannel` (`EnemyScript`, `PartyCounter`, `Redirect`,
  `AutoRecover`, `EngineForced`, `SpecialSchedule`) ;
- `ReactionInput` : source, cible initiale/finale, masque, index d’impact,
  HP pre/post, status pre/post, provenance de commande, champs last-attacker,
  reaction type, RNG snapshot ;
- `ReactionDecision` : disposition, section, redirect, follow-up
  `ActionRequest`, forced-special id, presentation intents, resource intent ;
- `ReactionReport` : trace ordonnée, mutations, draws, publication, erreur et
  rollback.

Les noms exacts peuvent changer. Les invariants non :

- aucune adresse ni pointeur host ;
- largeur fixe et ordre explicite ;
- un impact produit au plus une décision par canal ;
- overflow, target invalide ou état ambigu → erreur typée avant mutation ;
- replay d’un même sequence/impact id → pas de double réaction.

### 2. Réutiliser G15/G16

Pour les sections ennemies 2/3/4 :

```text
ReactionInput
  -> choisir la section prouvée
  -> application::run_enemy_ai_actions(...)
  -> AiActionReport
  -> ActionRequest / mutation / PresentationIntent
```

Ne duplique pas :

- le parser section 8 ;
- le VM ou son PC/resume ;
- l’application des `AiDeferredKind` ;
- le lookup ability ou le fold `K_ENEMY_ATTACK` ;
- la publication pending.

G17 choisit **quand** et **quelle section**. G15/G16 exécutent son contenu.

### 3. Sections synthétiques 5–8

Modélise 5–8 comme routes de préparation sémantique distinctes des blobs
`.dat`. N’ajoute **pas** `Special3=8` à `AiSectionId` tant que cet enum sert
d’index direct dans `AiScriptBundle.sections[8]`. Crée un type de dispatch G17
séparé couvrant 0–8, puis convertis seulement 0–4 vers les blobs data-backed.
N’augmente pas `AiScriptBundle.sections` sans preuve d’un neuvième offset.

Leur sortie ordinaire est un batch borné d’`ActionRequest` :

- source `EngineForced` ou autre provenance explicitement justifiée ;
- raw `command_id`, argument/variant, target mask, aux et sequence ;
- publication par la spine G07 ;
- résolution gameplay différée à G18 si le profil est GF/Angelo spécial.
- la route 7 / variant 1 publie deux requests ordonnées dans une transaction
  atomique ; si l’une ne peut pas être admise, aucune des deux ne l’est.

### 4. Counter joueur

Le **trigger section 2** arrive par une entrée groupe 0. La commande Attack
Counter créée à l’intérieur de cette section n’est pas une seconde entrée
groupe 0 : elle suit la publication ordinaire G07.

Après fermeture IDA, le chemin doit :

1. vérifier slot actif, ability et incapacitation exacte ;
2. vérifier `last_attacker_slot_id` et l’éligibilité de la cible ;
3. construire commande 1 / argument 0 / masque du last attacker ;
4. publier une seule fois par impact admis ;
5. ne pas consommer le tour ATB ordinaire sauf preuve ;
6. refuser sentinel, acteur mort/pétrifié/éjecté et target disparu selon
   l’ordre natif prouvé.

Le bloc/indice pending exact reste runtime/canonique G07. Ne hardcode pas
`block 0` parce que G16 l’utilisait pour un ennemi.

### 5. Cover et Return Damage

Cover est sélectionné dans `BattleAction_SelectCoverRedirect` `0x48EB90`,
pendant le fan-out G08 et avant `BattleAction_ResolveAndApplyDamage`. Il ne
vient pas de la branche party section 2. Le selector est borné aux attaques
ennemies admissibles, filtre les porteurs de Cover, et ne tire un RNG que pour
départager deux candidats valides.

Sépare :

- sélection du déclencheur ;
- décision redirect/follow-up ;
- application du redirect par U08.6 ;
- accumulation de dommage ;
- hit/HP/event final ;
- réaction secondaire éventuelle.

Traite Return Damage comme un chemin distinct. Le bit/accumulateur/follow-up
reste à fermer depuis ApplyDamage et ne doit pas hériter mécaniquement des
gates Cover.

Interdit :

- appeler U08.6 avant d’avoir décidé Cover ;
- appliquer deux fois la réduction Cover déjà présente dans les formules ;
- utiliser le HP final pour reconstruire un delta perdu ;
- réagir à une cible initiale alors que le plan final prouve une autre cible ;
- produire une boucle Return Damage ↔ Return Damage sans garde de provenance.

La trace doit conserver source target, covered target, final target,
accumulateur avant/après, impact index et follow-up sequence.

### 6. Auto-recover

Le service reçoit explicitement :

- `max_hp-current_hp` ;
- HP/max HP ;
- `CHARA_ABILITIES` 32 bits avec bit `0x40000` ;
- inventaire EQUAL G12 ;
- cible self ;
- policy de consommation/rollback.

Il ne lit ni global, ni `K_ITEM`, ni host inventory depuis `core`.
Réutilise les codecs/services G12, sans appeler les helpers curatifs natifs.
Le profil exact est :

- `missing_hp <= 200` : rien ;
- `201..1000` : item 1 si présent ;
- `>1000` : item 3, sinon 1, 2, 4, 5, 9 ;
- commande Item 4, cible self ;
- décrément EQUAL exactement au commit.

Une action refusée ne consomme rien.

### 7. Groupe 0

Réutilise `enqueue_forced_action(CommandSpineState&, ...)`.

- ids 2/3/5/6/7/8 restent des `special_id` bruts ou un enum G17 borné ;
- priorité groupe 0 avant groupes 1/2 ;
- exemption incapacitation seulement pour le groupe 0 ;
- réactions section 2/3 : staging groupe 0, puis dispatch G15/G16 ;
- Counter joueur : request Attack ordinaire après dispatch section 2 ;
- `Battle_EnqueueEnemyCounterActions` : id 1 groupe 2 et clear
  `flag_data&0x200`, chemin distinct ;
- saturation/corruption suit les erreurs G07, sans writer natif ;
- metadata sidecar garde `ActionSource::EngineForced` + sequence ;
- ack/complete exactement une fois.

### 8. Odin/Gilgamesh/Phoenix et Angelo

G17 possède :

- trigger runtime ;
- lecture d’un état déjà initialisé ;
- compteur/cooldown ;
- draw RNG et ordre ;
- choix de variant ;
- source/target ;
- scheduling et publication.

G17 ne possède pas :

- les rolls one-shot de battle init ;
- le calcul de l’effet, damage/status/Boost ;
- la cinematic ou les callbacks GF ;
- les récompenses ou la persistance.

Pendant les sessions Counter/Cover, conserve
`FF8ISO_BOOTSTRAP_SUPPRESS_RANDOM_SPECIAL_GFS`. Un test dédié de scheduling ne
retire ce garde que dans un process frais, avec scénario borné et rollback
préparé.

### 9. Regen/Doom

Étends le raccord déjà présent dans
`BattleSession::tick_g10_status` vers G07/G09 :

```text
StatusTickReport
  -> PeriodicActionIntent(6 Regen | 5 Doom)
  -> enqueue_forced_action(group 0)
  -> arbitrate
  -> resolve semantic HP/status/event
  -> complete/ack
```

La résolution utilise les primitives canoniques HP/event déjà possédées. Elle
n’appelle ni `BattleAction_ResolveSpecialActionAndUpdateDamage` ni
`Battle_ApplyDamageOrHeal`.

Ne reparcours pas les transitions pour enqueuer une deuxième fois. Refactore
le chemin existant pour que enqueue, résolution, ack et rollback forment une
transaction unique.

Ferme par IDA/fixtures :

- magnitude Regen, clamp et event ;
- Doom Death/HP/event ordering ;
- réaction section 4/3 éventuelle après Doom ;
- exactly-once si le timer tick est rejoué ;
- interaction pause/latch/result et queue saturation.

Si la magnitude ou l’ordre terminal reste inconnu, garde la résolution
concernée fail-closed ; ne remplace pas l’inconnu par `max_hp/16` ou HP=0 sans
preuve.

### 10. Orchestration `application`

Ajoute une API de session qui :

1. capture preimage BattleState, spine, RNG, ressources et state G15/G16 ;
2. admet un `ReactionInput` avec sequence/impact id ;
3. choisit le canal et la section ;
4. exécute G15/G16 ou une règle party/special canonique ;
5. publie pending/forced seulement après validation complète ;
6. conserve un commit accepté ;
7. rollback intégralement Malformed/Budget/overflow/target/resource/drift ;
8. expose un rapport compact au runtime.

Un refresh host ne doit pas écraser les queues/intents application-only déjà
committés. Reprends le modèle `capture_application_only_action_state`.

### 11. Runtime

Le runtime :

- importe les champs G17 prouvés avec codecs nommés ;
- authentifie slot, section 8, ability bits, last-attacker, reaction type,
  accumulateur, ressources et RNG ;
- capture les preimages de toute plage host allowlistée ;
- observe/supprime au seam le plus étroit ;
- appelle l’application sur copie canonique ;
- n’écrit en Session P que le pending G07 autorisé ;
- restaure hooks et pending au shutdown ;
- remplit le witness G17 sans pointeur.

Pas d’installation HUD/ATB/Switch/Director pour le scénario Counter en combat
pause.

## Investigation statique obligatoire avant code

Ferme au minimum :

1. graphe exact des producteurs : callbacks `0x47DDA0/0x47DE70/0x47E120`
   pour ids 2/3 groupe 0, `Battle_EnqueueEnemyCounterActions` pour id 1
   groupe 2, puis `EnemyAI_PrepareTurnAction` et dispatch 0–8 ;
2. ordre des deux branches ennemies section 4 relativement à HP/status/event,
   last-attacker et multi-hit, avec leurs gates `flag_data` ;
3. writers/readers de `target_reaction_type`, `damage_accumulator`,
   `saved_hp_flag` et champs last-attacker ;
4. import G17 32 bits de `CHARA_ABILITIES` déjà prouvé stride `0x1D0`, sans
   modifier le reader G11 low-byte ;
5. Counter : gate incapacitation, queue/pending exact, target sentinel,
   clear/ack ;
6. Cover : confirmer le CFG `0x48EB90`, ses gates, son éventuel départage RNG
   et la capture G08 ; Return Damage : bit, accumulateur et follow-up séparés ;
7. auto-recover : `max_hp-current_hp`, gate ability/status, ordre Item
   `3→1→2→4→5→9`, consommation EQUAL et rollback ;
8. table complète des callers de `Battle_EnqueueSpecialAction` et ids
   réellement passés ;
9. résolution ids 5/6 : magnitude, status/HP/event et reaction callbacks ;
10. scheduling runtime id 7 : états Odin/Gilgamesh/Phoenix, party-wipe
    interception, draws et variants ; séparer init U22.7 ;
11. scheduling id 8 / Angelo : counters, cooldown, K_RINOA_LIMIT_PART_2,
    variants et cible ;
12. démontrer qu’aucune branche G17 ne nécessite GetText/Resolve/VM/helper
    natif après engagement.

Persiste noms/types/commentaires dans l’IDB et écris un rapport statique G17
avant le code runtime.

## Classification des claims et économie de live

Avant tout live :

| Claim | Classe initiale | Live ? |
| --- | --- | --- |
| Section 4 poussée aux deux callsites ApplyDamage | `confirmed-static` après recheck | non |
| Table dispatch 0–8 | `confirmed-static` après recheck | non |
| Réutilisation VM G15 / apply G16 | `confirmed-offline` | non |
| Groupe 0 writer/priorité/exemption | `confirmed-static` + G07 | non |
| Staging section 2/3 groupe 0 | `confirmed-static` après recheck | non |
| Counter request shape | `confirmed-offline` après IDA | Session P handoff |
| Cover selector avant resolver | `confirmed-static` + capture G08 | non par défaut |
| Return Damage timing/follow-up | `mapped` | Session O seulement si A/B restant |
| Auto-recover seuils/Item EQUAL | `confirmed-static` après recheck | non |
| Regen/Doom integration | `confirmed-offline` après closure 5/6 | live seulement si discriminant restant |
| Odin/Gilga/Phoenix scheduling | `mapped` | pas de live par routine |
| Angelo scheduling/cooldown | `mapped` | pas de live par routine |
| Downstream GF/Angelo gameplay | G18 | interdit G17 |

Le milestone exhaustif devient une couverture offline. Le live ne rejoue qu’un
handoff représentatif et les discriminants temporels/ABI encore ouverts.

## Questions ouvertes minimales

### SQ-G17-001 — timing Cover

- statut wiki initial : `live-required`, confiance 0.35 ;
- nouvelle preuve : selector `0x48EB90` avant resolver + capture G08
  `g08-native-cover-redirect-pre-g09` ;
- travail : auditer ces deux preuves, fermer la SQ en
  `confirmed-static+live-prior` si elles couvrent bien le timing demandé ;
- nouveau live seulement si un A/B résiduel est écrit, par exemple ordre
  Return Damage/accumulateur qui ne relève pas du redirect Cover ;
- bloque U17.3 tant que la résolution n’est pas persistée.

### SQ-G17-002 — largeur abilities

- storage fermé : `CHARA_ABILITIES` u32, stride `0x1D0`, span `0x3A4` ;
- travail : créer/importer un champ G17 32 bits sans casser le byte G11 ;
- vérifier les bits G17 exacts et leurs noms ; aucun live requis.

### SQ-G17-003 — auto-recover

- CFG fermé : quantité `max_hp-current_hp`, seuils 200/1000, items
  `3→1→2→4→5→9`, commande 4 self et décrément EQUAL ;
- travail : persister la preuve et tester le rollback/commit ;
- la branche reste refusée uniquement si un gate status/flag demeure ambigu.

### SQ-G17-004 — sections synthétiques et scheduling

- question : priorités/gates exactes de 5–8 et clear des compteurs ;
- séparer trigger G17, init U22.7, resolve G18.7 ;
- pas de session GF/Angelo tant qu’aucun A/B temporel n’est écrit.

Ajoute d’autres SQ seulement pour un vrai discriminant, pas pour recopier les
huit unités.

## Tests offline obligatoires

Ajoute `tests/offline/test_g17.cpp` et les tests Python payload/capture.
Enregistre `G17.reactions` dans CTest. Les 43 tests actuels restent verts.

Couverture minimale :

1. réaction hit-survive : section 4, reaction type 2, last-attacker et ordre ;
2. réaction hit-KO : section 4 reaction type 3 puis Death section 3 selon le
   scheduler prouvé ;
3. multi-hit : un event par impact, sequence distincte, aucun doublon ;
4. enemy Counter/Death/OnHit : réutilise VM G15 + apply G16, PC/RNG exacts ;
5. Counter party : commande 1 / argument 0 / last-attacker target ;
6. Counter invalid : sentinel, target mort/caché/absent, acteur incapacitated ;
7. section 2 est staged groupe 0 ; sa request Counter finale est ordinaire et
   n’ajoute pas une deuxième entrée groupe 0 ;
8. Cover : no proc/proc, source/final target, accumulateur et U08.6 ;
9. Return Damage : follow-up, provenance et garde anti-boucle ;
10. auto-recover `max_hp-current_hp` aux seuils `200/201/1000/1001` ;
11. auto-recover items 1/3/fallback 2/4/5/9 disponibles/absents, consume
    exactement une fois et rollback ;
12. groupe 0 ids 2/3/5/6/7/8, priorité sur 1/2, exemption incapacitation ;
13. id 1 groupe 2 via `Battle_EnqueueEnemyCounterActions`, bit 0x200 clear ;
14. saturation/corrupt links/sequence mismatch/double ack ;
15. Regen : frontière 60, **un seul enqueue existant**, heal/event/clamp ;
16. Doom : expiry, clear Doom, action 5, Death/HP/event/order, pas de double
    enqueue ;
17. Odin/Gilgamesh/Phoenix : gates runtime, draws, variants, guard et
    interception wipe sur fixtures ;
18. route 7 variant 1 : deux requests ordonnées, admission atomique/rollback ;
19. prouver que les rolls init ne sont pas rejoués ;
20. Angelo : auto/turn/damage counters, cooldown, variants et target ;
21. routes synthétiques 5–8 : batch request sans faux neuvième blob `.dat` ;
22. pending plein, groupe 0 plein, resource unavailable, malformed VM et
    safety budget → rollback ;
23. policy defaults = aucune écriture host, aucun helper natif ;
24. trace/replay déterministes avec mêmes RNG cursors ;
25. régressions G00–G16, notamment G10, G14, G15, G16 ;
26. contrats de couches et interdictions de symboles G17 ;
27. payload/wire/snapshot/schema legacy + G17.

Ajoute des fixtures authentifiées seulement si leur provenance et hash sont
enregistrés. Aucun test ne dépend d’un chemin Steam absolu.

## Contrat runtime et preuves

Étends de façon versionnée :

- `FF8ISO_EVIDENCE_SCHEMA_VERSION = 21` si witness G17 ajouté ;
- `FF8ISO_G17_REACTIONS_PROTOCOL_VERSION = 1` ;
- `FF8ISO_SUITE_G17_REACTIONS = 1u << 17` ;
- `FF8ISO_EVIDENCE_G17_REACTIONS` ;
- snapshot 3320 B si witness G17 256 B inséré après G16 ;
- offset G15 2520 inchangé ;
- offset G16 2776 inchangé ;
- offset G17 3032 ;
- décodeurs compatibles avec les snapshots historiques, notamment
  2808/schéma19 et 3064/schéma20.

Scénarios proposés :

1. `positive-counter` — obligatoire ;
2. `reaction-observe` — optionnel, autorisé uniquement pour un A/B résiduel
   de SQ-G17-001/Return Damage ;
3. `positive-cover` — optionnel si utile après observation ;
4. `periodic-special` — offline par défaut, live seulement sur A/B nommé.

Witness G17 compact et pointer-free, au minimum :

- protocol/scenario/input/error/runtime state ;
- actor, original target, final target, last attacker ;
- trigger/channel/section/reaction type/impact index ;
- HP et accumulateur avant/après ;
- ability mask hash/width witness, sans pointer ;
- decision/result/error/rollback ;
- request command/argument/mask/aux/source/sequence ;
- pending writes / forced enqueues / selected group / special id ;
- VM PC/opcodes/deferred/trace hash si section ennemie ;
- RNG cursors/draw count/hash ;
- resource kind/id/qty before/after ;
- Regen/Doom HP/status/event summary ;
- special family/variant/schedule count ;
- `native_source_action_calls` avant frontière et
  `native_reaction_vm_calls` après frontière, plus dispatcher/helper calls ;
- forbidden calls, write-guard violations, memory hashes ;
- Odin/Gilgamesh guard, restore flags, cleanup.

Refuse G17 sous `P0`, profil implicite, observation sans SQ/A-B, ou scénario
positive si G14–G16 ne sont pas promus.

Ajoute :

- `tests/in-process/G17.suite.toml` ;
- payload G17 dans `make_suite_payload.py` ;
- capture/décodage/validation G17 ;
- `[P1.G17]` ownership-matrix ;
- `[promotion.G17]` evidence-policy, `satisfied=false` avant live ;
- assertions `validate_contracts.py`.

## Seam live recommandé

### Observation Cover

Le seam d’observation doit être le plus étroit possible autour de :

- sélection target/redirect ;
- entrée et retour ApplyDamage ;
- writes HP, reaction type, last-attacker et accumulateur ;
- dispatch section 4 et planning section 2/3.

L’observation n’écrit pas l’état battle. Le buffer evidence est la seule sortie.
N’utilise pas un detour global qui change la cadence.

### Counter replacement

Arme le seam en combat pause **avant** le hit :

1. authentifier une party slot portant réellement Counter et un last-attacker
   qui deviendra valide au prochain hit ;
2. armer un intercept exact de
   `Battle_EnqueueSpecialAction(slot, 2, 0)` avant sa mutation, ou un seam
   équivalent prouvé ;
3. demander ensuite un seul hit ennemi ; capturer le trigger et supprimer
   exactement une écriture/préparation native ;
4. arbitrer l’entrée groupe 0 sur la copie canonique et appliquer la branche
   party section 2 ;
5. publier l’`ActionRequest` Counter G07 pending allowlisté ;
6. collecter le witness avant consommation ;
7. shutdown et restaurer la preimage pending/hook ;
8. seulement Detached, l’opérateur peut dépauser pour constater que le jeu
   continue.

La suite ne remplace pas le hit entrant ni la résolution de l’attaque Counter.
Elle prouve le trigger/scheduling/handoff G17.

Le seam doit être armé avant le hit, mais la frontière de propriété G17
commence à l’entrée interceptée de l’enqueue section 2. Le VM Turn natif qui a
préparé l’attaque source avant cette frontière est hors du remplacement G17 :
compte-le séparément comme `native_source_action_calls`, jamais comme preuve
d’un VM de réaction admis. Après la frontière, `native_reaction_vm_calls` doit
rester zéro.

Le chemin préféré observe les arguments de l’enqueue section 2 avant son body,
le supprime, puis stage uniquement la copie canonique. Si tu laisses un enqueue
group-0 host se produire avant l’intercept de préparation, il devient une plage
allowlistée distincte avec preimage, delta et restauration propres ; ce chemin
plus large doit être justifié.

## Politique live

- au plus deux processus par défaut : observation réaction si requise, puis
  Counter positive ;
- aucune observation native « pour être sûr » ;
- aucune matrice Odin/Gilga/Phoenix/Angelo par routine ;
- aucun live malformed/livelock ;
- aucune écriture group-0 par l’ISO ; le chemin préféré supprime aussi
  l’enqueue natif avant mutation, sinon l’enqueue/dequeue host authentique est
  comptabilisé et restauré dans une allowlist séparée ;
- pending G07 seulement en Session P ;
- garde random special GF active hors scénario dédié ;
- collector = verdict ; opérateur = HUD/3D/acteurs seulement ;
- anomalie visuelle = échec même si compteurs verts ;
- `Faulted` = processus terminal ;
- même DLL hashé pour les captures positives d’un candidat ;
- aucun rebuild par-dessus un DLL chargé ;
- rollback exact et survie process vérifiés séparément ;
- `BUSY` : une seule retry après une frontière de frame ;
- `INVALID_STATE` : dump ciblé, pas de retry aveugle.

## Stratégie live minimale

### Session O — discriminant réaction optionnel

Fermée par défaut : le selector Cover pré-résolution et la capture G08
existante doivent suffire à fermer SQ-G17-001.

Avant d’armer :

1. écrire les deux ordres concurrents A/B ;
2. prouver que l’A/B n’est couvert ni par le CFG ni par la capture G08 ;
3. sélectionner une party configuration avec Cover/Return Damage et un hit
   contrôlable ;
4. définir les champs/timestamps qui discriminent ;
5. garantir zéro write hors buffer evidence.

PASS O :

- au moins un événement authentique du chemin réellement ouvert ;
- ordre target/redirect ou Return Damage/HP/reaction/accumulateur fermé ;
- multi-hit capturé si le premier hit ne discrimine pas l’ordre ;
- zéro write battle par l’observer ;
- hooks restaurés, Detached, processus vivant ;
- page SQ mise à jour avec résolution exacte.

Si les preuves existantes ferment déjà A/B, documente pourquoi et n’ouvre pas
O.

### Session P — Counter replacement

Obligatoire.

Ne hardcode pas un ennemi ou un save non prouvé. Choisis après snapshot :

- un personnage avec Counter réellement équipé ;
- un ennemi qui produit un hit direct contrôlable ;
- un état sans special GF aléatoire grâce au garde bootstrap.

Déroulé opérateur :

1. demander si FF8 est fermé avant rebuild ;
2. contracts + CTest + RelWithDebInfo, puis hashes EXE/DLL/payloads ;
3. demander une seule configuration party/save précise si nécessaire ;
4. bootstrap field + canaris ;
5. demander d’entrer dans le combat choisi et de le mettre en pause ;
6. authentifier slots, abilities, section, pending et garde ;
7. démarrer la suite G17 scénario 1 jusqu’au témoin `armed` ; si l’injecteur
   attend le hit, lance-le en arrière-plan et vérifie une fois son départ ;
8. seulement après armement, demander de dépauser et laisser passer un unique
   hit ennemi, puis remettre en pause si la suite ne le fait pas ;
9. attendre capture/suppression, exécution canonique et collecte post-suite ;
10. demander « HUD, 3D et acteurs sont-ils restés normaux ? » ;
11. shutdown, capture post-shutdown et preimages ;
12. PASS/Detached : ne demande pas de quitter.

PASS P :

- trigger = hit authentique et party Counter admissible ;
- réaction section 2 staged/arbitrée en groupe 0 exactement une fois ;
- last-attacker et target mask cohérents ;
- `ActionRequest` Counter publié exactement une fois ;
- aucune seconde entrée groupe 0 pour la request Counter ;
- le VM Turn de l’attaque source est compté séparément et admis avant la
  frontière ; après celle-ci, aucune VM de réaction ni helper
  Counter/Cover/Angelo/curative natif ;
- aucun GetText/Resolve/dispatcher spécial natif ;
- `forbidden_calls == 0` ;
- `write_guard_violations == 0` hors pending allowlist documentée ;
- pending et hooks restaurés ;
- garde special GF actif ;
- runtime PASS, cleanup Detached, processus vivant ;
- aucune anomalie visuelle.

### Session S — spéciale optionnelle

Ouvre une session Regen/Doom ou special 7/8 seulement si une SQ reste
`live-required` avec A/B écrit et qu’elle bloque réellement une unité G17.
Même DLL, process frais si le précédent a Faulted ou si le garde special GF
doit changer. Sinon, conserve la couverture offline et documente le résidu.

## Garde Odin/Gilgamesh et précondition Phoenix

`FF8ISO_BOOTSTRAP_SUPPRESS_RANDOM_SPECIAL_GFS` reste actif pendant O/P.

- witness = garde installé et zéro correction inattendue ;
- aucun roll init rejoué ;
- ce garde masque Odin/Gilgamesh, **pas Phoenix** ;
- O/P exigent donc un état non létal, sans party wipe ni condition de
  déclenchement Phoenix ;
- si cette précondition ne peut pas être garantie, ajoute un seam Phoenix
  distinct, borné, réversible et attesté dans le witness ;
- un scénario dedicated ne retire le garde que dans un process frais et
  capture explicitement l’état avant/après.

Ne touche pas Angel Wing. Ne confonds pas Rinoa/Angelo avec la section AI
ennemie.

## Vérifications avant live

Sans FF8 chargé :

```powershell
python .\tools\validate_contracts.py
cmake --build --preset debug-x86
ctest --preset debug-x86 --output-on-failure
cmake --build --preset relwithdebinfo-x86
```

Vérifie :

- PE32/I386 et exports ;
- payload/schéma/snapshot/witness/legacy decode ;
- fixtures sans chemin absolu ;
- régressions G00–G16 ;
- `AiControlPolicy` defaults inchangés ;
- aucun faux neuvième blob AI ;
- aucune ABI au-dessus de runtime ;
- aucune altération des enveloppes G14/G15/G16 ;
- ownership G16 corrigé textuellement sans changement de preuve ;
- FF8 réellement fermé avant rebuild.

## Manifestes et promotion

`[promotion.G17]` avant live, `satisfied = false`, required au minimum :

- `g16-dependency-live-promoted` ;
- `u17-1-through-u17-8-offline` ;
- `single-g15-vm-and-g16-action-path` ;
- `section4-versus-section2-3-order-closed` ;
- `cover-timing-sq-g17-001-closed` ;
- `counter-actionrequest-handoff` ;
- `group0-channel-and-priority-owned` ;
- `regen-doom-no-native-dispatcher` ;
- `special-trigger-versus-g18-resolve-separated` ;
- `zero-native-reaction-vm-gettext-resolve-dispatch` ;
- `representative-positive-live-envelope` ;
- `exact-cleanup-and-process-survival`.

Optional :

- `cover-native-observe-only-on-sq-discriminant` ;
- `periodic-or-special-live-only-on-named-ab`.

`satisfied=true` seulement après l’enveloppe post-shutdown du DLL final.
Ne prétends pas que G18 est commencé.

## Documentation et mémoire Oxygen

Produis :

- `evidence/g17-reactions-static-closure-YYYY-MM-DD.md` ;
- `evidence/g17-reactions-offline-validation-YYYY-MM-DD.md` ;
- `evidence/g17-reactions-live-promotion-YYYY-MM-DD.md` ;
- enveloppes sous `evidence/battle-iso/` ;
- README, ownership-matrix, evidence-policy, ABI ledger/address map ;
- page
  `obsidian-docs/projects/final-fantasy-viii-reimaginated/references/p1-g17-reactions-validation.md` ;
- mise à jour `enemy-ai-vm`, `command-action-pipeline`,
  `timed-status-expiry`, milestones, ledger, open questions, catalogue, index.

Applique le skill `ff8-evidence-wiki-ingest` après checkpoint offline puis après
promotion live. Distingue toujours :

- instruction statique ;
- fixture authentifiée ;
- test déterministe ;
- observation native ;
- remplacement live ;
- différé G18+.

Smokes QMD finaux :

```powershell
qmd search "G17 live-promoted Counter" -c ff8-wiki -n 5 --files
qmd search "SQ-G17-001 Cover timing" -c ff8-wiki -n 5 --files
qmd search "group 0 Regen Doom" -c ff8-wiki -n 5 --files
qmd search "G16 UseAbility pending allowlist" -c ff8-wiki -n 5 --files
```

## Stop conditions

Arrête-toi si :

- identité EXE ≠ SHA supporté ;
- ordre section 4 / section 2–3 reste contradictoire sans SQ explicite ;
- largeur/storage ability G17 reste inconnue ;
- SQ-G17-001 reste ouverte après la campagne prévue ;
- une règle exige VM, GetText, Resolve, ApplyDamage, SetupCommand,
  EnqueueSpecialAction ou helper Angelo/curative natif ;
- la request Attack Counter est placée directement en groupe 0 au lieu de
  provenir du dispatch de la section 2 ;
- section 8 est inventée comme neuvième blob `.dat` ;
- G17 résout un payload GF/Angelo qui appartient à G18 ;
- RNG init est rejouée dans le scheduler runtime ;
- ABI remonte dans `core` / `application` ;
- G14/G15/G16 cessent de passer ou leurs preuves sont altérées ;
- FF8 est chargé avant rebuild ;
- runtime `Faulted`, cleanup incomplet ou régression visuelle ;
- tu es tenté d’élargir le live à chaque special sans discriminant.

Une branche bornée peut rester fail-closed avec dette nommée. Une inconnue ne
peut pas être maquillée en PASS.

## Rapport final attendu

Rapport compact :

- fichiers G17 vs G16 déjà commité ;
- couverture U17.1–U17.8 ;
- décisions section 4 / sections 2–3 / synthétiques 5–8 ;
- Counter/Cover/Return/auto-recover ;
- groupe 0, Regen/Doom et special scheduling ;
- CTest final et `validate_contracts` ;
- SHA EXE/DLL/payloads/enveloppes ;
- verdict Session O si ouverte et Session P + cleanup ;
- appels natifs et writes allowlist ;
- SQ-G17-001+ et dettes G18+ ;
- invariance des preuves G14/G15/G16 ;
- `promotion.G17` ;
- pages Oxygen + smoke QMD.
