# Lot 23 — nécessité live et carte future bloquée

**NOT AUTHORIZED / BLOCKED — document non exécutable.** L'autorisation « go »
couvre le travail offline seulement. Aucun lancement automatique après les
tests, aucun build-only transformé en gate de déploiement ou fidélité UI.

## Identités des exclusions

Le corpus P0 est verrouillé dans `lot22/repro_manifest.json` ; ses sources,
copies de tests, dépendances et fixtures externes sont distinguées. Les reçus
`lot23/repro_local_full.json` et `lot23/repro_export_full_external.json` attestent
17 + 6 + 19 tests réellement exécutés, zéro skip, diagnostic égal à la référence.
L'export isolé des fichiers proposés n'est **pas** un checkout committé.

- Dump v13 : `24acea32dc6dc3a25c78460be9d919d3e6ecd9fc64d2aaf630d1cf3bd2264c46`.
- Oracle render : `0eb63c416637ecda3ba93c4357be149f74c002af6d931c2f3cf6ffe3eb3a94bc`.
- Oracle dump : `e8d1e357805d6d7045b46f9807f1e5af0d10dd9c4ae81dc808a027efd6d3e98c`.
- Candidat historique `0x5641`, **NOT DEPLOYED** :
  `3ab7f5c45855f1de59c5d80481ebb2e1ac17e1e2eba4d71a6ddce9951b9d9a01`.

Tout changement de hash, codec, hook, chemin device ou surface possédée invalide
les exclusions concernées jusqu'à leur réévaluation écrite. Elles ne promeuvent
jamais le candidat et ne dispensent pas d'observer un effet revendiqué sur le
**même frame** dans un processus réel.

## Waivers bornées

### W23-01 — SET-ASIDE-VERIFIED

Calculs UV/RHW/alpha/top-left et chargement strict sur la fixture v13 inchangée.
Preuves : 23 tests Lot 17/21, notamment
`test_uv_rotation_moves_uv_only`, `test_perspective_changes_result` et
`test_shared_edge_is_owned_once_for_alpha_blend`, reçus P0 et hashes ci-dessus.
Cela ne ferme ni l'alpha-pipeline natif, ni une amélioration A/B réelle.

### W23-02 — SET-ASIDE-VERIFIED, corpus synthétique seulement

Les 19 tests Lot 22 reproduisent le comportement de leur snapshot historique
du lecteur ; ils ne prouvent pas toutes ses propriétés. Les nouveaux tests
`test_lot23_contract.py` attaquent offset/epoch, contexte absent, flags, pertes,
gates et distinction requested/committed/applied. Une réussite de ces tests ne
transforme pas le cache global historique en état appliqué par contexte.
Preuves finales, counts et hashes : rapport offline et manifeste de preuves.

Validation finale : 36 tests stricts, 13 tests purs de gate, 91 simulations
stage0 et les 42 tests de reproduction, soit 182 tests distincts, exit 0 sans
skip localement et dans l'export isolé. Le harnais natif reproduit les bytes
et hazards du candidat avec 429 assertions, exit 0 ; il ne ferme aucune
exigence LIVE-REQUIRED. Les échecs intermédiaires sont conservés dans l'historique.

Réserves explicites : plafond ST09 silencieux confirmé dans les bytes du DLL,
`g_frameOverflow` sans invalidation ST09, kinds 2/6 non suffisants pour prouver
le commit atteint/succès device, et aucune identité contexte/device dans ST09.
Les setups couverts restent **43/44/45/46/47/55**, pas 52/53/54/56.

### W23-03 — SET-ASIDE-CERTAIN-UNKNOWN

Replay **positif** depth/STP/alpha-pipeline, tant que le contrat complet manque.
Le dossier stage0/depth établit désormais une correspondance statique partielle
raw 15/16 → états device 7/23/14 et une valeur de comparaison 4. Cela réduit le
manque documentaire, **pas** le manque d'état effectif à T_draw, contexte,
HRESULT, cible/clear/Z ou pipeline alpha. Les aliases exploitables et politiques
replay restent désactivés ; RS/blend restent raw. Aucun depth par défaut, aucune
inférence STP depuis alpha127, aucune texture de remplacement pour slot 49.

### W23-04 — SET-ASIDE-CERTAIN-UNKNOWN

OT PSX global hors périmètre (prompt Lot 22 §3.3). L'ordre de soumission hôte
n'est pas une preuve d'OT global ; aucune reprise du headroom ou des conclusions
UV/RHW/fond Lot 21.

## LIVE-REQUIRED

Couplages encore non prouvés : association native état → draw par contexte et
device ; valeurs RS/blend et contenus des descripteurs ; token stage0 exact à
T_draw et distinction bind/unbind demandé versus appliqué, **après** préparation
de l'instrumentation et fermeture de ses gates ; observation du même frame pour
toute amélioration A/B revendiquée. Une capture raw-state seule n'est pas une
preuve de fidélité UI.

Jamais waivables : hashes EXE/DLL et post-copie ; processus frais sans debugger ;
préimages complètes/allowlist de toutes les écritures ; readback de chaque write ;
aucun octet adjacent écrit ; restauration byte-exacte de toutes les plages ;
processus vivant et detach ; fail-closed et rejet de témoins incomplets ou
contradictoires. Une simulation de rollback n'est pas cette preuve runtime.

## Carte future — proposition non exécutable

**Gate d'entrée NON FERMÉE.** Autorisation live séparée et explicite nécessaire.
Le candidat `0x5641` actuel n'a pas de hook stage0 et ne peut pas fermer ce manque.
Toute correction codec/instrumentation exige d'abord un candidat séparé,
build-id libre vérifié (pas de réservation `0x5642`), tests offline, préimages,
ownership/restauration et gate writer correspondante. La gate post-copie/hash
n'existe pas dans ce lot.

Périmètre proposé seulement après ces gates : un processus frais sans debugger,
une bataille `battle13`, une fenêtre de **16 frames**, une action opérateur à la
fois. Pas de second combat sans couplage nommé non couvert par le premier.
Arrêt au premier échec writer/sécurité ; aucune reprise après témoin contradictoire.

Témoins à nommer dans une future carte autorisée :

1. Identités du processus, EXE/DLL, chaque plage possédée, préimage/readback.
2. Fenêtre de frames réellement capturées, counts de draws **séparés** des ST09,
   drops/plafonds/continuité et association contexte/device fail-closed.
3. Nouvelle frame A/B identifiée et témoins état/binding/image du **même frame**.
4. Restauration de chaque plage et processus vivant/detach, sans fusion de runs.

Corrections impératives de la carte historique :

- `2512/16/16/192` est l'oracle de la **fixture v13**, pas une promesse pour une
  capture ST09 nouvelle. Les counts supplémentaires dépendent du scénario.
- `7105` est une frame historique, pas le numéro prévu d'un nouveau processus.
- Ne pas exiger tous les kinds ST09 non vides : distinguer absence légitime,
  absence de couverture et événement perdu ; init peut précéder la fenêtre.
- Ne jamais retirer stage0_missing parce qu'une campagne raw-state est verte.
- Fidélité UI **PARTIAL/BLOCKED** ; live **NOT AUTHORIZED**, même si tous les
  tests offline sont verts.
