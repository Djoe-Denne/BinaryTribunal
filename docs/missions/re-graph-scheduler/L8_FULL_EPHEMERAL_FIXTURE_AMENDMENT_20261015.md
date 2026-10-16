# L8 full — clarification des fixtures éphémères, zéro tentative déjà lancée

Même task task_mv6towrm_000c_24005n, commande et gel inchangés. Préflight STOP
b121d54071f5e16e6ae769991891bc107ba8f258d21b84b815af11ca497ba62a vérifié :
**aucun bun test/full/DB/TEMPenfant créé**, pas échec source ; créneau libéré.
La formulation parent «toutes DB enfant conservées» contredisait les suppressions
historiques du corpus. Cet amendement remplace **cette seule exigence générale**
de L8_PHASE_A_V2_FULL_GATE, pas les protections des vraies preuves ni les autres GO.
Lire/hash/ACK puis attendre **nouvelle réservation et FINAL FULL GO distincts**.

## Classe éphémère explicitement autorisée

Parent inventorie les appels de suppression des28fichiersTS du test corpus et lit
les cibles/créations. Les hooks/opérations préexistants ci-dessous sont autorisés
sur **leurs seules créations du futur run**, STRICTEMENT dans le **TEMP/TMP enfant
unique frais** (tmpdir() de l'enfant y résout aussi), jamais sur un ancien répertoire :

- adapter.test.ts:15,24 — racine mkdtemp ff8-projection-, son native.asm synthétique ;
- client.test.ts:19 — racine mkdtemp ff8-client-, propre client.db ;
- engine.test.ts:357,533–535 — ff8-recovery-UUID {engine,target}.sqlite et sidecars,
  ff8-public-reopen-UUID/engine.sqlite,target.sqlite/outputs/knowledge créés localement ;
- eventlog.test.ts:20–21 — mkdtemp enfant/opencode/ff8-graph-, own/foreign/ensemble.db
  synthétiques et sidecars, dossier créé par path() de CE run ; pas DB Ensemble réelle ;
- ida-publication.test.ts:13 — mkdtemp ff8-publication-, fake port, fichiers synthétiques ;
- inputs.test.ts:45 — enfant/opencode/ff8-knowledge-UUID et son factJSON créé par ce test ;
- native-canary-strict.test.ts:33 — mkdtemp ff8-canary-stop-, marker purement fixture ;
- readable-projections.test.ts:12,203,211 — mkdtemp ff8-readable-projections-, ses
  copies/projections synthétiques ; les suppressions intra-test d'absence sont incluses ;
- store.test.ts:23,34 — enfant/opencode/ff8-store-UUID.sqlite,ff8-foreign-UUID.sqlite
  et sidecars, créés par ces deux tests ;
- strict-adapter.test.ts:11 — mkdtemp ff8-strict-adapter- et son contenu fixture.

Hors enfant, seules exceptions déjà autorisées inchangées : re-policy.test.ts:15
sur ses mkdtemp ff8-re-policy-* de CE run et runtime.test.ts:15 sur ses mkdtemp
ff8-runtime-test-* de CE run sous LocalTemp/opencode. Pas nouveau namespace ni glob.
Liste/hashes exacts du code readonly fournis dans CLEANUP_INVENTORY.json ; toute
diff de code/cible ou chemin non possédé → STOP avant élargissement.

Ce sont des **fixtures éphémères de tests**, pas evidence de campagne. Leurs hooks
restent tels quels : pas patch/interception pour changer le test ou le faire passer.
**Aucune promesse de conservation/hash après destruction**, ni digest antérieur
reconstitué. Les logs/code/exit attestent seulement l'exécution des tests ; pas de
prétention de byte-readback sur un fichier déjà supprimé. Pas cleanup manuel.
Les close/cleanup existants s'appliquent normalement ; erreur hook/test → FAIL
rapporté, pas suppression de confort ou récupération d'une autre fixture.

## Classes toujours conservées sans exception

DB/preuves L8 l8-central-v2-* créées par CE full, per-close receipts/registry-tail ;
L5budget sous enfant/l5-admission-budget-*/own.db ; tous gels/inputs/archives/logs,
preuves parent/auteur historiques et DB déjà conservées. **Aucun hook ci-dessus
n'est autorisé à viser ces classes**, même sous l'enfant. Nouveau DB présent non
couvert → conserver/STOP, pas inventer son statut après coup. Aucun inventaire Temp ancien.

TEMP/TMP enfant fresh/opencode, LOCALAPPDATA/global inchangés, commande unique
bun test --timeout30000/bornée420s et pins15/398/225/12/archives inchangés.
Préflight précédent =0invocation : la prochaine tentative réelle, si autorisée,
reste la première. Capture registry avant/tail après, comptes effectifs, fin/libération
explicites, pas patch/rerun si rouge. Pas native/LLM/dispatch/réseau externe/Git.
L7repros/PLAN seulement indépendants, aucune gate lourde simultanée ou code autorisé
par cette clarification ; future review L8 runtime15+gates parent toujours requises.
