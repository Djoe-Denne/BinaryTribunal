---
title: P0.6 Live Validation Playbook
category: skills
tags: [ff8, battle-system, reverse-engineering, testing, skill]
aliases: [IDA MCP P0.6 workflow, FF8 live validation debugging]
sources:
  - agent:cursor-session P0.6 implementation and live-validation session (2026-07-22)
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tools/capture_runtime_evidence.py
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g03-strict-validation-2026-07-22.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g05-one-tick-validation-2026-07-22.md
summary: Procédure fiable pour construire, déboguer sous IDA, injecter et prouver les jalons P0.6 sans confondre les états offline, live, Faulted et restaurés.
relationships:
  - target: "[[projects/re-ff8/skills/implementing-iso-battle-migration]]"
    type: implements
  - target: "[[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]"
    type: related_to
provenance:
  extracted: 0.90
  inferred: 0.08
  ambiguous: 0.02
base_confidence: 0.84
lifecycle: draft
lifecycle_changed: "2026-07-22T18:25:00+02:00"
tier: supporting
created: 2026-07-22T18:25:00+02:00
updated: 2026-07-22T18:25:00+02:00
---

# P0.6 Live Validation Playbook

Cette procédure transforme les difficultés rencontrées pendant P0.6 en règles
réutilisables pour [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]].
Elle complète [[projects/re-ff8/skills/implementing-iso-battle-migration]] et
ne remplace pas ses gates d’ownership.

## 1. Baseline Windows

Sous Windows PowerShell 5, `&&` n’est pas un séparateur fiable. Chaîner les
étapes avec une sortie explicite :

```powershell
python .\tools\validate_contracts.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
cmake --build --preset debug-x86 --parallel
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
ctest --preset debug-x86
```

Les presets sont propres à chaque dépôt :

- Reimaginated : `debug-x86` ou `relwithdebinfo-x86`.
- FFScriptLoader : `default-x32` pour CTest ; `debug-x32` est un preset de
  build/configuration, pas un preset de test.

Toujours valider le DLL avec `app_injector validate <dll>` avant injection.

> [!warning] DLL verrouillé
> `LNK1168` signifie normalement que `FF8_EN.exe` maintient le DLL chargé.
> Ne pas reconstruire sur l’image en cours : terminer le scénario, redémarrer
> FF8, puis reconstruire et noter le nouveau SHA-256. Un hash différent exige
> de distinguer les preuves live des deux candidats.

## 2. IDA : captures ABI sans DLL

IDA reste attachée seulement pendant la recherche ABI. Aucune DLL
Reimaginated ne doit être chargée dans ce processus.

Le MCP IDA possède `py_eval`, même si les outils statiques ne le rendent pas
évident. Découvrir son schéma avec `GetMcpTools`, puis exécuter IDAPython avec
`py_eval`.

Pour une fonction cible :

1. poser le breakpoint d’entrée avec `ida_dbg.add_bpt(ea)` ;
2. à l’arrêt, lire EAX/ECX/EDX/EBX/ESI/EDI/EBP/ESP/EFLAGS ;
3. lire 64 octets depuis ESP avec `ida_bytes.get_bytes(esp, 64)` ;
4. lire l’adresse de retour à `[ESP]`, poser un breakpoint temporaire à cette
   adresse, puis reprendre ;
5. capturer le même contexte au retour et normaliser la pile en retirant les
   quatre octets de l’adresse de retour consommée ;
6. pour un argument `__cdecl`, relever `[ESP+4]` à l’entrée ;
7. supprimer tous les breakpoints et détacher IDA avant injection :
   `ida_dbg.request_detach_process(); ida_dbg.run_requests()`.

`ida_dbg.read_memory` n’existe pas dans cette API. `ida_dbg.read_dbg_memory`
requiert un buffer `void*` SWIG et n’est pas le chemin simple ici ; utiliser
`ida_bytes.get_bytes` pendant l’arrêt du débogueur.

> [!warning] Persistance IDAPython
> `py_eval` sépare parfois locals et globals. Conserver les objets de hook et
> les captures dans `__main__`, pas dans un `globals()` local. Un
> `DBG_Hooks` qui appelle une API inexistante peut ne pas capturer ni reprendre
> le processus comme prévu. Vérifier EIP et l’état debugger après chaque
> breakpoint ; le fallback sûr est le cycle explicite entrée → return.

## 3. Discipline d’injection

Après détachement d’IDA :

1. lire les canaris et exiger `mode != 3` avec la préimage native ;
2. générer le bootstrap versionné avec les seams explicitement voulus ;
3. injecter depuis Open World/menu uniquement ;
4. attendre `03/03/01/04` avec `capture_live_canaries.py` ;
5. exécuter une suite limitée, récupérer `FF8Iso_EvidenceSnapshot`, puis
   revenir hors combat avant shutdown.

[[projects/final-fantasy-viii-reimaginated/references/p0-6-offline-validation]]
montre l’ordre effectivement validé pour G03, G04 et G05.

## 4. Preuves et verdicts

`capture_runtime_evidence.py` lit l’export POD du DLL avec
`ReadProcessMemory`. Une preuve positive G05 exige au minimum :

- `g05_ticks = 1` ;
- `memory_diff_bytes = 0` ;
- zéro violation d’allowlist et zéro appel interdit ;
- runtime non-`Faulted` ;
- handback natif observé après le tick ;
- shutdown final avec préimage restaurée.

Les assertions fournies à la ligne de commande ne sont pas une oracle : le
collecteur doit invalider toute assertion positive G05 si le runtime a atteint
`Faulted`.

Une première tentative G05 a produit une trace déterministe de 13 étapes,
sans `StatusAndSpecial`, parce que `action_taking_place` était faux. Elle a
fail-stop sans écriture FF8 ; cette preuve négative est utile. Le validateur
doit accepter les branches idle déterministes 13 et 14 étapes, pas imposer la
branche de test synthétique à la mémoire live.

## 5. Fault et récupération

- G03 injecte sa faute uniquement hors combat : `Faulted`, retrait quiescent,
  préimage restaurée, DLL chargé mais inerte.
- Une faute après l’engagement G05 est fail-stop ; elle ne doit pas appeler le
  Director natif comme fallback.
- Après `Faulted`, redémarrer FF8 avant un nouvel essai. Même si le processus
  reste vivant, le runtime de ce DLL est volontairement terminal.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-6-offline-validation]]
- [[projects/re-ff8/skills/implementing-iso-battle-migration]]
- [[projects/re-ff8/skills/battle-re-verification]]
