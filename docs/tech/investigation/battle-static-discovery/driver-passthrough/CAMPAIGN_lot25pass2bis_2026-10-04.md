# Lot 25 pass 2 bis — préparation v17 et témoin visuel

Demande opérateur : « OK, allons-y » ; fournir une image ou un side-by-side
permettant de constater l'avancement. Autorisation de préparer la reprise ;
l'armement reste subordonné au « go » en combat sur un processus frais.

## Décisions

1. Lire `ERRATUM_lot25pass2_2026-10-04.md` avant toute interprétation de v16.
2. Candidat séparé `lot25/v17/`, build `0x5644` ; préserver tous les candidats
   antérieurs et les oracles `render_lot17.py` / `ff8dump.py`.
3. Conserver les sites et l'installation DllMain : d'abord distinguer sidecar
   absent, installation refusée, installation réussie mais sites non atteints.
   Ne pas déplacer l'installation au Present sans preuve causale.
4. Diagnostic texte borné séparé du CSV d'appels : chemins/guards, readbacks des
   sites et voisins, compteurs hors fenêtre et état de fermeture. Aucun log
   disque par appel COM ; pas de modification du contrat binaire.
5. Avant déploiement : compiler PE32, vérifier exports/mode binaire/build-id/
   garde, repinner les RVAs du **candidat exact**, puis gate natif et strict.
6. Le chemin slot 1 → restore stage0 → FreeLibrary doit être testé séparément
   du simple export restore. Tout échec reste bloquant pour la sécurité.

## Résultats déjà obtenus dans cette reprise

- Lecteur : selector explicite `--build`, défaut v15 conservé, whitelist
  v15/v16/v17 et cohérence top-level/records du replay.
- 17 nouveaux tests de matrice builds/anti-forgery ; anciennes suites
  préservées. Sweep avant build : **252 tests, exit réel 0**, avec les trois
  fixtures historiques explicitement présentes. Log :
  `%LOCALAPPDATA%/Temp/opencode/lot25-v17-tests-before-build.log`.
- Planche consultable :
  `tools/_tmp_af3dn_drop/captures/visual-progress-20261004/FF8_visual_progress.png`.
  SHA-256 : `0ed7f77fd8aca730e5d658285eaae14df765a128767bcac6e5c4c1fe71d3836b`.
  Trois sources historiques inchangées ; provenance dans le JSON voisin.

## Portes encore à fermer

Les portes writer et lifecycle sont maintenant closes **hors jeu** :

- candidat SHA-256 :
  `0c446a5a5accb00f90684f3379b5a2297e24d56cba33d8b1ab0192ad097c6bcc` ;
- build x86 exit 0 ; 17 exports ; cinq sites build-id (dont diagnostic),
  garde `0x100C80`, mode binaire `ab` ;
- pin et gate stricte : 648 assertions, zéro échec, exit 0 chacune ;
- suite finale Python : 275 tests, exit 0 ;
- lifecycle : 32 checks, zéro échec, exit 0 ; auto-install DllMain sur un
  EXE **synthétique**, puis wrapper Uninit, restore des deux fenêtres 14 octets,
  FreeLibrary, module absent et processus du harnais vivant ; phase nohook
  négative également verte. Evidence : `lot25/v17/lifecycle_final_receipt.json`.

Le harnais lifecycle a d'abord refusé deux layouts sans charger le DLL, puis
signalé deux faux négatifs : son décodeur utilisait `site+6` au lieu de
`site+5` pour le rel32 E8. Correction du **harnais**, pas du candidat. Les trois
reçus d'échec et leurs workspaces sont conservés ; le résultat final ne les
efface pas. Le pad est une contribution .text réservée du harnais, jamais
du code FF8. Les voisins restent vérifiés.

Le parent a ajouté le restore avant Uninit/early-return et un readback 6 octets
dans le restaurateur. Les ownerships d'un restore raté ne sont plus perdus ;
le guard retient le module en cas d'échec. Ce chemin exceptionnel n'a pas été
forcé : s'il survient en live, sûreté/cleanup restent rouges, aucun succès
de détachement ne peut être revendiqué.

Ni installation réelle, application device, restauration live des sites,
détachement vivant, ni fidélité UI ne sont encore établis pour ce candidat.

Les verdicts restent distincts : structure du dump ; requête/résultat observé ;
application device réelle ; sûreté install/restore/detach ; fidélité visuelle.
Un succès synthétique ne ferme pas la porte device réelle.

## Attente visuelle raisonnable

La planche montre un replay brut incomplet (décor visible, ciel incorrect,
acteurs absents) et un composite expérimental d'entités texturées reconnaissables
(décor et interface absents). Ce n'est ni une comparaison same-frame certifiée,
ni une image d'un nouveau moteur autonome, ni une amélioration causée par v17.
Stage0 doit d'abord mieux contraindre les bindings ; il ne promet pas de
restituer immédiatement toute l'interface, le depth, le STP ou l'OT PSX.

## Protection du poste opérateur

État constaté au début de la reprise : FF8 absent ; sidecars stage0/dump absents ;
`AF3DN.P` = `3da7883fb9815615f309e17e7a3b8fb6f496d091739839240a7d457ba7ba9d19` ;
EXE = `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
Préserver une nouvelle archive de ces octets **avant** tout remplacement,
hash après copie et rollback disque seulement après absence du processus.
Ne supprimer aucun CSV/log/dump avant archive et hachage en streaming.
## Déploiement, attente opérateur

Après les deux gates : nouvelle archive avant remplacement, hash d'archive
`3da7883f...`, copie v17 puis hash déployé identique au candidat. Reçu :
`lot25/v17/deployment.json`. Le sidecar stage0 persistant est présent ;
le sidecar dump est absent ; aucune capture n'est armée. Le prochain lancement
frais pourra modifier les deux sites. L'opérateur doit annoncer **« ouvert »**
pour que le parent examine d'abord l'attach/install, puis seulement aller en
combat et donner le **« go »** d'armement.

Aucun commit ni push remote effectué dans cette reprise. Les reçus de gates,
sources et essais sont conservés dans le working tree ; les captures
historiques et oracles n'ont pas été modifiés.

### Pause après correction opérateur

L'opérateur a signalé que le montage visuel présenté réutilisait le lot 20,
alors que le lot 21 avait déjà corrigé ciel/décor/composition. Cette sélection
était inadéquate pour montrer l'état actuel et ne répondait pas à sa demande
d'un rendu nouveau. La planche reste une source historique, **pas le témoin
d'avancement actuel**. La suite live est suspendue ; processus absent, aucun
lancement/capture v17, rollback disque byte-exact depuis l'archive et sidecar
stage0 retiré. Reçu : `lot25/v17/pause_visual_request.json`.

La rasterisation fraîche de la capture v16 Lot25 (frame 3556) est maintenant
produite avec les corrections Lot21 conservées et les codecs récents validés
explicitement : **292 tests, OK**, exit 0. Aucun réétiquetage de dump en v13 ni
modification des oracles. RS/blend/depth et stage0 incomplets ne sont pas
artificiellement appliqués pour prétendre à un gain de fidélité. Résultats,
provenance et limites : `VISUAL_REPLAY_lot25_2026-10-04.md`.

### Reprise autorisée après le nouveau rendu

À la demande « continuons avec se quetu penses être le mieux », reprise du
diagnostic stage0 sans changement de candidat. Nouvelle gate stricte :
**648 checks, zéro échec, exit 0** ; sweep Python : **292 tests, OK, exit 0**.
Les sources, le binaire, les reçus historiques et les oracles sont inchangés.

Reçus de cette reprise : `lot25/v17/resume-20261004T143246Z-f05fa234/`
(`gate_strict.json`, `python_tests.log`, `preflight.json`, `deployment.json`,
`resume_deployment.log`, `parent_ready.json`). Le parent a indépendamment
re-hashé le candidat et le DLL déployé : `0c446a5a...`, **614912 octets** ;
EXE attendu inchangé. Archive rollback fraîche, vérifiée avant copie puis
re-hashée par le parent :
`tools/_tmp_af3dn_drop/captures/lot25-pass2bis-resume-pre-54da1edaae9d4a829c48636684ba9b44/AF3DN.P.rollback`,
`3da7883f...`, **145920 octets**. L'ancienne archive reste intacte.

État après redéploiement : FF8 absent ; seul sidecar stage0 présent ; dump,
nohook et diagnostic d'attach absents. Aucun jeu lancé, aucune capture armée.
Le champ `live: NOT AUTHORIZED` des reçus de gate/déploiement ne représente
pas une observation runtime : la préparation est autorisée, l'ouverture
opérateur reste attendue, et l'armement requiert toujours un nouveau « go »
en combat après lecture des témoins d'installation. Aucun verdict device,
restore live ou fidélité n'est promu. Aucun commit/push.

### Ouverture opérateur — arrêt sur témoin de sûreté manquant

Après « ouvert », FF8_EN PID 18328 observé, créé le 2026-10-04 à
14:43:15.1439110Z ; launcher PID 38860 également présent. EXE et DLL disque
gardent les hashes attendus. Diagnostic stage0 de 5606 octets préservé dans
`lot25/v17/resume-20261004T143246Z-f05fa234/open-observation-144519Z-efddfbfd/`,
SHA-256 `f77fab64891170de32ec1f206dffa37aab2cf35217b2ea6b3f5b45d68879a5f6`.

Le journal montre deux attach/install (`ret=1`, `armed=1`, `broken=0`), avec
préimages, patches et voisins cohérents aux deux sites, destination
`54E3294B`. Entre ces deux séquences : `detach`, seq 36, `armed=1`, sites
encore E8, sans phase de restauration. Les lignes n'ont pas de PID : ne pas
conclure à un unload/reload dans le même processus, ni à des E8 pendants
prouvés. Le témoin restore/detach est néanmoins incomplet : **STOP**, aucun
armement, aucune promotion. Fermeture normale demandée avant collecte finale
et rollback disque. Le CSV vivant reste en place, non supprimé ; aucune
capture binaire n'a été armée par l'agent.

### Fermeture et rollback terminés

Après « fermé », jeu et launcher absents. Tous les artefacts disponibles ont
été copiés et hachés avant nettoyage, CSV compris (24590094 octets, streaming).
Archive :
`tools/_tmp_af3dn_drop/captures/lot25-pass2bis-resume-closed-de08918ae55b450bbeb3c02226f01e13/`.
Reçu : `lot25/v17/resume-20261004T143246Z-f05fa234/close_rollback.json`.
Le parent a re-vérifié les hashes source/archive et le préfixe du diagnostic.

DLL restaurée byte-exact depuis l'archive fraîche : `3da7883f...`, 145920 octets.
Sidecars stage0/dump absents ; CSV et diagnostic originaux conservés en place.
Aucun lancement/capture supplémentaire, aucune purge, aucun commit/push.

Le diagnostic final contient deux detach armés, zéro restore. Le CSV ne
contient aucune entrée slot 1, mais ces traces sans PID ne démontrent ni un
unload dans un hôte vivant ni un crash. Le garde v17 est relié au wrapper
slot 1, non au detach ; le harnais validait explicitement ce wrapper.
**STOP maintenu**. Diagnostic et prochaines validations offline :
`LOT25_V17_CLOSE_DIAGNOSIS_2026-10-04.md`.

### Reprise 2 close après reproducer d'unload rouge

Le harnais B initialement annoncé n'avait pas produit de livrable (échec
`uv_spawn`). Un test ciblé créé et réellement exécuté au premier plan a depuis
reproduit le DLL déchargé laissant les deux E8 en place quand le wrapper est
contourné ; son contrôle avec wrapper restaure correctement. Ce résultat
bloque v17, sans attribution causale du crash live. Voir
`LOT25_V17_UNLOAD_AUDIT_2026-10-04.md` et le reçu
`lot25/v17/unload-audit-20261004T155604Z-10423954/receipt-retry1.json`.

La reprise 2 n'a jamais été armée. Après « fermé », absence de jeu et launcher
vérifiée ; trois artefacts archivés avant retrait du marker, dont le CSV de
760912957 octets copié/haché en streaming. Archive :
`tools/_tmp_af3dn_drop/captures/lot25-pass2bis-resume2-closed-ea3593dd7e1b4b13a2afb6b841df5d2f/`.
CSV et diagnostic originaux conservés en place, aucune purge.

Rollback exact depuis l'archive fraîche de reprise 2 : `3da7883f...`, 145920
octets ; sidecars stage0/dump absents. Reçus de clôture et de vérification
indépendante dans `lot25/v17/resume2-20261004T151157973518Z-d77eb136/` :
`close_rollback.json` et `close_parent_validation.json`. Aucun nouveau test,
relancement, commit ou push à cette clôture. Live bloqué avant correction.
