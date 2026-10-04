# LIVE CARD — Lot 25 pass 2 : stage0 live (candidat v16 `0x5643`) — 2026-10-04

Autorisation opérateur : « go » (2026-10-04, enchaînement annoncé). Carte
minimale — seul le câblage DllMain→installer est nouveau ; tout le reste est
prouvé (v15/v24).

```text
Gate: LOT25 pass 2 — token stage0 exact à T_draw (câblage auto-install)
Candidate DLL SHA-256: ecc1f8eba08855feecc8627b0ec16a8c302b10dde1d51a74e56756e80e610abf (v16, 0x5643)
EXE SHA-256: 064d466b… (inchangé)
AF3DN.P pré-déploiement: 3da7883f… (v13 rebuilt — ARCHIVÉ avant écrasement cette fois)
Process rule: lancement opérateur, processus frais, aucun debugger
Actions remaining:
  1. (agent) Archive AF3DN.P courant (3da7883f…) PUIS déploie v16 + hash
     post-copie — témoin: ecc1f8eb…
  2. (agent) Place le sidecar gfx_passthrough.stage0 (lu UNE fois à load)
  3. (opérateur) Lance FF8, entre en combat, tient la position
  4. (opérateur dit "go") (agent) crée le sidecar dump → 16 frames AVEC
     stage0 actif — témoin: sidecar dump consommé
  5. (opérateur) une action normale puis QUITTE le jeu proprement
  6. (agent) collecte + parse v15 strict — TÉMOIN PASS 2: footers bit1=1,
     kind8/kind9 présents (types 1/2), kind9 hr du HRESULT réel, triple
     stage0 = token à T_draw — puis restauration 3da7883f byte-exacte
     (les octets sont archivés cette fois) + retrait du sidecar stage0
Stop après le premier contrôle de sécurité rouge
Promotion ce soir: non — pass 2 = le témoin stage0 ; la promotion complète
exige toujours fidélité UI + contrat (hors périmètre)
```

Notes : l'auto-install est derrière le sidecar `gfx_passthrough.stage0`
(statiquement prouvé : `SideFileExists` → `call installer`, un seul site) ;
si l'install refuse (préimage), mode dégradé bit1=0 => la capture montrera
l'absence => **preuve négative, session void**. Le cap ST09 1024/frame peut
être atteint (SetTexture frequent) : bit3/`st_lost` sont alors le comportement
**caractérisé attendu** (nommé, pas un échec). Le sidecar stage0 sera
**retiré** en fin de session (sinon re-arm à chaque futur lancement).
