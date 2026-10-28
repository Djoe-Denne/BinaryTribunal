# Lot 25 pass 2 — erratum et reprise diagnostique

## Résultat conservé, causalité corrigée

La capture v16 `0x5643` reste une preuve négative pour l'objectif stage0 :
aucun kind8/9, aucun footer STAGE0_VALID. Elle ne permet **pas** de conclure
que l'installation a échoué.

Dans `lot25/gfx_driver_passthrough.c:1871`, STAGE0_VALID exige
`g_stage0Armed && g_stage0Seen`. Une installation réussie dont les sites ne
sont jamais exécutés produit donc aussi bit1=0. Le nombre total d'événements
différent entre deux combats ne démontre pas l'activation d'un type d'événement.

Relecture explicite `audit_bytes(data, build=0x5643)` le 2026-10-04 :

- dump : `35228f93d94801478d45c4ae83ee128e8b0c9b854fc36bd77e3d70f1abd02085` ;
- 39 688 620 octets, 16 frames `3556..3571` ;
- ST09 : 3 568 ; ND : 2 720 ; TX07 : 16 ; TR08 : 192 ;
- structure acceptée ; replay `incomplete=true` : ce n'est pas une preuve de
  complétude de l'état appliqué ou de fidélité UI.

Le CSV de la pass 2 a été supprimé sans archive. Cette perte n'est pas annulée
par la conservation du dump/log. Les reçus historiques ne sont pas réécrits.

## Sécurité de fermeture

La source v16 définit `Passthrough_RestoreStage0Hooks`, mais ne l'appelle pas
dans le chemin de fermeture du jeu. `Proxy_UninitAndCloseLog` est le slot 1
précédant FreeLibrary. L'export restore testé dans un harnais ne prouve donc
pas son exécution lors de la fermeture réelle.

La restauration disque vérifiée de `AF3DN.P` à
`3da7883fb9815615f309e17e7a3b8fb6f496d091739839240a7d457ba7ba9d19`
est une propriété distincte de la restauration des sites dans le processus.

## Décision de reprise

- Fork distinct `lot25/v17/`, build `0x5644`, sans modifier v13/v14/v15/v16.
- Diagnostic borné séparé : sidecar reconnu, installation/readbacks,
  compteurs d'entrée du stub y compris hors fenêtre, capture et restore.
- Pas de déplacement spéculatif de l'installation au Present, pas de
  nouveaux sites natifs, pas de changement de l'ABI `ret 12` ou des records.
- Vérifier la fermeture/unload via un vrai LoadLibrary/FreeLibrary hors jeu
  avant un nouveau déploiement. Toute lacune reste bloquante ou nommée ;
  un harnais synthétique ne prouve pas une application device réelle.
- Aucun armement live sans confirmation de l'opérateur en combat.

## Témoin visuel

`tools/_tmp_af3dn_drop/captures/visual-progress-20261004/FF8_visual_progress.png`
présente trois images historiques du lot 20 : natif, replay brut existant,
composite expérimental d'entités. La provenance et les SHA-256 sont dans le
`provenance.json` voisin. Sources inchangées ; redimensionnement proportionnel
nearest-neighbor ; aucune synchronisation same-frame prouvée, aucun score de
fidélité, aucun nouveau résultat v17. Le composite d'entités n'est pas un
replay complet du décor et de l'interface.
