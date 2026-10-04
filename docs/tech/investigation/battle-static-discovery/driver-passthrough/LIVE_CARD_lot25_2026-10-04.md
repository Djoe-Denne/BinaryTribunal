# LIVE CARD — Lot 25 : AF3DN state→draw live (candidat v15 `0x5642`) — 2026-10-04

Autorisation opérateur : « on peut y aller » (2026-10-03). Carte minimale
conforme au filtre de nécessité — seules les lignes LIVE-REQUIRED.

```text
Gate: LOT25 — état→draw live (codec v15, pas de stage0 en pass 1)
Candidate DLL SHA-256: ba8d2d4e1c4f91d7461b61f67144d5e84319122c22f38de6ffb78085ed42f32c
                       (pin lot24/candidate_pin.json — STRICT re-vérifié)
EXE SHA-256: 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570
AF3DN.P baseline (pré-déploiement): 6af89971beff331f2f3cae71dbc612b3e8fa39cf0b116903717ba1a3fdb89d00 (v13)
Process rule: lancement FF8 PAR L'OPÉRATEUR, processus frais, aucun debugger
              (chargement natif AF3DN.P — pas d'injection)
Actions remaining:
  1. (agent) Déploiement v15 -> AF3DN.P + hash post-copie
     témoin: hash copie == ba8d2d4e…
  2. (opérateur) Lancer FF8, charger la sauvegarde, entrer dans le combat
     (battle13), tenir la position — témoin: jeu vivant, en combat
  3. (opérateur dit "go") (agent) crée le sidecar gfx_passthrough.dump
     => armement 16 frames au Present suivant — témoin: sidecar supprimé
     par le writer (= armé)
  4. (opérateur) ~2 s de combat puis UNE action normale (attaque) —
     témoin: combat continue, aucun crash
  5. (agent) Collecte dump+log, parse lot24_contract — témoin: 16 frames,
     counts cohérents, zéro rejet contractuel, association ctx/état visible,
     footers bit1=0 (pass 1 sans stage0 — attendu et vérifié)
  6. (agent) Restauration AF3DN.P v13 byte-exacte + hash — témoin:
     6af89971… restauré, processus vivant
Stop après le premier contrôle de sécurité rouge
Promotion ce soir: non — ancre live contrainte (les lignes vertes = preuve
d'état→draw ; satisfied reste false tant que le contrat complet n'est pas
vert, stage0 = pass 2)
```

## Ledger des waivers

| Id | Bucket | Objet | Preuve / référence |
| --- | --- | --- | --- |
| W25-01 | SET-ASIDE-VERIFIED | Codec v15 structurel + round-trip (candidat `ba8d2d4e…`, aucun host I/O) | harnais 648 assertions/0 fail, gate STRICT `lot24/gate_strict.json`, sweep 235 OK |
| W25-02 | SET-ASIDE-VERIFIED | Sémantique lecteur stricte v15 (requested/applied, sticky, rejets) | `test_lot24_contract.py` 31/31 |
| W25-03 | SET-ASIDE-VERIFIED | Formulaire UV/RHW/alpha sur la fixture v13 | W23-01 (Lot 23, même oracle) |
| W25-04 | SET-ASIDE-CERTAIN-UNKNOWN | Token stage0 exact à T_draw (bind/unbind vs appliqué) → **pass 2** : v16 requis (câblage DllMain derrière sidecar `gfx_passthrough.stage0`, build-id `0x5643` à prouver libre, cycle offline complet) | fail-closed pass 1 : footers **bit1=0 attendus et vérifiés** (observation, pas un contournement) |
| W25-05 | SET-ASIDE-CERTAIN-UNKNOWN | Replay positif depth/STP/alpha, reconstruction OT globale | W23-03/04 ; RS/blend restent raw ; refus hors périmètre Lot 22 §3.3 |

Loi dure re-vérifiée : processus frais sans debugger ✓ (lancement opérateur,
chargement natif) · hashes EXE/DLL enregistrés, pas de fusion de hashes ✓ ·
`validate_contracts`/build/PE32 : préimages, readback, restauration
byte-exacte prouvés offline sur ce candidat (harnais + gate STRICT) ✓ ·
une action utilisateur à la time, prompts français ✓ · arrêt au premier
rouge ✓ · collecteur = `lot24_contract` strict (rejet = preuve négative) ✓.

## Après la session

- Preuves attendues : dump v15 parsé (counts/epochs), **RS/blend raw par draw
  associés au ctx du draw** (objectif central pass 1), kind2 retours natifs
  réels, footers bit1=0 (stage0 absent — attendu), dump/log collectés hors
  répertoire jeu.
- Ancre live contrainte : lignes de sûreté vertes + résidus nommés
  (W25-04/05) ; `satisfied = false`.
- Ingestion wiki/evidence seulement après accord ledger↔captures.
