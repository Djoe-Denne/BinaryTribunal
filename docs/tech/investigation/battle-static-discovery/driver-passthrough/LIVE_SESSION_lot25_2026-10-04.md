# LIVE SESSION Lot 25 — état→draw live v15 (2026-10-04)

Carte : `LIVE_CARD_lot25_2026-10-04.md` · Reçu : `lot25/session.json` ·
Déploiement : `lot25/deployment.json`. Autorisation opérateur explicite
(2026-10-03, « on peut y aller »), protocole du filtre de nécessité suivi.

## Résultat : **ancre live contrainte VERTE** — pass 1 état→draw prouvée

| Item carte | Résultat |
| --- | --- |
| 1. Déploiement + hash post-copie | ✓ `ba8d2d4e…` == candidat pin |
| 2. FF8 frais, sans debugger, entrée combat | ✓ (opérateur ; chargement natif AF3DN.P) |
| 3. Sidecar → armement 16 frames | ✓ consommé par le writer (preuve) |
| 4. Action opérateur, combat continue | ✓ (aucun crash) |
| 5. Parse lot24_contract | ✓ 16 frames seq 7610..7625, **0 rejet contractuel** |
| 6. Restauration post-session | ✓ fonctionnelle — **écart consigné** (voir deviations) |

## Témoins capturés (LIVE-REQUIRED pass 1)

- **2512 draws kind2**, **22 ctx distincts** — l'association draw↔ctx native.
- **Valeurs d'état réelles par draw** (première capture live v15) :
  kind1 RS ×2272 (raw `[0, 1, 5, 112]` sur types `[2, 11, 14, 16, 24, 25]`),
  kind3 blends `(33,1)`/`(33,4)` ×96, kind4 target ×224, kind6 setups ×768,
  kind7 scènes ×64.
- **Zéro perte** : fails/drops/guards/overflow = 0 par frame ; bit2/bit3 = 0 ;
  epochs 1→3424 strictement croissantes.
- **bit1 = 0 partout** ✓ (pass 1 sans stage0 — W25-04, vérifié).
- Build unique `0x5642` ✓ (aucune fusion).

## Écarts consignés (transparence totale)

1. **Combat aléatoire** au lieu de battle13 — le couplage état→draw est
   agnostique du combat ; battle13 = référence visuelle (hors lignes
   LIVE-REQUIRED de la carte).
2. **Restauration non byte-exacte** : les octets `6af89971…` n'ont pas été
   préservés avant l'écrasement (défaut de protocole — la carte passée
   préservait les artefacts gfx_passthrough mais pas AF3DN.P lui-même).
   Restauration **fonctionnelle** : rebuild depuis la source v13 committée
   (`bd4cc14`, build-id `0x5640` vérifié) → `3da7883f…` déployé. MSVC non
   déterministe (PDB path) => byte-exact impossible. **Leçon** : toute carte
   live future DOIT archiver AF3DN.P avant déploiement.

## Session artifacts

`tools/_tmp_af3dn_drop/captures/lot25/` : dump `7584cd1d…` (39 183 844 o),
log `0296746e…`, CSV session `81c8191d…` (509 Mo, hashé puis déplacé du
répertoire jeu). Répertoire jeu propre (aucun artefact résiduel).

## Statut

Ancre live contrainte : lignes de sûreté **vertes**, résidus nommés
(W25-04 stage0 pass 2, W25-05 replay) — `satisfied = false`. Toute
nouvelle session live (pass 2 stage0 via v16 `0x5643`) = nouvelle carte +
autorisation séparée.
