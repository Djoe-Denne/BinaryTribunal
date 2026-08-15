# Nouveau batch — clôture G10 « status, timers and periodic actions »

## Préambule outillage — une vérification, puis travaille

Ne dépense pas de contexte à chercher ces outils dans le dépôt :

1. **RTK n’est pas un MCP.** Exécute une seule fois
   Get-Command rtk; rtk --version, puis vérifie dans
   $env:USERPROFILE\.cursor\hooks.json la commande rtk hook cursor sous
   preToolUse pour Shell. L’installation connue est RTK 0.42.4. Si le hook est
   présent et la commande fonctionne, il réécrit automatiquement les commandes
   Shell : ne préfixe jamais toi-même une commande par rtk, ne cherche pas de
   serveur RTK et passe immédiatement à la suite. Si RTK gêne une commande
   composée, sépare simplement les commandes.
2. **QMD est le moteur du vault.** Dans Codex, utilise directement
   mcp__qmd__status, mcp__qmd__query, mcp__qmd__get et
   mcp__qmd__multi_get ; dans Cursor, ce sont les outils status/query/get du
   serveur qmd exposés par GetMcpTools/CallMcpTool. Cible toujours la collection
   ff8-wiki, combine lex et vec dans le même appel, puis ne récupère que les
   sections utiles. Si le transport MCP QMD se ferme une fois, utilise
   immédiatement le CLI déjà installé :
   qmd status, qmd search ... -c ff8-wiki,
   qmd vsearch ... -c ff8-wiki et qmd get <page>:<ligne> -l <n>.
   Ne passe pas plusieurs tours à redécouvrir le serveur.
3. **Context Mode sert à comprimer les gros outputs du dépôt cible, pas à
   interroger le wiki.** Dans Codex, appelle
   mcp__context_mode__ctx_doctor ; dans Cursor, appelle ctx_doctor sur le
   serveur context-mode. Teste ensuite la racine avec ctx_execute_file sur le
   README.md absolu de
   C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated en n’affichant
   que son premier titre. Si les deux passent, utilise ctx_execute_file pour
   filtrer un gros fichier, ctx_batch_execute pour grouper commandes et
   recherches, puis ctx_search pour rappeler seulement les passages utiles.
   Pour une petite sortie ou un fichier à éditer, utilise les outils normaux.
   Le refus d’un fichier du vault re-ff8 n’est pas une panne : le vault passe
   par QMD.
4. **Invoke-IsoGroup n’existe actuellement ni comme commande PowerShell ni
   comme script du dépôt.** Ne dépense pas de tours à le rechercher ou à
   l’inventer. Utilise le générateur de payload, FFScriptLoader et les outils de
   capture existants. Si le dépôt a changé, une seule vérification
   Get-Command/rg suffit avant de conserver cette conclusion.

Arrête-toi seulement si RTK ou son hook est réellement absent, si Context Mode
refuse le dépôt d’implémentation, ou si QMD échoue à la fois par MCP et par CLI.
Donne le diagnostic exact, sans réinstallation improvisée. Après ces contrôles,
lis les AGENT(S).md applicables, vérifie le MCP IDA, puis ne refais plus la
découverte d’outillage pendant le batch.

## Loi de couches obligatoire pour G10+

Lis intégralement avant de coder :

C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\.agents\skills\implementing-iso-layer-boundary\SKILL.md

et le rappel :

C:\Users\djden\source\repos\retro-eng\re-ff8\ai-prompt\todo\_gate-layer-preamble.md

La chaîne autorisée est :

    ff8iso_core -> ff8iso_application -> ff8iso_runtime -> ff8_battle_iso
    ff8iso_abi  -> ff8iso_runtime

- core possède les règles et états sémantiques. Il ne contient ni header ABI,
  ni abi::, ni RVA, ni find_symbol, ni POD natif, ni NCOMP.
- application/BattleSession orchestre des BattleState et rapports sémantiques.
  Elle ne reçoit ni LegacyBattleImage, ni codec, ni helper hôte.
- abi contient les layouts POD et l’address map, sans inclure core.
- runtime-x86 importe/décode les POD, synchronise les champs nommés et porte
  chaque appel NCOMP dans un TemporaryGxxNcompAdapter.
- Si G10 a besoin d’un nouveau texte ou signal natif de présentation, crée au
  besoin TemporaryG10NcompAdapter avec Removal target: U14.6. Ne mets pas ce
  travail dans TemporaryG09NcompAdapter et n’y ajoute aucune règle status.
- ff8iso_core ne linke pas ff8iso_abi. Ne renomme pas runtime en infrastructure.
- validate_contracts.py doit continuer à faire respecter cette frontière.
- Si une unité ne compile qu’en faisant remonter l’ABI dans core/application,
  arrête cette voie et décode dans runtime.

Cette loi est un résultat livré par G09, pas une préférence à rediscuter.

## Dépôts

Travaille principalement dans :

C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated

Sources de recherche et vault Obsidian :

C:\Users\djden\source\repos\retro-eng\re-ff8

Intégration/injection si nécessaire :

C:\Users\djden\source\repos\FFScriptLoader

Ne fais pas de commit sans demande explicite.

## Mission

Fermer définitivement **G10 — status application, timers and periodic
actions** au-dessus de G09 live-promu.

Une Attack joueur authentique command_id 0x01 portant un payload de statut
supporté doit traverser G06 -> G07 -> G08 -> G09, résoudre son hit et son effet
HP, puis faire appliquer par G10 les bits de statut, probabilités, exclusions,
timers, mirrors et ready-state side effects exactement une fois. Ensuite, le
tick Director G10 doit posséder la cadence des timers, leurs expirations et les
actions périodiques ou terminales supportées, notamment Regen et Doom, jusqu’à
un état cohérent et observable.

Le chemin promu ne doit appeler aucun helper natif de status, timer, periodic
action, HP/status commit ou resolver appartenant au domaine remplacé. Les
présentations natives scellées peuvent rester NCOMP, mais elles ne décident ni
des bits, ni des timers, ni des HP, ni des actions forcées.

G10 étend P1 AttackSlice avec un contrat status borné. Il ne déverrouille pas
P2 à lui seul : P2 reste bloqué jusqu’à G10..G20.

## État confirmé à reprendre

- Au moment de la rédaction, le dépôt d’implémentation est propre sur main,
  HEAD 8b1e2ad13e7630caa729e9c4edfd71ef61045a9e.
- Les trois commits G09 sont 94c14e8, bec8e15 et 8b1e2ad. Le dernier impose la
  séparation core/application/ABI/runtime.
- EXE supporté SHA-256 :
  064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570.
- Candidat G09 final DLL SHA-256 :
  c1d8163e940102181a0be059208848dba0173d979f6a2a917ad347f49802e92f.
- Preuve canonique :
  C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\evidence\battle-iso\p0-g09-live-boundary-post-shutdown-2026-08-15.json
- SHA-256 de l’enveloppe :
  9e508dccda3cb8239fa1cbd4881d83cba3b2b7d61393a080d9a86b9efe441144.
- G09 protocol v2 a consommé un pending authentique
  0800000100000001, publié un TargetPlan direct 0x0008 vers le slot 3 sans RNG
  de ciblage, puis résolu une seule Attack.
- Le témoin final contient 3 draws G09 sur lane 5, curseur 138 -> 141, un
  commit, un événement, 5 ticks de présentation, relays 0x68 puis 0x70, une
  barrière réellement idle et un unlock.
- Le hit final était un absorb élémentaire de 2846 sur une cible déjà au cap
  60000 : hp_before == hp_after est attendu et ne signifie pas absence de
  commit.
- Le run a tenu 8 ticks Director, 32 pulses HUD, zéro appel domaine interdit,
  zéro violation d’allowlist, puis Detached avec HP/event acceptés conservés et
  les préimages de hooks restaurées.
- promotion.G09.satisfied = true depuis le 2026-08-15. P1 AttackSlice est un
  claim laboratoire versionné ; le P0 par défaut ne remplace pas Attack.
- G09 refuse encore tout ActionProfile dont hit_status_1 ou hit_status_2 est
  non nul. G10 doit remplacer ce refus uniquement pour les profils prouvés.
- core::DamageEventRecord est sémantique. Le packing FF8 24 octets, les IDs
  d’animation, le popup, les relays, le latch et
  BATTLE_ACTION_EXECUTION_ACTIVE appartiennent à TemporaryG09NcompAdapter.
- BattleSession ne connaît que publication/acquittement d’événement. Ne
  réintroduis aucun vocabulaire popup, animation ou opcode dans la session.
- Le léger décalage du popup G09 est une dette U14.6 acceptée. Ne détourne pas
  l’opcode d’impact 0xB2 et n’élargis pas G10 pour la corriger.
- Le wiki compilé peut encore présenter G09 comme offline si l’ingest récent
  n’a pas été exécuté. La preuve hash-bound et le dépôt actuel priment.

## Leçons G09 à transformer en garde-fous

G09 a nécessité plusieurs essais parce que la cadence HUD, l’export HP, le gel
ATB et le vrai signal d’idle de présentation n’étaient pas testés dans leur
composition complète. Ne répète pas ce schéma.

Avant toute nouvelle seam ou watcher, établis statiquement :

    writer -> durée de visibilité -> consumer/clear -> première boundary owned

Si la donnée naît et disparaît avant cette boundary, le polling de frame et la
pause manuelle sont interdits. Intercepte le writer/consumer prouvé.

Sépare dans chaque préflight :

- la préimage stock avant installation ;
- l’état attendu avec detour installé ;
- l’état idle défini par les champs réellement invalidés, sans supposer qu’un
  blob entier devient zéro.

Après un échec live, lis d’abord le witness. Ne rejoue jamais le même protocole
sans modification discriminante de seam, instrumentation ou candidat. Les
captures de diagnostic conservées ne sont pas des invitations à répéter une
matrice devenue non discriminante.

## Recherche initiale — QMD puis sections seulement

Interroge ff8-wiki avant de lire des pages entières. Pour chaque thème, combine
lex et vec dans un seul appel :

1. G10 U10 status payload probability timers periodic Regen Doom KO revive
2. DoesMentalStatusHit ApplyHitStatus ApplyAndSyncSlot mental_res RNG
3. StatusTimer Init Disable IsDisabled TickAndExpire K_MISC battle speed
4. status_1 status_2 timer 14 15 sentinel FBA9 mirrors ready flags Eject
5. special action 5 Doom special action 6 Regen group 0 HP event
6. G09 live promotion layer boundary TemporaryG09NcompAdapter P1
7. Poison periodic action AngeloOdin SpecialActionTick status cadence

Lis ensuite seulement les sections nécessaires :

1. projects/re-ff8/references/battle-iso-migration-milestones.md — G10 puis
   frontières G11, G14, G17 et P2 ;
2. projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation.md,
   en sachant que l’enveloppe finale du 15 août est plus récente ;
3. projects/re-ff8/concepts/damage-status-pipeline.md ;
4. projects/re-ff8/references/battle-formulas.md — status probability ;
5. projects/re-ff8/concepts/timed-status-expiry.md ;
6. staging/investigations/timed-status-expiry-2026-06-09.md ;
7. staging/investigations/status-bits-and-interactions.md ;
8. projects/re-ff8/concepts/atb-and-command-menu.md ;
9. projects/re-ff8/concepts/battle-lifecycle.md ;
10. projects/re-ff8/references/battle-slot-and-command-layouts.md ;
11. projects/re-ff8/concepts/command-action-pipeline.md ;
12. projects/re-ff8/skills/implementing-iso-battle-migration.md ;
13. docs/tech/systems/status_pipeline.md, battle_slot_data.md, battle_loop.md,
    damage_pipeline.md et les références status/timers associées.

Ordre d’autorité :

enveloppe finale hash-bound -> code/contrats actuels -> IDA exacte de l’EXE ->
page canonique actuelle -> staging ancien -> vieux prompt/transcript.

## Inspection minimale du dépôt avant modification

Inspecte :

- README.md, CMakeLists.txt, core/, application/, abi/ et runtime-x86/ ;
- core/attack_slice.*, battle_state.*, command_spine.* et active_tick.* ;
- application/BattleSession, spécialement les refresh G06/G07/G09 ;
- abi/layout.hpp et LegacyBattleImage ;
- runtime codecs, StateSynchronizer et TemporaryG06/G07/G09NcompAdapter ;
- contracts/include/ff8iso/launch_contract.h ;
- tests/offline/test_g09.cpp, test_runtime.cpp, test_abi.cpp et
  tests/in-process/G09.suite.toml ;
- payload, décodeur, capture, canaris, schéma et validator d’enveloppe ;
- ownership-matrix.toml, fallback-policy.toml, content-matrix.toml,
  evidence-policy.toml, port manifest, unresolved edges, call audit et host
  allowlist ;
- address-map/ff8_en_064d466b5fe2ba90/address-map.toml et abi-ledger.yaml ;
- les preuves G09 finales et les diagnostics G09 seulement si une décision de
  conception a besoin de leur chronologie.

Fais un état des lieux bref et un plan concret, puis continue sans demander de
validation intermédiaire sauf bloqueur réel ou action in-game nécessaire.

## Politique de preuve — statique d’abord

Peuvent être fermés principalement par IDA exhaustive et fixtures byte-exactes :

- layout signed 16-bit du timer bank, offsets et sentinel ;
- bit order, ordre de parcours et existing-bit behavior ;
- formules de probabilité, signedness, saturations et comparaison RNG ;
- groupes d’exclusion et de réconciliation ;
- mapping status_2 bit -> timer index -> K_MISC field ;
- cadence logique, gates, pas Haste/Slow et freeze Sleep/Stop ;
- expiration générique, Gradual Petrify et génération d’intents ;
- inventaire exhaustif des readers/writers et appels natifs interdits ;
- comportement des timer[14]/timer[15] si tous leurs xrefs sont fermés.

Le live est requis seulement pour trancher :

- valeurs K_MISC réellement chargées et durée/cadence observée ;
- attribution RNG par callsite sur un payload authentique multi-bit ou refusé ;
- moment exact des writes status/timer/mirror/ready ;
- downstream réel de Doom special action 5 ;
- profil de heal/event de Regen special action 6 ;
- interaction intégrée status -> timer -> periodic/terminal action -> idle ;
- gate finale sur le hash candidat.

Ne construis pas une matrice live décorative pour chaque bit. Une capture native
bien instrumentée doit enregistrer plusieurs faits. Les branches exhaustivement
prouvées statiquement restent des fixtures. Une seule campagne finale suffit
pour un hash candidat inchangé.

## Vérités statiques connues — à revérifier, pas à redécouvrir

- BattleSlotPod fait 0xD0 octets.
- La zone timer brute est à slot + 0x54 et occupe 0x20 octets. Elle doit être
  retapée comme 16 entiers signés 16 bits ; le uint8_t timer[0x20] actuel n’est
  qu’un stockage opaque, pas le contrat G10.
- Les entrées 0..13 correspondent aux bits status_2 0..13 :
  Sleep, Haste, Slow, Stop, Regen, Protect, Shell, Reflect, Aura, Curse, Doom,
  Invincible, Gradual Petrify et Float.
- timer[14] et timer[15] existent mais ne font pas partie des quatre helpers
  status connus. U10.4 exige leur xref closure avant promotion.
- La valeur disabled est -1111, soit 0xFBA9.
- Un status_2 reçu via DoesMentalStatusHit initialise son timer par
  4 * (SG_BATTLE_SPEED_SETTING + 1) * K_MISC.<status>_timer.
- Un statut auto/inné écrit directement n’est pas automatiquement temporisé.
  Un timer disabled peut agir comme persistence guard lors de certains clears.
- Le tick status est Director-side, après transfer/arbitration/résolution, pas
  un des quatre pulses HUD/ATB.
- Il est bloqué au minimum par result terminal, action execution et action latch.
  Ferme le gate complet avant codage.
- Le pas est 2 normalement, 3 sous Haste, 1 sous Slow ; Slow gagne si les deux
  bits sont présents.
- Sleep ne laisse avancer que son timer ; Stop ne laisse avancer que son timer ;
  le cas Sleep+Stop a une branche particulière à reproduire.
- Regen action 6 est enfilée à une frontière de 60 unités pendant le countdown.
- Doom expire en désactivant timer[10], enfilant action spéciale 5 dans le
  groupe 0 et retirant le bit Doom.
- Gradual Petrify promeut status_1 Petrify avant la sync d’expiration.
- status_1 bits 0..6 et status_2 bits 8..39 utilisent mental_res[40] ; l’index 7
  doit rester explicitement traité selon l’IDA.
- La probabilité ordinaire connue est :
  P = enabler + attacker_stat/4 - defender_stat/4 - mental_res[index].
  mental_res >= 200 est une immunité ; P <= 0 refuse ; enabler < 250 tire et
  réussit si saturate_byte(255*P/100) >= rand8 ; 250..254 auto-passent si P>0 ;
  255 bypass la branche résistance/RNG mais pas les exclusions.
- Les groupes status_2 0xE et 0x300 ont une réconciliation spéciale.
- Le gate 0x180800 bloque plusieurs effets ; le payload bypass 0x04000000 doit
  être compris et retiré au bon moment.
- Les transitions Berserk, Confuse et Angel Wing peuvent invalider les ready
  flags. Death/Petrify/Sleep/Stop ont aussi des side effects de disponibilité.
- Les copies status_1_copy/status_2_copy ne sont pas toujours de simples copies
  pour les statuts innés des monstres.

Ces points sont des ancres. Toute contradiction avec l’EXE exact doit être
documentée et corrigée dans les sources de vérité.

## Ambiguïtés bloquantes

1. **Timer ABI.** Retype BattleSlotPod timer[0x20] en int16_t[16] sans modifier
   sizeof/offsetof. Ajoute static_assert offset 0x54, taille 0x20 et slot 0xD0.
2. **Canonical state.** SlotState n’importe encore ni mental_res[40] ni les
   timers. Ajoute les champs sémantiques nécessaires sans pointer natif.
3. **K_MISC.** Ferme le layout, l’adresse, les quatorze durées et la provenance
   de SG_BATTLE_SPEED_SETTING. Le core reçoit un StatusTimerConfig décodé.
4. **Ordre de bits/RNG.** Prouve ordre status_1 puis status_2, skip des bits déjà
   présents, exclusions avant/après draw et nombre de draws d’un payload multi-bit.
5. **Stat family.** Ferme le choix STR/VIT versus MAG/SPR par famille. Ne laisse
   pas G10 lire command_id ou une table native pour choisir implicitement.
6. **Exclusions.** Death/Zombie, Zombie/Doom, Angel Wing, Float/FLY, innate
   Zombie, Petrify/invuln, bypass 0x04000000 et groupes 0xE/0x300 doivent avoir
   une priorité exacte.
7. **Apply/sync.** Ferme toutes les écritures de BattleStatus_ApplyAndSyncSlot :
   bits, timers, ready flags, ATB, exec queue, GF summon, Eject, crisis et
   mirrors. Sépare règles G10 et intents pour G14/G17/lifecycle.
8. **Timer loop.** Prouve si un appel décrémente une ou plusieurs entrées par
   slot, l’ordre slot/index, les gates exacts et la cadence réelle.
9. **timer[14]/[15].** Audit exhaustif readers/writers. S’ils ne sont pas des
   timers status G10, préserve-les comme état opaque avec contrat explicite.
10. **Poison et périodiques.** Le titre G10 couvre periodic actions, mais le wiki
    ne ferme que Regen/Doom. Audite Poison et AngeloOdin_SpecialActionTick ;
    ne suppose pas que Regen est le seul periodic HP effect.
11. **Regen action 6.** Ferme le CurrentAction spécial, son heal profile,
    event, HP clamp, cadence, target et exactement-once.
12. **Doom action 5.** Ferme par IDA puis une capture discriminante si nécessaire
    le record terminal : Death bit, lethal HP, event, latch et cleanup.
13. **KO/revive/Eject.** Distingue mutation de statut G10, commit HP G09,
    ReactionIntent/RewardIntent G17+, et cleanup/visibility hors scope. Aucun
    helper AI/reward natif ne doit être appelé.
14. **Application transactionnelle.** Détermine ce qui commit avec l’Attack
    G09 : HP, status, timers, mirrors, ready state et event doivent être
    cohérents, sans double commit ni rollback d’un effet accepté au shutdown.
15. **Présentation.** Les textes d’expiration et popups sont NCOMP bornés. Ils
    ne doivent jamais rappeler sub_506690, ApplyHitStatus, ApplyDamageOrHeal ou
    un autre helper mêlant présentation et domaine.

Tout point non fermé reste blocked-evidence et désactive le scénario concerné.
Un test offline inventé ne prouve ni ABI, ni cadence, ni provenance native.

## Ancres IDA

Revérifie sur l’EXE hashé :

- StatusTimer_InitForBitFromKernelMisc : 0x4832F0
- StatusTimer_DisableForBit : 0x483340
- StatusTimer_IsDisabledForBit : 0x483370
- Status_TickAndExpire : 0x483470
- BattleStatus_ApplyHitStatus : 0x4914E0
- DoesMentalStatusHit : 0x48F9F0
- BattleStatus_CanApplyHitStatus : 0x492AC0
- BattleStatus_ApplyAndSyncSlot : 0x493840
- BattleStatus_UpdateSlotStatusCopy : 0x47E2D0
- Battle_EnqueueSpecialAction : 0x484720
- BattleArbitration_SelectNextAction : 0x485460
- BattleAction_ResolveSpecialActionAndUpdateDamage : 0x485160
- BattleAction_ResolveAndApplyDamage : 0x48FE20
- Battle_ApplyDamageOrHeal : 0x494410
- checkTargetHasStatus : 0x48A900
- FFBattleDirector_battleLoop : RVA 0x7CCB0
- slot array : 0x1D27B10, stride 0xD0

Retrouve par xrefs, sans analogie :

- K_MISC et ses quatorze champs de durée ;
- SG_BATTLE_SPEED_SETTING ;
- RelatedToStatus1And2 ;
- BattleStatus_ExpirePetrifyingToPetrify ;
- les helpers party/non-party après expiration ;
- les resets Eject/Death/GF summon ;
- les consumers de timer[14]/[15] ;
- le resolver exact des actions spéciales 5 et 6 ;
- toute voie Poison/autre periodic action ;
- les writers concurrents de status banks, copies, timers et ready flags.

Pour chaque fonction nécessaire : start/end, tous les exits, désassemblage,
pseudocode, xrefs, ABI, pile/registres, préimage, globals lus/écrits, callers et
writers concurrents. Pousse dans l’IDB les noms, types et commentaires prouvés.

## Périmètre d’implémentation

Implémente toutes les unités roadmap :

- **U10.1 Status payload** : représentation pointer-free des deux banks,
  bit order, existing bit, exclusions et réconciliation.
- **U10.2 Status probability** : résistance mentale, immunité, termes
  attacker/defender, RNG, auto-pass et rapport par bit.
- **U10.3 Timer initialization** : StatusTimerConfig, seed exact, sentinel,
  statuts permanents versus temporisés et timers disabled.
- **U10.4 Timer cadence** : tick Director, gates, slot/index order, Haste/Slow,
  Sleep/Stop freeze, timer[14]/[15] closure.
- **U10.5 Expiration side effects** : clear ordering, Gradual Petrify, mirrors,
  ready state, crisis et événements sémantiques.
- **U10.6 Regen** : scheduling action 6, groupe 0, heal/event/HP, exactly-once.
- **U10.7 Doom** : expiration, action 5, KO/event/latch et interaction cleanup.
- **U10.8 KO/revive status interactions** : Death, Petrify, Zombie, Eject,
  résurrection et intents hors scope.

Types canoniques suggérés :

- StatusPayload et StatusBitRef ;
- StatusApplyContext, StatusApplyResult et StatusBitOutcome ;
- StatusTimerBank avec 16 int16_t et StatusTimerConfig ;
- StatusTickInput, StatusTickReport et StatusTransition ;
- PeriodicActionIntent / TerminalActionIntent ;
- StatusTransaction avec phase precommit/committed/published/completed.

Les noms exacts sont libres. Tous les types core sont déterministes,
pointer-free et indépendants de FF8.

## Architecture attendue

### core

- Ajoute status_application.* et status_timers.* ou une séparation équivalente.
- Étends SlotState avec mental_res et timer bank sémantiques.
- Le service reçoit explicitement le domaine de stats, le payload, la config et
  RngState ; il ne lit ni K_MISC, ni HIT_*, ni globals.
- Il produit des transitions et intents. Il n’encode aucun record natif.
- Regen/Doom réutilisent les primitives HP/event sémantiques de G09 sans
  appeler le resolver G09 par un raccourci natif.

### application

- BattleSession orchestre apply, tick, queue intents et acknowledgement.
- Intègre les actions 5/6 au CommandSpine G07 avec sequence IDs et exactly-once.
- Ne connaît ni RVA, ni timer POD, ni opcode NCOMP, ni texte.
- Garde séparés le status transaction et AttackTransaction tout en garantissant
  leur commit atomique lorsqu’ils appartiennent au même hit.

### abi

- Retype le timer POD en int16_t[16] avec static_assert exact.
- Ajoute seulement les POD/adresses réellement nécessaires.
- Aucun include core.

### runtime-x86

- Les codecs importent/exportent mental_res, timers et config vers les types
  sémantiques.
- StateSynchronizer écrit seulement les champs nommés autorisés.
- Les imports de pointeurs monster/kernel deviennent des faits sémantiques
  validés ; aucun pointeur ne franchit runtime.
- Si un NCOMP status est requis, TemporaryG10NcompAdapter contient uniquement
  texte/signal/presentation et indique Removal target: U14.6.
- Chaque find_symbol G10 NCOMP n’apparaît que dans cet adapter.

## Ownership et cadence G06–G10

Réutilise la seam authentifiée BattlePendingAction_Write et le gateway Director.
N’ajoute pas un detour sur chaque helper status si le Director remplacé rend ces
helpers inatteignables.

Pendant une Attack status supportée :

1. capture le pending authentique et l’ActionProfile avec provenance ;
2. importe slots, mental_res, timers, config, RNG, queues, latches et événements ;
3. capture une préimage transactionnelle nommée ;
4. active G06+G07+G08+G09+G10 atomiquement ;
5. G08 publie un plan direct sans RNG ;
6. G09 résout hit/crit/variance et HP ;
7. G10 applique le payload seulement si la branche native l’aurait admis ;
8. commit HP/status/timers/mirrors/ready/event exactement une fois ;
9. TemporaryG09NcompAdapter présente l’Attack et attend 0x70 idle ;
10. unlock et handback seulement lorsque toutes les transactions sont cohérentes.

Pour le tick de timers :

- exactement un tick status par Director actif admis, jamais quatre par frame ;
- aucun tick sous pause, result terminal, action execution ou action latch selon
  le gate natif exact ;
- aucun reroll status pendant hold/presentation ;
- Regen/Doom émettent une intention groupe 0, puis G07 arbitre normalement ;
- une action forcée groupe 0 ne doit pas être bloquée par Sleep/Stop ;
- aucun helper status/timer/special/HP natif ne doit s’exécuter ;
- drift, extra draw, double seed, double expiration, double enqueue, overflow,
  sequence mismatch ou writer inconnu provoque fail-stop.

Après un commit accepté, le shutdown conserve les mutations légitimes et
restaure seulement hooks/état temporaire. Avant commit, rollback byte-exact.

## Hors périmètre strict

- G11 Magic, y compris utiliser un sort comme raccourci de production live.
- G12 Item, G13 Draw et leurs transactions de stock/inventaire.
- G14 scheduler/callback ownership et synchronisation parfaite du popup.
- G17 Cover, counter, Return Damage, Angelo et EnemyAI_DispatchSection.
- Drain/Charged tant qu’un jalon explicite ne leur attribue pas un owner.
- Rewards, mug/card/AP, scripts de mort et terminal battle flow.
- AI, GF, Limits et familles physiques non certifiées.
- Remplacement graphique ou correction du timing cosmétique G09.

Un StatusPresentationEvent n’autorise pas le domaine à appeler une fonction
native de texte ou de popup.

## Tests offline à ajouter

Couvre au minimum :

1. BattleSlotPod timer offset/size/signedness et round-trip codec ;
2. SlotState mental_res[40], StatusTimerBank[16], sentinel et pointer-free ;
3. mapping bits/index, index 7, payload vide, bit existant et multi-bit order ;
4. mental_res 199/200, P <= 0, chance 0/1/255, comparaison inclusive ;
5. enabler 249/250/254/255 et draw/no-draw exact ;
6. STR/VIT et MAG/SPR contexts, VIT/SPR-zero si prouvés ;
7. Death/Zombie, Zombie/Doom, Angel Wing, Float/FLY, innate flags et bypass ;
8. réconciliation Haste/Slow/Stop et Aura/Curse ;
9. timer seed avec battle speeds et K_MISC boundaries, overflow fixed-width ;
10. permanents auto/innés, disabled persistence guard et clear explicite ;
11. cadence normal/Haste/Slow, Sleep, Stop et Sleep+Stop ;
12. timer[14]/[15] preservation/ownership selon xref closure ;
13. expiry générique, Protect/Shell/Reflect events, Gradual Petrify ;
14. ready/menu flags, ATB reset, mirrors party/enemy et crisis side effects ;
15. Regen boundary 60, one enqueue, group 0, heal/event/HP and no duplicate ;
16. Doom expiry, forced action 5, Death/HP/event, group-0 exemption and cleanup ;
17. Poison/other periodic census and behavior or explicit fail-closed coverage ;
18. KO/revive/Petrify/Zombie/Eject conflict matrix ;
19. atomic Attack+status commit and precommit rollback ;
20. accepted commit retained across shutdown, no double consume ;
21. Director cadence and no status tick during G09 presentation ;
22. host drift, wrong sequence, wrong timer sentinel, extra RNG, overflow,
    forbidden call/write, rollback failure and fail-stop ;
23. legacy wire compatibility G00–G09 when witness G10 is absent ;
24. regressions G06/G07/G08/G09 on the new DLL hash ;
25. layer guards: no ABI/NCOMP/find_symbol in core/application and symbol
    exclusivity for any TemporaryG10NcompAdapter.

Étiquette chaque fixture static reconstruction, native capture ou synthetic
reversible fixture. Une fixture injectée dans FF8 n’est pas une observation
native.

Pendant le développement, exécute les tests ciblés. Une fois le candidat stable,
exécute une gate complète :

    python .\tools\validate_contracts.py
    cmake --preset debug-x86
    cmake --build --preset debug-x86 --parallel
    ctest --preset debug-x86

Valide aussi PE32/I386, FFScriptLoader, payload G10, suite TOML, schéma,
décodeur/capture, canaris, rollback et anciens groupes. Ne répète la gate
complète qu’après une modification réelle ou un échec.

## Contrats, ABI et preuve

Ajoute une extension backward-compatible :

- flag de suite G10, protocol/scenario versionnés ;
- FF8IsoG10StatusWitness pointer-free, entièrement zéro hors G10 ;
- payload, résultats par bit, draws et attribution RNG ;
- status banks/copies/timers avant/après ;
- K_MISC durations et battle-speed input ;
- timer ticks/gates/decrements/expirations ;
- periodic/terminal intents, group-0 enqueues, resolutions et acks ;
- HP/event/KO/revive/Eject outcomes ;
- transaction/commit IDs, presentation/idle/unlock et rollback flags ;
- call/write audit et named-field allowlist.

Étends :

- tests/in-process/G10.suite.toml ;
- launch contract, snapshot/schema et lecteurs legacy ;
- make_suite_payload.py, decode_runtime_evidence.py,
  capture_runtime_evidence.py et validate_evidence_envelope.py ;
- canaris de tous les hooks réellement installés ;
- ownership matrix, fallback policy, content matrix, evidence policy ;
- port manifest, unresolved edges, call audit et host allowlist ;
- address map et ABI ledger ;
- README, CMake et docs techniques.

Le validator recalcule le verdict depuis les faits bruts. Un PASS fourni par le
runtime n’est jamais suffisant.

L’allowlist nomme chaque champ : status_1/status_2, copies, timer entries,
ready bits, HP/event et queues exactes. N’autorise jamais les onze slots entiers,
les 0x20 octets timer bruts ou un cluster HIT_* par commodité.

## Captures natives minimales

Avant activation replacement, ferme avec IDA et une capture consolidée :

- un payload Attack Status-Atk authentique si la configuration du joueur le
  permet : bits, enabler, stats, mental_res, RNG, status/timer/mirror writes ;
- la cadence timer native et les gates dans plusieurs frames d’une seule trace ;
- K_MISC réel et battle speed ;
- Regen action 6 enqueue -> CurrentAction -> heal/event ;
- Doom action 5 enqueue -> CurrentAction -> terminal commit ;
- Poison/autre periodic uniquement si le xref census le rend G10.

Si l’utilisateur ne possède pas le junction/status requis, demande une action
précise ou utilise une fixture mémoire minimale, réversible et explicitement
étiquetée. Ne la présente pas comme authentic gameplay.

Les captures difficiles doivent être combinées. Ne redemande pas une capture
si l’IDA exhaustive ferme déjà la branche à haute confiance.

Ne laisse jamais IDA attaché au run final de promotion.

## Interaction avec l’utilisateur

Sois interactif dès qu’un état in-game est nécessaire. Demande un geste court :

- « équipe Status-Atk avec le statut indiqué, puis reste dans l’Open World » ;
- « entre dans un combat contre cet ennemi, attends idle, puis Attack une fois » ;
- « laisse le combat tourner sans autre commande jusqu’à l’expiration » ;
- « confirme si l’icône/texte, le tick Regen/Doom et le retour idle sont visibles ».

Avant chaque geste, indique ce qui est armé, ce qui sera observé et ce qu’il ne
faut pas faire. N’enchaîne jamais deux variantes sans lire le witness de la
première.

## Validation live finale

Ne lance aucun run de promotion avant :

- gate offline verte ;
- layer guards verts ;
- ABI timer/K_MISC fermée ;
- writers/callers exhaustifs ;
- Regen/Doom/Poison scope décidé ;
- rollback/commit protocol validé ;
- candidat DLL hashé.

Utilise un FF8 frais, IDA détaché, bootstrap depuis Open World/menu et une suite
G10 versionnée.

La campagne finale doit être compacte :

1. une Attack authentique à payload supporté pour prouver apply success ou
   failure, RNG et seed ;
2. une matrice in-process bornée pour immunity/conflicts/expiry/Regen/Doom/
   KO-revive, en combinant les fixtures réversibles dans le même processus et
   le même hash ;
3. shutdown final avec état gameplay accepté conservé et hooks restaurés.

Le gate G10 passe seulement si :

- pending Attack 0x01 traverse G07/G08/G09 une fois ;
- G09 garde son exact HP/event/RNG contract ;
- G10 parcourt les bits et consomme les draws dans l’ordre prouvé ;
- success/failure/immunity/existing-bit et exclusions sont exacts ;
- les timers sont seeded, décrémentés, gelés et expirés exactement ;
- mirrors et ready flags sont cohérents ;
- Regen et Doom utilisent une action groupe 0 pointer-free, exactement une fois ;
- HP/event/Death/revive/Eject outcomes supportés sont atomiques ;
- aucun helper status/timer/periodic/HP/resolver/AI/reward natif ne s’exécute ;
- aucun write hors allowlist, fallback, drift, overflow ou double commit ;
- G06 conserve sa cadence, G07/G08/G09 ne doublent aucune étape ;
- présentation NCOMP reste visible et n’acquiert aucune autorité status ;
- latch/current action/status transactions retournent idle ;
- shutdown conserve les effets acceptés, restaure les hooks et laisse FF8 vivant.

Une scène noire, un status sans timer attendu, un timer qui avance quatre fois
par frame, un extra draw, une action Regen/Doom doublée, un actor lock ou une
réaction native inattendue est un échec.

Une seule campagne finale suffit par hash. Rejoue seulement après changement du
candidat ou preuve invalide/ambiguë.

## Livrables et clôture

Livre :

- services core status/timers/periodic et types sémantiques ;
- orchestration BattleSession sans ABI ;
- ABI timer/K_MISC, codecs runtime et synchronizer nommé ;
- éventuel TemporaryG10NcompAdapter limité à la présentation ;
- address map, ABI ledger, xrefs/writers, closure report, audit et allowlist ;
- contrats, manifests, payload, suite, outils, schéma, tests et CMake ;
- captures natives minimales et enveloppe finale hash-bound EXE/DLL ;
- comparaison G09 -> G10 : nouvelles ranges, RNG, cadence, commit, intents,
  présentation, rollback et cas encore fail-closed ;
- README, matrices, roadmap et docs status/timers ;
- décision explicite sur l’extension P1 et maintien du verrou P2.

Après preuve finale, utilise le skill ff8-evidence-wiki-ingest : lis son
SKILL.md, ingère les preuves sans modifier les sources brutes, mets à jour le
manifest et recompile l’index QMD ff8-wiki. Vérifie que QMD retrouve la clôture
G10, que G09 est bien live-promu, que P1 décrit exactement le nouveau status
slice et que G11 est le prochain jalon sans être présenté comme implémenté.

Ne déclare G10 fermé que si l’application, les timers et les actions
périodiques/terminales supportées sont toutes replacement-owned, exactes,
observables, transactionnelles et idle sans appel domaine natif. Si K_MISC,
timer[14]/[15], Poison, Regen, Doom, Eject, writers concurrents ou cadence
restent inconnus, documente le bloqueur, garde G10 fail-closed et ne transforme
pas une icône visible ou un test offline en preuve de clôture.
