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
summary: Règles transversales pour tout batch FF8 live : build Win32, ABI sous IDA, détachement, injection sûre, hashes de candidats et verdicts dérivés du runtime.
relationships:
  - target: "[[projects/re-ff8/skills/implementing-iso-battle-migration]]"
    type: implements
  - target: "[[projects/re-ff8/skills/battle-re-verification]]"
    type: related_to
provenance:
  extracted: 0.88
  inferred: 0.10
  ambiguous: 0.02
base_confidence: 0.83
lifecycle: draft
lifecycle_changed: "2026-07-22T18:35:00+02:00"
tier: supporting
created: 2026-07-22T18:35:00+02:00
updated: 2026-07-23T11:25:00+02:00
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

## Related

- [[projects/re-ff8/skills/implementing-iso-battle-migration]]
- [[projects/re-ff8/skills/battle-re-verification]]
- [[projects/final-fantasy-viii-reimaginated/skills/p0-6-live-validation-playbook]]
- [[projects/final-fantasy-viii-reimaginated/skills/p0-7-live-validation-playbook]]
