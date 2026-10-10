# Pilote local — C relu contre ASM et sémantique adaptative (2026-10-09)

Statut : **autorisé pour test, pas adopté globalement**. SETUP seulement ; aucun worker lancé ni push IDB ici.
Autorisation utilisateur : « Du coup, tu n'as pas repris les décompilations ? Et tu peux mettre en place la nouvelle stratégie que tu proposes, pour tester ».
Base effective inspectée : `beac4ea2b7a1b1f1c5f0b7a2f1deef60944ebb33` ; audit indépendant gelé sur `a2791cd`.
Registre machine-readable : [PILOT_adaptive-decomp-semantic-2026-10-09.registry.json](PILOT_adaptive-decomp-semantic-2026-10-09.registry.json).
Suivi : [plan](PLAN_gfx-battleloop-campaign-2026-10-08.md), [journal](CAMPAIGN_LOG_gfx-battleloop-2026-10-08.md).

## 1. Décision bornée et divergences explicites au canon

Le HANDOFF §5.2 impose >200 instructions → 2+1 ; le PLAN du 8 octobre prescrit dual-gen C systématique ; PROMPT §127–165 conserve les anciens moteurs/packs. **Dans les SIX EA ci-dessous uniquement**, la taille >200 n'est plus un déclencheur suffisant : C = génération + review ASM indépendante ; sémantique = **1+V**, avec escalade sur preuves. Pas de 1+P dans cette cohorte, même pour les petits. Les récupérations/corrections historiques restent hors expérimentation et hors exception de taille. Hors cohorte, conserver le canon ; ne pas étendre automatiquement le pilote à toute la file.

Cette autorisation explicite remplace localement les anciens modèles Grok/GLM-Max/Astra et la dual-gen obligatoire. Elle ne modifie aucun default/frontmatter global. Tous les appels workers ont un **override modèle explicite** :

- Pack et génération C primaire : `zai-coding-plan/glm-5.3-flash#high`.
- Review C exhaustive, sémantique A, reviewer V : `openai/gpt-6.1-sol#high`, **trois rôles/sessions distincts**.
- C-B et sémantique B de contrôle/escalade : Sol high permis, deux rôles/sessions distincts ; R Sol high ou adjudication parent contre ASM, jamais vote majoritaire.
- Catalogue modèles reconfirmé au SETUP : les deux références sont active, variante high disponible. Disponibilité catalogue ≠ succès futur du provider. Aucun Astra/Luna/autre provider, aucun fallback silencieux.

Le PLAN ancien mentionne SetType ; l'interdit HANDOFF/PROMPT et la mission actuelle gagnent : **pas de SetType, rename, patch, debugger, runtime ni service/DB mutation**. §5.6 reste impératif, en IDA natif statique (le mot « live » signifie lecture de l'IDB ouvert, pas observation du jeu).
Conserver tous les chunks, CFG, tables/switch et retours ; **>600 instructions = régions + matrice de couverture totale**, pas une dispense. Plusieurs chunks demandent couverture prouvée ; couverture manquante → escalade, jamais acceptation par taille.

## 2. Cohorte pré-spécifiée, avant résultats

Inventaire case-insensitive `decomp/<EA>__*.md` et `semantic/<EA>__*.md` : **aucun artefact pour ces six**, y compris non suivis, à la base inspectée. EAs tirés du PLAN réel, débuts de fonction confirmés dans IDA. Nombre = instructions CODE sur tous les chunks (pas les estimations du PLAN).

- **P1** `0x509B30`, D4, `BattleGeom_SetCurrentBoneMatrix`, **9**, ≤80, un chunk `[0x509B30,0x509B46)`. Famille setter matrice courante ; contrôle simple attendu ; **contrôle B préassigné**.
- **P2** `0x48F020`, G19, `domain::Battle_GetRandomInt`, **10**, ≤80, `[0x48F020,0x48F049)`. Famille tirage RNG ; piège potentiel largeur AL, pas une conclusion acquise.
- **P3** `0x464BD0`, C13, `World_loadTextureVRAM_updateAnim`, **155**, 81–200, `[0x464BD0,0x464DA1)`. Famille animation VRAM ; nom/périmètre à vérifier ; **contrôle B préassigné**.
- **P4** `0x486A10`, G16, `domain::BattleMagic_MutateStock`, **116**, 81–200, `[0x486A10,0x486B34)`. Famille mutation stock magie ; contrôle domaine/arithmétique.
- **P5** `0x4653B0`, C14, `isUpdateVRAMOrSomething`, **268**, >200, `[0x4653B0,0x465720)`. Famille file de transfert texture/backend ; ambiguïté attendue ; **contrôle B préassigné**.
- **P6** `0x4847F0`, G10, `domain::BattlePendingAction_TransferToExecQueue`, **285**, >200, `[0x4847F0,0x484C00)`. Famille transfert pending→exec ; invariants occupancy à vérifier.

Un représentant par famille opérationnelle, sans clones connus sélectionnés. Les helpers communs n'établissent pas l'indépendance statistique ; si le pack révèle une famille clone, enregistrer le chevauchement et ne pas compter deux familles. Deux EA/bin donnent une comparaison de faisabilité minimale ; trois contrôles (un/bin) cherchent les erreurs manquées sans doubler systématiquement la production. **Ni puissance statistique, ni preuve universelle**. Le contrôle coûte plus et est compté séparément. D3 `0x500EA0` a 62 instructions natives, contrairement à ~110 dans le PLAN : exclu du bin intermédiaire, pas d'estimation inventée.
Pas de remplacement opportuniste selon résultats ; indisponibilité/non-nouveauté → case manquante explicite et arbitrage enregistré. Aucun élargissement automatique au-delà des six.

## 3. Packs neutres et indépendance réellement vérifiable

Créer un nouveau sous-dossier versionné localement `tools/_tmp_semantic_triple/<ea>/pilot-2026-10-09/` ; ne pas écraser les sources historiques. Flash rassemble §5.1 depuis ASM IDA natif, chunks/CFG complets, pile, arguments/cleanups, xrefs CODE/DATA et snippets numériques callers/callees. Hash source octets/chunks et hash de CHAQUE fichier avec manifest de lecture autorisée, version/digest agrégé. Si source change : nouvelle génération gelée, pas comparaison silencieuse de versions.

Séparer `neutral/` de `context/`. Pack neutre sans noms métiers, commentaires IDA/prototypes sémantiques, verdicts anciens, wiki, hints, Hex-Rays ni C historique ; labels Intel numériques `loc_`/`sub_` et offsets/largeurs factuels seulement. Métadonnées neutres : EA numérique, chunks, ABI constatée, hash, compteur, graphes numériques, aucune hypothèse de rôle. Les sources §5.1 GrepAI et QMD CLI sont collectées/citées dans `context/`, **pas autorisées aux générations/blind B**. Pas de MCP QMD, pas de `qmd update/embed` ; pas de reconfiguration Serena/GrepAI communs `retro-eng`.

Contrôler le contenu et les lectures effectives (messages/tools exposés, chemins et digests), pas seulement la promesse du prompt. Une lecture native IDA affichant nom/commentaire métier est également contamination : pour blind, décoder sous forme numérique sans commentaire. Traçabilité insuffisante/troncature → blind `unverified`, jamais « prouvé indépendant ». Un rôle reviewer connaissant A est indépendant par **session/rôle**, mais **pas aveugle**. Ne jamais fusionner auteurs/review sous ce label.

Sémantique A reçoit pack neutre + **C corrigé après review**, sans verdict/notes reviewer. V reçoit A + ASM neutre/arbre, pas seulement les conclusions C. Les conclusions descriptives aveugles sont gelées avant comparaison au nom catalogue ; parent peut ensuite fournir le nom/context pertinent dans une phase explicitement non aveugle, avec provenance, sans remplacer le gelé. CERTAIN requiert ancrages callers/callees et contexte corroboré conformément au canon ; ne pas inventer alignement wiki absent.

## 4. Pipeline effectif et escalade

Ordre par EA : pack gelé → Flash C-A gelé → Sol review C → fix ciblé → re-review de la version corrigée → C prêt → Sol A → Sol V → gel A/V et candidat pré-escalade → contrôles éventuels/escalade → parent §5.6 + propagation finale → IDB/save/readback → commit ciblé.

Review C exhaustive : matrice instruction/région→C couvrant tous blocs/edges/switch, calls/stack cleanup groupé, arguments cdecl droite→gauche, ABI, AL/AX/EAX, signedness (`ja/jb` vs `jg/jl`), strides développés, adresse vs contenu, x87, wrap/shifts masqués x86 et limites du modèle C, reloads après helpers, alias et ordre mémoire. Aucun call de bibliothèque inventé. Rapport `ACCEPTE | CORRIGE | ESCALADE`, 3–8 ancrages au moins, matrice exhaustive sur disque. **Fix accepté dans des notes ≠ fix propagé au C final**.

Un défaut C fermable par patch ciblé + re-review contre ASM de l'artefact corrigé n'impose pas automatiquement C-B. Fautes typographiques/cosmétiques ne déclenchent pas un second auteur. En revanche **désaccord substantiel persistant, couverture/chunks manquants, ABI/retour/invariants/ordre/reloads non fermés, reviewer analytique en échec ou ambiguïté non tranchée** → C dual-gen + R. R doit aussi chercher erreur commune et fausse alerte du reviewer. Si incertitude demeure, livrer UNCERTAIN sans promotion.

Sémantique 1+V, contrats HANDOFF §5.3–5.5. B blind + R si A trop large/mensonger/UNCERTAIN/CONFLICT, désaccord V sur rôle/nom/confiance, `ESCALADE_2+1`, couverture/contrat non fermé ou **échec §5.6 parent**. Pas seuil taille seul dans la cohorte. Une CORRIGE substantielle de rôle/nom/confiance reste un déclencheur ; ne pas la rebaptiser simple typo pour éviter B. Les corrections C peuvent être fermées séparément sans simuler une divergence sémantique.

Pas de remplacement par analyse parent solo après refus du worker. Refus de mission/outils/provider = **statut technique**, pas erreur analytique ni vote. Refus spawn, funds/quota, OOM, provider inaccessible ou refus de mission : **arrêt checkpoint**, pas boucle retry/fallback solo. Corriger ensuite brief/périmètre sous autorisation, sans prétendre que C11 démontrait OOM/quota. IDA MCP indisponible = arrêt, pas HTTP/curl.

## 5. Sous-échantillon contrôle (P1/P3/P5)

Geler avant B : C-A original, C après review, rapport C-review et candidat pré-escalade, A, V et leurs conclusions/digests/temps. Conserver les versions, même si elles changent ensuite. **Puis**, même si V accepte et aucun trigger ne s'est produit :

1. C-B Sol high, session neuve, ASM/pack neutre seulement, **sans C-A/C corrigé/C-review/A/V/R/context/legacy labels**.
2. Sémantique B Sol high, autre session neuve, ASM/pack neutre seulement ; sans C-B aussi, ni C-A/A/V/R/context/legacy labels. Pas de rôle fusionné.
3. R/parent adjudique chaque divergence contre ASM natif, compare les découvertes B à **V et C-review gelés**, prouve inédit ou déjà trouvé. Ne pas attribuer à B une découverte nouvelle de R.

Si escalade déjà requise, réutiliser le B réellement neutre s'il satisfait exactement ce contrat ; enregistrer contrôle ET trigger sans double comptage de coût. A sémantique voit C corrigé tandis que B ne le voit pas : asymétrie **pré-spécifiée**, pas expérience causalement isolée de modèles. Un B contaminé reste traçable mais exclu du dénominateur blind (pas retry automatique). Le contrôle intervient avant promotion finale, et son coût n'est pas présenté comme coût de production adaptative.

## 6. Priorités continuation (hors métriques primaires)

1. **C6/C10 récupération** : le snapshot demandé `a3abf93` est dépassé. Le journal à `beac4ea` contient les réceptions tardives : C10 V/R et C6 R ont rendu completed ; drafts sur disque, aucun push/promotion. Avant toute duplication, inspecter via API sessions **read-only** les finales et statuts de `ses_ede37c5e5ffeGwPuq4AS9ZCdCT` (C6 R) et `ses_ede34a2c6ffeFD82jLrhgNtMzF` (C10 V/R). Ne pas re-générer deux C inutilement. Parent contrôle §5.6, hash/propagation et drafts ; clôture seulement si vert. C6 historique « fail ret 0 » : preuve de correction append, sans réécrire ancien commentaire. C1/C9 déjà clos (`e1c1247`, `ad5fd19`), **ne pas refaire**.
2. **C11** `0x45BE70` : nouveau pack vraiment neutre ; les générations avec hints restent historiques, jamais comptées blind. Récupération hors six métriques primaires ; ajout à la cohorte nécessiterait un avenant, pas ici. Refus historique `ses_ede33f040ffeHeJqhXpO4KWTBA` à lire dans le journal sous son identifiant exact (ne pas inventer une activité actuelle).
3. **J3** `0x5A6D20` : vérifier ASM natif les recharges phase après Camera `0x5A6F88`, slot `0x5A6FF2/0x5A7058`, patcher le C final et faire review indépendante. **A8/A10** `0x5BD460`/`0x5EF910` : vérifier SAR r32,CL masque cinq bits, fausse alerte R « &31 inventé » ; corriger corps ET explication sur preuve/review. Révisions historiques séparées, anciennes conclusions conservées/citées, pas effacées. Les packs de l'audit sont indices, pas preuve d'équivalence actuelle.
4. Avant toute promotion de nouvelles clôtures pilote, fermer ces réparations historiques ou enregistrer un blocage explicite et checkpoint ; ne pas masquer l'incertitude par six nouvelles promotions. Les pipelines nouveaux peuvent avancer en drafts disjoints, sans promotion anticipée.

Préimages/tags historiques restent append-only : un tag existant implique skip de push ordinaire ; une correction autorisée requiert **avenant daté distinct**, pas suppression/remplacement du commentaire ni duplicate du tag. §5.6/save/readback obligatoires pour tout append. Aucun changement IDB au SETUP.

## 7. Registre, mesures et validation finale

Le JSON contient six records, leur source SHA/chunks, familles/bins/control et un template **copié dans chaque record avant exécution**. null = non observé/pending, jamais zéro. Les événements horodatés append-only conservent protocol **ACTUAL**, rôles/model override/sessionIDs, sources/générations/digests/manifest, lecture réelle et contamination, gels avant B, temps et usage observés input/output/cache/reasoning/cost si exposé. Aucun tarif inventé, zéro enregistré ≠ gratuit, reasoning/output pas supposés disjoints.

Chaque défaut : preuve ASM (EA/opcode + fichier/lignes/version), auteur/étape, adjudication parent, classe **matériel faux**, **conditionnel sans invariant établi**, **prose cosmétique**, **hors domaine/UB** ; noter erreur commune, faux positif R, rectification V et correctif B **inédit versus version V/C-review gelée**. Séparer erreurs de C et de sémantique, observations runtime absentes, infra/reprises/contamination des erreurs analytiques. Conserver remaining_uncertain, pas « clos » par simple prose worker.

Avant tout push : parent exécute **lui-même** §5.6 en ASM IDA natif (callee+argc/cleanup ; callers CODE/DATA ; strides chiffrés ; polarités ; largeur retour ; ≥2 preuves nom), et lit le **fichier final réellement destiné à git**. Check propagation : corrections toutes présentes dans bloc C/commentaires/résumé/provenance, couverture instructions/chunks/CFG, cleanups, strides, widths, shifts, reloads, ordre mémoire. Digests candidats et final ; modèle/backend non testé et absence de runtime explicités. Échec bloquant → escalade ou UNCERTAIN, aucun push prétendu conforme.

Append via `set_func_cmt`, tag daté non dupliqué ; `idc.save_database(idc.get_idb_path())` après CHAQUE push ; résultat true et readback exact + digest/tag count. Les workers n'écrivent ni IDB ni git. Push/§5.6/commit sérialisés. Au plus cinq workers indépendants, un EA/rôle par instance, aucun sous-spawn. Commit par clôture `semantic(battle): <EA> <nom-court>` PowerShell here-string, fichiers semantic/decomp exacts (+ ledger seulement classe changée). Mises à jour protocole/registre/journal autorisées explicitement par ce pilote, commits suivi séparés. Jamais `add .`, amend, reset, no-verify, push remote ni autres M utilisateur/configs/tmp/vault.

Rapports : fractions séparées **par EA ET par famille**, par bin et statut production/control/recovered ; coverage complet/pending/exclu ; dénominateurs non ambigus. Au premier checkpoint, plusieurs pipelines complets si possible ; **pas nécessaire six clos**. Donner bénéfice marginal B, erreurs communes/alertes fausses, incertitudes et coût observé du contrôle séparément. Audit : ≥12/22 ensembles C avec au moins un auteur faux ≠ taux des C finaux/modèles ; V≥2/8 rectifie ; B après V 0/3 inédit et Sol 0/2 divergence algorithmique **ne prouvent pas absence d'erreurs**. Corpus 33 EA, 94 sessions/2180 messages publics, 32 tronqués et origines septembre partielles ; aucune équivalence/compilation/runtime générale validée.

## 8. Handoff SETUP → CONTINUATION

Session superviseur `ses_ede295648ffe946nUdUdHFevqT`. SETUP : six sources/métadonnées lues statiquement, registre/avenants seulement, aucun worker/API ancienne session/IDB write. La continuation inspecte d'abord l'état read-only C6/C10, puis suit §6. Aucun diagnostic infra large. Si arrêt technique, conserver checkpoint drafts/usage/statuts exacts et retourner au parent ; ne pas changer de stratégie silencieusement.

## 9. Avenant capacité/fallback/recyclage — 2026-10-10

Dernière autorisation utilisateur : **12 agents TOTAL = 1 superviseur + 11 slots workers**, non 12 workers. Le [pool continu](POLICY_campaign-pool-2026-10-10.md) et la [queue réelle](CAMPAIGN_POOL_2026-10-10.json) supersèdent les anciens plafonds 3/5/batch et l'arrêt systématique sur échec Flash/ownership ; les snapshots historiques restent inchangés.

Une tâche Flash échouée techniquement/refusée/incomplète inutilisable reçoit une seule tentative fraîche Sol high, même rôle/inputs conservés ; provenance/partiels et usage séparés. P3 ancien Flash interrompu sans pack/C final a son remplacement Sol **réservé non lancé**. Les sessions enfants étrangères ne sont pas reprises ; remplacements possédés autorisés. Pas de nouvelle boucle/fallback solo. Sol global indisponible, IDA nécessaire absent ou OOM critique → checkpoint sûr.

Chaque slot libéré prend immédiatement un travail READY autorisé, sans attendre un batch ; contextes aveugles/reviews indépendantes restent frais et disjoints. §5.6/IDB/git parent sérialisés, J3 gate/push/commit avant nouvelles promotions. La largeur 11 est une politique vérifiée, **pas un setting runtime inventé** ; depth2/permissions V2 existants confirmés, config locale inchangée.

Setup foreground uniquement : queue 62 tâches, six workers READY + deux opérations superviseur READY, onze slots workers BLOCKED jusqu'au GO long du parent. P2 A bloqué sur neutral-v2/gate : v1 contient encore des commentaires EAX hauts=idx faux ; aucun v1/C accepté modifié. Digests des inputs réels et huit gels P1 revalidés. `python tools/validate_campaign_pool.py --self-test` : neuf tests offline PASS, aucun dispatch/IDB write/action d'alimentation. L'adaptatif demeure local aux six ; aucun résultat pilote supplémentaire accepté ni extension globale.

Receipt runtime suivant : garde native input/IDB/SHA réussie, équipe Ensemble `ff8-pilot-20261010` créée, six sessions effectivement créées mais **six outcomes API failed, zéro token/résultat**, overrides stockés `id=...#high`, `variant=default`. Voir policy « Receipt runtime Ensemble » et queue `ensemble_run_2026_10_10` pour IDs/digests réels. Ce snapshot supersède l'ancienne absence native comme état courant, pas les mesures antérieures. Arrêt global **modèle/harness**, aucune panne provider/IDA inférée, aucun résultat/promotion pilote ajouté. Vérifier le Model.Ref natif avant toute extension future du pool, ne pas accepter high silencieusement perdu ; réparation interface ou alternative harness à autoriser, sans boucle ni fallback solo.

## 10. Migration native autorisée / setup canary — 2026-10-10

Réponse utilisateur explicite « oui » au harness **natif OpenCode**, sans perdre
12 total, Flash→Sol et high effectif. Superviseur neuf slot0
`ses_edaf43c0cffeAOikFDjgKGcu9H` ; délégation `functions.subagent` seulement,
aucune équipe Ensemble nouvelle ni reprise d'enfant étranger. Un diagnostic API
des six anciens workers confirme failed/idle/0tokens : aucun slot occupé, pas
d'attente infinie de deuxième ack terminal, aucun force/purge/cleanup.

API V2 live confirme le superviseur Sol et **deux canaries** Flash/Sol : `id`
sans `#high`, `variant=high`, providers exacts. Les deux enfants frais ont le bon
parentID, outcome succeeded, finale `NATIVE_HIGH_CANARY_OK`, zéro outil/fichier.
IDs/Model.Ref/messages/usage observé sont dans `native_migration_2026_10_10`
de la queue. Ce sont des probes du transport, ni reconstruction C ni contrôle
RE ni fallback déclenché. Refaire le readback du modèle de chaque session avant
expansion ; le succès de deux probes ne prouve pas la concurrence onze.

Six tâches requeue READY ; deux opérations parent READY ; onze slots libres
mais gate fermée. P3 demande Sol Ensemble invalide pré-exécution est conservée
comme échec harness, **pas consommation d'une exécution high** : une seule vraie
tentative Sol high reste réservée pour remplacer son ancien Flash interrompu.
Adjudication administrative limitée à cette migration, pas règle de retry Sol.
Les drafts/gels/neutral-v1/C accepté sont intacts ; P2 A attend neutral-v2 puis
guard, J3 all-path gate/push/commit pending avant promotion. `--self-test` :
**15 checks offline PASS**, hashes et 8/8 gels P1 exacts. IDA actuel input/IDB/
SHA vérifié lecture seule ; pas de pack/gate §5.6/écriture/save/promotion.

État **awaiting_background_GO**, dispatch_GO=false : attendre CONTINUATION
background explicite du parent dans cette session, ne pas recycler l'ancien GO.
Fractions 0/6, C2/6, AV1/6, contrôle1/3 retourné/0/3 adjudiqué et 38 clos
historiques inchangés ; adaptatif strictement six EA. Aucun global/profil/provider/
MCP/DB/service modifié, aucune action d'alimentation ou réarmement.

## Activation native réelle — checkpoint intermédiaire 2026-10-10

Le GO CONTINUATION background explicite supersède uniquement la gate setup
ci-dessus : queue `running_native`, Model.Ref high réel parsession, callbacks
continus dans1+11. J3 avenant clos `31102de` (pas nouvelle fonction).
P2 premierclos LIKELY1+V `83f5e94`, C exact + §5.6 parent + IDBsave/readback.
P1 contrôles adjudiqués rev2 sans défaut matériel inéditB contre BOTHgels,
R-only aliases/x87 séparés, métierbone reste inconnu ; propagation pending.
P3 C/A/V acceptés etgelés avant contrôlesfresh C-B/sémB en cours ; fallback
réelSol réservé consommé1/1, ancienséchecsEnsemble pas des exécutionsprovider.
P4/P5/P6 C-review pending ; leurprimaire **non strictblind** (expositionIDA
avantneutralisation conservée, pas effacée par nettoyagedesfichiers).
Fractions intermédiaires **1/6,C3/6,AV3/6,contrôles1/3 adjudiqués**,baseline38.
Sixworkers actifs, pas disponibilitéfake11 ; prochaineéligibilité déclenche
dispatchsansbatch. `--self-test`16checksPASS dont garde retournonaccepté.
Ce checkpoint ne vaut ni finpilote ni équivalenceISO/compiled/native/runtime.

### Checkpoint reprise serveur / P1 deuxième clos

P1 `5679fb8` est maintenant clos numériquement LIKELY, métierbone UNCERTAIN,
gels8/8 préservés et IDBsave/readback exact ; nouveauxclos **2/6** (P1,P2).
P3 contrôles retournés, R fresh pending ; exceptionsgénériquesAGENT/fragment
ContextMode C-B consignées, pas certificatstrictcontexteabsolu.
P4/P5/P6 reviewsCORRIGE → fixes ciblés → re-review obligatoire (DAG68).
Restart a imposé une fermeturetemporaire dispatch avecdrain3sessions nonterminales,
pas fakeidle/cancel. IDAnatif réapparu : guardsource/IDB/commentsrevalidéreadonly,
repriseGO inchangé. P4fixFlashfailed `uv_spawn` → une replacementSolhighfresh
effective, inputsdigests identiques, parcellesfailedconservées ; paspannequota prouvée.
Quatreworkersen cours P3R/P4fixSol/P5fix/P6fix, aucun nouveau rôleavantleursgates.
La reprise ne recommence pas P1/P2/J3 et ne réouvre pas les budgetsSolconsommés.
