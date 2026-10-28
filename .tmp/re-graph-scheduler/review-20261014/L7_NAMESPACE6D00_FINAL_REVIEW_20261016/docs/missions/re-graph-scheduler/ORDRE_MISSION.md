# ORDRE DE MISSION — RE Graph Intelligence & Deterministic Parallel Investigation

**Projet :** `re-ff8` — rétro-ingénierie statique de Final Fantasy VIII.

**Type :** architecture, implémentation, intégration, sûreté concurrente et benchmarks.

**Exécution future :** OpenCode Ensemble, un lead orchestrateur, lots parallèles.

**Priorité :** haute.

**Version du document :** 1 — 2026-10-13.

**Statut :** ordre préparé ; sa rédaction ne lance aucune mission, campagne ou migration.

Cet ordre fusionne les missions « RE Graph Intelligence & Clustering » et
« RE Deterministic Parallel Scheduler ». Il conserve leurs deux responsabilités
distinctes, mais impose **un contrat commun, une intégration et un rapport final**.
Les impératifs d'implémentation ci-dessous s'appliquent après le GO de lancement.

## 1. Finalité et principes non négociables

Construire une chaîne reproductible :

`faits natifs → graphe versionné → capacités → partitions → groupes → plan de travail → exécutions → validation → connaissance durable → deltas`.

Elle doit découvrir et regrouper les fonctions, exploiter progressivement leur
sémantique, puis maximiser le nombre d'investigations **utiles** en parallèle,
sans violer les dépendances de connaissance, l'isolation scientifique ou les
exclusions de ressources.

Principes :

- La structure est observée ; les capacités sont détectées ; la sémantique est
  enrichie ; l'architecture est progressivement inférée.
- Les algorithmes calculent distances, communautés, similarités, SCC, priorités,
  allocations et partitions. Un LLM ne remplace pas ces calculs.
- Le moteur de graphes découvre les groupes. Le planificateur métier décide
  dépendances, conflits et éligibilité. Ensemble possède l'exécution native et
  l'admission effective. Ne créer ni un second scheduler scientifique concurrent,
  ni un second gestionnaire de sessions contournant Ensemble.
- Les modèles servent à analyser, décompiler, interpréter et revoir ; ni leur
  prose, ni un JSON valide, ni leur statut « done » ne constituent une validation.
- Distinguer deux régimes : **A, découverte structurelle** ; **B, reconstruction
  fonctionnelle multivue**. La maturité et la transition sont locales, pas globales.

## 2. Contexte réel du dépôt et réutilisation obligatoire

### 2.1 Sources et composants à auditer en premier

Lire `AGENTS.md`, `AGENT.md`, les règles applicables et
`docs/tech/RE_MULTI_PROVIDER_MISSIONS.md`. Charger `opencode-ensemble` et utiliser
la documentation **OpenCode V2** ainsi que les signatures réellement installées.
Le lead déjà en place ne crée pas un second orchestrateur pour se superviser.

Examiner notamment :

- `tools/ff8-harness/src/engine.ts` : cycle scientifique, gel des entrées,
  propositions, réconciliation, validation, consolidation, `deterministicGroups`.
- `src/domain.ts`, `src/validation.ts`, `src/store.ts` dans ce même harnais :
  identités, résultats, stockage propre, transitions et contrôles existants.
- `src/client.ts`, `src/adapter.ts`, `src/runtime.ts`, `src/cli.ts` : client durable
  du pont public, projections, contrats natifs et configuration explicite.
- `src/structured-result.ts`, `src/re-policy.ts`, `src/bulletin-audit.ts`,
  `profiles/re-policy/`, `schemas/` et les tests associés : contrats de résultats,
  accès par rôle, groupes R et audit de communication.
- `tools/ff8-harness/docs/STRICT_OUTPUT.md`, `ROLE_ACCESS.md`, `RESUME_STATUS.md`,
  `SESSION_20261013.md` et ses addenda : décisions et limites déjà découvertes.
- `docs/tech/investigation/battle-static-discovery/`, son ledger
  `semantic-certainty.md`, ses dossiers `semantic/` et `decomp/`, ses registres,
  graphes et scripts d'extraction : capital existant à réutiliser, pas à écraser.
- `docs/missions/ff8-decomp-semantics-2026-10-11-run01/` et ses gels/harvests :
  sources historiques à examiner en lecture seule, **pas une file à reprendre**.
- Côté Ensemble : API/RPC/store/auth d'exécution, bindings natifs, bulletin,
  contrôles de sortie et câblage V2. Localiser la copie effectivement chargée ;
  ne pas confondre installation globale et worktree de développement isolé.

Dans la suite, `run01/...` abrège le dossier documentaire
`docs/missions/ff8-decomp-semantics-2026-10-11-run01/...`, jamais une commande de reprise.

Le harnais est déjà en **TypeScript/Bun avec SQLite** et un pont d'exécution
public. Le projet contient déjà un regroupement déterministe par dépendances :
ne pas présenter tout l'existant comme une clusterisation LLM. La première
livraison doit expliquer précisément ce qui est algorithmique, produit par un
modèle, historique, incomplet ou effectivement utilisé.

Constats précis de préparation à reprendre comme points de départ, puis à
revalider sur la version de travail :

- `engine.ts::deterministicGroups` construit des **composantes connexes non
  orientées** à partir des dépendances des candidats présents, trie les membres
  et hashe le groupe. Ce n'est ni un calcul de SCC, ni un DAG de connaissances.
- `Engine.freeze` trie difficulté puis identité et sélectionne selon taille/
  budget ; il ne ferme pas actuellement la sélection sur les prérequis. Un futur
  budget ne doit pas sélectionner un consommateur en omettant silencieusement
  une dépendance obligatoire : compléter la fermeture, différer, ou dispenser
  explicitement selon la politique de connaissance.
- `Engine.tick` impose des barrières de phases, notamment évaluation, A/B puis
  R. La conversion événementielle doit supprimer les **barrières inter-unités
  inutiles**, pas les gates A+B→R ni validation→commit d'une unité donnée.
- `tools/battle_static_graph_ledger.py` fournit déjà chunks, appels directs,
  tail-jumps, tables MagicList, candidats callbacks et indirects. Son heuristique
  de callback fondée sur un `push` immédiat proche reste une hypothèse à conserver
  comme telle, pas un appel confirmé.
- `tools/battle_static_registry.py` possède empreintes par chunks et
  relocation-aware, callees/sites, flags thunk/nullsub. Auditer la tolérance
  silencieuse aux erreurs d'itération des tails : une extraction partielle doit
  devenir un statut de couverture explicite.
- `tools/battle_indirect_registry.py` contient un parseur PE32/IAT et des cibles
  typées import/table/global/BSS/register/vtable/unknown. Réutiliser ces acquis
  sans les présenter comme une analyse interprocédurale exhaustive des globales.
- L'exporteur historique `.tmp/ff8-decomp-semantics-r01-export-ida.py` fournit
  ASM/bytes/chunks/CFG/xrefs et un groupement glouton déterministe pondéré
  (direct 100, callers communs 3, cibles communes 1, plafond six fonctions).
  Ce plafond décrit le **contexte d'un groupe**, pas six agents ou six slots.
  Le reprendre comme baseline versionnée ; ne pas faire dépendre la nouvelle
  production d'un script temporaire non promu/revu.
- Le snapshot historique `run01/native-groups.json` contient **98 fonctions,
  36 groupes**, avec un graphe `out/callers` non typé par site : ce n'est pas la
  cartographie du binaire entier. Préserver aussi la récursion singleton : des
  exports historiques éliminent les auto-arêtes et ne suffisent pas pour les SCC.

Privilégier une extension modulaire de cet ensemble. Une bibliothèque Python,
igraph/Leiden, capa ou autre est un candidat justifié par mesures et ADR, pas un
prétexte pour ajouter une seconde architecture, base ou infrastructure réseau.

### 2.2 État vérifié à ne pas généraliser

Le canary natif strict **essai 16** a passé une fixture synthétique : cinq sessions
fresh, référence native `openai/gpt-6-astra#high` relue, 18 requêtes WebSocket
contraintes, cinq captures, reprise sans retransmission, sentinelle refusée,
publication fixture et clôture de l'ensemble exact des sessions.

Cela ne valide **ni** les analyses réelles de FF8, **ni** la publication IDB,
**ni** les permissions de production, **ni** toutes les routes/providers,
**ni** l'extension ultérieure de partage R. Le transport HTTP n'a pas été exercé
en natif dans ce PASS. Les essais 12–15 restent des échecs conservés.

La route stricte démontrée utilise Responses
`text.format={type:'json_schema',strict:true}`. Ne jamais convertir silencieusement
une route inconnue ou incompatible en `json_object`, JSON libre ou autre modèle.
L'exception tool-level `read` du canary ne constitue pas un profil de production.

L'extension rôle/bulletin a des livrables et tests hors ligne. Le dernier retour
FF8 annonce son audit terminé, mais le test croisé et les gates complets parents
restent à relire/vérifier au préflight de cette nouvelle mission. Relever l'état
**actuel**, ses hashes et ses preuves, plutôt que figer un nombre de tests comme
certificat permanent. La publication IDB autonome reste hors des acquis.

Le snapshot `run01/native-pe-verification.json` rapporte **94 concordances sur
98** pour IDB/disque/gel, malgré le même hash d'entrée enregistré :
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
Les divergences portent sur `0x465720`, `0x495960`, `0x48D200`, `0x48FE20`.
Ces preuves historiques doivent rester diagnostiques/quarantinées tant que la
divergence pertinente n'est pas résolue ; **un hash d'entrée IDB concordant ne
garantit pas que ses octets locaux correspondent encore au PE**. Ne pas déplacer
ces quatre fonctions vers un corpus oracle « validé » par simple import.

### 2.3 Périmètre et autorisations

- Aucun lancement du jeu, debugger live, injection, patch binaire ou writer DLL.
- Extraction IDA statique autorisée dans le périmètre fixé au GO, en lecture
  seule, sans rename, commentaire, typage, patch ou sauvegarde de l'IDB.
- Utiliser le MCP IDA réellement exposé. Pas de contournement par HTTP/curl/shell.
  Un export IDAPython borné peut être réalisé par le lead si nécessaire ; cela
  n'accorde pas `py_eval` ni des scripts arbitraires aux auteurs scientifiques.
- Pas de configuration globale, installation globale, achat de provider,
  nouvelle infrastructure payante, commit/push ou nettoyage destructeur implicite.
- Préserver les modifications préexistantes, les fixtures et preuves antérieures.
  Les fichiers non committés/ignorés ne sont pas transmis automatiquement aux
  worktrees : produire un manifeste de transfert explicite, hashé et autorisé.
- Ni run01, ni la campagne battle-static-discovery et sa politique de pool du
  2026-10-10 ne sont migrés ou relancés par cette mission. Leurs quotas, registres,
  six EA du pilote et règles d'adaptatif ne sont pas redéfinis ici.
- Un GO de développement n'est pas un GO de campagne scientifique autonome.
  L'admission native d'un canary/pilote consommant des quotas et son budget doivent
  être explicites ; après un échec de canary, pas de nouvel essai sans nouveau GO.

### 2.4 Contrat d'activation à enregistrer au GO

Avant création des workers, consigner : missionId distinct, périmètre de
fichiers/artefacts binaires, référence/hash du harnais et du plugin, worktrees et
manifests de transfert ; profils/modèles/variantes, limites globales/par compte,
budget et retries/replis autorisés ; mode fixtures/IDA readonly ; cible de
publication admissible ; modalités d'intégration Git ; critères d'arrêt.

La lecture de l'inventaire et la préparation du plan peuvent précéder les
admissions. Si un choix indispensable manque, l'escalader au lead/utilisateur
plutôt que choisir un modèle payant, une publication ou une migration implicites.
Le smoke natif et l'adoption de production restent des gates séparées.

## 3. Organisation Ensemble : deux plans à ne pas confondre

### 3.1 L'équipe de développement de cette mission

Utiliser une vraie équipe Ensemble et un tableau de tâches. Le lead seul crée
les membres, enregistre les IDs retournés, construit `depends_on`, arbitre,
intègre et valide. Les labels de lots ci-dessous ne sont **pas** des IDs natifs.

Plan initial : jusqu'à **cinq workers utiles en parallèle**, ajustables au GO
selon dépendances et quotas. Ce n'est ni un minimum à remplir artificiellement,
ni un pool permanent par cluster. Revue indépendante après les premiers lots,
avec réutilisation des slots libérés, pas des contextes scientifiques aveugles.

Découvrir les profils/modèles/variantes disponibles ; sélectionner explicitement
et relire le `Model.Ref` natif `{providerID,id,variant}`. Une chaîne `#high` ne
prouve pas sa prise en compte. Accès, coût, budget, replis et variantes sont
approuvés avant dispatch. Pas de modèle implicite ou repli payant silencieux.

### 3.2 Le runtime scientifique produit par cette mission

Le scheduler algorithmique externe étend le harnais FF8. Il utilise le pont
public générique ; il ne lit ni ne modifie directement `ensemble.db`.
Ensemble conserve ses responsabilités de capacité, sessions et exécution.

Les outils `team_tasks_add`, `team_spawn`, `team_results`, etc. servent à piloter
l'équipe de développement. Ils ne doivent pas devenir un contournement du pont
durable pour le runtime FF8, ni une deuxième voie d'admission scientifique.

Matérialiser progressivement les tâches exécutables : ne pas créer immédiatement
une tâche Ensemble par fonction pour un graphe de 100 000 fonctions. Les tâches
fines, dépendances et revisions restent dans le planificateur ; la file native
ne représente que les admissions utiles et les tentatives traçables.

## 4. Contrat partagé, versionné et immuable

Avant les implémentations dépendantes, geler le contrat de données, ses fixtures,
ses règles de compatibilité et ses schémas lisibles par machine. Réutiliser les
identités existantes par adaptation, pas par remplacement destructeur.

### 4.1 Identité, provenance et reproductibilité

- Identité d'une fonction : identité cryptographique du **module binaire** + RVA
  canonique, ou équivalent persistant justifié. Nom IDA et EA absolue sont des
  attributs, pas la clé. Conserver image base, EA, RVA et conversions contrôlées.
- Cible habituelle FF8 PC : x86-32/PE, **à vérifier sur l'artefact chargé**, jamais
  sur le nom du fichier. Un EXE et une DLL telle qu'AF3DN.P sont des artefacts
  distincts, même lorsque leurs données appartiennent au même pipeline de rendu.
- Distinguer hash du binaire, identité de l'IDB, version d'extraction, révision
  de connaissance et partition. Un nom sémantique mutable ne change pas l'identité.
- Toute preuve native cite module, site d'instruction/RVA ou objet, type de xref,
  source et version/hash. Une date ou un nom de fichier ne constitue pas une preuve.
- Canonicaliser ordre, nombres/adresses, encodage et égalités. Séparer les champs
  volatils d'audit du contenu hashé reproductible ; documenter chaque digest.
- Les budgets de stockage portent sur des **octets UTF8**, enveloppes/métadonnées
  comprises. Tester le non-ASCII : `length(TEXT)` SQLite n'est pas un compte d'octets.

### 4.2 Entités du moteur de graphes

**BinaryArtifact** : module stable, SHA256, architecture/format, image base,
sections utiles, provenance et versions de l'analyse/extracteur.

**FunctionNode** : identité canonique, EA/RVA, frontières et chunks, nom/type
observés, taille, CFG/métriques disponibles, classe interne/import/externe/thunk/
wrapper/incomplète, statut et maturité sémantique locale, références aux analyses.
Un métrique inconnu reste inconnu, pas zéro par convention silencieuse.

**FunctionEdge** : source/destination, type et sens, sites/preuves, confiance
interprétable, statut observé/inféré/validé/invalidé, révisions d'apparition et de
retrait, pertinence potentielle pour le scheduler — sans lui imposer le blocage.

**ReferencedObject / UnresolvedReference**, ou équivalents : objets de données,
tables, imports, structures, sites d'appels indirects et cibles inconnues. Ne pas
inventer une fausse fonction à EA zéro ; ne pas représenter une donnée comme un
callee. Une projection « données partagées entre fonctions » reste dérivée et
conserve les objets et preuves qui la justifient.

**CapabilityFact** : règle/version, fonction/région, capacité observée, preuves,
confiance, portée directe ou propagation inférée. Rôle métier hypothétique séparé.

**GraphSnapshot** : schéma, identités, nœuds, relations/objets/incertitudes,
empreinte normalisée, révision de connaissance, périmètre et couverture,
configuration et versions d'outils ; export/import/rejeu sans perte.

**ClusterPartition** : snapshot immuable, régime/algorithme/configuration/seed,
communautés, noyaux, contextes externes, métriques, maturité et lineage.
Séparer ID de contenu d'une communauté et identité de lineage : une scission
ne peut conserver magiquement le même identifiant pour tous ses enfants.

**InvestigationGroup** : fonctions **possédées**, fonctions de **contexte**,
cluster/capacités d'origine, frontières, granularité, coûts et non-couverts.
L'appartenance de contexte n'engendre jamais à elle seule un travail supplémentaire.

**KnowledgeDelta** : opération idempotente, révision de départ, fonctions/faits
concernés, preuves, origine/validation, invalidations et impact potentiel.

### 4.3 Entités du planificateur

**WorkUnit** : ID stable, snapshot/partition/knowledge revision, fonctions
possédées et contextes autorisés, type d'investigation, pipeline scientifique,
prérequis typés, conflits, coût et niveau de validation/publication requis.

**MissionPlan** : unités, G1/G2/G3, SCC, ressources, politiques/estimations
versionnées, empreinte et raisons explicables des décisions.

**WorkAttempt** : unité, tentative, rôle scientifique, exécution/session native,
profil/Model.Ref, manifeste de contexte, état, lease/fencing, progression,
erreurs typées et liens vers toutes les tentatives antérieures.

**KnowledgeCommit** : opération stable, révisions entrée/sortie, résultats et
faits validés, sources/preuves, publication ciblée, readback, effets sur les
prérequis futurs. Ne pas confondre ce terme avec un commit Git.

Le contexte doit pouvoir porter aussi les versions de contrat de rôle, profils,
instructions, règles de capacité, normalisation lexicale et encodeur éventuel.

## 5. Extraction statique et particularités FF8

Étendre les exporteurs existants, d'abord sur un périmètre borné, puis sur le
binaire entier. Geler une extraction et les capacités de l'interface utilisée.
Continuer utilement sur fixtures/gels si IDA est temporairement indisponible ;
ne pas promouvoir une simulation en extraction native vérifiée.

Extraire selon disponibilité démontrée :

- fonctions, chunks/tails et frontières ; appels directs et indirects résolus ;
- callers/callees, xrefs code/data, retours, tail calls/thunks ;
- lectures/écritures de globales lorsqu'identifiables, structures et états ;
- imports, tables de callbacks/dispatch/vtables, données partagées ;
- CFG, blocs, taille/instructions et complexité ; chaînes et constantes utiles ;
- sections, proximité mémoire faible, couverture et références non résolues.

**Convention canonique : A appelle B = `A → B`.** Toute symétrisation pour un
algorithme est une vue dérivée. Les appels indirects inconnus restent explicites.
Dédupliquer les relations sans perdre les différents sites qui les soutiennent.

Précautions projet :

- Une xref DATA vers un callback n'est pas un appel direct. Déterminer séparément
  enregistrement, dispatch, cible possible et appel réellement démontré.
- Noms IDA et annotations héritées peuvent être trompeurs. Ne pas s'en servir
  comme vérité de clustering ni comme amorce d'un auteur aveugle.
- Les harvests historiques contiennent parfois des previews de C/verdict dans
  l'historique explorateur, notamment signalées par
  `run01/discovery-harvest/g01.common-compaction.md`. Une compaction ou un fork
  de cet historique n'est pas un contexte aveugle. Reconstruire une projection
  factuelle fraîche ; la présence d'un rapport de discovery ne vaut pas validation.
- Routines CRT, allocations, copies mémoire, RNG/timers, wrappers graphiques et
  fonctions à très fort fan-in ne doivent pas fusionner toute la bataille.
- Les familles battle/field/worldmap et le rendu peuvent être reliées sans
  devenir une communauté unique ni une dépendance bloquante uniforme.
- Détection de structure/stride : préserver l'évidence ASM et les largeurs ;
  ne pas transformer une conjecture de type ou un nom de globale en relation sûre.
- Réutiliser C réconciliés et sémantiques existantes **après contrôle de leurs
  identités, statut, contexte et preuves**. Leur seule présence ne satisfait pas
  un prérequis exigeant une validation plus forte.
- Une empreinte relocation-aware ou une famille de clones est un signal de
  rapprochement, pas une preuve d'équivalence sémantique/ABI permettant de publier
  automatiquement le résultat d'une autre fonction.

## 6. Extraction déterministe des capacités

Évaluer capa et son adaptateur IDA, les règles et détecteurs déjà présents,
leurs licences/versions/coûts et couverture. Réutiliser/importer les résultats
plutôt que réimplémenter capa. Aucun téléchargement/installateur implicite en
production. Un moteur de règles local borné doit permettre les tests sans capa.

Catégories candidates : entrées et événements, réseau si présent, DirectDraw/
Direct3D/rendu, DirectSound/audio, fichiers/archives/sauvegardes, allocation/
mémoire, compression, textures/palettes/animations, scènes/états, temps/RNG,
scripts/interpréteurs/dispatch. N'activer que les détections fondées sur des faits.

Une importation graphique est une preuve de capacité observable, pas une preuve
d'appartenance au module architectural « rendu ». Conserver règles déclenchées,
preuves négatives/limites et propagation éventuelle à des voisins comme inférence.
Cache par binaire + snapshot + version/règles/configuration, avec invalidation explicite.

## 7. Régime A : découverte structurelle sans LLM

Implémenter et comparer :

1. **Baseline strictement déterministe** : préserver/comparer le regroupement
   existant, puis une baseline stable adaptée aux hubs et au découpage. Une
   composante faiblement connexe géante n'est pas une bonne unité de travail.
2. **Personalized PageRank** : graines de capacités/entrées ; voisinages locaux,
   direction caller/callee configurable, traitement des dangling nodes,
   convergence/tolérance/itérations explicites ; sweep cut de conductance ou
   alternative mesurable pour extraire les régions.
3. **Leiden structurel** : partition pondérée globale et couverture résiduelle ;
   vérifier les capacités réelles de la bibliothèque pour les graphes dirigés,
   objectifs et seeds. Reproductible à environnement fixé n'est pas synonyme de
   résultat bit-identique universel. MCL peut être un comparateur, pas une obligation.

Poids configurables : appels directs, indirects selon preuves, données/structures
rares partagées, dispatch ; proximité mémoire faible ; atténuation des imports,
utilitaires et hubs. Versionner et justifier les valeurs initiales, puis faire
une analyse de sensibilité : aucune pondération arbitraire présentée comme calibrée.

Le constructeur de groupes sépare communauté principale, noyau à investiguer
et contexte. Il garantit propriétaire principal unique, min/max configurables,
découpage des gros groupes, rattachement contrôlé des petits, isolés/hubs,
non-couverts explicites et estimation de coûts/contexte. Les contextes peuvent
se chevaucher sans dupliquer l'investigation ni imposer un conflit.

## 8. Régime B : sémantique multivue et architecture

Chaque fonction peut recevoir description libre, rôles normalisés, in/out,
effets, données lues/écrites, structures/états, dépendances, invariants, confiance
et provenance. Préserver hypothèses et contradictions sans les promouvoir.
Les faits structurels ne sont jamais réécrits parce qu'un paragraphe paraît plausible.

Développer :

- Un index lexical déterministe BM25/TF-IDF ou équivalent existant, avec règles
  de normalisation linguistique et synonymes techniques versionnées.
- Un adaptateur optionnel d'embeddings locaux : modèle/tokenizer/révision,
  paramètres et index gelés, cache, top-k/seuils/quotas, tie-breaking stable.
  Prévoir l'absence de l'encodeur et mesurer le gain par ablation face au lexical.
- Un clustering multivue combinant appels, données, similarité sémantique et
  relations fonctionnelles validées, avec pondération liée à la maturité **locale**.
- `must-link`/`cannot-link` seulement avec provenance et validation. Vérifier
  leur prise en charge effective ; sinon contraction/validation/réparation
  explicites. Une contrainte insatisfaisable produit un diagnostic, pas un faux PASS.
- Une reconstruction hiérarchique fonctions → communautés → sous-systèmes →
  architecture ; distinguer module d'appartenance et capacité transversale.

Les similarités ne prouvent jamais une dépendance. L'architecture peut rester
expérimentale faute de corpus suffisamment validé ; son moteur, son export et
ses évaluations sur fixtures doivent néanmoins être exécutables.

Réutiliser les connaissances/index existants sans y exposer les auteurs aveugles.
GrepAI et QMD sont des outils de recherche, pas automatiquement le magasin
canonique des faits scientifiques ou un classement reproductible pour le scheduler.

## 9. G1, G2, G3 : trois vues distinctes

### G1 — Dépendances de connaissance

Pour `A appelle B`, le prérequis de planning est `travail(B) → travail(A)`.
Par défaut, examiner les appels internes directs confirmés du périmètre actif.
La politique indique **quel artefact, révision et niveau de validation** le
consommateur exige : C réconcilié, description sémantique, fait structurel, etc.

Classer obligatoire, optionnelle, externe satisfaite, inconnue/non résolue ou
non bloquante. Ne pas attendre indéfiniment un import, un thunk hors périmètre
ou une fonction absente. Toute dispense bottom-up est motivée, versionnée et visible.

### G2 — Conflits

Conflits sur fonction possédée, dépendance bloquante, fichier non isolé, écriture
exclusive, bail natif ou contrainte d'adaptateur. Ne pas transformer les chemins
transitifs d'un graphe de conflits en exclusion de toute une composante connexe.
La fermeture transitive des **prérequis G1**, elle, reste respectée.

Les lectures partagées, contextes communs, proximité mémoire et ressemblances de
texte ne deviennent pas automatiquement des conflits.

Les clés de possession des fonctions/ressources sont canoniques et indépendantes
du cluster ou de l'ID de partition. Vérifier toutes les unités actives du
périmètre, y compris celles d'un ancien plan encore vivant : une nouvelle
partition ne crée pas un second droit d'investigation sur la même fonction.
Les sous-tâches A/B autorisées partagent le bail de leur famille, pas deux
réservations concurrentes indépendantes.

### G3 — Affinité

Préférences de contexte/cache, regroupement de petites unités, spécialité et
statistiques. **G3 ne crée pas de blocage implicite.** La sûreté repose sur G1/G2
et les capacités effectivement autorisées.

## 10. SCC, granularité et compatibilité du pipeline 2+1

Calculer les SCC par Tarjan/Kosaraju ou équivalent et leur DAG de condensation.
Tester les grandes chaînes sans débordement de pile. Une SCC récursive est,
pour le premier prototype, une unité de dépendance exclusive avec travail local
séquentiel/itératif borné ; pas d'ordre bottom-up total fictif dans un cycle.
Prévoir un diagnostic et budget pour les SCC volumineuses, jamais une attente infinie.

Ne pas condenser tout un cluster fonctionnel. Si des fonctions sont regroupées
dans une WorkUnit, vérifier de nouveau le graphe quotient : fusionner des nœuds
d'un DAG peut créer un cycle artificiel. Réparer/séparer ou diagnostiquer avant dispatch.

Granularités possibles : fonction, petite famille, SCC, groupe ou sous-groupe.
Comparer coût de lancement, contexte, réutilisation et branches indépendantes ;
conserver un ordre local explicite pour les fonctions dépendantes regroupées.

Le harnais actuel associe notamment `Intent.identity` et ses résultats à une
fonction. Une WorkUnit multifonction doit donc être un **agrégat de planification
explicitement adapté**, pas une identité de groupe glissée à la place d'une EA.
Conserver des sous-intents/résultats et preuves attribuables à chaque fonction,
ou introduire un schéma composite versionné et validé. Pour une SCC, préciser
quand l'ensemble devient publiable et satisfait ses consommateurs ; les résumés
provisoires internes ne satisfont pas seuls les prérequis externes.

**Exception nécessaire à la formulation « une seule analyse par fonction » :**
le projet utilise deux auteurs indépendants puis un réconciliateur. Une seule
WorkUnit/famille possède le travail et son bail ; ses sous-tâches A et B sont
volontairement parallèles, avec sessions fresh et sorties disjointes. Elles ne
sont ni une double réservation accidentelle, ni deux commits concurrents.
R attend A+B. Les familles C et sémantique et leurs prérequis sont explicites.

Le contrat futur RE conserve 2+1 aveugle par défaut ; une dérogation exige une
autorisation. On recycle une capacité/slot, **jamais le contexte natif d'un auteur**
pour en faire un autre auteur indépendant. Une fonction de contexte n'est pas
considérée comme possédée ou analysée par la WorkUnit qui la consulte.

## 11. File globale, priorités et ressources

File READY globale événementielle : fin d'une branche → validation/commit →
réévaluation immédiate de ses consommateurs. Pas de tours synchronisés « toutes
les feuilles, puis tout le niveau suivant ».

Une unité est READY si prérequis requis committés, snapshot/plan/contexte valides,
pas d'annulation/blocage. Le dispatch vérifie à nouveau atomiquement disponibilité,
conflits, ressources, budgets, révision et possession avant réservation.

Comparer FIFO déterministe, profondeur, chemin critique, chemin critique +
influence, et une variante hétérogène inspirée de HEFT :

`rank(v) = coût_estimé(v) + max(rank(consommateur))`.

Coûts calculés à partir des instructions/CFG/complexité, taille du contexte,
dépendances, type de pipeline/modèle et historiques mesurés. Versionner les
estimations ; traiter explicitement le coût A/B parallèle, R et validation.
Le signal `classify_x86`/Jev du projet reste consultatif pour le lead : il ne
devient pas un appel LLM dans la boucle de ranking, ni une probabilité calibrée.

Tie-breaking canonique et politique d'anti-famine explicite. Le temps, s'il
intervient dans l'aging, est un événement rejouable, pas une horloge cachée.

Pool global de capacités/slots hétérogènes : profils, modèles, outils, lecture,
CPU/GPU, budgets, débit et quotas par compte/provider réellement partagé. Les
clusters offrent de la localité mais ne retiennent pas des workers inoccupés.
Le work stealing est une réaffectation compatible de capacité, pas l'héritage
du contexte d'un autre scientifique.

Les appels IDA readonly peuvent passer par une file de ressources limitée par
la capacité réelle du serveur. Ne pas verrouiller toute une investigation parce
qu'une lecture ponctuelle doit être sérialisée. Les écritures restent hors scope.

Conserver comme limitations les budgets/annulations coopératifs du backend :
aucune borne dure de coût ou arrêt instantané n'est proclamée sans mécanisme prouvé.

## 12. Persistance, leases, crashs et résultats tardifs

Réutiliser SQLite et les mécanismes d'intentions, CAS, leases, journaux et
idempotence du harnais/pont. Les bases sont distinctes : ne pas prétendre disposer
d'une transaction atomique inter-bases inexistante.

États explicites, ou équivalents documentés : PENDING, BLOCKED, READY, RESERVED,
RUNNING, VALIDATING, COMMITTED, RETRYABLE, FAILED, STALE, CANCELLED, et si utile
STOP_PENDING/QUARANTINED pour une exécution native dont l'arrêt est ambigu.

Exigences :

- réservation atomique avec contrainte d'unicité et fencing monotone ;
- intention/outbox durable avant effet externe, clé d'idempotence et digest du
  contrat complet, accusé/réconciliation du pont après perte de réponse ;
- heartbeat borné ; reprise qui distingue calcul actif, attente native,
  validation, publication et résultat définitivement bloqué ;
- publication unique, readback durable, journal d'événements rejouable ;
- ancien résultat conservé comme preuve mais incapable d'écraser un nouveau
  résultat ou de débloquer un consommateur après expiration/annulation ;
- refus/auth, erreur d'entrée, problème de schéma, quota et panne distingués.
  Retries bornés et autorisés, jamais duplication d'une admission ambiguë.

**Expiration d'un lease ≠ arrêt du worker.** Le fencing bloque un commit tardif,
pas le calcul déjà en cours. Si l'invariant exige l'absence de double exécution,
ne pas réattribuer/dispatcher tant que l'ancien worker n'est pas terminal ou
qu'une règle de sûreté explicitement autorisée n'en prouve l'innocuité. Quarantaine
et diagnostic plutôt que fausse libération de slot. Ne jamais voler un bail actif.

La complétion d'une tâche Ensemble n'est pas le COMMITTED scientifique. Établir
une correspondance d'états vérifiable entre les deux journaux, sans scheduler
concurrent ni boucle de polling occupée dans le lead.

## 13. Contexte, science, publication et communication R

Chaque tentative reçoit un manifeste immuable : owned/context functions,
snapshots, contrats, connaissances validées des dépendances, propositions
autorisées, preuves et critères. Les sorties futures ou d'autres auteurs restent
exclues de la projection aveugle. Contrôler hashes, chemins et ancêtres
symlink/junction avant création des répertoires.

Conserver les dossiers stricts v3, la reconstruction lossless des propositions
par `contentLines`/`utf8-lines-lf`, JSON lisible et limite physique de ligne native
de 2000 caractères. Ne pas confondre cette limite avec un budget de tokens.
Conserver également la séparation validation métier/schéma de transport : le
RPC natif a déjà refusé les mots-clés regex `pattern` dans ses enveloppes. Ne pas
copier un schéma interne arbitraire dans le protocole sans tester sa compatibilité.

Contrats d'accès actuels à intégrer, pas à remplacer par un grant global :

- Décompilation A/B : pack fermé fourni, sans IDA spontané.
- Sémantification A/B : bindings IDA readonly exacts, sans communication de pairs.
- R : JSON A/B + confrontation ASM native ; témoin disasm réussi requis.
- R seulement : bulletin opt-in du même voisinage, provisoire/sourcé, pull-only,
  aucune injection/nudge automatique ni rétroaction vers les auteurs en cours.

Respecter `mission.rePolicy`, les droits distincts de `output` et `communication`,
les identités natives, schémas/hashes et traces. Un MCP readonly sélectionné a une
action exacte et éventuellement la ressource native canonique `*` : ce n'est
jamais un wildcard autorisant tous les outils du serveur. Pas de `py_eval`,
mutation, debugger, shells ou indexes génériques accordés par commodité.

Un bulletin de R n'est ni un KnowledgeDelta validé, ni un fait canonique, ni un
prérequis satisfait. L'accord entre R communicants n'est pas une confirmation
indépendante. Tracer les publications/lectures sans modifier le payload scientifique.
Le droit de partager ne dispense jamais de G1/G2 : seuls les R autrement
éligibles peuvent être actifs simultanément, même s'ils appartiennent au même canal.
Les empreintes de sources déclarées par un auteur ne prouvent pas la vérité
d'un extrait ; un témoin d'appel ne prouve pas à lui seul l'identité de l'IDB.

### Signification exacte de COMMITTED

Fixer au contrat de mission la cible de publication et le niveau requis :

1. **Simulation/fixture** : store fixture, clairement identifié ; aucune promotion RE.
2. **Connaissance locale approuvée** : validation scientifique requise réellement
   exécutée par le parent, écriture durable/readback du magasin autorisé.
3. **Publication IDB** : gate distincte, sérialisée et hors de cette mission.

Un état « IDB à publier » ne peut satisfaire un prérequis exigeant IDB vérifié.
Inversement, un prérequis explicitement fondé sur une connaissance locale validée
n'a pas à attendre une publication IDB non demandée. Si aucune cible admissible
n'existe, rester VALIDATED/BLOCKED avec motif ; ne pas simuler le commit manquant.

Quand des résultats RE réels sont acceptés, conserver les vérifications natives
du parent : callees/callers et CODE vs DATA, ABI/arguments cdecl, strides développés,
signedness/branches, AL/AX/EAX, couverture et preuves du rôle/nom. Aucun résultat
LLM ou test de schéma ne dispense des contrôles §5.6 applicables.

## 14. Deltas, reclustering et replanification

Déclencheurs configurables : volume significatif de connaissance validée,
relations structurantes, maturité locale, incohérences, nouveau graphe/config,
ou demande explicite. Pas de reconstruction complète après chaque réponse.

Pipeline : valider/idempotencer le delta → nouvelle révision durable → région
affectée → SCC/dépendances/poids à recalculer → nouvelle partition/plan proposés
→ décision d'adoption. Prioriser le local avec garde-fous ; si une mise à jour
globale est nécessaire pour la correction, la justifier et la mesurer.

Comparer membres, fusions, scissions, déplacements, noyaux/contextes, couverture
et coût. Conserver lineage, hystérésis/seuils configurables et comparaison à
configuration identique pour éviter les oscillations.

Les tentatives actives restent liées à leur snapshot. Une nouvelle partition
ne réécrit pas leurs fonctions, dépendances ou prompts. Une migration ne concerne
que des unités compatibles non lancées, ou suit un protocole explicite d'arrêt/
invalidation/recréation. Une nouvelle relation prouvée peut invalider une
connaissance pour les futurs consommateurs sans effacer son historique.

La sûreté s'applique au graphe connu/validé au dispatch, pas rétroactivement aux
arêtes inconnues. Si une arête nouvelle révèle un conflit actif : winner choisi
selon politique déterministe, demande d'arrêt/report si possible, fencing des
résultats incompatibles, attente de quiescence native et diagnostic. Aucun
changement de contexte silencieux ou effacement d'une tentative gênante.

## 15. Interfaces, CLI et observabilité

Modules/CLI internes plutôt qu'un nouveau serveur. Fournir les opérations ou
équivalents documentés : extraction graphe/capacités, clustering structurel,
construction de groupes, indexation sémantique, clustering multivue, reclustering,
comparaison/explication/export de partitions ; création/validation/explication de
plan, simulation, shadow, dispatch autorisé, reprise et replay.

Le scheduler consomme un export immuable **sans devoir rappeler le clustering**.
Le cœur fonctionne intégralement avec des workers simulés, sans modèle ni IDA.
Documenter API/schémas/erreurs plutôt qu'inventer une signature de tool natif.

Acquis SDK à préserver et re-vérifier selon la version installée : enregistrement
via `ctx.tool.transform`/`editor.add`, identité worker issue de
`ToolContext.sessionID`, pas d'un champ fourni à un RPC ; readback de profil
`AgentGetOutput={location,data}` déplié à la frontière de l'adaptateur. Les
événements, identités, guards et inventory réellement disponibles priment sur
une signature trouvée dans une ancienne documentation.

Journal durable : graph/partition/plan/knowledge versions, ordre d'événements,
horodatage reçu, READY et causes de blocage, scores, réservations/ressources,
profils/Model.Ref, manifests/hashes, états natifs et commits/readbacks.

Métriques : makespan, speedup, utilisation **utile**, chemin critique restant,
longueur READY, attentes dépendance/conflit/ressource/validation, overhead CPU,
fraîcheur du contexte, rework et coûts/tokens par unité réellement validée.
Workers failed/dormants, slots réservés sans travail et lead en attente ne sont
pas du parallélisme utile. Ne pas confondre gain simulé, estimé et mesuré en natif.

## 16. Lots parallèles et dépendances de développement

Le lead crée les tâches suivantes, puis remplace chaque label par l'ID réellement
retourné dans les appels `depends_on`. Réutiliser les slots dès libération utile.

**L0 — Reconnaissance / préflight.** Deux explorations indépendantes possibles :
graphe/corpus/IDA et harnais/pont/stockage. Lecture seule, inventaire des capacités,
dirty-worktree, réutilisation, risques et collusions avec travaux en cours.

**L1 — Contrat commun et ADR.** Dépend de L0. Lead + auteur de contrat unique ;
fixtures canoniques, identité/digests, publication, A/B/R, migrations, ownership
de fichiers et interfaces. Review de contrat avant les implémentations dépendantes.

Après L1, lancer en parallèle selon le budget :

- **L2 — Graphe natif et capacités** : adaptateurs/extraction/normalisation,
  couverture et export/caches. Les lectures IDA passent par le périmètre approuvé.
- **L3 — Clustering structurel / groupes** : baseline, PPR, Leiden, hubs,
  ownership/context, explications ; travaille sur fixtures L1 sans attendre IDA.
- **L4 — Sémantique / multivue / lineage** : index lexical, encodeur optionnel,
  maturité locale, contraintes, hiérarchie et delta de partition.
- **L5 — Planning algorithmique** : WorkUnits, SCC, G1/G2/G3, granularité,
  priorités, sélection compatible et ressources ; utilise les mêmes fixtures.
- **L6 — Persistance / reprise** : extensions du store et protocole réservation,
  outbox/CAS/fencing/publication, sans modifier en parallèle la boucle centrale.
- **L7 — QA / simulateur / benchmarks** : jeux synthétiques, oracle indépendant,
  injecteur d'incidents, mesures et comparaisons ; ownership séparé des fichiers
  de tests unitaires des implémenteurs. Démarre dès L1, pas uniquement à la fin.

Si les six lots sont READY mais cinq slots autorisés, choisir/recycler selon
chemin critique du développement ; ne pas dépasser la limite pour remplir une liste.

**L8 — Intégration harnais/pont/CLI.** Contrat de l'adaptateur préparé dès L1 ;
intégration réelle après L2/L3/L5/L6, puis L4 pour le régime B. **Un seul owner**
des fichiers centraux `engine.ts`, `domain.ts`, `adapter.ts`, `client.ts` et du
câblage CLI lors de leur intégration ; aucun merge concurrent sur ces interfaces.

**L9 — Review indépendante et attaques de sûreté.** Reviewer n'ayant pas écrit
les composants concernés ; audit du sens des arêtes, hypothèses/validations,
fencing, arrêt ambigu, prérequis, contextes aveugles, budgets et révisions.

**L10 — Intégration/validation finale parent.** Dépend de L8/L9 et des mesures L7.
Diffs, relecture des preuves, gates complets et rapport. Pas d'auto-acceptation
sur « tests verts » d'un worker. Corriger puis revalider les défauts bloquants.

Worktrees disjoints pour les implémentations ; snapshots d'entrées possédés,
paths d'écriture exclusifs et manifests. Les travaux non committés ne sont pas
récupérés par magie via `team_merge` : utiliser l'intégration publique compatible
avec les autorisations Git ou des patches/artifacts revus par le lead. Pas de
commit de commodité imposé pour contourner une interdiction de commit.

## 17. Tests obligatoires et benchmarks

### 17.1 Graphe / clustering

Fixtures couvrant : communautés évidentes, composantes déconnectées, hubs et
utilitaires, cycles/récursion, indirects incertains, isolés, bridges rares,
données/structures partagées, descriptions synonymes et descriptions proches
dans des modules distincts, maturité partielle, nouvelles connaissances, delta
vide, contextes chevauchants, lineage fusions/scissions et export/rechargement.

Ajouter les cas FF8 : chunks/tails, xrefs DATA de callbacks non promues en appels,
imports/thunks, récursion singleton avec auto-arête, changements de nom ou
d'image base sans changement d'identité,
binaire de même nom mais hash différent, plusieurs modules et métriques inconnues.
Tester aussi l'écart IDB/PE malgré un hash d'entrée IDB concordant et la sélection
budgétaire qui exclurait un callee obligatoire.

Mesurer couverture, cohésion/conductance/modularité, fragmentation, contexte
manquant, stabilité/churn, pureté seulement avec référence indépendante, ARI/NMI
ou mesures par paires si un oracle existe, et coût d'investigation. Aucun label
LLM utilisé comme vérité terrain silencieuse. Comparer et faire les ablations
structure/capacités/lexical/embeddings et sensibilité des poids.

### 17.2 Scheduler / concurrence

Cas minimaux :

- A appelle B/C ; B appelle D/E ; C appelle F. D/E/F parallèles ; B démarre dès
  commit de D/E, **sans attendre F** ; A attend B/C.
- SCC A↔B, SCC volumineuse et cycle artificiel créé par une mauvaise fusion.
- Sous-graphes indépendants, fonction utilitaire commune non dupliquée,
  contextes seulement lus qui se chevauchent, conflits directs exclusifs.
- Terminaisons permutées, pénurie de workers compatibles, quotas d'un compte
  partagé, pause, absence de READY distinguée d'une mission réellement terminée.
- Deux contrôleurs concurrents, réservations simultanées, crash avant/après
  envoi, réponse perdue, heartbeat perdu, lease expiré avec worker encore actif,
  arrêt non confirmé, résultat tardif, double commit et reprise à chaque frontière.
- Nouvelle dépendance/conflict/SCC pendant l'activité ; adoption explicite d'une
  nouvelle partition ; connaissances invalidées et versions de contexte figées.
- A/B du même travail autorisés en parallèle, indépendance native/fichiers
  démontrée ; R attend leurs livrables ; publication unique de la famille.
- Bulletin R ne débloquant aucune dépendance et ne contaminant ni A/B ni la
  connaissance ; auteur non autorisé, mauvais scope/hash, traces incohérentes.
- Replay du même journal : mêmes décisions dans le même environnement/config.
- Unicode, limites d'octets/enveloppes/lignes, chemins/junctions et profils refusés.

Tester par propriétés/invariants, permutations et injection d'incidents, avec
un oracle qui ne recopie pas simplement l'algorithme testé. Vérifier l'absence
d'appels LLM dans extraction algorithmique, clustering, planification et simulation.

### 17.3 Performance et comparaison

Graphes synthétiques clairsemés de 1 000, 10 000 puis 100 000 nœuds si le budget
le permet ; annoncer aussi E, densité, distribution de degrés, SCC et proportion
sémantifiée. Ne pas cacher une construction quadratique de similarités ou conflits.

Comparer séquentiel, groupes fixes N×M, niveaux avec barrières, FIFO global,
bottom-up événementiel, chemin critique, puis conflits/ressources hétérogènes.
Même jeu de durées, disponibilités, événements et versions pour chaque politique.

Mesurer CPU, mémoire, temps, overhead, métriques §15 et stabilité. Donner les
bornes travail total/capacité/chemin critique **comme bornes**, pas comme mesures.
Conserver commandes, versions, seeds, threads, machine, logs et codes de sortie.
Rapporter les contre-exemples où la sophistication dégrade makespan ou coût.

## 18. Déploiement progressif et gates

**G0 — Préflight approuvé.** Périmètre, fichiers possédés, snapshots d'état sale,
budget/modèles/replis, capacité réelle du pont et absence de collision confirmés.

**G1 — Contrats gelés.** Schémas/fixtures/identité/ownership/publication et
interfaces validés ; aucune dépendance scientifique cachée dans la similarité.

**G2 — Tranche verticale hors ligne.** Snapshot → partition/groupes → plan →
simulateur → validation/commit fixture → déblocage événementiel, sans LLM/IDA.

**G3 — Régimes/enrichissement.** Capacités, PPR/baseline/Leiden, multivue et
reclustering/lineage évalués selon disponibilités ; manque explicite = PARTIAL,
pas « mission complète ». Encodeur facultatif et hiérarchie réelle expérimentale
peuvent rester désactivés avec preuves de fallback et limites documentées.

**G4 — Sûreté et reprise.** Invariants, tests d'incidents, migrations non
destructrices et reprise/replay passent ; revue indépendante et parent effectuées.

**G5 — Shadow.** Le moteur propose partitions/dispatch sans lancer d'agents ni
modifier la file réelle. Comparaison à l'existant et possibilité de retour au
mode historique sans réarmer une mission arrêtée.

**G6 — Intégration native autorisée séparément.** Contrôle inventaire/profils,
bindings, Model.Ref, strict output, permissions positives/négatives, paquet gelé,
reprise et arrêt/readback sur périmètre synthétique ou pilote borné autorisé.
Un GO de lecture ASM ne nécessite pas un nouveau GO à chaque consultation.
Un échec du canary, en revanche, n'autorise pas sa relance automatique.

**G7 — Adoption explicite.** Seulement après bilan et autorisation : activer par
configuration pour de nouvelles missions sans migrer silencieusement anciennes
tâches, connaissances, registres ou campagne battle-static-discovery.

## 19. Livrables et critères de clôture

Livrer dans le dépôt : cartographie de réutilisation et ADR ; contrats/schémas ;
extracteurs graphe/capacités ; algorithmes A/B et constructeur de groupes ; index
et lineage ; planner G1/G2/G3/SCC/priorités ; runtime événementiel durable et
adaptateur public ; validation/commit/reprise ; CLI d'explication/export/replay ;
simulateur, fixtures, tests et benchmarks ; guide d'exploitation et rapport final.

La clôture doit démontrer :

- extraction/normalisation ou limitation native précisément identifiée ;
- graphes, groupes et planning calculables sans LLM, tout nœud possédé ou doté
  d'un statut explicite, ownership séparé du contexte ;
- dépendances correctement orientées, cycles traités, consommateurs débloqués
  seulement après validation/publication requises, sans barrière globale ;
- absence de doubles réservations/commits et conflits actifs selon le graphe
  connu, reprise sûre malgré résultats tardifs et arrêt ambigu ;
- isolation A/B/R, permissions fail-closed, contexte immuable et provenance ;
- enrichissement et nouvelle partition comparables, adoption non destructive ;
- performances mesurées et décisions explicables/rejouables ;
- non-régression du harnais et du pont, codes de sortie et preuves relus par le lead.

Ne pas terminer, après GO, sur une simple architecture : implémenter et vérifier
le maximum réalisable. Mais ne pas transformer une indisponibilité IDA, un
adaptateur non testé, une API seulement simulée ou un benchmark théorique en PASS.
Le rapport distingue **implémenté**, **vérifié hors ligne**, **vérifié natif**,
**expérimental**, **bloqué** et **hors périmètre**, ainsi que les autorisations
restantes. Aucune modification de l'historique d'échec.

## 20. Connaissance, recherche et handoff

Racine source commune : `retro-eng`, contenant `re-ff8` et
`FinalFantasy_VIII_Reimaginated`. GrepAI/Serena rattachés à ce parent sont valides ;
ne pas reconfigurer leur activation partagée. Worktrees non mergés hors index
canonique : lectures ciblées/connexion distincte autorisée, pas faux diagnostic
d'absence de code. Context Mode pour dumps/logs/benchmarks volumineux.

Connaissance : QMD CLI pour recherche, Obsidian pour synthèse sourcée. Le vault
FF8 est `re-ff8/obsidian-docs`, collection `ff8-wiki` ; vérifier sa racine, ne pas
suivre aveuglément une configuration globale pouvant viser un autre projet.
Les pages récentes ne sont pas nécessairement indexées. Respecter l'interdiction
actuelle de `qmd update`/`embed`, y compris via un wrapper de compilation, sauf
changement explicite de cette directive. Ne jamais annoncer un index rafraîchi
sur la seule écriture de fichiers Markdown.

Préserver preuves brutes, hashes et provenance. Les notes/mémoires sont des
pointeurs de reprise, pas un substitut aux sources natives ni à leurs gates.
Handoff final compact : état des gates, fichiers/versions, commandes et preuves,
risques, tâches encore READY/BLOCKED, autorisations nécessaires et procédure de
reprise sans double exécution. Pas de transcripts massifs ni de secrets.

---

**Principe directeur :** le graphe décrit les relations ; les contrats de
connaissance déterminent les prérequis ; le chemin critique ordonne les priorités ;
les conflits bornent la concurrence ; les ressources déterminent les capacités ;
la validation durable, et non le discours d'un agent, débloque la suite.
