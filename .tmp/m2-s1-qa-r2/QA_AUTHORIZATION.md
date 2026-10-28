# GO QA API S1 indépendante — phase exécutable bornée

Autorité parent rapport48, mission M2/QA reinforced approuvée ; même tâche000a/session fraîche s1-api-qa-r2. Plan public PLAN_PHASE1.md SHA9f5784c025b367b06964941d3e9a6c29ed0fef599710bbc9391e134e81f125f4 approuvé dans sa portée. Pas de produit S1 accepté avant verdict/API preuves ; pas de mission RE/jeu ou test native par ce GO.

## Destination et inputs exacts

Q=`C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/m2-s1-qa-r2`, cwd=`Q/tools/ff8-harness` (substituer Q par son chemin absolu partout). Parent a projeté42produit/support/tooling/1098088octets du candidat47SHA58e8…1610, readback zéroécart, inputs RO. **Aucun des cinq fichiers auteur, fixture/golden/test ou config auteur copié**. Q/projection-receipt.json et preuve parent M/evidence/s1-api-qa-r2-projection.json identifient les sources.

Ne pas modifier ces42inputs, C candidat initial, supports/gels/canonique, parentconfig/runner/reçus/compteurs. Si un défaut produit est trouvé : scénario+clause+preuve au parent, pas de fix produit silencieux dans la QA. Une correction de version sera projetée explicitement et revalidée selon impact.

## Oracle et lectures

Contrat ratifié01–07 et signatures publiques fixent l'attente. Le plan reçu en a fermé les principes/scénarios ; écrire d'abord Q/reports/plan-and-cases.md (clause→entrée→mutation→attente→preuve), en données manuelles indépendantes. Ensuite seulement lire des corps ciblés nécessaires à une preuve ou localisation de défaut, jamais pour aligner l'oracle sur le résultat du SUT. Pas d'autre approbation par ligne de cas requise dans cette matrice déjà acceptée.

Ne pas lire/copier `test/s1-author` dans le candidat initial, ni utiliser prepare/plan/cluster/SCC ou un export du candidat comme attendu/golden. Hashes et références de fixtures propres selon domaines contractuels, comparaison du résultat SUT séparée. Un négatif de join doit atteindre la frontière attendue : nominal valide, hashes non fiables actualisés si nécessaire, sources indépendantes de référence conservées ; rejet précoce ne prouve pas un join plus profond.

Les preuves auteur/numeric/planner/typing déjà acquises sont reçues dans leurs portées, pas rejouées par convenance ; cette QA doit fournir ses propres preuves API utiles, sans taux maximal abstrait ni omission d'une clause obligatoire.

## Écritures autorisées

Sous `Q/tools/ff8-harness/test/s1-qa/` uniquement :
- tests `{wire-run,root-sources,knowledge,fixed-projection,isolation}.test.ts` ;
- fixtures `{manual-base,manual-root,manual-knowledge,manual-context}.ts` dans fixtures/ ;
- oracles `{cases,wire}.ts` dans oracle/.

Plus `Q/tools/ff8-harness/tsconfig.s1-qa.json` et `Q/reports/{plan-and-cases.md,verdict.md}`. Pas de nouveau framework/CLI/driver/DB, fichier source produit ou script de runner. tsconfig.s1-qa étend **./tsconfig.qa-resolution.json** parent, include les11TS QA (et imports transitifs), strict/noEmit/skipLibCheck conservés, sans stub/diagnostic masqué. Pas de node_modules à créer/copier/lier/installer.

`mock.module` Bun existant permis seulement dans isolation.test.ts, processus neuf du runner, avec gardes qui font échouer l'import/l'appel interdit et n'offrent aucune valeur productrice permissive. Aucun mock global dans les autres groupes ou processus enfant lancé par les tests. Pas DB/client/native/réseau réellement évalués. Si une frontière ne peut pas être observée ainsi sans mécanisme nouveau, signaler au parent au lieu de fabriquer une preuve d'absence.

## Commandes et budget

Passage natif en implementation/high proposé AUTORISÉ si requis, dans le catalogue existant, aucune permission forcée/override modèle. Lire cette consigne puis utiliser les commandes **uniquement** via runner parent :

`node "<Q>/run-s1-qa-check.mjs" <wire-run|root-sources|knowledge|fixed-projection|isolation|typecheck> "motif précis"`

cwd absolu Q/tools/ff8-harness, motif8..500caractères sans secret. Runner SHA0b32d0073c3e676d45a01fd21845f7a1ae3acd369d2eb403fd85d128476b0d86, syntaxe vérifiée, zéro contrôle produit avant ce GO. Il fixe Bunpinné/noenv/configvide/concurrence1/timeout10s par test, wall30s par groupe ; typing CLI TS existant absolu wall60s. Environnement fermé, HOME/config/temp possédés frais, aucun option/preload/credential hérité. Logs/reçus/sourcehashs/ledger de cas et version produit conservés automatiquement dans Q/evidence.

Un premier lancement par chacun des six checks, **deux reprises ciblées maximum**, huitinvocations au total/300s cumulé. Le runner refuse un ancien PASS inchangé et bloque sur timeout/signal/erreur outil. Une reprise requiert une correction technique QA ou un changement autorisé identifié, pas un retry pour obtenir vert. Aucun reset de compteur, commande Bun/TS directe ou dépassement implicite. Défaut produit établi : arrêter les reprises du cas pour contourner le défaut, rapporter au parent ; les groupes indépendants prêts peuvent continuer dans le budget.

Aucune commande globale bun test/typecheck/q1, campagne450/9/FULL, SQLite, test native/clientRPC/live/IDA/G5–G7/C#, Git/merge/push/cleanup/configglobal/Docker autorisée. Un refus natif d'outil/édition/exécution se remonte précisément : pas de fallback caché ou réparation globale.

## Livraison

Verdict indépendant lié au candidat exact, clauses/scénarios/conditions, résultats réels, preuves réutilisées, rouges/limites et éventuels bloquants avec scénario reproductible/source/effet. Pas de SKIP compté PASS ou assertion d'acquisition/authentification/préimagebody/publication durable à partir des vues DATA. Pas de surpromesse de pureté par mock permissif.

Pas de clôture000a sur simpleplan ou premier vert. Parent possède acceptation S1/intégration/final M2 ; les oracles QA restent hors du contexte des auteurs concernés. Arrêter lorsque la portée approuvée est prouvée, sans inventer nouveau pipeline de reviewers ou perfectionnements sans risque distinct.

## Composants DATA historiques fournis — rapport49

Lecture autorisée de `Q/inputs/historical-snapshots/{isolates,ff8-self-loop,components-disconnected}.json` et INPUT_MANIFEST.json, copies parentRO exactes/conformesGO (3fichiers/11497octets). Ce sont uniquement des snapshots bruts sans attendu ni fixture/golden auteur, pas un bundle S1qualifié complet. Retenir origines/hashes et vérifier les bytes utilisés dans les fixtures QA. Aucun des42sources produit immuables n'est modifié ; aucun nouvel appel producteur pour remplir le reste de la fixture. Les composants mission/transport/group/planning/root/knowledge restent construits manuellement d'après contrats/données choisies. Budget/runner/allowlist d'écriture inchangés ; ne pas attendre un nominal S1préqualifié inexistant dans les paquets retenus pour tester le nouveau contrat.

## Suite exceptionnelle bornée — rapport50

Après qa05/06/07 rouges de préconditions et7runs/2reprises/2287ms : terminer l'examen statique complet des préconditions publiques avant un autre nominal. Parent autorise le paquet **root-sources corrigé, knowledge initial recevable puis typing final des sources actualisées**, trois invocations au plus à partir de7.

Runner plafond10runs/4reprises désormais, pas8/2 (ancien budget conservé historique), **300s/30s tests/60s typing inchangés** ; tous reçus et compteurs intacts. Pas11e ou contrôle valide inchangé supplémentaire. Si nouveau root nominal encore refusé sans cause établie, arrêter les contrôles dépendants et rendre diagnostic/version/portée partielle au parent, pas relance exploratoire supplémentaire. Knowledge ne peut être déclaré couvert si son bind nominal n'est pas atteint. Aucun assouplissement d'oracle, fixture auteur/producteur, produit modifié ou permission nouvelle.

## Paquet final explicite — rapport53, 27 octobre 2026

Livraison statique52 contrôlée par le parent :11TS+config SHA c47bc48276cfcd098939f95c3b909800d0103dd37434a12a8d6df422ce4d7e0f,42inputs produit inchangés,ledger9runs/4reprises/4255ms. Les reports51/52 ont suspendu l'exécution ; cette section est le nouveau GO borné, sans modification rétrospective des anciens droits/reçus.

Autorisé maintenant : **root-sources → knowledge → isolation → typecheck final**, une seule invocation chacun, livraison statique inchangée. Vérifier la version livrée avant le premier lancement ; aucune édition corrective des fixtures/oracles/produit ou test supplémentaire entre ces invocations. Après un groupe rouge/nominal non atteint, arrêter les groupes runtime suivants ; seul typing final de la même version reste permis pour preuve distincte. Retourner causes/versions/portées exactes, sans nouveau retry ou redéfinition du nominal. Après typing le paquet est clos, même si des places théoriques restent.

Runner parent désormais13runs/7reprises maximum, ordre vérifié depuis le ledger9 ;300s cumulées/30s groupe/60s typing inchangés, aucun compteur effacé. Pas14e/directCLI/autre check renommé. Aucun nouveau reviewer requis pour pouvoir exécuter : QA API indépendante existante et contrôle parent de préparation, L9/L10 distincts.

La garantie ratifiée03:26 actualBodyUTF8<=CunitCourant<=CrootAcquired reste NON PROUVÉE par S scientifique ou caps déclarés ; ne pas simuler une préimage native absente ni revendiquer un waiver. Même des tests verts n'établissent pas seuls cette garantie ou l'acquisition/authentification/CAS/publication durable. S1/M2 non acceptés à ce stade. Aucun nouveau framework, Git/DB/native/live/IDA ou permission supplémentaire.

## Corrections QA précises — rapport54

GO53 clos après qa10root56PASS/1FAIL et qa11typing sixTS2769 ; ledger11/6/8980ms intact. Nouveau GO54 : corriger l'attente N1 hors domaine (source-summands vide refusé par codec qualifié191–192), conserver cette fixture comme négatif explicite et maintenir N1 positif sur les3vrais summands raw déjà construits, avec vérification exacte et nonmutation. Aucun cas supprimé, aucun seuil numeric ou code produit changé. Corriger les six comparaisons/annotations TS2769 sans masquer diagnostic, any/cast permissif, suppression de champ ou assouplissement tsconfig. Aux six comparaisons profondes seulement, expect<unknown>(actual).toEqual(expected) est permis si seule la contrainte générique Bun est en cause ; même assertion runtime, pas preuve DTO statique de l'attendu. Voir rapport54 pour raison/oracles.

Après correction complète et hashes consignés, ordre fermé **typecheck → root-sources → knowledge → isolation**, un run chacun max. Une erreur ferme le paquet, aucun suivant, correctif/retry/directCLI autorisé après ce point. Sources11TS+config identiques entre les quatre contrôles ; typing initial vaut typing final de cette version inchangée. Runner parent15runs/9reprises,300s cumulées/60s typing/30s groupe inchangés, ordre et identité sourceSet vérifiés ; pas16e/reset/groupe renommé. Reports peuvent seulement consigner résultats et causes. Pas de nouvelle review/infra obligatoire ou permission produit/native par cette décision. S1/000a restent non acceptés/non clos jusqu'au jugement parent, limites body natif conservées.
