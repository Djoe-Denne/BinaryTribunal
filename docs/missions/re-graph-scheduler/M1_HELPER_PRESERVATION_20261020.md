# M1 / B — Conservation du développement helper Windows, 2026-10-20

**Préservation locale effectuée, 100 % byte-exacte ; aucun retrait ni rebuild/test.**
Autorité : §5B de l'ordre M1 et mandat Git borné explicite du superviseur.
L'intégration au contenu livré de main reste réservée à l'étape E.

## Index de conservation

- Branche : **`dev/windows-process-supervision`**.
- Worktree dédié **hors du dépôt principal** :
  `C:/Users/djden/source/repos/retro-eng/re-ff8-helper-win-wt`.
- Commit local : **`9f789ff931a3dfe2aeb6497addd067368faffb88`**,
  parent `bba8eb91f38828cab88251a9be0de1f5f179fb1b`.
- Racine détenue : `windows-process-supervision/` dans ce worktree.
  Lire son `README.md` et son `PRESERVATION_MANIFEST.json` versionnés.
- **1 471 fichiers copiés / 17 919 783 octets**, uniquement les sources,
  paquets/contrats, références, gates, reçus et petits artefacts du helper
  sélectionnés par l'inventaire T1 et le producteur de conservation.
  Aucun miroir de tout `.tmp/`, aucun gros RAW scientifique, aucun `node_modules`.
- Sources : **325 `.cs` du checkout principal**, avec leurs anciennes révisions
  et QA rouges/corrigées ; **43 copies `.cs` externes** des racines Temp précises,
  dont **les deux runners sans copie dans re-ff8**. Les copies externes restantes
  préservent les sources exactes des compilations historiques.
- **20 PE managés conservés** : le RunnerMatrix interne et les 19 PE des racines
  Temp identifiées par T1, copies compile/run et anciens rouges inclus.
- Le commit ajoute **1 476 fichiers sous la seule racine détenue** : les 1 471
  copies et cinq fichiers d'index/production/protection. Les **2 673 entrées
  baseline restent identiques** ; aucune autre modification de l'arbre de base.

Le [JSON de conservation](M1_HELPER_PRESERVATION_20261020.json) donne, pour
**chaque copie**, origine, destination relative au worktree, taille, SHA-256
source avant/après, destination, blob Git stocké, identités finales et rôle.
Il contient aussi le commit/arbre/parent et les contrôles de main. Ce JSON est
un reçu généré de conservation, pas un nouveau résultat de qualification.

Manifest versionné :
`47f8cc88fd7e9cdf7a85702b4d6426e62b217762a291c8575e44c7765d90102d`.
Le même hash a été relu dans son blob Git. Le JSON d'index sur main porte le SHA
`b4493b8b2e0931f831f1b6cfa880620a3a59f19e97aacd2a571d6f2b030fe1b3`.

### Deux runners externes préservés

- Origine `E/V3ASM2-77be4f35f8/in/BatchTestRunner.cs`, 2 205 B,
  SHA `cab18f3055bea831da25605f34017fac26c343b420d4cfd6b965bb5ffb44fa0d`.
- Origine `E/V3MEM-9c1ae2d7b4/inputs/BudgetMemoryRunner.cs`, 2 678 B,
  SHA `cd00d0915a8f935b674a384b321211a431997a4b59a94b19798234527650763d`.

`E` = `C:/Users/djden/AppData/Local/Temp/opencode` ; destinations sous
`windows-process-supervision/preserved/external/`, même chemin relatif après E.
Le JSON développe les chemins absolus et vérifie les octets source/destination.

## Contrôle d'identité et protection des changements étrangers

**1 471/1 471 copies conformes, zéro mismatch**, avant toute considération de
retrait, puis après copie et à nouveau **dans les blobs du commit**. Le contrôle
des blobs a confirmé que l'ajout Git ne normalise pas les octets/CRLF : attributs
`-text -filter -ident` bornés à l'archive. Aucun retrait n'a été fait.

HEAD main reste `bba8eb91f38828cab88251a9be0de1f5f179fb1b` ; SHA-256 de son index
avant/après : `d51d5957af0af0ccb953d30d8ac2164f90e356aad6d394926f6ad80b6c932ceb`.
Les **269 gardes source du harnais principal** sont exactes avant/après copie.
La branche a été créée depuis HEAD, pas depuis les changements utilisateur ;
seule la whitelist helper a été copiée dans une nouvelle racine. Aucun add,
commit, checkout/switch, stash/reset/clean/push/amend sur main, aucun `-f`.
Git a signalé son packing automatique lors du commit ; aucun gc/prune/nettoyage
manuel n'a été lancé. Lecture des objets packés pour le readback, sans commande
Git supplémentaire.

Sur main, les seules nouvelles écritures de cette étape sont ce fichier et son
JSON. Les originaux de toutes les copies restent en place. Cela ne prétend pas
auditer les éventuelles écritures concurrentes d'autres propriétaires.

## Scénario → preuve conservée

- **Q01–Q12 / DATA_ONLY** : Q1 R3 + QA R2/R3 identique, goldens argv/env/pins/
  canonique/refus ; `full44-q1-data-{compile,run}-receipt.json`, green verification
  et `FULL44_Q1_DATA_QUALIFIED_20261019.md` ; 632 assertions, pas cible exécutée.
- **B01–B18 / heap** : broker R2, permis/pools/budgets/GTC1/finalisation jusqu'à
  WaitingACK ; reçus `full44-q2a-r2-{compile,heap-run}` + parent green et rapport
  Q2a ; 18 groupes/69 759 assertions. R1 CORRIGE également conservé.
- **D01–D30 / heap** : deux flux, EOF/permis/refus/réentrance et bornes ; reçus
  `full44-q2b1-r2-{compile,heap-run}` + parent green ; 72 cas/7 122 assertions,
  race particulière statique seulement, pas de progrès natif qualifié.
- **V01–V04 / mémoire** : `v3-batchrun-receipt-20261017.json`, sources QA corrigées,
  reçus d'assembly et BatchTestRunner ; quatre suites fakes/MemoryStream.
  BudgetMemoryRunner, première exécution rouge et correction/réexécution distinctes.
- **N01 / naturel** : `v3-slice2-receipt-20261017.json` ; **N02–N06** :
  `v3-matrix-summary.json`, paquet `v3-evidence-review/inputs` complet et
  `V3_MATRIX_SUBGATES_RESULTS_20261018.md` ; cinq faits conditionnels, records et
  logs conservés, pas PASS global.
- **JobRunner/Fixture/newline** : versions, références Microsoft, contrats,
  compilations réussies/échouées et readiness HOLD conservés ; compilation du
  DLL ne signifie pas que le wrapper Add-Type a été importé/exécuté.

Les chemins précis des preuves copiées et l'inventaire des 112 familles sont
versionnés dans l'archive. Les anciens chemins absolus/GO one-shot restent
historiques : ne pas lancer ces scripts comme une nouvelle autorisation.

## Limites et arbitrages conservés

Budgets **cross-process NOT_PROVEN** ; **last-close/case6 NOT_ESTABLISHED**.
D/S sont events stand-ins et G un thread postRun/préACK, pas une preuve complète
de perte de processus indépendants. Heap ne prouve ni vrais pipes/cancel/join/
ACK/Closed/release, ni durabilité des writers physiques, heap global, sandbox
FS/réseau, full44/125s, Linux ou G5–G7. Aucun nouveau build/test/import n'a été fait.

Les **deux scripts power/CampaignSuspend sont uniquement référencés**, jamais
copiés ni lancés. `ConsoleProbe` hors ownership helper est également seulement
référencé. Les outils système Framework64/PowerShell ne sont pas copiés/installés :
leurs pins demeurent dans les reçus. Les traces scientifiques massives restent
aux originaux référencés ; aucune copie bulk ni destruction de preuve.

Les contrats/garanties RMS partagés sont conservés, **pas dispensés** : leurs
équivalents sans C# et la validation de non-régression relèvent de C/D. Rebuild,
tests supplémentaires, retrait et intégration E exigent les autorisations
correspondantes du superviseur.
