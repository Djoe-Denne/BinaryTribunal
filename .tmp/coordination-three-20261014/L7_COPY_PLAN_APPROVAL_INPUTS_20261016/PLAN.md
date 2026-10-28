# L7 — PLAN copie/validation P1, à ratifier

## 1. État, provenance et droits

- Auteur : `l7-copy-astra`, implementer fresh **NONBLIND**, sous le lead existant.
- Session : `ses_ebaf6d8c9ffeEq9w6t6V1gxFrE` ; tâche : `task_mvb1jeoy_0011_n4y9u9`, toujours en cours.
- OWN : `C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l7-copy-astra`.
- GO courant : **analyse statique et ce PLAN seulement**. Aucune exécution du candidat, de repro, de test, de typecheck ou de module applicatif n'a été effectuée.
- Paquet : 391 payloads + manifeste, **392/392 pins exacts**, 8 441 428 octets ; manifeste `f882697dbfd4040b5d4f1909b6b2ba529ed80d1f3c46dc839ff8b5959796374b` ; fingerprint receipt `64e49300313ab6bdd3eb70b2413d09f31ebda37efed3f052d95fccf7eb061e21`.
- `PARENT/USER_GO.md` intégralement lu : 4796 octets, `3f8259f151e93b558bc0d2bd50f36a36dd7a27faf1ec1bbaeb7c24257223e94c`. CONFIRMED_BLOCK, repro parent JSON/code, NOTES et métadonnées complètes du manifeste/receipt lus.
- Baseline matérialisée par le parent : `PARENT_BASELINE.json`, `66c8c59fa7bd7e8574f3f1b60b5fecad938a83ef46df036600532cce14f262d4`. **369/369 fichiers ROOT OWN relus et hachés, zéro divergence**. `PARENT_PLAN_GO.json` lu intégralement.
- Source analysée : `tools/ff8-harness/src/simulator.ts`, `6d00cf296cf22378604ea9fc07e155ccf4cb6806186c5d2e63e55fbdbc89716f`, toujours **BLOCK**, pas candidat accepté.
- Recherche : lectures statiques ciblées de ROOT OWN et traitement local par Context Mode. Le manuel Serena indique une connexion au parent canonique `retro-eng`, hors de cette copie ; aucun index/symbole/mémoire de cette autre copie n'a été consulté. Aucun module applicatif n'a été importé.

## 2. Huit ancrages statiques

Les chemins ci-dessous sont relatifs à ROOT OWN ; numéros 1-based de la baseline 6d00.

1. `tools/ff8-harness/src/validation.ts:5–9` : le codec canonique traite les tableaux dans leur ordre et les **clés propres énumérables** des objets, en omettant les valeurs `undefined`. Il ne décrit pas une sérialisation des prototypes/descriptors ni une authentification.
2. `tools/ff8-harness/src/simulator.ts:133–207` : archive v2, empreintes, bijections unités/prérequis, domaines des indexes et projections. Les joins lisent notamment `p.id` par accès ordinaire, alors que les domaines d'index emploient `Object.keys`/`Object.entries`.
3. `tools/ff8-harness/src/simulator.ts:211–218` : `validateSimPlan` décide de l'origine exportée avec `plan.source !== undefined`, puis travaille directement sur l'objet caller. Une copie qui perd `source` peut changer cette classification.
4. `tools/ff8-harness/src/simulator.ts:335–390` : `simPlanFromExport` vérifie des empreintes sur le résultat caller, puis projette et clone ses sous-objets. C'est une seconde frontière vérification/copie à traiter avec le même principe, sans reconstituer les besoins ni les digests opaques.
5. `tools/ff8-harness/src/simulator.ts:598–620` : le constructeur valide `input.plan`, clone ensuite le plan/config/incidents et construit les durées depuis **`input.plan.units`**. La validation et la consommation ne portent pas sur une même image ; les callbacks peuvent encore influencer l'énumération caller.
6. `tools/ff8-harness/src/simulator.ts:926–951` : le besoin original est retrouvé par ID et clé propre. Son absence mène au chemin level-only ; un besoin local absent/altéré sous le bon namespace doit au contraire bloquer uniquement le consommateur, laisser le producteur progresser et ne jamais être remplacé depuis l'archive.
7. `tools/ff8-harness/src/simulator.ts:1085–1151` : `observe` passe par `finalize`, qui appelle `planShape` ; capture/replay effectuent aussi des copies, lectures de durées et empreintes. Ajouter une frontière publique à `planShape` sans adapter ses appels internes introduirait un scan/rehash dans chaque observation.
8. `tools/ff8-harness/test/benchmarks/README.md:207–231` : contrats gelés de projection, manual réellement source-less v1/v2, archive v2, limite de suppression totale d'origine, joins indexés, coût frontière et absence de rehash d'archive en boucle/observation.

**Preuve exécutée disponible : celle du parent uniquement.** Baseline : deux commits ; besoin absent seul : un commit et consommateur BLOCKED/attempts0 ; besoin absent + ID hérité ou non énumérable : deux commits indus sur 6d00. Archive/source intactes ; copie préalable puis validation refuse les deux derniers cas. Les autres cas ci-dessous sont des hypothèses/contrôles statiquement motivés, pas de nouvelles reproductions revendiquées.

## 3. Choix proposé : image détachée qualifiée, puis validation de cette image

### 3.1 Invariant et séparation interne

Une entrée admise doit satisfaire : **la structure, les valeurs et les namespaces validés sont ceux que consomment ensuite le moteur et ses indexes**. Après acquisition, aucune lecture de plan/config/incidents caller ne participe à l'exécution.

Introduire des helpers **privés** dans `simulator.ts` : acquisition/qualification de données, capture de plan/scénario et validation de l'image. Conserver les 33 déclarations publiques de données et leurs versions, ainsi que les signatures et formes de résultats publiques.

- `validateSimPlan(raw)` acquiert une image puis retourne les diagnostics de cette image.
- `SimEngine` acquiert une image une seule fois, appelle directement le validateur interne sur **cette même image**, puis la conserve gelée. Il n'appelle pas le wrapper public qui reclonerait le caller.
- Conserver les validations d'archive/joins existantes sur cette image. Le changement ne se réduit ni à un regex ni à `hasOwn(p, "id")`.

### 3.2 Domaine de transport et fidélité de copie — décision explicite à ratifier

Utiliser `structuredClone`, déjà employé par les API, avec une qualification bornée des **données transférées** avant leur admission :

1. Parcourir leurs descripteurs propres, sans lire de getter. Rejeter les accesseurs propres et les propriétés chaîne non énumérables dans le graphe DTO copié ; seule la propriété intrinsèque `length` des tableaux est exemptée. Les attributs writable/configurable et le fait d'être déjà gelé ne sont pas des motifs de refus.
2. Exiger des tableaux denses avec indices propres ; ne pas utiliser `every` seul pour détecter les trous. Les indices hérités, trous, valeurs `undefined` là où une ligne est requise et lignes nulles ne doivent pas provoquer un TypeError ou disparaître silencieusement.
3. Détecter les cycles du graphe de données avant canonicalisation. Les alias partagés acycliques restent légaux ; mémoriser les objets visités et les chemins nécessaires, plutôt que reparcourir un sous-graphe par prérequis.
4. Capturer une fois les valeurs des descripteurs de données, cloner, puis vérifier linéairement la fidélité de leurs clés propres/valeurs dans l'image. Cette vérification ne recalcule aucun hash. Elle couvre aussi les objets spéciaux dont le clone natif pourrait omettre des propriétés propres ; aucune blacklist globale de prototypes/classes n'est nécessaire.
5. Valider la forme des containers effectivement parcourus avant les joins/itérations : racine, unités, prérequis, G1/G2, sélections/décisions, sous-intents, contextes et données source/archives. Garder les diagnostics existants pour les mutations ordinaires déjà couvertes. Ce garde de parcours n'introduit pas une nouvelle validation globale des besoins locaux qui empêcherait leur producteur de progresser.

Les prototypes ne sont pas des namespaces supplémentaires : un objet à prototype custom mais à champs propres transportables peut être normalisé ; les propriétés héritées ne deviennent jamais des preuves propres. Les objets ordinaires, gelés, réordonnés et à prototype nul restent des positifs. Les champs `undefined` optionnels ne sont pas transformés via JSON ; les nombres ne sont pas normalisés pour rendre une entrée valide.

Ce refus circonscrit concerne le graphe DTO copié, pas tout JavaScript ni tous les prototypes. Il ajoute un refus explicite pour des descriptors hors transport JSON/data, y compris un champ auxiliaire non énumérable dans ce graphe : **ce compromis de compatibilité doit être ratifié avant code**. Les champs inutilisés de l'enveloppe externe `SimScenario` ne sont pas parcourus via un spread général.

### 3.3 Origine fournie et indexes

- Capturer la présence/forme de `source` avant une copie qui pourrait l'effacer. Une `source` héritée, non énumérable ou accesseur reçoit un refus qualifié ; elle ne devient pas manual.
- Une source propre énumérable présente et non `undefined` doit encore être présente dans l'image. `null`, malformée, sans archive ou avec archive v1 suivent les refus existants. L'absence réelle et l'optionnel propre `source: undefined` gardent le chemin manual existant.
- Couvrir toutes les vues : IDs d'unités/prérequis/relations, `unitFingerprints`, `requirementById`, `unresolvedById`, dispensations/receipts, tableaux et leurs indices. Une clé propre cachée d'index ne doit pas être perdue puis interprétée comme absence de besoin.
- Le document d'archive et ses empreintes restent ceux fournis. Pas de rehash correctif, de backfill, d'alias ID, d'inférence de besoin ou de reconstruction de fingerprint WorkUnit depuis son petit descriptor.
- La suppression **totale** d'origine reste la limite ratifiée. La présence détectée avant copie ferme une perte pendant acquisition ; elle ne crée pas de certification d'authenticité.

### 3.4 Scénario, durées et callbacks autorisés

- Capturer une seule fois les champs consommés de l'enveloppe scénario, par descripteurs de données. Qualifier les accesseurs de ces champs comme hors domaine, avec refus contrôlé. Conserver `seed` et les défauts optionnels existants.
- Détacher plan, config et incidents avant d'appeler la fonction de durées. Les validateurs ne doivent pas exécuter cette fonction quand le plan est déjà refusé.
- Les trois API de durées restent légales : objet A/B/R, `Map<string, SimDurations>`, fonction `(unitId) => SimDurations`. La fonction reste une exception intentionnelle au graphe DTO ; elle n'est jamais passée à `structuredClone`.
- Parcourir les IDs de **l'image du plan**, dans l'ordre de ses unités ; acquérir chaque durée une fois par unité, copier/qualifier immédiatement le résultat avant l'appel suivant, puis garder une table privée. Aucune référence mutable de retour n'est conservée. Un callback qui modifie les objets caller ne change ni les unités capturées ni config/incidents.
- Une erreur de callback, durée absente/invalide ou erreur de copie de ses données devient `SimError("invalid_config", ...)`, sans nouvelle valeur de l'union publique. Aucun callback de durées dans les événements, métriques ou observations.
- Pas de promesse d'atomicité d'un programme hostile : les traps Proxy peuvent exécuter du code avant un refus natif ; un callback peut lui-même modifier son environnement. Notre code ne mutera/gèlera pas le caller. Les entrées Proxy non clonables/erreurs de traps sont qualifiées, sans tentative de contournement ou de seconde acquisition permissive.

### 3.5 Autres frontières du même fichier

- **Export** : détacher/qualifier `PlannerResult` avant les contrôles de fingerprints et la projection ; ceux-ci et les copies internes lisent seulement cette image. Préserver la séparation actuelle : ne pas ajouter un refus sémantique global à la fin du convertisseur qui déplacerait les diagnostics attendus de `validateSimPlan`.
- **`planShape` public** : calculer depuis une image de plan et des durées acquises. Les appels internes du moteur passent directement par `shape` sur son état déjà acquis, notamment constructeur et `finalize`. Aucun scan/rehash d'archive ajouté à `observe`.
- **`comparePolicies`** : acquérir les entrées communes avant les variantes de politique, afin que les callbacks ne fabriquent pas des données différentes par politique. Conserver les politiques, defaults de `rolesParallel`, résultats et limites du modèle.
- **Capture** : acquérir les entrées/durées une fois avant le run par défaut et le journal ; ne pas appeler à nouveau le callback pour sérialiser un autre scénario. Conserver l'argument résultat optionnel public : un résultat fourni est une attente de replay, pas une preuve que les entrées correspondent.
- **Replay** : détacher/qualifier le journal avant de contrôler son fingerprint et de convertir son tableau de durées en Map. Refuser les tuples malformés/IDs dupliqués, plutôt que laisser Map en effacer une ligne ; contrôler le trace hash comme auparavant.
- Les clones bornés entre API publiques composées restent au plus un facteur constant à la frontière ; pas de cache global d'autorité ni de flag public permettant de sauter la validation.

### 3.6 Diagnostics

Conserver `plan_non_conformant` pour une entrée plan/export/journal non admissible et `invalid_config` pour les données de configuration/durées. `validateSimPlan` retourne des `SimDiagnostic` stables pour un échec d'acquisition/forme ; le constructeur les porte dans `SimError.detail`.

Prévoir un code diagnostic interne de frontière (par exemple `input_snapshot_non_transportable`) avec chemin et cause bornés : descriptor, tableau troué, cycle, copie impossible ou perte de champ. Ne pas exposer comme détail un objet caller mutable ni une erreur native brute. Les codes actuels `unsupported_prerequisite_provenance`, namespaces/empreintes/projections restent applicables aux mutations ordinaires. Ni nouvelle union publique, ni relâchement des attentes existantes.

## 4. Matrice de vérification proposée — aucun cas exécuté ici

Tous les nouveaux tests iront dans le nouveau fichier autorisé, avec fixtures/helpers existants en lecture seule. Assertions aux API publiques et sur événements/états/commits ; aucune dépendance à un helper privé du correctif.

1. **RED confirmé parent / contrôles obligatoires.** Quatre variantes du même vrai export et archive intacte : baseline deux commits ; besoin local absent seul, producteur commit/consommateur BLOCKED attempts0 ; absence + ID hérité ; absence + ID propre non énumérable. Les deux dernières doivent donner un refus qualifié avant admission, pas COMMITTED. Contraires : copie préalable puis validation ; ID redevenu propre énumérable sans restaurer le besoin => seul consommateur bloqué. Mesurer les diagnostics et les codes SimError, pas un simple « throws ».
2. **Besoin intact/altéré et namespace correct.** Besoin présent intact => deux commits ; absence/hash/champ altérés => producteur indépendant progresse, consommateur sans tentative. Les bytes/hash de source et du caller restent identiques ; aucune substitution depuis l'archive. Les nouveaux refus de descriptors ne doivent pas transformer ces mutations data ordinaires en refus global.
3. **Origine présente mais destructivement copiée.** Source non énumérable/héritée/accesseur => refus, archive toujours fournie ; contraires manual v1 et manual v2 véritablement construits sans source, ainsi que optionnel `source: undefined`. Source propre null/malformée/v1/archive absente => refus existant. Ne pas présenter ces variantes comme suppression totale d'origine.
4. **Namespaces et dictionnaires.** Propriétés cachées/perdues dans les IDs de source/document/projection et dans chaque famille d'index ; tableaux permutés et indexes à prototype nul comme positifs. Conserver own-only, bijections, multiplicité et digests opaques. Des cas voisins peuvent déjà être refusés par 6d00 : ils sont des contrôles, pas des RED artificiels ni de nouveaux défauts confirmés.
5. **Tableaux/forme.** Trou/indice hérité ou non énumérable/ligne null dans unités, prérequis, source, sélections et sous-intents => diagnostic qualifié avant itération dangereuse. Contraire tableau dense propre, y compris vide là où légal. Tester un alias partagé acyclique et une boucle : copie indépendante pour le premier, refus borné pour la seconde.
6. **Accessors/copie.** Getter d'ID, getter retournant un index, getter de source, getter qui lancerait ou changerait une valeur : refus sans invocation du getter pour les DTO ordinaires. Contraire même valeur fournie en data descriptor. Proxy/valeur non clonable : SimError/diagnostic qualifié, jamais DataCloneError/TypeError brut ; aucun retry de capture. Ne pas revendiquer la détection portable de tout Proxy ni l'atomicité de code hostile.
7. **Objets légaux.** Export gelé et clone JSON data, objets à prototype nul, prototype custom sans champ consommé hérité, ordre de propriétés différent, options `undefined`, allocations connues/inconnues, contexte UTF-8 exact. Un éventuel objet dont le clone perd un champ propre doit être refusé par fidélité, sans blacklist de classes.
8. **Callbacks/données caller.** Durées objet/Map/fonction équivalentes => mêmes traces/métriques. Fonction appelée exactement une fois par unité capturée ; mutation de `caller.plan.units`, config/incidents et réutilisation d'un même objet de retour ne modifient pas une image déjà acquise. Une erreur/durée invalide donne `invalid_config`. `observe` répété et continuation ne rappellent pas le callback. Vérifier que ni freeze ni écriture du correctif ne touchent le caller.
9. **Frontières publiques composées.** Export : fingerprint réel incorrect reste refusé ; données ordinaires conservent la projection. `planShape` et comparaison sur durées équivalentes restent déterministes. Capture/replay sur fonction déterministe réutilise la même acquisition, journal JSON round-trip stable, corruption de fingerprint/tuples => refus. Comparer observation intercalée et exécution ininterrompue.
10. **Garde temporelle et modèle.** Réutiliser les **100 anciens + 31 nouveaux** byte-exacts sous une liste de commandes autorisée par le parent : HARD monotone et priorité sur adoption, génération courante éligible/admission future interdite, retries légaux, FIFO, G2 multiholders, releases réellement observées, resources v2, pauses, occupations/waits/métriques. Ajouter seulement un contrôle public composé borné si nécessaire pour montrer que la nouvelle acquisition ne perturbe pas ces événements. L'ancien oracle reviewer cancel/FIFO qualifié n'est pas un défaut source à « corriger ».

RED minimal obligatoire : les contre-exemples parent sur 6d00, avec leurs positifs/négatifs voisins. Les autres lignes vérifient le domaine, la compatibilité et l'absence de régression ; leur statut pré-correctif sera noté honnêtement, sans exiger qu'elles soient toutes rouges.

## 5. Coût, compatibilité et risques

- Nouveau travail frontière : parcours de descriptors + clone + contrôle de fidélité/forme, puis joins existants. Avec D = taille du document réellement sérialisable (archives incluses), U unités, P prérequis et C appartenances/contextes, coût ajouté **O(D + U + P + C)** et mémoire O(D + U + P + C). Indexer les visites/joins ; aucun scan complet par arête/unité. La normalisation des durées ajoute U acquisitions et leurs petits résultats ; le coût du callback utilisateur n'est pas borné par le simulateur.
- La canonicalisation existante trie les clés : son coût de tri demeure explicite, hors nouvelle promesse de parcours linéaire. Les alias peuvent agrandir le document sérialisé ; D désigne ce document, pas seulement le nombre d'objets JS distincts. Aucun benchmark/scaling nouveau n'est revendiqué.
- Aucun contrôle frontière, hash d'archive ni callback n'est ajouté à la boucle d'événements ou à l'observation ; les parcours de métriques déjà présents restent ceux existants. Une API publique appelée séparément a sa propre frontière.
- Compromis : refus nouveau de descriptors non transportables, qualification d'erreurs auparavant natives, acquisition unique des callbacks par scénario. La forme publique reste identique ; la ratification doit approuver ces comportements et le périmètre des wrappers ci-dessus.
- Risque principal de compatibilité : déplacer un refus sémantique trop tôt ou globaliser le besoin local absent. Les contrôles producteur/consommateur et les 131 anciens sont prioritaires. Autre risque : ajouter des copies/hashes dans `finalize` via `planShape` ; les appels internes devront rester privés sur l'image acquise.
- Sources/archives qui sont volontairement entièrement remplacées, codehost hostile modifiant les intrinsics, et authenticité native restent hors de cette preuve. Aucun auto-rétablissement d'une origine absente.

## 6. Ownership exact et gates demandées

Après ratification et permissions distinctes, seulement :

1. `OWN/tools/ff8-harness/src/simulator.ts`.
2. **Nouveau** `OWN/tools/ff8-harness/test/simulator/simulator-copy-boundary-regressions.test.ts`.

Le seul write de l'étape présente est `OWN/.tmp/L7_COPY_BOUNDARY_20261016/PLAN.md`. Les 100 anciens + 31 nouveaux tests, helpers, README benchmark `5ed73b73b6393cd8990a5bcdc18a56214d5e83204474f06378faff4b26779e9e`, 33 DTO, validation/config/Store/L1–L6/L8/registre et inputs restent readonly. Aucune extension de README/DTO n'est proposée ; si les comportements ratifiés en nécessitent une, arrêt et décision parent **avant** une telle écriture.

Ordre demandé :

1. Ratifier design, domaine/refus, callbacks et wrappers ; ou demander une révision de ce PLAN.
2. GO séparé RED public mémoire + écriture/exécution du **nouveau test uniquement**, toujours sur la source 6d00, avec permissions et chemins de preuves explicites.
3. GO séparé source après RED qualifié ; aucune baisse des assertions des 131 existants.
4. Gates explicites typecheck et suite ciblée 100+31+nouveaux, contrôles de hashes/33 DTO et gel du candidat par le parent. Pas de commande globale `bun test test/simulator` implicite : ce répertoire contient aussi des tests interop/SQLite hors de la présente permission.
5. Review Sol/max fresh et gates parent, sans réactivation de l'ancien reviewer. Full/100k/SQLite/native/intégration exigent leurs propres GO.

**HOLD après remise de ce PLAN.** Aucun code/test/probe ni Git/commit/install/réseau/LLM/sous-agent/inbox/autre copie. Ce PLAN et son ACK ne clôturent ni cette tâche corrective ni L7 global, L8, interop, régime B, simCLI, L9/L10 ou la validation scientifique.
