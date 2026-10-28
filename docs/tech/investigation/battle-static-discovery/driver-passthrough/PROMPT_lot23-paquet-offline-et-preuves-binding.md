# PROMPT — Lot 23 : paquet offline reproductible et preuves du binding hérité

Préparé le **2026-10-03**, à partir du commit Lot 22 `ae20c15`.

**Statut : préparation seulement.** Ce document ne lance pas le Lot 23 et
n'autorise aucune opération live. Le prochain travail proposé est offline ;
l'implémentation d'un nouveau hook et toute campagne live restent des décisions
séparées à faire autoriser explicitement.

## 1. Mission à transmettre lors de la reprise

Finaliser la reproductibilité du paquet Lot 22, vérifier les limites du contrat
état → draw et constituer un dossier de preuve pour l'observation passive du
binding stage0. Ne pas rouvrir les conclusions UV/RHW/fond du Lot 21. Ne pas
présenter une réussite offline comme une fermeture de fidélité UI.

Ordre obligatoire :

1. Pérenniser les artefacts et leurs dépendances sans modifier les oracles.
2. Renforcer les preuves writer → reader et la distinction
   `requested` / `committed` / `applied`.
3. Préparer et tester offline les prérequis d'une instrumentation stage0 sûre,
   sans poser de hook ni modifier silencieusement le writer candidat.
4. Mettre à jour le ledger de nécessité live et produire une carte **non exécutable
   avant autorisation et fermeture des gates**.
5. Diffuser seulement les preuves stabilisées, dans un périmètre ciblé.

## 2. Préparation réellement vérifiée le 2026-10-03

- Exécution directe de Python, sans pipeline PowerShell : **42 tests OK**, code
  de sortie **0** ; `test_lot17` = 17, `test_lot21` = 6,
  `test_lot22_state` = 19. Les 23 tests de baseline sont donc conservés.
- Compilation syntaxique en mémoire des deux scripts Lot 22 : OK, code 0.
- Diagnostic v13 recalculé en mémoire : égalité du JSON décodé avec
  `captures/lot22/offline_v13/state_matrix.json`. Aucune réécriture du JSON.
- Comptes reproduits : **2512 records, 16 frames, 16 TX07, 192 TR08**,
  build `0x5640`, `BLOCKED_BY_MISSING_STATE`.
- Chargeur local `load_capture_strict_bytes()` et oracle
  `render_lot17.load_capture()` : même build et mêmes comptes sur cette fixture.
  Cela ne prouve pas leur équivalence sur tous les inputs négatifs.
- Les **9 hashes** publiés dans `CAMPAIGN_lot22_2026-10-02.md` correspondent aux
  fichiers locaux.
- Hashes avant/après les tests inchangés : writer baseline `.c/.h/.dll`,
  `AF3DN.P`, `render_lot17.py`, `ff8dump.py`, dump v13 et DLL candidate.
- **Aucun build ni harnais writer réexécuté pendant cette préparation.** La gate
  build-only du rapport Lot 22 est historique ; le hash du candidat est identique.
  Aucune gate de déploiement ni validation live n'est revendiquée.

Identités à conserver :

- Dump v13 :
  `24acea32dc6dc3a25c78460be9d919d3e6ecd9fc64d2aaf630d1cf3bd2264c46`.
- Oracle `render_lot17.py` :
  `0eb63c416637ecda3ba93c4357be149f74c002af6d931c2f3cf6ffe3eb3a94bc`.
- Oracle `ff8dump.py` :
  `e8d1e357805d6d7045b46f9807f1e5af0d10dd9c4ae81dc808a027efd6d3e98c`.
- Candidat `0x5641`, **NOT DEPLOYED** :
  `3ab7f5c45855f1de59c5d80481ebb2e1ac17e1e2eba4d71a6ddce9951b9d9a01`.

## 3. Préflight et limites intangibles

Lire d'abord `AGENT.md`, le prompt Lot 22, sa campagne, sa matrice et
`lot22/README.md`. Inspecter le statut Git avant toute édition ; préserver tous
les changements préexistants, notamment le script générique de vérification,
les configurations, les notes Obsidian et les artefacts Lot 21.

Interdits pendant la reprise offline :

- Jeu, debugger, injection, déploiement, capture live ou lecture de mémoire d'un
  processus vivant ; aucun lancement automatique en fin de tâche.
- Mutation IDB, commentaires/renames/types/patches/sauvegarde IDB, mutation des
  mémoires Serena. Si une preuve statique IDA est nécessaire, employer uniquement
  le MCP natif en lecture seule ; ne pas le contourner par HTTP ou shell.
- Modification du writer baseline physique v13 ou des deux oracles.
- `qmd update`, `qmd embed`, ingestion massive ou nettoyage du vault.
- Reprise du headroom, inférence STP depuis alpha127, depth par défaut, texture
  de fallback pour slot 49, assimilation de l'ordre de soumission hôte à l'OT
  PSX global.

Le contrat Lot 22 reste figé pour sa reproduction : build `0x5641`, ST09
`<8I>` de **32 octets**, footer ND08 ajouté de **8 octets**
(`state_epoch`, `state_flags`), plafond ND08 **0x28170**, plafond ST09
**1024 événements/frame**. `stage0_valid=false`, aliases depth indisponibles,
politiques depth/blend désactivées tant que leurs preuves manquent.

Une évolution du format/instrumentation exige un candidat séparé et un build-id
libre vérifié. Ne pas réutiliser `0x5641` pour un nouveau contrat ; `0x5642`
n'est qu'un prochain numéro possible, pas une réservation.

## 4. P0 — pérenniser avant d'étendre

Le commit `ae20c15` contient six fichiers : campagne, matrice, README, source et
header writer, harnais. Il ne contient pas l'analyseur, ses tests ou le JSON.

Artefacts Lot 22 locaux à traiter explicitement :

- `tools/_tmp_af3dn_drop/decode/analyze_lot22_state.py` ;
- `tools/_tmp_af3dn_drop/decode/test_lot22_state.py` ;
- `tools/_tmp_af3dn_drop/captures/lot22/offline_v13/state_matrix.json` ;
- prompt Lot 22 non suivi ; DLL candidate ignorée ; objet de compilation non suivi.

**Décision proposée pour la reprise :** publier l'outil/test dans un chemin
durable, par exemple `tools/af3dn_state/`, après inventaire des imports ; publier
un manifeste et un diagnostic de référence dans `driver-passthrough/lot22/`.
Ne pas committer directement `tools/_tmp_*`, forcer l'ajout du DLL ou déplacer
les oracles. Ne pas importer opportunément les autres fichiers non suivis.

Attention : `texture.py`, `test_lot21.py` et le dump de baseline sont aussi
locaux/non suivis dans l'inventaire ciblé. Les 42 tests verts dans ce workspace
ne prouvent donc pas une reproduction depuis un checkout propre.

Critères d'acceptation P0 :

- Imports et dépendances documentés ; pas de dépendance non suivie cachée.
- Tests synthétiques exécutables depuis le paquet durable.
- Baseline externe explicitement désignée et vérifiée par hash ; son absence
  produit un statut `BASELINE_MISSING`, jamais un PASS de la suite complète.
- Rerun des 23 + 19 tests avec code de sortie réel, diagnostic reproduit et
  hashes des oracles inchangés. Séparer la preuve locale et celle du checkout.
- Manifeste distinguant sources, fixtures synthétiques, fixture réelle externe,
  diagnostic généré, DLL ignorée et preuve historique du harnais.

## 5. P1 — preuves du contrat, pas seulement des fixtures Python

Établir un round-trip **writer candidat → bytes → reader**, au moyen d'un
harnais isolé chargeant une copie du DLL, jamais l'AF3DN.P déployé. Ne pas
réparer le script générique historique pour cette tâche : il sélectionnait
`LogCall` au lieu de `DumpNode`. Préparer une gate spécifique bornée, build-only,
ne comportant aucune copie vers le jeu et aucune option live implicite.

Ajouter les tests nécessaires, sans prétendre qu'ils existent déjà :

- Les quatre familles de records portent le bon build ; rejet des builds
  mixtes, tailles/troncatures invalides et footers incohérents.
- Transition avant draw, transition après draw sans contamination rétroactive,
  ordinal unique, zéro valide distinct de `unseen` et `unavailable`.
- Commit/setup réellement atteint versus chemin court-circuité ; conserver
  notamment la condition `*(cookie+0xAC4) != 0`.
- Init/uninit, changement de contexte/device et surfaces reset/perte device :
  inventorier ce qui est observé et ce qui ne l'est pas ; ne pas inventer une
  invalidation capturée pour une surface absente.
- Perte ST09/ring, trou d'epoch, saturation du plafond et reprise du cache :
  `incomplete` persiste jusqu'à un réancrage prouvé, pas de retour implicite à zéro.
- Confronter footer `state_flags` et ledger, et vérifier que chaque draw est
  rattaché à la bonne séquence d'événements de son contexte.
- Tests différentiels du chargeur local v13 et de l'oracle sur entrées négatives,
  sans modifier l'oracle.

Un événement après forward ou un commit de descripteur ne prouve pas à lui seul
le succès device. `applied` reste indisponible si le retour/chemin d'application
n'est pas établi. Garder les RS `0..25` et blend `0..4` raw ; pas de conversion
en noms depth ni en STP par analogie.

Les setups prouvés sont `43/44/45/46/47/55`. Ne pas étendre cette couverture à
`52/53/54/56` sans nouvelles preuves.

## 6. P2 — dossier stage0 et depth, sans installation

Le chemin hérité n'est pas reconstructible depuis les seuls slots proxy.
Le candidat actuel ne capture donc pas le token stage0 exact. Conserver ce
manque tant que le dossier ci-dessous n'est pas fermé.

Ancrage proposé dans le rapport : `sub_41EF3C`, appel device
`[deviceVT+0x98] @0x41EF5D`. Préimage de 15 octets :

```text
55 8B EC 83 7D 0C 00 74 33 83 7D 08 00 74 1A
```

Deux `jz rel8` sortent de la plage copiée ; l'infrastructure décrite pour le
Lot 22 ne reloge que `E8 rel32`. **Ne pas utiliser ces 15 octets comme un
trampoline brut.** Comparer un autre ancrage passif et un relocator correct avant
de choisir. Un relocator expérimental peut être testé offline sur buffers
synthétiques ; aucun detour de production ne doit être ajouté silencieusement.

Dossier requis :

- Identité EXE, VA/RVA/ImageBase explicitement distinguées : `0x41EF3C` est une
  adresse IDA, pas un RVA à réutiliser tel quel. La mention « RVA EXE » du rapport
  doit être normalisée avant toute future installation.
- Préimage complète, frontières d'instructions, cibles des branches et ABI
  prouvées ; retours précoces, registres/flags/stack et chemin d'appel device.
- Tests de relogement des branches internes/externes, cas non supportés refusés,
  rollback d'installation partielle et restauration exacte des plages possédées.
- Tokens `texobj` / `T` / TR08 corrélés sans déréférencement non gardé ; token
  runtime opaque, zéro/unbind distinct de manque d'observation, invalidations
  sur changement de device/contexte et pertes d'événements.
- Différence entre bind demandé et bind appliqué. Aucun patch de vtable device.

Pour depth, chercher d'abord une preuve statique des identifiants RS et de leurs
valeurs. Une lecture live de valeurs raw ne fournit pas automatiquement leur
sémantique. Si enum/chemin d'application/alpha-pipeline restent inconnus,
documenter le manque et garder le replay concerné désactivé.

## 7. Ledger de nécessité live à reprendre

Ces exclusions sont écrites pour éviter une répétition inutile, **pas pour
promouvoir** le candidat. Elles sont à réévaluer après tout changement de hash,
codec, hook ou surface possédée.

- **W23-01 — SET-ASIDE-VERIFIED :** calculs UV/RHW/alpha/top-left et contrat
  strict sur la fixture v13 inchangée. Preuves : suite `test_lot17` +
  `test_lot21` (23 tests), hash du dump et oracles §2. Par exemple
  `test_uv_rotation_moves_uv_only`, `test_perspective_changes_result`,
  `test_shared_edge_is_owned_once_for_alpha_blend`. Ne dispense pas d'observer
  un effet réellement revendiqué sur le même frame dans le processus.
- **W23-02 — SET-ASIDE-VERIFIED :** logique de replay sur les fixtures
  synthétiques couvertes par `test_lot22_state` (19 tests), fichiers aux hashes
  de la campagne et candidat au hash §2. Ne prouve ni les valeurs réelles ni
  l'exhaustivité des transitions natives.
- **W23-03 — SET-ASIDE-CERTAIN-UNKNOWN :** replay positif depth/STP/alpha-pipeline
  tant que leur mapping manque, attesté par campagne §6 et politiques désactivées.
  L'absence doit rester visible ; aucune valeur de remplacement. Les valeurs
  raw et la fidélité UI ne sont pas fermées par cette exclusion.
- **W23-04 — SET-ASIDE-CERTAIN-UNKNOWN :** OT PSX global hors périmètre, prompt
  Lot 22 §3.3. Aucun ordre hôte ne devient une preuve d'OT global.
- **LIVE-REQUIRED :** association réelle état → draw, valeurs blend/RS et
  contenu des descripteurs, token stage0 exact à T_draw lorsque l'instrumentation
  est prête, observation du même frame pour toute amélioration A/B revendiquée.
- **LIVE-REQUIRED, jamais waivable :** hashes EXE/DLL, processus frais sans
  debugger, allowlist/préimages/readback de toutes les écritures autorisées,
  restauration byte-exacte, processus vivant et detach ; rejet des témoins
  incomplets/contradictoires et respect du fail-closed.

Carte future, **bloquée aujourd'hui** : un processus frais, une bataille
`battle13`, une fenêtre de 16 frames, une action opérateur à la fois. Aucun
second combat sans couplage nommé. Stop au premier échec de sécurité ou writer.

Corrections à apporter à la carte historique avant de la réutiliser :

- `2512/16/16/192` est l'oracle de la **fixture v13**, pas un nombre garanti pour
  une nouvelle capture avec ST09. Valider séparément records de dessin et events.
- Ne pas exiger tous les kinds ST09 non vides sans preuve que le scénario les
  déclenche. Distinguer absence légitime, absence de couverture et drop.
- `7105` désigne la frame de la fixture historique ; ne pas promettre que le
  nouveau processus aura le même numéro. Nommer la frame nouvelle et ses témoins.
- Le DLL `0x5641` actuel ne peut pas fermer le binding stage0 : pas de hook
  implémenté, `stage0_valid=false`. Une campagne raw-state seule ne devient pas
  une preuve de fidélité UI.
- La gate post-copie/hash et l'autorisation live restent à obtenir. Ne jamais
  exécuter cette carte à partir de la seule demande « prépare la suite ».

## 8. Livrables et verdicts attendus de la reprise

- Paquet durable reader/tests, manifeste des dépendances et fixture v13 externe.
- Rapport offline distinct de la campagne Lot 22 ; preuve round-trip et gate
  build-only spécifique si réalisées, sinon marquées manquantes.
- Dossier d'instrumentation passive et trous depth/alpha explicitement nommés.
- Ledger révisé et carte future gardée `NOT AUTHORIZED / BLOCKED`.
- Après stabilisation seulement : proposition d'ingestion Obsidian ciblée des
  preuves Lot 22/23, hashes source et validation locale ; ne pas certifier la
  fraîcheur de QMD sur la seule présence de pages. Aucune ingestion n'a été faite
  pendant cette préparation.

Verdicts séparés : **reproductibilité**, **contrat offline**, **sécurité du dossier
d'instrumentation**, **fidélité UI**, **autorisation live**. Les trois premiers
peuvent progresser offline ; fidélité reste `PARTIAL/BLOCKED` et live
`NOT AUTHORIZED` tant que leurs gates ne sont pas fermées.

## 9. Sources et commande de contrôle locale

Sources prioritaires, chemins relatifs à ce répertoire :

- `PROMPT_lot22-etats-blend-depth-binding-offline.md` ;
- `CAMPAIGN_lot22_2026-10-02.md`, `STATE_MATRIX_lot22.md`, `lot22/README.md` ;
- `CLOSURE_walkdirect-bind.md` et closures texture/cookie ;
- `CAMPAIGN_lot21_2026-10-01.md`, reçus `IDB_SYNC_lot21_2026-10-02.*`.

Commande locale reproduite, depuis `tools/_tmp_af3dn_drop/decode/` :

```powershell
python -B -m unittest -v test_lot17 test_lot21 test_lot22_state
if ($LASTEXITCODE -ne 0) { throw "Echec des tests offline ($LASTEXITCODE)" }
```

Ne pas conclure sur le seul texte `OK` d'une pipeline ; conserver le code de
sortie du processus Python. Aucun commit, déplacement de source ou travail du
Lot 23 n'est réalisé par la création de ce prompt.
