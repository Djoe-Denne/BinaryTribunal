---
title: "Catalogue Evidence — Lot 25 : captures v15/v16, rendu réel frame 3556, candidat v17 0x5644, reprises live et audit d'unload (2026-10-04)"
category: references
tags: [ff8, rendering, testing, reference]
aliases: [lot25 evidence catalog, lot25 v17 resume, lot25 pass2 bis]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot25pass2bis_2026-10-04.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/LIVE_CARD_lot25pass2bis_2026-10-04.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/VISUAL_REPLAY_lot25_2026-10-04.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/LOT25_V17_CLOSE_DIAGNOSIS_2026-10-04.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/LOT25_V17_UNLOAD_AUDIT_2026-10-04.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/ERRATUM_lot25pass2_2026-10-04.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v17/gfx_driver_passthrough.dll
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v17/resume-20261004T143246Z-f05fa234/close_rollback.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v17/resume2-20261004T151157973518Z-d77eb136/close_rollback.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v17/unload-audit-20261004T155604Z-10423954/receipt-retry1.json
  - tools/af3dn_state/lot25_render_input.py
  - tools/af3dn_state/render_lot25.py
  - tools/af3dn_state/harness_lot25b_unload.c
summary: >-
    Preuves Lot25 : captures v15/v16, v17 bloqué par unload dangereux, v18 0x5646 validé offline A–I. Rollbacks et oracles préservés ; live global toujours bloqué.
provenance:
  extracted: 0.93
  inferred: 0.05
  ambiguous: 0.02
created: 2026-10-04T18:10:00+02:00
updated: 2026-10-07
---

# Catalogue Evidence — Lot 25 (pass 1/2, pass 2 bis, reprises v17 — 2026-10-04)

Entrée hash-bound. Codes de sortie réels dans les reçus cités ; aucun verdict
fusionné. Oracles `ff8dump.py`, `render_lot17.py`, `render_lot21.py` **jamais
modifiés** (diff git vide vérifié plusieurs fois dans la session).

## Captures et rendu

| Objet | Identité / résultat |
| --- | --- |
| Pass 1 (v15 `0x5642`) | 16 frames `7610..7625`, 214 ST/frame, 2512 kind2, 22 contextes, stage0 absent (attendu) |
| Pass 2 (v16 `0x5643`) | 16 frames `3556..3571` ; dump SHA `35228f93…2085` (39 688 620 o) ; kinds 8/9 = 0/0, `STAGE0_VALID=0/2720`, `replay.incomplete=true` (négatif conservé, cause non résolue) |
| Rendu réel (nouveau) | frame **3556** rasterisée depuis la capture v16 via `lot25_render_input.py` + `render_lot25.py` (modèle Lot 21 inchangé, UV rot0+RHW, couches sémantiques) ; 119 records géométriques → 116 slot51 (ciel 1, horizon 3, terrain 6, acteurs 84, UI 22) + 3 slot49 séparés ; **292 tests OK exit 0** ; contrôle Lot 21 régénéré byte-identique (`a6995682…b45`) ; aucun ancien PNG en entrée ; RS/blend **non appliqués** (pas de gain de fidélité revendiqué) |
| Composite | `LOT25_seq3556_composite.png` SHA `6dd41a39…a20` ; manifest avec provenance complète |

## Candidat v17 `0x5644` (figure)

- SHA-256 `0c446a5a5accb00f90684f3379b5a2297e24d56cba33d8b1ab0192ad097c6bcc`
  (614 912 o) ; source `07dacab2…7fc2` — **figés** toute la session.
- Gates offline (re-jouées à chaque reprise) : gate stricte **648 checks / 0
  fail exit 0** ; sweep Python **292 OK exit 0** ; lifecycle synthétique
  **32 checks / 0 fail** (non-témoin live, traité comme tel).

## Reprise 1 (live, STOP)

- Déploiement vérifié (backup frais `lot25-pass2bis-resume-pre-54da1eda…`,
  post-hash identité) ; opérateur « ouvert ».
- Diagnostic stage0 5 606 o : **2 attach/install ret=1** (préimages
  `FF9098000000` intactes, E8 vers stub, voisins OK) **séparés par un detach
  armé seq=36 sans restore** ; second detach seq=10909 à la fermeture.
- Décodage après témoignage opérateur (1er lancement en erreur → 2e propre) :
  terminaisons de processus plausibles, mais **non établies par PID** (le
  journal v17 n'en porte pas) ; STOP conservé sur témoin restore/detach absent.
- WER : crash du jour = `dotemu_orig.DLL` `c0000005` +0xDF52 (14:43:10Z, 5 s
  avant le second processus) ; 3 crashs antérieurs modules différents dont un
  dans AF3DN.P (23-09, build non identifié) — **aucune attribution causale**.
- Clôture : archive `lot25-pass2bis-resume-closed-de08918a…` (CSV 24 590 094 o
  SHA `503f286b…fce` streaming, diag final 6 065 o SHA `b14d14ae…79b`, préfixe
  5 606 o == snapshot) ; rollback byte-exact `3da7883f…d19` (145 920 o) ;
  sidecars retirés ; CSV/diag originaux conservés (aucune purge) ; CSV lu en
  streaming : 489 213 lignes, slot1=0, blocs délimités par `#dll_loaded`
  (blocs ≠ PIDs).

## Reprise 2 (live, jamais armée, STOP puis close)

- Redéploiement identité vérifiée + backup frais
  `lot25-pass2bis-resume2-pre-d77eb136…` ; « go » reçu ; PID 37848.
- Pré-armement : readback **lecture seule** (`OpenProcess VM_READ`, sans
  débogueur) des deux fenêtres en mémoire, cibles E8 == stub mappé
  (`5B1B294B` → thunk `5B1B7D40`) ; capture **jamais armée** (dump sidecar
  absent à chaque relevé).
- Arrêt : le test d'unload (voir
  [[projects/re-ff8/references/af3dn-lot25-v17-unload-audit-2026-10-04]])
  reproduit le DLL déchargé avec E8 pendants → **bloque v17**.
- Clôture : archive `lot25-pass2bis-resume2-closed-ea3593dd…` (CSV
  **760 912 957 o** SHA `c340e73c…698` streaming ; diag 9 099 o SHA
  `1a1b2c07…031` ; marker archivé avant retrait) ; rollback byte-exact
  `3da7883f…d19` ; préfixes des journaux antérieurs préservés ; detach
  session seq=40577 `armed=1` `seen=0` req/res=0 — motif toujours non
  identifié ; reçus `close_rollback.json` + `close_parent_validation.json`.

## Verdicts (non fusionnables)

Suite du 2026-10-07 :
[[projects/re-ff8/references/af3dn-lot25-v18-no-hot-unload-2026-10-07]] — v18
NO_HOT_UNLOAD compilé, 860 checks lifecycle, writer 684+106 checks/passe,
303 tests Python sans skip. Gates offline A–I passées ; autres durées de vie
et live toujours bloqués. Evidence sous `lot25/v18/`, aucune nouvelle capture.

Les verdicts suivants concernent les captures/reprises historiques v15–v17 :

Rendu réel nouveaux codecs : **oui** ; gain de fidélité par états Lot 22–24 :
**non** (RS/blend raw) ; installation stage0 live : **prouvée** (reprise 1,
2 sites) ; résultat device/applied : **non évalué** (aucun combat capturé) ;
restore mémoire/detach : **non prouvé** ; mechanism d'unload dangereux :
**reproduit hors jeu** → v17 **bloqué** ; fidélité UI **PARTIAL/BLOCKED** ;
`promotion_satisfied=false` partout. Oracles et candidat figés.

## Références

- [[projects/re-ff8/references/af3dn-lot25-v17-unload-audit-2026-10-04]]
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot24]]
- [[projects/re-ff8/references/driver-replay-fond-uv-composite-lot21-2026-10-01]]
- [[projects/re-ff8/concepts/battle-backend-roadmap]]
