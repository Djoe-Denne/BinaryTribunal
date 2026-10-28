---
title: >-
  Lot 25 v18 — NO_HOT_UNLOAD offline validé, live bloqué
category: references
tags: [ff8, rendering, reverse-engineering, testing, reference]
aliases: [lot25 v18, stage0 no-hot-unload, RESTORED_RETAINED]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/LOT25_V18_OFFLINE_REPORT_2026-10-07.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v18/README.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v18/native_parent_validation.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v18/writer_strict_receipt.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v18/python_tests_receipt.json
summary: >-
  v18 0x5646 : PIN avant E8, activation Present différée, RESTORED_RETAINED. Gates offline A–I passées ; autres détours et concurrence non qualifiés, live bloqué.
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
created: 2026-10-07
updated: 2026-10-07
---

# Lot 25 v18 — NO_HOT_UNLOAD offline

Le prototype `0x5646` est compilé (MSVC x86, exit 0) et les gates A–I sont
réellement exécutées. **Aucun déploiement ni lancement FF8 ; live global bloqué.**
DLL SHA-256 : `d36f7366d16961adcf5ec670f840907d715fa28d687e3f67812cbc8cc7633265`.

## Ce qui change par rapport à v17

Attach observe seulement la présence du marqueur stage0. Ce marqueur est
persistant, pas consommé ; son contenu ne commande pas l'activation. Le vrai
Present existant et l'export explicite convergent vers le même chemin :
`nohook` veto, puis **PIN Windows confirmé avant toute écriture E8**.
Une seule tentative par module ; ni refus ni restore ne réarment l'opt-in.

Le module reste épinglé jusqu'à la fin du processus, y compris après restore :
**RESTORED_RETAINED**, jamais « Detached green ». Un échec restore garde
target/ret ownership pour retry. Les six octets originaux et les fenêtres
4+6+4 sont vérifiés séparément. Le nouveau journal LC18 (64 octets/record)
distingue attach, unload dynamique et terminaison par PID/création et
`lpvReserved`, sans formatter CRT ni PIN/restauration au detach.

## Preuves effectives

- Lifecycle : **860 checks, 0 fail**. A–G exits 0 ; H termine avec **exit 73**
  attendu/observé, contrôleur exit 0. A ne pose aucun E8 à attach ; B retient
  après libération de l'unique référence LoadLibrary ; D restaure 6/14 exacts.
- C passe deux fois par le **naked PresentDetour de production**, zéro appel
  export Install et une seule activation. Seule la continuation finale du
  trampoline est synthétique ; les anciens E9 sont désactivés dans le harnais.
- E injecte PIN refusé : zéro write, pas d'ownership. F injecte VirtualProtect
  refusé aux deux restores : retour 0, ownership conservée, module retenu ;
  retry après FreeLibrary réussi. H reste une terminaison, pas une restauration.
- Writer PIN puis STRICT : **684+106 checks** par passe, exits 0 ; deux processus
  séparés, aucune réinitialisation du lifecycle. ST09=40, footer ND08=68,
  garde `0x100C80`, stub `ret 12`, 17 exports et sortie binaire vérifiés.
- Sweep : **303 tests Python, 0 skip, exit 0**. Lecteur accepte `0x5646`
  explicitement, défaut `0x5642` préservé, mixed-build refusés et `0x5645`
  toujours négatif. Oracles inchangés ; RS/blend restent bruts et requested,
  result-observed, applied restent distincts.

Reçus et logs bruts : `lot25/v18/lifecycle-artifacts/`, `writer-*-artifacts/`
sous le dossier documentaire driver-passthrough. Copies de synthèse/reçus dans
`_raw/lot25-v18-offline-2026-10-07/` ; ce sont des artefacts, **pas un export
intégral de conversation**.

## Pourquoi le live reste bloqué

Les E9 Present/ODS posés avant PIN, le proxy `engine+0xA74`, les wrappers,
trampolines, références natives et appels concurrents restent hors garantie.
Le verrou Activate/Restore ne draine pas les stubs en vol ; les six octets
ne sont pas un patch atomique. Aucun audit runtime global n'est revendiqué.

`g_stage0InDllMain` reconnaît seulement nos callbacks ; les autres DllMain
ne sont pas détectés universellement. Les entrées explicites/Present exigent
un contexte hors callbacks loader. Les contextes appelants du jeu ne sont
pas qualifiés par les hôtes synthétiques.

Second VirtualProtect, FlushInstructionCache, échec IO LC18, concurrence et
wrapper slot 1 v18 dédié : non testés dans cette campagne. Voir le rapport
pour les limites exactes. `promotion_satisfied=false`.

## Continuité des connaissances

- [[projects/re-ff8/references/af3dn-lot25-v17-unload-audit-2026-10-04]] : le
  reproducer rouge **exit 3** reste figé ; v18 ne réécrit pas cette preuve.
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot25]] : historique
  des captures et reprises, crash WER toujours sans attribution causale.
- [[projects/re-ff8/concepts/battle-backend-roadmap]] et [[projects/re-ff8/re-ff8]].
