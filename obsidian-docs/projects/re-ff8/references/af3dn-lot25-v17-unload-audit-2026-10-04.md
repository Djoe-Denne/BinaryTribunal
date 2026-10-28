---
title: >-
    Lot 25 v17 — audit d'unload réellement exécuté (2026-10-04) : E8 pendants reproduits hors jeu
category: references
tags: [ff8, rendering, reverse-engineering, testing, reference]
aliases: [lot25 v17 unload audit, dangling E8 v17, harness_lot25b_unload]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/LOT25_V17_UNLOAD_AUDIT_2026-10-04.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/LOT25_V17_CLOSE_DIAGNOSIS_2026-10-04.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v17/gfx_driver_passthrough.c
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v17/unload-audit-20261004T155604Z-10423954/receipt-retry1.json
  - tools/af3dn_state/harness_lot25b_unload.c
summary: >-
    v17 : FreeLibrary sans wrapper laisse les E8 pendants (exit 3 rouge) ; contrôle restore exact. v18 validé offline séparément, live toujours bloqué, crash non attribué.
provenance:
  extracted: 0.9
  inferred: 0.08
  ambiguous: 0.02
created: 2026-10-04T18:10:00+02:00
updated: 2026-10-07
---

# Lot 25 v17 — audit d'unload réellement exécuté (2026-10-04)

Constat déclencheur : le « harnais B » annoncé en arrière-plan n'avait produit
aucun livrable (échec `uv_spawn` du sous-agent) ; l'attente associée était donc
sans objet. Un test ciblé a été créé, compilé puis **réellement exécuté au
premier plan**, sur des copies en répertoire temporaire, sans jamais toucher le
processus du jeu ni exécuter le stub ou les sites.

## Ce que le test prouve (candidat v17 `0c446a5a…c6bcc` exact)

| Cas | Chemin | Résultat |
| --- | --- | --- |
| Contrôle | install → wrapper slot 1 (`RVA 0xBE10`) → FreeLibrary | **exit 0** — 16 checks/0 fail ; fenêtres 14 o = originales exactes, module absent, hôte vivant ; diagnostic `restore_verified`, detach `armed=0` |
| Bypass | install → **FreeLibrary sans wrapper** | **exit 3 rouge intentionnel** — 12 checks/0 fail ; les deux fenêtres restent identiques aux patches (`E8` vers le stub) alors que le module est **absent** ; hôte synthétique continue de vivre ; diagnostic sans restore, detach `armed=1` |

Le garde v17 (`GFXPT_Stage0BeforeUnload`, source lignes 3303–3322) vit dans le
wrapper du slot 1 ; `DllMain(DETACH)` est `snapshot_only` et ignore
`lpvReserved` (lignes 3407–3411). Le déchargement dynamique qui contourne le
wrapper n'est donc pas couvert : **le mécanisme « E8 pendants vers code
libéré » est reproduit sur le candidat exact.**

## Ce que le test ne prouve pas

- Que FF8 emprunte ce chemin de déchargement (aucun témoin live du motif des
  detach ; le journal v17 ne porte ni PID ni raison).
- Que le crash WER du premier lancement (`dotemu_orig.DLL` `c0000005` +0xDF52)
  soit causé par ce mécanisme — corrélations et attributions restent non établies.
- La suite annoncée (ExitProcess, injections d'échecs restore/PIN) n'a pas
  tourné : aucun résultat inventé pour ces cas.

## Discipline d'exécution (reproductible)

- Host des sites = l'EXE synthétique du harnais lui-même ; fenêtres
  `[site-4,+10)` vérifiées entières dans une zone `.text` réservée avant toute
  écriture ; `FF8_PASSTHROUGH_BOOTHOOK=0` avant `LoadLibraryA`.
- Jamais : exécution du stub ou des sites, `GetProcAddress`/appel après
  FreeLibrary, force-unload d'un module retenu, écriture hors fenêtres possédées.
- Le harnais remet ses propres fenêtres en état et retire son unique marker ;
  un échec de cleanup remonte au code de sortie (jamais silencieux).
- Premier build refusé (quoting `vcvarsall.bat`) préservé dans `receipt.json` ;
  reprise par script CMD explicite, exit 0 (seul warning C4325 connu).
- Le parent a corrigé avant exécution : FreeLibrary effectif en contrôle,
  anti double-FreeLibrary, propagation des échecs de cleanup au code de sortie,
  fermeture du marker, bornage des chemins.

## Verdicts et suite

- **Capture v17 bloquée** ; `promotion_satisfied=false` inchangé. La leçon
  structurelle : *un garde placé dans un chemin optionnel ne couvre pas
  l'opération qu'il est censé encadrer* — le restore doit être atteint par
  tout chemin de déchargement, ou le module ne doit pas être déchargeable
  (pin acquis hors loader-lock avant tout patch, décidé à l'avance, pas
  improvisé dans DllMain).
- Correction v18 **décidée** (revue du 2026-10-04) : option B, prototype
  offline `NO_HOT_UNLOAD` — opt-in à l'attach sans écriture, activation
  différée par le PresentDispatch existant hors loader-lock, self-PIN
  confirmé avant tout E8, état `RESTORED_RETAINED` ; détours boot/Present/ODS
   hors garantie, blocage live global maintenu. À cette date, implémentation non commencée.
  Ne pas déplacer aveuglément le garde/PIN dans `DllMain`. v17 et ses reçus
  restent figés.

## Preuves

Suite effective du 2026-10-07 :
[[projects/re-ff8/references/af3dn-lot25-v18-no-hot-unload-2026-10-07]] —
prototype compilé `0x5646`, gates offline A–I passées, live global toujours
bloqué. Les sources et reçus v17 cités ci-dessous restent inchangés.

`lot25/v17/unload-audit-20261004T155604Z-10423954/` : `receipt.json` (build 1
refusé), `receipt-retry1.json` (verdict), `compile-retry1.log`, `control.log`,
`unload.log`, diagnostics stage0 séparés par cas ; hashes source/candidat/copies
re-vérifiés par le parent. Récits de campagne : `LOT25_V17_UNLOAD_AUDIT_2026-10-04.md`
et `LOT25_V17_CLOSE_DIAGNOSIS_2026-10-04.md` (dossier
`docs/tech/investigation/battle-static-discovery/driver-passthrough/`) ;
[[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot25]],
[[projects/re-ff8/concepts/battle-backend-roadmap]].
