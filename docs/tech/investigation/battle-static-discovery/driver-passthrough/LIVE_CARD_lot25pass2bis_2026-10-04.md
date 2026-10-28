# LIVE CARD — Lot 25 pass 2 bis / v17 `0x5644`

État courant : **REPRISE 2 CLOSE — ROLLBACK VÉRIFIÉ, LIVE BLOQUÉ**.
Suite offline du 2026-10-07 : [prototype v18 compilé et gates A–I](LOT25_V18_OFFLINE_REPORT_2026-10-07.md).
Cette carte reste historique et ne constitue aucune autorisation de relance.
Le harnais ciblé a réellement tourné au premier plan : wrapper → FreeLibrary
restaure les octets (exit 0), mais FreeLibrary sans wrapper laisse les deux E8
vers le DLL déchargé dans un hôte toujours vivant (exit 3, verdict rouge).
Reçu : `lot25/v17/unload-audit-20261004T155604Z-10423954/receipt-retry1.json`.
Ne pas armer ni redéployer v17. Après « fermé », FF8_EN et launcher absents,
DLL archivée restaurée byte-exact (`3da7883f...`, 145920 octets), sidecars
stage0/dump absents. Les trois artefacts ont été archivés et hachés en streaming
avant retrait du marker ; CSV et diagnostic originaux conservés, aucune purge.
Vérification indépendante :
`lot25/v17/resume2-20261004T151157973518Z-d77eb136/close_parent_validation.json`.

### Reprise 2 : pré-armement historique, capture jamais lancée

Le « go » opérateur avait été reçu ; PID FF8_EN 37848, lancé à
2026-10-04T15:15:30.7851050Z, sans debugger. Identités disque conformes ;
readback mémoire en lecture seule des deux patches et des voisins conforme ;
stub `5B1B294B` mappé dans AF3DN.P, thunk vers `5B1B7D40` conforme.
Un seul attach/install dans le suffixe de cette reprise ; l'ancien préfixe
du diagnostic (6065 octets) est préservé. Aucun dump sidecar, aucune capture.
Reçu : `lot25/v17/resume2-20261004T151157973518Z-d77eb136/prearm-observation-151802Z-00aae152/observation.json`.
L'installation conforme ne valide pas le lifecycle : le reproducer d'unload
ci-dessus rend maintenant un verdict rouge explicite, pas un feu vert live.

### Historique : première reprise close, rollback vérifié

Le diagnostic montre deux séquences attach/install réussies, séparées par
un `detach` avec `armed=1` et les deux sites encore patchés, sans phase restore.
Le journal n'a pas de PID : cela ne prouve pas un déchargement dans le même
processus, mais le témoin restore/detach requis manque. Aucun armement ; pas
de passage en combat. Snapshot et verdict conservés dans
`lot25/v17/resume-20261004T143246Z-f05fa234/open-observation-144519Z-efddfbfd/`.
FF8 et launcher absents (CIM et Get-Process) ; DLL archivée restaurée byte-exact
et sidecars stage0/dump absents. CSV et diagnostic finaux archivés/hachés et
conservés aussi en place. Reçu :
`lot25/v17/resume-20261004T143246Z-f05fa234/close_rollback.json`.
Le diagnostic final contient deux detach armés, toujours aucune phase restore.
Le reçu `parent_ready.json` décrit uniquement l'état antérieur à l'ouverture.
**Ne pas relancer cette carte** sans autorisation explicite : l'ancien
harnais B annoncé n'avait produit aucun livrable ; toute nouvelle session exigera un
nouveau « OK » opérateur. Résultat détaillé :
`LOT25_V17_CLOSE_DIAGNOSIS_2026-10-04.md` — complété par le témoignage
opérateur (premier lancement en erreur, second propre), qui rend les deux
cycles cohérents sans établir par PID le motif des detach. Le WER localise
la faute dans `dotemu_orig.DLL` (`c0000005` +0xDF52), sans établir sa cause.
Les autres crashs n'ont pas la même signature module/décalage et ne permettent
pas d'innocenter v17. Aucun allègement du contrat de sûreté sur cette base.

## Identité et portée

- DLL candidat : `lot25/v17/gfx_driver_passthrough.dll`.
- SHA-256 : `0c446a5a5accb00f90684f3379b5a2297e24d56cba33d8b1ab0192ad097c6bcc`.
- EXE attendu : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Rollback disque attendu :
  `3da7883fb9815615f309e17e7a3b8fb6f496d091739839240a7d457ba7ba9d19`.
  Archive de nouveaux octets avant copie ; ne pas reconstruire le rollback.
- Archive fraîche de CETTE reprise :
  `tools/_tmp_af3dn_drop/captures/lot25-pass2bis-resume2-pre-d77eb136f6a2424fae3070102e15c2ca/AF3DN.P.rollback`.
  Reçu courant : `lot25/v17/resume2-20261004T151157973518Z-d77eb136/deployment.json`.
- Processus frais, sans debugger. Pas de nouvelle adresse native instrumentée.
- Sites stage0 : `[host+0x1EF5D,+6)` et `[host+0x1EF72,+6)` uniquement.
  Préimages `FF9098000000`, patch `E8 rel32 + 90`, ABI du stub `ret 12`.
- Installation attach sidecar inchangée ; restore ajouté au slot 1 **avant**
  le forward Uninit et avant son early-return. Un restore raté reste rouge :
  ownership conservé et DLL retenue plutôt qu'un E8 vers du code déchargé.

## Classification de nécessité

LIVE-REQUIRED : identité EXE/DLL après déploiement ; sidecar réellement vu ;
préimages complètes et quatre voisins de chaque côté ; readback des patches
et destination E8 exacte ; attribution de requête/résultat au bon site ;
association physique/epoch au draw ; pertes ; restauration des deux ranges
et voisins ; ordre restore/unload dans le processus ; absence du processus
avant rollback disque ; hash restauré. Aucun de ces témoins n'est dispensé
par les résultats synthétiques.

SET-ASIDE-VERIFIED, limité au calcul offline : grammar ST09 40 octets / footer
ND08 68 octets, whitelist/mixed-build negatives, guards/cap/overflow/ABI sur
le candidat exact. Evidence : `lot25/v17/gate_strict.json` (648 checks, exit 0),
`lot25/v17/python_tests.log` (275 tests, exit 0), `rva_derivation.json`.
Revalidation de reprise :
`lot25/v17/resume-20261004T143246Z-f05fa234/gate_strict.json` (648 checks, exit 0)
et `python_tests.log` voisin (292 tests, exit 0).
Lifecycle : `lot25/v17/lifecycle_final_receipt.json`, 32 checks, zéro échec,
exit 0 sur EXE synthétique. Il ne dispense pas le restore live.

SET-ASIDE-CERTAIN-UNKNOWN : fidélité UI globale, depth/STP/OT, déterminisme
interprocessus, contenu des textures non capturé. Ne pas en inventer une
dérivation positive ni forcer une promotion. RS `0..25` et blend `0..4` raw.

## Une action opérateur à la fois

1. Après annonce « prêt » : ouvrir un FF8 frais. L'agent lit d'abord le petit
   `gfx_passthrough_stage0.log` d'attach ; pas encore de dump sidecar.
2. Si install/readbacks sont valides : aller dans un combat représentatif,
   puis répondre **« go »**. L'agent seul arme une fenêtre de 16 frames au
   prochain Present. Aucun armement anticipé.
3. Si demandé après collecte : quitter normalement. Ne pas tuer le processus
   pour prétendre avoir observé la fermeture normale.

Stop au premier témoin de sécurité rouge : pas de deuxième capture pour
compenser. Une installation réussie avec zéro hit est un résultat
diagnostique, pas une preuve stage0 positive. `bit1=0` ne suffit pas à
conclure « install refusée » ; `bit1=1` ne suffit pas à conclure « appliqué ».

## Collecte et verdicts

- Conserver/hash raw dump, log de frames, diagnostic et CSV ; streaming pour
  les gros fichiers. Ne rien purger avant copies vérifiées.
- Parse explicite `--build 0x5644`, aucun monkeypatch de BUILD.
- Kinds 8/9 : sites 1/2 attendus ; site 0 reste inconnu, pas de promotion.
- HRESULT réel observé distinct du succès synthétique du harnais ; absence
  d'échec ne prouve pas la fidélité pixel de l'image.
- Footer associé à un résultat capturé avant le draw avec device/devVT/texture
  cohérents ; sinon incomplet. Toute perte demeure visible et invalidante pour
  une attribution complète.
- Restore/readbacks et detach doivent être explicitement examinés. Une trace
  de restore disque après arrêt n'est pas un témoin de restore en mémoire.
- Après processus absent : rollback depuis archive, hash byte-exact, retrait
  sidecars stage0/dump ; captures historiques conservées.

Promotion : **non** ; `satisfied=false`. Structure, résultat device, sûreté
runtime et fidélité visuelle font l'objet de verdicts séparés. La planche
historique lot 20 n'est pas une nouvelle comparaison same-frame de cette session.
