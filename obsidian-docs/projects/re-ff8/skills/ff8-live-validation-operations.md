---
title: FF8 Live Validation Operations
category: skills
tags: [ff8, battle-system, reverse-engineering, testing, skill]
aliases: [FF8 IDA MCP and injection workflow, FF8 live operations]
sources:
  - agent:cursor-session P0.6 implementation and live-validation session (2026-07-22)
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tools/capture_live_canaries.py
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tools/capture_runtime_evidence.py
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/p0-7-offline-validation-2026-07-23.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-atb-pilot-validation-2026-07-24.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-atb-matrix-validation-2026-07-24.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g07-command-spine-closure-live-validation-2026-08-09.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/9bf843ec-4ce7-4dce-b4bc-3feaa1309baa/9bf843ec-4ce7-4dce-b4bc-3feaa1309baa.jsonl
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g09-attack-slice-offline-validation-2026-08-14.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g09-live-boundary-post-shutdown-2026-08-15.json
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/59caf6fc-31bb-4f69-a06f-a111b96a1d8e/59caf6fc-31bb-4f69-a06f-a111b96a1d8e.jsonl
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g10-status-timers-live-validation-2026-08-15.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g10-live-boundary-post-shutdown-2026-08-15.json
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/fc8b950c-43c1-4c51-9634-6203a75cf3c3/fc8b950c-43c1-4c51-9634-6203a75cf3c3.jsonl
summary: Règles transversales des tests FF8 live : build x86, bootstrap, watches automatiques, preuves runtime, shutdown sûr et rollback exact.
relationships:
  - target: "[[projects/re-ff8/skills/implementing-iso-battle-migration]]"
    type: implements
  - target: "[[projects/re-ff8/skills/battle-re-verification]]"
    type: related_to
provenance:
  extracted: 0.91
  inferred: 0.07
  ambiguous: 0.02
base_confidence: 0.83
lifecycle: draft
lifecycle_changed: "2026-07-22T18:35:00+02:00"
tier: supporting
created: 2026-07-22T18:35:00+02:00
updated: 2026-08-15T16:20:00+02:00
---

# FF8 Live Validation Operations

Cette procédure s’applique à **tout** batch qui touche un processus
`FF8_EN.exe` live : P0.7, G06 et les groupes futurs. Les détails historiques
P0.6 sont dans
[[projects/final-fantasy-viii-reimaginated/skills/p0-6-live-validation-playbook]];
la matrice G05 v2 est dans
[[projects/final-fantasy-viii-reimaginated/skills/p0-7-live-validation-playbook]].

## Baseline Windows

- Dans Windows PowerShell, ne pas utiliser `&&`. Arrêter explicitement après
  chaque commande avec `$LASTEXITCODE`.
- Reimaginated utilise les presets `debug-x86` ou `relwithdebinfo-x86`.
- FFScriptLoader utilise `default-x32` pour CTest.
- Toujours lancer `validate_contracts`, build Win32, CTest et validation PE32
  du DLL avant un live run.

## ABI sous IDA, puis injection

1. Attacher IDA à un processus FF8 sans DLL de remplacement.
2. Par le MCP `py_eval`, poser les breakpoints, relever registres/EFLAGS/ESP
   et 64 octets de pile avec `ida_bytes.get_bytes`.
3. Déduire le retour dynamique depuis `[ESP]`; lire `[ESP+4]` pour un premier
   argument stack.
4. Garder les objets IDAPython persistants dans `__main__`.
5. Supprimer tous les breakpoints et détacher IDA avant l’injection.
6. Injecter uniquement depuis Open World/menu, après canari de préimage.

Sur chaque nouveau processus FF8, invoquer d’abord `FF8Iso_Bootstrap` pour
installer les seams d’observation, puis armer la suite. Une injection directe
de payload de suite peut échouer avec `remote-bootstrap-failed (win32=1)` si le
runtime n’a pas encore été initialisé.

`ida_dbg.read_memory` n’est pas disponible dans le pont employé. Éviter aussi
`read_dbg_memory`, qui requiert un buffer SWIG `void*`; `ida_bytes.get_bytes`
est la lecture simple et fiable quand le débogueur est arrêté.

## Cycle d’un candidat DLL

- Enregistrer le SHA-256 du DLL pour chaque preuve.
- Un `LNK1168` indique généralement un DLL chargé par FF8 : terminer le
  scénario, redémarrer FF8, reconstruire et traiter le nouveau hash comme un
  candidat distinct.
- Ne pas fusionner les résultats de deux hashes dans une même promotion.
- Après `Faulted`, considérer ce runtime terminal même si le processus survit.
  Un nouvel essai utilise un processus FF8 neuf.

## Watches automatiques pour les gates courts

Les événements ATB, pause, GF, action et escape sont trop brefs pour dépendre
d’un timing manuel. Armer un watch roulant avant l’action utilisateur, avec un
budget compatible avec la durée réelle du scénario, puis laisser le runtime
capturer automatiquement le premier gate typé.

- Capturer état et hashes avant/après, drapeaux de gate, compteur de frames et
  type de handback.
- Choisir un hook qui existe encore pendant le gate. Une pause supprime
  `BattleATB_TickAndReady`; son détecteur doit donc vivre sur `FFBattleModule`.
- Pour une GF fréquemment interrompue par les ennemis, employer un budget long
  (`18000` frames pour P0.8-D) et observer les trois timers sparse.
- Si les ATB de la party sont déjà pleines pendant un test d’escape, comparer
  les 11 slots afin que l’ATB ennemie cachée fournisse un témoin dynamique.
- Une capture mêlant plusieurs causes n’est pas promotionnelle : par exemple,
  escape plus action lock doit être rejouée en état idle pour isoler escape.

Un signal utilisateur (« invocation lancée », « pause retirée », « fuite
commencée ») sert à coordonner le scénario, jamais à décider le verdict.

## Autorité des preuves

Le verdict provient du runtime, pas d’un texte demandé au collecteur :

- état runtime non-`Faulted` pour une preuve positive ;
- canaris de registres/pile ;
- audit d’appels ;
- violations d’allowlist ;
- diff ou hash mémoire ;
- préimage restaurée après shutdown/fault ;
- hash EXE/DLL et carte d’adresses.

Une assertion utilisateur `pass` est invalide si l’export runtime démontre
`Faulted`, une écriture interdite ou un appel interdit.

Pour P0.7, l’export doit aussi identifier le protocole/scénario, le budget et
handback Director, phase/latches, trace exacte et témoin RNG. Une campagne
positive doit capturer le handback après le dernier tick replacement ; une
faute G05 post-engagement est nécessairement une preuve négative.

Pour P0.8, distinguer les handbacks ATB et frame, enregistrer les hashes ATB et
timers GF avant/après, puis valider chaque enveloppe contre son schéma JSON.
Le handback natif unique est une concession de preuve P0 ; il devient interdit
dès qu’un profil revendique la frontière battle-owned correspondante.

Pour G07, une preuve machine verte ne suffit pas à valider la présentation
NCOMP. Le premier run `4 ticks / 16 HUD` a restauré tous les octets mais a
produit un écran entièrement noir pendant la fenêtre de remplacement. Le
watch doit donc compter un pump `Battle_RunFileLoadingCallbacks` et un appel
BdLink par tick, puis attendre l’observation opérateur du HUD et de la 3D avant
le shutdown final. Une régression visuelle explicite transforme l’enveloppe en
preuve négative, même si les compteurs mémoire passent.

### G09 : trois horloges, une seule promotion

Une commande live doit fermer trois horloges distinctes : cadence hôte
(quatre HUD autour d’un Director), transaction domaine (plan, commit,
événement exactement une fois) et présentation (acteur/caméra/BdLink revenus
idle). Un `PASS` du calcul n’autorise pas la promotion si l’animation ne part
pas ou si l’acteur reste verrouillé.

- Capturer le premier invariant qui faute avant de corriger le symptôme noir.
  Durant G09, export HP au mauvais moment, export après rollback et dérive ATB
  ont produit des noirs visuellement identiques mais des causes différentes.
- Ne jamais interpréter une file relay vide comme un idle complet. Relay
  `0x68` lance la séquence; relay `0x70` constitue la barrière acteur, caméra et
  BdLink avant unlock.
- La consommation du pending doit emporter la consommation du tour (ATB et
  ready bit), puis `BATTLE_ACTION_EXECUTION_ACTIVE` doit geler la progression
  pendant la présentation, sans être posé avant la fin de la fenêtre G07.
- Le popup natif est déclenché par opcode `0xB2` dans chaque script d’arme.
  Un délai fixe ne prouve donc pas le timing ISO; accepter explicitement la
  dette cosmétique ou la fermer dans l’adaptateur de présentation U14.6.
- En faute post-engagement, rendre HUD/Director au natif seulement selon la
  politique de handback auditée; ne pas conserver silencieusement des seams
  ISO qui transforment un domaine déjà commité en écran noir terminal.

### G10 : Slow en RAM n’est pas l’icône HUD

G10 réutilise les trois horloges G09, plus un dump RAM du bit et du timer
avant/après apply. Un skip `apply_applied=0` avec bit déjà présent n’est pas
un fail d’apply : c’est le contrat natif « existing bit, no RNG ». Un poke
`timer[2]=1` pour forcer l’expiry native n’est pas la preuve d’apply.

- Shutdown **in-battle** est admis pour G10 quand les cinq preimages de hooks
  restaurent (`0x1ff`) et que Slow+timer restent en RAM.
- L’absence d’icône Slow alors que `status_2=4` n’invalide pas le domaine.
  List 117 / `TemporaryG10NcompAdapter` est une dette U14.6, pas un gate G10.
- Pause gèle le tick timer : un timer mis à 1 n’expire pas tant que le combat
  reste en pause.

## Fin de campagne

Après les scénarios, attendre le rollback et le désarmement à la frontière de
frame. Pour un scénario long, revenir hors combat et attendre `Ready`; pour un
gate borné comme G07 ou G10, un shutdown en combat est admis seulement après que les
témoins confirment ownership désarmé et hashes restaurés. Appeler ensuite
explicitement `FF8Iso_Shutdown`, puis vérifier :

- préimage `FFBattleModule` restaurée byte-for-byte ;
- aucun seam restant ;
- processus FF8 toujours vivant ;
- enveloppes JSON conformes au schéma ;
- régression offline cumulative toujours verte.

Ne jamais reconstruire par-dessus un DLL encore chargé. Si `LNK1168` survient,
fermer FF8, reconstruire et recommencer avec le nouveau hash candidat.

## Related

- [[projects/re-ff8/skills/implementing-iso-battle-migration]]
- [[projects/re-ff8/skills/battle-re-verification]]
- [[projects/final-fantasy-viii-reimaginated/skills/p0-6-live-validation-playbook]]
- [[projects/final-fantasy-viii-reimaginated/skills/p0-7-live-validation-playbook]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-c-g06-atb-pilot-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g07-command-spine-validation]]
